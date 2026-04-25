import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useStore } from '../store/useStore';
import ThemeToggle from '../components/ThemeToggle';

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
            <h1 className="text-2xl font-syne font-bold mb-1">Welcome Back</h1>
            <p className={`text-center text-xs transition-colors ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-600'}`}>
              Enter your credentials to access your dashboard
            </p>
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

          <div className="mt-8 text-center text-sm">
            <p className={`mb-2 transition-colors ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-600'}`}>Join the premium business network.</p>
            <span className={`transition-colors ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-600'}`}>Don't have an account? </span>
            <Link to="/signup" className={`font-bold hover:underline ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
              Sign up
            </Link>
          </div>
          <div className={`mt-4 text-center text-xs flex flex-col gap-1 transition-colors ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-600'}`}>
            <p>Contact us at <a href="mailto:ojoklatim1@gmail.com" className={`underline ${theme === 'dark' ? 'text-white' : 'text-black'}`}>ojoklatim1@gmail.com</a></p>
            <p>or call <a href="tel:0773946713" className={`underline ${theme === 'dark' ? 'text-white' : 'text-black'}`}>0773946713</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
