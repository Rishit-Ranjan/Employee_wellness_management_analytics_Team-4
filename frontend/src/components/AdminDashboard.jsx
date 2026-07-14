import React, { useState } from 'react';
import {
  Activity, TrendingUp, Lightbulb, Smile, BarChart3, LogOut,
  Search, Plus, X, ShieldAlert, AlertCircle, Check, Sparkles, Dumbbell, Apple, Brain, Clock
} from 'lucide-react';

import {personalRecommendations, sentimentData} from '../types'

// ==========================================
// MODULE 1: EMPLOYEE HEALTH DATA MANAGEMENT
// ==========================================
export function HealthDataModule({ records, onAddRecord  }) {
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [dept, setDept] = useState('Engineering');
  const [bmi, setBmi] = useState('22.5');
  const [bp, setBp] = useState('120/80');
  const [exercise, setExercise] = useState('3.5');
  const [sleep, setSleep] = useState('7');
  const [stress, setStress] = useState('Medium');

  const filtered = records.filter(r => {
    const matchSearch = r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
                        r.employeeId.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept ? r.department === filterDept : true;
    return matchSearch && matchDept;
  });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!name || !bp) return;

    // Derive simple assessments based on inputs
    const calculatedBmi = Number(bmi); 
    let assessment = 'Good';
    const [sys, dia] = bp.split('/').map(Number);

    if (stress === 'High' || sys >= 140 || calculatedBmi >= 30) {
      assessment = 'Needs Attention';
    } else if (stress === 'Low' && calculatedBmi < 25 && calculatedBmi >= 18.5 && Number(sleep) >= 7) {
      assessment = 'Excellent';
    } else if (Number(sleep) < 6) {
      assessment = 'Fair';
    }

    const newRec = {
      id: `hr-${Date.now()}`,
      employeeId: `emp-${100 + records.length + 1}`,
      employeeName: name,
      department: dept,
      bmi: calculatedBmi,
      bloodPressure: bp,
      exerciseHoursPerWeek: Number(exercise),
      sleepHoursPerNight: Number(sleep),
      stressLevel: stress,
      healthAssessment: assessment,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    onAddRecord(newRec);
    setIsAddOpen(false);

    // Reset Form
    setName('');
    setBmi('22.5');
    setBp('120/80');
    setExercise('3.5');
    setSleep('7');
    setStress('Medium');
  };

  return (
    <div className="space-y-6">
      {/* Search & Action bar */}
      <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg text-xs text-slate-800 placeholder-slate-400 outline-none transition-all"
            />
          </div>

          {/* Department Filter */}
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="w-full sm:w-44 px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg text-xs text-slate-800 outline-none transition-all cursor-pointer"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Sales">Sales</option>
            <option value="Marketing">Marketing</option>
            <option value="Product">Product</option>
            <option value="Operations">Operations</option>
          </select>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="w-full md:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4 text-white" />
          Add Health Profile
        </button>
      </div>

      {/* Add Record Modal Popup */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-slate-800" />
                <h3 className="font-display font-semibold text-sm text-slate-800">Add New Employee Health Record</h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Employee Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rachel Adams"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg text-xs text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Department</label>
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Product">Product</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">BMI Value</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={bmi}
                    onChange={(e) => setBmi(e.target.value)}
                    placeholder="23.5"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg text-xs text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Blood Pressure</label>
                  <input
                    type="text"
                    required
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    placeholder="120/80"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg text-xs text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Exercise (Hours/wk)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={exercise}
                    onChange={(e) => setExercise(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg text-xs text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sleep (Hours/night)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={sleep}
                    onChange={(e) => setSleep(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg text-xs text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Self-Reported Stress</label>
                  <select
                    value={stress}
                    onChange={(e) => setStress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-all shadow-sm"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Health records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-600">
            <thead className="bg-slate-50/70 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-4">Employee</th>
                <th className="px-5 py-4">Department</th>
                <th className="px-5 py-4">BMI</th>
                <th className="px-5 py-4">BP Vitals</th>
                <th className="px-5 py-4">Exercise / Sleep</th>
                <th className="px-5 py-4">Stress Level</th>
                <th className="px-5 py-4">Status Index</th>
                <th className="px-5 py-4 text-right">Last Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 font-mono">
                    No records found matching filters.
                  </td>
                </tr>
              ) : (
                filtered.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      <div>{record.employeeName}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{record.employeeId}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">{record.department}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold font-mono text-slate-850">{record.bmi}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                        {record.bmi >= 30 ? 'Obese' : record.bmi >= 25 ? 'Overweight' : 'Normal'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold font-mono text-slate-500">{record.bloodPressure}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold font-mono text-slate-600">{record.exerciseHoursPerWeek} hrs</span>
                        <span className="text-slate-200">|</span>
                        <span className="font-semibold font-mono text-slate-600">{record.sleepHoursPerNight} hrs</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        record.stressLevel === 'Low' ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' :
                        record.stressLevel === 'Medium' ? 'bg-amber-50 border border-amber-100 text-amber-700' :
                        'bg-red-50 border border-red-100 text-red-700'
                      }`}>
                        {record.stressLevel}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        record.healthAssessment === 'Excellent' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        record.healthAssessment === 'Good' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                        record.healthAssessment === 'Fair' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        {record.healthAssessment}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-[10px] text-slate-400">{record.lastUpdated}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MODULE 2: WELLNESS RISK PREDICTION
// ==========================================
export function RiskPredictionModule({ risks  }) {
  const [filter, setFilter] = useState('ALL');

  const highCount = risks.filter(r => r.riskScore >= 70).length;
  const mediumCount = risks.filter(r => r.riskScore >= 45 && r.riskScore < 70).length;
  const lowCount = risks.filter(r => r.riskScore < 45).length;

  const filteredRisks = risks.filter(r => {
    if (filter === 'HIGH') return r.riskScore >= 70;
    if (filter === 'MEDIUM') return r.riskScore >= 45 && r.riskScore < 70;
    if (filter === 'LOW') return r.riskScore < 45;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => setFilter('HIGH')}
          className={`bg-white border p-4.5 rounded-xl cursor-pointer transition-all hover:bg-slate-50/50 shadow-sm ${
            filter === 'HIGH' ? 'border-red-400 bg-red-50/50' : 'border-slate-200 hover:border-red-300'
          }`}
        >
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">High Severity</span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-display font-semibold text-slate-800">{highCount}</span>
            <span className="text-[10px] text-red-600 font-mono font-bold">Score ≥ 70%</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-light">Critical risk indicators. Immediate clinical review or stress PTO mandated.</p>
        </div>

        <div
          onClick={() => setFilter('MEDIUM')}
          className={`bg-white border p-4.5 rounded-xl cursor-pointer transition-all hover:bg-slate-50/50 shadow-sm ${
            filter === 'MEDIUM' ? 'border-amber-400 bg-amber-50/50' : 'border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Moderate Severity</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-display font-semibold text-slate-800">{mediumCount}</span>
            <span className="text-[10px] text-amber-600 font-mono font-bold">Score 45-69%</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-light font-sans">Elevated stress triggers. Guided meditation and ergonomic desk updates advised.</p>
        </div>

        <div
          onClick={() => setFilter('LOW')}
          className={`bg-white border p-4.5 rounded-xl cursor-pointer transition-all hover:bg-slate-50/50 shadow-sm ${
            filter === 'LOW' ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Low Severity</span>
            <Check className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-display font-semibold text-slate-800">{lowCount}</span>
            <span className="text-[10px] text-emerald-600 font-mono font-bold">Score &lt; 45%</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-light">Healthy baseline. Maintain current lifestyle routines and claim fitness rewards.</p>
        </div>
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <span className="text-xs text-slate-500 font-medium pl-2">Filter risk records by clinical severity:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              filter === 'ALL'
                ? 'bg-slate-900 text-white font-bold shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            All Risks ({risks.length})
          </button>
          <button
            onClick={() => setFilter('HIGH')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
              filter === 'HIGH'
                ? 'bg-red-50 border border-red-300 text-red-700 font-bold'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            High ({highCount})
          </button>
          <button
            onClick={() => setFilter('MEDIUM')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
              filter === 'MEDIUM'
                ? 'bg-amber-50 border border-amber-300 text-amber-700 font-bold'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
            Moderate ({mediumCount})
          </button>
          <button
            onClick={() => setFilter('LOW')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
              filter === 'LOW'
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-700 font-bold'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            Low ({lowCount})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRisks.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-xl p-10 text-center font-mono text-xs text-slate-400 shadow-sm">
            No employees found under the selected {filter.toLowerCase()} severity category.
          </div>
        ) : (
          filteredRisks.map((risk) => {
            const isHigh = risk.riskScore >= 70;
            const isMedium = risk.riskScore >= 45 && risk.riskScore < 70;

            return (
              <div
                key={risk.employeeId}
                className={`bg-white rounded-xl border p-5 space-y-4 relative overflow-hidden transition-all hover:border-slate-300 shadow-sm ${
                  isHigh ? 'border-red-200' : isMedium ? 'border-amber-200' : 'border-emerald-150'
                }`}
              >
                <div className={`absolute top-0 left-0 w-full h-1 ${
                  isHigh ? 'bg-red-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />

                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-slate-800">{risk.employeeName}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">ID</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                      isHigh ? 'bg-red-50 text-red-700 border border-red-100' :
                      isMedium ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}>
                      {isHigh ? 'High Severity' : isMedium ? 'Moderate Severity' : 'Low Severity'}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      Category
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-slate-500">Risk Intensity Index:</span>
                    <span className={`font-bold font-mono ${
                      isHigh ? 'text-red-600' : isMedium ? 'text-amber-600' : 'text-emerald-600'
                    }`}>{risk.riskScore}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${
                      isHigh ? 'bg-red-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} style={{ width: `${risk.riskScore}%` }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Triggers Detected</div>
                  <div className="flex flex-wrap gap-1.5">
                    {risk.factors.map((factor, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 text-[10px] rounded-md font-medium">
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    Prescribed Action
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-light font-sans">
                    {risk.recommendationAction}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ==========================================
// MODULE 3: PERSONALIZED RECOMMENDATIONS
// ==========================================
export function RecommendationModule({ recommendations = [] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {recommendations.length === 0 ? (
        <div className="col-span-full bg-white border border-slate-200 rounded-xl p-10 text-center font-mono text-xs text-slate-400 shadow-sm">
          No recommendations available at this time.
        </div>
      ) : (
        recommendations.map((rec) => {
        const Icon = rec.category === 'Fitness' ? Dumbbell :
                     rec.category === 'Diet' ? Apple :
                     rec.category === 'Mental Wellness' ? Brain : Clock;

        return (
          <div key={rec.id} className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase rounded-md">
                  {rec.category}
                </span>
              </div>

              <div>
                <h4 className="font-display font-semibold text-base text-slate-800">{rec.title}</h4>
                <p className="text-slate-500 text-xs mt-1.5 leading-relaxed font-light">{rec.description}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Assigned Schedule</span>
                <span className="text-xs text-slate-800 font-mono font-bold">{rec.schedule}</span>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Duration</span>
                <span className="text-xs text-slate-800 font-bold font-mono">{rec.durationWeeks} Weeks</span>
              </div>
            </div>
          </div>
        );
      })
      )}
    </div>
  );
}

// ==========================================
// MODULE 4: MENTAL HEALTH & SENTIMENT
// ==========================================
export function SentimentModule({ sentimentList  }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sentimentList.map((sent) => (
          <div key={sent.department} className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-sm">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h4 className="font-display font-semibold text-slate-800">{sent.department} Department Sentiment</h4>
              <span className="text-[10px] text-slate-400 font-bold font-mono">Pulse Count</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><Smile className="w-4 h-4 text-emerald-500" /> Positive</span>
                  <span className="font-mono font-bold text-emerald-600">{sent.sentimentDistribution.positive}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${sent.sentimentDistribution.positive}%` }} />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><Smile className="w-4 h-4 text-slate-400" /> Neutral</span>
                  <span className="font-mono font-bold text-slate-500">{sent.sentimentDistribution.neutral}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-slate-400 h-full rounded-full" style={{ width: `${sent.sentimentDistribution.neutral}%` }} />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-rose-500" /> Stress distress</span>
                  <span className="font-mono font-bold text-rose-600">{sent.sentimentDistribution.negative}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${sent.sentimentDistribution.negative}%` }} />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Stress index</span>
                <span className={`text-4xl font-display font-bold ${
                  sent.averageStressScore >= 7 ? 'text-rose-600' : sent.averageStressScore >= 5 ? 'text-amber-600' : 'text-emerald-600'
                }`}>{sent.averageStressScore}</span>
                <span className="text-[9px] text-slate-400 font-mono mt-1">Scale 1-10</span>

                <span className={`mt-3 px-2.5 py-0.5 text-[9px] font-bold rounded-md ${
                  sent.averageStressScore >= 7
                    ? 'bg-rose-50 text-rose-700 border border-rose-100'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}>
                  {sent.averageStressScore >= 7 ? 'Needs Review' : 'Optimal Zone'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Logged Feedback Issues</span>
              <ul className="space-y-1">
                {sent.keyIssues.map((issue, idx) => (
                  <li key={idx} className="text-xs text-slate-500 font-light flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// MODULE 5: PERFORMANCE & KPI DASHBOARD
// ==========================================
export function PerformanceDashboard({ kpis, records  }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Participation Rate</span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-display font-semibold text-slate-800">{kpis.participationRate}%</span>
            <span className="text-[10px] text-emerald-600 font-mono font-bold">Target 80%</span>
          </div>
          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${kpis.participationRate}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Absenteeism Rate</span>
            <TrendingUp className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-display font-semibold text-slate-800">{kpis.absenteeismRate}%</span>
            <span className="text-[10px] text-slate-500 font-mono font-bold">Industry 4.5%</span>
          </div>
          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(100, kpis.absenteeismRate * 10)}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Workforce Risk</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-display font-semibold text-slate-800">{kpis.overallHealthRiskScore}%</span>
            <span className="text-[10px] text-emerald-600 font-mono font-bold">Ideal &lt; 20%</span>
          </div>
          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${kpis.overallHealthRiskScore}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Effectiveness</span>
            <Smile className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-display font-semibold text-slate-800">{kpis.programEffectiveness}%</span>
            <span className="text-[10px] text-emerald-600 font-mono font-bold">Satisfied</span>
          </div>
          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${kpis.programEffectiveness}%` }} />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h4 className="font-display font-semibold text-slate-800">Health Vitals Scatter Overview</h4>
        <p className="text-slate-400 text-xs font-light">Real-time clustering of employee metrics (Sleep vs. Exercise hours per week).</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 pt-2">
          {records.map(r => (
            <div key={r.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-center transition-all hover:border-slate-300 shadow-xs">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mx-auto" />
              <div className="font-semibold text-xs text-slate-800 truncate">{r.employeeName}</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">{r.department}</div>
              <div className="grid grid-cols-2 gap-1 text-[10px] font-mono bg-white p-2 rounded border border-slate-150 mt-2">
                <div>
                  <span className="block text-[8px] text-slate-400 uppercase font-sans">Sleep</span>
                  <span className="font-bold text-slate-700">{r.sleepHoursPerNight}h</span>
                </div>
                <div>
                  <span className="block text-[8px] text-slate-400 uppercase font-sans">Fit</span>
                  <span className="font-bold text-slate-700">{r.exerciseHoursPerWeek}h</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// CORE COMPONENT: ADMIN DASHBOARD
// ==========================================
export default function AdminDashboard({ user,
  onLogout,
  healthRecords,
  risks,  
  recommendations = personalRecommendations,
  sentimentList,
  kpis,
  onAddHealthRecord
 }) {
  const [activeTab, setActiveTab] = useState(1);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Platform Header */}
      <header className="bg-white border-b border-slate-200 text-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
          </div>
          <div>
            <span className="font-display font-bold text-lg tracking-tight block text-slate-900 leading-tight">Employee Wellness Management Analytics</span>
            <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase font-mono">Wellness Intelligence</span>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center justify-between md:justify-end gap-5">
          <div className="flex items-center gap-3 text-right">
            <div className="hidden sm:block text-right mr-3">
              <span className="block text-sm font-semibold text-slate-850 leading-tight">{user.name}</span>
              <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 text-[9px] font-mono font-bold rounded uppercase tracking-widest leading-none">
                Administrator
              </span>
            </div>
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full border border-slate-200 shadow-md object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-sm text-slate-700">
                {user.name.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg text-xs font-semibold text-slate-500 hover:text-red-600 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row">

        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-72 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-5 space-y-5 shrink-0">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3">
            Wellness Modules
          </div>

          <nav className="space-y-1">
            {[
              { id: 1, label: 'Health Data Manager', icon: Activity, desc: 'BMI, medical, habits database' },
              { id: 2, label: 'Wellness Risk Prediction', icon: TrendingUp, desc: 'AI burnout & vitals risk scores' },
              { id: 3, label: 'Personalized Recommender', icon: Lightbulb, desc: 'Fitness, diets, wellness schedules' },
              { id: 4, label: 'Sentiment & Mental Health', icon: Smile, desc: 'Anonymized stress tracker' },
              { id: 5, label: 'Performance Analytics', icon: BarChart3, desc: 'Absenteeism & wellness KPIs' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left p-3.5 rounded-lg flex items-start gap-3.5 transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-indigo-50 border-indigo-100 text-indigo-900 font-semibold'
                      : 'hover:bg-slate-50 border-transparent text-slate-500'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-xs font-bold">{tab.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{tab.desc}</div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Quick Stats sidebar widget */}
          <div className="pt-6 border-t border-slate-100 hidden lg:block">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 relative overflow-hidden">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Health Index</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-display font-light text-slate-800">88%</span>
                <span className="text-[10px] text-emerald-600 font-semibold font-mono">↑ 4%</span>
              </div>
              <div className="w-full bg-slate-200 h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: '88%' }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-2.5 leading-relaxed font-sans">Synced in real-time with health records.</p>
            </div>
          </div>
        </aside>

        {/* Module Content Stage */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* Active module display card header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md text-[10px] font-bold text-indigo-700 uppercase tracking-wide mb-3">
                {`Module ${activeTab} of 5`}
              </div>
              <h1 className="font-display text-3xl font-light text-slate-900 tracking-tight">
                {activeTab === 1 && 'Employee Health Data Management'}
                {activeTab === 2 && 'Wellness Risk Prediction'}
                {activeTab === 3 && 'Personalized Wellness Recommendation System'}
                {activeTab === 4 && 'Mental Health & Sentiment Analytics'}
                {activeTab === 5 && 'Wellness Performance Dashboard & Analytics'}
              </h1>
              <p className="text-slate-500 text-sm mt-2 max-w-2xl font-light">
                {activeTab === 1 && 'Database logs for tracking key metrics including BMI, medical stats, sleep, and lifestyle routines.'}
                {activeTab === 2 && 'Machine learning assessments predicting health risks, cardiovascular issues, or stress burnout.'}
                {activeTab === 3 && 'Tailored, evidence-based fitness routines, diet schedules, and mental wellbeing recommendations.'}
                {activeTab === 4 && 'NLP-driven departmental stress analytics collected through fully anonymized feedback pulse-checks.'}
                {activeTab === 5 && 'High-level HR dashboard displaying team participation rates, absenteeism counters, and program efficacy.'}
              </p>
            </div>
          </div>

          {/* Render Active Tab Component */}
          <div className="animate-fadeIn">
            {activeTab === 1 && (
              <HealthDataModule
                records={healthRecords}
                onAddRecord={onAddHealthRecord}
              />
            )}

            {activeTab === 2 && (
              <RiskPredictionModule risks={risks} />
            )}

            {activeTab === 3 && (
              <RecommendationModule recommendations={personalRecommendations} />
            )}

            {activeTab === 4 && (
              <SentimentModule sentimentList={sentimentData} />
            )}

            {activeTab === 5 && (
              <PerformanceDashboard kpis={kpis} records={healthRecords} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
