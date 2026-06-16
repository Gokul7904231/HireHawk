import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';

interface LoginSignupProps {
  onLoginSuccess: (email: string) => void;
}

export default function LoginSignup({ onLoginSuccess }: LoginSignupProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('recruiter'); // recruiter, candidate, manager
  
  // State
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    if (!email || !password) {
      setError('Email and password are required.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    if (!isLogin) {
      if (!name) {
        setError('Please enter your name.');
        return false;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      
      // Store in localStorage
      localStorage.setItem('hirehawk_auth', 'true');
      localStorage.setItem('hirehawk_user_email', email);
      localStorage.setItem('hirehawk_user_name', isLogin ? 'Demo Recruiter' : name);
      localStorage.setItem('hirehawk_user_role', role);

      // Trigger login success transition
      setTimeout(() => {
        onLoginSuccess(email);
      }, 1200);
    }, 1500);
  };

  const handleSocialLogin = (provider: string) => {
    setError(null);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      localStorage.setItem('hirehawk_auth', 'true');
      localStorage.setItem('hirehawk_user_email', `sso_${provider.toLowerCase()}@hirehawk.ai`);
      localStorage.setItem('hirehawk_user_name', `SSO User (${provider})`);
      localStorage.setItem('hirehawk_user_role', 'recruiter');
      setTimeout(() => {
        onLoginSuccess(`sso_${provider.toLowerCase()}@hirehawk.ai`);
      }, 1200);
    }, 1000);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#03060e] overflow-hidden font-sans">
      {/* Background Gradients & Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[300px] h-[300px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none" />
      
      {/* Stars particles overlay simulation */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      {/* Main card */}
      <div className="relative w-full max-w-md p-1.5 rounded-2xl bg-gradient-to-br from-purple-500/20 via-slate-800/40 to-cyan-500/20 shadow-[0_0_50px_-12px_rgba(168,85,247,0.2)] z-10 mx-4">
        <div className="backdrop-blur-xl bg-[#090d1a]/90 rounded-xl p-8 border border-slate-800/80">
          
          {/* Logo / Header */}
          <div className="text-center mb-8 space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 p-0.5 shadow-lg shadow-purple-900/20">
              <div className="w-full h-full bg-[#090d1a] rounded-[10px] flex items-center justify-center">
                <Sparkles size={20} className="text-purple-400 animate-pulse" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              HireHawk Workspace
            </h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide">
              {isLogin ? 'Log in to orchestrate your autonomous recruitment pipeline' : 'Create an account to scale your recruitment capacity'}
            </p>
          </div>

          {/* Success Transition Overlay */}
          {success && (
            <div className="flex flex-col items-center justify-center space-y-4 py-8 animate-fade-in">
              <div className="relative w-16 h-16 flex items-center justify-center bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                <ShieldCheck size={32} className="text-emerald-400 animate-bounce" />
                <div className="absolute inset-0 rounded-full border border-emerald-400/20 animate-ping" />
              </div>
              <div className="text-center">
                <h3 className="text-sm font-bold text-white">Verification Approved</h3>
                <p className="text-[11px] text-slate-400 mt-1">Establishing secure agentic session...</p>
              </div>
            </div>
          )}

          {/* Form Content */}
          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Error box */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs">
                  <AlertCircle size={14} className="shrink-0" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              {/* Input: Name (Signup Only) */}
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                      <User size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="Gokul"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#070b13] border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Input: Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <Mail size={14} />
                  </span>
                  <input
                    type="email"
                    placeholder="gokul@hirehawk.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#070b13] border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Input: Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setError('Password reset links are disabled in mock demo environment.')}
                      className="text-[9px] font-bold text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-wider focus:outline-none"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <Lock size={14} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#070b13] border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Input: Confirm Password & Role (Signup Only) */}
              {!isLogin && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirm Password</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                        <Lock size={14} />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#070b13] border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Organization Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#070b13] border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer font-medium"
                    >
                      <option value="recruiter">Recruiter / Talent Acquisition</option>
                      <option value="manager">Hiring Manager</option>
                      <option value="candidate">Candidate (Self-Tailoring)</option>
                    </select>
                  </div>
                </>
              )}

              {/* Remember Me Checkbox (Login Only) */}
              {isLogin && (
                <div className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    id="remember-me"
                    defaultChecked
                    className="rounded border-slate-800 bg-[#070b13] text-purple-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 accent-purple-600"
                  />
                  <label htmlFor="remember-me" className="text-[10px] text-slate-400 font-semibold cursor-pointer">
                    Remember me on this workstation
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-purple-900/10 focus:outline-none flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>{isLogin ? 'Authenticating...' : 'Creating Account...'}</span>
                  </>
                ) : (
                  <span>{isLogin ? 'Login Workspace' : 'Sign Up Workspace'}</span>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800/80"></div>
                <span className="flex-shrink mx-3 text-[9px] text-slate-500 font-bold uppercase tracking-widest">or continue with</span>
                <div className="flex-grow border-t border-slate-800/80"></div>
              </div>

              {/* Social Login Grid */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('Google')}
                  className="flex items-center justify-center gap-2 py-2 rounded-lg bg-[#070b13] border border-slate-800/60 hover:bg-slate-900 text-slate-300 hover:text-white transition-all text-xs font-bold focus:outline-none"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114-4.694 0-8.503-3.809-8.503-8.5s3.81-8.5 8.503-8.5c2.296 0 4.387.81 6.09 2.148l3.033-3.033C18.515 1.135 15.607 0 12.24 0 5.58 0 0 5.58 0 12.24s5.58 12.24 12.24 12.24c6.96 0 12.24-4.872 12.24-12.24 0-.776-.08-1.503-.223-1.955H12.24z" />
                  </svg>
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialLogin('GitHub')}
                  className="flex items-center justify-center gap-2 py-2 rounded-lg bg-[#070b13] border border-slate-800/60 hover:bg-slate-900 text-slate-300 hover:text-white transition-all text-xs font-bold focus:outline-none"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  <span>GitHub</span>
                </button>
              </div>

            </form>
          )}

          {/* Toggle Button */}
          {!success && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                className="text-xs font-bold text-slate-400 hover:text-white transition-colors focus:outline-none"
              >
                {isLogin ? (
                  <span>Don't have an account? <span className="text-purple-400 hover:text-purple-300">Sign up</span></span>
                ) : (
                  <span>Already have an account? <span className="text-purple-400 hover:text-purple-300">Log in</span></span>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
