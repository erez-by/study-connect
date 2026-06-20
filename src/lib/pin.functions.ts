import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function hashPin(userId: string, pin: string): string {
  return createHash("sha256").update(`${userId}:${pin}:study-buddy-pin-v1`).digest("hex");
}

const pinSchema = z.object({ pin: z.string().regex(/^\d{4}$/, "PIN must be 4 digits") });

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  pin: z.string().regex(/^\d{4}$/, "PIN must be 4 digits"),
});

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export const getPinStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("user_pins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    return { hasPin: !!data };
  });

export const setPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => pinSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const pin_hash = hashPin(userId, data.pin);
    const { error } = await supabase
      .from("user_pins")
      .upsert({ user_id: userId, pin_hash }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const verifyPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => pinSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("user_pins")
      .select("pin_hash")
      .eq("user_id", userId)
      .maybeSingle();
    if (!row) return { valid: false, noPin: true };
    return { valid: row.pin_hash === hashPin(userId, data.pin), noPin: false };
  });

/**
 * PIN-only login: no magic link. Looks up the account by email, verifies the
 * PIN with brute-force lockout, then mints a one-time token the client uses to
 * establish a session via supabase.auth.verifyOtp.
 */
export const loginWithPin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.trim().toLowerCase();

    // Find the account by email.
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!profile) {
      return { status: "not_found" as const };
    }

    const userId = profile.id;
    const { data: pinRow } = await supabaseAdmin
      .from("user_pins")
      .select("pin_hash, failed_attempts, locked_until")
      .eq("user_id", userId)
      .maybeSingle();

    if (!pinRow) {
      // Account exists but onboarding/PIN never finished.
      return { status: "no_pin" as const };
    }

    // Locked out?
    if (pinRow.locked_until && new Date(pinRow.locked_until).getTime() > Date.now()) {
      const minutes = Math.max(
        1,
        Math.ceil((new Date(pinRow.locked_until).getTime() - Date.now()) / 60000),
      );
      return { status: "locked" as const, minutes };
    }

    const valid = pinRow.pin_hash === hashPin(userId, data.pin);

    if (!valid) {
      const attempts = (pinRow.failed_attempts ?? 0) + 1;
      const shouldLock = attempts >= MAX_ATTEMPTS;
      await supabaseAdmin
        .from("user_pins")
        .update({
          failed_attempts: shouldLock ? 0 : attempts,
          locked_until: shouldLock
            ? new Date(Date.now() + LOCK_MINUTES * 60000).toISOString()
            : null,
        })
        .eq("user_id", userId);
      if (shouldLock) {
        return { status: "locked" as const, minutes: LOCK_MINUTES };
      }
      return { status: "invalid" as const, remaining: MAX_ATTEMPTS - attempts };
    }

    // Success — reset counters and mint a one-time login token.
    await supabaseAdmin
      .from("user_pins")
      .update({ failed_attempts: 0, locked_until: null })
      .eq("user_id", userId);

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      throw new Error("Could not start session. Please try again.");
    }

    return { status: "ok" as const, tokenHash: linkData.properties.hashed_token };
  });
