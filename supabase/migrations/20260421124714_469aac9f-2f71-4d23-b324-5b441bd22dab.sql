ALTER TABLE public.message_templates
  ADD COLUMN product_id uuid NULL REFERENCES public.products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_message_templates_stage_product
  ON public.message_templates (stage, product_id);