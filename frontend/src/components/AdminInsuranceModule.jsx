import React, { useEffect, useState } from 'react';
import { ShieldCheck, Plus, Save, CheckCircle2, XCircle, Users } from 'lucide-react';
import { fetchAllInsurance, saveInsurance, updateInsuranceClaim } from '../services/api';

export default function AdminInsuranceModule({ allUsers = [] }) {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [form, setForm] = useState({ provider: '', policyNumber: '', coverage: '', expiryDate: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetchAllInsurance().then(setPolicies).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedEmp) return;
    setSaving(true);
    try {
      await saveInsurance({
        employeeId: selectedEmp,
        provider: form.provider,
        policyNumber: form.policyNumber,
        coverage: Number(form.coverage) || 0,
        expiryDate: form.expiryDate,
      });
      setForm({ provider: '', policyNumber: '', coverage: '', expiryDate: '' });
      setSelectedEmp('');
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleClaim = async (employeeId, claimId, status) => {
    await updateInsuranceClaim(employeeId, claimId, status);
    load();
  };

  const pendingClaims = policies.flatMap((p) => (p.claims || []).filter((c) => c.status === 'Pending').map((c) => ({ ...c, employeeId: p.employeeId })));

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="font-display font-semibold text-slate-800 text-base flex items-center gap-2 mb-4"><Plus className="w-5 h-5 text-slate-400" /> Assign / Update Policy</h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Employee</label>
            <select value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <option value="">Select…</option>
              {allUsers.map((u) => <option key={u.employeeId} value={u.employeeId}>{u.name} ({u.employeeId})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Provider</label>
            <input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="Star Health" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Policy No.</label>
            <input value={form.policyNumber} onChange={(e) => setForm({ ...form, policyNumber: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Coverage (₹)</label>
            <input type="number" value={form.coverage} onChange={(e) => setForm({ ...form, coverage: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Expiry</label>
            <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
          </div>
          <button type="submit" disabled={saving} className="sm:col-span-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2">
            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save Policy'}
          </button>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="font-display font-semibold text-slate-800 text-base flex items-center gap-2 mb-4"><CheckCircle2 className="w-5 h-5 text-slate-400" /> Pending Claims ({pendingClaims.length})</h3>
        {pendingClaims.length === 0 ? (
          <p className="text-xs text-slate-400">No pending claims.</p>
        ) : (
          <div className="space-y-2">
            {pendingClaims.map((c) => (
              <div key={c.id} className="flex items-center justify-between border border-slate-100 rounded-lg p-3">
                <div>
                  <div className="text-xs font-semibold text-slate-700">{c.employeeId} — {c.description}</div>
                  <div className="text-[10px] text-slate-400">₹{Number(c.amount).toLocaleString('en-IN')} · {new Date(c.date).toLocaleDateString()}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleClaim(c.employeeId, c.id, 'Approved')} className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-emerald-600 cursor-pointer"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleClaim(c.employeeId, c.id, 'Rejected')} className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-rose-600 cursor-pointer"><XCircle className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="font-display font-semibold text-slate-800 text-base flex items-center gap-2 mb-4"><ShieldCheck className="w-5 h-5 text-slate-400" /> All Policies</h3>
        {loading ? (
          <p className="text-xs text-slate-400">Loading…</p>
        ) : policies.length === 0 ? (
          <p className="text-xs text-slate-400">No policies assigned yet.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100">
                <th className="pb-2 font-semibold">Employee</th>
                <th className="pb-2 font-semibold">Provider</th>
                <th className="pb-2 font-semibold">Coverage</th>
                <th className="pb-2 font-semibold">Used</th>
                <th className="pb-2 font-semibold">Expiry</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((p) => (
                <tr key={p.id} className="border-b border-slate-50">
                  <td className="py-2 font-mono text-slate-600">{p.employeeId}</td>
                  <td className="py-2 text-slate-700">{p.provider}</td>
                  <td className="py-2 text-slate-700">₹{Number(p.coverage || 0).toLocaleString('en-IN')}</td>
                  <td className="py-2 text-slate-700">₹{Number(p.claimUsed || 0).toLocaleString('en-IN')}</td>
                  <td className="py-2 text-slate-500">{p.expiryDate || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
