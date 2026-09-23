import React from 'react';
import { CheckCircle2, Zap, Lock, Sparkles, AlertCircle } from 'lucide-react';
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
    <Modal isOpen={isOpen} onClose={onClose} title="Plans & Subscription">
      <div className="p-6 max-w-5xl w-full max-h-[85vh] overflow-y-auto">
        {/* Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Early Access Preview
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
            Simple, Transparent Plans
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            Every account gets <span className="font-bold text-accent">5 Free Invoices</span> to test all features. Paid plans and add-on packs are <span className="font-semibold text-amber-500 dark:text-amber-400">Coming Soon</span> when payment integration goes live!
          </p>
        </div>

        {/* Free Plan Alert */}
        <div className="mb-8 p-4 rounded-xl bg-accent/5 dark:bg-accent/10 border border-accent/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold text-slate-900 dark:text-white">Free Testing Tier Active: </span>
            <span className="text-slate-600 dark:text-slate-300">
              You can create and download up to 5 full GST invoices with customized templates and inventory tracking for free. Once you reach 5 invoices, higher-tier plans will be unlocked soon.
            </span>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-10">
          {/* Free Tier */}
          <div className="p-5 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05] flex flex-col relative">
            <div className="absolute top-0 right-4 -translate-y-1/2 bg-emerald-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
              Current Plan
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Free Tier</h3>
            <div className="mb-4">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">₹0</span>
              <span className="text-xs text-slate-500 ml-1">/ forever</span>
            </div>
            <ul className="space-y-2 mb-6 flex-1 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Up to 5 invoices total</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Full GST calculation</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> PDF downloads & print</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Inventory tracking</li>
            </ul>
            <Button variant="secondary" disabled className="w-full text-xs !py-2.5 opacity-80 cursor-default">
              ✓ Active Plan
            </Button>
          </div>

          {/* Basic */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex flex-col relative opacity-90">
            <div className="absolute top-0 right-4 -translate-y-1/2 bg-amber-500 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
              Coming Soon
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Basic</h3>
            <div className="mb-4">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">₹49</span>
              <span className="text-xs text-slate-500 ml-1">/ mo</span>
            </div>
            <ul className="space-y-2 mb-6 flex-1 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Up to 50 invoices / mo</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> All professional templates</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Email & WhatsApp sharing</li>
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

          {/* Standard */}
          <div className="p-5 rounded-2xl border-2 border-accent/40 bg-accent/[0.02] dark:bg-accent/[0.04] relative flex flex-col">
            <div className="absolute top-0 right-4 -translate-y-1/2 bg-accent text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
              Popular • Soon
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Standard</h3>
            <div className="mb-4">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">₹129</span>
              <span className="text-xs text-slate-500 ml-1">/ quarter</span>
            </div>
            <ul className="space-y-2 mb-6 flex-1 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Up to 200 invoices / qtr</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Quotations to Invoices</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Multi-currency support</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Priority email support</li>
            </ul>
            <Button 
              variant="secondary" 
              onClick={() => handleNotifyMe('standard')}
              className="w-full text-xs !py-2.5 border-accent/30 text-accent gap-1"
            >
              <Lock className="w-3.5 h-3.5" /> Coming Soon
            </Button>
          </div>

          {/* Premium */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex flex-col relative opacity-90">
            <div className="absolute top-0 right-4 -translate-y-1/2 bg-amber-500 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
              Coming Soon
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Premium</h3>
            <div className="mb-4">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">₹399</span>
              <span className="text-xs text-slate-500 ml-1">/ year</span>
            </div>
            <ul className="space-y-2 mb-6 flex-1 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Up to 1,000 invoices / yr</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Unlimited Companies</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Automated Recurring Billing</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Dedicated Support</li>
            </ul>
            <Button 
              variant="secondary" 
              onClick={() => handleNotifyMe('premium')}
              className="w-full text-xs !py-2.5 border-slate-300 dark:border-slate-700 text-slate-500 hover:text-accent gap-1"
            >
              <Lock className="w-3.5 h-3.5" /> Coming Soon
            </Button>
          </div>
        </div>

        {/* Add-ons Section */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
          <div className="text-center mb-5">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Need Additional Invoices?</h4>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              Add-on packs never expire. Available as soon as payments launch.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">+50 Invoices</div>
                <div className="text-xs text-slate-500">₹29 one-time</div>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg">
                Soon
              </span>
            </div>
            
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">+200 Invoices</div>
                <div className="text-xs text-slate-500">₹89 one-time</div>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg">
                Soon
              </span>
            </div>
            
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white">+500 Invoices</div>
                <div className="text-xs text-slate-500">₹199 one-time</div>
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
