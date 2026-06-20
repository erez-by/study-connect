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
