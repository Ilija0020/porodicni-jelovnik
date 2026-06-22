import { useState } from 'react';
import { Recipe, MealType } from '../types';
import './MealCard.css';

interface Props {
  recipe: Recipe;
  recipes: Recipe[];
  mealType: MealType;
  onSelect: (recipe: Recipe) => void;
  onDetails: () => void;
}

export default function MealCard({ recipe, recipes, mealType, onSelect, onDetails }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  const alternatives = recipes.filter(
    (r) => r.mealType === mealType && r.id !== recipe.id
  );

  return (
    <div className="meal-card-wrapper">
      <div className="meal-card" onClick={onDetails}>
        <span className="meal-title">{recipe.title}</span>
        <span className="meal-info">
          {recipe.prepTimeMin}min · {recipe.standardCalories}cal
        </span>
      </div>

      <button
        className="swap-btn"
        onClick={(e) => {
          e.stopPropagation();
          setShowPicker(!showPicker);
        }}
        title="Zameni jelo"
      >
        🔄
      </button>

      {showPicker && (
        <div className="recipe-picker-overlay" onClick={() => setShowPicker(false)}>
          <div className="recipe-picker" onClick={(e) => e.stopPropagation()}>
            <h4>Zameni "{recipe.title}"</h4>
            <div className="picker-list">
              {alternatives.map((alt) => (
                <button
                  key={alt.id}
                  className="picker-item"
                  onClick={() => {
                    onSelect(alt);
                    setShowPicker(false);
                  }}
                >
                  <span className="picker-title">{alt.title}</span>
                  <span className="picker-info">
                    {alt.prepTimeMin}min · {alt.standardCalories}cal · {alt.difficulty}
                  </span>
                </button>
              ))}
              {alternatives.length === 0 && (
                <p className="no-alt">Nema drugih recepata za ovaj tip obroka.</p>
              )}
            </div>
            <button className="close-picker" onClick={() => setShowPicker(false)}>
              ✕ Zatvori
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
