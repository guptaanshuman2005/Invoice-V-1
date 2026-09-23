import React from 'react';
import { CheckCircle2, Lock, Sparkles, Check } from 'lucide-react';
import Modal from './common/Modal';
import Button from './common/Button';
import { trackEvent } from '../utils/analytics';

interface SubscriptionPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe?: (plan: string) => void;
}

const SubscriptionPrompt: React.FC<SubscriptionPromptProps> = ({ isOpen, onClose, onSubscribe }) => {
  const handleNotifyMe = (plan: string) => {
    trackEvent('waitlist_interest', { plan });
    if (onSubscribe) onSubscribe(plan);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Plans & Invoice Volumes">
      <div className="p-6 max-w-5xl w-full max-h-[85vh] overflow-y-auto">
        {/* Banner */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> All Features Included
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
            Pay Only For What You Invoice
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            <span className="font-semibold text-slate-900 dark:text-white">Every plan includes 100% of features</span> — full GST suite, recurring billing, quotations, all PDF templates, multi-company, and inventory tracking.
          </p>
        </div>

        {/* Feature guarantee banner */}
        <div className="mb-8 p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1.5 text-accent font-semibold">
            <Check className="w-4 h-4" /> Full GST Engine (CGST, SGST, IGST)
          </div>
          <div className="flex items-center gap-1.5 text-accent font-semibold">
            <Check className="w-4 h-4" /> Recurring Auto-Billing
          </div>
          <div className="flex items-center gap-1.5 text-accent font-semibold">
            <Check className="w-4 h-4" /> Quotations to Invoices
          </div>
          <div className="flex items-center gap-1.5 text-accent font-semibold">
            <Check className="w-4 h-4" /> All 4 PDF Templates
          </div>
          <div className="flex items-center gap-1.5 text-accent font-semibold">
            <Check className="w-4 h-4" /> Real-time Inventory
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {/* Free Tier */}
          <div className="p-5 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05] flex flex-col relative">
            <div className="absolute top-0 right-4 -translate-y-1/2 bg-emerald-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
              Current Plan
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Free Tier</h3>
            <p className="text-xs text-slate-500 mb-3">For testing & evaluation</p>

            <div className="mb-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">₹0</span>
              <span className="text-xs text-slate-500 ml-1">/ forever</span>
            </div>

            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-4 bg-emerald-500/10 px-2 py-1 rounded inline-block w-fit">
              Free forever
            </div>

            {/* Invoices Count Highlight */}
            <div className="bg-white dark:bg-slate-900/80 rounded-xl p-3 mb-4 border border-emerald-500/20 text-center">
              <div className="text-2xl font-black text-slate-900 dark:text-white">5</div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Invoices Total</div>
            </div>

            <ul className="space-y-2 mb-6 flex-1 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 5 Invoices Included</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> All Features Unlocked</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> No Expiry Date</li>
            </ul>

            <Button variant="secondary" disabled className="w-full text-xs !py-2.5 opacity-80 cursor-default">
              ✓ Active Plan
            </Button>
          </div>

          {/* Basic (Monthly) */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex flex-col relative opacity-95">
            <div className="absolute top-0 right-4 -translate-y-1/2 bg-amber-500 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
              Coming Soon
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Basic</h3>
            <p className="text-xs text-slate-500 mb-3">Pay-as-you-go monthly</p>

            <div className="mb-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">₹49</span>
              <span className="text-xs text-slate-500 ml-1">/ month</span>
            </div>

            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-4 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded inline-block w-fit">
              ₹49 / month
            </div>

            {/* Invoices Count Highlight */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 mb-4 border border-slate-200 dark:border-slate-700/60 text-center">
              <div className="text-2xl font-black text-slate-900 dark:text-white">50</div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Invoices / Month</div>
              <div className="text-[10px] text-accent mt-0.5 font-medium">₹0.98 per invoice</div>
            </div>

            <ul className="space-y-2 mb-6 flex-1 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> 50 Invoices / Month</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> All Features Unlocked</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Billed Monthly</li>
            </ul>

            <Button 
              variant="secondary" 
              onClick={() => handleNotifyMe('basic')}
              className="w-full text-xs !py-2.5 border-slate-300 dark:border-slate-700 text-slate-500 hover:text-accent gap-1"
            >
              <Lock className="w-3.5 h-3.5" /> Coming Soon
            </Button>
          </div>

          {/* Standard (Quarterly) */}
          <div className="p-5 rounded-2xl border-2 border-accent/60 bg-accent/[0.02] dark:bg-accent/[0.04] relative flex flex-col shadow-lg shadow-accent/5">
            <div className="absolute top-0 right-4 -translate-y-1/2 bg-accent text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
              Popular • Save 12%
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Standard</h3>
            <p className="text-xs text-slate-500 mb-3">Quarterly billing</p>

            <div className="mb-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">₹129</span>
              <span className="text-xs text-slate-500 ml-1">/ quarter</span>
            </div>

            {/* Monthly equivalent callout */}
            <div className="text-[11px] font-bold text-accent mb-4 bg-accent/10 px-2 py-1 rounded inline-block w-fit">
              Just ₹43 / month (Save 12%)
            </div>

            {/* Invoices Count Highlight */}
            <div className="bg-accent/5 dark:bg-accent/10 rounded-xl p-3 mb-4 border border-accent/30 text-center">
              <div className="text-2xl font-black text-slate-900 dark:text-white">200</div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Invoices / Quarter</div>
              <div className="text-[10px] text-accent mt-0.5 font-medium">₹0.64 per invoice (~67/mo)</div>
            </div>

            <ul className="space-y-2 mb-6 flex-1 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> 200 Invoices / Quarter</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> All Features Unlocked</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> 12% Monthly Savings</li>
            </ul>

            <Button 
              variant="secondary" 
              onClick={() => handleNotifyMe('standard')}
              className="w-full text-xs !py-2.5 border-accent/40 text-accent font-semibold gap-1"
            >
              <Lock className="w-3.5 h-3.5" /> Coming Soon
            </Button>
          </div>

          {/* Premium (Yearly) */}
          <div className="p-5 rounded-2xl border-2 border-purple-500/40 bg-purple-500/[0.02] dark:bg-purple-500/[0.04] flex flex-col relative opacity-95">
            <div className="absolute top-0 right-4 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-accent text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
              Best Value • Save 32%
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Premium</h3>
            <p className="text-xs text-slate-500 mb-3">Annual billing</p>

            <div className="mb-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">₹399</span>
              <span className="text-xs text-slate-500 ml-1">/ year</span>
            </div>

            {/* Monthly equivalent callout */}
            <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400 mb-4 bg-purple-500/10 px-2 py-1 rounded inline-block w-fit">
              Just ₹33 / month (Save 32%)
            </div>

            {/* Invoices Count Highlight */}
            <div className="bg-purple-500/5 dark:bg-purple-500/10 rounded-xl p-3 mb-4 border border-purple-500/20 text-center">
              <div className="text-2xl font-black text-slate-900 dark:text-white">1,000</div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Invoices / Year</div>
              <div className="text-[10px] text-purple-600 dark:text-purple-400 mt-0.5 font-medium">₹0.39 per invoice (~83/mo)</div>
            </div>

            <ul className="space-y-2 mb-6 flex-1 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-purple-500" /> 1,000 Invoices / Year</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-purple-500" /> All Features Unlocked</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-purple-500" /> 32% Annual Savings</li>
            </ul>

            <Button 
              variant="secondary" 
              onClick={() => handleNotifyMe('premium')}
              className="w-full text-xs !py-2.5 border-purple-400/40 text-purple-600 dark:text-purple-400 font-semibold gap-1"
            >
              <Lock className="w-3.5 h-3.5" /> Coming Soon
            </Button>
          </div>
        </div>

        {/* Add-ons Section */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
          <div className="text-center mb-5">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Need Additional Invoices On Demand?</h4>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              Add-on packs never expire. Stack them on top of any plan whenever you need a quick boost.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">+50 Invoices</div>
                <div className="text-xs text-slate-500">₹29 one-time <span className="text-[10px] text-accent">(₹0.58/inv)</span></div>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg">
                Soon
              </span>
            </div>
            
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">+200 Invoices</div>
                <div className="text-xs text-slate-500">₹89 one-time <span className="text-[10px] text-accent">(₹0.44/inv)</span></div>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg">
                Soon
              </span>
            </div>
            
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">+500 Invoices</div>
                <div className="text-xs text-slate-500">₹199 one-time <span className="text-[10px] text-accent">(₹0.39/inv)</span></div>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg">
                Soon
              </span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-8 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SubscriptionPrompt;
