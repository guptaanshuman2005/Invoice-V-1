
import React, { useState, useCallback } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { validateEmail, validateRequired, validatePasswordStrength } from '../../utils/validation';
import { Zap, Check } from 'lucide-react';
import { supabase } from '../../supabase';
import { trackEvent } from '../../utils/analytics';

type AuthView = 'login' | 'signup' | 'forgotPassword' | 'resetSuccess';

// --- Brand Logo ---
const BrandLogo = ({ size = 'md', dark = false }: { size?: 'sm' | 'md' | 'lg'; dark?: boolean }) => {
    const dim = size === 'lg' ? 'h-10 w-10' : size === 'md' ? 'h-8 w-8' : 'h-6 w-6';
    const text = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-xl' : 'text-lg';
    
    return (
        <div className="flex items-center gap-3">
            <div className={`bg-accent text-white p-1.5 rounded-lg shadow-sm ${dim} flex items-center justify-center`}>
                <Zap className="w-full h-full" strokeWidth={2.5} />
            </div>
            <span className={`font-bold tracking-tight ${dark ? 'text-white' : 'text-slate-900 dark:text-white'} ${text}`}>InvoicePro</span>
        </div>
    );
};

// --- Main Auth Component ---
const Auth: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
    const [authView, setAuthView] = useState<AuthView>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [formError, setFormError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ email?: string, password?: string, name?: string }>({});

    const switchView = (view: AuthView) => {
        setAuthView(view);
        setFormError('');
        setFieldErrors({});
    };

    const validateAndSetField = useCallback((
        fieldName: 'email' | 'password' | 'name', 
        value: string, 
        isSignupOrReset: boolean = false
    ) => {
        let error: string | null = null;
        if (fieldName === 'email') {
            error = validateRequired(value) || validateEmail(value);
        } else if (fieldName === 'password') {
            error = validateRequired(value);
            if (!error && isSignupOrReset) {
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

        if (import.meta.env.VITE_SUPABASE_URL === undefined || import.meta.env.VITE_SUPABASE_URL === '' || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
            setFormError('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.');
            return;
        }

        const isEmailValid = validateAndSetField('email', email);
        const isPasswordValid = validateAndSetField('password', password);
        if (!isEmailValid || !isPasswordValid) return;

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setFormError(error.message || 'Invalid email or password.');
            } else if (data.user) {
                trackEvent('user_login', { userId: data.user.id, method: 'password' });
            }
        } catch (err: any) {
            if (err.message === 'Failed to fetch') {
                setFormError('Network error: Failed to reach Supabase. Please check if your VITE_SUPABASE_URL is correct and starts with https://');
            } else {
                setFormError(err.message || 'An unexpected error occurred during login.');
            }
        }
    };
    
    const handleSignupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (import.meta.env.VITE_SUPABASE_URL === undefined || import.meta.env.VITE_SUPABASE_URL === '' || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
            setFormError('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.');
            return;
        }

        const isNameValid = validateAndSetField('name', name);
        const isEmailValid = validateAndSetField('email', email);
        const isPasswordValid = validateAndSetField('password', password, true);
        if (!isNameValid || !isEmailValid || !isPasswordValid) return;

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                    }
                }
            });

            if (error) {
                setFormError(error.message || 'Could not sign up. The email might already be in use.');
            } else if (data.user) {
                trackEvent('user_signup', { userId: data.user.id, method: 'password' });
            }
        } catch (err: any) {
            if (err.message === 'Failed to fetch') {
                setFormError('Network error: Failed to reach Supabase. Please check if your VITE_SUPABASE_URL is correct and starts with https://');
            } else {
                setFormError(err.message || 'An unexpected error occurred during signup.');
            }
        }
    };
    
    const handleGoogleLogin = async () => {
        if (import.meta.env.VITE_SUPABASE_URL === undefined || import.meta.env.VITE_SUPABASE_URL === '' || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
            setFormError('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.');
            return;
        }

        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });

            if (error) {
                setFormError(error.message || 'Google login failed.');
            } else {
                trackEvent('user_login_attempt', { method: 'google' });
            }
        } catch (err: any) {
            if (err.message === 'Failed to fetch') {
                setFormError('Network error: Failed to reach Supabase. Please check if your VITE_SUPABASE_URL is correct and starts with https://');
            } else {
                setFormError(err.message || 'An unexpected error occurred during Google login.');
            }
        }
    };

    const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (import.meta.env.VITE_SUPABASE_URL === undefined || import.meta.env.VITE_SUPABASE_URL === '' || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
            setFormError('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.');
            return;
        }

        const isEmailValid = validateAndSetField('email', email);
        if(!isEmailValid) return;

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                setFormError(error.message || "Failed to send reset email.");
            } else {
                switchView('resetSuccess');
            }
        } catch (err: any) {
            if (err.message === 'Failed to fetch') {
                setFormError('Network error: Failed to reach Supabase. Please check if your VITE_SUPABASE_URL is correct and starts with https://');
            } else {
                setFormError(err.message || 'An unexpected error occurred.');
            }
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950 font-sans selection:bg-accent selection:text-white items-center justify-center p-4 relative">
            
            {onBack && (
                <button 
                    onClick={onBack}
                    className="absolute top-6 left-6 sm:top-8 sm:left-8 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-2 transition-colors"
                >
                    &larr; Back to Home
                </button>
            )}

            <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="text-center">
                    <div className="inline-flex justify-center mb-6"><BrandLogo size="lg" /></div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display">
                        {authView === 'login' ? 'Welcome back' : 
                         authView === 'signup' ? 'Create an account' : 
                         authView === 'forgotPassword' ? 'Reset password' : 
                         'Password updated'}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                        {authView === 'login' ? 'Sign in to manage your invoices' : 
                         authView === 'signup' ? 'Start automating your financial workflow' : 
                         authView === 'forgotPassword' ? 'We\'ll send you reset instructions' : 
                         'You can now sign in with your new password'}
                    </p>
                </div>

                {/* Form Container */}
                <div className="glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl">
                    
                    {/* Auth Switcher (Tabs) */}
                    {(authView === 'login' || authView === 'signup') && (
                        <div className="flex bg-slate-100/80 dark:bg-slate-800/40 p-1 rounded-2xl mb-8 border border-slate-200/10 dark:border-slate-800/20">
                            <button
                                onClick={() => switchView('login')}
                                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${authView === 'login' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => switchView('signup')}
                                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${authView === 'signup' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                Sign Up
                            </button>
                        </div>
                    )}

                    {/* LOGIN VIEW */}
                    {authView === 'login' && (
                        <form onSubmit={handleLoginSubmit} className="space-y-5">
                            <div className="space-y-4">
                                <Input label="Email Address" id="email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); validateAndSetField('email', e.target.value); }} required placeholder="you@company.com" error={fieldErrors.email} />
                                <div>
                                    <Input label="Password" id="password" type="password" value={password} onChange={(e) => { setPassword(e.target.value); validateAndSetField('password', e.target.value); }} required placeholder="••••••••" error={fieldErrors.password} />
                                    <div className="flex justify-end mt-2">
                                        <button type="button" onClick={() => switchView('forgotPassword')} className="text-xs font-semibold text-accent hover:underline transition-all">Forgot password?</button>
                                    </div>
                                </div>
                            </div>

                            {formError && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm font-medium rounded-xl text-center border border-red-100 dark:border-red-900/30 animate-shake">{formError}</div>}

                            <Button type="submit" className="w-full py-3 text-base shadow-lg shadow-accent/25 rounded-xl bg-gradient-to-r from-accent to-indigo-600 hover:from-accent-hover hover:to-indigo-700 transition-all font-bold">Sign In</Button>

                            <div className="relative flex items-center justify-center my-6">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
                                <span className="relative bg-white dark:bg-slate-900 px-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">Or continue with</span>
                            </div>

                            <Button type="button" variant="secondary" className="w-full flex items-center justify-center gap-3 py-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl hover:shadow-sm" onClick={handleGoogleLogin}>
                                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                                <span className="text-slate-700 dark:text-slate-200 font-bold">Google</span>
                            </Button>
                        </form>
                    )}

                    {/* SIGNUP VIEW */}
                    {authView === 'signup' && (
                        <form onSubmit={handleSignupSubmit} className="space-y-5">
                            <div className="space-y-4">
                                <Input label="Full Name" id="name" type="text" value={name} onChange={(e) => { setName(e.target.value); validateAndSetField('name', e.target.value); }} required placeholder="John Doe" error={fieldErrors.name} />
                                <Input label="Email Address" id="email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); validateAndSetField('email', e.target.value); }} required placeholder="you@company.com" error={fieldErrors.email} />
                                <Input label="Create Password" id="password" type="password" value={password} onChange={(e) => { setPassword(e.target.value); validateAndSetField('password', e.target.value, true); }} required placeholder="Min 8 characters" error={fieldErrors.password} />
                            </div>

                            {formError && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm font-medium rounded-xl text-center border border-red-100 dark:border-red-900/30 animate-shake">{formError}</div>}

                            <Button type="submit" className="w-full py-3 text-base shadow-lg shadow-accent/25 rounded-xl bg-gradient-to-r from-accent to-indigo-600 hover:from-accent-hover hover:to-indigo-700 transition-all font-bold">Create Account</Button>
                            <p className="text-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider">By signing up, you agree to our Terms & Privacy Policy.</p>
                        </form>
                    )}

                    {/* FORGOT PASSWORD VIEW */}
                    {authView === 'forgotPassword' && (
                        <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                            <Input label="Email Address" id="email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); validateAndSetField('email', e.target.value); }} required placeholder="you@company.com" error={fieldErrors.email} />
                            
                            {formError && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm font-medium rounded-xl text-center border border-red-100 dark:border-red-900/30 animate-shake">{formError}</div>}
                            
                            <Button type="submit" className="w-full py-3 text-base shadow-lg shadow-accent/25 rounded-xl bg-gradient-to-r from-accent to-indigo-600 hover:from-accent-hover hover:to-indigo-700 transition-all font-bold">Send Reset Link</Button>
                            <button type="button" onClick={() => switchView('login')} className="w-full text-center text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 mt-4 transition-all">Back to Sign In</button>
                        </form>
                    )}

                    {/* SUCCESS VIEW */}
                    {authView === 'resetSuccess' && (
                        <div className="text-center py-4 animate-scale-in">
                            <div className="w-16 h-16 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-800/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Check className="w-8 h-8 text-green-600 dark:text-green-400 animate-pulse" strokeWidth={2} />
                            </div>
                            <Button onClick={() => switchView('login')} className="w-full py-3 text-base shadow-lg shadow-accent/25 rounded-xl bg-gradient-to-r from-accent to-indigo-600 hover:from-accent-hover hover:to-indigo-700 transition-all font-bold">Back to Sign In</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Auth;
