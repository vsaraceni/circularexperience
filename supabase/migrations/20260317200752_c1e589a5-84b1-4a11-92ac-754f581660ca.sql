
ALTER TABLE public.proposals ALTER COLUMN status SET DEFAULT 'rascunho';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cargo text DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone text DEFAULT '';
