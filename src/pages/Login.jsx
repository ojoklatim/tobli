import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();
  const { session, business, isAdmin } = useAuthStore();
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

      const session = await useAuthStore.getState().signIn(
        data.identifier,
        data.password
      );
      setSuccess('Login successful');
      setTimeout(() => {
        const { isAdmin, business } = useAuthStore.getState();
        if (isAdmin) navigate('/admin');
        else if (business) navigate('/dashboard');
        else navigate('/signup'); // Fallback to signup if no profile after login
      }, 500);
      return session;

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080A0F] text-white font-sans flex flex-col">
      {/* Topbar */}
      <div className="p-6">
        <Link to="/" className="text-xl font-syne font-extrabold tracking-tighter text-white">
          TOBLI
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <h1 className="text-2xl font-syne font-bold mb-1">Welcome Back</h1>
            <p className="text-neutral-500 text-sm">Enter your credentials to access your dashboard</p>
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

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2 ml-1">Email</label>
              <input
                {...register('identifier', { required: 'This field is required' })}
                type="text"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white transition-colors"
                placeholder="email@example.com"
              />
              {errors.identifier && <p className="text-red-500 text-xs mt-1 ml-1">{errors.identifier.message}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="text-sm font-medium text-neutral-400">Password</label>
                <Link to="/forgot-password" className="text-xs text-neutral-400 hover:text-white transition-colors">Forgot password?</Link>
              </div>
              <input
                {...register('password', { required: 'Password is required' })}
                type="password"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white transition-colors"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</p>}
            </div>

            <button
              disabled={isLoading}
              type="submit"
              className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Login'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-neutral-500">Don't have an account? </span>
            <Link to="/signup" className="text-white font-bold hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
