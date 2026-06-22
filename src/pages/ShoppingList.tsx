import { useMemo, useState, useEffect } from 'react';
import { FamilyMember, Recipe, MenuEntry, ShoppingItem, IngredientCategory } from '../types';
import { calculatePortions } from '../utils/calculator';
import './ShoppingList.css';

interface Props {
  family: FamilyMember[];
  recipes: Recipe[];
  menu: MenuEntry[];
}

const CATEGORY_ICONS: Record<string, string> = {
  meat: '🥩', vegetables: '🥬', dairy: '🥛', grains: '🌾', spices: '🧂', fruit: '🍎', other: '📦',
};

const CATEGORY_LABELS: Record<string, string> = {
  meat: 'Meso i riba', vegetables: 'Povrće', dairy: 'Mlečni proizvodi',
  grains: 'Žitarice, testa i hleb', spices: 'Začini, ulja i umaci', fruit: 'Voće', other: 'Ostalo',
};

const CATEGORY_ORDER: IngredientCategory[] = ['meat', 'vegetables', 'dairy', 'grains', 'spices', 'fruit', 'other'];

export default function ShoppingList({ family, recipes, menu }: Props) {
  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('nabavka_checked');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  // Sačuvaj checked items
  useEffect(() => {
    localStorage.setItem('nabavka_checked', JSON.stringify([...checked]));
  }, [checked]);

  const toggleItem = (key: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const resetAll = () => setChecked(new Set());

  const shoppingItems = useMemo(() => {
    const ingredientMap: Record<string, ShoppingItem> = {};
    for (const entry of menu) {
      const recipe = recipes.find((r) => r.id === entry.recipeId);
      if (!recipe) continue;
      const portions = calculatePortions(family, recipe);
      for (const portion of portions) {
        for (const ing of portion.ingredients) {
          const key = `${ing.name}|${ing.unit}`;
          if (!ingredientMap[key]) {
            const originalIng = recipe.ingredients.find((oi) => oi.name === ing.name);
            ingredientMap[key] = { name: ing.name, totalAmount: 0, unit: ing.unit, category: originalIng?.category || 'other' };
          }
          ingredientMap[key].totalAmount += ing.amount;
        }
      }
    }
    return Object.values(ingredientMap);
  }, [family, recipes, menu]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, ShoppingItem[]> = {};
    for (const item of shoppingItems) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [shoppingItems]);

  const sortedCategories = CATEGORY_ORDER.filter((cat) => groupedByCategory[cat]);

  const totalItems = shoppingItems.length;
  const checkedCount = [...checked].filter(k => shoppingItems.some(i => `${i.name}|${i.unit}` === k)).length;

  return (
    <div className="shopping-page">
      <div className="shopping-header">
        <div>
          <h2 className="shop-title">Nedeljna nabavka</h2>
          <p className="shopping-summary">
            {family.length} članova · {totalItems} namirnica · {checkedCount} kupljeno
          </p>
        </div>
        {checkedCount > 0 && (
          <button className="reset-btn" onClick={resetAll}>⟳ Resetuj</button>
        )}
      </div>

      {sortedCategories.map((cat) => (
        <div key={cat} className="shopping-category">
          <h3 className="category-header">
            {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
          </h3>
          <div className="category-items">
            {groupedByCategory[cat].map((item) => {
              const key = `${item.name}|${item.unit}`;
              const isChecked = checked.has(key);
              return (
                <div key={item.name} className={`shopping-item ${isChecked ? 'checked' : ''}`}>
                  <label className="shop-check-label">
                    <input
                      type="checkbox"
                      className="shop-checkbox"
                      checked={isChecked}
                      onChange={() => toggleItem(key)}
                    />
                    <span className={`shop-name ${isChecked ? 'striked' : ''}`}>{item.name}</span>
                  </label>
                  <span className={`shopping-amount ${isChecked ? 'striked' : ''}`}>
                    {item.unit === 'kom'
                      ? `${Math.round(item.totalAmount)} ${item.unit}`
                      : `${Math.round(item.totalAmount)}${item.unit}`
                    }
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {shoppingItems.length === 0 && (
        <p className="empty-msg">Nema jelovnika za izračunavanje nabavke.</p>
      )}
    </div>
  );
}