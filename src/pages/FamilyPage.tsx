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
  goal: 0 as WeightGoal,
};

const GOAL_STEPS = [-500, -300, -200, 0, 200, 300, 500] as const;

export default function FamilyPage({ family, setFamily }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const startEdit = (member: FamilyMember) => {
    setForm({
      name: member.name,
      gender: member.gender,
      weightKg: member.weightKg,
      heightCm: member.heightCm,
      age: member.age,
      activityLevel: member.activityLevel,
      goal: member.goal,
    });
    setEditingId(member.id);
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
      setFamily([...family, { id: 'm' + Date.now(), ...form, dailyCalories }]);
    }
    resetForm();
  };

  const remove = (id: string) => {
    setFamily(family.filter((m) => m.id !== id));
    setDeleteConfirm(null);
  };

  // Find closest goal step for slider
  const sliderValue = GOAL_STEPS.indexOf(GOAL_STEPS.includes(form.goal as any) ? form.goal : 0);

  return (
    <div className="family-page">
      <div className="family-header">
        <h2 className="family-title">Članovi Porodice</h2>
        <button className="add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
          + Dodaj člana
        </button>
      </div>

      {/* Modal za dodaj/izmeni */}
      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content member-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={resetForm}>✕</button>
            <h3 className="modal-title">{editingId ? 'Izmeni člana' : 'Dodaj novog člana'}</h3>

            <div className="member-form-body">
              <label>
                Ime:
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="npr. Ilija" />
              </label>

              <label>
                Pol:
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as 'male' | 'female' })}>
                  <option value="male">Muški</option>
                  <option value="female">Ženski</option>
                </select>
              </label>

              <div className="form-row">
                <label>Težina (kg):<input type="number" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: +e.target.value })} /></label>
                <label>Visina (cm):<input type="number" value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: +e.target.value })} /></label>
                <label>Godine:<input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: +e.target.value })} /></label>
              </div>

              <label>
                Fizička aktivnost:
                <select value={form.activityLevel} onChange={(e) => setForm({ ...form, activityLevel: +e.target.value as ActivityLevel })}>
                  {Object.entries(ACTIVITY_LABELS).map(([v, lbl]) => (<option key={v} value={v}>{lbl}</option>))}
                </select>
              </label>

              {/* Goal slider */}
              <div className="goal-slider-group">
                <label>Cilj kalorija:</label>
                <input
                  type="range"
                  min={0}
                  max={6}
                  step={1}
                  value={sliderValue}
                  onChange={(e) => setForm({ ...form, goal: GOAL_STEPS[+e.target.value] as WeightGoal })}
                  className="goal-slider"
                />
                <div className="goal-labels">
                  {GOAL_STEPS.map((val, i) => (
                    <span key={val} className={`goal-tick ${sliderValue === i ? 'active' : ''}`}>
                      {val > 0 ? `+${val}` : val}
                    </span>
                  ))}
                </div>
                <div className="goal-selected">
                  🎯 {GOAL_LABELS[form.goal]}
                </div>
              </div>

              <div className="calories-preview">
                🔥 Izračunate dnevne kalorije: <strong>{calculateTDEE(form)} kcal</strong>
              </div>

              <div className="form-actions">
                <button className="save-btn" onClick={save}>💾 Sačuvaj</button>
                <button className="cancel-btn" onClick={resetForm}>Odustani</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista članova */}
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
                <span className="activity-label">🏃 {ACTIVITY_LABELS[member.activityLevel]?.split('(')[0].trim()}</span>
                <span>🎯 {member.goal === 0 ? 'Održavanje' : member.goal > 0 ? `+${member.goal}` : member.goal}</span>
              </div>
            </div>
            <div className="family-card-actions">
              <button onClick={() => startEdit(member)}>✏️</button>
              <button onClick={() => setDeleteConfirm(member.id)} className="delete-btn">🗑️</button>
            </div>
          </div>
        ))}
        {family.length === 0 && <p className="empty-msg">Još uvek nema članova. Dodaj prvog!</p>}
      </div>

      {/* Confirm dialog za brisanje */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h4>Potvrda brisanja</h4>
            <p>Sigurno želiš da obrišeš člana <strong>{family.find(m => m.id === deleteConfirm)?.name}</strong>?</p>
            <div className="confirm-actions">
              <button className="save-btn" onClick={() => remove(deleteConfirm)}>🗑️ Obriši</button>
              <button className="cancel-btn" onClick={() => setDeleteConfirm(null)}>Odustani</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
