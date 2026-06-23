import { FamilyMember, PersonPortion, Recipe } from '../types';

// === KALKULATOR KALORIJA ===

const ACTIVITY_MULTIPLIERS: Record<number, number> = {
  1: 1.2,   // sedeći
  2: 1.375, // laka aktivnost
  3: 1.55,  // umerena
  4: 1.725, // aktivna
  5: 1.9,   // ekstremna
};

export const ACTIVITY_LABELS: Record<number, string> = {
  1: 'Sedeći (kancelarija)',
  2: 'Laka (šetnja 1-3x nedeljno)',
  3: 'Umerena (trening 3-5x)',
  4: 'Aktivna (trening 6-7x)',
  5: 'Sportista / fizički posao',
};

export const GOAL_LABELS: Record<string, string> = {
  '-500': 'Mršavljenje (-500 kcal)',
  '-300': 'Blago mršavljenje (-300 kcal)',
  '-200': 'Blago mršavljenje (-200 kcal)',
  '0': 'Održavanje težine',
  '200': 'Blago gojenje (+200 kcal)',
  '300': 'Blago gojenje (+300 kcal)',
  '500': 'Gojenje (+500 kcal)',
};

export const GOAL_ADJUSTMENTS: Record<string, number> = {
  '-500': -500,
  '-300': -300,
  '-200': -200,
  '0': 0,
  '200': 200,
  '300': 300,
  '500': 500,
};

/** Mifflin-St Jeor: Bazalni metabolizam */
export function calculateBMR(member: Omit<FamilyMember, 'id' | 'dailyCalories'>): number {
  const { weightKg, heightCm, age, gender } = member;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

/** Ukupne dnevne kalorije (TDEE) sa prilagođenim ciljem */
export function calculateTDEE(member: FamilyMember | Omit<FamilyMember, 'id' | 'dailyCalories'>): number {
  const tdee = Math.round(calculateBMR(member) * ACTIVITY_MULTIPLIERS[member.activityLevel]);
  const goal = member.goal ?? 0;
  return tdee + (GOAL_ADJUSTMENTS[String(goal)] || 0);
}

// === RASPODELA KALORIJA PO OBROCIMA ===

const MEAL_SPLIT: Record<string, number> = {
  breakfast: 0.30,
  lunch: 0.35,
  dinner: 0.25,
  snack: 0.10,
};

/** Koliko kalorija treba da pokrije dati obrok za datu osobu */
export function mealCaloriesForMember(dailyCalories: number, mealType: string): number {
  return Math.round(dailyCalories * MEAL_SPLIT[mealType]);
}

// === SKALIRANJE GRAMAŽE ===

/** Izračunaj koliko grama sastojaka ide za svakog člana */
export function calculatePortions(
  members: FamilyMember[],
  recipe: Recipe
): PersonPortion[] {
  return members.map((member) => {
    const mealCal = mealCaloriesForMember(member.dailyCalories, recipe.mealType);
    const scaleFactor = recipe.standardCalories > 0
      ? mealCal / recipe.standardCalories
      : 1;

    return {
      memberName: member.name,
      dailyCalories: member.dailyCalories,
      mealCalories: mealCal,
      scaleFactor: Math.round(scaleFactor * 100) / 100,
      proteinG: Math.round(recipe.standardProteinG * scaleFactor * 10) / 10,
      carbsG: Math.round(recipe.standardCarbsG * scaleFactor * 10) / 10,
      fatG: Math.round(recipe.standardFatG * scaleFactor * 10) / 10,
      fiberG: Math.round(recipe.standardFiberG * scaleFactor * 10) / 10,
      ingredients: recipe.ingredients.map((ing) => ({
        name: ing.name,
        amount: Math.round(ing.amountPerServing * scaleFactor * 10) / 10,
        unit: ing.unit,
      })),
    };
  });
}
