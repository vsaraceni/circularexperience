ALTER TABLE public.proposals
  ADD COLUMN author_name text DEFAULT '',
  ADD COLUMN author_phone text DEFAULT '',
  ADD COLUMN author_email text DEFAULT '';