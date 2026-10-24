import React, { useState } from 'react';
import { 
  Receipt, Zap, CheckCircle2, ArrowRight, Shield, BarChart3, Mail, 
  CreditCard, Cpu, Play, Sparkles, FileText, IndianRupee, Share2, 
  Printer, TrendingUp, Box, Layers, Globe, Building2, Check, ArrowUpRight,
  ChevronRight, Smartphone
} from 'lucide-react';

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
  // Interactive GST preview inside the app hero mockup
  const [taxMode, setTaxMode] = useState<'intra' | 'inter'>('intra');
  const [demoAmount, setDemoAmount] = useState<number>(50000);

  const cgst = taxMode === 'intra' ? (demoAmount * 0.09) : 0;
  const sgst = taxMode === 'intra' ? (demoAmount * 0.09) : 0;
  const igst = taxMode === 'inter' ? (demoAmount * 0.18) : 0;
  const totalTax = cgst + sgst + igst;
  const totalWithTax = demoAmount + totalTax;

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-[#0A0A0A] font-sans selection:bg-accent/20 text-slate-900 dark:text-zinc-100 relative overflow-x-hidden">
      
      {/* Ambient Deep-Space Background Gradients matching App Interior */}
      <div className="fixed top-[-15%] left-[-10%] w-[60%] h-[60%] bg-accent/15 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse duration-[10s]"></div>
      <div className="fixed bottom-[-15%] right-[-10%] w-[55%] h-[55%] bg-purple-500/15 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse duration-[12s]" style={{ animationDelay: '4s' }}></div>
      <div className="fixed top-[40%] right-[20%] w-[35%] h-[35%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      {/* Grid Pattern Background overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-10"></div>

      {/* Sticky Glassmorphic Navbar */}
      <header className="sticky top-4 z-50 px-4 sm:px-6">
        <nav className="flex items-center justify-between px-5 sm:px-7 py-3 max-w-6xl mx-auto rounded-2xl glass-panel-elevated shadow-xl border border-slate-200/50 dark:border-zinc-800/80 backdrop-blur-2xl">
          {/* Brand Logo - 100% matched with Sidebar.tsx */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-accent to-indigo-600 text-white p-2 sm:p-2.5 rounded-xl shadow-lg shadow-accent/25 shrink-0">
              <Receipt className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <div className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none font-display flex items-center">
                InvoicePro<span className="text-accent bg-clip-text text-transparent bg-gradient-to-r from-accent to-indigo-400 font-extrabold ml-0.5">In</span>
              </div>
              <div className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold tracking-widest uppercase mt-0.5 hidden xs:block">
                Cloud Billing • India
              </div>
            </div>
          </div>

          {/* Nav Links & CTAs */}
          <div className="flex items-center gap-3 sm:gap-6">
            <button 
              onClick={onExploreDemo || onLaunchSandbox}
              className="hidden sm:flex items-center gap-1.5 text-xs uppercase tracking-wider font-extrabold text-accent hover:text-accent-hover transition-colors px-3 py-1.5 rounded-lg hover:bg-accent/10"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Live Demo</span>
            </button>
            <button 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="hidden md:inline-block text-xs uppercase tracking-wider font-extrabold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Features
            </button>
            <button 
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="hidden md:inline-block text-xs uppercase tracking-wider font-extrabold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Pricing
            </button>
            <button 
              onClick={onSignIn || onGetStarted}
              className="text-xs uppercase tracking-wider font-extrabold text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors px-3 py-1.5"
            >
              Sign In
            </button>
            <button 
              onClick={onGetStarted}
              className="text-xs uppercase tracking-wider font-black bg-gradient-to-r from-accent to-indigo-600 hover:from-accent-hover hover:to-indigo-700 text-white px-4 sm:px-5 py-2.5 rounded-xl transition-all shadow-md shadow-accent/25 hover:scale-105 active:scale-95"
            >
              Get Started
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center relative z-10">
        
        {/* Compliance & Edition Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 dark:bg-accent/15 border border-accent/25 dark:border-accent/30 text-accent text-xs font-black uppercase tracking-widest mb-6 sm:mb-8 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse"></span>
          <span>GSTIN 2026 Ready • Built for Indian Enterprises & SMBs</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tight mb-6 max-w-5xl mx-auto leading-[1.08] font-display">
          Smart Invoicing & Billing <br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent via-indigo-400 to-purple-500 font-display">
            Engineered for India.
          </span>
        </h1>

        <p className="text-base sm:text-xl md:text-2xl text-slate-600 dark:text-zinc-400 mb-10 max-w-3xl mx-auto leading-relaxed font-medium">
          Create GST-compliant tax invoices, track live inventory depletion, manage multi-state client GSTINs, and collect instant payments — all within an ultra-responsive dark glassmorphic platform.
        </p>

        {/* Hero Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-xl mx-auto mb-14">
          <button 
            onClick={onGetStarted}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-gradient-to-r from-accent to-indigo-600 hover:from-accent-hover hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-black text-base sm:text-lg transition-all shadow-lg shadow-accent/30 hover:shadow-xl hover:shadow-accent/40 hover:-translate-y-0.5 active:scale-95"
          >
            Start Free Today <ArrowRight className="w-5 h-5" />
          </button>

          {(onLaunchSandbox || onExploreDemo) && (
            <button 
              onClick={onLaunchSandbox || onExploreDemo}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/80 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-800 text-accent dark:text-indigo-400 border border-slate-200 dark:border-zinc-700/80 px-7 py-4 rounded-xl font-bold text-base transition-all shadow-sm hover:-translate-y-0.5 active:scale-95 backdrop-blur-md"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Live Sandbox</span>
            </button>
          )}

          <button 
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white px-5 py-3 rounded-xl font-bold text-sm transition-all"
          >
            Plans from ₹49/mo
          </button>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE LIVE APP PREVIEW MOCKUP WINDOW (Matches Inside of App)        */}
        {/* ========================================================================= */}
        <div className="max-w-6xl mx-auto rounded-2xl glass-panel-elevated border border-slate-300/60 dark:border-zinc-800 shadow-2xl shadow-indigo-500/10 overflow-hidden text-left transition-all duration-500">
          
          {/* Window Title Bar */}
          <div className="bg-slate-100/90 dark:bg-zinc-900/95 px-4 py-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              <span className="ml-3 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 font-mono hidden sm:inline">
                https://invoiceproin.onslate.in/dashboard
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Catalyst Cloud Synced</span>
            </div>
          </div>

          {/* App Window Interior */}
          <div className="p-4 sm:p-6 md:p-8 bg-slate-50/60 dark:bg-[#0B0F17]/95">
            
            {/* Top Workspace Bar inside Mockup */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200 dark:border-zinc-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                  AG
                </div>
                <div>
                  <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    Apex Global Technologies Pvt Ltd
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-accent/15 text-accent font-bold">ACTIVE</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                    GSTIN: 27AABCU9603R1ZM • Maharashtra (State Code 27)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={onLaunchSandbox || onGetStarted}
                  className="flex items-center gap-1.5 text-xs font-bold bg-accent hover:bg-accent-hover text-white px-3.5 py-2 rounded-lg shadow-sm transition-all"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>+ New Tax Invoice</span>
                </button>
                <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400 bg-white/60 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 px-3 py-2 rounded-lg font-medium">
                  <Globe className="w-3.5 h-3.5 text-accent" />
                  <span>FY 2025-26</span>
                </div>
              </div>
            </div>

            {/* Dashboard Stat Cards inside Mockup (Real App Interior replica) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              
              {/* Card 1: Revenue */}
              <div className="p-4 rounded-xl glass-panel border border-slate-200/60 dark:border-zinc-800/80 text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Total Billed</span>
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5" /> +18.4%
                  </span>
                </div>
                <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white font-display">
                  ₹14,82,450
                </div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">Across 142 Invoices</div>
              </div>

              {/* Card 2: Receivables */}
              <div className="p-4 rounded-xl glass-panel border border-slate-200/60 dark:border-zinc-800/80 text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Receivables</span>
                  <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    3 Overdue
                  </span>
                </div>
                <div className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-display">
                  ₹1,24,000
                </div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">Aging: ₹34K &gt; 30 days</div>
              </div>

              {/* Card 3: GST Liability */}
              <div className="p-4 rounded-xl glass-panel border border-slate-200/60 dark:border-zinc-800/80 text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">GST Output Tax</span>
                  <span className="text-[10px] font-bold text-violet-500 bg-violet-500/10 px-1.5 py-0.5 rounded">
                    Q3 Filed
                  </span>
                </div>
                <div className="text-lg sm:text-2xl font-black text-violet-600 dark:text-violet-400 font-display">
                  ₹2,66,841
                </div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">CGST + SGST + IGST</div>
              </div>

              {/* Card 4: Inventory Health */}
              <div className="p-4 rounded-xl glass-panel border border-slate-200/60 dark:border-zinc-800/80 text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Active SKUs</span>
                  <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">
                    Auto Stock
                  </span>
                </div>
                <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white font-display">
                  84 Items
                </div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">2 Low-Stock Alerts</div>
              </div>

            </div>

            {/* Interactive GST Split Simulation inside Mockup */}
            <div className="p-4 sm:p-5 rounded-xl bg-white/80 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-accent flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Interactive Real-Time GST Split Engine</span>
                  </div>
                  <div className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                    Test how InvoiceProIn calculates Indian GST automatically
                  </div>
                </div>

                {/* Tax Mode Toggle */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-zinc-800 rounded-lg shrink-0">
                  <button 
                    onClick={() => setTaxMode('intra')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${taxMode === 'intra' ? 'bg-accent text-white shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    Intra-State (CGST + SGST)
                  </button>
                  <button 
                    onClick={() => setTaxMode('inter')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${taxMode === 'inter' ? 'bg-accent text-white shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    Inter-State (IGST 18%)
                  </button>
                </div>
              </div>

              {/* Live Tax Split Display */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-zinc-950/80 p-3.5 rounded-lg border border-slate-200/60 dark:border-zinc-800/80">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Taxable Value</div>
                  <div className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-zinc-200 font-mono">
                    ₹{demoAmount.toLocaleString('en-IN')}
                  </div>
                </div>

                {taxMode === 'intra' ? (
                  <>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">CGST (9.0%)</div>
                      <div className="text-sm sm:text-base font-extrabold text-accent font-mono">
                        ₹{cgst.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">SGST (9.0%)</div>
                      <div className="text-sm sm:text-base font-extrabold text-indigo-400 font-mono">
                        ₹{sgst.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="col-span-2">
                    <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">IGST Integrated Tax (18.0%)</div>
                    <div className="text-sm sm:text-base font-extrabold text-purple-400 font-mono">
                      ₹{igst.toLocaleString('en-IN')} (Out-of-state Supply)
                    </div>
                  </div>
                )}

                <div className="border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-zinc-800 pt-2 sm:pt-0 sm:pl-3">
                  <div className="text-[10px] uppercase font-bold text-emerald-500">Total Invoice Value</div>
                  <div className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    ₹{totalWithTax.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Action Preview bar */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800/60 text-xs">
                <span className="text-slate-500 dark:text-zinc-400 text-[11px]">
                  HSN: <strong className="text-slate-700 dark:text-zinc-300">998314</strong> (IT Software Consulting Services)
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={onExploreDemo || onLaunchSandbox}
                    className="text-accent hover:underline font-bold text-xs flex items-center gap-1"
                  >
                    <span>Inspect 5 PDF Templates</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* ========================================================================= */}
      {/* FEATURES SECTION (Identical Glassmorphic Styling as Dashboard)            */}
      {/* ========================================================================= */}
      <section id="features" className="py-24 border-y border-slate-200/50 dark:border-zinc-800/60 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-xl relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-black uppercase tracking-widest mb-3">
              <Zap className="w-3.5 h-3.5" /> Core Capabilities
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white font-display tracking-tight">
              Everything required to bill, audit & scale
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto font-medium mt-3">
              Built with Zoho Catalyst serverless infrastructure for absolute reliability, multi-state tax splits, and instant cloud persistence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            
            {/* Feature 1 */}
            <div className="p-7 rounded-2xl glass-panel border border-slate-200/60 dark:border-zinc-800/80 hover:-translate-y-1 transition-all duration-300 group shadow-sm hover:shadow-lg hover:shadow-accent/5">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <IndianRupee className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2.5 font-display">
                Automated Indian GST Splits
              </h3>
              <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Smart state detection automatically segregates CGST + SGST (Intra-state) and IGST (Inter-state) based on client & company GSTIN state codes.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-7 rounded-2xl glass-panel border border-slate-200/60 dark:border-zinc-800/80 hover:-translate-y-1 transition-all duration-300 group shadow-sm hover:shadow-lg hover:shadow-accent/5">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2.5 font-display">
                Zoho Catalyst Relational Cloud
              </h3>
              <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Zero-data-loss cloud persistence. Modifying items, client GST records, or invoices updates your relational database with zero round-trip latency.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-7 rounded-2xl glass-panel border border-slate-200/60 dark:border-zinc-800/80 hover:-translate-y-1 transition-all duration-300 group shadow-sm hover:shadow-lg hover:shadow-accent/5">
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2.5 font-display">
                5 High-Impact PDF Templates
              </h3>
              <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Classic Corporate, Modern Indigo, Minimalist, Compact, and Thermal 80mm POS formats with live UPI QR code generation and instant print.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-7 rounded-2xl glass-panel border border-slate-200/60 dark:border-zinc-800/80 hover:-translate-y-1 transition-all duration-300 group shadow-sm hover:shadow-lg hover:shadow-accent/5">
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Box className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2.5 font-display">
                Inventory & Low-Stock Alerts
              </h3>
              <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Real-time stock depletion whenever an invoice is finalized. Configure safety thresholds to trigger instant replenishment warnings.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-7 rounded-2xl glass-panel border border-slate-200/60 dark:border-zinc-800/80 hover:-translate-y-1 transition-all duration-300 group shadow-sm hover:shadow-lg hover:shadow-accent/5">
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2.5 font-display">
                Multi-GSTIN Company Workspaces
              </h3>
              <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Switch effortlessly between multiple branches or companies with separate invoice prefix series (e.g. INV/2026/, MUM/EXP/) from one login.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-7 rounded-2xl glass-panel border border-slate-200/60 dark:border-zinc-800/80 hover:-translate-y-1 transition-all duration-300 group shadow-sm hover:shadow-lg hover:shadow-accent/5">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2.5 font-display">
                WhatsApp & Cashfree Payments
              </h3>
              <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                Send 1-click WhatsApp payment reminders with embedded UPI payment links powered by Cashfree Payments sandbox and production gateways.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PRICING SECTION                                                           */}
      {/* ========================================================================= */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-black uppercase tracking-widest mb-3">
            <IndianRupee className="w-3.5 h-3.5" /> Fair & Transparent
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white font-display tracking-tight">
            Plans built for Indian businesses
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto font-medium mt-3">
            Includes 5 free lifetime invoices to get started. Upgrade whenever your volume expands.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          
          {/* Monthly Tier */}
          <div className="p-8 rounded-2xl glass-panel border border-slate-200/60 dark:border-zinc-800/80 flex flex-col hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wide">Monthly</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">Flexible</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6 font-medium">Pay as you go, cancel anytime.</p>
            
            <div className="mb-8">
              <span className="text-5xl font-black text-slate-900 dark:text-white font-display">₹49</span>
              <span className="text-slate-500 dark:text-zinc-400 font-bold"> / month</span>
            </div>

            <ul className="space-y-3.5 mb-8 flex-1">
              {[
                'Up to 50 GST Invoices / month', 
                'All 5 Print & PDF Templates', 
                'Full Inventory Stock Depletion',
                'Email & WhatsApp PDF Share'
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-zinc-300 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0" /> {feature}
                </li>
              ))}
            </ul>

            <div className="p-3.5 bg-slate-100/70 dark:bg-zinc-900/60 rounded-xl mb-6 border border-slate-200/70 dark:border-zinc-800/80">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-bold mb-0.5">Need more invoices?</p>
              <p className="text-xs font-black text-slate-800 dark:text-zinc-200 font-display">+ ₹29 per 50 additional invoices</p>
            </div>

            <button 
              onClick={onGetStarted}
              className="w-full py-3 rounded-xl font-bold border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 hover:border-accent hover:text-accent dark:hover:text-accent transition-all active:scale-95 shadow-sm"
            >
              Get Started
            </button>
          </div>

          {/* Quarterly Tier (Highlighted) */}
          <div className="p-8 rounded-2xl bg-slate-950 dark:bg-zinc-900/90 border-2 border-accent shadow-[0_20px_50px_rgba(79,70,229,0.22)] relative flex flex-col md:-translate-y-3 transition-all hover:-translate-y-4 duration-300">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-accent to-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase shadow-md shadow-accent/25">
              RECOMMENDED
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-black text-white uppercase tracking-wide">Quarterly</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/20 px-2.5 py-1 rounded-md">Save 12%</span>
            </div>
            <p className="text-sm text-zinc-400 mb-6 font-medium">Billed every 3 months.</p>
            
            <div className="mb-8">
              <span className="text-5xl font-black text-white font-display">₹129</span>
              <span className="text-zinc-400 font-bold"> / quarter</span>
              <p className="text-xs text-accent mt-2 font-bold uppercase tracking-wider">Works out to ₹43 / month</p>
            </div>

            <ul className="space-y-3.5 mb-8 flex-1">
              {[
                'Up to 200 GST Invoices / quarter', 
                'All 5 Custom PDF Templates & Colors', 
                'Automated Stock Depletion & Alerts', 
                'Cashfree Payment Links & WhatsApp Share',
                'Multi-user Access & Export GSTR-1'
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-zinc-200 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0" /> {feature}
                </li>
              ))}
            </ul>

            <div className="p-3.5 bg-white/5 rounded-xl mb-6 border border-white/10">
              <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold mb-0.5">Need more invoices?</p>
              <p className="text-xs font-black text-white font-display">+ ₹89 per 200 additional invoices</p>
            </div>

            <button 
              onClick={onGetStarted}
              className="w-full py-3.5 rounded-xl font-black bg-gradient-to-r from-accent to-indigo-600 hover:from-accent-hover hover:to-indigo-700 text-white transition-all active:scale-95 shadow-md shadow-accent/25"
            >
              Choose Quarterly
            </button>
          </div>

          {/* Yearly Tier */}
          <div className="p-8 rounded-2xl glass-panel border border-slate-200/60 dark:border-zinc-800/80 flex flex-col hover:-translate-y-1 transition-all duration-300 relative shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wide">Yearly</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-md">Best Value</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6 font-medium">Billed annually for max savings.</p>
            
            <div className="mb-8">
              <span className="text-5xl font-black text-slate-900 dark:text-white font-display">₹399</span>
              <span className="text-slate-500 dark:text-zinc-400 font-bold"> / year</span>
              <p className="text-xs text-emerald-500 mt-2 font-bold uppercase tracking-wider">Works out to ₹33 / month</p>
            </div>

            <ul className="space-y-3.5 mb-8 flex-1">
              {[
                'Up to 1,000 GST Invoices / year', 
                'Multi-branch Legal Entity Support', 
                'Full P&L and Receivables Aging Analytics', 
                'Priority E-Way Transit Support',
                'Custom Invoice Number Prefix Routing'
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-zinc-300 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0" /> {feature}
                </li>
              ))}
            </ul>

            <div className="p-3.5 bg-slate-100/70 dark:bg-zinc-900/60 rounded-xl mb-6 border border-slate-200/70 dark:border-zinc-800/80">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-bold mb-0.5">Need more invoices?</p>
              <p className="text-xs font-black text-slate-800 dark:text-zinc-200 font-display">+ ₹199 per 500 additional invoices</p>
            </div>

            <button 
              onClick={onGetStarted}
              className="w-full py-3 rounded-xl font-bold border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 hover:border-accent hover:text-accent dark:hover:text-accent transition-all active:scale-95 shadow-sm"
            >
              Choose Yearly
            </button>
          </div>

        </div>
      </section>

      {/* Footer matching App Interior Branding */}
      <footer className="bg-white/60 dark:bg-[#07090E] border-t border-slate-200/50 dark:border-zinc-800/80 backdrop-blur-xl py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-accent to-indigo-600 text-white p-2 rounded-xl shadow-md">
              <Receipt className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="font-extrabold text-base text-slate-900 dark:text-white font-display">
                InvoicePro<span className="text-accent">In</span>
              </div>
              <div className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold tracking-widest uppercase">
                Zoho Catalyst Slate Powered
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs uppercase tracking-wider font-extrabold">
            <button onClick={onExploreDemo || onLaunchSandbox} className="text-accent hover:underline">
              Live Sandbox
            </button>
            <button onClick={onNavigateToPrivacy} className="text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              Privacy Policy
            </button>
            <button onClick={onNavigateToTerms} className="text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              Terms of Service
            </button>
          </div>
          
          <p className="text-slate-400 dark:text-zinc-500 text-xs font-semibold">
            © {new Date().getFullYear()} InvoiceProIn. All rights reserved. Made for Indian Businesses.
          </p>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
