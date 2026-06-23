import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './LoginPage.css';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Lozinka mora imati najmanje 6 karaktera');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Lozinke se ne poklapaju');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setSuccess('Lozinka je uspešno promenjena. Ulogovan/a si sa novom lozinkom.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => navigate('/'), 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Došlo je do greške pri promeni lozinke');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-logo">🔐 Nova lozinka</h1>
        <p className="login-subtitle">Unesi novu lozinku za svoj nalog</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Nova lozinka
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </label>

          <label>
            Potvrdi lozinku
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </label>

          {error && <div className="login-error">{error}</div>}
          {success && <div className="login-success">{success}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '⏳...' : 'Sačuvaj novu lozinku'}
          </button>
        </form>

        <p className="login-toggle login-forgot">
          <Link to="/" className="forgot-link">
            Nazad na aplikaciju
          </Link>
        </p>
      </div>
    </div>
  );
}
