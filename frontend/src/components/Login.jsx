import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Activity, Sparkles, Shield } from 'lucide-react';
import { login as loginApi } from '../services/api';

export default function Login({ onNavigate, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved email if remember me was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem('wellness_remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    try {
      const res = await loginApi(email, password);

      if (rememberMe) {
        localStorage.setItem('wellness_remember_email', email);
      } else {
        localStorage.removeItem('wellness_remember_email');
      }

      // Backend returns: { user: userInfo }
      onLoginSuccess(res?.user || res?.user_info || res);
    } catch (err) {
      console.error('Login API error:', err);
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-container" className="min-h-screen flex bg-slate-50 text-slate-800">
      {/* Left side panel: Decorative/Info panel */}
      <div
        id="login-hero-panel"
        className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden border-r border-slate-800"
      >
        {/* Abstract background graphics */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_50%_50%,#fff_0%,transparent_50%)]"></div>
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
        </div>
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-slate-800/40 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <div className="w-4 h-4 bg-slate-900 rounded-sm rotate-45"></div>
          </div>
          <span className="text-xl font-bold tracking-tighter text-white">Employee Wellness Management Analytics</span>
        </div>

        {/* Dynamic Centerpiece Quote / Info */}
        <div className="my-auto relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-850 border border-slate-800 rounded-full text-xs text-slate-300 mb-6 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Empowering Healthy & Engaged Workforces
          </div>
          <h1 className="font-display text-5xl font-light leading-[1.1] tracking-tight text-white mb-6">
            Transform your workplace <br />
            <span className="italic font-serif text-slate-300">with health</span> intelligence.
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-8 font-light">
            Manage employee health records, monitor burnout risks, analyze organization sentiment, and provide personalized mental and physical
            wellness recommendations in real-time.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-850 border border-slate-800 rounded-xl">
              <Activity className="w-5 h-5 text-indigo-400 mb-2" />
              <div className="text-xs font-semibold text-white">Predictive Analytics</div>
              <p className="text-[10px] text-slate-400 mt-1">Machine learning assessments for health and burnout risks.</p>
            </div>
            <div className="p-4 bg-slate-850 border border-slate-800 rounded-xl">
              <Shield className="w-5 h-5 text-emerald-400 mb-2" />
              <div className="text-xs font-semibold text-white">Sentiment Tracker</div>
              <p className="text-[10px] text-slate-400 mt-1">Anonymized surveys tracking organizational mental wellbeing.</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-500 flex items-center justify-between relative z-10 font-mono">
          <span>© 2026 Employee Wellness Inc.</span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            All modules operational
          </span>
        </div>
      </div>

      {/* Right side: Interactive Login form */}
      <div id="login-form-panel" className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-xl">
          <div className="mb-8">
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
              </div>
              <span className="font-display font-bold text-slate-900 tracking-tighter">Employee Wellness Management Analytics</span>
            </div>
            <h2 className="font-display text-3xl font-semibold text-slate-900 mb-2 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 text-sm">Sign in to manage and analyze wellness profiles</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2.5 font-medium animate-shake">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-[11px] uppercase tracking-widest text-slate-500 font-bold">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('forgot_password')}
                  className="text-[11px] text-slate-500 hover:text-slate-900 transition-colors font-semibold"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-50 border-slate-300 text-slate-900 focus:ring-0 accent-slate-950"
                />
                <span className="text-xs text-slate-500 font-medium">Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white font-semibold py-3 rounded-lg hover:bg-slate-800 transition-all transform active:scale-[0.98] cursor-pointer mt-2 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/35 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Sign up link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{' '}
              <button
                onClick={() => onNavigate('signup')}
                className="text-slate-900 font-bold hover:underline underline-offset-4 decoration-indigo-400 transition-all"
              >
                Create account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

