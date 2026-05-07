-- Promover work_email já capturado em versões antigas para o campo email principal,
-- movendo o email atual (genérico) para custom_fields.personal_email.
-- Só atua quando o email atual é de provedor genérico, preservando casos onde
-- o email principal já é corporativo.

UPDATE public.leads
SET 
  custom_fields = jsonb_set(
    COALESCE(custom_fields, '{}'::jsonb),
    '{personal_email}',
    to_jsonb(email)
  ),
  email = work_email
WHERE origem ILIKE '%meta%'
  AND work_email IS NOT NULL
  AND btrim(work_email) <> ''
  AND lower(work_email) <> lower(email)
  AND split_part(lower(email), '@', 2) IN (
    'gmail.com','googlemail.com','hotmail.com','outlook.com','outlook.com.br',
    'yahoo.com','yahoo.com.br','live.com','icloud.com','aol.com','me.com',
    'hotmail.com.br','uol.com.br','bol.com.br','terra.com.br','ig.com.br',
    'globo.com','msn.com','yahoo.com.mx','protonmail.com'
  );