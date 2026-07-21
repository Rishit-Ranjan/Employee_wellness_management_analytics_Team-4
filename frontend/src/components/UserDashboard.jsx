import React, { useState, useEffect, useRef } from 'react';
import {
  User, Lightbulb, Bot, X, LogOut, UploadCloud,
  Dumbbell, Apple, Brain, Clock, HeartPulse, Sparkles, Check, ShieldAlert, AlertCircle, Smile, Send
} from 'lucide-react';


// ==========================================
// MODULE 3: PERSONALIZED RECOMMENDATIONS
// ==========================================
export function RecommendationModule({ recommendations, loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 bg-slate-200 rounded-xl" />
              <div className="h-4 w-16 bg-slate-200 rounded-md" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-5/6" />
            </div>
            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <div className="h-2 w-1/3 bg-slate-200 rounded" />
              <div className="h-2 w-1/2 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {recommendations && recommendations.length > 0 ? (
        recommendations.map((rec) => {
        const Icon = rec.category === 'Fitness' ? Dumbbell :
                     rec.category === 'Diet' ? Apple :
                     rec.category === 'Mental Wellness' ? Brain : Clock;

        return (
          <div key={rec.id} className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4 hover:border-indigo-200 shadow-sm transition-colors">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold uppercase rounded-md font-sans">
                  {rec.category}
                </span>
              </div>

              <div>
                <h4 className="font-display font-semibold text-base text-slate-800">{rec.title}</h4>
                <p className="text-slate-500 text-xs mt-1.5 leading-relaxed font-light">{rec.description}</p>
              </div>
            </div>

            {rec.reasons && rec.reasons.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Why this is recommended for you:</p>
                  <ul className="list-disc list-inside space-y-0.5 mt-1">
                  {rec.reasons.map((reason, i) => (
                    <li key={i} className="text-[10px] text-slate-500">{reason}</li>
                  ))}
                  </ul>
              </div>
            )}
          </div>
        );
      })
      ) : (
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-8 text-center">
            <div className="w-12 h-12 mx-auto bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <Check className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-slate-800 mt-4">All Clear!</h4>
            <p className="text-sm text-slate-500 mt-1">No specific wellness recommendations are needed at this time. Keep up the great work!</p>
        </div>
      )}
    </div>
  );
}

