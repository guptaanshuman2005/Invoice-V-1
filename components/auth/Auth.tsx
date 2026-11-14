import React, { useState, useCallback, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { validateEmail, validateRequired, validatePasswordStrength } from '../../utils/validation';
import { Zap, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { 
  signInWithFirebase, 
  signUpWithFirebase, 
  signInWithGoogle, 
  sendPasswordReset 
} from '../../utils/firebaseAuth';
import { trackEvent } from '../../utils/analytics';
import { toast } from 'sonner';

export type AuthView = 'login' | 'signup' | 'forgotPassword' | 'resetSent';

interface AuthProps {
  onBack?: () => void;
  initialView?: 'login' | 'signup' | 'forgotPassword';
}

// --- Brand Logo ---
const BrandLogo = ({ size = 'md', dark = false }: { size?: 'sm' | 'md' | 'lg'; dark?: boolean }) => {
  const dim = size === 'lg' ? 'h-9 w-9' : size === 'md' ? 'h-8 w-8' : 'h-6 w-6';
  const text = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-xl' : 'text-lg';
  
  return (
    <div className="flex items-center gap-2.5">
      <img 
        src="/icons/icon-192.png" 
        alt="InvoiceProIn Logo" 
        className={`${dim} rounded-xl shadow-xs object-contain shrink-0`} 
      />
      <span className={`font-bold tracking-tight ${dark ? 'text-white' : 'text-zinc-900 dark:text-white'} ${text} flex items-center`}>
        InvoicePro<span className="text-indigo-600 dark:text-indigo-400 font-bold ml-0.5">In</span>
      </span>
    </div>
  );
};

// --- Main Auth Component ---
const Auth: React.FC<AuthProps> = ({ onBack, initialView = 'login' }) => {
  const [authView, setAuthView] = useState<AuthView>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ 
    email?: string; 
    password?: string; 
    confirmPassword?: string;
    name?: string; 
  }>({});

  useEffect(() => {
    if (initialView) {
      setAuthView(initialView);
    }
  }, [initialView]);

  const switchView = (view: AuthView) => {
    setAuthView(view);
    setFormError('');
    setFieldErrors({});
    setPassword('');
    setConfirmPassword('');
  };

  const validateAndSetField = useCallback((
    fieldName: 'email' | 'password' | 'confirmPassword' | 'name', 
    value: string, 
    isSignup: boolean = false
  ) => {
    let error: string | null = null;
    if (fieldName === 'email') {
      error = validateRequired(value) || validateEmail(value);
    } else if (fieldName === 'password') {
      error = validateRequired(value);
      if (!error && isSignup) {
        error = validatePasswordStrength(value);
      }
    } else if (fieldName === 'name') {
      error = validateRequired(value);
    }
    setFieldErrors(prev => ({ ...prev, [fieldName]: error || undefined }));
    return !error;
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const isEmailValid = validateAndSetField('email', email);
    const isPasswordValid = validateAndSetField('password', password);
    if (!isEmailValid || !isPasswordValid) return;

    setIsSubmitting(true);
    try {
      const { user, error } = await signInWithFirebase(email, password);
      if (error) {
        setFormError(error);
      } else if (user) {
        toast.success(`Welcome back, ${user.name}!`);
        trackEvent('user_login', { userId: user.id, method: 'password' });
      }
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred during login.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const isNameValid = validateAndSetField('name', name);
    const isEmailValid = validateAndSetField('email', email);
    const isPasswordValid = validateAndSetField('password', password, true);
    
    if (password !== confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match.' }));
      return;
    }
    if (!isNameValid || !isEmailValid || !isPasswordValid) return;

    setIsSubmitting(true);
    try {
      const { user, error } = await signUpWithFirebase(name, email, password);
      if (error) {
        setFormError(error);
      } else if (user) {
        toast.success(`Account created successfully! Welcome, ${user.name}.`);
        trackEvent('user_signup', { userId: user.id, method: 'password' });
      }
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred during signup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setFormError('');
    try {
      const { user, error } = await signInWithGoogle();
      if (error) {
        setFormError(error);
      } else if (user) {
        toast.success(`Welcome, ${user.name}!`);
        trackEvent('user_login', { userId: user.id, method: 'google' });
      }
    } catch (err: any) {
      setFormError('Failed to sign in with Google. Please try email login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const isEmailValid = validateAndSetField('email', email);
    if (!isEmailValid) return;

    setIsSubmitting(true);
    try {
      const { success, error } = await sendPasswordReset(email);
      if (error || !success) {
        setFormError(error || 'Could not send reset email. Please try again.');
      } else {
        toast.success('Password reset instructions sent to your email.');
        switchView('resetSent');
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to send reset link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#F8F9FB] dark:bg-[#0B0C0E] font-sans selection:bg-indigo-600 selection:text-white items-center justify-center p-4 relative overflow-hidden">

      {onBack && (
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 sm:top-8 sm:left-8 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex items-center gap-2 transition-colors py-2 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
      )}

      <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex justify-center mb-4"><BrandLogo size="lg" /></div>
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
            {authView === 'login' ? 'Sign In to InvoiceProIn' : 
             authView === 'signup' ? 'Create Your Account' : 
             authView === 'forgotPassword' ? 'Reset Your Password' : 
             'Check Your Inbox'}
          </h2>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            {authView === 'login' ? 'Manage your GST invoices, clients & inventory' : 
             authView === 'signup' ? 'Create your workspace with direct email & password' : 
             authView === 'forgotPassword' ? 'We will email you a secure link to reset your password' : 
             `Password reset instructions have been sent to ${email}`}
          </p>
        </div>

        {/* Form Container */}
        <div className="glass-panel p-7 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          
          {/* Auth Tabs */}
          {(authView === 'login' || authView === 'signup') && (
            <div className="flex bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-xl mb-6 border border-zinc-200/60 dark:border-zinc-700/60">
              <button
                type="button"
                onClick={() => switchView('login')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${authView === 'login' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => switchView('signup')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${authView === 'signup' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
              >
                Sign up
              </button>
            </div>
          )}

          {/* LOGIN VIEW */}
          {authView === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-3.5">
                <Input 
                  label="Email address" 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => { setEmail(e.target.value); validateAndSetField('email', e.target.value); }} 
                  required 
                  placeholder="you@company.com" 
                  error={fieldErrors.email} 
                />
                <div>
                  <Input 
                    label="Password" 
                    id="password" 
                    type="password" 
                    value={password} 
                    onChange={(e) => { setPassword(e.target.value); validateAndSetField('password', e.target.value); }} 
                    required 
                    placeholder="Enter your password" 
                    error={fieldErrors.password} 
                  />
                  <div className="flex justify-end mt-1.5">
                    <button 
                      type="button" 
                      onClick={() => switchView('forgotPassword')} 
                      className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-medium rounded-xl text-center border border-rose-200 dark:border-rose-900/40">
                  {formError}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full !py-2.5 text-sm font-semibold rounded-xl"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>

              <div className="relative flex items-center justify-center my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div></div>
                <span className="relative bg-white dark:bg-[#121316] px-3 text-[10px] font-medium tracking-wide text-zinc-400 uppercase">Or continue with</span>
              </div>

              <Button 
                type="button" 
                variant="secondary" 
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 !py-2.5 rounded-xl" 
                onClick={handleGoogleLogin}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                <span className="text-zinc-700 dark:text-zinc-200 font-medium text-xs">Continue with Google</span>
              </Button>
            </form>
          )}

          {/* SIGNUP VIEW */}
          {authView === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="space-y-3">
                <Input 
                  label="Full Name" 
                  id="name" 
                  type="text" 
                  value={name} 
                  onChange={(e) => { setName(e.target.value); validateAndSetField('name', e.target.value); }} 
                  required 
                  placeholder="e.g. Rahul Sharma" 
                  error={fieldErrors.name} 
                />
                <Input 
                  label="Email Address" 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => { setEmail(e.target.value); validateAndSetField('email', e.target.value); }} 
                  required 
                  placeholder="you@company.com" 
                  error={fieldErrors.email} 
                />
                <Input 
                  label="Create Password" 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => { setPassword(e.target.value); validateAndSetField('password', e.target.value, true); }} 
                  required 
                  placeholder="Min 6 characters" 
                  error={fieldErrors.password} 
                />
                <Input 
                  label="Confirm Password" 
                  id="confirmPassword" 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => { setConfirmPassword(e.target.value); }} 
                  required 
                  placeholder="Re-type your password" 
                  error={fieldErrors.confirmPassword} 
                />
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-medium rounded-xl text-center border border-rose-200 dark:border-rose-900/40">
                  {formError}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full !py-2.5 text-sm font-semibold rounded-xl"
              >
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </Button>

              <div className="relative flex items-center justify-center my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div></div>
                <span className="relative bg-white dark:bg-[#121316] px-3 text-[10px] font-medium tracking-wide text-zinc-400 uppercase">Or continue with</span>
              </div>

              <Button 
                type="button" 
                variant="secondary" 
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 !py-2.5 rounded-xl" 
                onClick={handleGoogleLogin}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                <span className="text-zinc-700 dark:text-zinc-200 font-medium text-xs">Continue with Google</span>
              </Button>

              <p className="text-center text-[11px] text-zinc-500 font-normal pt-2">
                By creating an account, you agree to our Terms & Privacy Policy.
              </p>
            </form>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {authView === 'forgotPassword' && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="space-y-3">
                <Input 
                  label="Registered Email Address" 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => { setEmail(e.target.value); validateAndSetField('email', e.target.value); }} 
                  required 
                  placeholder="you@company.com" 
                  error={fieldErrors.email} 
                />
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-medium rounded-xl text-center border border-rose-200 dark:border-rose-900/40">
                  {formError}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full !py-2.5 text-sm font-semibold rounded-xl"
              >
                {isSubmitting ? 'Sending Reset Email...' : 'Send Password Reset Email'}
              </Button>

              <button 
                type="button" 
                onClick={() => switchView('login')} 
                className="w-full text-center text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 mt-2 transition-colors"
              >
                &larr; Back to Sign In
              </button>
            </form>
          )}

          {/* RESET SENT CONFIRMATION VIEW */}
          {authView === 'resetSent' && (
            <div className="text-center py-6 animate-scale-in space-y-4">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Mail className="w-8 h-8 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reset Email Sent!</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  We've sent a password reset link to <strong className="text-slate-900 dark:text-white font-bold">{email}</strong>. Check your inbox to choose a new password.
                </p>
              </div>
              <Button 
                onClick={() => switchView('login')} 
                className="w-full py-2.5 text-sm rounded-xl font-semibold shadow-xs"
              >
                Back to Sign In
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Auth;
