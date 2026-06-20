import { supabase } from "@/integrations/supabase/client";

export type MeetupState = {
  iConfirmed: boolean;
  theyConfirmed: boolean;
  mutual: boolean;
};

/** Read the mutual meetup-confirmation state between the current user and a partner. */
export async function getMeetupState(me: string, other: string): Promise<MeetupState> {
  const { data } = await supabase
    .from("meetup_confirmations")
    .select("user_id, partner_id")
    .or(
      `and(user_id.eq.${me},partner_id.eq.${other}),and(user_id.eq.${other},partner_id.eq.${me})`,
    );
  const rows = data ?? [];
  const iConfirmed = rows.some((r) => r.user_id === me && r.partner_id === other);
  const theyConfirmed = rows.some((r) => r.user_id === other && r.partner_id === me);
  return { iConfirmed, theyConfirmed, mutual: iConfirmed && theyConfirmed };
}

/** Record that the current user confirms they met the partner (idempotent). */
export async function confirmMeetup(me: string, other: string): Promise<void> {
  const { error } = await supabase
    .from("meetup_confirmations")
    .insert({ user_id: me, partner_id: other });
  // Ignore unique-violation: the user already confirmed.
  if (error && error.code !== "23505") throw error;
}