// ==========================================
// MODULE 6: AI WELLNESS CHATBOT
// ==========================================
export function ChatbotModule({ user, isFloating = false  }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    setMessages([
      { id: '1', sender: 'bot', text: `Hello ${user.name}! I am your AI Wellness Chatbot Assistant. Ask me anything about exercise schedules, diet rules, stress management, or how to reduce workplace burnout!`, timestamp: '22:56' }
    ]);
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

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
      } else if (query.includes('stress') || query.includes('burnout') || query.includes('anxiety')) {
        reply = "High stress compromises decision-making and leads to workplace burnout. You should allocate 10 minutes every morning at 9:00 AM for our 'Diaphragmatic Breathing Program' to regulate stress triggers instantly.";
      } else if (query.includes('diet') || query.includes('food') || query.includes('eat')) {
        reply = "Optimizing nutrition stabilizes your workplace energy indexes! A strong recommendation is adopting a low-glycemic dietary fuel schedule, packing meals with high protein and healthy fats to prevent blood glucose crashes.";
      } else if (query.includes('exercise') || query.includes('workout') || query.includes('fit')) {
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

  return (
    <div className={`bg-white flex flex-col overflow-hidden ${isFloating ? 'h-full border-none rounded-none shadow-none' : 'border border-slate-200 rounded-xl h-[520px] shadow-2xl'}`}>

      {/* Bot Header info */}
      {!isFloating && (
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5 text-slate-800 font-sans">
                Wellness Intelligent Agent
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Continuous Learning Active</div>
            </div>
          </div>
        </div>
      )}

      {/* Messages viewport */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50">
        {messages.map((msg) => {
          const isBot = msg.sender === 'bot';
          return (
            <div key={msg.id} className={`flex gap-3.5 max-w-[85%] ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold select-none ${
                isBot ? 'bg-slate-200 text-slate-600' : 'bg-indigo-100 text-indigo-700'
              }`}>
                {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div className="space-y-1">
                <div className={`p-3.5 rounded-xl text-xs leading-relaxed font-medium ${
                  isBot
                    ? 'bg-white border border-slate-200 text-slate-700 shadow-xs rounded-tl-none'
                    : 'bg-indigo-600 text-white rounded-tr-none shadow-xs'
                }`}>
                  {msg.text}
                </div>
                <span className={`block text-[9px] font-mono text-slate-400 ${isBot ? 'text-left' : 'text-right'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-3.5 max-w-[85%] mr-auto">
            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <div className="bg-white border border-slate-200 text-slate-400 p-3.5 rounded-xl rounded-tl-none text-xs flex items-center gap-1.5 shadow-xs">
              <span>Agent is thinking</span>
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Form field */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 flex gap-2.5 bg-white shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask about sleep schedule, burnout, fitness routine, nutrition..."
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-lg text-xs text-slate-700 placeholder-slate-400 outline-none transition-all"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </form>
    </div>
  );
}

// ==========================================
// MODULE 7: PERSONAL USER WELLNESS PROFILE
// ==========================================
export function UserProfileModule({ user, records, risks = [], onUpdateRecord, onAddRecord, onAddSentimentPulse,
  dailyHabits, onAddDailyHabit, onUpdateDailyHabit,
  mentalHealthLogs, onAddMentalHealthLog, onUpdateMentalHealthLog
}) {
  const userEmpId = user.employeeId; // Corrected to use actual employeeId
  const existingRecord = records.find(r => r.employeeId === user.employeeId); // Find existing record using correct employeeId
  const existingDailyHabit = dailyHabits.find(h => h.employeeId === user.employeeId);
  const existingMentalHealthLog = mentalHealthLogs.find(l => l.employeeId === user.employeeId);

  const initialUserRecord = existingRecord || { // Use existing record or fallback
    employeeId: user.employeeId, // Use correct employeeId for new records
    employeeName: user.name, // Corrected typo
    department: 'Engineering',
    age: '',
    gender: 'Male',
    heightCm: '',
    weightKg: '',
    bmi: '',
    bloodPressure: '',
    exerciseDaysPerWeek: '',
    stressLevel: 'Medium',
    stressScore: '',
    attendanceRate: '',
    medicalNotes: '',
    medicalCondition: 'No major condition',
    smoker: false,
    alcoholUse: false,
    glucoseLevel: '',
    exerciseHoursPerWeek: '',
    sleepHoursPerNight: '',
    // id is intentionally omitted here for new records; backend will assign _id
  };

  const [dept, setDept] = useState(initialUserRecord.department);
  const [age, setAge] = useState(String(initialUserRecord.age));
  const [gender, setGender] = useState(initialUserRecord.gender);
  const [heightCm, setHeightCm] = useState(String(initialUserRecord.heightCm));
  const [weightKg, setWeightKg] = useState(String(initialUserRecord.weightKg));
  const [bmi, setBmi] = useState(String(initialUserRecord.bmi));
  const [bp, setBp] = useState(initialUserRecord.bloodPressure);
  const [exerciseDaysPerWeek, setExerciseDaysPerWeek] = useState(String(initialUserRecord.exerciseDaysPerWeek));
  const [exercise, setExercise] = useState(String(initialUserRecord.exerciseHoursPerWeek));
  const [sleep, setSleep] = useState(String(initialUserRecord.sleepHoursPerNight));
  const [stress, setStress] = useState(initialUserRecord.stressLevel);
  const [stressScore, setStressScore] = useState(String(initialUserRecord.stressScore));
  const [attendanceRate, setAttendanceRate] = useState(String(initialUserRecord.attendanceRate));
  const [medicalNotes, setMedicalNotes] = useState(initialUserRecord.medicalNotes);
  const [medicalCondition, setMedicalCondition] = useState(initialUserRecord.medicalCondition);
  const [smoker, setSmoker] = useState(initialUserRecord.smoker);
  const [alcoholUse, setAlcoholUse] = useState(initialUserRecord.alcoholUse);
  const [glucoseLevel, setGlucoseLevel] = useState(String(initialUserRecord.glucoseLevel));

  // Effect to update form fields when the user's record changes (e.g., after initial load or admin update)
  useEffect(() => { // Re-evaluate initial form states if records or userEmpId changes
    const currentRecord = records.find(r => r.employeeId === user.employeeId);
    if (currentRecord) {
      setAge(String(currentRecord.age || ''));
      setGender(currentRecord.gender || 'Male');
      setHeightCm(String(currentRecord.heightCm || ''));
      setWeightKg(String(currentRecord.weightKg || ''));
      setDept(currentRecord.department);
      setBmi(String(currentRecord.bmi));
      setBp(currentRecord.bloodPressure);
      setExerciseDaysPerWeek(String(currentRecord.exerciseDaysPerWeek || ''));
      setExercise(String(currentRecord.exerciseHoursPerWeek));
      setSleep(String(currentRecord.sleepHoursPerNight));
      setStress(currentRecord.stressLevel);
      setStressScore(String(currentRecord.stressScore || ''));
      setAttendanceRate(String(currentRecord.attendanceRate || ''));
      setMedicalNotes(currentRecord.medicalNotes || '');
      setMedicalCondition(currentRecord.medicalCondition || 'No major condition');
      setSmoker(currentRecord.smoker || false);
      setAlcoholUse(currentRecord.alcoholUse || false);
      setGlucoseLevel(String(currentRecord.glucoseLevel || ''));
    }
  }, [records, user.employeeId]);

  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [isNewHealthRecord, setIsNewHealthRecord] = useState(!existingRecord); // Renamed for clarity
  const [error, setError] = useState(''); // State for form errors

  const [waterCups, setWaterCups] = useState(existingDailyHabit?.waterCups || 0);
  const [stepsCount, setStepsCount] = useState(existingDailyHabit?.stepsCount || 4200);
  const [mood, setMood] = useState(existingMentalHealthLog?.mood || 'Neutral');
  const [streakDays, setStreakDays] = useState(existingMentalHealthLog?.streakDays || 0);

  // Local states for pulse check
  const [pulseStress, setPulseStress] = useState(5);
  const [pulseFeedback, setPulseFeedback] = useState('');
  const [pulseSubmitted, setPulseSubmitted] = useState(false);
  
  // Clear success/error messages when the component mounts or user record changes
  useEffect(() => {
    setIsNewHealthRecord(!records.find(r => r.employeeId === user.employeeId)); // Re-evaluate if it's a new record
    setError('');
  }, [userEmpId]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const calculatedBmi = Number(bmi) || 22;
    let assessment = 'Good';
    const [sys, dia] = bp.split('/').map(Number);

    if (stress === 'High' || sys >= 140 || calculatedBmi >= 30) {
      assessment = 'Needs Attention';
    } else if (stress === 'Low' && calculatedBmi < 25 && calculatedBmi >= 18.5 && Number(sleep) >= 7) {
      assessment = 'Excellent';
    } else if (Number(sleep) < 6) {
      assessment = 'Fair';
    }

    const updated = {
      // Always include employeeId and employeeName, as they are part of the record structure
      employeeId: user.employeeId,
      employeeName: user.name,
      age: Number(age),
      gender: gender,
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      ...(existingRecord ? { id: existingRecord.id } : {}), // Only include 'id' if updating an existing record
      department: dept,
      bmi: calculatedBmi,
      bloodPressure: bp,
      exerciseDaysPerWeek: Number(exerciseDaysPerWeek),
      exerciseHoursPerWeek: Number(exercise) || 0,
      sleepHoursPerNight: Number(sleep) || 0,
      stressLevel: stress,
      stressScore: Number(stressScore),
      attendanceRate: Number(attendanceRate),
      medicalNotes: medicalNotes,
      medicalCondition: medicalCondition,
      smoker: smoker,
      alcoholUse: alcoholUse,
      glucoseLevel: Number(glucoseLevel),
      healthAssessment: assessment,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    try {
      if (existingRecord) {
        await onUpdateRecord(updated); // Update existing record
      } else {
        await onAddRecord(updated); // Add new record
      }
      setShowSyncSuccess(true);
      setError(''); // Clear any previous errors
      setTimeout(() => setShowSyncSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update wellness profile:", err);
      setError('Failed to update profile. Please try again.');
    }
    setIsNewHealthRecord(false); // After saving, it's no longer a new record
  };

  const updateWater = (change) => {
    const newVal = Math.max(0, waterCups + change);
    setWaterCups(newVal);
    const updatedHabit = { ...(existingDailyHabit || {}), employeeId: user.employeeId, waterCups: newVal, lastUpdated: new Date().toISOString().split('T')[0] };
    if (existingDailyHabit) {
      onUpdateDailyHabit(updatedHabit);
    } else {
      onAddDailyHabit(updatedHabit);
    }
  };

  const handleStepsChange = (e) => {
    const val = Number(e.target.value);
    setStepsCount(val);
    const updatedHabit = { ...(existingDailyHabit || {}), employeeId: user.employeeId, stepsCount: val, lastUpdated: new Date().toISOString().split('T')[0] };
    if (existingDailyHabit) {
      onUpdateDailyHabit(updatedHabit);
    } else {
      onAddDailyHabit(updatedHabit);
    }
  };

  const handleMoodSelect = (selectedMood) => {
    setMood(selectedMood);
    const nextStreak = (existingMentalHealthLog && existingMentalHealthLog.mood === selectedMood) ? streakDays : streakDays + 1;
    setStreakDays(nextStreak);

    const updatedLog = {
      ...(existingMentalHealthLog || {}),
      employeeId: user.employeeId,
      mood: selectedMood,
      streakDays: nextStreak,
      date: new Date().toISOString().split('T')[0]
    };
    if (existingMentalHealthLog) {
      onUpdateMentalHealthLog(updatedLog);
    } else {
      onAddMentalHealthLog(updatedLog);
    }
  };

  const handlePulseSubmit = (e) => {
    e.preventDefault();
    onAddSentimentPulse(dept, pulseStress, pulseFeedback);
    const updatedLog = {
      ...(existingMentalHealthLog || {}),
      employeeId: user.employeeId,
      stressLevel: pulseStress,
      feedback: pulseFeedback,
      date: new Date().toISOString().split('T')[0]
    };
    if (existingMentalHealthLog) {
      onUpdateMentalHealthLog(updatedLog);
    } else {
      onAddMentalHealthLog(updatedLog);
    }
    setPulseSubmitted(true);
    setPulseFeedback('');
    setTimeout(() => setPulseSubmitted(false), 4000);
  };

  const myRiskProfile = risks.find((r) => r.employeeId === user.employeeId);

  // Use backend prediction if available; otherwise fall back to the previous heuristic.
  const riskScore = myRiskProfile?.riskScore ?? 0;
  const factors = myRiskProfile?.factors ?? ["Awaiting data..."];
  const recommendationAction = myRiskProfile?.recommendationAction ?? "Maintain healthy habits.";


  // State for Blood Pressure info popup
  const [showBpInfoPopup, setShowBpInfoPopup] = useState(false);
  const bpInfoRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bpInfoRef.current && !bpInfoRef.current.contains(event.target)) {
        setShowBpInfoPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-8 pb-10">

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <HeartPulse className="w-5 h-5 text-slate-400" />
            <h3 className="font-display font-semibold text-slate-800 text-base">Self-Reported Health Vitals</h3>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">My Employee ID</label>
              <p className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none select-none">
                {user.employeeId}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">My Age</label>
                <input type="number" required value={age} onChange={(e) => setAge(e.target.value)} placeholder="30" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-lg text-xs text-slate-700 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">My Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none cursor-pointer focus:bg-white">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">My Height (cm)</label>
                <input type="number" step="0.1" required value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="170.5" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-lg text-xs text-slate-700 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">My Weight (kg)</label>
                <input type="number" step="0.1" required value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="70.2" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-lg text-xs text-slate-700 outline-none" />
              </div>
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">My Department</label>
                <select
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none cursor-pointer focus:bg-white"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Product">Product</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">My Body Mass Index (BMI)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={bmi}
                  onChange={(e) => setBmi(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-lg text-xs text-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Blood Pressure (Systolic/Diastolic){' '}
                  <span
                    ref={bpInfoRef}
                    className="relative ml-1.5 text-slate-500 cursor-pointer"
                    onClick={() => setShowBpInfoPopup(!showBpInfoPopup)}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '1.18em', // Adjust size as needed
                        height: '1.17em',
                        borderRadius: '50%',
                        border: '1px solid currentColor', // Use current text color for border
                        fontSize: '0.9em', // Adjust font size of 'i' inside circle
                        fontWeight: 'bold',
                        lineHeight: '1.8', // Ensure 'i' is centered vertically
                      }}
                    >i</span>
                    {showBpInfoPopup && (
                      <div className="absolute z-10 w-64 p-3 -top-2 left-full ml-2 bg-white border border-slate-200 rounded-lg shadow-lg text-xs text-slate-700 animate-fadeIn">
                        <div className="absolute -left-1 top-3 w-2 h-2 bg-white border-l border-t border-slate-200 transform rotate-45 -translate-x-1/2" />
                        Systolic is the top number (pressure when heart beats), Diastolic is the bottom number (pressure when heart rests).
                      </div>
                    )}
                  </span>
                </label>
                <input
                  type="text" // Keep as text for "120/80" format
                  required
                  placeholder="e.g. 120/80"
                  value={bp}
                  onChange={(e) => setBp(e.target.value)}
                  onFocus={() => setShowBpInfoPopup(false)} // Close popup if input is focused
                  onBlur={() => setTimeout(() => setShowBpInfoPopup(false), 100)} // Close popup on blur, with slight delay to allow click on popup
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-lg text-xs text-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Self-Reported Stress</label>
                <select
                  value={stress}
                  onChange={(e) => setStress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none cursor-pointer focus:bg-white"
                >
                  <option value="Low">Low Stress</option>
                  <option value="Medium">Medium Stress</option>
                  <option value="High">High Stress</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Sleep (Hours/Night)</label>
                <input type="number" step="0.5" required value={sleep} onChange={(e) => setSleep(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-lg text-xs text-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">My Stress Score (1-10)</label>
                <input type="number" min="1" max="10" step="0.1" required value={stressScore} onChange={(e) => setStressScore(e.target.value)} placeholder="5.5" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-lg text-xs text-slate-700 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">My Attendance Rate (%)</label>
                <input type="number" min="0" max="100" step="0.1" required value={attendanceRate} onChange={(e) => setAttendanceRate(e.target.value)} placeholder="95" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-lg text-xs text-slate-700 outline-none" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Exercise (Days/Week)</label>
                <input type="number" required value={exerciseDaysPerWeek} onChange={(e) => setExerciseDaysPerWeek(e.target.value)} placeholder="3" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-lg text-xs text-slate-700 outline-none" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Exercise (Hours/Week)</label>
                <input
                  type="number" // Keep as number
                  step="0.5"
                  required
                  value={exercise}
                  onChange={(e) => setExercise(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-lg text-xs text-slate-700 outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">My Medical Condition</label>
                <select value={medicalCondition} onChange={(e) => setMedicalCondition(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none cursor-pointer focus:bg-white">
                  <option value="No major condition">No major condition</option>
                  <option value="Stress-related fatigue">Stress-related fatigue</option>
                  <option value="Mild fatigue">Mild fatigue</option>
                  <option value="Chronic pain">Chronic pain</option>
                  <option value="Allergies">Allergies</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Medical Notes</label>
                <textarea value={medicalNotes} onChange={(e) => setMedicalNotes(e.target.value)} placeholder="Any relevant medical notes..." rows="2" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-lg text-xs text-slate-700 outline-none"></textarea>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">My Glucose Level</label>
                <input type="number" step="0.1" required value={glucoseLevel} onChange={(e) => setGlucoseLevel(e.target.value)} placeholder="90" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-lg text-xs text-slate-700 outline-none" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-800">
                  <input type="checkbox" checked={smoker} onChange={(e) => setSmoker(e.target.checked)} className="form-checkbox h-3.5 w-3.5 text-indigo-600 rounded border-slate-300" />
                  Smoker
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-800">
                  <input type="checkbox" checked={alcoholUse} onChange={(e) => setAlcoholUse(e.target.checked)} className="form-checkbox h-3.5 w-3.5 text-indigo-600 rounded border-slate-300" />
                  Alcohol User
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-mono">Last Synchronized</span>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-md" // Changed to 'Save Profile' for clarity
              >
                <Sparkles className="w-4 h-4" />
                Sync & Save Vitals
              </button>
            </div>
          </form>

          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-xs text-red-800 flex items-start gap-2.5 animate-shake font-medium font-sans">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {showSyncSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-xs text-emerald-800 flex items-center gap-2 animate-fadeIn font-medium font-sans">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              Your personal wellness record has been updated! Changes have propagated to all performance dashboards.
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between space-y-6 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-slate-400" />
                <h3 className="font-display font-semibold text-slate-800 text-base">Your Health Diagnostics</h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                riskScore >= 70 ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                riskScore >= 45 ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}>
                {riskScore >= 70 ? 'High Burnout Risk' : riskScore >= 45 ? 'Elevated Stress' : 'Balanced Vitals'}
              </span>
            </div>

            <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wider">Burnout Intensity Index</div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className={`text-4xl font-display font-light ${
                    riskScore >= 70 ? 'text-rose-600' : riskScore >= 45 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>{riskScore}%</span>
                  <span className="text-[10px] text-slate-400 font-mono">Computed Live</span>
                </div>
              </div>
              <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-300">
                <div className={`h-full rounded-full ${
                  riskScore >= 70 ? 'bg-rose-500' : riskScore >= 45 ? 'bg-amber-500' : 'bg-emerald-500'
                }`} style={{ width: `${riskScore}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Contributing Risk Factors:</div>
              {factors.length === 0 ? (
                <div className="text-xs text-slate-500 font-light flex items-center gap-1.5 py-1">
                  <Check className="w-4 h-4 text-emerald-500" />
                  All parameters verified within optimal ranges. Maintain active lifestyle!
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {factors.map((f, i) => (
                    <span key={i} className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-700 text-[9px] rounded-md font-mono">
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            {riskScore >= 70 ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 font-light flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block mb-0.5 text-rose-900">PTO Advisory Triggered!</strong>
                  Your sleep metrics and reported stress indicate severe physical fatigue. We recommend taking advantage of your department's wellness PTO benefits immediately.
                </div>
              </div>
            ) : riskScore >= 45 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-light flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block mb-0.5 text-amber-900">Elevated Baseline Stress Detected</strong>
                  Try incorporating our 10-minute daily breathing exercises and taking micro-breaks during long engineering sprints to normalize cortisol indicators.
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-light flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block mb-0.5 text-emerald-900">Vitals Optimal</strong>
                  Excellent habits! Your exercise levels and nightly resting intervals place you in the low-risk tier. Enjoy your active fitness benefits package.
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="flex justify-between items-start text-slate-400">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Daily Water Intake</span>
              <h4 className="text-slate-800 font-semibold text-sm mt-1">Hydration Index</h4>
            </div>
            <Apple className="w-4 h-4 text-sky-500" />
          </div>

          <div className="text-center py-2 space-y-2">
            <div className="text-3xl font-display font-semibold text-slate-800">{waterCups} / 8</div>
            <div className="text-[10px] text-slate-400 font-mono">Cups logged today (Target 8)</div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-sky-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (waterCups / 8) * 100)}%` }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => updateWater(-1)}
              className="flex-1 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 transition-all cursor-pointer hover:bg-slate-100"
            >
              - 1 Cup
            </button>
            <button
              onClick={() => updateWater(1)}
              className="flex-1 py-1.5 bg-sky-50 border border-sky-100 text-sky-700 hover:bg-sky-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              + 1 Cup
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="flex justify-between items-start text-slate-400">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Step Counter</span>
              <h4 className="text-slate-800 font-semibold text-sm mt-1">Active Movement</h4>
            </div>
            <Dumbbell className="w-4 h-4 text-emerald-500" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-3xl font-display font-semibold text-slate-800">{stepsCount.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 font-mono">/ 10,000 steps</span>
            </div>
            <input
              type="range"
              min="0"
              max="15000"
              step="500"
              value={stepsCount}
              onChange={handleStepsChange}
              className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg border border-slate-200"
            />
            <p className="text-[9px] text-slate-400 text-center font-mono leading-none">Use slider to adjust step count metrics</p>
          </div>

          <div className="text-[10px] text-slate-400 font-mono text-center">
            {stepsCount >= 10000 ? '🎉 Daily Step Target Unlocked!' : `${(10000 - stepsCount).toLocaleString()} steps remaining to achieve daily fitness rewards.`}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="flex justify-between items-start text-slate-400">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Streak & Mood Logger</span>
              <h4 className="text-slate-800 font-semibold text-sm mt-1">Mental Health Check</h4>
            </div>
            <span className="text-xs text-amber-600 font-mono font-bold flex items-center gap-0.5">
              🔥 {streakDays}-Day Streak
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-mono font-bold">Today's Mood:</span>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { label: '🔋', name: 'Energetic' },
                { label: '🌸', name: 'Calm' },
                { label: '🧘', name: 'Relaxed' }, // New Mood
                { label: '☕', name: 'Tired' },
                { label: '⚡', name: 'Stressed' },
                { label: '📉', name: 'Burned' },
                { label: '🤔', name: 'Neutral' }, // New Mood
              ].map((m) => (
                <button
                  key={m.name}
                  onClick={() => handleMoodSelect(m.name)}
                  title={m.name}
                  className={`py-2 text-base rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${
                    mood === m.name
                      ? 'bg-indigo-50 border-indigo-300 font-bold scale-105'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
            <div className="text-center text-[10px] text-slate-400 font-mono">
              Currently logged: <span className="font-bold text-slate-700">{mood}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400 border-t border-slate-100 pt-3.5">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            Daily streak increases log moods daily.
          </div>
        </div>

      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Smile className="w-5 h-5 text-slate-400" />
            <h3 className="font-display font-semibold text-slate-800 text-base">Submit Anonymized Departmental Pulse Check</h3>
          </div>
          <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider font-mono">
            Fully Encrypted & Anonymized
          </span>
        </div>

        <p className="text-slate-500 text-xs font-light max-w-3xl leading-relaxed">
          Your feedback is critical to assessing team wellness trends. By submitting, your raw answers are compiled into aggregated departmental metrics to maintain 100% identity protection. Your submitted scores will immediately update the <strong>Sentiment & Mental Health tab charts</strong>.
        </p>

        <form onSubmit={handlePulseSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">

            <div className="md:col-span-1 space-y-2">
              <div className="flex justify-between text-xs">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">My Stress Level (1-10)</label>
                <span className="font-bold text-slate-800 font-mono">{pulseStress}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={pulseStress}
                onChange={(e) => setPulseStress(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-1 bg-slate-100 rounded-lg border border-slate-200"
              />
              <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                <span>Relaxed (1)</span>
                <span>Max Stress (10)</span>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Issue Description / Feedback (Optional)</label>
              <input
                type="text"
                value={pulseFeedback}
                onChange={(e) => setPulseFeedback(e.target.value)}
                placeholder="e.g. Excessive sprint velocity pressure, or request for ergonomic standing desks..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-400 rounded-lg text-xs text-slate-700 outline-none"
              />
            </div>

            <div className="md:col-span-1">
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Submit Secure Pulse Check
              </button>
            </div>

          </div>
        </form>

        {pulseSubmitted && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <strong className="font-semibold block mb-0.5 text-emerald-900">Anonymized Pulse Registered!</strong>
              Your feedback stress metrics and key issues have been securely processed. Check out the <strong>Sentiment & Mental Health</strong> tab to view updated department charts.
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

// ==========================================
// CORE COMPONENT: USER DASHBOARD
// ==========================================
export default function UserDashboard({ user,
  onLogout,
  healthRecords,
  risks = [],
  onAddRecord,
  onUpdateUserRecord,
  dailyHabits, // New prop
  onAddDailyHabit, // New prop
  onUpdateDailyHabit, // New prop
  mentalHealthLogs, // New prop
  onAddHealthRecord, // Added onAddHealthRecord prop
  onUpdateSentimentPulse, 
  recommendations= [],
  loading = false,
  isProfileModalOpen,
  setIsProfileModalOpen,
  onUpdateAvatar
}) {

  const [activeTab, setActiveTab] = useState(7);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Find recommendations for the current user
  const userRecommendations = recommendations.find(rec => rec.employeeId === user.employeeId)?.recommendations || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Platform Header */}
      <header className="bg-white border-b border-slate-200 text-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
        <div
          className="flex items-center justify-between md:justify-end gap-5 cursor-pointer group"
          onClick={() => setIsProfileModalOpen(true)}
        >
          <div className="flex items-center gap-3 text-right">
            <div className="hidden sm:block text-right mr-3">
              <span className="block text-sm font-semibold text-slate-800 leading-tight">{user.name}</span>
              <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{user.employeeId}</span>
              <span className="inline-block mt-1 px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-500 text-[9px] font-mono font-bold rounded uppercase tracking-widest leading-none">
                Employee
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

          <div className="h-8 w-px bg-slate-200 hidden sm:block group-hover:bg-indigo-300 transition-colors" />

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-600 transition-all cursor-pointer shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {isProfileModalOpen && (
        <ProfileModal
          user={user}
          onClose={() => setIsProfileModalOpen(false)}
          onUpdateAvatar={onUpdateAvatar}
        />
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row">

        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-72 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 p-5 space-y-5 shrink-0">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3">
            Wellness Modules
          </div>

          <nav className="space-y-1">
            {[
              { id: 7, label: 'My Wellness Profile', icon: User, desc: 'Your health stats & personalized trackers' },
              { id: 3, label: 'Personalized Recommender', icon: Lightbulb, desc: 'Fitness, diets, wellness schedules' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left p-3.5 rounded-lg flex items-start gap-3.5 transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-white border-slate-200 text-indigo-600 shadow-sm font-semibold'
                      : 'hover:bg-slate-100 border-transparent text-slate-500'
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
          <div className="pt-6 border-t border-slate-200 hidden lg:block">
            <div className="bg-white border border-slate-200 rounded-xl p-4.5 relative overflow-hidden shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Health Index</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-display font-semibold text-slate-800">88%</span>
                <span className="text-[10px] text-emerald-600 font-semibold font-mono">↑ 4%</span>
              </div>
              <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
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
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-50 border border-slate-200 rounded-md text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-3">
                {activeTab === 7 ? 'Self-Service Portal' : `Module ${activeTab} of 5`}
              </div>
              <h1 className="font-display text-3xl font-semibold text-slate-800 tracking-tight">
                {activeTab === 7 && 'My Personal Wellness Profile'}
                {activeTab === 3 && 'Personalized Wellness Recommendation System'}
              </h1>
              <p className="text-slate-500 text-sm mt-2 max-w-2xl font-light">
                {activeTab === 7 && 'Manage your personal health vitals, track daily habits, and submit secure mental health feedback.'}
                {activeTab === 3 && 'Tailored, evidence-based fitness routines, diet schedules, and mental wellbeing recommendations.'}
              </p>
            </div>
          </div>

          {/* Render Active Tab Component */}
          <div className="animate-fadeIn">
            {activeTab === 7 && (
              <UserProfileModule
                user={user}
                records={healthRecords}
                risks={risks}
                dailyHabits={dailyHabits} // Pass new state
                onAddDailyHabit={onAddDailyHabit} // Pass new handler
                onUpdateDailyHabit={onUpdateDailyHabit} // Pass new handler
                mentalHealthLogs={mentalHealthLogs} // Pass new state
                onAddRecord={onAddRecord || onAddHealthRecord} // Pass to UserProfileModule
                onUpdateRecord={onUpdateUserRecord}
                onAddSentimentPulse={onUpdateSentimentPulse}
              />
            )}

            {activeTab === 3 && (
              <RecommendationModule recommendations={userRecommendations} loading={loading} />
            )}
          </div>
        </main>
      </div>

      {/* Floating AI Wellness Assistant Button and Popover (Only for User Module) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {isChatOpen && (
          <div className="w-[380px] sm:w-[420px] max-w-[calc(100vw-2rem)] h-[520px] shadow-2xl rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col transition-all duration-300 animate-fadeIn">
            {/* Header with Close button */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 text-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5 text-slate-800 font-sans">
                    Wellness Intelligent Agent
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">Continuous Learning Active</div>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-all cursor-pointer animate-fadeIn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chatbot module body */}
            <div className="flex-1 overflow-hidden">
              <ChatbotModule user={user} isFloating={true} />
            </div>
          </div>
        )}

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer hover:scale-105 active:scale-95 ${
            isChatOpen
              ? 'bg-slate-900 border border-slate-800 text-white'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {isChatOpen ? (
            <X className="w-6 h-6 animate-fadeIn" />
          ) : (
            <div className="relative">
              <Bot className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white animate-pulse" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

function ProfileModal({ user, onClose, onUpdateAvatar }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = () => {
    if (file) {
      onUpdateAvatar(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl flex flex-col">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h3 className="font-display font-semibold text-slate-800">My Profile</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={preview || user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}&background=e2e8f0&color=475569`}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <button
                onClick={() => fileInputRef.current.click()}
                className="absolute -bottom-1 -right-1 bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-full border-2 border-white shadow-md transition-transform hover:scale-110"
              >
                <UploadCloud className="w-4 h-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg"
              />
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-lg text-slate-800">{user.name}</h4>
              <p className="text-sm text-slate-500">{user.email}</p>
              <p className="text-xs text-slate-400 font-mono mt-1">{user.employeeId}</p>
            </div>
          </div>
          <button onClick={handleUpload} disabled={!file} className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed">Save Changes</button>
        </div>
      </div>
    </div>
  );
}
