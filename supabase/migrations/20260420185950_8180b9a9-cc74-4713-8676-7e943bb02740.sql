ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS default_title_template text,
  ADD COLUMN IF NOT EXISTS default_scope text,
  ADD COLUMN IF NOT EXISTS default_considerations text;