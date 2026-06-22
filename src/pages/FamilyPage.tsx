import { useState } from 'react';
import { FamilyMember, ActivityLevel, WeightGoal } from '../types';
import { calculateTDEE, ACTIVITY_LABELS, GOAL_LABELS } from '../utils/calculator';
import './FamilyPage.css';

interface Props {
  family: FamilyMember[];
  setFamily: (family: FamilyMember[]) => void;
}

type FormData = Omit<FamilyMember, 'id' | 'dailyCalories'>;

const EMPTY_FORM: FormData = {
  name: '',
  gender: 'male',
  weightKg: 70,
  heightCm: 175,
  age: 30,
  activityLevel: 3,
  goal: 'maintain' as WeightGoal,
};

export default function FamilyPage({ family, setFamily }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const startEdit = (member: FamilyMember) => {
    setEditingId(member.id);
    setForm({
      name: member.name,
      gender: member.gender,
      weightKg: member.weightKg,
      heightCm: member.heightCm,
      age: member.age,
      activityLevel: member.activityLevel,
      goal: member.goal,
    });
    setShowForm(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    const dailyCalories = calculateTDEE(form);

    if (editingId) {
      setFamily(
        family.map((m) =>
          m.id === editingId ? { id: editingId, ...form, dailyCalories } : m
        )
      );
    } else {
      const newMember: FamilyMember = {
        id: 'm' + Date.now(),
        ...form,
        dailyCalories,
      };
      setFamily([...family, newMember]);
    }
    resetForm();
  };

  const remove = (id: string) => {
    setFamily(family.filter((m) => m.id !== id));
  };

  return (
    <div className="family-page">
      <h2>👤 Članovi Porodice</h2>

      {!showForm && (
        <button className="add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
          + Dodaj člana
        </button>
      )}

      {showForm && (
        <div className="member-form">
          <h3>{editingId ? 'Izmeni člana' : 'Dodaj novog člana'}</h3>

          <label>
            Ime:
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="npr. Ilija"
            />
          </label>

          <label>
            Pol:
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as 'male' | 'female' })}>
              <option value="male">Muški</option>
              <option value="female">Ženski</option>
            </select>
          </label>

          <div className="form-row">
            <label>
              Težina (kg):
              <input type="number" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: +e.target.value })} />
            </label>
            <label>
              Visina (cm):
              <input type="number" value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: +e.target.value })} />
            </label>
            <label>
              Godine:
              <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: +e.target.value })} />
            </label>
          </div>

          <label>
            Fizička aktivnost:
            <select value={form.activityLevel} onChange={(e) => setForm({ ...form, activityLevel: +e.target.value as ActivityLevel })}>
              {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label>
            Cilj:
            <select value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value as WeightGoal })}>
              {Object.entries(GOAL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <div className="form-actions">
            <button className="save-btn" onClick={save}>💾 Sačuvaj</button>
            <button className="cancel-btn" onClick={resetForm}>Odustani</button>
          </div>

          {/* Prikaz izračunatih kalorija */}
          <div className="calories-preview">
            🔥 Izračunate dnevne kalorije: <strong>{calculateTDEE(form)} kcal</strong>
          </div>
        </div>
      )}

      <div className="family-list">
        {family.map((member) => (
          <div key={member.id} className="family-card">
            <div className="family-card-body">
              <h3>{member.name}</h3>
              <div className="family-stats">
                <span>{member.gender === 'male' ? '♂️' : '♀️'} {member.age} god.</span>
                <span>⚖️ {member.weightKg}kg</span>
                <span>📏 {member.heightCm}cm</span>
                <span>🔥 {member.dailyCalories} kcal/dan</span>
                <span className="activity-label">
                  🏃 {ACTIVITY_LABELS[member.activityLevel]?.split('(')[0].trim()}
                </span>
                <span>🎯 {GOAL_LABELS[member.goal] || 'Održavanje'}</span>
              </div>
            </div>
            <div className="family-card-actions">
              <button onClick={() => startEdit(member)}>✏️</button>
              <button onClick={() => remove(member.id)} className="delete-btn">🗑️</button>
            </div>
          </div>
        ))}
        {family.length === 0 && (
          <p className="empty-msg">Još uvek nema članova. Dodaj prvog!</p>
        )}
      </div>
    </div>
  );
}
