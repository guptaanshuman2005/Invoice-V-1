import React, { useState } from 'react';
import { 
  Zap, ArrowRight, Play, CheckCircle2, FileText, 
  Sparkles, RefreshCw, Layers, ShieldCheck, Share2, 
  Smartphone, BarChart3, Boxes, IndianRupee, Eye, ArrowLeft
} from 'lucide-react';
import Button from './common/Button';

interface DemoPageProps {
  onLaunchSandbox: () => void;
  onBackToLanding: () => void;
  onGetStarted: () => void;
}

export const DemoPage: React.FC<DemoPageProps> = ({
  onLaunchSandbox,
  onBackToLanding,
  onGetStarted
}) => {
  // Template Previewer State
  const [selectedTemplate, setSelectedTemplate] = useState<'modern' | 'classic' | 'elegant' | 'compact'>('modern');
  const [accentColor, setAccentColor] = useState<string>('#4f46e5');

  // Interactive GST Simulator State
  const [taxableAmount, setTaxableAmount] = useState<number>(50000);
  const [gstRate, setGstRate] = useState<number>(18);
  const [isInterstate, setIsInterstate] = useState<boolean>(false);

  // Calculate GST
  const totalTax = (taxableAmount * gstRate) / 100;
  const cgst = isInterstate ? 0 : totalTax / 2;
  const sgst = isInterstate ? 0 : totalTax / 2;
  const igst = isInterstate ? totalTax : 0;
  const grandTotal = taxableAmount + totalTax;

  const colorPalette = [
    { name: 'Indigo', hex: '#4f46e5' },
    { name: 'Emerald', hex: '#059669' },
    { name: 'Violet', hex: '#7c3aed' },
    { name: 'Blue', hex: '#2563eb' },
    { name: 'Rose', hex: '#e11d48' },
    { name: 'Slate', hex: '#334155' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 selection:bg-accent selection:text-white relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/15 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] -z-10"></div>

      {/* Navigation Bar */}
      <header className="sticky top-4 z-50 max-w-6xl mx-auto px-6">
        <nav className="glass-panel rounded-2xl px-6 py-3.5 flex items-center justify-between border border-white/20 dark:border-slate-800/50 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBackToLanding}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Back to Landing Page"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-accent to-indigo-600 text-white p-2 rounded-xl shadow-md flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg tracking-tight font-display">InvoicePro</span>
            </div>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-black text-[10px] tracking-wider uppercase">
              Interactive Demo
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onLaunchSandbox}
              className="flex items-center gap-2 bg-gradient-to-r from-accent to-indigo-600 hover:from-accent-hover hover:to-indigo-700 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-accent/20 hover:scale-105 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Launch Live Sandbox</span>
            </button>
            <button
              onClick={onGetStarted}
              className="hidden md:inline-flex text-xs uppercase tracking-wider font-extrabold text-slate-500 hover:text-slate-900 dark:hover:text-white px-3 py-2 transition-colors"
            >
              Create Account
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 pt-16 pb-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-accent/10 dark:bg-accent/20 border border-accent/30 text-accent text-xs font-black uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Live Experience Center
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-6 font-display leading-[1.1]">
            Explore InvoicePro in Action — <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent via-indigo-500 to-purple-600">No Signup Required</span>
          </h1>
          <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-medium">
            Test drive our Indian GST calculation engine, live PDF invoice styling, stock deduction, and real-time business financial metrics in an instant sandbox environment.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onLaunchSandbox}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-gradient-to-r from-accent to-indigo-600 hover:from-accent-hover hover:to-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-base shadow-xl shadow-accent/25 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Open Full Live Sandbox</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                const element = document.getElementById('gst-simulator');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-6 py-4 rounded-2xl font-bold text-base hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
            >
              Try GST Simulator Below
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <div className="p-6 rounded-3xl glass-panel border border-slate-200/50 dark:border-slate-800/50 hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <IndianRupee className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base mb-1.5">Intelligent GST Engine</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Auto-determines CGST+SGST vs Interstate IGST from client state codes. Includes HSN & SAC catalog.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel border border-slate-200/50 dark:border-slate-800/50 hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Boxes className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base mb-1.5">Live Stock Depletion</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Invoices auto-deduct inventory quantities with low-stock warnings and complete audit trail logs.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel border border-slate-200/50 dark:border-slate-800/50 hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base mb-1.5">WhatsApp & UPI Share</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              1-click pre-filled WhatsApp billing text with embedded UPI QR codes for instant payment collection.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel border border-slate-200/50 dark:border-slate-800/50 hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base mb-1.5">P&L & Aging Analytics</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Receivables aging (0-30, 31-60, 61-90+ days), monthly cashflow, and expense margin insights.
            </p>
          </div>
        </div>

        {/* Interactive Invoice Template Showcase */}
        <section className="mb-24">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black font-display text-slate-900 dark:text-white mb-3">
              Interactive Invoice Template Showcase
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Switch between templates and brand accent colors in real-time to preview how your GST invoices look before printing or sharing.
            </p>
          </div>

          {/* Template Controls Bar */}
          <div className="p-4 rounded-2xl glass-panel border border-slate-200/50 dark:border-slate-800/50 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Template Buttons */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Template:</span>
              {[
                { id: 'modern', label: 'Modern Minimalist' },
                { id: 'classic', label: 'Classic Corporate' },
                { id: 'elegant', label: 'Elegant Indigo' },
                { id: 'compact', label: 'Compact POS' }
              ].map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedTemplate === tpl.id 
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {tpl.label}
                </button>
              ))}
            </div>

            {/* Brand Color Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Brand Accent:</span>
              <div className="flex items-center gap-2">
                {colorPalette.map(c => (
                  <button
                    key={c.hex}
                    onClick={() => setAccentColor(c.hex)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${accentColor === c.hex ? 'scale-125 border-slate-900 dark:border-white shadow-md' : 'border-transparent hover:scale-110'}`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Live Mock Invoice Preview Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-8 max-w-4xl mx-auto overflow-hidden transition-all duration-300">
            
            {/* Header / Brand Banner */}
            <div className={`p-6 rounded-2xl mb-8 transition-colors duration-300 ${
              selectedTemplate === 'elegant' 
                ? 'text-white' 
                : selectedTemplate === 'classic'
                ? 'border-b-2 border-slate-900 dark:border-slate-700 bg-transparent'
                : 'bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800'
            }`} style={{ backgroundColor: selectedTemplate === 'elegant' ? accentColor : undefined }}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center font-black text-sm shadow-sm">
                      AG
                    </div>
                    <h3 className={`text-xl font-black tracking-tight ${selectedTemplate === 'elegant' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                      Apex Global Technologies Pvt. Ltd.
                    </h3>
                  </div>
                  <p className={`text-xs ${selectedTemplate === 'elegant' ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                    GSTIN: <span className="font-mono font-bold">27AABCA1234F1Z5</span> | Mumbai, Maharashtra 400013
                  </p>
                </div>

                <div className="text-right">
                  <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    TAX INVOICE
                  </span>
                  <div className={`text-sm font-black mt-2 font-mono ${selectedTemplate === 'elegant' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    #AG-INV-101
                  </div>
                  <div className={`text-xs ${selectedTemplate === 'elegant' ? 'text-white/70' : 'text-slate-400'}`}>
                    Date: 22 Sep 2026
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To & Ship To */}
            <div className="grid sm:grid-cols-2 gap-6 mb-8 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1.5">Billed To (Client):</span>
                <p className="font-extrabold text-sm text-slate-900 dark:text-white">Tata Digital Systems Ltd</p>
                <p className="text-slate-600 dark:text-slate-400 mt-1">Prestige Trade Tower, Palace Road, Bengaluru, Karnataka 560001</p>
                <p className="text-slate-700 dark:text-slate-300 font-mono mt-1">GSTIN: 29AAACT2727Q1ZW (State Code: 29)</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1.5">Shipping & Transit Info:</span>
                <p className="font-extrabold text-slate-900 dark:text-white">SafeXpress Logistics (Vehicle: MH-04-AZ-8941)</p>
                <p className="text-slate-600 dark:text-slate-400 mt-1">E-Way Bill: <span className="font-mono font-bold">281094821094</span></p>
                <p className="text-emerald-600 dark:text-emerald-400 font-bold mt-1">Place of Supply: Karnataka (Interstate Supply)</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-center">HSN/SAC</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Rate</th>
                    <th className="py-2.5 px-3 text-right">Taxable</th>
                    <th className="py-2.5 px-3 text-right">GST</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="py-3 px-3 font-mono text-slate-400">01</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">Enterprise Cloud ERP Platform (Annual)</div>
                      <div className="text-[11px] text-slate-500">Includes multi-tenant backup & auto compliance</div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">998313</td>
                    <td className="py-3 px-3 text-right font-mono">2 YR</td>
                    <td className="py-3 px-3 text-right font-mono">₹45,000</td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">₹85,500</td>
                    <td className="py-3 px-3 text-right font-mono text-accent">18% IGST</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">₹1,00,890</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-mono text-slate-400">02</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">Custom Web & Microservices Architecture</div>
                      <div className="text-[11px] text-slate-500">API gateway and senior sprint orchestration</div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">998314</td>
                    <td className="py-3 px-3 text-right font-mono">1 PROJ</td>
                    <td className="py-3 px-3 text-right font-mono">₹75,000</td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">₹75,000</td>
                    <td className="py-3 px-3 text-right font-mono text-accent">18% IGST</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">₹88,500</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Calculations Summary Card */}
            <div className="grid sm:grid-cols-2 gap-6 items-start border-t border-slate-200 dark:border-slate-800 pt-6">
              
              {/* Payment Details & Bank */}
              <div className="text-xs space-y-2">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Bank Account & UPI Payment:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">HDFC Bank Ltd (A/C: 50200012345678)</p>
                  <p className="font-mono text-slate-600 dark:text-slate-400">IFSC: HDFC0000060 | Lower Parel, Mumbai</p>
                  <p className="text-accent font-bold mt-1">UPI ID: apextech@okhdfcbank</p>
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  Amount in words: <span className="font-semibold text-slate-700 dark:text-slate-300">One Lakh Eighty Nine Thousand Three Hundred Ninety Only</span>
                </p>
              </div>

              {/* Total Calculation breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                  <span>Subtotal (Taxable Amount):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">₹1,60,500.00</span>
                </div>
                <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                  <span>Interstate IGST (18%):</span>
                  <span className="font-mono font-bold text-accent">₹28,890.00</span>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-slate-900 dark:border-slate-700 text-sm">
                  <span className="font-extrabold text-slate-900 dark:text-white">Grand Total:</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white text-base">₹1,89,390.00</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* Live Interactive GST Simulator Widget */}
        <section id="gst-simulator" className="mb-24 scroll-mt-24">
          <div className="p-8 sm:p-12 rounded-3xl glass-panel border border-slate-200/60 dark:border-slate-800/60 shadow-xl relative overflow-hidden">
            
            <div className="max-w-3xl mb-8">
              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-accent mb-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '10s' }} />
                Instant Sandbox Widget
              </span>
              <h2 className="text-3xl font-black font-display text-slate-900 dark:text-white mb-2">
                Live Indian GST Calculator Simulator
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Adjust the sliders and switches below to experience how InvoicePro automatically divides tax according to Indian GST council laws.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              
              {/* Controls */}
              <div className="space-y-6">
                
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                    <span>Taxable Amount (₹)</span>
                    <span className="font-mono text-sm text-accent font-black">₹{taxableAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="500000"
                    step="1000"
                    value={taxableAmount}
                    onChange={(e) => setTaxableAmount(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>₹1,000</span>
                    <span>₹2,50,000</span>
                    <span>₹5,00,000</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-2">
                    GST Slab Rate (%):
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[0, 5, 12, 18, 28].map(rate => (
                      <button
                        key={rate}
                        onClick={() => setGstRate(rate)}
                        className={`py-2 rounded-xl text-xs font-black font-mono transition-all ${
                          gstRate === rate 
                            ? 'bg-gradient-to-r from-accent to-indigo-600 text-white shadow-md' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {isInterstate ? 'Interstate Transaction (IGST)' : 'Intrastate Transaction (CGST + SGST)'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {isInterstate ? 'E.g., Maharashtra seller to Karnataka buyer' : 'E.g., Mumbai seller to Pune buyer (Same State)'}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsInterstate(!isInterstate)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isInterstate 
                        ? 'bg-purple-600 text-white shadow-md' 
                        : 'bg-emerald-600 text-white shadow-md'
                    }`}
                  >
                    {isInterstate ? 'Interstate' : 'Intrastate'}
                  </button>
                </div>

              </div>

              {/* Reactive Calculation Breakdown Card */}
              <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-2xl relative">
                <div className="text-xs uppercase tracking-widest font-mono text-slate-400 mb-4 flex items-center justify-between">
                  <span>Computed Tax Breakdown</span>
                  <span className="text-emerald-400 font-bold">100% Compliant</span>
                </div>

                <div className="space-y-3 font-mono text-xs border-b border-slate-800 pb-4 mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Base Taxable:</span>
                    <span className="font-bold">₹{taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>

                  {!isInterstate ? (
                    <>
                      <div className="flex justify-between text-indigo-400">
                        <span>CGST ({gstRate / 2}%):</span>
                        <span>₹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-indigo-400">
                        <span>SGST ({gstRate / 2}%):</span>
                        <span>₹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-purple-400">
                      <span>IGST ({gstRate}%):</span>
                      <span>₹{igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-400">
                    <span>Total Tax Liability:</span>
                    <span className="font-bold text-amber-300">₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total Invoice Value</span>
                    <span className="text-2xl font-black font-mono text-white">
                      ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <button
                    onClick={onLaunchSandbox}
                    className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white px-4 py-2.5 rounded-xl text-xs font-black transition-all hover:scale-105 active:scale-95 shadow-md shadow-accent/30"
                  >
                    <span>Use in App</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </div>

          </div>
        </section>

        {/* Final Call To Action */}
        <div className="text-center py-12 px-6 rounded-3xl bg-gradient-to-r from-accent via-indigo-600 to-purple-600 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]"></div>
          <h2 className="text-3xl md:text-4xl font-black font-display mb-4 relative z-10">
            Ready to test the live dashboard?
          </h2>
          <p className="text-white/90 max-w-xl mx-auto text-sm md:text-base mb-8 relative z-10 font-medium">
            Jump directly into the fully functioning sandbox with preloaded Indian clients, products, quotes, and reports.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <button
              onClick={onLaunchSandbox}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-accent hover:bg-slate-100 px-8 py-4 rounded-2xl font-black text-base transition-all shadow-xl hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-accent" />
              <span>Launch Live Interactive Sandbox</span>
            </button>
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-black/25 hover:bg-black/40 text-white border border-white/20 px-8 py-4 rounded-2xl font-black text-base transition-all"
            >
              Create Free Account
            </button>
          </div>
        </div>

      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-200/50 dark:border-slate-800/50 py-8 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} InvoicePro. Interactive Indian GST Billing Demo.</p>
      </footer>

    </div>
  );
};

export default DemoPage;
