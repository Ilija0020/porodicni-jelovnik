import { useState } from 'react';
import { FamilyMember, Recipe, MenuEntry, MealType } from '../types';
import MealCard from '../components/MealCard';
import RecipeModal from '../components/RecipeModal';
import './Dashboard.css';

const DAYS: { key: string; label: string }[] = [
  { key: 'mon', label: 'PON' },
  { key: 'tue', label: 'UTO' },
  { key: 'wed', label: 'SRI' },
  { key: 'thu', label: 'ČET' },
  { key: 'fri', label: 'PET' },
  { key: 'sat', label: 'SUB' },
  { key: 'sun', label: 'NED' },
];

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: '🥣 Doručak',
  lunch: '🍽️ Ručak',
  dinner: '🌙 Večera',
  snack: '🍎 Užina',
};

interface Props {
  family: FamilyMember[];
  recipes: Recipe[];
  menu: MenuEntry[];
  setMenu: (menu: MenuEntry[]) => void;
}

export default function Dashboard({ family, recipes, menu, setMenu }: Props) {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const getRecipe = (recipeId: string) => recipes.find((r) => r.id === recipeId);

  const getMenuEntry = (day: string, meal: MealType) =>
    menu.find((m) => m.day === day && m.mealType === meal);

  const changeRecipe = (day: string, meal: MealType, newRecipeId: string) => {
    setMenu(
      menu.map((m) =>
        m.day === day && m.mealType === meal ? { ...m, recipeId: newRecipeId } : m
      )
    );
  };

  return (
    <div className="dashboard">
      <h2>📅 Nedeljni Jelovnik</h2>

      <div className="week-grid">
        {/* Header row — dani */}
        <div className="grid-corner">Obrok</div>
        {DAYS.map((d) => (
          <div key={d.key} className="day-header">
            {d.label}
          </div>
        ))}

        {/* Redovi za svaki obrok */}
        {(Object.keys(MEAL_LABELS) as MealType[]).map((meal) => (
          <div key={meal} className="meal-row">
            <div className="meal-label">{MEAL_LABELS[meal]}</div>
            {DAYS.map((d) => {
              const entry = getMenuEntry(d.key, meal);
              const recipe = entry ? getRecipe(entry.recipeId) : undefined;
              return (
                <div key={`${d.key}-${meal}`} className="meal-cell">
                  {recipe ? (
                    <MealCard
                      recipe={recipe}
                      recipes={recipes}
                      mealType={meal}
                      onSelect={(r) => changeRecipe(d.key, meal, r.id)}
                      onDetails={() => setSelectedRecipe(recipe)}
                    />
                  ) : (
                    <span className="empty-meal">—</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          family={family}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </div>
  );
}
