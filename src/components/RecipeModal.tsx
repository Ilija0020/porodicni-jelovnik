import { FamilyMember, Recipe } from '../types';
import { calculatePortions } from '../utils/calculator';
import './RecipeModal.css';

interface Props {
  recipe: Recipe;
  family: FamilyMember[];
  onClose: () => void;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Lako',
  medium: 'Srednje',
  hard: 'Teško',
};

const CATEGORY_ICONS: Record<string, string> = {
  meat: '🥩',
  vegetables: '🥬',
  dairy: '🥛',
  grains: '🌾',
  spices: '🧂',
  fruit: '🍎',
  other: '📦',
};

export default function RecipeModal({ recipe, family, onClose }: Props) {
  const portions = calculatePortions(family, recipe);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <h2 className="modal-title">{recipe.title}</h2>

        <div className="modal-meta">
          <span>⏱️ {recipe.prepTimeMin} min pripreme</span>
          <span>📊 {DIFFICULTY_LABELS[recipe.difficulty]}</span>
          <span>🔥 {recipe.standardCalories} kcal / porcija</span>
        </div>

        {/* Nutritivne vrednosti */}
        <div className="nutrition-box">
          <h3>🍎 Nutritivne vrednosti (standardna porcija)</h3>
          <div className="nutrition-grid">
            <div className="nutrition-item">
              <span className="nut-value">{recipe.standardCalories}</span>
              <span className="nut-label">kcal</span>
            </div>
            <div className="nutrition-item">
              <span className="nut-value">{recipe.standardProteinG}g</span>
              <span className="nut-label">Proteini</span>
            </div>
            <div className="nutrition-item">
              <span className="nut-value">{recipe.standardCarbsG}g</span>
              <span className="nut-label">Uglj. hidrati</span>
            </div>
            <div className="nutrition-item">
              <span className="nut-value">{recipe.standardFatG}g</span>
              <span className="nut-label">Masti</span>
            </div>
            <div className="nutrition-item">
              <span className="nut-value">{recipe.standardFiberG}g</span>
              <span className="nut-label">Vlakna</span>
            </div>
          </div>
        </div>

        {/* Gramaža po članu */}
        {family.length > 0 && (
          <div className="portions-box">
            <h3>⚖️ Gramaža po članu</h3>
            <p className="portions-hint">
              Skalirano prema dnevnim kalorijama svakog člana
            </p>
            {portions.map((p) => (
              <div key={p.memberName} className="portion-card">
                <h4>
                  {p.memberName}
                  <span className="portion-scale">×{p.scaleFactor}</span>
                </h4>
                <div className="portion-meta">
                  {p.dailyCalories} kcal/dan · Ovaj obrok: {p.mealCalories} kcal
                </div>
                <div className="portion-nutrition">
                  <span>🥩 {p.proteinG}g</span>
                  <span>🍞 {p.carbsG}g</span>
                  <span>🧈 {p.fatG}g</span>
                  <span>🥬 {p.fiberG}g vl.</span>
                </div>
                <div className="portion-ingredients">
                  {p.ingredients.map((ing, i) => (
                    <span key={i} className="portion-ing">
                      {ing.name}: <strong>{ing.amount}{ing.unit}</strong>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sastojci (ceo recept) */}
        <div className="ingredients-box">
          <h3>🛒 Sastojci (ceo recept)</h3>
          <div className="ingredients-list">
            {recipe.ingredients.map((ing) => (
              <div key={ing.id} className="ingredient-row">
                <span className="ing-cat">{CATEGORY_ICONS[ing.category]}</span>
                <span className="ing-name">{ing.name}</span>
                <span className="ing-amount">
                  {ing.amountPerServing}{ing.unit} / porcija
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Koraci pripreme */}
        <div className="steps-box">
          <h3>📝 Priprema</h3>
          <ol className="steps-list">
            {recipe.steps.map((step) => (
              <li key={step.stepNumber} className="step-item">
                {step.instruction}
              </li>
            ))}
          </ol>
        </div>

        {/* YouTube link */}
        {recipe.youtubeUrl && (
          <a
            href={recipe.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="youtube-link"
          >
            ▶️ Pogledaj video recept
          </a>
        )}
      </div>
    </div>
  );
}
