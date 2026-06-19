## Goal

Three changes to Study Buddy:
1. Require Terms of Service acceptance when signing up, with a clause about reports being reviewed and potentially escalated to university authorities.
2. Ensure the app is called **Study Buddy** everywhere.
3. Make sure users can block or report someone from chat.

## What I found

- The codebase already uses "Study Buddy" in UI strings. There is **no "Study Connect" text in the app code** — the most likely place it still appears is the magic-link **sign-in email** (sender name / template) configured in the backend. I'll audit that and any remaining UI/meta strings.
- Chat **already has block, unblock, and report** in the conversation header menu (`chat.$userId.tsx`), writing to the `blocks` and `reports` tables. So this is mostly verification + making it more discoverable, not building from scratch.
- Auth is magic-link based, so "sign-up" = the first time a user sends a magic link (auth screen). That's where the ToS checkbox belongs.

## 1. Terms of Service acceptance

**Terms page** (`/terms` route):
- Standard ToS sections: acceptance, eligibility (BGU students with `@post.bgu.ac.il`), account & PIN responsibility, acceptable use, user content, availability/scheduling disclaimer, privacy summary, no warranty, limitation of liability, changes to terms, contact.
- A dedicated, clearly worded **"Reports & Safety"** section stating: if a user is reported, their account and the reported activity may be reviewed by the Study Buddy team, and where warranted (e.g. harassment, threats, academic-integrity violations, or illegal conduct) the matter **may be reported to the relevant university authorities**.
- Styled with the existing design system (Poppins/Inter, orange tokens), readable long-form layout, back link.

**Acceptance at sign-up** (`auth.tsx`, email step):
- Add a required checkbox: "I agree to the Terms of Service" with an inline link to `/terms` (opens in new tab).
- "Send magic link" stays disabled until checked.
- Persist the acceptance so it's auditable: record `accepted_terms_at` on the user's profile when onboarding completes (the first authenticated profile write). The auth screen also notes that signing in confirms agreement.

**A small Terms link** in the footer/onboarding for ongoing access.

## 2. "Study Buddy" everywhere

- Sweep all UI strings, page titles, and meta/OG tags to confirm "Study Buddy" (audit `__root.tsx`, `index.tsx`, `auth.tsx`, `onboarding.tsx`, header, etc.).
- Audit and fix the **authentication email** branding (subject line + sender/display name + body) so the magic-link email says "Study Buddy" — this is the most probable remaining "Study Connect".

## 3. Block / report in chat

- Verify the existing block / unblock / report menu in the chat conversation works end-to-end (writes to `blocks` / `reports`, blocked state hides messaging).
- Improve discoverability if needed (ensure the menu/icon is obvious in the chat header).
- Align the report dialog copy with the ToS clause (reports are reviewed and may be escalated to university authorities).

## Technical details

- **Migration:** add `accepted_terms_at timestamptz` (nullable) to `public.profiles`. No new table needed; existing GRANTs/RLS on `profiles` already let a user update their own row.
- **New route:** `src/routes/terms.tsx` (public), with its own `head()` title/description.
- **Edit `auth.tsx`:** add shadcn `Checkbox` + label/link, gate the submit button, keep magic-link flow intact.
- **Edit `onboarding.tsx`:** set `accepted_terms_at: new Date().toISOString()` in the profile upsert.
- **Auth email branding:** update the email template/sender name via backend auth settings to "Study Buddy".
- No changes to chat business logic unless verification reveals a bug; chat work is verify + copy/discoverability.

## Out of scope

- No changes to the PIN/magic-link auth mechanism itself.
- No new moderation dashboard (reports continue to land in the `reports` table for manual review).
