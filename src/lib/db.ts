import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type Availability = Tables<"daily_availability">;
export type Message = Tables<"messages">;
export type Review = Tables<"reviews">;

/** Local YYYY-MM-DD for "today" (availability resets at local midnight). */
export function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return dateStr(new Date());
}

export function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return dateStr(d);
}

/** Human-friendly label for a date string ("Mon, Jun 23"). */
export function formatDateLabel(iso: string): string {
  const [y, m, day] = iso.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export type DayOption = {
  iso: string;
  /** Short label, e.g. "Mon 23". */
  short: string;
  /** Full weekday, e.g. "Monday". */
  weekday: string;
  isToday: boolean;
};

/** The next `count` days starting today, for per-day availability planning. */
export function upcomingDays(count = 7): DayOption[] {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return {
      iso: dateStr(d),
      short: d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" }),
      weekday: d.toLocaleDateString(undefined, { weekday: "long" }),
      isToday: i === 0,
    };
  });
}

/** Stable conversation key for a pair of users. */
export function conversationKey(a: string, b: string): string {
  return [a, b].sort().join("__");
}

export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    upsert: true,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw error;
  const { data } = await supabase.storage
    .from("avatars")
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  return data?.signedUrl ?? null;
}
