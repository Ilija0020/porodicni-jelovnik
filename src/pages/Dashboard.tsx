import { useState } from 'react';
import { FamilyMember, Recipe, MenuEntry, MealType } from '../types';
import RecipeModal from '../components/RecipeModal';
import './Dashboard.css';

const DAYS = [
  { key: 'mon', label: 'Ponedeljak' },
  { key: 'tue', label: 'Utorak' },
  { key: 'wed', label: 'Sreda' },
  { key: 'thu', label: 'Četvrtak' },
  { key: 'fri', label: 'Petak' },
  { key: 'sat', label: 'Subota' },
  { key: 'sun', label: 'Nedelja' },
];

const MEAL_ICONS: Record<MealType, string> = {
  breakfast: '🥣',
  lunch: '🍽️',
  dinner: '🌙',
  snack: '🍎',
};

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Doručak',
  lunch: 'Ručak',
  dinner: 'Večera',
  snack: 'Užina',
};

interface Props {
  family: FamilyMember[];
  recipes: Recipe[];
  menu: MenuEntry[];
  setMenu: (menu: MenuEntry[]) => void;
}

export default function Dashboard({ family, recipes, menu, setMenu }: Props) {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>('mon');

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

  // Alternativni recepti za zamenu
  const alternatives = (mealType: MealType, currentId: string) =>
    recipes.filter((r) => r.mealType === mealType && r.id !== currentId);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2 className="dash-title">Nedeljni jelovnik</h2>
        <span className="dash-subtitle">
          {family.length > 0
            ? `${family.length} član${family.length !== 1 ? 'ova' : ''}`
            : 'Dodaj članove prvo'}
        </span>
      </div>

      <div className="day-cards">
        {DAYS.map((day) => {
          const isExpanded = expandedDay === day.key;
          return (
            <div
              key={day.key}
              className={`day-card ${isExpanded ? 'expanded' : ''}`}
              onClick={() => setExpandedDay(isExpanded ? null : day.key)}
            >
              {/* Zaglavlje dana */}
              <div className="day-header-card">
                <span className="day-label">{day.label}</span>
                <span className="day-arrow">{isExpanded ? '▾' : '▸'}</span>
              </div>

              {/* Obroci (prikazani samo kad je dan proširen) */}
              {isExpanded && (
                <div className="day-meals">
                  {(Object.keys(MEAL_LABELS) as MealType[]).map((meal) => {
                    const entry = getMenuEntry(day.key, meal);
                    const recipe = entry ? getRecipe(entry.recipeId) : undefined;
                    const alts = recipe ? alternatives(meal, recipe.id) : [];

                    return (
                      <div key={meal} className="meal-item">
                        <div className="meal-item-header">
                          <span className="meal-item-icon">{MEAL_ICONS[meal]}</span>
                          <span className="meal-item-label">{MEAL_LABELS[meal]}</span>
                        </div>

                        {recipe ? (
                          <div className="meal-item-body">
                            <button
                              className="meal-item-name"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRecipe(recipe);
                              }}
                            >
                              {recipe.title}
                            </button>
                            <div className="meal-item-meta">
                              <span>{recipe.prepTimeMin} min</span>
                              <span>·</span>
                              <span>{recipe.standardCalories} kcal</span>
                              <span>·</span>
                              <span className={`diff-${recipe.difficulty}`}>
                                {recipe.difficulty === 'easy' ? 'Lako' : recipe.difficulty === 'medium' ? 'Srednje' : 'Teško'}
                              </span>
                            </div>

                            {/* Menu za zamenu — samo ako ima alternativa */}
                            {alts.length > 0 && (
                              <div className="meal-swaps">
                                {alts.slice(0, 3).map((alt) => (
                                  <button
                                    key={alt.id}
                                    className="swap-chip"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      changeRecipe(day.key, meal, alt.id);
                                    }}
                                  >
                                    Zameni sa: {alt.title}
                                  </button>
                                ))}
                                {alts.length > 3 && (
                                  <span className="more-swaps">+ još {alts.length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="empty-meal">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal za prikaz recepta */}
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
