import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import './Layout.css';

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return [theme, () => setTheme(t => t === 'light' ? 'dark' : 'light')] as const;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [theme, toggleTheme] = useTheme();
  const { pathname } = useLocation();
  // Pitanje za mobile: da li je donja navigacija aktivna
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Skrol na vrh pri promeni rute (mobile)
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="layout">
      {/* === Desktop Header === */}
      <header className="header">
        <div className="header-inner">
          <h1 className="logo">🍽️ jelovnik</h1>
          <nav className="nav-desktop">
            <NavLink to="/" end>📅 Jelovnik</NavLink>
            <NavLink to="/family">👤 Članovi</NavLink>
            <NavLink to="/shopping">🛒 Nabavka</NavLink>
            <NavLink to="/admin">⚙️ Recepti</NavLink>
          </nav>
          <button className="theme-toggle" onClick={toggleTheme} title="Promeni temu">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button className="logout-btn" onClick={() => supabase.auth.signOut()} title="Odjavi se">
            🚪
          </button>
        </div>
      </header>

      {/* === Glavni sadržaj === */}
      <main className="main">{children}</main>

      {/* === Mobile Bottom Nav === */}
      <nav className="nav-mobile">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">📅</span>
          <span className="nav-label">Jelovnik</span>
        </NavLink>
        <NavLink to="/family" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">👤</span>
          <span className="nav-label">Članovi</span>
        </NavLink>
        <NavLink to="/shopping" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">🛒</span>
          <span className="nav-label">Nabavka</span>
        </NavLink>
        <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">Recepti</span>
        </NavLink>
      </nav>
    </div>
  );
}