import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface TermsOfServiceProps {
  onBack: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Terms of Service</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Last updated: April 10, 2026</p>

          <div className="space-y-6 text-slate-700 dark:text-slate-300">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
              <p>By accessing or using the InvoicePro service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">2. Description of Service</h2>
              <p>InvoicePro provides an online invoicing, billing, and business management platform. We reserve the right to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">3. User Accounts</h2>
              <p>When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
              <p className="mt-2">You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">4. Intellectual Property</h2>
              <p>The Service and its original content, features and functionality are and will remain the exclusive property of InvoicePro and its licensors. The Service is protected by copyright, trademark, and other laws of both the India and foreign countries.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">5. Limitation of Liability</h2>
              <p>In no event shall InvoicePro, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">6. Governing Law</h2>
              <p>These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
