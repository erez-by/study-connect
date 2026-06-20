-- Remove the security-definer view (replaced by a proper table split)
DROP VIEW IF EXISTS public.public_profiles;

-- 1) Private profile table (owner-only)
CREATE TABLE public.profiles_private (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  last_name text,
  gender text,
  marketing_opt_in boolean NOT NULL DEFAULT false,
  accepted_terms_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2) Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles_private TO authenticated;
GRANT ALL ON public.profiles_private TO service_role;

-- 3) RLS: owner only
ALTER TABLE public.profiles_private ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own private profile"
ON public.profiles_private FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert own private profile"
ON public.profiles_private FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own private profile"
ON public.profiles_private FOR UPDATE TO authenticated
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 4) updated_at trigger
CREATE TRIGGER update_profiles_private_updated_at
BEFORE UPDATE ON public.profiles_private
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Backfill from existing profiles
INSERT INTO public.profiles_private (id, email, last_name, gender, marketing_opt_in, accepted_terms_at)
SELECT id, email, last_name, gender, marketing_opt_in, accepted_terms_at
FROM public.profiles
ON CONFLICT (id) DO NOTHING;

-- 6) Update new-user handler to populate both tables
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles_private (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- 7) Restore public read on profiles (now safe: no sensitive columns remain)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Authenticated can view profiles"
ON public.profiles FOR SELECT TO authenticated
USING (true);

-- 8) Drop sensitive columns from profiles
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS last_name,
  DROP COLUMN IF EXISTS gender,
  DROP COLUMN IF EXISTS marketing_opt_in,
  DROP COLUMN IF EXISTS accepted_terms_at;