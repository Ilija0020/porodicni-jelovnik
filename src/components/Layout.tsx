import { NavLink } from 'react-router-dom';
import './Layout.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="layout">
      <header className="header">
        <h1 className="logo">🍽️ Porodični Jelovnik</h1>
        <nav className="nav">
          <NavLink to="/" end>📅 Jelovnik</NavLink>
          <NavLink to="/family">👤 Članovi</NavLink>
          <NavLink to="/shopping">🛒 Nabavka</NavLink>
          <NavLink to="/admin">⚙️ Recepti</NavLink>
        </nav>
      </header>
      <main className="main">{children}</main>
      <footer className="footer">
        Porodični Jelovnik — zdrava ishrana za celu porodicu ❤️
      </footer>
    </div>
  );
}
