import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Privacy Policy</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Last updated: April 10, 2026</p>

          <div className="space-y-6 text-slate-700 dark:text-slate-300">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">1. Information We Collect</h2>
              <p>We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, and other information you choose to provide.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">2. How We Use Your Information</h2>
              <p>We use the information we collect about you to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Provide, maintain, and improve our services.</li>
                <li>Process transactions and send related information, including confirmations and receipts.</li>
                <li>Send you technical notices, updates, security alerts, and support and administrative messages.</li>
                <li>Respond to your comments, questions, and requests, and provide customer service.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">3. Sharing of Information</h2>
              <p>We may share the information we collect about you as described in this Statement or as described at the time of collection or sharing, including as follows:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>With third-party vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.</li>
                <li>In response to a request for information by a competent authority if we believe disclosure is in accordance with, or is otherwise required by, any applicable law, regulation, or legal process.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">4. Data Security</h2>
              <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction. Your data is stored securely and we use industry-standard encryption for data in transit and at rest.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">5. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us at support@invoicepro.com.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
