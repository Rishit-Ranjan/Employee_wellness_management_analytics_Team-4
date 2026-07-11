import { useState } from 'react';
import { Activity, TrendingUp, Lightbulb, Smile, BarChart3, LogOut, Search,Plus, X, ShieldAlert, AlertCircle, Check, Sparkles, Dumbbell, Apple, Brain, Clock } from 'lucide-react';

export function HealthDataModule({ records, onAddRecord }) {
    const [search, setSearch] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    // Form states
    const [name, setName] = useState('');
    const [dept, setDept] = useState('');
    const [bmi, setBmi] = useState('');
    const [bp, setBp] = useState('');
    const [exercise, setExercise] = useState('');
    const [sleep, setSleep] = useState('');
    const [stress, setStress] = useState('');
    const filtered = records.filter(r => {
        const employeeName = String(r?.employeeName ?? '');
        const employeeId = String(r?.employeeId ?? '');
        const matchSearch =
            employeeName.toLowerCase().includes(search.toLowerCase()) ||
            employeeId.toLowerCase().includes(search.toLowerCase());

        const matchDept = filterDept ? r?.department === filterDept : true;
        return matchSearch && matchDept;
    });
    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (!name || !bp)
            return;
        // Derive simple assessments based on inputs
        const calculatedBmi = Number(bmi);
        let assessment = 'Good';
        const [sys] = bp.split('/').map(Number);
        if (stress === 'High' || sys >= 140 || calculatedBmi >= 30) {
            assessment = 'Needs Attention';
        }
        else if (stress === 'Low' && calculatedBmi < 25 && calculatedBmi >= 18.5 && Number(sleep) >= 7) {
            assessment = 'Excellent';
        }
        else if (Number(sleep) < 6) {
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
        setDept('');
        setBmi('');
        setBp('');
        setExercise('');
        setSleep('');
        setStress('');
    };

    return (<div className="space-y-6">
      {/* Search & Action bar */}
      <div className="bg-[#0a0a0a] p-4.5 rounded-xl border border-[#1a1a1a] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"/>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-[#111] border border-[#262626] focus:border-[#444] rounded-lg text-xs text-white placeholder-[#3f3f46] outline-none transition-all"/>
          </div>

          {/* Department Filter */}
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="w-full sm:w-44 px-3.5 py-2.5 bg-[#111] border border-[#262626] focus:border-[#444] rounded-lg text-xs text-white outline-none transition-all cursor-pointer">
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Sales">Sales</option>
            <option value="Marketing">Marketing</option>
            <option value="Product">Product</option>
            <option value="Operations">Operations</option>
          </select>
        </div>

        <button onClick={() => setIsAddOpen(true)} className="w-full md:w-auto px-5 py-2.5 bg-white hover:bg-[#e4e4e7] text-black text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer">
          <Plus className="w-4 h-4 text-black"/>
          Add Health Profile
        </button>
      </div>

      {/* Add Record Modal Popup */}
      {isAddOpen && (<div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#0a0a0a] rounded-2xl border border-[#1a1a1a] w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="bg-[#111] border-b border-[#1a1a1a] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-white"/>
                <h3 className="font-display font-medium text-sm text-white">Add New Employee Health Record</h3>
              </div>
              <button onClick={() => setIsAddOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-[#52525b] uppercase tracking-wider mb-1.5">Employee Full Name</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3.5 py-2.5 bg-[#111] border border-[#262626] focus:border-[#444] rounded-lg text-xs text-white outline-none"/>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#52525b] uppercase tracking-wider mb-1.5">Department</label>
                  <select value={dept} onChange={(e) => setDept(e.target.value)} className="w-full px-3.5 py-2.5 bg-[#111] border border-[#262626] rounded-lg text-xs text-white outline-none">
                    <option value="Engineering">Engineering</option>
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Product">Product</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#52525b] uppercase tracking-wider mb-1.5">BMI Value</label>
                  <input type="number" step="0.1" required value={bmi} onChange={(e) => setBmi(e.target.value)} className="w-full px-3.5 py-2.5 bg-[#111] border border-[#262626] focus:border-[#444] rounded-lg text-xs text-white outline-none"/>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#52525b] uppercase tracking-wider mb-1.5">Blood Pressure</label>
                  <input type="text" required value={bp} onChange={(e) => setBp(e.target.value)} className="w-full px-3.5 py-2.5 bg-[#111] border border-[#262626] focus:border-[#444] rounded-lg text-xs text-white outline-none"/>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#52525b] uppercase tracking-wider mb-1.5">Exercise (Hours/wk)</label>
                  <input type="number" step="0.5" required value={exercise} onChange={(e) => setExercise(e.target.value)} className="w-full px-3.5 py-2.5 bg-[#111] border border-[#262626] focus:border-[#444] rounded-lg text-xs text-white outline-none"/>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#52525b] uppercase tracking-wider mb-1.5">Sleep (Hours/night)</label>
                  <input type="number" step="0.5" required value={sleep} onChange={(e) => setSleep(e.target.value)} className="w-full px-3.5 py-2.5 bg-[#111] border border-[#262626] focus:border-[#444] rounded-lg text-xs text-white outline-none"/>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#52525b] uppercase tracking-wider mb-1.5">Self-Reported Stress</label>
                  <select value={stress} onChange={(e) => setStress(e.target.value)} className="w-full px-3.5 py-2.5 bg-[#111] border border-[#262626] rounded-lg text-xs text-white outline-none">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-5 border-t border-[#1a1a1a]">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-4.5 py-2.5 bg-[#111] hover:bg-[#1c1c1e] text-[#a1a1aa] text-xs font-semibold rounded-lg transition-colors border border-[#262626]">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-white hover:bg-[#e4e4e7] text-black text-xs font-semibold rounded-lg transition-all">
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* Health records Table */}
      <div className="bg-[#0a0a0a] rounded-xl border border-[#1a1a1a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-[#a1a1aa]">
            <thead className="bg-[#0d0d0d] text-[10px] font-bold text-[#52525b] uppercase tracking-wider border-b border-[#1a1a1a]">
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
            <tbody className="divide-y divide-[#1a1a1a]">
              {filtered.length === 0 ? (<tr>
                  <td colSpan={8} className="text-center py-10 text-[#52525b] font-mono">
                    No records found matching filters.
                  </td>
                </tr>) : (filtered.map((record) => (<tr key={record.id} className="hover:bg-[#111]/30 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-white">
                      <div>{record.employeeName}</div>
                      <div className="text-[10px] text-[#52525b] font-mono mt-0.5">{record.employeeId}</div>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-300 font-medium">{record.department}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold font-mono text-white">{record.bmi}</span>
                      <span className="text-[10px] text-[#71717a] ml-1.5 font-mono">
                        {record.bmi >= 30 ? 'Obese' : record.bmi >= 25 ? 'Overweight' : 'Normal'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold font-mono text-[#a1a1aa]">{record.bloodPressure}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold font-mono text-zinc-300">{record.exerciseHoursPerWeek} hrs</span>
                        <span className="text-[#262626]">|</span>
                        <span className="font-semibold font-mono text-zinc-300">{record.sleepHoursPerNight} hrs</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${record.stressLevel === 'Low' ? 'bg-[#12241b] border border-[#1d4d31] text-emerald-300' :
                record.stressLevel === 'Medium' ? 'bg-[#2e2312] border border-[#5e4219] text-amber-300' :
                    'bg-[#241212] border border-[#4d1d1d] text-red-300'}`}>
                        {record.stressLevel}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${record.healthAssessment === 'Excellent' ? 'bg-[#12241b] text-emerald-300 border border-[#1d4d31]' :
                record.healthAssessment === 'Good' ? 'bg-[#131d2b] text-indigo-300 border border-[#1e2f47]' :
                    record.healthAssessment === 'Fair' ? 'bg-[#2e2312] text-amber-300 border border-[#5e4219]' :
                        'bg-[#241212] text-red-300 border border-[#4d1d1d]'}`}>
                        {record.healthAssessment}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-[10px] text-[#52525b]">{record.lastUpdated}</td>
                  </tr>)))}
            </tbody>
          </table>
        </div>
      </div>
    </div>);
}

export function RiskPredictionModule({ risks }) {
    const [filter, setFilter] = useState('ALL');
    const highCount = risks.filter(r => r.riskScore >= 70).length;
    const mediumCount = risks.filter(r => r.riskScore >= 45 && r.riskScore < 70).length;
    const lowCount = risks.filter(r => r.riskScore < 45).length;
    const filteredRisks = risks.filter(r => {
        if (filter === 'HIGH')
            return r.riskScore >= 70;
        if (filter === 'MEDIUM')
            return r.riskScore >= 45 && r.riskScore < 70;
        if (filter === 'LOW')
            return r.riskScore < 45;
        return true;
    });
    return (<div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div onClick={() => setFilter('HIGH')} className={`bg-[#0a0a0a] border p-4.5 rounded-xl cursor-pointer transition-all hover:bg-[#111]/30 ${filter === 'HIGH' ? 'border-red-500 bg-red-950/10' : 'border-[#1a1a1a] hover:border-red-500/30'}`}>
          <div className="flex justify-between items-start text-zinc-500">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">High Severity</span>
            <ShieldAlert className="w-4 h-4 text-red-500"/>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-display font-light text-white">{highCount}</span>
            <span className="text-[10px] text-red-400 font-mono font-medium">Score ≥ 70%</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2 font-light">Critical risk indicators. Immediate clinical review or stress PTO mandated.</p>
        </div>

        <div onClick={() => setFilter('MEDIUM')} className={`bg-[#0a0a0a] border p-4.5 rounded-xl cursor-pointer transition-all hover:bg-[#111]/30 ${filter === 'MEDIUM' ? 'border-amber-500 bg-amber-950/10' : 'border-[#1a1a1a] hover:border-amber-500/30'}`}>
          <div className="flex justify-between items-start text-zinc-500">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Moderate Severity</span>
            <AlertCircle className="w-4 h-4 text-amber-500"/>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-display font-light text-white">{mediumCount}</span>
            <span className="text-[10px] text-amber-400 font-mono font-medium">Score 45-69%</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2 font-light font-sans">Elevated stress triggers. Guided meditation and ergonomic desk updates advised.</p>
        </div>

        <div onClick={() => setFilter('LOW')} className={`bg-[#0a0a0a] border p-4.5 rounded-xl cursor-pointer transition-all hover:bg-[#111]/30 ${filter === 'LOW' ? 'border-emerald-500 bg-emerald-950/10' : 'border-[#1a1a1a] hover:border-emerald-500/30'}`}>
          <div className="flex justify-between items-start text-zinc-500">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Low Severity</span>
            <Check className="w-4 h-4 text-emerald-500"/>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-display font-light text-white">{lowCount}</span>
            <span className="text-[10px] text-emerald-400 font-mono font-medium">Score &lt; 45%</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2 font-light">Healthy baseline. Maintain current lifestyle routines and claim fitness rewards.</p>
        </div>
      </div>

      <div className="bg-[#0a0a0a] p-3 rounded-xl border border-[#1a1a1a] flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-zinc-400 font-medium pl-2">Filter risk records by clinical severity:</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setFilter('ALL')} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${filter === 'ALL'
            ? 'bg-white text-black font-bold shadow-md'
            : 'bg-[#111] hover:bg-[#1c1c1e] text-[#a1a1aa] border border-[#262626]'}`}>
            All Risks ({risks.length})
          </button>
          <button onClick={() => setFilter('HIGH')} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${filter === 'HIGH'
            ? 'bg-red-500/20 border border-red-500 text-red-300 font-bold'
            : 'bg-[#111] hover:bg-[#1c1c1e] text-[#a1a1aa] border border-[#262626]'}`}>
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"/>
            High ({highCount})
          </button>
          <button onClick={() => setFilter('MEDIUM')} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${filter === 'MEDIUM'
            ? 'bg-amber-500/20 border border-amber-500 text-amber-300 font-bold'
            : 'bg-[#111] hover:bg-[#1c1c1e] text-[#a1a1aa] border border-[#262626]'}`}>
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"/>
            Moderate ({mediumCount})
          </button>
          <button onClick={() => setFilter('LOW')} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${filter === 'LOW'
            ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300 font-bold'
            : 'bg-[#111] hover:bg-[#1c1c1e] text-[#a1a1aa] border border-[#262626]'}`}>
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"/>
            Low ({lowCount})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRisks.length === 0 ? (<div className="col-span-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-10 text-center font-mono text-xs text-[#52525b]">
            No employees found under the selected {filter.toLowerCase()} severity category.
          </div>) : (filteredRisks.map((risk) => {
            const isHigh = risk.riskScore >= 70;
            const isMedium = risk.riskScore >= 45 && risk.riskScore < 70;
            return (<div key={risk.employeeId} className={`bg-[#0a0a0a] rounded-xl border p-5 space-y-4 relative overflow-hidden transition-all hover:border-[#333] ${isHigh ? 'border-red-500/30' : isMedium ? 'border-amber-500/30' : 'border-emerald-500/20'}`}>
                <div className={`absolute top-0 left-0 w-full h-1 ${isHigh ? 'bg-red-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'}`}/>

                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-white">{risk.employeeName}</h4>
                    <span className="text-[10px] text-[#52525b] font-mono">ID: {risk.employeeId}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${isHigh ? 'bg-red-950/40 text-red-300 border border-red-800' :
                    isMedium ? 'bg-amber-950/40 text-amber-300 border border-amber-800' :
                        'bg-emerald-950/40 text-emerald-300 border border-emerald-800'}`}>
                      {isHigh ? 'High Severity' : isMedium ? 'Moderate Severity' : 'Low Severity'}
                    </span>
                    <span className="text-[9px] text-[#71717a] font-mono">
                      Category: {risk.riskType}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-[#71717a]">Risk Intensity Index:</span>
                    <span className={`font-bold font-mono ${isHigh ? 'text-red-400' : isMedium ? 'text-amber-400' : 'text-emerald-400'}`}>{risk.riskScore}%</span>
                  </div>
                  <div className="w-full bg-[#1a1a1a] h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${isHigh ? 'bg-red-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${risk.riskScore}%` }}/>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-[#52525b] uppercase tracking-widest font-mono">Triggers Detected</div>
                  <div className="flex flex-wrap gap-1.5">
                    {risk.factors.map((factor, idx) => (<span key={idx} className="px-2 py-0.5 bg-[#111] border border-[#262626] text-[#a1a1aa] text-[10px] rounded-md font-medium">
                        {factor}
                      </span>))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#1a1a1a] space-y-1.5">
                  <div className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-white"/>
                    Prescribed Action
                  </div>
                  <p className="text-[11px] text-[#71717a] leading-relaxed font-light font-sans">
                    {risk.recommendationAction}
                  </p>
                </div>
              </div>);
        }))}
      </div>
    </div>);
}
export function RecommendationModule({ recommendations }) {
    return (<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {recommendations.map((rec) => {
            const Icon = rec.category === 'Fitness' ? Dumbbell :
                rec.category === 'Diet' ? Apple :
                    rec.category === 'Mental Wellness' ? Brain : Clock;
            return (<div key={rec.id} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 flex flex-col justify-between space-y-4 hover:border-[#333] transition-colors">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-[#111] border border-[#262626] rounded-xl text-white">
                  <Icon className="w-5 h-5"/>
                </div>
                <span className="px-2.5 py-0.5 bg-[#111] border border-[#262626] text-zinc-300 text-[10px] font-bold uppercase rounded-md">
                  {rec.category}
                </span>
              </div>

              <div>
                <h4 className="font-display font-medium text-base text-white">{rec.title}</h4>
                <p className="text-[#71717a] text-xs mt-1.5 leading-relaxed font-light">{rec.description}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#1a1a1a] flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="block text-[9px] font-semibold text-[#52525b] uppercase tracking-wider">Assigned Schedule</span>
                <span className="text-xs text-white font-mono font-bold">{rec.schedule}</span>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="block text-[9px] font-semibold text-[#52525b] uppercase tracking-wider">Duration</span>
                <span className="text-xs text-white font-bold font-mono">{rec.durationWeeks} Weeks</span>
              </div>
            </div>
          </div>);
        })}
    </div>);
}
export function SentimentModule({ sentimentList }) {
    return (<div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sentimentList.map((sent) => (<div key={sent.department} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-[#1a1a1a]">
              <h4 className="font-display font-semibold text-white">{sent.department} Department Sentiment</h4>
              <span className="text-[10px] text-[#52525b] font-semibold font-mono">Pulse Count: {sent.recentFeedbackCount}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-[#a1a1aa]">
                  <span className="flex items-center gap-1.5"><Smile className="w-4 h-4 text-emerald-500"/> Positive</span>
                  <span className="font-mono font-bold text-emerald-400">{sent.sentimentDistribution.positive}%</span>
                </div>
                <div className="w-full bg-[#1a1a1a] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${sent.sentimentDistribution.positive}%` }}/>
                </div>

                <div className="flex items-center justify-between text-xs text-[#a1a1aa]">
                  <span className="flex items-center gap-1.5"><Smile className="w-4 h-4 text-zinc-500"/> Neutral</span>
                  <span className="font-mono font-bold text-zinc-400">{sent.sentimentDistribution.neutral}%</span>
                </div>
                <div className="w-full bg-[#1a1a1a] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-zinc-500 h-full rounded-full" style={{ width: `${sent.sentimentDistribution.neutral}%` }}/>
                </div>

                <div className="flex items-center justify-between text-xs text-[#a1a1aa]">
                  <span className="flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-red-500"/> Stress distress</span>
                  <span className="font-mono font-bold text-red-400">{sent.sentimentDistribution.negative}%</span>
                </div>
                <div className="w-full bg-[#1a1a1a] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-red-500 h-full rounded-full" style={{ width: `${sent.sentimentDistribution.negative}%` }}/>
                </div>
              </div>

              <div className="p-4 bg-[#111] border border-[#262626] rounded-xl flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-[#52525b] uppercase tracking-wider mb-1 font-mono">Stress index</span>
                <span className={`text-4xl font-display font-bold ${sent.averageStressScore >= 7 ? 'text-red-400' : sent.averageStressScore >= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>{sent.averageStressScore}</span>
                <span className="text-[9px] text-[#52525b] font-mono mt-1">Scale 1-10</span>
                
                <span className={`mt-3 px-2.5 py-0.5 text-[9px] font-bold rounded-md ${sent.averageStressScore >= 7
                ? 'bg-[#241212] text-red-300 border border-[#4d1d1d]'
                : 'bg-[#12241b] text-emerald-300 border border-[#1d4d31]'}`}>
                  {sent.averageStressScore >= 7 ? 'Needs Review' : 'Optimal Zone'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-[10px] font-bold text-[#52525b] uppercase tracking-widest font-mono">Logged Feedback Issues</span>
              <ul className="space-y-1">
                {sent.keyIssues.map((issue, idx) => (<li key={idx} className="text-xs text-[#71717a] font-light flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#444] rounded-full shrink-0"/>
                    {issue}
                  </li>))}
              </ul>
            </div>
          </div>))}
      </div>
    </div>);
}
export function PerformanceDashboard({ kpis, records }) {
    return (<div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#0a0a0a] rounded-xl border border-[#1a1a1a] p-5 space-y-3">
          <div className="flex justify-between items-center text-[#52525b]">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Participation Rate</span>
            <Activity className="w-4 h-4"/>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-display font-light text-white">{kpis.participationRate}%</span>
            <span className="text-[10px] text-emerald-500 font-mono">Target 80%</span>
          </div>
          <div className="w-full bg-[#1a1a1a] h-1 rounded-full overflow-hidden">
            <div className="bg-white h-full rounded-full" style={{ width: `${kpis.participationRate}%` }}/>
          </div>
        </div>

        <div className="bg-[#0a0a0a] rounded-xl border border-[#1a1a1a] p-5 space-y-3">
          <div className="flex justify-between items-center text-[#52525b]">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Absenteeism Rate</span>
            <TrendingUp className="w-4 h-4"/>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-display font-light text-white">{kpis.absenteeismRate}%</span>
            <span className="text-[10px] text-zinc-500 font-mono">Industry 4.5%</span>
          </div>
          <div className="w-full bg-[#1a1a1a] h-1 rounded-full overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(100, kpis.absenteeismRate * 10)}%` }}/>
          </div>
        </div>

        <div className="bg-[#0a0a0a] rounded-xl border border-[#1a1a1a] p-5 space-y-3">
          <div className="flex justify-between items-center text-[#52525b]">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Workforce Risk</span>
            <ShieldAlert className="w-4 h-4"/>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-display font-light text-white">{kpis.overallHealthRiskScore}%</span>
            <span className="text-[10px] text-emerald-500 font-mono">Ideal &lt; 20%</span>
          </div>
          <div className="w-full bg-[#1a1a1a] h-1 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${kpis.overallHealthRiskScore}%` }}/>
          </div>
        </div>

        <div className="bg-[#0a0a0a] rounded-xl border border-[#1a1a1a] p-5 space-y-3">
          <div className="flex justify-between items-center text-[#52525b]">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Effectiveness</span>
            <Smile className="w-4 h-4"/>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-display font-light text-white">{kpis.programEffectiveness}%</span>
            <span className="text-[10px] text-emerald-500 font-mono">Satisfied</span>
          </div>
          <div className="w-full bg-[#1a1a1a] h-1 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${kpis.programEffectiveness}%` }}/>
          </div>
        </div>
      </div>

      <div className="bg-[#0a0a0a] p-6 rounded-xl border border-[#1a1a1a] space-y-4">
        <h4 className="font-display font-semibold text-white">Health Vitals Scatter Overview</h4>
        <p className="text-[#52525b] text-xs font-light">Real-time clustering of employee metrics (Sleep vs. Exercise hours per week).</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 pt-2">
          {records.map(r => (<div key={r.id} className="p-4 bg-[#111] border border-[#262626] rounded-xl space-y-2 text-center transition-all hover:border-[#333]">
              <div className="w-1.5 h-1.5 bg-[#e0e0e0] rounded-full mx-auto"/>
              <div className="font-semibold text-xs text-white truncate">{r.employeeName}</div>
              <div className="text-[9px] font-bold text-[#52525b] uppercase tracking-wider font-mono">{r.department}</div>
              <div className="grid grid-cols-2 gap-1 text-[10px] font-mono bg-[#050505] p-2 rounded border border-[#262626] mt-2">
                <div>
                  <span className="block text-[8px] text-[#52525b] uppercase font-sans">Sleep</span>
                  <span className="font-bold text-white">{r.sleepHoursPerNight}h</span>
                </div>
                <div>
                  <span className="block text-[8px] text-[#52525b] uppercase font-sans">Fit</span>
                  <span className="font-bold text-white">{r.exerciseHoursPerWeek}h</span>
                </div>
              </div>
            </div>))}
        </div>
      </div>
    </div>);
}
export default function AdminDashboard({ user, onLogout, healthRecords, risks, recommendations, sentimentList, kpis, onAddHealthRecord }) {
    const [activeTab, setActiveTab] = useState(1);
    return (<div className="min-h-screen bg-[#050505] text-[#e0e0e0] flex flex-col font-sans">
      {/* Platform Header */}
      <header className="bg-[#0a0a0a] border-b border-[#1a1a1a] text-white px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <div className="w-4 h-4 bg-black rounded-sm rotate-45"></div>
          </div>
          <div>
            <span className="font-display font-bold text-lg tracking-tight block text-white leading-tight">Employee Wellness Management Analytics</span>
            <span className="text-[10px] text-[#71717a] font-bold tracking-widest uppercase font-mono">Wellness Intelligence</span>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center justify-between md:justify-end gap-5">
          <div className="flex items-center gap-3 text-right">
            <div className="hidden sm:block text-right mr-3">
              <span className="block text-sm font-semibold text-white leading-tight">{user.name}</span>
              <span className="inline-block mt-1 px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-[#a1a1aa] text-[9px] font-mono font-bold rounded uppercase tracking-widest leading-none">
                Administrator
              </span>
            </div>
            {user.avatarUrl ? (<img src={user.avatarUrl} alt={user.name} referrerPolicy="no-referrer" className="w-9 h-9 rounded-full border border-[#262626] shadow-md object-cover"/>) : (<div className="w-9 h-9 rounded-full bg-[#111] border border-[#262626] flex items-center justify-center font-bold text-sm text-white">
{String(user?.name ?? '').substring(0, 2).toUpperCase() || 'AD'}
              </div>)}
          </div>

          <div className="h-8 w-px bg-[#1a1a1a] hidden sm:block"/>

          <button onClick={onLogout} className="flex items-center gap-2 px-3.5 py-1.5 bg-[#111] hover:bg-[#241212] border border-[#262626] hover:border-[#4d1d1d] rounded-lg text-xs font-semibold text-[#71717a] hover:text-red-300 transition-all cursor-pointer">
            <LogOut className="w-4 h-4"/>
            Logout
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-72 bg-[#0a0a0a] border-b lg:border-b-0 lg:border-r border-[#1a1a1a] p-5 space-y-5 shrink-0 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-auto">
          <div className="text-[10px] font-bold text-[#52525b] uppercase tracking-widest px-3">
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
            return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full text-left p-3.5 rounded-lg flex items-start gap-3.5 transition-all cursor-pointer border ${isActive
                    ? 'bg-[#111] border-[#262626] text-white'
                    : 'hover:bg-[#111]/40 border-transparent text-[#71717a]'}`}>
                  <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${isActive ? 'text-white' : 'text-[#52525b]'}`}/>
                  <div>
                    <div className="text-xs font-bold">{tab.label}</div>
                    <div className="text-[10px] text-[#52525b] mt-0.5 line-clamp-1">{tab.desc}</div>
                  </div>
                </button>);
        })}
          </nav>

          {/* Quick Stats sidebar widget */}
          <div className="pt-6 border-t border-[#1a1a1a] hidden lg:block">
            <div className="bg-[#111] border border-[#262626] rounded-xl p-4.5 relative overflow-hidden">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 font-mono">Health Index</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-display font-light text-white">88%</span>
                <span className="text-[10px] text-emerald-500 font-semibold font-mono">↑ 4%</span>
              </div>
              <div className="w-full bg-[#262626] h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-white h-full rounded-full" style={{ width: '88%' }}/>
              </div>
              <p className="text-[10px] text-[#52525b] mt-2.5 leading-relaxed font-sans">Synced in real-time with health records.</p>
            </div>
          </div>
        </aside>

        {/* Module Content Stage */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* Active module display card header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1a1a1a] pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#111] border border-[#262626] rounded-md text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wide mb-3">
                {`Module ${activeTab} of 5`}
              </div>
              <h1 className="font-display text-3xl font-light text-white tracking-tight">
                {activeTab === 1 && 'Employee Health Data Management'}
                {activeTab === 2 && 'Wellness Risk Prediction'}
                {activeTab === 3 && 'Personalized Wellness Recommendation System'}
                {activeTab === 4 && 'Mental Health & Sentiment Analytics'}
                {activeTab === 5 && 'Wellness Performance Dashboard & Analytics'}
              </h1>
              <p className="text-[#71717a] text-sm mt-2 max-w-2xl font-light">
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
            {activeTab === 1 && (<HealthDataModule records={healthRecords} onAddRecord={onAddHealthRecord}/>)}
            
            {activeTab === 2 && (<RiskPredictionModule risks={risks}/>)}
            
            {activeTab === 3 && (<RecommendationModule recommendations={recommendations}/>)}
            
            {activeTab === 4 && (<SentimentModule sentimentList={sentimentList}/>)}
            
            {activeTab === 5 && (<PerformanceDashboard kpis={kpis} records={healthRecords}/>)}
          </div>
        </main>
      </div>
    </div>);
}
