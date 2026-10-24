import React from 'react';
import { 
  Receipt, ArrowRight, Play, Sparkles, BarChart3, IndianRupee, 
  Cpu, FileText, Package, Building2, CheckCircle2, ShieldCheck, Zap
} from 'lucide-react';
import Button from './common/Button';

interface LandingProps {
  onGetStarted: () => void;
  onSignIn?: () => void;
  onExploreDemo?: () => void;
  onLaunchSandbox?: () => void;
  onNavigateToPrivacy?: () => void;
  onNavigateToTerms?: () => void;
}

const Landing: React.FC<LandingProps> = ({ 
  onGetStarted, 
  onSignIn,
  onExploreDemo, 
  onLaunchSandbox, 
  onNavigateToPrivacy, 
  onNavigateToTerms 
}) => {
  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-secondary-dark font-sans selection:bg-accent/20 text-slate-900 dark:text-zinc-100 relative overflow-hidden">
      
      {/* Decorative Ambient Glowing Gradients matching App Interior */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/10 dark:bg-accent/15 rounded-full blur-[120px] -z-10 animate-pulse duration-[8s] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-[120px] -z-10 animate-pulse duration-[10s] pointer-events-none" style={{ animationDelay: '3s' }}></div>

      {/* Grid Pattern Background overlay matching App Interior */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] -z-10 pointer-events-none"></div>

      {/* Sticky App-Style Header Navbar */}
      <header className="sticky top-0 z-50 h-20 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-secondary-dark/80 backdrop-blur-md flex items-center justify-between px-6 sm:px-10">
        
        {/* Brand Area - 100% Identical to Sidebar.tsx */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-accent to-indigo-600 text-white p-2.5 rounded-2xl shadow-lg shadow-accent/20 shrink-0 hover:shadow-accent/40 hover:scale-105 active:scale-95 transition-all duration-300">
            <Receipt className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <div className="text-lg font-black tracking-tight text-slate-900 dark:text-white leading-none font-display flex items-center">
              InvoicePro<span className="text-accent bg-clip-text text-transparent bg-gradient-to-r from-accent to-indigo-400 font-extrabold ml-0.5">In</span>
            </div>
            <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-widest uppercase mt-1">
              Cloud Billing • India
            </div>
          </div>
        </div>

        {/* Navigation CTAs using Application's Standard Button Component */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={onExploreDemo || onLaunchSandbox}
            className="hidden sm:flex items-center gap-1.5 text-xs uppercase tracking-wider font-extrabold text-accent hover:text-accent-hover transition-colors px-3 py-2 rounded-xl hover:bg-accent/10"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Demo</span>
          </button>
          
          <button 
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="hidden md:inline-block text-xs uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors px-3 py-2"
          >
            Pricing
          </button>
          
          <Button 
            variant="secondary"
            onClick={onSignIn || onGetStarted}
            className="!py-2.5 !px-5 text-xs"
          >
            Sign In
          </Button>

          <Button 
            variant="primary"
            onClick={onGetStarted}
            className="!py-2.5 !px-5 text-xs"
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 sm:pt-24 pb-20 text-center relative z-10">
        
        {/* Compliance Pill matching App Interior Badges */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 dark:bg-accent/15 border border-accent/20 dark:border-accent/30 text-accent text-xs font-black uppercase tracking-widest mb-8">
          <span className="flex h-2.5 w-2.5 rounded-full bg-accent animate-pulse"></span>
          <span>InvoiceProIn • Indian GST Cloud Billing & Invoicing</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tight mb-8 max-w-5xl mx-auto leading-[1.08] font-display">
          The smartest way to manage your <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent via-indigo-500 to-purple-600 dark:from-accent dark:via-indigo-400 dark:to-purple-500 font-display">invoices & billing.</span>
        </h1>

        <p className="text-lg md:text-2xl text-slate-600 dark:text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
          Create GST-compliant invoices, track live inventory depletion, and manage client relations in one unified glassmorphic platform. Designed for modern Indian freelancers and fast-growing enterprises.
        </p>

        {/* Hero CTA Action Buttons using Application Button Components */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto mb-16">
          <Button 
            variant="primary"
            onClick={onGetStarted}
            className="w-full sm:w-auto flex items-center justify-center gap-2 !py-4 !px-8 text-sm"
          >
            Start Free Today <ArrowRight className="w-4 h-4" />
          </Button>

          {(onLaunchSandbox || onExploreDemo) && (
            <Button 
              variant="secondary"
              onClick={onLaunchSandbox || onExploreDemo}
              className="w-full sm:w-auto flex items-center justify-center gap-2 !py-4 !px-8 text-sm"
            >
              <Play className="w-4 h-4 fill-accent text-accent" />
              <span>Try Live Demo</span>
            </Button>
          )}

          <button 
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-6 py-4 rounded-2xl font-bold text-sm transition-all"
          >
            View Pricing
          </button>
        </div>

        {/* Demo Callout Showcase Card - Identical to Application's Glassmorphic Panels */}
        <div className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl glass-panel-elevated border border-accent/25 shadow-xl relative overflow-hidden text-left bg-gradient-to-r from-white/90 via-white/80 to-indigo-50/50 dark:from-[#161618]/90 dark:via-[#161618]/80 dark:to-indigo-950/30 backdrop-blur-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-accent">
                <Sparkles className="w-4 h-4" />
                <span>Instant Demo Sandbox Available</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display">
                Want to test before signing up?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                Launch the interactive sandbox preloaded with simulated Indian GST data (Apex Global Technologies, Mumbai). Test invoice templates, inventory alerts, and live tax calculations instantly.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
              {onExploreDemo && (
                <Button
                  variant="secondary"
                  onClick={onExploreDemo}
                  className="!py-3 !px-4 text-xs flex-1 md:flex-none"
                >
                  Template Tour
                </Button>
              )}
              <Button
                variant="primary"
                onClick={onLaunchSandbox || onGetStarted}
                className="!py-3 !px-6 text-xs flex-1 md:flex-none flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Launch Sandbox</span>
              </Button>
            </div>
          </div>
        </div>

      </main>

      {/* Features Grid - 100% Identical to Dashboard StatCard Glassmorphism */}
      <section id="features" className="bg-white/50 dark:bg-[#111113]/50 py-24 border-y border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 font-display">
              Everything you need to scale
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
              Enterprise-grade tools packed into a beautiful, lightning-fast, and responsive glassmorphic dashboard.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl glass-panel border border-slate-200/50 dark:border-slate-800/50 hover:-translate-y-1.5 transition-all duration-300 group shadow-sm hover:shadow-md">
              <div className="w-12 h-12 bg-violet-50/80 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 font-display">Advanced Analytics</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Track total revenue, overdue accounts, Receivables Aging, and GST tax breakdowns with live, interactive graphs.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl glass-panel border border-slate-200/50 dark:border-slate-800/50 hover:-translate-y-1.5 transition-all duration-300 group shadow-sm hover:shadow-md">
              <div className="w-12 h-12 bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <IndianRupee className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 font-display">GST & E-Way Transit</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Complete Indian GST council compliance with automatic CGST, SGST, IGST calculation and E-Way bill consignment numbers.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl glass-panel border border-slate-200/50 dark:border-slate-800/50 hover:-translate-y-1.5 transition-all duration-300 group shadow-sm hover:shadow-md">
              <div className="w-12 h-12 bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 font-display">Relational Synchronization</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Enjoy seamless Zoho Catalyst Cloud syncing. Deleting items, invoices, or quotes updates your database relations instantly.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-3xl glass-panel border border-slate-200/50 dark:border-slate-800/50 hover:-translate-y-1.5 transition-all duration-300 group shadow-sm hover:shadow-md">
              <div className="w-12 h-12 bg-purple-50/80 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 font-display">5 High-Impact PDF Templates</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Classic Corporate, Modern Indigo, Minimalist, Compact, and Thermal 80mm POS formats with live UPI QR code generation.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-3xl glass-panel border border-slate-200/50 dark:border-slate-800/50 hover:-translate-y-1.5 transition-all duration-300 group shadow-sm hover:shadow-md">
              <div className="w-12 h-12 bg-amber-50/80 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 font-display">Inventory & Stock Depletion</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Automated stock deduction on invoice creation with configurable safety thresholds to trigger replenishment warnings.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-3xl glass-panel border border-slate-200/50 dark:border-slate-800/50 hover:-translate-y-1.5 transition-all duration-300 group shadow-sm hover:shadow-md">
              <div className="w-12 h-12 bg-rose-50/80 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 font-display">Multi-GSTIN Workspaces</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Effortlessly manage multiple branches, companies, and separate invoice numbering series from one single account.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Section using Application's Glassmorphic Cards & Buttons */}
      <section id="pricing" className="py-28 max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 font-display">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
            Select the plan that matches your business model perfectly.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          
          {/* Monthly Tier */}
          <div className="p-8 rounded-3xl glass-panel border border-slate-200/50 dark:border-slate-800/50 flex flex-col hover:-translate-y-1.5 transition-all duration-300 shadow-sm hover:shadow-md">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-wide">Monthly</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">Pay as you go, cancel anytime.</p>
            <div className="mb-8">
              <span className="text-5xl font-black text-slate-900 dark:text-white font-display">₹49</span>
              <span className="text-slate-500 dark:text-slate-400 font-bold"> / mo</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {['Up to 50 invoices / mo', 'Standard GST Templates', 'Email & PDF Exports'].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 text-sm font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" /> {feature}
                </li>
              ))}
            </ul>
            <div className="p-4 bg-slate-100/60 dark:bg-slate-800/40 rounded-2xl mb-8 border border-slate-200/60 dark:border-slate-700/60">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-1">Need more invoices?</p>
              <p className="text-sm font-black text-slate-700 dark:text-slate-300 font-display">+ ₹29 per 50 extra invoices</p>
            </div>
            <Button 
              variant="secondary"
              onClick={onGetStarted}
              className="w-full !py-3 text-xs"
            >
              Get Started
            </Button>
          </div>

          {/* Quarterly Tier (Featured) */}
          <div className="p-8 rounded-3xl bg-slate-950 dark:bg-[#111113] border-2 border-accent/60 shadow-[0_20px_50px_rgba(79,70,229,0.25)] relative flex flex-col md:-translate-y-4 transition-all hover:-translate-y-5 duration-300">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-accent to-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase shadow-md shadow-accent/20">
              MOST POPULAR
            </div>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">Quarterly</h3>
            <p className="text-sm text-slate-400 mb-6 font-medium">Save with quarterly billing.</p>
            <div className="mb-8">
              <span className="text-5xl font-black text-white font-display">₹129</span>
              <span className="text-slate-400 font-bold"> / qtr</span>
              <p className="text-xs text-accent mt-2.5 font-bold uppercase tracking-wider">Works out to ₹43/mo</p>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {[
                'Up to 200 invoices / qtr', 
                'All Custom Templates & Colors', 
                'Automated Stock Depletion', 
                'WhatsApp 1-Click PDF Share'
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-200 text-sm font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" /> {feature}
                </li>
              ))}
            </ul>
            <div className="p-4 bg-white/5 dark:bg-white/5 rounded-2xl mb-8 border border-white/10">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Need more invoices?</p>
              <p className="text-sm font-black text-white font-display">+ ₹89 per 200 extra invoices</p>
            </div>
            <Button 
              variant="primary"
              onClick={onGetStarted}
              className="w-full !py-3 text-xs"
            >
              Choose Quarterly
            </Button>
          </div>

          {/* Yearly Tier */}
          <div className="p-8 rounded-3xl glass-panel border border-slate-200/50 dark:border-slate-800/50 flex flex-col hover:-translate-y-1.5 transition-all duration-300 relative shadow-sm hover:shadow-md">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-wide">Yearly</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">Best value for growing companies.</p>
            <div className="mb-8">
              <span className="text-5xl font-black text-slate-900 dark:text-white font-display">₹399</span>
              <span className="text-slate-500 dark:text-slate-400 font-bold"> / yr</span>
              <p className="text-xs text-emerald-500 mt-2.5 font-bold uppercase tracking-wider">Works out to ₹33/mo</p>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {[
                'Up to 1000 invoices / yr', 
                'Multi-user & Multiple Branches', 
                'Priority E-Way Transit Support', 
                'Full P&L Analytics Suite'
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 text-sm font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" /> {feature}
                </li>
              ))}
            </ul>
            <div className="p-4 bg-slate-100/60 dark:bg-slate-800/40 rounded-2xl mb-8 border border-slate-200/60 dark:border-slate-700/60">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-1">Need more invoices?</p>
              <p className="text-sm font-black text-slate-700 dark:text-slate-300 font-display">+ ₹199 per 500 extra invoices</p>
            </div>
            <Button 
              variant="secondary"
              onClick={onGetStarted}
              className="w-full !py-3 text-xs"
            >
              Choose Yearly
            </Button>
          </div>

        </div>
      </section>

      {/* Footer matching App Interior */}
      <footer className="bg-white/50 dark:bg-[#0A0A0A]/80 border-t border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-accent to-indigo-600 text-white p-2 rounded-xl shadow-md">
              <Receipt className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-slate-900 dark:text-white font-display">
              InvoicePro<span className="text-accent">In</span>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={onExploreDemo || onLaunchSandbox} className="text-xs uppercase tracking-wider font-extrabold text-accent hover:underline">
              Interactive Demo
            </button>
            <button onClick={onNavigateToPrivacy} className="text-xs uppercase tracking-wider font-extrabold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
              Privacy Policy
            </button>
            <button onClick={onNavigateToTerms} className="text-xs uppercase tracking-wider font-extrabold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
              Terms of Service
            </button>
          </div>
          <p className="text-slate-400 text-xs font-semibold">
            © {new Date().getFullYear()} InvoiceProIn. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
