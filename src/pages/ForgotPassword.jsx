import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('request'); // 'request' or 'reset'
  const [email, setEmail] = useState('');

  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  
  const onRequestSubmit = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      await useAuthStore.getState().sendResetPasswordEmail(data.email);
      setEmail(data.email);
      setStep('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (data) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await useAuthStore.getState().resetPasswordWithCode(email, data.code, data.password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const newPassword = watch('password', '');

  return (
    <div className="min-h-screen bg-[#080A0F] text-white font-sans flex flex-col">
      <div className="p-6">
        <Link to="/" className="text-xl font-syne font-extrabold tracking-tighter text-white">
          TOBLI
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <h1 className="text-2xl font-syne font-bold mb-1">Reset Password</h1>
            <p className="text-neutral-500 text-sm">
              {step === 'request' ? 'Enter your email address to receive a reset code' : 'Enter the code sent to your email and your new password'}
            </p>
          </div>

          {step === 'request' && (
            <form onSubmit={handleSubmit(onRequestSubmit)} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-sm">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2 ml-1">Email</label>
                <input
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  })}
                  type="email"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white transition-colors"
                  placeholder="email@example.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</p>}
              </div>

              <button
                disabled={isLoading}
                type="submit"
                className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Send Reset Code'}
              </button>
            </form>
          )}

          {step === 'reset' && !success && (
            <form onSubmit={handleSubmit(onResetSubmit)} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-sm">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2 ml-1">6-Digit Code</label>
                <input
                  {...register('code', { 
                    required: 'Code is required',
                    minLength: {
                      value: 6,
                      message: "Code must be at least 6 characters"
                    }
                  })}
                  type="text"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white transition-colors"
                  placeholder="123456"
                />
                {errors.code && <p className="text-red-500 text-xs mt-1 ml-1">{errors.code.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2 ml-1">New Password</label>
                <input
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters"
                    },
                    validate: (val) => {
                      if (!/[A-Z]/.test(val)) return 'Must include an uppercase letter';
                      if (!/[a-z]/.test(val)) return 'Must include a lowercase letter';
                      if (!/[0-9]/.test(val)) return 'Must include a number';
                      return true;
                    }
                  })}
                  type="password"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white transition-colors"
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2 ml-1">Confirm New Password</label>
                <input
                  {...register('confirmPassword', { 
                    required: 'Please confirm your password',
                    validate: value => value === newPassword || "Passwords do not match"
                  })}
                  type="password"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white transition-colors"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 ml-1">{errors.confirmPassword.message}</p>}
              </div>

              <button
                disabled={isLoading}
                type="submit"
                className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Update Password'}
              </button>
            </form>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-green-500" size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Password Updated</h3>
              <p className="text-sm text-neutral-400">
                Your password has been successfully reset. Redirecting to login...
              </p>
            </div>
          )}

          <div className="mt-8 text-center text-sm">
            <Link to="/login" className="text-neutral-400 hover:text-white transition-colors">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
