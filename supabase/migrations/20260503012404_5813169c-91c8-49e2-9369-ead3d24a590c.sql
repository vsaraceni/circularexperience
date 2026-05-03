-- Phone normalization to E.164, BR-first
CREATE OR REPLACE FUNCTION public.normalize_phone_e164(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  raw text;
  has_plus boolean;
  digits text;
  len int;
BEGIN
  IF input IS NULL THEN RETURN NULL; END IF;
  raw := btrim(input);
  IF raw = '' OR raw = '---' OR raw = '--' THEN RETURN NULL; END IF;

  has_plus := position('+' in raw) > 0 AND left(btrim(raw), 1) = '+';
  digits := regexp_replace(raw, '[^0-9]', '', 'g');
  IF digits = '' THEN RETURN NULL; END IF;

  len := length(digits);

  -- If had +, trust the country code as-is (must be 11..15 digits total)
  IF has_plus THEN
    IF len BETWEEN 11 AND 15 THEN
      RETURN '+' || digits;
    ELSE
      RETURN NULL;
    END IF;
  END IF;

  -- No +: assume Brazil
  -- 12 or 13 digits starting with 55 -> already BR with country code
  IF (len = 12 OR len = 13) AND left(digits, 2) = '55' THEN
    RETURN '+' || digits;
  END IF;

  -- 10 or 11 digits = DDD + number (BR)
  IF len = 10 OR len = 11 THEN
    RETURN '+55' || digits;
  END IF;

  -- 14+ digits and not starting with 55: probably international, accept if 11..15
  IF len BETWEEN 11 AND 15 THEN
    RETURN '+' || digits;
  END IF;

  RETURN NULL;
END;
$$;

-- Trigger to enforce E.164 on leads.telefone
CREATE OR REPLACE FUNCTION public.tg_leads_normalize_phone()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  normalized text;
BEGIN
  IF NEW.telefone IS NULL OR btrim(NEW.telefone) = '' THEN
    NEW.telefone := '';
    RETURN NEW;
  END IF;

  -- Already valid E.164
  IF NEW.telefone ~ '^\+\d{11,15}$' THEN
    RETURN NEW;
  END IF;

  normalized := public.normalize_phone_e164(NEW.telefone);
  IF normalized IS NULL THEN
    -- Keep empty rather than blocking insert; log via NOTICE
    RAISE LOG 'leads.telefone could not be normalized to E.164: %', NEW.telefone;
    NEW.telefone := '';
  ELSE
    NEW.telefone := normalized;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_normalize_phone ON public.leads;
CREATE TRIGGER leads_normalize_phone
  BEFORE INSERT OR UPDATE OF telefone ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_leads_normalize_phone();

-- Backfill existing data
UPDATE public.leads
SET telefone = COALESCE(public.normalize_phone_e164(telefone), '')
WHERE telefone IS NOT NULL
  AND telefone <> ''
  AND telefone !~ '^\+\d{11,15}$';