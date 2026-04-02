
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role_label text DEFAULT '',
ADD COLUMN IF NOT EXISTS badge_initials text DEFAULT '';
