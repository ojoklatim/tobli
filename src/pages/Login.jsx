import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useStore } from '../store/useStore';
import { insforge } from '../lib/insforge';
import ThemeToggle from '../components/ThemeToggle';

// ── OTP digit input (inline, same as Signup) ─────────────────────────────────
function OtpInput({ value, onChange, theme }) {
  const len = 6;
  const digits = value.split('').concat(Array(len).fill('')).slice(0, len);
  const inputRefs = useRef([]);
  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      const next = [...digits];
      if (next[i]) { next[i] = ''; onChange(next.join('')); }
      else if (i > 0) inputRefs.current[i - 1]?.focus();
      return;
    }
    if (e.key === 'ArrowLeft' && i > 0) { inputRefs.current[i - 1]?.focus(); return; }
    if (e.key === 'ArrowRight' && i < len - 1) { inputRefs.current[i + 1]?.focus(); return; }
  };
  const handleChange = (i, e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) return;
    const next = [...digits];
    const chars = val.split('').slice(0, len - i);
    chars.forEach((ch, idx) => { if (i + idx < len) next[i + idx] = ch; });
    onChange(next.join(''));
    inputRefs.current[Math.min(i + chars.length, len - 1)]?.focus();
  };
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, len);
    const next = [...digits];
    pasted.split('').forEach((ch, idx) => { if (idx < len) next[idx] = ch; });
    onChange(next.join(''));
    inputRefs.current[Math.min(pasted.length, len - 1)]?.focus();
  };
  return (
    <div className="flex gap-3 justify-center">
      {digits.map((d, i) => (
        <input key={i} ref={el => inputRefs.current[i] = el}
          type="text" inputMode="numeric" maxLength={1} value={d}
          onChange={e => handleChange(i, e)} onKeyDown={e => handleKey(i, e)} onPaste={handlePaste}
          className={`w-11 h-13 text-center text-xl font-bold border rounded-2xl focus:outline-none transition-colors caret-transparent ${theme === 'dark' ? 'bg-neutral-950 border-neutral-800 text-white focus:border-white' : 'bg-white border-gray-200 text-black focus:border-black'}`}
        />
      ))}
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // OTP verify step (for unverified users redirected here after login attempt)
  const [step, setStep] = useState('login'); // 'login' | 'verify'
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const { register, handleSubmit, formState: { errors } } = useForm();
  const { session, business, isAdmin } = useAuthStore();
  const theme = useStore(state => state.theme);
  const hasProfile = !!business;

  React.useEffect(() => {
    if (session?.user && hasProfile) {
      if (isAdmin) navigate('/admin');
      else navigate('/dashboard');
    }
  }, [session, hasProfile, isAdmin, navigate]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const session = await useAuthStore.getState().signIn(data.identifier, data.password);
      setSuccess('Login successful');
      setTimeout(() => {
        const { isAdmin, business } = useAuthStore.getState();
        if (isAdmin) navigate('/admin');
        else if (business) navigate('/dashboard');
        else navigate('/signup');
      }, 500);
      return session;
    } catch (err) {
      // Unverified email — redirect to OTP screen
      if (err.message === 'EMAIL_NOT_VERIFIED') {
        setPendingEmail(err.email || data.identifier);
        setOtpCode('');
        setError(null);
        setStep('verify');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP after login attempt on unverified account
  const onVerify = async () => {
    if (otpCode.length < 6) { setError('Please enter the full 6-digit code.'); return; }
    setIsLoading(true);
    setError(null);
    try {
      const biz = await useAuthStore.getState().verifyEmailAndCreateBusiness(pendingEmail, otpCode);
      setSuccess('Email verified! Taking you to your dashboard…');
      setTimeout(() => navigate('/dashboard', { state: { isNewSignup: true } }), 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onResend = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    try {
      const { error } = await insforge.auth.resendVerificationEmail({ email: pendingEmail });
      if (error) throw new Error(error.message);
      setSuccess('A new code has been sent to your email.');
      setOtpCode('');
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown(c => { if (c <= 1) { clearInterval(timer); return 0; } return c - 1; });
      }, 1000);
    } catch {
      setSuccess('A new code has been sent if your email is registered.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-[#080A0F] text-white' : 'bg-gray-50 text-black'}`}>
      {/* Topbar */}
      <div className="p-6 flex justify-between items-center">
        <Link to="/" className={`text-xl font-syne font-extrabold tracking-tighter transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
          TOBLI
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className={`w-full max-w-md p-8 rounded-[32px] border transition-all duration-300 ${theme === 'dark' ? 'bg-neutral-900/40 border-neutral-800' : 'bg-white border-gray-100 shadow-xl'}`}>
          <div className="mb-10 text-center">
            <h1 className="text-2xl font-syne font-bold mb-1">
              {step === 'verify' ? 'Verify your email' : 'Welcome Back'}
            </h1>
            <p className={`text-center text-xs transition-colors ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-600'}`}>
              {step === 'verify' ? 'Enter the code we sent to complete your sign up' : 'Enter your credentials to access your dashboard'}
            </p>
          </div>

          {step === 'verify' ? (
            /* ── OTP Verification Screen ─────────────────────────────── */
            <div className="space-y-6">
              <div className="text-center mb-2">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${theme === 'dark' ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                  <CheckCircle2 size={22} className={theme === 'dark' ? 'text-white' : 'text-black'} />
                </div>
                <p className={`text-sm ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  We sent a 6-digit code to<br/>
                  <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{pendingEmail}</span>
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-sm">
                  <AlertCircle size={18} /> {error}
                </div>
              )}
              {success && (
                <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl flex items-center gap-3 text-green-500 text-sm">
                  <CheckCircle2 size={18} /> {success}
                </div>
              )}

              <OtpInput value={otpCode} onChange={setOtpCode} theme={theme} />

              <button
                onClick={onVerify}
                disabled={isLoading || otpCode.length < 6}
                className={`w-full font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 ${theme === 'dark' ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
              >
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Verify & Go to Dashboard'}
              </button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setStep('login'); setError(null); setOtpCode(''); }}
                  className={`text-sm flex items-center gap-1 transition-colors ${theme === 'dark' ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-black'}`}
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  type="button"
                  onClick={onResend}
                  disabled={isLoading || resendCooldown > 0}
                  className={`text-sm font-medium transition-colors disabled:opacity-40 ${theme === 'dark' ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black'}`}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </div>
          ) : (
            /* ── Login Form ───────────────────────────────────────────── */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-sm">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl flex items-center gap-3 text-green-500 text-sm">
                  <CheckCircle2 size={18} />
                  {success}
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium mb-2 ml-1 transition-colors ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>Email</label>
                <input
                  {...register('identifier', { required: 'This field is required' })}
                  type="text"
                  className={`w-full border rounded-xl p-3 text-sm focus:outline-none transition-colors ${theme === 'dark' ? 'bg-neutral-900 border-neutral-800 text-white focus:border-white placeholder-neutral-700' : 'bg-gray-50 border-gray-200 text-black focus:border-black placeholder-neutral-400'}`}
                  placeholder="email@example.com"
                />
                {errors.identifier && <p className="text-red-500 text-xs mt-1 ml-1">{errors.identifier.message}</p>}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className={`text-sm font-medium transition-colors ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>Password</label>
                  <Link to="/forgot-password" className={`text-xs transition-colors ${theme === 'dark' ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-black'}`}>Forgot password?</Link>
                </div>
                <div className="relative">
                  <input
                    {...register('password', { required: 'Password is required' })}
                    type={showPassword ? "text" : "password"}
                    className={`w-full border rounded-xl p-3 pr-10 text-sm focus:outline-none transition-colors ${theme === 'dark' ? 'bg-neutral-900 border-neutral-800 text-white focus:border-white placeholder-neutral-700' : 'bg-gray-50 border-gray-200 text-black focus:border-black placeholder-neutral-400'}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${theme === 'dark' ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-black'}`}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</p>}
              </div>

              <button
                disabled={isLoading}
                type="submit"
                className={`w-full font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm ${theme === 'dark' ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
              >
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Login'}
              </button>
            </form>
          )}

          {step === 'login' && (
            <div className="mt-8 text-center text-sm">
              <p className={`mb-2 transition-colors ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-600'}`}>Join the premium business network.</p>
              <span className={`transition-colors ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-600'}`}>Don't have an account? </span>
              <Link to="/signup" className={`font-bold hover:underline ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                Sign up
              </Link>
            </div>
          )}
          <div className={`mt-4 text-center text-xs flex flex-col gap-1 transition-colors ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-600'}`}>
            <p>Contact us at <a href="mailto:ojoklatim1@gmail.com" className={`underline ${theme === 'dark' ? 'text-white' : 'text-black'}`}>ojoklatim1@gmail.com</a></p>
            <p>or call <a href="tel:+256773946713" className={`underline ${theme === 'dark' ? 'text-white' : 'text-black'}`}>+256773946713</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
