import { Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import Dashboard from './pages/Dashboard';
import FamilyPage from './pages/FamilyPage';
import ShoppingList from './pages/ShoppingList';
import AdminPage from './pages/AdminPage';
import { FamilyMember, Recipe, MenuEntry } from './types';
import { INITIAL_FAMILY, RECIPES, WEEKLY_MENU } from './data/mockData';
import { calculateTDEE } from './utils/calculator';
import { dataService, HouseholdContext } from './services/dataService';

const initialFamily: FamilyMember[] = INITIAL_FAMILY.map((member) => ({
  ...member,
  dailyCalories: calculateTDEE(member),
}));

function seedDataForHousehold(householdId: string) {
  const prefix = householdId.slice(0, 8);
  const recipeIdMap = new Map<string, string>();

  const family = initialFamily.map((member) => ({
    ...member,
    id: `${prefix}-${member.id}`,
  }));

  const recipes = RECIPES.map((recipe) => {
    const recipeId = `${prefix}-${recipe.id}`;
    recipeIdMap.set(recipe.id, recipeId);

    return {
      ...recipe,
      id: recipeId,
      ingredients: recipe.ingredients.map((ingredient) => ({
        ...ingredient,
        id: `${recipeId}-${ingredient.id}`,
      })),
    };
  });

  const menu = WEEKLY_MENU.map((entry) => ({
    ...entry,
    id: `${prefix}-${entry.id}`,
    recipeId: recipeIdMap.get(entry.recipeId) ?? entry.recipeId,
  }));

  return { family, recipes, menu };
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [household, setHousehold] = useState<HouseholdContext | null>(null);
  const [family, setFamilyState] = useState<FamilyMember[]>(initialFamily);
  const [recipes, setRecipesState] = useState<Recipe[]>(RECIPES);
  const [menu, setMenuState] = useState<MenuEntry[]>(WEEKLY_MENU);
  const location = useLocation();
  const isResetPasswordRoute = location.pathname === '/reset-password';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;

    let cancelled = false;

    const loadData = async () => {
      setDataLoading(true);
      setDataError('');

      try {
        const remoteData = await dataService.getAppData(session);
        if (cancelled) return;

        const seedData = seedDataForHousehold(remoteData.household.id);
        const seededFamily = remoteData.family.length > 0 ? remoteData.family : seedData.family;
        const seededRecipes = remoteData.recipes.length > 0 ? remoteData.recipes : seedData.recipes;
        const seededMenu = remoteData.menu.length > 0 ? remoteData.menu : seedData.menu;

        setHousehold(remoteData.household);
        setFamilyState(seededFamily);
        setRecipesState(seededRecipes);
        setMenuState(seededMenu);

        if (remoteData.family.length === 0) await dataService.syncFamily(seededFamily, remoteData.household.id);
        if (remoteData.recipes.length === 0) await dataService.syncRecipes(seededRecipes, remoteData.household.id);
        if (remoteData.menu.length === 0) await dataService.syncMenu(seededMenu, remoteData.household.id);
      } catch (error: unknown) {
        if (!cancelled) setDataError(error instanceof Error ? error.message : 'Greška pri učitavanju podataka');
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    };

    void loadData();

    return () => { cancelled = true; };
  }, [session]);

  const setFamily = useCallback((nextFamily: FamilyMember[]) => {
    setFamilyState(nextFamily);
    if (!household) return;
    dataService.syncFamily(nextFamily, household.id).catch((error: unknown) => {
      setDataError(error instanceof Error ? error.message : 'Greška pri snimanju članova');
    });
  }, [household]);

  const setRecipes = useCallback((nextRecipes: Recipe[]) => {
    setRecipesState(nextRecipes);
    if (!household) return;
    dataService.syncRecipes(nextRecipes, household.id).catch((error: unknown) => {
      setDataError(error instanceof Error ? error.message : 'Greška pri snimanju recepata');
    });
  }, [household]);

  const setMenu = useCallback((nextMenu: MenuEntry[]) => {
    setMenuState(nextMenu);
    if (!household) return;
    dataService.syncMenu(nextMenu, household.id).catch((error: unknown) => {
      setDataError(error instanceof Error ? error.message : 'Greška pri snimanju jelovnika');
    });
  }, [household]);

  if (authLoading || (dataLoading && !isResetPasswordRoute)) {
    return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--text-tertiary)' }}>⏳ Učitavanje...</div>;
  }

  return (
    <Routes>
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="*"
        element={session ? (
          <Layout household={household}>
            {dataError && (
              <div style={{ margin: '12px auto', maxWidth: 900, color: '#b91c1c', background: '#fee2e2', padding: 12, borderRadius: 12 }}>
                ⚠️ {dataError}
              </div>
            )}
            <Routes>
              <Route path="/" element={<Dashboard family={family} recipes={recipes} menu={menu} setMenu={setMenu} />} />
              <Route path="/family" element={<FamilyPage family={family} setFamily={setFamily} />} />
              <Route path="/shopping" element={<ShoppingList family={family} recipes={recipes} menu={menu} />} />
              <Route path="/admin" element={<AdminPage recipes={recipes} setRecipes={setRecipes} />} />
            </Routes>
          </Layout>
        ) : (
          <LoginPage />
        )}
      />
    </Routes>
  );
}
