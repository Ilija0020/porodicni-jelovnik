import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import {
  DayOfWeek,
  Difficulty,
  FamilyMember,
  Ingredient,
  IngredientCategory,
  MealType,
  MenuEntry,
  Recipe,
  RecipeStep,
} from '../types';

type HouseholdRow = { id: string; name: string | null; invite_code: string };

type FamilyMemberRow = {
  id: string;
  household_id: string | null;
  name: string;
  gender: 'male' | 'female';
  weight_kg: number;
  height_cm: number;
  age: number;
  activity_level: number;
  goal: number;
  daily_calories: number;
};

type RecipeRow = {
  id: string;
  household_id: string | null;
  title: string;
  meal_type: string;
  prep_time_min: number;
  difficulty: string;
  standard_calories: number;
  standard_protein_g: number;
  standard_carbs_g: number;
  standard_fat_g: number;
  standard_fiber_g: number;
  image_url: string | null;
  youtube_url: string | null;
  recipe_ingredients?: IngredientRow[];
  recipe_steps?: RecipeStepRow[];
};

type IngredientRow = {
  id: string;
  recipe_id: string;
  name: string;
  amount_per_serving: number;
  unit: string;
  category: string;
};

type RecipeStepRow = {
  recipe_id: string;
  step_number: number;
  instruction: string;
};

type MenuEntryRow = {
  id: string;
  household_id: string | null;
  day: string;
  meal_type: string;
  recipe_id: string;
};

export interface HouseholdContext {
  id: string;
  name: string;
  inviteCode: string;
}

export interface AppData {
  household: HouseholdContext;
  family: FamilyMember[];
  recipes: Recipe[];
  menu: MenuEntry[];
}

const asMealType = (value: string): MealType => value as MealType;
const asDayOfWeek = (value: string): DayOfWeek => value as DayOfWeek;
const asDifficulty = (value: string): Difficulty => value as Difficulty;
const asIngredientCategory = (value: string): IngredientCategory => value as IngredientCategory;

function familyFromRow(row: FamilyMemberRow): FamilyMember {
  return {
    id: row.id,
    name: row.name,
    gender: row.gender,
    weightKg: row.weight_kg,
    heightCm: row.height_cm,
    age: row.age,
    activityLevel: row.activity_level as FamilyMember['activityLevel'],
    goal: row.goal as FamilyMember['goal'],
    dailyCalories: row.daily_calories,
  };
}

function familyToRow(member: FamilyMember, householdId: string): FamilyMemberRow {
  return {
    id: member.id,
    household_id: householdId,
    name: member.name,
    gender: member.gender,
    weight_kg: member.weightKg,
    height_cm: member.heightCm,
    age: member.age,
    activity_level: member.activityLevel,
    goal: member.goal,
    daily_calories: member.dailyCalories,
  };
}

function ingredientFromRow(row: IngredientRow): Ingredient {
  return {
    id: row.id,
    name: row.name,
    amountPerServing: row.amount_per_serving,
    unit: row.unit,
    category: asIngredientCategory(row.category),
  };
}

function ingredientToRow(ingredient: Ingredient, recipeId: string): IngredientRow {
  return {
    id: ingredient.id,
    recipe_id: recipeId,
    name: ingredient.name,
    amount_per_serving: ingredient.amountPerServing,
    unit: ingredient.unit,
    category: ingredient.category,
  };
}

function stepFromRow(row: RecipeStepRow): RecipeStep {
  return {
    stepNumber: row.step_number,
    instruction: row.instruction,
  };
}

function stepToRow(step: RecipeStep, recipeId: string): RecipeStepRow {
  return {
    recipe_id: recipeId,
    step_number: step.stepNumber,
    instruction: step.instruction,
  };
}

function recipeFromRow(row: RecipeRow): Recipe {
  const ingredients = row.recipe_ingredients ?? [];
  const steps = row.recipe_steps ?? [];

  return {
    id: row.id,
    title: row.title,
    mealType: asMealType(row.meal_type),
    prepTimeMin: row.prep_time_min,
    difficulty: asDifficulty(row.difficulty),
    imageUrl: row.image_url ?? undefined,
    youtubeUrl: row.youtube_url ?? undefined,
    standardCalories: row.standard_calories,
    standardProteinG: row.standard_protein_g,
    standardCarbsG: row.standard_carbs_g,
    standardFatG: row.standard_fat_g,
    standardFiberG: row.standard_fiber_g,
    ingredients: ingredients.map(ingredientFromRow),
    steps: steps.sort((a, b) => a.step_number - b.step_number).map(stepFromRow),
  };
}

function recipeToRow(recipe: Recipe, householdId: string): Omit<RecipeRow, 'recipe_ingredients' | 'recipe_steps'> {
  return {
    id: recipe.id,
    household_id: householdId,
    title: recipe.title,
    meal_type: recipe.mealType,
    prep_time_min: recipe.prepTimeMin,
    difficulty: recipe.difficulty,
    standard_calories: recipe.standardCalories,
    standard_protein_g: recipe.standardProteinG,
    standard_carbs_g: recipe.standardCarbsG,
    standard_fat_g: recipe.standardFatG,
    standard_fiber_g: recipe.standardFiberG,
    image_url: recipe.imageUrl ?? null,
    youtube_url: recipe.youtubeUrl ?? null,
  };
}

