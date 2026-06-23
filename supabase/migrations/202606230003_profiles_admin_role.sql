-- Profiles and global app roles
-- Global admin is independent from household owner/member roles.

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  app_role TEXT NOT NULL DEFAULT 'user' CHECK (app_role IN ('user', 'admin')),
  is_deactivated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_app_role ON profiles (app_role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles (lower(email));

INSERT INTO profiles (id, email, display_name, app_role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
  CASE WHEN lower(u.email) = 'prekoapp@gmail.com' THEN 'admin' ELSE 'user' END
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  app_role = CASE WHEN lower(EXCLUDED.email) = 'prekoapp@gmail.com' THEN 'admin' ELSE profiles.app_role END,
  updated_at = now();

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, app_role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    CASE WHEN lower(NEW.email) = 'prekoapp@gmail.com' THEN 'admin' ELSE 'user' END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    app_role = CASE WHEN lower(EXCLUDED.email) = 'prekoapp@gmail.com' THEN 'admin' ELSE profiles.app_role END,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.app_role = 'admin'
      AND p.is_deactivated = false
  );
$$;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own basic profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.is_app_admin());

CREATE POLICY "Users can update own basic profile"
ON profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid() AND app_role = (SELECT app_role FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can read all profiles"
ON profiles FOR SELECT TO authenticated
USING (public.is_app_admin());

CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE TO authenticated
USING (public.is_app_admin())
WITH CHECK (public.is_app_admin());

GRANT EXECUTE ON FUNCTION public.is_app_admin() TO authenticated;
