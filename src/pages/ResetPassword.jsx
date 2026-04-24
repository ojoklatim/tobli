import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidLink, setIsValidLink] = useState(false);
  const [token, setToken] = useState(null);

  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  
  useEffect(() => {
    // Parse query params for insforge link-based reset
    // e.g. ?token=...&insforge_status=ready&insforge_type=reset_password
    const params = new URLSearchParams(location.search);
    
    // Also check hash just in case some OAuth flow uses it
    const hashParams = new URLSearchParams(location.hash.replace('#', ''));
    
    const resetToken = params.get('token') || hashParams.get('token') || hashParams.get('access_token');
    const status = params.get('insforge_status');
    const type = params.get('insforge_type');
    const err = params.get('insforge_error');

    if (err) {
      setError(`Reset link error: ${err}`);
      return;
    }

    if (resetToken) {
      setIsValidLink(true);
      setToken(resetToken);
    } else {
      setError("Invalid or expired password reset link.");
    }
  }, [location]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await useAuthStore.getState().resetPassword(data.password, token);
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
            <h1 className="text-2xl font-syne font-bold mb-1">Set New Password</h1>
            <p className="text-neutral-500 text-sm">Create a new secure password for your account</p>
          </div>

          {!isValidLink && error && (
            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="text-red-500" size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Invalid Link</h3>
              <p className="text-sm text-neutral-400">
                {error}
              </p>
              <div className="pt-4">
                <Link to="/forgot-password" className="text-white font-bold hover:underline">
                  Request a new link
                </Link>
              </div>
            </div>
          )}

          {isValidLink && !success && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-sm">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2 ml-1">New Password</label>
                <input
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters"
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
        </div>
      </div>
    </div>
  );
}
