-- Feature 1: Meetup confirmation gate for ratings
CREATE TABLE public.meetup_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, partner_id),
  CONSTRAINT meetup_no_self CHECK (user_id <> partner_id)
);

GRANT SELECT, INSERT, DELETE ON public.meetup_confirmations TO authenticated;
GRANT ALL ON public.meetup_confirmations TO service_role;

ALTER TABLE public.meetup_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can confirm their own meetups"
ON public.meetup_confirmations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view confirmations involving them"
ON public.meetup_confirmations FOR SELECT TO authenticated
USING (auth.uid() = user_id OR auth.uid() = partner_id);

CREATE POLICY "Users can remove their own confirmation"
ON public.meetup_confirmations FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Helper: are two users mutually confirmed as having met?
CREATE OR REPLACE FUNCTION public.is_meetup_mutual(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.meetup_confirmations WHERE user_id = _a AND partner_id = _b)
     AND EXISTS (SELECT 1 FROM public.meetup_confirmations WHERE user_id = _b AND partner_id = _a)
$$;

-- Enforce the gate: a review can only be left after a mutual meetup confirmation.
CREATE OR REPLACE FUNCTION public.enforce_meetup_before_review()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_meetup_mutual(NEW.reviewer_id, NEW.reviewed_user_id) THEN
    RAISE EXCEPTION 'Both users must confirm the meetup before rating';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_meetup_before_review
BEFORE INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.enforce_meetup_before_review();