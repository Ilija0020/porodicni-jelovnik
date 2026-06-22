import { useState } from 'react';
import { Recipe, MealType, Ingredient, Difficulty, IngredientCategory } from '../types';
import './AdminPage.css';

interface Props {
  recipes: Recipe[];
  setRecipes: (recipes: Recipe[]) => void;
}

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Doručak' },
  { value: 'lunch', label: 'Ručak' },
  { value: 'dinner', label: 'Večera' },
  { value: 'snack', label: 'Užina' },
];

const CATEGORIES: { value: IngredientCategory; label: string }[] = [
  { value: 'meat', label: 'Meso i riba' },
  { value: 'vegetables', label: 'Povrće' },
  { value: 'dairy', label: 'Mlečni proizvodi' },
  { value: 'grains', label: 'Žitarice' },
  { value: 'spices', label: 'Začini i ulja' },
  { value: 'fruit', label: 'Voće' },
  { value: 'other', label: 'Ostalo' },
];

const EMPTY_RECIPE: Omit<Recipe, 'id'> = {
  title: '',
  mealType: 'lunch',
  prepTimeMin: 30,
  difficulty: 'medium',
  standardCalories: 500,
  standardProteinG: 30,
  standardCarbsG: 50,
  standardFatG: 20,
  standardFiberG: 5,
  ingredients: [],
  steps: [],
};

