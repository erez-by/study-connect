-- Restrict the profiles table SELECT to the owner only (protects sensitive columns)
DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Public-facing view exposing only non-sensitive profile fields.
-- security_invoker = off so it can read across rows while limiting columns.
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = off) AS
SELECT
  id,
  first_name,
  last_initial,
  degree,
  year_of_study,
  avatar_url,
  bio,
  average_rating,
  total_reviews,
  profile_completed,
  created_at,
  updated_at
FROM public.profiles;

REVOKE ALL ON public.public_profiles FROM anon;
GRANT SELECT ON public.public_profiles TO authenticated;