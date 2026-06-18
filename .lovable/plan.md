# Study Buddy — Build Plan

A university-specific (Ben-Gurion University) web app where students find study partners, post their daily free hours, browse an availability "billboard," chat to coordinate, and rate sessions afterward.

## Design Direction
- **Vibe:** Energetic, friendly college aesthetic. Rounded everything, soft shadows, playful but clean.
- **Color:** Bright energetic orange as primary (buttons, accents), warm peach/cream tints for surfaces and highlights, deep charcoal text. Defined as semantic tokens in `src/styles.css` (Tailwind v4 `@theme`) — no hardcoded colors in components. Light theme first.
- **Type:** Poppins for headings (friendly, rounded), Inter for body. Loaded via `<link>` in `__root.tsx` head.
- **Trust cues:** Circular avatars, gold star ratings, colorful generated fallback avatars when no photo.
- **Motion:** Subtle card hover lift, modal fade/scale, availability blocks animate on select. Framer Motion for the hero/onboarding moments only.

## Backend (Lovable Cloud)
Enable Cloud, then create tables with RLS + grants.

- **`profiles`** — `id` (→ auth.users), `email`, `first_name`, `last_initial`, `gender`, `degree`, `year_of_study`, `avatar_url`, `bio`, `average_rating` (float, default 0), `total_reviews` (int, default 0), `created_at`. RLS: anyone authenticated can read; user can update only their own row.
- **`daily_availability`** — `id`, `user_id`, `date`, `available_hours` (text[] of `"08:00"`…`"21:00"`), `subject`, `study_style`, `optional_note`, `created_at`. Unique on (`user_id`, `date`). RLS: authenticated read all; user writes only their own.
- **`messages`** — `id`, `sender_id`, `receiver_id`, `content`, `created_at`. RLS: a user can read/insert only rows where they are sender or receiver.
- **`reviews`** — `id`, `reviewer_id`, `reviewed_user_id`, `stars` (1–5), `created_at`. Unique on (`reviewer_id`, `reviewed_user_id`, day). RLS: authenticated read; user inserts only as themselves, cannot review self. A trigger recomputes `average_rating`/`total_reviews` on the target profile.
- **Storage bucket** `avatars` for profile photos (user-scoped write, public read).

"Available today" = `daily_availability` rows where `date = today`. No cron needed — availability simply isn't queried after its date passes. Weekly chat cleanup deferred (noted as future) since it needs scheduling.

## Authentication & Onboarding
**Flow:** Magic link first, then PIN.
1. Email entry screen. **Strict domain validation** (client + a server check): only `@post.bgu.ac.il` allowed; clear error otherwise.
2. Send Supabase magic link (`emailRedirectTo` = app origin).
3. On return, user is signed in. If no PIN set → **PIN setup** screen (choose 4-digit PIN). PIN is hashed and stored server-side (in a `user_pins` table, hash only — never plaintext); used as a quick re-auth/lock on the same device on top of the existing Supabase session. (Honest note: PIN is a convenience lock layered on the magic-link session, not a replacement for it.)
4. First-time users → profile setup; returning users with a profile → dashboard.
- Email/password and Google SSO listed as future roadmap (UI hint only).

**Profile setup:** First name, last initial, gender, degree/program, year of study, avatar upload (strongly encouraged copy + colorful default fallback), short bio.

**Routing:** `_authenticated/` layout (Cloud-managed gate) wraps dashboard, profile, chat, availability. Public routes: `/auth`, magic-link callback.

## Daily Availability Flow
- **First-login-of-the-day modal:** On first authenticated load each day with no `daily_availability` row for today, open a day-planner modal automatically (also reachable via a "Set today's availability" button).
- **Planner UI:** Mobile/touch-optimized vertical timeline, **8:00 → 22:00 in 1-hour blocks**. Tap to toggle a block free/busy; drag to select a range. Plus inputs for **subject**, **study style**, and optional note.
- **Persistence:** Upserts the row for `date = today`. Resets naturally at midnight (next day = new row).

## Dashboard & Billboard
- Grid/list of cards for students available **today**.
- **Card:** circular avatar, First name + last initial, degree, star rating, available hours (chips), subject, study-style badge, prominent orange **Message** button. Rounded corners, drop shadow, hover lift.
- **Filters:**
  - Subject — searchable dropdown with "All".
  - Study style — multi-select chips, each with an icon: *Help with the material*, *Brainstorming*, *Quiet companion*, *Chill study*.
- Empty state encourages setting your own availability.

## Profiles & Reputation
- Clicking a card opens a detailed profile (modal/page): photo, name, degree, year, bio, average rating + review count, today's availability, Message button.
- **Ratings:** 1–5 stars, written via `reviews`; average shown on profile + card.
- **Rate prompt:** After a user has started a chat with someone, show a "How was your session with X?" rating popup later that day (between ~1 hour after first contact and 20:00). Lightweight client-side check on login/dashboard load against chat + review history.

## Chat
- Text-only message log between two users. **Polling** (refetch every few seconds) — no realtime WebSockets for MVP.
- Open from a profile/card "Message" button; conversation list + thread view.
- **Safety:** Report and Block actions inside the chat (block hides the user and prevents further messages; report stored for moderation).

## Technical Notes
- Stack: TanStack Start + React + Tailwind v4 + shadcn/ui + Lovable Cloud (Supabase).
- All DB access via `createServerFn` (authenticated middleware) or the browser client with RLS — no service-role in client paths. Data reads use TanStack Query.
- Domain restriction enforced both client-side and in a server function before profile creation.
- Inputs validated with Zod (email, PIN, bio length, star range).
- Real backend from the start; billboard is empty until students sign up and post availability.

## Build Order
1. Enable Cloud; create schema, RLS, grants, storage, rating trigger.
2. Design tokens + fonts + base layout/nav.
3. Auth: email entry + domain gate → magic link → PIN setup → callback routing.
4. Profile setup + avatar upload.
5. Availability planner + first-of-day modal.
6. Billboard + filters + cards.
7. Profile detail + rating system + rate prompt.
8. Chat (polling) + report/block.

## Deferred (future roadmap)
Google SSO, email/password login, weekly automated chat cleanup, 30-min granularity.
