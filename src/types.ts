// Tipovi za celu aplikaciju

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type ActivityLevel = 1 | 2 | 3 | 4 | 5;
export type WeightGoal = 'lose' | 'maintain' | 'gain';
export type IngredientCategory = 'meat' | 'vegetables' | 'dairy' | 'grains' | 'spices' | 'fruit' | 'other';
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface FamilyMember {
  id: string;
  name: string;
  gender: 'male' | 'female';
  weightKg: number;
  heightCm: number;
  age: number;
  activityLevel: ActivityLevel;
  goal: WeightGoal;
  dailyCalories: number;
}

export interface Ingredient {
  id: string;
  name: string;
  amountPerServing: number;
  unit: string;
  category: IngredientCategory;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
}

export interface Recipe {
  id: string;
  title: string;
  mealType: MealType;
  prepTimeMin: number;
  difficulty: Difficulty;
  imageUrl?: string;
  youtubeUrl?: string;
  standardCalories: number;
  standardProteinG: number;
  standardCarbsG: number;
  standardFatG: number;
  standardFiberG: number;
  ingredients: Ingredient[];
  steps: RecipeStep[];
}

export interface MenuEntry {
  id: string;
  day: DayOfWeek;
  mealType: MealType;
  recipeId: string;
}

export interface ShoppingItem {
  name: string;
  totalAmount: number;
  unit: string;
  category: IngredientCategory;
}

export interface PersonPortion {
  memberName: string;
  dailyCalories: number;
  mealCalories: number;
  scaleFactor: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  ingredients: { name: string; amount: number; unit: string }[];
}