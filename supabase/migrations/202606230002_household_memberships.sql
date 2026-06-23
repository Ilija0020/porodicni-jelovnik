-- Household membership and invitation model
-- Cilj: svaki prijavljeni korisnik pripada jednom domaćinstvu; više korisnika mogu deliti isti jelovnik preko invite koda.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE household
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invite_code TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

UPDATE household
SET invite_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
WHERE invite_code IS NULL;

ALTER TABLE household
  ALTER COLUMN invite_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_household_invite_code ON household (invite_code);

CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES household(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (household_id, user_id),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON household_members (household_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON household_members (user_id);

CREATE OR REPLACE FUNCTION public.generate_household_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
BEGIN
  LOOP
    code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.household WHERE invite_code = code);
  END LOOP;
  RETURN code;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_household_member(target_household_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.household_id = target_household_id
      AND hm.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_household_owner(target_household_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.household_id = target_household_id
      AND hm.user_id = auth.uid()
      AND hm.role = 'owner'
  );
$$;

CREATE OR REPLACE FUNCTION public.create_household_for_current_user(household_name TEXT DEFAULT 'Moja porodica')
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_household_id UUID;
  new_household_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Korisnik mora biti prijavljen';
  END IF;

  SELECT household_id INTO existing_household_id
  FROM public.household_members
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF existing_household_id IS NOT NULL THEN
    RETURN existing_household_id;
  END IF;

  INSERT INTO public.household (name, created_by, invite_code)
  VALUES (COALESCE(NULLIF(trim(household_name), ''), 'Moja porodica'), auth.uid(), public.generate_household_invite_code())
  RETURNING id INTO new_household_id;

  INSERT INTO public.household_members (household_id, user_id, email, role)
  VALUES (new_household_id, auth.uid(), auth.email(), 'owner');

  RETURN new_household_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_household_by_invite_code(invite_code_input TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_household_id UUID;
  target_household_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Korisnik mora biti prijavljen';
  END IF;

  SELECT household_id INTO existing_household_id
  FROM public.household_members
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF existing_household_id IS NOT NULL THEN
    RETURN existing_household_id;
  END IF;

  SELECT id INTO target_household_id
  FROM public.household
  WHERE invite_code = upper(trim(invite_code_input))
  LIMIT 1;

  IF target_household_id IS NULL THEN
    RAISE EXCEPTION 'Neispravan porodični kod';
  END IF;

  INSERT INTO public.household_members (household_id, user_id, email, role)
  VALUES (target_household_id, auth.uid(), auth.email(), 'member');

  RETURN target_household_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_or_create_household(invite_code_input TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_household_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Korisnik mora biti prijavljen';
  END IF;

  SELECT household_id INTO existing_household_id
  FROM public.household_members
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF existing_household_id IS NOT NULL THEN
    RETURN existing_household_id;
  END IF;

  IF invite_code_input IS NOT NULL AND trim(invite_code_input) <> '' THEN
    RETURN public.join_household_by_invite_code(invite_code_input);
  END IF;

  RETURN public.create_household_for_current_user('Moja porodica');
END;
$$;

ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All access" ON household;
DROP POLICY IF EXISTS "All access" ON family_members;
DROP POLICY IF EXISTS "All access" ON recipes;
DROP POLICY IF EXISTS "All access" ON recipe_ingredients;
DROP POLICY IF EXISTS "All access" ON recipe_steps;
DROP POLICY IF EXISTS "All access" ON weekly_menu;

DROP POLICY IF EXISTS "Household members can read household" ON household;
DROP POLICY IF EXISTS "Household owners can update household" ON household;
DROP POLICY IF EXISTS "Household owners can delete household" ON household;
DROP POLICY IF EXISTS "Users can read household memberships" ON household_members;
DROP POLICY IF EXISTS "Users can update own membership" ON household_members;
DROP POLICY IF EXISTS "Household members manage family members" ON family_members;
DROP POLICY IF EXISTS "Household members manage recipes" ON recipes;
DROP POLICY IF EXISTS "Household members manage recipe ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "Household members manage recipe steps" ON recipe_steps;
DROP POLICY IF EXISTS "Household members manage weekly menu" ON weekly_menu;

CREATE POLICY "Household members can read household"
ON household FOR SELECT TO authenticated
USING (public.is_household_member(id));

CREATE POLICY "Household owners can update household"
ON household FOR UPDATE TO authenticated
USING (public.is_household_owner(id))
WITH CHECK (public.is_household_owner(id));

CREATE POLICY "Household owners can delete household"
ON household FOR DELETE TO authenticated
USING (public.is_household_owner(id));

CREATE POLICY "Users can read household memberships"
ON household_members FOR SELECT TO authenticated
USING (public.is_household_member(household_id));

CREATE POLICY "Users can update own membership"
ON household_members FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Household members manage family members"
ON family_members FOR ALL TO authenticated
USING (public.is_household_member(household_id))
WITH CHECK (public.is_household_member(household_id));

CREATE POLICY "Household members manage recipes"
ON recipes FOR ALL TO authenticated
USING (public.is_household_member(household_id))
WITH CHECK (public.is_household_member(household_id));

CREATE POLICY "Household members manage recipe ingredients"
ON recipe_ingredients FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = recipe_ingredients.recipe_id
      AND public.is_household_member(r.household_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = recipe_ingredients.recipe_id
      AND public.is_household_member(r.household_id)
  )
);

CREATE POLICY "Household members manage recipe steps"
ON recipe_steps FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = recipe_steps.recipe_id
      AND public.is_household_member(r.household_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = recipe_steps.recipe_id
      AND public.is_household_member(r.household_id)
  )
);

CREATE POLICY "Household members manage weekly menu"
ON weekly_menu FOR ALL TO authenticated
USING (public.is_household_member(household_id))
WITH CHECK (public.is_household_member(household_id));

GRANT EXECUTE ON FUNCTION public.create_household_for_current_user(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_household_by_invite_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_household(TEXT) TO authenticated;
