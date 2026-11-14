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
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0B0C0E] font-sans selection:bg-indigo-500/20 text-zinc-900 dark:text-zinc-100 relative">
      
      {/* Sticky App-Style Header Navbar */}
      <header className="sticky top-0 z-50 h-16 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#0B0C0E]/90 backdrop-blur-md flex items-center justify-between px-6 sm:px-10">
        
        {/* Brand Area */}
        <div className="flex items-center gap-3">
          <img 
            src="/icons/icon-192.png" 
            alt="InvoiceProIn Logo" 
            className="w-8 h-8 rounded-xl shadow-xs shrink-0 object-contain" 
          />
          <div className="text-left">
            <div className="text-base font-bold tracking-tight text-zinc-900 dark:text-white leading-none flex items-center">
              InvoicePro<span className="text-indigo-600 dark:text-indigo-400 ml-0.5">In</span>
            </div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium tracking-wide mt-0.5">
              Cloud Billing • India
            </div>
          </div>
        </div>

        {/* Navigation CTAs */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={onExploreDemo || onLaunchSandbox}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
          >
            <span>Interactive Demo</span>
          </button>
          
          <button 
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="hidden md:inline-block text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors px-3 py-1.5"
          >
            Pricing
          </button>
          
          <Button 
            variant="secondary"
            onClick={onSignIn || onGetStarted}
            className="!py-2 !px-4 text-xs"
          >
            Sign in
          </Button>

          <Button 
            variant="primary"
            onClick={onGetStarted}
            className="!py-2 !px-4 text-xs"
          >
            Get started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 pt-16 sm:pt-20 pb-20 text-center relative z-10">
        
        {/* Compliance Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 text-xs font-medium mb-6">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
          <span>Indian GST Cloud Billing & Invoicing</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-zinc-900 dark:text-white tracking-tight mb-6 max-w-4xl mx-auto leading-[1.12]">
          Professional GST invoicing, built for Indian businesses.
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Create GST-compliant invoices, track inventory depletion in real-time, and manage client payments accurately. Fast, reliable, and designed for day-to-day operations.
        </p>

        {/* Hero CTA Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto mb-16">
          <Button 
            variant="primary"
            onClick={onGetStarted}
            className="w-full sm:w-auto flex items-center justify-center gap-2 !py-2.5 !px-6 text-sm"
          >
            Start free <ArrowRight className="w-4 h-4" />
          </Button>

          {(onLaunchSandbox || onExploreDemo) && (
            <Button 
              variant="secondary"
              onClick={onLaunchSandbox || onExploreDemo}
              className="w-full sm:w-auto flex items-center justify-center gap-2 !py-2.5 !px-6 text-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Try interactive demo</span>
            </Button>
          )}
        </div>

        {/* Demo Callout Showcase Card */}
        <div className="max-w-3xl mx-auto p-6 sm:p-7 rounded-2xl glass-panel border border-zinc-200 dark:border-zinc-800 text-left shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <span>Instant Sandbox Available</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">
                Test the application without signing up
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-lg leading-relaxed">
                Launch an interactive sandbox preloaded with sample GST billing data. Test invoice templates, inventory deduction, and live tax calculations instantly.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
              <Button
                variant="primary"
                onClick={onLaunchSandbox || onGetStarted}
                className="!py-2.5 !px-5 text-xs flex-1 md:flex-none flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Launch sandbox</span>
              </Button>
            </div>
          </div>
        </div>

      </main>

      {/* Features Grid */}
      <section id="features" className="py-20 border-y border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-[#0E0F13]/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-3">
              Built for speed, accuracy, and GST compliance
            </h2>
            <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
              Everything required to manage professional invoicing, tax filings, and client balances in one reliable workspace.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl glass-panel border border-zinc-200/80 dark:border-zinc-800/80 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
              <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-2">Revenue & Tax Analytics</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Track total revenue, overdue accounts, receivables aging, and GST tax breakdowns with clear, responsive summaries.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl glass-panel border border-zinc-200/80 dark:border-zinc-800/80 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
              <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl flex items-center justify-center mb-4">
                <IndianRupee className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-2">GST & E-Way Ready</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Indian GST council compliance with automatic CGST, SGST, IGST calculation and E-Way bill consignment numbers.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl glass-panel border border-zinc-200/80 dark:border-zinc-800/80 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
              <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-2">Cloud Database Sync</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Seamless cloud synchronization powered by Zoho Catalyst. Manage invoices, quotes, and clients with zero data loss.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl glass-panel border border-zinc-200/80 dark:border-zinc-800/80 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
              <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-2">5 Professional PDF Formats</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Classic Corporate, Modern Indigo, Minimalist, Compact, and Thermal 80mm POS formats with dynamic UPI QR payment codes.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl glass-panel border border-zinc-200/80 dark:border-zinc-800/80 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
              <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl flex items-center justify-center mb-4">
                <Package className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-2">Inventory Depletion</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Automated stock deduction on invoice generation with safety thresholds to warn you before items run out.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl glass-panel border border-zinc-200/80 dark:border-zinc-800/80 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
              <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-2">Multi-Workspace Support</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Manage multiple companies, GSTINs, and separate invoice numbering sequences from one account.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-3">
            Simple, transparent pricing
          </h2>
          <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Choose the billing plan that fits your business volume.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          
          {/* Monthly Tier */}
          <div className="p-7 rounded-2xl glass-panel border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col shadow-xs">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Monthly</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 font-medium">Pay as you go, cancel anytime.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-zinc-900 dark:text-white">₹49</span>
              <span className="text-zinc-500 dark:text-zinc-400 text-sm font-medium"> / month</span>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              {['Up to 50 invoices / mo', 'Standard GST Templates', 'Email & PDF Exports'].map((feature, i) => (
                <li key={i} className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> {feature}
                </li>
              ))}
            </ul>
            <div className="p-3 bg-zinc-100/70 dark:bg-zinc-800/40 rounded-xl mb-6 border border-zinc-200/70 dark:border-zinc-700/60 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">+ ₹29</span> per 50 extra invoices
            </div>
            <Button 
              variant="secondary"
              onClick={onGetStarted}
              className="w-full !py-2.5 text-xs"
            >
              Get started
            </Button>
          </div>

          {/* Quarterly Tier (Featured) */}
          <div className="p-7 rounded-2xl bg-zinc-900 text-white dark:bg-[#15161A] border-2 border-indigo-600 dark:border-indigo-500 shadow-md relative flex flex-col md:-translate-y-2">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-3 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase">
              Most popular
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Quarterly</h3>
            <p className="text-xs text-zinc-400 mb-6 font-medium">Save with quarterly billing.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">₹129</span>
              <span className="text-zinc-400 text-sm font-medium"> / quarter</span>
              <p className="text-xs text-indigo-400 mt-1 font-medium">Works out to ₹43/month</p>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              {[
                'Up to 200 invoices / qtr', 
                'All Custom Templates & Colors', 
                'Automated Stock Depletion', 
                'WhatsApp 1-Click PDF Share'
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-2.5 text-zinc-200 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" /> {feature}
                </li>
              ))}
            </ul>
            <div className="p-3 bg-white/5 rounded-xl mb-6 border border-white/10 text-xs text-zinc-300">
              <span className="font-semibold text-white">+ ₹89</span> per 200 extra invoices
            </div>
            <Button 
              variant="primary"
              onClick={onGetStarted}
              className="w-full !py-2.5 text-xs !bg-indigo-600 hover:!bg-indigo-500 !border-indigo-500"
            >
              Choose quarterly
            </Button>
          </div>

          {/* Yearly Tier */}
          <div className="p-7 rounded-2xl glass-panel border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col shadow-xs">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Yearly</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 font-medium">Best value for growing companies.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-zinc-900 dark:text-white">₹399</span>
              <span className="text-zinc-500 dark:text-zinc-400 text-sm font-medium"> / year</span>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Works out to ₹33/month</p>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              {[
                'Up to 1000 invoices / yr', 
                'Multi-user & Multiple Branches', 
                'Priority E-Way Transit Support', 
                'Full P&L Analytics Suite'
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> {feature}
                </li>
              ))}
            </ul>
            <div className="p-3 bg-zinc-100/70 dark:bg-zinc-800/40 rounded-xl mb-6 border border-zinc-200/70 dark:border-zinc-700/60 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">+ ₹199</span> per 500 extra invoices
            </div>
            <Button 
              variant="secondary"
              onClick={onGetStarted}
              className="w-full !py-2.5 text-xs"
            >
              Choose yearly
            </Button>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#0B0C0E] py-10 relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <img 
              src="/icons/icon-192.png" 
              alt="InvoiceProIn Logo" 
              className="w-6 h-6 rounded-lg shrink-0 object-contain" 
            />
            <span className="font-semibold text-sm text-zinc-900 dark:text-white">
              InvoicePro<span className="text-indigo-600 dark:text-indigo-400">In</span>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={onExploreDemo || onLaunchSandbox} className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Interactive demo
            </button>
            <button onClick={onNavigateToPrivacy} className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              Privacy policy
            </button>
            <button onClick={onNavigateToTerms} className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              Terms of service
            </button>
          </div>
          <p className="text-zinc-500 text-xs font-normal">
            © {new Date().getFullYear()} InvoiceProIn. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
