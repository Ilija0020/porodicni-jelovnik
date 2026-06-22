-- Kreiraj tabele za Porodični Jelovnik

CREATE TABLE IF NOT EXISTS household (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT DEFAULT 'Porodica',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS family_members (
  id TEXT PRIMARY KEY,
  household_id UUID REFERENCES household(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  weight_kg DOUBLE PRECISION NOT NULL,
  height_cm DOUBLE PRECISION NOT NULL,
  age INTEGER NOT NULL,
  activity_level INTEGER NOT NULL,
  goal INTEGER NOT NULL DEFAULT 0,
  daily_calories INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  household_id UUID REFERENCES household(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  prep_time_min INTEGER NOT NULL,
  difficulty TEXT NOT NULL,
  standard_calories INTEGER NOT NULL,
  standard_protein_g DOUBLE PRECISION NOT NULL,
  standard_carbs_g DOUBLE PRECISION NOT NULL,
  standard_fat_g DOUBLE PRECISION NOT NULL,
  standard_fiber_g DOUBLE PRECISION NOT NULL,
  image_url TEXT,
  youtube_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id TEXT PRIMARY KEY,
  recipe_id TEXT REFERENCES recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount_per_serving DOUBLE PRECISION NOT NULL,
  unit TEXT NOT NULL,
  category TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recipe_steps (
  recipe_id TEXT REFERENCES recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  instruction TEXT NOT NULL,
  PRIMARY KEY (recipe_id, step_number)
);

CREATE TABLE IF NOT EXISTS weekly_menu (
  id TEXT PRIMARY KEY,
  household_id UUID REFERENCES household(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  recipe_id TEXT REFERENCES recipes(id) ON DELETE CASCADE
);

-- Row Level Security (samo ulogovani korisnici)
ALTER TABLE household ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_menu ENABLE ROW LEVEL SECURITY;

-- Politike: svi ulogovani vide i menjaju sve
CREATE POLICY "All access" ON household FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "All access" ON family_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "All access" ON recipes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "All access" ON recipe_ingredients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "All access" ON recipe_steps FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "All access" ON weekly_menu FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ubaci početni household (potreban za referencu)
INSERT INTO household (id, name) VALUES (gen_random_uuid(), 'Porodica');