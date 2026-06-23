import { useMemo, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { HouseholdContext } from '../services/dataService';
import { HouseholdMembership, UserProfile } from '../types';
import './AccountSettingsPage.css';

interface Props {
  session: Session | null;
  profile: UserProfile | null;
  household: HouseholdContext | null;
  membership: HouseholdMembership | null;
  onProfileUpdate: (displayName: string) => Promise<void>;
}

const roleLabels: Record<string, string> = {
  user: 'Korisnik',
  admin: 'Admin',
  owner: 'Vlasnik domaćinstva',
  member: 'Član domaćinstva',
  'read-only': 'Samo čitanje',
};

export default function AccountSettingsPage({ session, profile, household, membership, onProfileUpdate }: Props) {
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const email = session?.user.email ?? profile?.email ?? 'Nema email adrese';
  const appRole = profile ? roleLabels[profile.appRole] ?? profile.appRole : '—';
  const householdRole = membership ? roleLabels[membership.role] ?? membership.role : '—';
  const householdName = household?.name ?? 'Nema vezanog domaćinstva';
  const inviteCode = household?.inviteCode ?? '—';

  const canSave = useMemo(() => displayName.trim() !== (profile?.displayName ?? '').trim(), [displayName, profile?.displayName]);

  const saveProfile = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await onProfileUpdate(displayName);
      setDisplayName(displayName);
      setMessage('Sačuvano.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nije uspelo snimanje profila.');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    setMessage('');
    setError('');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage('Link za promenu lozinke je poslat na email.');
  };

  return (
    <div className="account-page">
      <div className="account-hero">
        <div>
          <p className="eyebrow">Nalog i podešavanja</p>
          <h2>Pregled naloga</h2>
          <p className="subtitle">Ovde vidiš osnovne podatke o nalogu, domaćinstvu i pristupu aplikaciji.</p>
        </div>
        <div className="account-actions">
          <button className="secondary-btn" onClick={changePassword}>Promeni lozinku</button>
          <button className="danger-btn" onClick={() => void supabase.auth.signOut()}>Odjavi se</button>
        </div>
      </div>

      {(message || error) && (
        <div className={`notice ${error ? 'error' : 'success'}`}>
          {error || message}
        </div>
      )}

      <div className="account-grid">
        <section className="account-card">
          <h3>Osnovni podaci</h3>
          <label>
            Email adresa
            <input value={email} disabled />
          </label>
          <label>
            Prikazno ime
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Kako želiš da te aplikacija zove"
            />
          </label>
          <div className="meta-list">
            <div><span>App uloga</span><strong>{appRole}</strong></div>
            <div><span>Status naloga</span><strong>{profile?.isDeactivated ? 'Deaktiviran' : 'Aktivan'}</strong></div>
          </div>
          <div className="card-actions">
            <button className="primary-btn" disabled={!canSave || saving} onClick={saveProfile}>
              {saving ? 'Čuvam...' : 'Sačuvaj promene'}
            </button>
          </div>
        </section>

        <section className="account-card">
          <h3>Domaćinstvo</h3>
          <div className="meta-list">
            <div><span>Naziv</span><strong>{householdName}</strong></div>
            <div><span>Kod za poziv</span><strong>{inviteCode}</strong></div>
            <div><span>Uloga u domaćinstvu</span><strong>{householdRole}</strong></div>
          </div>
          <p className="help-text">
            Kod deliš sa članovima porodice kada ih pozivaš u aplikaciju.
          </p>
        </section>

        <section className="account-card full-width">
          <h3>Brze akcije</h3>
          <ul className="quick-list">
            <li>Reset lozinke šalje email sa linkom za novu šifru.</li>
            <li>Prikazno ime koristi se unutar aplikacije ako ga postaviš.</li>
            <li>Nalog se i dalje otvara preko Supabase auth sesije.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
