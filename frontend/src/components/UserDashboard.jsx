import  { useState, useEffect, useRef } from 'react';
import { User as UserIcon, Lightbulb, Bot, X, LogOut, Dumbbell, Apple, Brain, Clock, HeartPulse, Sparkles, Check, ShieldAlert, AlertCircle, Smile, Send } from 'lucide-react';

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
export function ChatbotModule({ user, isFloating = false }) {
    const [messages, setMessages] = useState(() => [
        {
            id: '1',
            sender: 'bot',
            text: `Hello ${user.name}! I am your AI Wellness Chatbot Assistant. Ask me anything about exercise schedules, diet rules, stress management, or how to reduce workplace burnout!`,
            timestamp: '22:56'
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputText.trim())
            return;
        const userMsg = {
            id: `user-${Date.now()}`,
            sender: 'user',
            text: inputText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);
        // Simulate AI wellness reasoning answering
        setTimeout(() => {
            let reply = "That is a great wellness inquiry! Implementing consistent 7-8 hour sleep schedules and introducing low-GI meals is scientifically proven to reduce cardiovascular risks and increase mental agility by up to 20% in high-pressure workplaces.";
            const query = inputText.toLowerCase();
            if (query.includes('sleep') || query.includes('tired') || query.includes('rest')) {
                reply = "Getting under 6 hours of sleep dramatically spikes blood pressure and fatigue. I highly recommend our 'Digital Sabbatical Routine' — turning off all work communications precisely 1 hour before sleeping to stimulate natural melatonin production.";
            }
            else if (query.includes('stress') || query.includes('burnout') || query.includes('anxiety')) {
                reply = "High stress compromises decision-making and leads to workplace burnout. You should allocate 10 minutes every morning at 9:00 AM for our 'Diaphragmatic Breathing Program' to regulate stress triggers instantly.";
            }
            else if (query.includes('diet') || query.includes('food') || query.includes('eat')) {
                reply = "Optimizing nutrition stabilizes your workplace energy indexes! A strong recommendation is adopting a low-glycemic dietary fuel schedule, packing meals with high protein and healthy fats to prevent blood glucose crashes.";
            }
            else if (query.includes('exercise') || query.includes('workout') || query.includes('fit')) {
                reply = "Even 1.5 hours of physical activity per week makes a massive difference. Try incorporating 3 zone-2 cardio elliptical or brisk walking sessions per week, which lowers systolic pressure efficiently.";
            }
            const botMsg = {
                id: `bot-${Date.now()}`,
                sender: 'bot',
                text: reply,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);
        }, 1200);
    };
    return (<div className={`bg-[#0a0a0a] flex flex-col overflow-hidden ${isFloating ? 'h-full border-none rounded-none shadow-none' : 'border border-[#1a1a1a] rounded-xl h-[520px] shadow-2xl'}`}>
      
      {/* Bot Header info */}
      {!isFloating && (<div className="p-4 bg-[#0d0d0d] border-b border-[#1a1a1a] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black font-bold">
              <Bot className="w-4 h-4 text-black"/>
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5 text-white">
                Wellness Intelligent Agent
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/>
              </div>
              <div className="text-[10px] text-[#52525b] font-mono">Continuous Learning Active</div>
            </div>
          </div>
        </div>)}

      {/* Messages viewport */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#050505]">
        {messages.map((msg) => {
            const isBot = msg.sender === 'bot';
            return (<div key={msg.id} className={`flex gap-3.5 max-w-[85%] ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold select-none ${isBot ? 'bg-zinc-800 text-white' : 'bg-white text-black'}`}>
                {isBot ? <Bot className="w-4 h-4"/> : <UserIcon className="w-4 h-4"/>}
              </div>
              
              <div className="space-y-1">
                <div className={`p-3.5 rounded-xl text-xs leading-relaxed font-medium ${isBot
                    ? 'bg-[#111] border border-[#262626] text-white shadow-xs rounded-tl-none'
                    : 'bg-white text-black rounded-tr-none'}`}>
                  {msg.text}
                </div>
                <span className={`block text-[9px] font-mono text-[#52525b] ${isBot ? 'text-left' : 'text-right'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>);
        })}

        {/* Typing indicator */}
        {isTyping && (<div className="flex gap-3.5 max-w-[85%] mr-auto">
            <div className="w-7 h-7 rounded-full bg-[#111] border border-[#262626] flex items-center justify-center text-white shrink-0">
              <Bot className="w-4.5 h-4.5"/>
            </div>
            <div className="bg-[#111] border border-[#262626] text-[#71717a] p-3.5 rounded-xl rounded-tl-none text-xs flex items-center gap-1.5 shadow-xs">
              <span>Agent is thinking</span>
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
              </span>
            </div>
          </div>)}
        <div ref={scrollRef}/>
      </div>

      {/* Input Form field */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-[#1a1a1a] flex gap-2.5 bg-[#0a0a0a] shrink-0">
        <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} className="flex-1 px-4 py-2.5 bg-[#111] border border-[#262626] focus:border-[#444] rounded-lg text-xs text-white placeholder-[#3f3f46] outline-none transition-all"/>
        <button type="submit" className="px-4 py-2.5 bg-white text-black hover:bg-[#e4e4e7] rounded-lg flex items-center justify-center transition-colors cursor-pointer">
          <Send className="w-4 h-4 text-black"/>
        </button>
      </form>
    </div>);
}
export function UserProfileModule({ user, records, onUpdateRecord, onAddSentimentPulse }) {
    const userEmpId = `user-emp-${user.id}`;
    const userRecord = records.find(r => r.employeeId === userEmpId) || {
        id: `hr-user-${user.id}`,
        employeeId: userEmpId,
        employeeName: user.name,
        department: '',
        bmi: 0,
        bloodPressure: '',
        exerciseHoursPerWeek: 0,
        sleepHoursPerNight: 0,
        stressLevel: '',
        healthAssessment: '',
        lastUpdated: ''
    };
    const [dept, setDept] = useState(userRecord.department);
    const [bmi, setBmi] = useState(String(userRecord.bmi));
    const [bp, setBp] = useState(userRecord.bloodPressure);
    const [exercise, setExercise] = useState(String(userRecord.exerciseHoursPerWeek));
    const [sleep, setSleep] = useState(String(userRecord.sleepHoursPerNight));
    const [stress, setStress] = useState(userRecord.stressLevel);
    const [showSyncSuccess, setShowSyncSuccess] = useState(false);
    const [waterCups, setWaterCups] = useState(() => {
        const val = localStorage.getItem(`water_${user.id}`);
        return val ? Number(val) : 0;
    });
    const [stepsCount, setStepsCount] = useState(() => {
        const val = localStorage.getItem(`steps_${user.id}`);
        return val ? Number(val) : 4200;
    });
    const [mood, setMood] = useState(() => {
        return localStorage.getItem(`mood_${user.id}`) || 'Good';
    });
    const [streakDays, setStreakDays] = useState(() => {
        const val = localStorage.getItem(`streak_${user.id}`);
        return val ? Number(val) : 3;
    });
    const [pulseStress, setPulseStress] = useState(5);
    const [pulseFeedback, setPulseFeedback] = useState('');
    const [pulseSubmitted, setPulseSubmitted] = useState(false);
    const handleUpdateProfile = (e) => {
        e.preventDefault();
        const calculatedBmi = Number(bmi) || 22;
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
        const updated = {
            ...userRecord,
            department: dept,
            bmi: calculatedBmi,
            bloodPressure: bp,
            exerciseHoursPerWeek: Number(exercise) || 0,
            sleepHoursPerNight: Number(sleep) || 0,
            stressLevel: stress,
            healthAssessment: assessment,
            lastUpdated: new Date().toISOString().split('T')[0]
        };
        onUpdateRecord(updated);
        setShowSyncSuccess(true);
        setTimeout(() => setShowSyncSuccess(false), 3000);
    };
    const updateWater = (change) => {
        const newVal = Math.max(0, waterCups + change);
        setWaterCups(newVal);
        localStorage.setItem(`water_${user.id}`, String(newVal));
    };
    const handleStepsChange = (e) => {
        const val = Number(e.target.value);
        setStepsCount(val);
        localStorage.setItem(`steps_${user.id}`, String(val));
    };
    const handleMoodSelect = (selectedMood) => {
        setMood(selectedMood);
        localStorage.setItem(`mood_${user.id}`, selectedMood);
        // Only update streak if it's a new day or a specific condition is met,
        // to avoid impure function call during render.
        // For a real app, this would involve checking the last update date.
        const nextStreak = streakDays + 1; // Simplified for prototype
        setStreakDays(nextStreak);
        localStorage.setItem(`streak_${user.id}`, String(nextStreak));

    };
    const handlePulseSubmit = (e) => {
        e.preventDefault();
        onAddSentimentPulse(dept, pulseStress, pulseFeedback);
        setPulseSubmitted(true);
        setPulseFeedback('');
        setTimeout(() => setPulseSubmitted(false), 4000);
    };
    let riskScore = 20;
    const factors = [];
    const [sys, dia] = bp.split('/').map(Number);
    if (stress === 'High') {
        riskScore += 35;
        factors.push('High self-reported stress');
    }
    if (Number(sleep) < 6) {
        riskScore += 25;
        factors.push('Insufficient rest hours');
    }
    if (Number(bmi) >= 30) {
        riskScore += 25;
        factors.push('Obese BMI range');
    }
    if (sys >= 140 || dia >= 90) {
        riskScore += 30;
        factors.push('Elevated systolic/diastolic blood pressure');
    }
    if (Number(exercise) < 2) {
        riskScore += 15;
        factors.push('Low weekly physical activity');
    }
    riskScore = Math.min(100, riskScore);
    return (<div className="space-y-8 pb-10">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-7 bg-[#0a0a0a] rounded-xl border border-[#1a1a1a] p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-[#1a1a1a] pb-4">
            <HeartPulse className="w-5 h-5 text-zinc-400"/>
            <h3 className="font-display font-medium text-white text-base">Self-Reported Health Vitals</h3>
          </div>
          
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-[#52525b] uppercase tracking-wider mb-1.5">My Department</label>
                <select value={dept} onChange={(e) => setDept(e.target.value)} className="w-full px-3.5 py-2.5 bg-[#111] border border-[#262626] rounded-lg text-xs text-white outline-none cursor-pointer">
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Product">Product</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#52525b] uppercase tracking-wider mb-1.5">My Body Mass Index (BMI)</label>
                <input type="number" step="0.1" required value={bmi} onChange={(e) => setBmi(e.target.value)} className="w-full px-3.5 py-2.5 bg-[#111] border border-[#262626] focus:border-[#444] rounded-lg text-xs text-white outline-none"/>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#52525b] uppercase tracking-wider mb-1.5">Blood Pressure</label>
                <input type="text" required value={bp} onChange={(e) => setBp(e.target.value)} className="w-full px-3.5 py-2.5 bg-[#111] border border-[#262626] focus:border-[#444] rounded-lg text-xs text-white outline-none"/>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#52525b] uppercase tracking-wider mb-1.5">Self-Reported Stress</label>
                <select value={stress} onChange={(e) => setStress(e.target.value)} className="w-full px-3.5 py-2.5 bg-[#111] border border-[#262626] rounded-lg text-xs text-white outline-none cursor-pointer">
                  <option value="Low">Low Stress</option>
                  <option value="Medium">Medium Stress</option>
                  <option value="High">High Stress</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#52525b] uppercase tracking-wider mb-1.5">Sleep (Hours/Night)</label>
                <input type="number" step="0.5" required value={sleep} onChange={(e) => setSleep(e.target.value)} className="w-full px-3.5 py-2.5 bg-[#111] border border-[#262626] focus:border-[#444] rounded-lg text-xs text-white outline-none"/>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#52525b] uppercase tracking-wider mb-1.5">Exercise (Hours/Week)</label>
                <input type="number" step="0.5" required value={exercise} onChange={(e) => setExercise(e.target.value)} className="w-full px-3.5 py-2.5 bg-[#111] border border-[#262626] focus:border-[#444] rounded-lg text-xs text-white outline-none"/>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#1a1a1a]">
              <span className="text-[10px] text-[#52525b] font-mono">Last Synchronized: {userRecord.lastUpdated}</span>
              <button type="submit" className="px-5 py-2.5 bg-white text-black hover:bg-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-md">
                <Sparkles className="w-4 h-4"/>
                Sync & Save Vitals
              </button>
            </div>
          </form>

          {showSyncSuccess && (<div className="bg-emerald-950/20 border border-emerald-500/40 p-3 rounded-lg text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn font-medium font-sans">
              <Check className="w-4 h-4 text-emerald-400 shrink-0"/>
              Your personal wellness record has been updated! Changes have propagated to all performance dashboards.
            </div>)}
        </div>

        <div className="lg:col-span-5 bg-[#0a0a0a] rounded-xl border border-[#1a1a1a] p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-zinc-400"/>
                <h3 className="font-display font-medium text-white text-base">Your Health Diagnostics</h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${riskScore >= 70 ? 'bg-red-950/40 text-red-300 border border-red-800' :
            riskScore >= 45 ? 'bg-amber-950/40 text-amber-300 border border-amber-800' :
                'bg-emerald-950/40 text-emerald-300 border border-emerald-800'}`}>
                {riskScore >= 70 ? 'High Burnout Risk' : riskScore >= 45 ? 'Elevated Stress' : 'Balanced Vitals'}
              </span>
            </div>

            <div className="bg-[#111] p-4.5 rounded-xl border border-[#262626] flex items-center justify-between">
              <div>
                <div className="text-[10px] text-zinc-400 font-bold uppercase font-mono tracking-wider">Burnout Intensity Index</div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className={`text-4xl font-display font-light ${riskScore >= 70 ? 'text-red-400' : riskScore >= 45 ? 'text-amber-400' : 'text-emerald-400'}`}>{riskScore}%</span>
                  <span className="text-[10px] text-zinc-600 font-mono">Computed Live</span>
                </div>
              </div>
              <div className="w-24 bg-[#0a0a0a] h-2 rounded-full overflow-hidden border border-[#262626]">
                <div className={`h-full rounded-full ${riskScore >= 70 ? 'bg-red-500' : riskScore >= 45 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${riskScore}%` }}/>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[9px] font-bold text-[#52525b] uppercase tracking-widest font-mono">Contributing Risk Factors:</div>
              {factors.length === 0 ? (<div className="text-xs text-[#a1a1aa] font-light flex items-center gap-1.5 py-1">
                  <Check className="w-4 h-4 text-emerald-400"/>
                  All parameters verified within optimal ranges. Maintain active lifestyle!
                </div>) : (<div className="flex flex-wrap gap-1.5">
                  {factors.map((f, i) => (<span key={i} className="px-2 py-0.5 bg-[#111] border border-red-950 text-red-300/80 text-[9px] rounded-md font-mono">
                      {f}
                    </span>))}
                </div>)}
            </div>
          </div>

          <div className="pt-4 border-t border-[#1a1a1a]">
            {riskScore >= 70 ? (<div className="p-3 bg-red-950/20 border border-red-900/50 rounded-lg text-xs text-red-300 font-light flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5"/>
                <div>
                  <strong className="font-semibold block mb-0.5 text-white">PTO Advisory Triggered!</strong>
                  Your sleep metrics and reported stress indicate severe physical fatigue. We recommend taking advantage of your department's wellness PTO benefits immediately.
                </div>
              </div>) : riskScore >= 45 ? (<div className="p-3 bg-amber-950/20 border border-amber-900/50 rounded-lg text-xs text-amber-300 font-light flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"/>
                <div>
                  <strong className="font-semibold block mb-0.5 text-white">Elevated Baseline Stress Detected</strong>
                  Try incorporating our 10-minute daily breathing exercises and taking micro-breaks during long engineering sprints to normalize cortisol indicators.
                </div>
              </div>) : (<div className="p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-lg text-xs text-emerald-300 font-light flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/>
                <div>
                  <strong className="font-semibold block mb-0.5 text-white">Vitals Optimal</strong>
                  Excellent habits! Your exercise levels and nightly resting intervals place you in the low-risk tier. Enjoy your active fitness benefits package.
                </div>
              </div>)}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-[#0a0a0a] rounded-xl border border-[#1a1a1a] p-5 flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start text-[#52525b]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Daily Water Intake</span>
              <h4 className="text-white font-semibold text-sm mt-1">Hydration Index</h4>
            </div>
            <Apple className="w-4 h-4 text-sky-400"/>
          </div>

          <div className="text-center py-2 space-y-2">
            <div className="text-3xl font-display font-light text-white">{waterCups} / 8</div>
            <div className="text-[10px] text-zinc-500 font-mono">Cups logged today (Target 8)</div>
            <div className="w-full bg-[#111] h-1.5 rounded-full overflow-hidden border border-[#262626]">
              <div className="bg-sky-400 h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (waterCups / 8) * 100)}%` }}/>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => updateWater(-1)} className="flex-1 py-1.5 bg-[#111] border border-[#262626] rounded-lg text-xs font-semibold text-zinc-400 hover:text-white transition-all cursor-pointer">
              - 1 Cup
            </button>
            <button onClick={() => updateWater(1)} className="flex-1 py-1.5 bg-sky-950/40 border border-sky-800 text-sky-300 hover:bg-sky-950/60 rounded-lg text-xs font-bold transition-all cursor-pointer">
              + 1 Cup
            </button>
          </div>
        </div>

        <div className="bg-[#0a0a0a] rounded-xl border border-[#1a1a1a] p-5 flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start text-[#52525b]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Step Counter</span>
              <h4 className="text-white font-semibold text-sm mt-1">Active Movement</h4>
            </div>
            <Dumbbell className="w-4 h-4 text-emerald-400"/>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-3xl font-display font-light text-white">{stepsCount.toLocaleString()}</span>
              <span className="text-[10px] text-zinc-500 font-mono">/ 10,000 steps</span>
            </div>
            <input type="range" min="0" max="15000" step="500" value={stepsCount} onChange={handleStepsChange} className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-[#111] rounded-lg border border-[#262626]"/>
            <p className="text-[9px] text-[#52525b] text-center font-mono leading-none">Use slider to adjust step count metrics</p>
          </div>

          <div className="text-[10px] text-zinc-400 font-mono text-center">
            {stepsCount >= 10000 ? '🎉 Daily Step Target Unlocked!' : `${(10000 - stepsCount).toLocaleString()} steps remaining to achieve daily fitness rewards.`}
          </div>
        </div>

        <div className="bg-[#0a0a0a] rounded-xl border border-[#1a1a1a] p-5 flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start text-[#52525b]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Streak & Mood Logger</span>
              <h4 className="text-white font-semibold text-sm mt-1">Mental Health Check</h4>
            </div>
            <span className="text-xs text-amber-400 font-mono font-bold flex items-center gap-0.5">
              🔥 {streakDays}-Day Streak
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-mono font-bold">Today's Mood:</span>
            <div className="grid grid-cols-5 gap-1.5">
              {[
            { label: '🔋', name: 'Energetic' },
            { label: '🌸', name: 'Calm' },
            { label: '☕', name: 'Tired' },
            { label: '⚡', name: 'Stressed' },
            { label: '📉', name: 'Burned' },
        ].map((m) => (<button key={m.name} onClick={() => handleMoodSelect(m.name)} title={m.name} className={`py-2 text-base rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${mood === m.name
                ? 'bg-zinc-800 border-zinc-500 scale-105'
                : 'bg-[#111] border-[#262626] hover:border-[#444]'}`}>
                  <span>{m.label}</span>
                </button>))}
            </div>
            <div className="text-center text-[10px] text-zinc-400 font-mono">
              Currently logged: <span className="font-bold text-white">{mood}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#52525b] border-t border-[#1a1a1a] pt-3.5">
            <Clock className="w-3.5 h-3.5 shrink-0"/>
            Daily streak increases as you log moods daily.
          </div>
        </div>

      </div>

      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-4">
          <div className="flex items-center gap-2">
            <Smile className="w-5 h-5 text-zinc-400"/>
            <h3 className="font-display font-medium text-white text-base">Submit Anonymized Departmental Pulse Check</h3>
          </div>
          <span className="bg-red-950/20 text-red-300 border border-red-900/60 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider font-mono">
            Fully Encrypted & Anonymized
          </span>
        </div>

        <p className="text-zinc-400 text-xs font-light max-w-3xl leading-relaxed">
          Your feedback is critical to assessing team wellness trends. By submitting, your raw answers are compiled into aggregated departmental metrics to maintain 100% identity protection. Your submitted scores will immediately update the <strong>Sentiment & Mental Health tab charts</strong>.
        </p>

        <form onSubmit={handlePulseSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            
            <div className="md:col-span-1 space-y-2">
              <div className="flex justify-between text-xs">
                <label className="text-[10px] font-bold text-[#52525b] uppercase tracking-wider font-mono">My Stress Level (1-10)</label>
                <span className="font-bold text-white font-mono">{pulseStress}</span>
              </div>
              <input type="range" min="1" max="10" value={pulseStress} onChange={(e) => setPulseStress(Number(e.target.value))} className="w-full accent-white cursor-pointer h-1 bg-[#111] rounded-lg border border-[#262626]"/>
              <div className="flex justify-between text-[8px] text-zinc-600 font-mono">
                <span>Relaxed (1)</span>
                <span>Max Stress (10)</span>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-[#52525b] uppercase tracking-wider mb-2 font-mono">Issue Description / Feedback (Optional)</label>
              <input type="text" value={pulseFeedback} onChange={(e) => setPulseFeedback(e.target.value)} className="w-full px-3.5 py-2.5 bg-[#111] border border-[#262626] focus:border-[#444] rounded-lg text-xs text-white outline-none"/>
            </div>

            <div className="md:col-span-1">
              <button type="submit" className="w-full py-2.5 bg-white text-black hover:bg-zinc-200 rounded-lg text-xs font-bold transition-all cursor-pointer">
                Submit Secure Pulse Check
              </button>
            </div>

          </div>
        </form>

        {pulseSubmitted && (<div className="bg-emerald-950/20 border border-emerald-500/40 p-4 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0"/>
            <div>
              <strong className="font-semibold block mb-0.5 text-white">Anonymized Pulse Registered!</strong>
              Your feedback stress metrics and key issues have been securely processed. Check out the <strong>Sentiment & Mental Health</strong> tab to view updated department charts.
            </div>
          </div>)}
      </div>

    </div>);
}
export default function UserDashboard({ user, onLogout, healthRecords, onUpdateUserRecord, onUpdateSentimentPulse, recommendations, themeToggle }) {
    const [activeTab, setActiveTab] = useState(7);
    const [isChatOpen, setIsChatOpen] = useState(false);
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
                Employee
              </span>
            </div>
            {user.avatarUrl ? (<img src={user.avatarUrl} alt={user.name} referrerPolicy="no-referrer" className="w-9 h-9 rounded-full border border-[#262626] shadow-md object-cover"/>) : (<div className="w-9 h-9 rounded-full bg-[#111] border border-[#262626] flex items-center justify-center font-bold text-sm text-white">
                {user.name.substring(0, 2).toUpperCase()}
              </div>)}
          </div>

          <div className="h-8 w-px bg-[#1a1a1a] hidden sm:block"/>

          {themeToggle}
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
            { id: 7, label: 'My Wellness Profile', icon: UserIcon, desc: 'Your health stats & personalized trackers' },
            { id: 3, label: 'Personalized Recommender', icon: Lightbulb, desc: 'Fitness, diets, wellness schedules' },
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
                {activeTab === 7 ? 'Self-Service Portal' : `Module ${activeTab} of 5`}
              </div>
              <h1 className="font-display text-3xl font-light text-white tracking-tight">
                {activeTab === 7 && 'My Personal Wellness Profile'}
                {activeTab === 3 && 'Personalized Wellness Recommendation System'}
              </h1>
              <p className="text-[#71717a] text-sm mt-2 max-w-2xl font-light">
                {activeTab === 7 && 'Manage your personal health vitals, track daily habits, and submit secure mental health feedback.'}
                {activeTab === 3 && 'Tailored, evidence-based fitness routines, diet schedules, and mental wellbeing recommendations.'}
              </p>
            </div>
          </div>

          {/* Render Active Tab Component */}
          <div className="animate-fadeIn">
            {activeTab === 7 && (<UserProfileModule user={user} records={healthRecords} onUpdateRecord={onUpdateUserRecord} onAddSentimentPulse={onUpdateSentimentPulse}/>)}

            {activeTab === 3 && (<RecommendationModule recommendations={recommendations}/>)}
          </div>
        </main>
      </div>

      {/* Floating AI Wellness Assistant Button and Popover (Only for User Module) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {isChatOpen && (<div className="w-[380px] sm:w-[420px] max-w-[calc(100vw-2rem)] h-[520px] shadow-2xl rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden flex flex-col transition-all duration-300 animate-fadeIn">
            {/* Header with Close button */}
            <div className="p-4 bg-[#0d0d0d] border-b border-[#1a1a1a] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black font-bold">
                  <Bot className="w-4 h-4 text-black"/>
                </div>
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5 text-white">
                    Wellness Intelligent Agent
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/>
                  </div>
                  <div className="text-[10px] text-[#52525b] font-mono">Continuous Learning Active</div>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="p-1.5 bg-[#161616] hover:bg-[#222] border border-[#262626] rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer">
                <X className="w-4 h-4"/>
              </button>
            </div>

            {/* Chatbot module body */}
            <div className="flex-1 overflow-hidden">
              <ChatbotModule user={user} isFloating={true}/>
            </div>
          </div>)}

        <button onClick={() => setIsChatOpen(!isChatOpen)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer hover:scale-105 active:scale-95 ${isChatOpen
            ? 'bg-[#161616] border border-[#262626] text-white'
            : 'bg-white text-black hover:bg-zinc-200'}`}>
          {isChatOpen ? (<X className="w-6 h-6 animate-fadeIn"/>) : (<div className="relative">
              <Bot className="w-6 h-6"/>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-black animate-pulse"/>
            </div>)}
        </button>
      </div>
    </div>);
}