function menuFromRow(row: MenuEntryRow): MenuEntry {
  return {
    id: row.id,
    day: asDayOfWeek(row.day),
    mealType: asMealType(row.meal_type),
    recipeId: row.recipe_id,
  };
}

function menuToRow(entry: MenuEntry, householdId: string): MenuEntryRow {
  return {
    id: entry.id,
    household_id: householdId,
    day: entry.day,
    meal_type: entry.mealType,
    recipe_id: entry.recipeId,
  };
}

async function deleteMissing(table: 'family_members' | 'recipes' | 'weekly_menu', ids: string[], householdId: string) {
  let query = supabase.from(table).delete().eq('household_id', householdId);
  if (ids.length > 0) query = query.not('id', 'in', `(${ids.join(',')})`);
  const { error } = await query;
  if (error) throw error;
}

function pendingInviteCode(session: Session): string | null {
  const code = session.user.user_metadata?.pendingInviteCode;
  return typeof code === 'string' && code.trim() ? code.trim().toUpperCase() : null;
}

function householdFromRow(row: HouseholdRow): HouseholdContext {
  return {
    id: row.id,
    name: row.name || 'Moja porodica',
    inviteCode: row.invite_code,
  };
}

export const dataService = {
  async ensureHousehold(session: Session) {
    const inviteCode = pendingInviteCode(session);
    const { data: householdId, error } = await supabase.rpc('get_or_create_household', {
      invite_code_input: inviteCode,
    });

    if (error) throw error;
    if (!householdId) throw new Error('Nije moguće pronaći ili napraviti domaćinstvo');

    if (inviteCode) {
      await supabase.auth.updateUser({ data: { pendingInviteCode: null } });
    }

    return householdId as string;
  },

  async getHousehold(householdId: string) {
    const { data, error } = await supabase
      .from('household')
      .select('id,name,invite_code')
      .eq('id', householdId)
      .single<HouseholdRow>();

    if (error) throw error;
    return householdFromRow(data);
  },

  async getAppData(session: Session): Promise<AppData> {
    const householdId = await this.ensureHousehold(session);
    const [household, family, recipes, menu] = await Promise.all([
      this.getHousehold(householdId),
      this.getFamily(householdId),
      this.getRecipes(householdId),
      this.getMenu(householdId),
    ]);

    return { household, family, recipes, menu };
  },

  async getFamily(householdId: string) {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('household_id', householdId)
      .order('name');
    if (error) throw error;
    return (data as FamilyMemberRow[]).map(familyFromRow);
  },

  async syncFamily(family: FamilyMember[], householdId: string) {
    await deleteMissing('family_members', family.map((member) => member.id), householdId);
    if (family.length === 0) return;

    const { error } = await supabase
      .from('family_members')
      .upsert(family.map((member) => familyToRow(member, householdId)));
    if (error) throw error;
  },

  async getRecipes(householdId: string) {
    const { data, error } = await supabase
      .from('recipes')
      .select('*, recipe_ingredients(*), recipe_steps(*)')
      .eq('household_id', householdId)
      .order('title');
    if (error) throw error;
    return (data as RecipeRow[]).map(recipeFromRow);
  },

  async syncRecipes(recipes: Recipe[], householdId: string) {
    await deleteMissing('recipes', recipes.map((recipe) => recipe.id), householdId);
    if (recipes.length === 0) return;

    const { error: recipeError } = await supabase
      .from('recipes')
      .upsert(recipes.map((recipe) => recipeToRow(recipe, householdId)));
    if (recipeError) throw recipeError;

    const recipeIds = recipes.map((recipe) => recipe.id);
    if (recipeIds.length > 0) {
      const { error: ingredientDeleteError } = await supabase
        .from('recipe_ingredients')
        .delete()
        .in('recipe_id', recipeIds);
      if (ingredientDeleteError) throw ingredientDeleteError;

      const { error: stepDeleteError } = await supabase
        .from('recipe_steps')
        .delete()
        .in('recipe_id', recipeIds);
      if (stepDeleteError) throw stepDeleteError;
    }

    const ingredients = recipes.flatMap((recipe) =>
      recipe.ingredients.map((ingredient) => ingredientToRow(ingredient, recipe.id))
    );
    if (ingredients.length > 0) {
      const { error } = await supabase.from('recipe_ingredients').insert(ingredients);
      if (error) throw error;
    }

    const steps = recipes.flatMap((recipe) =>
      recipe.steps.map((step) => stepToRow(step, recipe.id))
    );
    if (steps.length > 0) {
      const { error } = await supabase.from('recipe_steps').insert(steps);
      if (error) throw error;
    }
  },

  async getMenu(householdId: string) {
    const { data, error } = await supabase
      .from('weekly_menu')
      .select('*')
      .eq('household_id', householdId)
      .order('id');
    if (error) throw error;
    return (data as MenuEntryRow[]).map(menuFromRow);
  },

  async syncMenu(menu: MenuEntry[], householdId: string) {
    await deleteMissing('weekly_menu', menu.map((entry) => entry.id), householdId);
    if (menu.length === 0) return;

    const { error } = await supabase
      .from('weekly_menu')
      .upsert(menu.map((entry) => menuToRow(entry, householdId)));
    if (error) throw error;
  },
};
