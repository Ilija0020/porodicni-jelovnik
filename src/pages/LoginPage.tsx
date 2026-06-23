import { useState } from 'react';
import { supabase } from '../supabaseClient';
import './LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess('Registracija uspešna! Proveri email da potvrdiš nalog.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes('Invalid login')) throw new Error('Pogrešan email ili lozinka');
          throw error;
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Došlo je do greške');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-logo">🍽️ jelovnik</h1>
        <p className="login-subtitle">Prijavi se da nastaviš</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tvoj@email.com"
              required
            />
          </label>

          <label>
            Lozinka
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </label>

          {error && <div className="login-error">{error}</div>}
          {success && <div className="login-success">{success}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '⏳...' : isSignUp ? 'Napravi nalog' : 'Prijavi se'}
          </button>
        </form>

        <p className="login-toggle">
          {isSignUp ? 'Već imaš nalog? ' : 'Nemaš nalog? '}
          <button className="toggle-btn" onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); }}>
            {isSignUp ? 'Prijavi se' : 'Registruj se'}
          </button>
        </p>
      </div>
    </div>
  );
}