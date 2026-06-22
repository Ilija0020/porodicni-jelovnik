import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
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

const STORAGE_KEYS = {
  family: 'porodicni_jelovnik_family',
  recipes: 'porodicni_jelovnik_recipes',
  menu: 'porodicni_jelovnik_menu',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch {}
  return fallback;
}

function saveToStorage(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Proveri trenutnu sesiju
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Slušaj promene auth stanja
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const [family, setFamily] = useState<FamilyMember[]>(() => {
    const raw = loadFromStorage(STORAGE_KEYS.family, INITIAL_FAMILY);
    return raw.map((m: any) => ({
      ...m,
      dailyCalories: m.dailyCalories || calculateTDEE(m),
    }));
  });

  const [recipes, setRecipes] = useState<Recipe[]>(() =>
    loadFromStorage(STORAGE_KEYS.recipes, RECIPES)
  );

  const [menu, setMenu] = useState<MenuEntry[]>(() =>
    loadFromStorage(STORAGE_KEYS.menu, WEEKLY_MENU)
  );

  useEffect(() => { saveToStorage(STORAGE_KEYS.family, family); }, [family]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.recipes, recipes); }, [recipes]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.menu, menu); }, [menu]);

  if (loading) {
    return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--text-tertiary)' }}>⏳ Učitavanje...</div>;
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard family={family} recipes={recipes} menu={menu} setMenu={setMenu} />} />
        <Route path="/family" element={<FamilyPage family={family} setFamily={setFamily} />} />
        <Route path="/shopping" element={<ShoppingList family={family} recipes={recipes} menu={menu} />} />
        <Route path="/admin" element={<AdminPage recipes={recipes} setRecipes={setRecipes} />} />
      </Routes>
    </Layout>
  );
}
