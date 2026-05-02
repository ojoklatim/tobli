import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2, Mail, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useStore } from '../store/useStore';
import ThemeToggle from '../components/ThemeToggle';

// ─── Utilities ────────────────────────────────────────────────────────
function normalizePhone(input) {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('256') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 10) 
    return '256' + digits.slice(1);
  throw new Error('Invalid Ugandan phone number (must be 10 digits starting with 0, or 12 starting with 256)');
}

function detectNetwork(normalized) {
  try {
    const prefix = normalized.slice(3, 6); // after 256
    if (['076','077','078','039'].includes(prefix)) return 'MTN Mobile Money';
    if (['075','070'].includes(prefix)) return 'Airtel Money';
    return null;
  } catch (e) {
    return null;
  }
}

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

  const theme = useStore(state => state.theme);
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
          className={`w-12 h-14 text-center text-xl font-bold border rounded-2xl focus:outline-none transition-colors caret-transparent ${theme === 'dark' ? 'bg-neutral-950 border-neutral-800 text-white focus:border-white' : 'bg-white border-gray-200 text-black focus:border-black'}`}
        />
      ))}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function Signup() {
  const navigate = useNavigate();
  const theme = useStore(state => state.theme);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP verification step state
  const [step, setStep] = useState('form'); // 'form' | 'verify' | 'value_message' | 'phone_confirm' | 'waiting' | 'success'
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Payment state
  const [paymentPhone, setPaymentPhone] = useState('');
  const [orderTrackingId, setOrderTrackingId] = useState(null);

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
        setPendingEmail(data.email);
        setStep('verify');
      } else {
        const biz = useAuthStore.getState().business;
        setPaymentPhone(biz?.phone || data.phone || '');
        setStep('value_message');
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
      const biz = await useAuthStore.getState().verifyEmailAndCreateBusiness(pendingEmail, otpCode);
      setPaymentPhone(biz?.phone || '');
      setStep('value_message');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Payment Flow Handlers ──────────────────────────────────────────────────
  const submitPayment = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const normalized = normalizePhone(paymentPhone);
      const business = useAuthStore.getState().business;
      
      const res = await fetch('/api/pesapal-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: business.id,
          phone_number: normalized,
          first_name: business.owner_name?.split(' ')[0] || 'Business',
          last_name: business.owner_name?.split(' ').slice(1).join(' ') || 'Owner',
          email: business.email
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment request failed');
      
      setOrderTrackingId(data.orderTrackingId);
      setStep('waiting');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Polling for payment status
  useEffect(() => {
    let interval;
    let timeout;
    if (step === 'waiting' && orderTrackingId) {
      const checkStatus = async () => {
        try {
          const res = await fetch(`/api/pesapal-status?orderTrackingId=${orderTrackingId}`);
          const data = await res.json();
          if (data.statusCode === 1) { // COMPLETED
            clearInterval(interval);
            clearTimeout(timeout);
            setStep('success');
            setTimeout(() => navigate('/dashboard', { state: { isNewSignup: true } }), 2000);
          } else if (data.status === 'FAILED' || data.statusCode === 2 || data.statusCode === 3) {
            clearInterval(interval);
            clearTimeout(timeout);
            setError('Payment failed or cancelled. Please try again.');
            setStep('phone_confirm');
          }
        } catch (err) {
          // silent error, keep polling
        }
      };
      
      interval = setInterval(checkStatus, 5000);
      
      timeout = setTimeout(() => {
        clearInterval(interval);
        setError('Prompt expired. Tap below to resend.');
        setStep('phone_confirm');
      }, 180000); // 3 minutes timeout
    }
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [step, orderTrackingId, navigate]);

  let networkName = null;
  if (paymentPhone.length >= 10) {
    try {
      networkName = detectNetwork(normalizePhone(paymentPhone));
    } catch(e) {
      networkName = null;
    }
  }

  // ── Shared layout wrapper ──────────────────────────────────────────────────
  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-[#080A0F] text-white' : 'bg-gray-50 text-black'}`}>
      {/* Topbar */}
      <div className="p-6 flex justify-between items-center z-10 relative">
        <Link to="/" className={`text-xl font-syne font-extrabold tracking-tighter transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
          TOBLI
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {(step === 'form' || step === 'verify') && (
            <button
              onClick={() => step === 'verify' ? (setStep('form'), setError(null)) : navigate(-1)}
              className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}
            >
              <ArrowLeft size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative">
        <AnimatePresence mode="wait">
          {step === 'value_message' && (
            <motion.div 
              key="value_message"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md w-full text-center space-y-8 absolute"
            >
              <h1 className="text-5xl font-syne font-bold tracking-tight">Almost there.</h1>
              <p className={`text-lg leading-relaxed ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700'}`}>
                The UGX 1,000 monthly fee helps run and improve the platform, and keeps only serious businesses on it.
              </p>
              <p className={`text-sm ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                You will receive a mobile money prompt on your phone to approve the payment.
              </p>
              <div className="flex flex-col gap-4 pt-6">
                <button 
                  onClick={() => setStep('phone_confirm')} 
                  className={`w-full py-4 rounded-full font-bold transition-all text-lg ${theme === 'dark' ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                >
                  I understand, continue
                </button>
                <button 
                  onClick={async () => { await useAuthStore.getState().signOut(); navigate('/'); }} 
                  className={`w-full py-4 rounded-full font-bold transition-all text-lg ${theme === 'dark' ? 'bg-neutral-800 text-white hover:bg-neutral-700' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
                >
                  Not now
                </button>
              </div>
            </motion.div>
          )}

          {step === 'phone_confirm' && (
            <motion.div 
              key="phone_confirm"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md border p-8 md:p-12 rounded-[32px] transition-all duration-300 absolute ${theme === 'dark' ? 'bg-neutral-900/40 backdrop-blur-xl border-neutral-800 shadow-2xl' : 'bg-white border-gray-100 shadow-xl'}`}
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-syne font-bold mb-3 tracking-tight">Confirm your mobile money number</h1>
                <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  We'll send a UGX 1,000 payment prompt to this number.
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-sm mb-6">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <div className="relative">
                    <input
                      type="tel"
                      value={paymentPhone}
                      onChange={(e) => setPaymentPhone(e.target.value)}
                      className={`w-full border rounded-2xl p-4 transition-colors focus:outline-none text-xl tracking-wider ${theme === 'dark' ? 'bg-neutral-950 border-neutral-800 text-white focus:border-white placeholder-neutral-700' : 'bg-gray-50 border-gray-200 text-black focus:border-black placeholder-neutral-400'}`}
                      placeholder="07XX XXX XXX"
                    />
                    {networkName && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${networkName.includes('MTN') ? 'bg-yellow-400 text-black' : 'bg-red-500 text-white'}`}>
                          {networkName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  disabled={isLoading || paymentPhone.length < 10}
                  onClick={submitPayment}
                  className={`w-full flex justify-center items-center gap-2 py-4 rounded-full font-sans font-bold text-base transition-all active:scale-95 disabled:opacity-50 ${theme === 'dark' ? 'bg-white text-black hover:bg-neutral-200 shadow-[0_0_50px_rgba(255,255,255,0.1)]' : 'bg-black text-white hover:bg-neutral-800 shadow-lg'}`}
                >
                  {isLoading ? <><Loader2 className="animate-spin" size={18} /> Sending prompt...</> : `Send payment prompt — UGX 1,000`}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'waiting' && (
            <motion.div 
              key="waiting"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md border p-8 md:p-12 rounded-[32px] text-center transition-all duration-300 absolute ${theme === 'dark' ? 'bg-neutral-900/40 backdrop-blur-xl border-neutral-800 shadow-2xl' : 'bg-white border-gray-100 shadow-xl'}`}
            >
              <div className="relative flex justify-center mb-10">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className={`absolute w-24 h-24 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-black/5'}`}
                />
                <div className={`w-24 h-24 rounded-full flex items-center justify-center relative z-10 ${theme === 'dark' ? 'bg-white/10' : 'bg-black/5'}`}>
                  <Loader2 className={`w-10 h-10 animate-spin ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                </div>
              </div>
              
              <h1 className="text-3xl font-syne font-bold mb-4 tracking-tight">Check your phone</h1>
              <p className={`text-base leading-relaxed mb-8 ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                A UGX 1,000 mobile money prompt has been sent to <strong className={theme === 'dark' ? 'text-white' : 'text-black'}>{paymentPhone}</strong>.<br/><br/>
                Approve it to activate your Tobli listing.
              </p>

              <button
                onClick={() => { setStep('phone_confirm'); setError(null); }}
                className={`text-sm underline transition-colors ${theme === 'dark' ? 'text-neutral-500 hover:text-white' : 'text-neutral-500 hover:text-black'}`}
              >
                Use a different number
              </button>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className={`w-full max-w-md border p-8 md:p-12 rounded-[32px] text-center transition-all duration-300 absolute ${theme === 'dark' ? 'bg-neutral-900/40 backdrop-blur-xl border-neutral-800 shadow-2xl border-emerald-500/30' : 'bg-white border-emerald-200 shadow-xl'}`}
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
              </div>
              <h1 className="text-3xl font-syne font-bold mb-3 tracking-tight">You're live on Tobli!</h1>
              <p className={`text-base leading-relaxed ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
                Your business is now active for 30 days.
              </p>
            </motion.div>
          )}

          {(step === 'form' || step === 'verify') && (
            <motion.div 
              key="form_verify"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className={`w-full max-w-2xl border p-8 md:p-12 rounded-[32px] transition-all duration-300 relative ${theme === 'dark' ? 'bg-neutral-900/40 backdrop-blur-xl border-neutral-800 shadow-2xl' : 'bg-white border-gray-100 shadow-xl'}`}
            >
              {/* ── OTP Verification screen ── */}
              {step === 'verify' ? (
                <div className="space-y-8">
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'}`}>
                      <Mail size={28} className={theme === 'dark' ? 'text-white' : 'text-black'} />
                    </div>
                    <h1 className="text-3xl font-syne font-bold mb-3 tracking-tight">Check your email</h1>
                    <p className="text-neutral-400 text-sm leading-relaxed">
                      We sent a 6-digit verification code to<br />
                      <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{pendingEmail}</span>
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-sm">
                      <AlertCircle size={18} />
                      {error}
                    </div>
                  )}

                  <OtpInput value={otpCode} onChange={setOtpCode} />

                  <div className="flex justify-center pt-2">
                    <button
                      disabled={isLoading || otpCode.length < 6}
                      onClick={onVerify}
                      className={`flex items-center gap-2 px-8 py-3 rounded-full font-sans font-bold text-base transition-all active:scale-95 disabled:opacity-50 ${theme === 'dark' ? 'bg-white text-black hover:bg-neutral-200 shadow-[0_0_50px_rgba(255,255,255,0.1)]' : 'bg-black text-white hover:bg-neutral-800 shadow-lg'}`}
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={18} /> : <>Verify & Continue <ArrowRight size={18} /></>}
                    </button>
                  </div>

                  <p className={`text-center text-xs transition-colors ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-600'}`}>
                    Didn't receive it? Check your spam folder or{' '}
                    <button
                      className={`underline transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}
                      onClick={() => { setStep('form'); setError(null); setOtpCode(''); }}
                    >
                      go back
                    </button>
                    {' '}and try again.
                  </p>
                </div>

              ) : (
                <>
                  <div className="mb-10 text-center md:text-left">
                    <h1 className="text-4xl font-syne font-bold mb-2 tracking-tight">Create your business account</h1>
                    <p className={`transition-colors ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-600'}`}>Join the premium business network.</p>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-sm">
                        <AlertCircle size={18} />
                        {error}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-neutral-400 mb-2 ml-1">Business Name</label>
                          <input
                            {...register('business_name', { required: 'Required' })}
                            className={`w-full border rounded-2xl p-4 transition-colors focus:outline-none ${theme === 'dark' ? 'bg-neutral-950 border-neutral-800 text-white focus:border-white placeholder-neutral-700' : 'bg-gray-50 border-gray-200 text-black focus:border-black placeholder-neutral-400'}`}
                            placeholder="Enter business name"
                          />
                          {errors.business_name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.business_name.message}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-400 mb-2 ml-1">Owner's Name</label>
                          <input
                            {...register('owner_name', { required: 'Required' })}
                            className={`w-full border rounded-2xl p-4 transition-colors focus:outline-none ${theme === 'dark' ? 'bg-neutral-950 border-neutral-800 text-white focus:border-white placeholder-neutral-700' : 'bg-gray-50 border-gray-200 text-black focus:border-black placeholder-neutral-400'}`}
                            placeholder="Full name"
                          />
                          {errors.owner_name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.owner_name.message}</p>}
                        </div>
                    </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2 ml-1">Phone Number</label>
                        <input
                          {...register('phone', { required: 'Required' })}
                          className={`w-full border rounded-2xl p-4 transition-colors focus:outline-none ${theme === 'dark' ? 'bg-neutral-950 border-neutral-800 text-white focus:border-white placeholder-neutral-700' : 'bg-gray-50 border-gray-200 text-black focus:border-black placeholder-neutral-400'}`}
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
                          className={`w-full border rounded-2xl p-4 transition-colors focus:outline-none ${theme === 'dark' ? 'bg-neutral-950 border-neutral-800 text-white focus:border-white placeholder-neutral-700' : 'bg-gray-50 border-gray-200 text-black focus:border-black placeholder-neutral-400'}`}
                          placeholder="email@example.com"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</p>}
                      </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-neutral-400 mb-2 ml-1">Password</label>
                          <div className="relative">
                            <input
                              {...register('password', {
                                required: 'Required',
                                minLength: { value: 8, message: 'Min 8 characters' },
                                validate: (val) => {
                                  if (!/[A-Z]/.test(val)) return 'Must include an uppercase letter';
                                  if (!/[a-z]/.test(val)) return 'Must include a lowercase letter';
                                  if (!/[0-9]/.test(val)) return 'Must include a number';
                                  return true;
                                }
                              })}
                              type={showPassword ? "text" : "password"}
                              className={`w-full border rounded-2xl p-4 pr-12 transition-colors focus:outline-none ${theme === 'dark' ? 'bg-neutral-950 border-neutral-800 text-white focus:border-white placeholder-neutral-700' : 'bg-gray-50 border-gray-200 text-black focus:border-black placeholder-neutral-400'}`}
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${theme === 'dark' ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-black'}`}
                            >
                              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                          {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-400 mb-2 ml-1">Confirm Password</label>
                          <div className="relative">
                            <input
                              {...register('confirm_password', {
                                required: 'Required',
                                validate: (val) => val === password || "Passwords do not match"
                              })}
                              type={showConfirmPassword ? "text" : "password"}
                              className={`w-full border rounded-2xl p-4 pr-12 transition-colors focus:outline-none ${theme === 'dark' ? 'bg-neutral-950 border-neutral-800 text-white focus:border-white placeholder-neutral-700' : 'bg-gray-50 border-gray-200 text-black focus:border-black placeholder-neutral-400'}`}
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${theme === 'dark' ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-black'}`}
                            >
                              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
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
                      <label htmlFor="terms" className={`text-sm cursor-pointer transition-colors ${theme === 'dark' ? 'text-neutral-200' : 'text-neutral-600'}`}>
                        I agree to the{' '}
                        <Link to="/terms" className={`underline transition-colors ${theme === 'dark' ? 'text-white hover:text-neutral-300' : 'text-black hover:text-neutral-700'}`} target="_blank">Terms and Conditions</Link>
                        {' '}and{' '}
                        <Link to="/privacy" className={`underline transition-colors ${theme === 'dark' ? 'text-white hover:text-neutral-300' : 'text-black hover:text-neutral-700'}`} target="_blank">Privacy Policy</Link>
                      </label>
                    </div>
                    {errors.terms && <p className="text-red-500 text-xs mt-1 ml-1">{errors.terms.message}</p>}

                    <div className="flex justify-end pt-4">
                      <button
                        disabled={isLoading}
                        type="submit"
                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-sans font-bold text-base transition-all active:scale-95 disabled:opacity-50 ${theme === 'dark' ? 'bg-white text-black hover:bg-neutral-200 shadow-[0_0_50px_rgba(255,255,255,0.1)]' : 'bg-black text-white hover:bg-neutral-800 shadow-lg'}`}
                      >
                        {isLoading ? <Loader2 className="animate-spin text-sm" /> : <>Sign Up <ArrowRight size={18} /></>}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
