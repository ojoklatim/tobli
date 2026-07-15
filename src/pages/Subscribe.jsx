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
      // Save merchantRef so Dashboard can use it to trigger the DB update on return
      if (data.merchantRef) {
        sessionStorage.setItem('tobli_merchant_ref', data.merchantRef);
      }
      setStep('waiting');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (step === 'waiting' && redirectUrl) {
      window.location.href = redirectUrl;
    }
  }, [step, redirectUrl]);

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
            setError(`Payment failed. Status: ${data.status} (Code: ${data.statusCode})`);
            setStep('phone_confirm');
          } else if (data.error) {
            clearInterval(interval);
            clearTimeout(timeout);
            setError(`Backend error: ${data.error}`);
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
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className={`w-full max-w-md border p-8 md:p-12 rounded-[32px] text-center transition-all duration-300 absolute ${theme === 'dark' ? 'bg-neutral-900/40 backdrop-blur-xl border-neutral-800 shadow-2xl' : 'bg-white border-gray-100 shadow-xl'}`}
          >
            <h1 className="text-3xl font-syne font-bold mb-3 tracking-tight">Payments Coming Soon</h1>
            <p className={`text-base leading-relaxed mb-8 ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
              We are currently operating TOBLI completely free of charge while we finalize our registration and payment gateways.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className={`w-full flex justify-center items-center gap-2 py-4 rounded-full font-sans font-bold text-base transition-all active:scale-95 ${theme === 'dark' ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
            >
              Go to Dashboard →
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
