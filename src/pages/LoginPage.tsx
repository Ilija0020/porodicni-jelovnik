import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [success, setSuccess] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isSignUp) {
        const cleanInviteCode = inviteCode.trim().toUpperCase();
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: cleanInviteCode ? { pendingInviteCode: cleanInviteCode } : {},
          },
        });
        if (error) throw error;
        setSuccess(cleanInviteCode
          ? 'Registracija uspešna! Kada potvrdiš email, bićeš dodat/a u porodični jelovnik preko unetog koda.'
          : 'Registracija uspešna! Proveri email da potvrdiš nalog. Ako ne uneseš kod, dobićeš svoj jelovnik.');
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

          {isSignUp && (
            <label>
              Porodični kod <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(opciono)</span>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="npr. A1B2C3D4"
                maxLength={12}
              />
            </label>
          )}

          {error && <div className="login-error">{error}</div>}
          {success && <div className="login-success">{success}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '⏳...' : isSignUp ? 'Napravi nalog' : 'Prijavi se'}
          </button>
        </form>

        <p className="login-toggle">
          {isSignUp ? 'Već imaš nalog? ' : 'Nemaš nalog? '}
          <button
            type="button"
            className="toggle-btn"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); }}
          >
            {isSignUp ? 'Prijavi se' : 'Registruj se'}
          </button>
        </p>

        {!isSignUp && (
          <p className="login-toggle login-forgot">
            <Link to="/reset-password" className="forgot-link">
              Zaboravio/la si lozinku?
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}