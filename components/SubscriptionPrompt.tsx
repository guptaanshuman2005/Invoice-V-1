import React from 'react';
import { CheckCircle2, Zap, PlusCircle } from 'lucide-react';
import Modal from './common/Modal';
import Button from './common/Button';
import { trackEvent } from '../utils/analytics';

interface SubscriptionPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (plan: string) => void;
}

const SubscriptionPrompt: React.FC<SubscriptionPromptProps> = ({ isOpen, onClose, onSubscribe }) => {
  const handleSubscribe = (plan: string) => {
    trackEvent('initiate_subscription', { plan });
    onSubscribe(plan);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upgrade or Buy Add-ons">
      <div className="p-6 max-w-5xl w-full max-h-[80vh] overflow-y-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/10 text-accent rounded-full mb-4">
            <Zap className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Choose a Plan to Continue</h2>
          <p className="text-slate-600 dark:text-slate-400">You have reached your free limit (10 invoices/mo). Select a plan or buy an add-on below.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Basic */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-accent transition-colors flex flex-col">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Basic</h3>
            <div className="mb-4">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">₹199</span>
              <span className="text-slate-500">/mo</span>
            </div>
            <ul className="space-y-3 mb-6 flex-1 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> 50 invoices/month</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Billed Monthly</li>
            </ul>
            <Button onClick={() => handleSubscribe('basic')} className="w-full">Choose Basic</Button>
          </div>

          {/* Standard */}
          <div className="p-6 rounded-2xl border-2 border-accent relative flex flex-col">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-white px-3 py-0.5 rounded-full text-xs font-bold">
              POPULAR
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Standard</h3>
            <div className="mb-4">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">₹499</span>
              <span className="text-slate-500">/quarter</span>
            </div>
            <ul className="space-y-3 mb-6 flex-1 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> 100 invoices/month</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Billed Quarterly</li>
            </ul>
            <Button onClick={() => handleSubscribe('standard')} className="w-full">Choose Standard</Button>
          </div>

          {/* Premium */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-accent transition-colors flex flex-col">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Premium</h3>
            <div className="mb-4">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">₹1499</span>
              <span className="text-slate-500">/year</span>
            </div>
            <ul className="space-y-3 mb-6 flex-1 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> 300 invoices/month</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent" /> Billed Yearly</li>
            </ul>
            <Button onClick={() => handleSubscribe('premium')} className="w-full">Choose Premium</Button>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Need more invoices this month?</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Buy a one-time add-on pack. These invoices never expire until you use them.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">+50 Invoices</div>
                <div className="text-accent font-semibold">₹99</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleSubscribe('addon_50')} className="flex items-center gap-1">
                <PlusCircle className="w-4 h-4" /> Add
              </Button>
            </div>
            
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">+200 Invoices</div>
                <div className="text-accent font-semibold">₹299</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleSubscribe('addon_200')} className="flex items-center gap-1">
                <PlusCircle className="w-4 h-4" /> Add
              </Button>
            </div>
            
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">+500 Invoices</div>
                <div className="text-accent font-semibold">₹499</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleSubscribe('addon_500')} className="flex items-center gap-1">
                <PlusCircle className="w-4 h-4" /> Add
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SubscriptionPrompt;
