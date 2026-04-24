import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

// ─── OTP digit input ────────────────────────────────────────────────────────
function OtpInput({ value, onChange }) {
  const len = 6;
  const digits = value.split('').concat(Array(len).fill('')).slice(0, len);
  const inputRefs = useRef([]);

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      const next = [...digits];
      if (next[i]) { next[i] = ''; onChange(next.join('')); }
      else if (i > 0) { inputRefs.current[i - 1]?.focus(); }
      return;
    }
    if (e.key === 'ArrowLeft' && i > 0) { inputRefs.current[i - 1]?.focus(); return; }
    if (e.key === 'ArrowRight' && i < len - 1) { inputRefs.current[i + 1]?.focus(); return; }
  };

  const handleChange = (i, e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) return;
    const next = [...digits];
    // Handle paste of multiple digits
    const chars = val.split('').slice(0, len - i);
    chars.forEach((ch, idx) => { if (i + idx < len) next[i + idx] = ch; });
    onChange(next.join(''));
    const focusIdx = Math.min(i + chars.length, len - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, len);
    const next = [...digits];
    pasted.split('').forEach((ch, idx) => { if (idx < len) next[idx] = ch; });
    onChange(next.join(''));
    const focusIdx = Math.min(pasted.length, len - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  return (
    <div className="flex gap-3 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => inputRefs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          className="w-12 h-14 text-center text-xl font-bold bg-neutral-950 border border-neutral-800 rounded-2xl text-white focus:outline-none focus:border-white transition-colors caret-transparent"
        />
      ))}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function Signup() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // OTP verification step state
  const [step, setStep] = useState('form'); // 'form' | 'verify'
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch("password");

  // ── Step 1: Submit signup form ─────────────────────────────────────────────
  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await useAuthStore.getState().signUp(
        data.business_name,
        data.owner_name,
        null,
        data.phone,
        data.email,
        data.password
      );

      if (result?.requiresEmailConfirmation) {
        // Email confirmation required — show OTP input screen
        setPendingEmail(data.email);
        setStep('verify');
      } else {
        // No confirmation needed — go straight to dashboard
        setSuccess('Account created!');
        setTimeout(() => navigate('/dashboard', { state: { isNewSignup: true } }), 500);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: Verify OTP ─────────────────────────────────────────────────────
  const onVerify = async () => {
    if (otpCode.length < 6) { setError('Please enter the full 6-digit code.'); return; }
    setIsLoading(true);
    setError(null);
    try {
      await useAuthStore.getState().verifyEmailAndCreateBusiness(pendingEmail, otpCode);
      setSuccess('Email verified! Welcome to TOBLI.');
      setTimeout(() => navigate('/dashboard', { state: { isNewSignup: true } }), 600);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Shared layout wrapper ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080A0F] text-white font-sans flex flex-col">
      {/* Topbar */}
      <div className="p-6 flex justify-between items-center">
        <Link to="/" className="text-xl font-syne font-extrabold tracking-tighter text-white">
          TOBLI
        </Link>
        <button
          onClick={() => step === 'verify' ? (setStep('form'), setError(null)) : navigate(-1)}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-neutral-900/40 backdrop-blur-xl border border-neutral-800 p-8 md:p-12 rounded-[32px]">

          {/* ── OTP Verification screen ── */}
          {step === 'verify' ? (
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 rounded-full mb-6">
                  <Mail size={28} className="text-white" />
                </div>
                <h1 className="text-3xl font-syne font-bold mb-3 tracking-tight">Check your email</h1>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  We sent a 6-digit verification code to<br />
                  <span className="text-white font-medium">{pendingEmail}</span>
                </p>
              </div>

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

              <OtpInput value={otpCode} onChange={setOtpCode} />

              <div className="flex justify-center pt-2">
                <button
                  disabled={isLoading || otpCode.length < 6}
                  onClick={onVerify}
                  className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-sans font-bold text-base hover:bg-neutral-200 transition-all shadow-[0_0_50px_rgba(255,255,255,0.1)] active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <>Verify & Continue <ArrowRight size={18} /></>}
                </button>
              </div>

              <p className="text-center text-neutral-500 text-xs">
                Didn't receive it? Check your spam folder or{' '}
                <button
                  className="text-white underline"
                  onClick={() => { setStep('form'); setError(null); setOtpCode(''); }}
                >
                  go back
                </button>
                {' '}and try again.
              </p>
            </div>

          ) : (
            /* ── Signup form ── */
            <>
              <div className="mb-10 text-center md:text-left">
                <h1 className="text-4xl font-syne font-bold mb-2 tracking-tight">Create your business account</h1>
                <p className="text-neutral-500">Join the premium business network.</p>
              </div>

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2 ml-1">Business Name</label>
                    <input
                      {...register('business_name', { required: 'Required' })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white focus:outline-none focus:border-white transition-colors"
                      placeholder="Enter business name"
                    />
                    {errors.business_name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.business_name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2 ml-1">Owner's Name</label>
                    <input
                      {...register('owner_name', { required: 'Required' })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white focus:outline-none focus:border-white transition-colors"
                      placeholder="Full name"
                    />
                    {errors.owner_name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.owner_name.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2 ml-1">Phone Number</label>
                  <input
                    {...register('phone', { required: 'Required' })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white focus:outline-none focus:border-white transition-colors"
                    placeholder="07..."
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1 ml-1">{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2 ml-1">Email</label>
                  <input
                    {...register('email', {
                      required: 'Required',
                      pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                    })}
                    type="email"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white focus:outline-none focus:border-white transition-colors"
                    placeholder="email@example.com"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2 ml-1">Password</label>
                    <input
                      {...register('password', {
                        required: 'Required',
                        minLength: { value: 6, message: 'Min 6 characters' }
                      })}
                      type="password"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white focus:outline-none focus:border-white transition-colors"
                      placeholder="••••••••"
                    />
                    {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2 ml-1">Confirm Password</label>
                    <input
                      {...register('confirm_password', {
                        required: 'Required',
                        validate: (val) => val === password || "Passwords do not match"
                      })}
                      type="password"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white focus:outline-none focus:border-white transition-colors"
                      placeholder="••••••••"
                    />
                    {errors.confirm_password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.confirm_password.message}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-1">
                  <input
                    {...register('terms', { required: 'You must accept the terms' })}
                    type="checkbox"
                    id="terms"
                    className="w-8 h-8 accent-black bg-white border-2 border-black rounded focus:ring-2 focus:ring-black transition-colors"
                  />
                  <label htmlFor="terms" className="text-sm text-neutral-200 cursor-pointer">
                    I agree to the{' '}
                    <Link to="/terms" className="text-white underline hover:text-neutral-300" target="_blank">Terms and Conditions</Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-white underline hover:text-neutral-300" target="_blank">Privacy Policy</Link>
                  </label>
                </div>
                {errors.terms && <p className="text-red-500 text-xs mt-1 ml-1">{errors.terms.message}</p>}

                <div className="flex justify-end pt-4">
                  <button
                    disabled={isLoading}
                    type="submit"
                    className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-sans font-bold text-base hover:bg-neutral-200 transition-all shadow-[0_0_50px_rgba(255,255,255,0.1)] active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="animate-spin text-sm" /> : <>Sign Up <ArrowRight size={18} /></>}
                  </button>
                </div>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
