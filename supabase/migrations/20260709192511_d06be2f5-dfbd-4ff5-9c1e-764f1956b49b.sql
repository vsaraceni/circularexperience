
-- 1. Add approval columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS rejection_reason text;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_approval_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_approval_status_check
  CHECK (approval_status IN ('pending','approved','rejected'));

-- 2. Backfill: any profile already having a role is considered approved
UPDATE public.profiles p
   SET approval_status = 'approved',
       approved_at = COALESCE(approved_at, now())
 WHERE EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id);

-- 3. Update handle_new_user to notify admins
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, approval_status)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'pending')
  ON CONFLICT (id) DO NOTHING;

  BEGIN
    INSERT INTO public.notifications (user_id, type, title, body)
    SELECT DISTINCT ur.user_id, 'new_user_pending',
           'Novo cadastro aguardando aprovação',
           COALESCE(NEW.raw_user_meta_data->>'full_name', '') || ' (' || NEW.email || ')'
    FROM public.user_roles ur
    WHERE ur.role = 'admin';
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user notify failed: % %', SQLERRM, SQLSTATE;
  END;

  RETURN NEW;
END;
$$;

-- 4. Approve/reject RPCs (admin-only)
CREATE OR REPLACE FUNCTION public.approve_user(_user_id uuid, _role app_role, _role_label text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.profiles
     SET approval_status = 'approved',
         approved_at = now(),
         approved_by = auth.uid(),
         rejection_reason = NULL,
         role_label = COALESCE(NULLIF(_role_label, ''), role_label)
   WHERE id = _user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_user(_user_id uuid, _reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _user_id;

  UPDATE public.profiles
     SET approval_status = 'rejected',
         rejection_reason = _reason,
         approved_by = auth.uid(),
         approved_at = now()
   WHERE id = _user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_user(uuid, app_role, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_user(uuid, text) TO authenticated;

-- 5. Allow admins to read all profiles (for management screen)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));
