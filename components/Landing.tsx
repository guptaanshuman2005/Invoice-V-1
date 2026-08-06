import React from 'react';
import { Zap, CheckCircle2, ArrowRight, Shield, BarChart3, Mail, CreditCard, Cpu } from 'lucide-react';

interface LandingProps {
  onGetStarted: () => void;
  onNavigateToPrivacy?: () => void;
  onNavigateToTerms?: () => void;
}

const Landing: React.FC<LandingProps> = ({ onGetStarted, onNavigateToPrivacy, onNavigateToTerms }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-accent selection:text-white relative overflow-hidden">
      
      {/* Decorative Glowing Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/10 dark:bg-accent/15 rounded-full blur-[120px] -z-10 animate-pulse duration-[8s]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-[120px] -z-10 animate-pulse duration-[10s]" style={{ animationDelay: '3s' }}></div>

      {/* Grid Pattern Background overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] -z-10"></div>

      {/* Sticky Glassmorphic Navbar */}
      <nav className="sticky top-6 z-50 flex items-center justify-between px-8 py-4 max-w-5xl mx-auto rounded-3xl glass-panel shadow-lg border border-white/20 dark:border-slate-800/40 backdrop-blur-xl mt-6">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-r from-accent to-indigo-600 text-white p-2 rounded-xl shadow-md h-9 w-9 flex items-center justify-center">
            <Zap className="w-full h-full" strokeWidth={2.5} />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white font-display">InvoicePro</span>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-xs uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Pricing
          </button>
          <button 
            onClick={onGetStarted}
            className="text-xs uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={onGetStarted}
            className="text-xs uppercase tracking-wider font-black bg-gradient-to-r from-accent to-indigo-600 hover:from-accent-hover hover:to-indigo-700 text-white px-5 py-2.5 rounded-2xl transition-all shadow-md shadow-accent/20 hover:scale-105 active:scale-95"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-28 pb-24 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 dark:bg-accent/15 border border-accent/20 dark:border-accent/30 text-accent text-xs font-black uppercase tracking-widest mb-8">
          <span className="flex h-2.5 w-2.5 rounded-full bg-accent animate-pulse"></span>
          InvoicePro 2.0 is Live
        </div>
        <h1 className="text-5xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tight mb-8 max-w-5xl mx-auto leading-[1.05] font-display">
          The smartest way to manage your <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent via-indigo-500 to-purple-600 dark:from-accent dark:via-indigo-400 dark:to-purple-500 font-display">invoices & billing.</span>
        </h1>
        <p className="text-lg md:text-2xl text-slate-600 dark:text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
          Create professional invoices, track live inventory, and manage client relations in one unified glassmorphic platform. Designed for modern freelancers and fast-growing enterprises.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto sm:max-w-none">
          <button 
            onClick={onGetStarted}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-accent to-indigo-600 hover:from-accent-hover hover:to-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/25 hover:-translate-y-1"
          >
            Start Free Today <ArrowRight className="w-5 h-5" />
          </button>
          <button 
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-sm hover:-translate-y-1"
          >
            View Pricing
          </button>
        </div>
      </main>

      {/* Features Grid */}
      <section className="bg-white/60 dark:bg-slate-900/40 py-28 border-y border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 font-display">Everything you need to scale</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">Enterprise-grade tools packed into a beautiful, lightning-fast, and responsive dashboard.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            <div className="p-8 rounded-3xl glass-panel border border-slate-200/10 dark:border-slate-800/20 hover:-translate-y-2 transition-all duration-300 group">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 font-display">Advanced Analytics</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">Track total revenue, overdue accounts, Receivables Aging and GST tax breakdowns with live, interactive graphs.</p>
            </div>

            <div className="p-8 rounded-3xl glass-panel border border-slate-200/10 dark:border-slate-800/20 hover:-translate-y-2 transition-all duration-300 group">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 font-display">Seamless Payments</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">Accept UPI, Credit Card, and bank transfers via premium secure gateway integrations. Get paid 2x faster.</p>
            </div>

            <div className="p-8 rounded-3xl glass-panel border border-slate-200/10 dark:border-slate-800/20 hover:-translate-y-2 transition-all duration-300 group">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 font-display">Relational Synchronization</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">Enjoy seamless Supabase syncing. Deleting items, invoices, or quotes updates your database relations instantly.</p>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-28 max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 font-display">Simple, transparent pricing</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">Select the plan that matches your business model perfectly.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          
          {/* Monthly Tier */}
          <div className="p-8 rounded-3xl glass-panel border border-slate-200/20 dark:border-slate-800/20 flex flex-col hover:-translate-y-2 transition-all duration-300">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-wide">Monthly</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">Pay as you go, cancel anytime.</p>
            <div className="mb-8">
              <span className="text-5xl font-black text-slate-900 dark:text-white font-display">₹199</span>
              <span className="text-slate-500 dark:text-slate-400 font-bold"> / mo</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {['Up to 50 invoices/mo', 'Unlimited Workspaces', 'Custom branding & logos', 'Basic Analytics', 'Email support'].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 text-sm font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" /> {feature}
                </li>
              ))}
            </ul>
            <div className="p-4 bg-slate-100/50 dark:bg-slate-800/30 rounded-2xl mb-8 border border-slate-200/10 dark:border-slate-700/20">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-1">Need more invoices?</p>
                <p className="text-sm font-black text-slate-700 dark:text-slate-300 font-display">+ ₹99 per 20 extra invoices</p>
            </div>
            <button 
              onClick={onGetStarted}
              className="w-full py-3 rounded-xl font-bold border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-accent hover:text-accent dark:hover:text-accent transition-all hover:shadow-sm"
            >
              Get Started
            </button>
          </div>

          {/* Quarterly Tier */}
          <div className="p-8 rounded-3xl bg-slate-950 dark:bg-black border-2 border-accent/60 shadow-[0_20px_50px_rgba(79,70,229,0.25)] relative flex flex-col md:-translate-y-4 transition-all hover:-translate-y-6 duration-300">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-accent to-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase shadow-md shadow-accent/20">
              MOST POPULAR
            </div>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">Quarterly</h3>
            <p className="text-sm text-slate-400 mb-6 font-medium">Save 15% with quarterly billing.</p>
            <div className="mb-8">
              <span className="text-5xl font-black text-white font-display">₹499</span>
              <span className="text-slate-400 font-bold"> / qtr</span>
              <p className="text-xs text-accent mt-2.5 font-bold uppercase tracking-wider">Works out to ₹166/mo</p>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {['Up to 200 invoices/qtr', 'Unlimited Workspaces', 'Custom branding & logos', 'Advanced Analytics', 'Priority email support'].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-200 text-sm font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" /> {feature}
                </li>
              ))}
            </ul>
            <div className="p-4 bg-slate-800/30 rounded-2xl mb-8 border border-slate-700/20">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Need more invoices?</p>
                <p className="text-sm font-black text-white font-display">+ ₹249 per 50 extra invoices</p>
            </div>
            <button 
              onClick={onGetStarted}
              className="w-full py-3 rounded-xl font-black bg-gradient-to-r from-accent to-indigo-600 hover:from-accent-hover hover:to-indigo-700 text-white transition-all shadow-md shadow-accent/15"
            >
              Choose Quarterly
            </button>
          </div>

          {/* Yearly Tier */}
          <div className="p-8 rounded-3xl glass-panel border border-slate-200/20 dark:border-slate-800/20 flex flex-col hover:-translate-y-2 transition-all duration-300 relative">

            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-wide">Yearly</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">Best value for growing companies.</p>
            <div className="mb-8">
              <span className="text-5xl font-black text-slate-900 dark:text-white font-display">₹1,499</span>
              <span className="text-slate-500 dark:text-slate-400 font-bold"> / yr</span>
              <p className="text-xs text-emerald-500 mt-2.5 font-bold uppercase tracking-wider">Works out to ₹125/mo</p>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {['Up to 1000 invoices/yr', 'Unlimited Workspaces', 'White-labeling options', 'Custom Reports', '24/7 Priority support'].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 text-sm font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" /> {feature}
                </li>
              ))}
            </ul>
            <div className="p-4 bg-slate-100/50 dark:bg-slate-800/30 rounded-2xl mb-8 border border-slate-200/10 dark:border-slate-700/20">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-1">Need more invoices?</p>
                <p className="text-sm font-black text-slate-700 dark:text-slate-300 font-display">+ ₹899 per 200 extra invoices</p>
            </div>
            <button 
              onClick={onGetStarted}
              className="w-full py-3 rounded-xl font-bold border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-accent hover:text-accent dark:hover:text-accent transition-all hover:shadow-sm"
            >
              Choose Yearly
            </button>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/60 dark:bg-slate-900/60 border-t border-slate-200/40 dark:border-slate-800/40 backdrop-blur-md py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-accent" />
            <span className="font-extrabold text-slate-900 dark:text-white font-display">InvoicePro</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={onNavigateToPrivacy} className="text-xs uppercase tracking-wider font-extrabold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</button>
            <button onClick={onNavigateToTerms} className="text-xs uppercase tracking-wider font-extrabold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</button>
          </div>
          <p className="text-slate-400 text-xs font-semibold">© {new Date().getFullYear()} InvoicePro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