export default function AdminPage({ recipes, setRecipes }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Recipe, 'id'>>({ ...EMPTY_RECIPE });
  const [newIngredient, setNewIngredient] = useState({ name: '', amountPerServing: 100, unit: 'g', category: 'vegetables' as IngredientCategory });
  const [newStep, setNewStep] = useState('');

  const startNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY_RECIPE });
    setShowForm(true);
  };

  const startEdit = (recipe: Recipe) => {
    setEditingId(recipe.id);
    setForm({
      title: recipe.title,
      mealType: recipe.mealType,
      prepTimeMin: recipe.prepTimeMin,
      difficulty: recipe.difficulty,
      standardCalories: recipe.standardCalories,
      standardProteinG: recipe.standardProteinG,
      standardCarbsG: recipe.standardCarbsG,
      standardFatG: recipe.standardFatG,
      standardFiberG: recipe.standardFiberG,
      imageUrl: recipe.imageUrl,
      youtubeUrl: recipe.youtubeUrl,
      ingredients: [...recipe.ingredients],
      steps: [...recipe.steps],
    });
    setShowForm(true);
  };

  const addIngredient = () => {
    if (!newIngredient.name.trim()) return;
    const ing: Ingredient = {
      id: 'i' + Date.now(),
      name: newIngredient.name,
      amountPerServing: newIngredient.amountPerServing,
      unit: newIngredient.unit,
      category: newIngredient.category,
    };
    setForm({ ...form, ingredients: [...form.ingredients, ing] });
    setNewIngredient({ name: '', amountPerServing: 100, unit: 'g', category: 'vegetables' });
  };

  const removeIngredient = (id: string) => {
    setForm({ ...form, ingredients: form.ingredients.filter((i) => i.id !== id) });
  };

  const addStep = () => {
    if (!newStep.trim()) return;
    setForm({
      ...form,
      steps: [...form.steps, { stepNumber: form.steps.length + 1, instruction: newStep }],
    });
    setNewStep('');
  };

  const removeStep = (index: number) => {
    setForm({
      ...form,
      steps: form.steps
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, stepNumber: i + 1 })),
    });
  };

  const save = () => {
    if (!form.title.trim() || form.ingredients.length === 0) return;

    if (editingId) {
      setRecipes(recipes.map((r) => (r.id === editingId ? { id: editingId, ...form } : r)));
    } else {
      const newRecipe: Recipe = { id: 'r' + Date.now(), ...form };
      setRecipes([...recipes, newRecipe]);
    }
    setShowForm(false);
    setEditingId(null);
  };

  const remove = (id: string) => {
    setRecipes(recipes.filter((r) => r.id !== id));
  };

  return (
    <div className="admin-page">
      <h2>⚙️ Upravljanje Receptima</h2>

      {!showForm && (
        <button className="add-btn" onClick={startNew}>+ Novi recept</button>
      )}

      {/* Lista recepata */}
      <div className="recipe-list">
        <h3>Postojeći recepti ({recipes.length})</h3>
        {recipes.map((r) => (
          <div key={r.id} className="recipe-list-item">
            <div className="recipe-list-info">
              <strong>{r.title}</strong>
              <span className="recipe-list-meta">
                {MEAL_TYPES.find((mt) => mt.value === r.mealType)?.label} · {r.prepTimeMin}min · {r.standardCalories}kcal
              </span>
            </div>
            <div className="recipe-list-actions">
              <button onClick={() => startEdit(r)}>✏️</button>
              <button onClick={() => remove(r.id)} className="delete-btn">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal za dodavanje/izmenu recepta */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content admin-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            <h3 className="modal-title">{editingId ? 'Izmeni recept' : 'Novi recept'}</h3>

            <div className="form-section">
              <label>Naziv jela:</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>

            <div className="form-row-3">
              <div className="form-section">
                <label>Tip obroka:</label>
                <select value={form.mealType} onChange={(e) => setForm({ ...form, mealType: e.target.value as MealType })}>
                  {MEAL_TYPES.map((mt) => (
                    <option key={mt.value} value={mt.value}>{mt.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-section">
                <label>Vreme (min):</label>
                <input type="number" value={form.prepTimeMin} onChange={(e) => setForm({ ...form, prepTimeMin: +e.target.value })} />
              </div>
              <div className="form-section">
                <label>Težina:</label>
                <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })}>
                  <option value="easy">Lako</option>
                  <option value="medium">Srednje</option>
                  <option value="hard">Teško</option>
                </select>
              </div>
            </div>

            {/* Nutritivne vrednosti */}
            <h4>Nutritivne vrednosti (standardna porcija)</h4>
            <div className="form-row-5">
              {[
                ['kcal', 'standardCalories'],
                ['Proteini (g)', 'standardProteinG'],
                ['Hidrati (g)', 'standardCarbsG'],
                ['Masti (g)', 'standardFatG'],
                ['Vlakna (g)', 'standardFiberG'],
              ].map(([label, key]) => (
                <div className="form-section" key={key}>
                  <label>{label}:</label>
                  <input
                    type="number"
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: +e.target.value })}
                  />
                </div>
              ))}
            </div>

            {/* Sastojci */}
            <h4>Sastojci</h4>
            <div className="ingredient-form">
              <div className="form-row-4">
                <div className="form-section"><input placeholder="Naziv" value={newIngredient.name} onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })} /></div>
                <div className="form-section"><input type="number" placeholder="Količina" value={newIngredient.amountPerServing} onChange={(e) => setNewIngredient({ ...newIngredient, amountPerServing: +e.target.value })} /></div>
                <div className="form-section">
                  <select value={newIngredient.unit} onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}>
                    <option value="g">g</option><option value="ml">ml</option>
                    <option value="kom">kom</option><option value="kašika">kašika</option>
                  </select>
                </div>
                <div className="form-section">
                  <select value={newIngredient.category} onChange={(e) => setNewIngredient({ ...newIngredient, category: e.target.value as IngredientCategory })}>
                    {CATEGORIES.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                  </select>
                </div>
              </div>
              <button onClick={addIngredient} className="small-add-btn">+ Dodaj</button>
            </div>

            <div className="ing-list-preview">
              {form.ingredients.map((ing) => (
                <span key={ing.id} className="ing-tag">
                  {ing.name}: {ing.amountPerServing}{ing.unit}
                  <button onClick={() => removeIngredient(ing.id)}>✕</button>
                </span>
              ))}
            </div>

            {/* Koraci */}
            <h4>Koraci pripreme</h4>
            <div className="step-form">
              <input
                placeholder={`Korak ${form.steps.length + 1}...`}
                value={newStep}
                onChange={(e) => setNewStep(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addStep(); } }}
              />
              <button onClick={addStep}>+</button>
            </div>
            <ul className="step-list-preview">
              {form.steps.map((step, i) => (
                <li key={i}>
                  {step.instruction}
                  <button onClick={() => removeStep(i)}>✕</button>
                </li>
              ))}
            </ul>

            {/* Opciono */}
            <div className="form-row-2">
              <div className="form-section">
                <label>Slika URL:</label>
                <input value={form.imageUrl || ''} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
              </div>
              <div className="form-section">
                <label>YouTube URL:</label>
                <input value={form.youtubeUrl || ''} onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })} />
              </div>
            </div>

            <div className="form-actions">
              <button className="save-btn" onClick={save}>💾 Sačuvaj recept</button>
              <button className="cancel-btn" onClick={() => setShowForm(false)}>Odustani</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
