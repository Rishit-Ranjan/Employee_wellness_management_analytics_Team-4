import React, { useEffect, useState } from 'react';
import { Target, Award, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { fetchGoals, createGoal, updateGoal, deleteGoal, fetchAchievements } from '../services/api';

export default function GoalsModule({ user }) {
  const [goals, setGoals] = useState([]);
  const [achievements, setAchievements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState('100');
  const [unit, setUnit] = useState('%');

  const load = () => {
    setLoading(true);
    Promise.all([fetchGoals(user.employeeId), fetchAchievements(user.employeeId)])
      .then(([g, a]) => { setGoals(g); setAchievements(a); })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user.employeeId]);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!title) return;
    await createGoal({ employeeId: user.employeeId, title, targetValue: Number(targetValue), unit });
    setTitle(''); setTargetValue('100'); setUnit('%'); setShowForm(false);
    load();
  };

  const handleProgress = async (goal, delta) => {
    const next = Math.max(0, Math.min(goal.targetValue, (goal.currentValue || 0) + delta));
    await updateGoal(goal.id, { currentValue: next });
    load();
  };

  const handleDelete = async (goalId) => {
    await deleteGoal(goalId);
    load();
  };

  if (loading) return <div className="text-sm text-slate-400 py-10 text-center">Loading goals…</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-slate-800 text-base flex items-center gap-2"><Target className="w-5 h-5 text-slate-400" /> My Goals</h3>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> New Goal
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAddGoal} className="mb-5 p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Goal</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Walk 10,000 steps daily" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target</label>
              <input type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Unit</label>
              <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="%, steps, hrs..." className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs" />
            </div>
            <button type="submit" className="sm:col-span-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold">Add Goal</button>
          </form>
        )}

        {goals.length === 0 ? (
          <p className="text-sm text-slate-400">No goals yet — set one to start tracking your progress.</p>
        ) : (
          <div className="space-y-4">
            {goals.map((g) => {
              const pct = g.targetValue ? Math.min(100, ((g.currentValue || 0) / g.targetValue) * 100) : 0;
              return (
                <div key={g.id} className="border border-slate-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {g.status === 'Completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      <span className="text-sm font-semibold text-slate-700">{g.title}</span>
                    </div>
                    <button onClick={() => handleDelete(g.id)} className="text-slate-300 hover:text-rose-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                    <div className={`h-full rounded-full ${g.status === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-600'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{g.currentValue || 0} / {g.targetValue} {g.unit} ({Math.round(pct)}%)</span>
                    {g.status !== 'Completed' && (
                      <div className="flex gap-1.5">
                        <button onClick={() => handleProgress(g, -Math.max(1, g.targetValue * 0.1))} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-500 hover:bg-slate-100 cursor-pointer">-10%</button>
                        <button onClick={() => handleProgress(g, Math.max(1, g.targetValue * 0.1))} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-500 hover:bg-slate-100 cursor-pointer">+10%</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="font-display font-semibold text-slate-800 text-base flex items-center gap-2 mb-4"><Award className="w-5 h-5 text-slate-400" /> Achievements</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(achievements?.badges || []).map((b, i) => (
            <div key={i} className="border border-amber-100 bg-amber-50/50 rounded-lg p-3.5 text-center">
              <Award className="w-6 h-6 text-amber-400 mx-auto mb-1.5" />
              <div className="text-xs font-bold text-slate-700">{b.name}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{b.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
