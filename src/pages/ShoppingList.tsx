import { useMemo } from 'react';
import { FamilyMember, Recipe, MenuEntry, ShoppingItem, IngredientCategory } from '../types';
import { calculatePortions } from '../utils/calculator';
import './ShoppingList.css';

interface Props {
  family: FamilyMember[];
  recipes: Recipe[];
  menu: MenuEntry[];
}

const CATEGORY_ICONS: Record<string, string> = {
  meat: '🥩',
  vegetables: '🥬',
  dairy: '🥛',
  grains: '🌾',
  spices: '🧂',
  fruit: '🍎',
  other: '📦',
};

const CATEGORY_LABELS: Record<string, string> = {
  meat: 'Meso i riba',
  vegetables: 'Povrće',
  dairy: 'Mlečni proizvodi',
  grains: 'Žitarice, testa i hleb',
  spices: 'Začini, ulja i umaci',
  fruit: 'Voće',
  other: 'Ostalo',
};

const CATEGORY_ORDER: IngredientCategory[] = ['meat', 'vegetables', 'dairy', 'grains', 'spices', 'fruit', 'other'];

export default function ShoppingList({ family, recipes, menu }: Props) {
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
            // Nađi kategoriju iz originalnog recepta
            const originalIng = recipe.ingredients.find(
              (oi) => oi.name === ing.name
            );
            ingredientMap[key] = {
              name: ing.name,
              totalAmount: 0,
              unit: ing.unit,
              category: originalIng?.category || 'other',
            };
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

  // Sortiraj po kategorijama
  const sortedCategories = CATEGORY_ORDER.filter((cat) => groupedByCategory[cat]);

  // Ukupno različitih namirnica
  const totalItems = shoppingItems.length;
  const totalCategories = sortedCategories.length;

  return (
    <div className="shopping-page">
      <h2>🛒 Nedeljna Nabavka</h2>
      <p className="shopping-summary">
        Na osnovu jelovnika za {family.length} članova · {totalItems} namirnica u {totalCategories} kategorija
      </p>

      {sortedCategories.map((cat) => (
        <div key={cat} className="shopping-category">
          <h3 className="category-header">
            {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
          </h3>
          <div className="category-items">
            {groupedByCategory[cat].map((item) => (
              <div key={item.name} className="shopping-item">
                <span className="shopping-name">{item.name}</span>
                <span className="shopping-amount">
                  {item.unit === 'kom'
                    ? `${Math.round(item.totalAmount)} ${item.unit}`
                    : `${Math.round(item.totalAmount)}${item.unit}`
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {shoppingItems.length === 0 && (
        <p className="empty-msg">Nema jelovnika za izračunavanje nabavke.</p>
      )}
    </div>
  );
}
