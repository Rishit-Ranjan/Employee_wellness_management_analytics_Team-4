import  { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User as UserIcon, ArrowRight, Check, AlertCircle, CheckCircle2 } from 'lucide-react';
export default function SignUp({ onNavigate, onSignUpSuccess }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Password strength validation logic
    const getPasswordStrength = () => {
        if (!password)
            return { label: 'Empty', score: 0, color: 'bg-zinc-800' };
        let score = 0;
        if (password.length >= 8)
            score += 1;
        if (/[A-Z]/.test(password))
            score += 1;
        if (/[0-9]/.test(password))
            score += 1;
        if (/[^A-Za-z0-9]/.test(password))
            score += 1;
        switch (score) {
            case 0:
            case 1:
                return { label: 'Weak', score: 25, color: 'bg-red-500' };
            case 2:
                return { label: 'Fair', score: 50, color: 'bg-orange-500' };
            case 3:
                return { label: 'Good', score: 75, color: 'bg-yellow-500' };
            case 4:
            default:
                return { label: 'Strong', score: 100, color: 'bg-emerald-500' };
        }
    };
    const strength = getPasswordStrength();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!name || !email || !password || !confirmPassword) {
            setError('Please fill in all fields.');
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (!termsAccepted) {
            setError('You must accept the Terms of Service and Privacy Policy.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            if (!res.ok) {
                let body = null;
                try { body = await res.json(); } catch { /* ignore */ }
                const message = body && (body.message || body.detail) ? (body.message || body.detail) : res.statusText;
                throw new Error(message || 'Request failed');
            }


            // Keep existing UX: show success screen then redirect.
            const newUser = {
                id: `pending-${Date.now()}`,
                name,
                email,
                role: 'user'
            };

            setSuccess(true);
            setTimeout(() => {
                onSignUpSuccess(newUser);
            }, 1200);
        } catch (err) {
            setError(err && err.message ? err.message : 'Failed to create account. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    if (success) {
        return (<div id="signup-success-view" className="min-h-screen flex items-center justify-center bg-[#050505] p-6 text-[#e0e0e0]">
        <div className="w-full max-w-md bg-[#0a0a0a] rounded-2xl border border-[#1a1a1a] p-8 text-center space-y-4 shadow-2xl">
          <div className="mx-auto w-16 h-16 bg-[#111] border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mb-2">
            <CheckCircle2 className="w-10 h-10 animate-bounce"/>
          </div>
          <h2 className="font-display text-2xl font-medium text-white tracking-tight">Account Created!</h2>
          <p className="text-[#71717a] text-sm">
            Welcome, <strong>{name}</strong>! Your employee wellness account has been successfully set up.
          </p>
          <div className="text-xs text-[#52525b] py-2 font-mono">
            Redirecting you to the platform...
          </div>
          <div className="w-full bg-[#111] h-1 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full animate-pulse" style={{ width: '100%' }}/>
          </div>
        </div>
      </div>);
    }
    return (<div id="signup-container" className="min-h-screen flex bg-[#050505] text-[#e0e0e0]">
      {/* Left panel: Info Panel */}
      <div id="signup-hero-panel" className="hidden lg:flex lg:w-1/2 bg-[#0a0a0a] text-white p-12 flex-col justify-between relative overflow-hidden border-r border-[#1a1a1a]">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_50%_50%,#333_0%,transparent_50%)]"></div>
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#444] to-transparent"></div>
        </div>
        
        {/* Header */}
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <div className="w-4 h-4 bg-black rounded-sm rotate-45"></div>
          </div>
          <span className="text-xl font-bold tracking-tighter text-white">PLATFORM.</span>
        </div>

        {/* Center quote */}
        <div className="my-auto relative z-10 max-w-md">
          <h1 className="font-display text-4xl font-light tracking-tight leading-tight mb-6 text-white">
            Join thousands of teams <br /><span className="italic font-serif text-[#a1a1aa]">prioritizing employee</span> health.
          </h1>
          <p className="text-[#71717a] text-sm leading-relaxed mb-6 font-light">
            Establishing a wellness program can reduce absenteeism by 25% and increase overall workspace productivity. Get started with custom employee health indexing today.
          </p>

          <ul className="space-y-3.5">
            {[
            'Compliant and anonymized analytics standard',
            'Integrated mental distress notification system',
            'Direct AI-assisted personalized action plans',
            'Granular real-time team feedback widgets'
        ].map((benefit, idx) => (<li key={idx} className="flex items-center gap-2.5 text-xs text-[#a1a1aa]">
                <div className="p-0.5 bg-[#111] border border-emerald-500/20 text-emerald-400 rounded-md">
                  <Check className="w-3.5 h-3.5"/>
                </div>
                {benefit}
              </li>))}
          </ul>
        </div>

        {/* Footer info */}
        <div className="text-xs text-[#52525b] flex items-center justify-between relative z-10 font-mono">
          <span>© 2026 Employee Wellness Inc.</span>
          <span>Security Certified SHA-256</span>
        </div>
      </div>

      {/* Right side: Signup Form */}
      <div id="signup-form-panel" className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md bg-[#0a0a0a] rounded-2xl border border-[#1a1a1a] p-8 shadow-2xl">
          <div className="mb-6">
            <div className="lg:hidden flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <div className="w-4 h-4 bg-black rounded-sm rotate-45"></div>
              </div>
              <span className="font-display font-bold text-white tracking-tighter">Employee Wellness Management Analytics</span>
            </div>
            <h2 className="font-display text-2xl font-medium text-white tracking-tight">Create your account</h2>
            <p className="text-[#71717a] text-sm mt-1">Deploy wellness metrics and trackers for your team</p>
          </div>

          {error && (<div className="mb-4 p-3 bg-[#241212] border border-[#4d1d1d] rounded-xl text-red-300 text-xs flex items-start gap-2.5 font-medium animate-shake">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5"/>
              <span>{error}</span>
            </div>)}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label htmlFor="name" className="block text-[11px] uppercase tracking-widest text-[#52525b] font-bold mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <UserIcon className="w-4 h-4"/>
                </div>
                <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-[#111] border border-[#262626] rounded-lg text-sm text-white placeholder-[#3f3f46] outline-none focus:border-[#444] transition-colors"/>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-[11px] uppercase tracking-widest text-[#52525b] font-bold mb-1">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-4 h-4"/>
                </div>
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-[#111] border border-[#262626] rounded-lg text-sm text-white placeholder-[#3f3f46] outline-none focus:border-[#444] transition-colors"/>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[11px] uppercase tracking-widest text-[#52525b] font-bold mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4"/>
                </div>
                <input id="password" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-10 py-2.5 bg-[#111] border border-[#262626] rounded-lg text-sm text-white placeholder-[#3f3f46] outline-none focus:border-[#444] transition-colors"/>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300">
                  {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>

              {/* Password Strength Meter */}
              {password && (<div className="mt-2 space-y-1 p-2.5 bg-[#111] border border-[#262626] rounded-lg">
                  <div className="flex justify-between items-center text-[10px] text-[#71717a] font-medium">
                    <span>Password Strength: <strong>{strength.label}</strong></span>
                    <span>{strength.score}%</span>
                  </div>
                  <div className="w-full bg-[#262626] h-1 rounded-full overflow-hidden">
                    <div className={`${strength.color} h-full transition-all duration-300`} style={{ width: `${strength.score}%` }}/>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 text-[9px] text-[#52525b] mt-1 font-mono">
                    <span className={password.length >= 8 ? 'text-emerald-500 font-semibold' : ''}>✓ Min 8 chars</span>
                    <span className={/[A-Z]/.test(password) ? 'text-emerald-500 font-semibold' : ''}>✓ 1 Uppercase</span>
                    <span className={/[0-9]/.test(password) ? 'text-emerald-500 font-semibold' : ''}>✓ 1 Number</span>
                    <span className={/[^A-Za-z0-9]/.test(password) ? 'text-emerald-500 font-semibold' : ''}>✓ 1 Special</span>
                  </div>
                </div>)}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-[11px] uppercase tracking-widest text-[#52525b] font-bold mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4"/>
                </div>
                <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full pl-10 pr-10 py-2.5 bg-[#111] border border-[#262626] rounded-lg text-sm text-white placeholder-[#3f3f46] outline-none focus:border-[#444] transition-colors"/>
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300">
                  {showConfirmPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={termsAccepted} required onChange={(e) => setTermsAccepted(e.target.checked)} className="w-4 h-4 mt-0.5 rounded bg-[#111] border-[#262626] text-white focus:ring-0 accent-white shrink-0"/>
                <span className="text-xs text-[#71717a]">
                  I agree to the{' '}
                  <span className="text-white hover:underline underline-offset-2">Terms of Service</span> and{' '}
                  <span className="text-white hover:underline underline-offset-2">Privacy Policy</span>.
                </span>
              </label>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-[#e4e4e7] transition-all transform active:scale-[0.98] cursor-pointer mt-2 flex items-center justify-center gap-2">
              {loading ? (<div className="w-5 h-5 border-2 border-black/35 border-t-black rounded-full animate-spin"/>) : (<>
                  Create Account
                  <ArrowRight className="w-4 h-4"/>
                </>)}
            </button>
          </form>

          {/* Sign in link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#71717a]">
              Already have an account?{' '}
              <button onClick={() => onNavigate('login')} className="text-white font-medium hover:underline underline-offset-4 decoration-[#444] transition-all">
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>);
}
