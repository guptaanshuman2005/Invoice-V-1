import React, { useState, useCallback, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { validateEmail, validateRequired } from '../../utils/validation';
import { Zap, Mail, ArrowLeft, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { 
  signInWithCatalyst, 
  signUpWithCatalyst, 
  redirectToHostedLogin 
} from '../../utils/catalystAuth';
import { trackEvent } from '../../utils/analytics';
import { toast } from 'sonner';

export type AuthView = 'login' | 'signup' | 'checkEmail';

interface AuthProps {
  onBack?: () => void;
  initialView?: 'login' | 'signup';
}

// --- Brand Logo ---
const BrandLogo = ({ size = 'md', dark = false }: { size?: 'sm' | 'md' | 'lg'; dark?: boolean }) => {
  const dim = size === 'lg' ? 'h-10 w-10' : size === 'md' ? 'h-8 w-8' : 'h-6 w-6';
  const text = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-xl' : 'text-lg';
  
  return (
    <div className="flex items-center gap-3">
      <div className={`bg-gradient-to-r from-accent to-indigo-600 text-white p-1.5 rounded-xl shadow-md ${dim} flex items-center justify-center`}>
        <Zap className="w-full h-full" strokeWidth={2.5} />
      </div>
      <span className={`font-black tracking-tight ${dark ? 'text-white' : 'text-slate-900 dark:text-white'} ${text} font-display`}>InvoicePro</span>
    </div>
  );
};

// --- Main Auth Component ---
const Auth: React.FC<AuthProps> = ({ onBack, initialView = 'login' }) => {
  const [authView, setAuthView] = useState<AuthView>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ 
    email?: string; 
    password?: string; 
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
  };

  const validateAndSetField = useCallback((
    fieldName: 'email' | 'password' | 'name', 
    value: string
  ) => {
    let error: string | null = null;
    if (fieldName === 'email') {
      error = validateRequired(value) || validateEmail(value);
    } else if (fieldName === 'password') {
      error = validateRequired(value);
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
      const { user, error } = await signInWithCatalyst(email, password);
      if (error) {
        setFormError(error);
      } else if (user) {
        toast.success(`Welcome back, ${user.name || 'User'}!`);
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
    if (!isNameValid || !isEmailValid) return;

    setIsSubmitting(true);
    try {
      const { success, error } = await signUpWithCatalyst(name, email);
      if (error) {
        setFormError(error);
      } else if (success) {
        trackEvent('user_signup_submitted', { email });
        setAuthView('checkEmail');
      }
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred during signup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#F8F9FB] dark:bg-[#0A0A0A] font-sans selection:bg-accent selection:text-white items-center justify-center p-4 relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/10 dark:bg-accent/15 rounded-full blur-[120px] -z-10 animate-pulse duration-[8s]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-[120px] -z-10 animate-pulse duration-[10s]"></div>

      {onBack && (
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 sm:top-8 sm:left-8 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-2 transition-colors py-2 px-3 rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
      )}

      <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex justify-center mb-4"><BrandLogo size="lg" /></div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight font-display">
            {authView === 'login' ? 'Sign In to InvoicePro' : 
             authView === 'signup' ? 'Create Your Account' : 
             'Check Your Email'}
          </h2>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            {authView === 'login' ? 'Powered by Zoho Catalyst Authentication' : 
             authView === 'signup' ? 'Get started with Zoho Catalyst Cloud' : 
             `An invitation link has been dispatched to ${email}`}
          </p>
        </div>

        {/* Card Container */}
        <div className="glass-panel-elevated p-8 rounded-3xl shadow-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-[#161618]/90 backdrop-blur-xl">
          
          {/* Tabs */}
          {(authView === 'login' || authView === 'signup') && (
            <div className="flex bg-slate-100/90 dark:bg-slate-800/50 p-1 rounded-2xl mb-6 border border-slate-200/50 dark:border-slate-800/50">
              <button
                type="button"
                onClick={() => switchView('login')}
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 ${authView === 'login' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchView('signup')}
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 ${authView === 'signup' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* LOGIN VIEW */}
          {authView === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-3.5">
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
                <div>
                  <Input 
                    label="Password" 
                    id="password" 
                    type="password" 
                    value={password} 
                    onChange={(e) => { setPassword(e.target.value); validateAndSetField('password', e.target.value); }} 
                    required 
                    placeholder="Enter the password you created" 
                    error={fieldErrors.password} 
                  />
                  <div className="flex justify-end mt-1.5">
                    <button 
                      type="button" 
                      onClick={() => redirectToHostedLogin()} 
                      className="text-xs font-extrabold text-accent hover:underline transition-all"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl text-center border border-red-200 dark:border-red-900/40">
                  {formError}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-3 text-sm shadow-lg shadow-accent/25 rounded-2xl bg-gradient-to-r from-accent to-indigo-600 hover:from-accent-hover hover:to-indigo-700 transition-all font-black uppercase tracking-wider text-white"
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>

              <div className="relative flex items-center justify-center my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
                <span className="relative bg-white dark:bg-[#161618] px-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">Or continue with</span>
              </div>

              {/* Zoho Hosted Portal Button */}
              <Button 
                type="button" 
                variant="secondary" 
                className="w-full flex items-center justify-center gap-2.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-2xl hover:shadow-sm" 
                onClick={() => redirectToHostedLogin()}
              >
                <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
                <span className="text-slate-800 dark:text-slate-200 font-bold text-xs">Sign In with Zoho Catalyst Portal</span>
              </Button>

              {/* Google Button */}
              <Button 
                type="button" 
                variant="secondary" 
                className="w-full flex items-center justify-center gap-3 py-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-2xl hover:shadow-sm" 
                onClick={() => redirectToHostedLogin()}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                <span className="text-slate-700 dark:text-slate-200 font-bold text-xs">Continue with Google (Zoho Catalyst)</span>
              </Button>
            </form>
          )}

          {/* SIGNUP VIEW */}
          {authView === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="space-y-3.5">
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

                {/* Explicit Password Setup Notification as Requested */}
                <div className="p-3.5 bg-indigo-50/80 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/40 text-left">
                  <div className="flex items-start gap-2.5">
                    <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed">
                      <span className="font-extrabold block mb-0.5">Password setup via Email:</span>
                      Zoho Catalyst will send an invitation link to your <strong className="text-accent underline font-black">Gmail / inbox</strong>. Click the link in that email to set your password and activate your account.
                    </div>
                  </div>
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl text-center border border-red-200 dark:border-red-900/40">
                  {formError}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-3 text-sm shadow-lg shadow-accent/25 rounded-2xl bg-gradient-to-r from-accent to-indigo-600 hover:from-accent-hover hover:to-indigo-700 transition-all font-black uppercase tracking-wider text-white"
              >
                {isSubmitting ? 'Sending Invitation...' : 'Create Account & Send Email'}
              </Button>

              <div className="relative flex items-center justify-center my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
                <span className="relative bg-white dark:bg-[#161618] px-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">Or continue with</span>
              </div>

              <Button 
                type="button" 
                variant="secondary" 
                className="w-full flex items-center justify-center gap-3 py-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-2xl hover:shadow-sm" 
                onClick={() => redirectToHostedLogin()}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                <span className="text-slate-700 dark:text-slate-200 font-bold text-xs">Continue with Google (Zoho Catalyst)</span>
              </Button>

              <p className="text-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider pt-2">
                By signing up, you agree to our Terms & Privacy Policy.
              </p>
            </form>
          )}

          {/* CHECK EMAIL SUCCESS VIEW */}
          {authView === 'checkEmail' && (
            <div className="text-center py-4 animate-scale-in space-y-5">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Mail className="w-8 h-8 text-accent animate-bounce" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white font-display">Check Your Gmail / Email</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                  We've sent an invitation email to <strong className="text-slate-900 dark:text-white font-bold">{email}</strong>.
                  Please open your email, click the link to set your password, and activate your account.
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <a 
                  href="https://mail.google.com" 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 text-sm shadow-lg shadow-accent/25 rounded-2xl bg-gradient-to-r from-accent to-indigo-600 hover:from-accent-hover hover:to-indigo-700 transition-all font-black uppercase tracking-wider text-white"
                >
                  <ExternalLink className="w-4 h-4" /> Open Gmail
                </a>

                <Button 
                  type="button" 
                  variant="secondary" 
                  className="w-full py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl"
                  onClick={() => switchView('login')}
                >
                  Proceed to Sign In
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Auth;
