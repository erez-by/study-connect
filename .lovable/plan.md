# Study Buddy — Auth, Availability & Compliance Update

## 1. Start screen: Log in vs Sign up

Today the auth screen only does magic-link sign-in. We split it into two clear paths.

**Sign up (unchanged mechanism):** enter BGU email → magic link → set a 4-digit PIN → registration form. The magic link still verifies the email actually belongs to the student.

**Log in (new — PIN only, no email link):** enter BGU email + your 4-digit PIN → you're in.
- If the email has no account → toast "No account found for this email — please sign up" and switch to the Sign up tab.
- If the account exists but has no PIN yet (signed up but never finished) → prompt them to finish via the sign-up/magic-link path.
- Wrong PIN → "Incorrect PIN" with attempts remaining; after 5 wrong tries the PIN locks for 15 minutes.

The start screen gets a Log in / Sign up toggle at the top of the card. The landing page "Sign in" buttons stay pointing at `/auth`.

> Security note: a 4-digit PIN as the only login credential is weak by nature. To make this safe we add server-side lockout (5 attempts → 15-min lock) and never reveal whether the PIN or the email was wrong beyond the "not found" sign-up hint.

## 2. Availability planner — stepped flow + day-ahead

Rework the planner dialog into two steps:
- **Step 1 — Hours:** a Today / Tomorrow toggle plus the hour grid (8:00–22:00). Pick the day, then tap/drag your free hours. "Next" continues.
- **Step 2 — Details:** subject, study style, and optional note, then "Post my availability". A "Back" button returns to step 1.

Posting for tomorrow writes a separate availability row for tomorrow's date (the data model already allows one row per user per date). Today's billboard keeps showing today only; tomorrow's entry appears automatically when the date rolls over.

## 3. Compliant, accessible registration form

The onboarding form becomes a proper Israeli-regulation-compliant registration form.

Fields:
- First Name (required)
- Last Name (required, full — replaces the current "last initial"; public cards still show only the first-name + last initial for privacy)
- University Email (shown, validated to BGU domain — comes from the verified sign-up)
- Degree / Program (kept as-is), Year of study, Gender, profile photo (kept)
- Short bio with a live character counter (kept)

Compliance checkboxes above the submit button (none pre-checked):
- **Required:** "I have read and agree to the Terms of Use and Privacy Policy regarding the storage and processing of my data." Submission is blocked until checked.
- **Optional (Spam Law):** "I agree to receive promotional updates and future invites via email." Stored as a marketing-consent flag.

Accessibility (IS 5568 / WCAG 2.1 AA), English with RTL-ready markup:
- Semantic `<form>` / `<fieldset>` / `<legend>` / `<label>`, every input visibly labelled.
- `aria-required` on mandatory fields, `aria-invalid` + `aria-describedby` wired to inline error messages.
- Visible keyboard `:focus` states; full Tab navigation.
- Design-token colors only (already AA-contrast).
- `dir`-aware layout so a future Hebrew version flips correctly.

## 4. Footer + legal pages

Add a shared footer (on auth, registration, and legal pages) with links to **Terms of Use**, **Privacy Policy**, and **Accessibility Statement (הצהרת נגישות)**. Create `/privacy` and `/accessibility` pages styled like the existing `/terms` page.

## 5. Verification email → "Study Buddy"

The magic-link email still shows default Lovable branding ("Study Connect") because no branded email templates exist yet. Fixing this requires an email sender domain. After the domain is set, branded auth email templates are scaffolded so the magic-link/sign-up email reads "Study Buddy" in the subject, sender, and body, matching the app's orange theme.

This step needs you to complete the email domain setup dialog first; the rest activates automatically once DNS verifies.

---

## Technical details

**Database migration (`profiles`):** add `last_name text`, `marketing_opt_in boolean not null default false`. `accepted_terms_at` already exists.

**Database migration (`user_pins`):** add `failed_attempts int not null default 0` and `locked_until timestamptz` for lockout.

**New server function `loginWithPin` (`src/lib/pin.functions.ts`):** unauthenticated `createServerFn`. Looks up the profile by email → if none, return `{ notFound: true }`. Reads `user_pins`; if locked, return lock info. Verifies `sha256(userId:pin:salt)`; on failure increment attempts (lock at 5). On success reset attempts, use the admin client (`generateLink` type `magiclink`) and return the `token_hash`. The client calls `supabase.auth.verifyOtp({ type: 'magiclink', token_hash })` to establish the session, sets `sb_unlocked`, and routes onward. Admin client is imported inside the handler.

**`src/routes/auth.tsx`:** add a Log in / Sign up segmented control; add `pin-login` step (email + PinPad) for the login path; keep existing email→magic-link→pin-setup for sign-up. Add the shared footer.

**`src/components/AvailabilityPlanner.tsx`:** add `step` state and a `selectedDate` (today/tomorrow) toggle; fetch existing availability for the chosen date; gate "Post" behind step 2.

**`src/routes/_authenticated/onboarding.tsx`:** add Last Name, the two compliance checkboxes (with exact wording, required + optional), full ARIA wiring, semantic fieldsets; persist `last_name`, `last_initial` (derived), `marketing_opt_in`, `accepted_terms_at`.

**New files:** `src/routes/privacy.tsx`, `src/routes/accessibility.tsx`, `src/components/LegalFooter.tsx`.

**Email:** open the email-domain setup dialog, then scaffold branded auth email templates and theme them.

## Out of scope
- No change to the magic-link mechanism for sign-up (still used to verify email ownership).
- Public-facing student cards keep showing only first name + last initial.
- No full Hebrew localization (markup is RTL-ready only).
