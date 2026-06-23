-- Indexes for common joins and household-scoped queries
CREATE INDEX IF NOT EXISTS idx_family_members_household_id ON family_members (household_id);
CREATE INDEX IF NOT EXISTS idx_recipes_household_id ON recipes (household_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients (recipe_id);
CREATE INDEX IF NOT EXISTS idx_weekly_menu_household_id ON weekly_menu (household_id);
CREATE INDEX IF NOT EXISTS idx_weekly_menu_recipe_id ON weekly_menu (recipe_id);
CREATE INDEX IF NOT EXISTS idx_weekly_menu_household_day_meal ON weekly_menu (household_id, day, meal_type);
