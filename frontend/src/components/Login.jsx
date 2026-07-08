import  { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, Shield, ArrowRight, Activity, HeartPulse, Sparkles } from 'lucide-react';
import api from '../services/api';

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
            // Defer state updates to avoid synchronous cascading renders
            setTimeout(() => {
                setEmail(savedEmail);
                setRememberMe(true);
            }, 0);
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
        const data = await api.login(email, password);
        const user = data && data.user ? data.user : null;
        if (rememberMe) {
          localStorage.setItem('wellness_remember_email', email);
        } else {
          localStorage.removeItem('wellness_remember_email');
        }
        if (user) onLoginSuccess(user);
        else setError('Invalid email or password.');
      } catch (err) {
        setError(err && err.message ? err.message : 'Network error — please try again.');
      } finally {
        setLoading(false);
      }
    };
    const handleFillDemoAdmin = () => {
      setEmail('admin@example.com');
      setPassword('AdminPass123!');
      setError('');
    };
    const handleFillDemoUser = () => {
      setEmail('user@wellness.com');
      setPassword('Password123!');
      setError('');
    };

    return (
      <div id="login-container" className="min-h-screen flex bg-[#050505] text-[#e0e0e0]">

      {/* Left side panel: Decorative/Info panel */}
      <div id="login-hero-panel" className="hidden lg:flex lg:w-1/2 bg-[#0a0a0a] text-white p-12 flex-col justify-between relative overflow-hidden border-r border-[#1a1a1a]">
        {/* Abstract background graphics */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_50%_50%,#333_0%,transparent_50%)]"></div>
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#444] to-transparent"></div>
        </div>
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-zinc-800/20 rounded-full blur-3xl pointer-events-none"/>
        
        {/* Header */}
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <div className="w-4 h-4 bg-black rounded-sm rotate-45"></div>
          </div>
          <span className="text-xl font-bold tracking-tighter text-white">Employee Wellness Management Analytics</span>
        </div>

        {/* Dynamic Centerpiece Quote / Info */}
        <div className="my-auto relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#111] border border-[#262626] rounded-full text-xs text-[#71717a] mb-6 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-white"/>
            Empowering Healthy & Engaged Workforces
          </div>
          <h1 className="font-display text-5xl font-light leading-[1.1] tracking-tight text-white mb-6">
            Transform your workplace <br /><span className="italic font-serif text-[#a1a1aa]">with health</span> intelligence.
          </h1>
          <p className="text-[#71717a] text-base leading-relaxed mb-8 font-light">
            Manage employee health records, monitor burnout risks, analyze organization sentiment, and provide personalized mental and physical wellness recommendations in real-time.
          </p>

          {/* Core modules review box */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#111] border border-[#262626] rounded-xl">
              <Activity className="w-5 h-5 text-zinc-400 mb-2"/>
              <div className="text-xs font-semibold text-white">Predictive Analytics</div>
              <p className="text-[10px] text-[#71717a] mt-1">Machine learning assessments for health and burnout risks.</p>
            </div>
            <div className="p-4 bg-[#111] border border-[#262626] rounded-xl">
              <Shield className="w-5 h-5 text-zinc-400 mb-2"/>
              <div className="text-xs font-semibold text-white">Sentiment Tracker</div>
              <p className="text-[10px] text-[#71717a] mt-1">Anonymized surveys tracking organizational mental wellbeing.</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-[#52525b] flex items-center justify-between relative z-10 font-mono">
          <span>© 2026 Employee Wellness Inc.</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            All modules operational
          </span>
        </div>
      </div>

      {/* Right side: Interactive Login form */}
      <div id="login-form-panel" className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md bg-[#0a0a0a] rounded-2xl border border-[#1a1a1a] p-8 shadow-2xl">
          <div className="mb-8">
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <div className="w-4 h-4 bg-black rounded-sm rotate-45"></div>
              </div>
              <span className="font-display font-bold text-white tracking-tighter">Employee Wellness Management Analytics</span>
            </div>
            <h2 className="font-display text-3xl font-medium text-white mb-2 tracking-tight">Welcome back</h2>
            <p className="text-[#71717a] text-sm">Sign in to manage and analyze wellness profiles</p>
          </div>

          {error && (<div className="mb-5 p-3.5 bg-[#241212] border border-[#4d1d1d] rounded-xl text-red-300 text-xs flex items-start gap-2.5 font-medium animate-shake">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 shrink-0"/>
              <span>{error}</span>
            </div>)}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[11px] uppercase tracking-widest text-[#52525b] font-bold mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-4 h-4"/>
                </div>
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-[#111] border border-[#262626] rounded-lg text-sm text-white placeholder-[#3f3f46] outline-none focus:border-[#444] transition-colors"/>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-[11px] uppercase tracking-widest text-[#52525b] font-bold">
                  Password
                </label>
                <button type="button" onClick={() => onNavigate('forgot_password')} className="text-[11px] text-[#71717a] hover:text-white transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4"/>
                </div>
                <input id="password" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-10 py-3 bg-[#111] border border-[#262626] rounded-lg text-sm text-white placeholder-[#3f3f46] outline-none focus:border-[#444] transition-colors"/>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300">
                  {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded bg-[#111] border-[#262626] text-white focus:ring-0 accent-white"/>
                <span className="text-xs text-[#71717a]">Remember me</span>
              </label>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-[#e4e4e7] transition-all transform active:scale-[0.98] cursor-pointer mt-2 flex items-center justify-center gap-2">
              {loading ? (<div className="w-5 h-5 border-2 border-black/35 border-t-black rounded-full animate-spin"/>) : (<>
                  Sign In
                  <ArrowRight className="w-4 h-4"/>
                </>)}
            </button>
          </form>

          {/* Separator */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[#1a1a1a]"></span></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="bg-[#0a0a0a] px-3 text-[#52525b] font-bold">Demo Credentials</span>
            </div>
          </div>

          {/* Quick Demo Login Boxes */}
          <div className="space-y-3">
            <div onClick={handleFillDemoAdmin} className="p-3 bg-[#111] hover:bg-[#161616] border border-[#262626] hover:border-[#333] rounded-xl transition-all cursor-pointer group flex items-start justify-between">
              <div className="space-y-1">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-zinc-400"/>
                  Demo Administrator
                  <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 font-semibold rounded text-[8px] uppercase tracking-wider">Admin Portal</span>
                </div>
                <div className="text-[11px] text-[#71717a] font-mono">Use the demo admin account.</div>
              </div>
              <span className="text-[11px] font-bold text-white group-hover:underline self-center shrink-0">Fill</span>
            </div>

            <div onClick={handleFillDemoUser} className="p-3 bg-[#111] hover:bg-[#161616] border border-[#262626] hover:border-[#333] rounded-xl transition-all cursor-pointer group flex items-start justify-between">
              <div className="space-y-1">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-zinc-400"/>
                  Demo Employee (User)
                  <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 font-semibold rounded text-[8px] uppercase tracking-wider">Employee Portal</span>
                </div>
                <div className="text-[11px] text-[#71717a] font-mono">User: user@wellness.com</div>
                <div className="text-[11px] text-[#71717a] font-mono">Pass: Password123!</div>
              </div>
              <span className="text-[11px] font-bold text-white group-hover:underline self-center shrink-0">Fill</span>
            </div>
          </div>

          {/* Sign up link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-[#71717a]">
              Don't have an account?{' '}
              <button onClick={() => onNavigate('signup')} className="text-white font-medium hover:underline underline-offset-4 decoration-[#444] transition-all">
                Create account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
    );
}
