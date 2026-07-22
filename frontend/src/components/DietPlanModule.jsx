import React, { useState } from 'react';
import { Utensils, Flame, Droplet, Beef, Sparkles } from 'lucide-react';
import { generateDietPlan } from '../services/api';

const DIET_TYPES = ['Vegetarian', 'Vegan', 'Non-Veg', 'Diabetic', 'Weight Loss', 'Weight Gain'];

export default function DietPlanModule() {
  const [selected, setSelected] = useState('Vegetarian');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (type) => {
    setSelected(type);
    setLoading(true);
    try {
      const res = await generateDietPlan(type);
      setPlan(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { handleGenerate('Vegetarian'); }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Choose your diet type</div>
        <div className="flex flex-wrap gap-2">
          {DIET_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => handleGenerate(t)}
              className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                selected === t ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="text-sm text-slate-400 py-6 text-center">Generating your plan…</div>}

      {plan && !loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-3">
              <Flame className="w-7 h-7 text-orange-400" />
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Calories</div>
                <div className="text-lg font-display font-semibold text-slate-800">{plan.calories} kcal</div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-3">
              <Beef className="w-7 h-7 text-rose-400" />
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Protein</div>
                <div className="text-lg font-display font-semibold text-slate-800">{plan.protein}</div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-3">
              <Droplet className="w-7 h-7 text-sky-400" />
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Water Intake</div>
                <div className="text-lg font-display font-semibold text-slate-800">{plan.waterIntakeLitres} L</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Breakfast', items: plan.breakfast },
              { label: 'Lunch', items: plan.lunch },
              { label: 'Dinner', items: plan.dinner },
              { label: 'Snacks', items: plan.snacks },
            ].map((meal) => (
              <div key={meal.label} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm mb-3">
                  <Utensils className="w-4 h-4 text-slate-400" /> {meal.label}
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                  {meal.items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>

          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-2.5 text-xs text-indigo-800">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
            <span>This plan is a general guideline based on your selected diet type — adjust portions based on your activity level, and consult a nutritionist for medical conditions.</span>
          </div>
        </>
      )}
    </div>
  );
}
