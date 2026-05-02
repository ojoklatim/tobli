import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useStore } from '../store/useStore';
import ThemeToggle from '../components/ThemeToggle';

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

export default function Subscribe() {
  const navigate = useNavigate();
  const theme = useStore(state => state.theme);
  const business = useAuthStore(state => state.business);
  const session = useAuthStore(state => state.session);
  const authLoading = useAuthStore(state => state.loading);
  
  const [step, setStep] = useState('phone_confirm'); // 'phone_confirm' | 'waiting' | 'success'
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [paymentPhone, setPaymentPhone] = useState('');
  const [orderTrackingId, setOrderTrackingId] = useState(null);
  const [redirectUrl, setRedirectUrl] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!session?.user || !business) {
      navigate('/login');
    } else if (paymentPhone === '' && business.phone) {
      setPaymentPhone(business.phone);
    }
  }, [session, business, authLoading, navigate, paymentPhone]);

  const submitPayment = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const normalized = normalizePhone(paymentPhone);
      
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
      setRedirectUrl(data.redirectUrl);
      setStep('waiting');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

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
            // Reload user session to get updated subscription status
            await useAuthStore.getState().loadSession();
            setStep('success');
            setTimeout(() => navigate('/dashboard'), 2000);
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

  if (authLoading || !business) {
    return <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#080A0F]"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-[#080A0F] text-white' : 'bg-gray-50 text-black'}`}>
      <div className="p-6 flex justify-between items-center z-10 relative">
        <Link to="/" className={`text-xl font-syne font-extrabold tracking-tighter transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
          TOBLI
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button
            onClick={() => navigate('/dashboard')}
            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}
          >
            <ArrowLeft size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative">
        <AnimatePresence mode="wait">
          {step === 'phone_confirm' && (
            <motion.div 
              key="phone_confirm"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md border p-8 md:p-12 rounded-[32px] transition-all duration-300 absolute ${theme === 'dark' ? 'bg-neutral-900/40 backdrop-blur-xl border-neutral-800 shadow-2xl' : 'bg-white border-gray-100 shadow-xl'}`}
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-syne font-bold mb-3 tracking-tight">Renew your Tobli listing</h1>
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
              className={`w-full max-w-md border rounded-[32px] overflow-hidden text-center transition-all duration-300 absolute ${theme === 'dark' ? 'bg-neutral-900/40 backdrop-blur-xl border-neutral-800 shadow-2xl' : 'bg-white border-gray-100 shadow-xl'}`}
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/5 dark:bg-white/5">
                <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Complete Payment</span>
                <Loader2 className={`w-4 h-4 animate-spin ${theme === 'dark' ? 'text-white/50' : 'text-black/50'}`} />
              </div>
              <iframe 
                src={redirectUrl} 
                className="w-full h-[500px] border-0 bg-white" 
                title="Pesapal Checkout"
              />
              <div className="p-4 bg-black/5 dark:bg-white/5">
                <button
                  onClick={() => { setStep('phone_confirm'); setError(null); }}
                  className={`text-sm underline transition-colors ${theme === 'dark' ? 'text-neutral-500 hover:text-white' : 'text-neutral-500 hover:text-black'}`}
                >
                  Cancel and use a different number
                </button>
              </div>
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
        </AnimatePresence>
      </div>
    </div>
  );
}
