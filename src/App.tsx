import { Routes, Route } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import FamilyPage from './pages/FamilyPage';
import ShoppingList from './pages/ShoppingList';
import AdminPage from './pages/AdminPage';
import { FamilyMember, Recipe, MenuEntry } from './types';
import { INITIAL_FAMILY, RECIPES, WEEKLY_MENU } from './data/mockData';
import { calculateTDEE } from './utils/calculator';
import { dataService } from './services/dataService';

const initialFamily: FamilyMember[] = INITIAL_FAMILY.map((member) => ({
  ...member,
  dailyCalories: calculateTDEE(member),
}));

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [family, setFamilyState] = useState<FamilyMember[]>(initialFamily);
  const [recipes, setRecipesState] = useState<Recipe[]>(RECIPES);
  const [menu, setMenuState] = useState<MenuEntry[]>(WEEKLY_MENU);

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
        const remoteData = await dataService.getAppData();
        if (cancelled) return;

        const seededFamily = remoteData.family.length > 0 ? remoteData.family : initialFamily;
        const seededRecipes = remoteData.recipes.length > 0 ? remoteData.recipes : RECIPES;
        const seededMenu = remoteData.menu.length > 0 ? remoteData.menu : WEEKLY_MENU;

        setHouseholdId(remoteData.householdId);
        setFamilyState(seededFamily);
        setRecipesState(seededRecipes);
        setMenuState(seededMenu);

        if (remoteData.family.length === 0) await dataService.syncFamily(seededFamily, remoteData.householdId);
        if (remoteData.recipes.length === 0) await dataService.syncRecipes(seededRecipes, remoteData.householdId);
        if (remoteData.menu.length === 0) await dataService.syncMenu(seededMenu, remoteData.householdId);
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
    if (!householdId) return;
    dataService.syncFamily(nextFamily, householdId).catch((error: unknown) => {
      setDataError(error instanceof Error ? error.message : 'Greška pri snimanju članova');
    });
  }, [householdId]);

  const setRecipes = useCallback((nextRecipes: Recipe[]) => {
    setRecipesState(nextRecipes);
    if (!householdId) return;
    dataService.syncRecipes(nextRecipes, householdId).catch((error: unknown) => {
      setDataError(error instanceof Error ? error.message : 'Greška pri snimanju recepata');
    });
  }, [householdId]);

  const setMenu = useCallback((nextMenu: MenuEntry[]) => {
    setMenuState(nextMenu);
    if (!householdId) return;
    dataService.syncMenu(nextMenu, householdId).catch((error: unknown) => {
      setDataError(error instanceof Error ? error.message : 'Greška pri snimanju jelovnika');
    });
  }, [householdId]);

  if (authLoading || dataLoading) {
    return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--text-tertiary)' }}>⏳ Učitavanje...</div>;
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <Layout>
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
  );
}
