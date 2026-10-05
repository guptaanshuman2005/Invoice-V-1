import React, { useState, useEffect } from 'react';
import type { Company, Invoice, InvoicePayment, PaymentMode } from '../types';
import { getInvoicePaymentSummary, printPaymentReceipt, sharePaymentReceiptWhatsApp } from '../utils/invoiceUtils';
import Modal from './common/Modal';
import Button from './common/Button';
import { IndianRupee, Calendar, CreditCard, Hash, FileText, CheckCircle2, MessageCircle, Printer, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  company: Company;
  onSavePayment?: (invoiceId: string, payment: InvoicePayment) => void;
  onRecordPayment?: (invoiceId: string, payment: InvoicePayment) => void;
  onDeletePayment?: (invoiceId: string, paymentId: string) => void;
}

const PAYMENT_MODES: { label: string; value: PaymentMode; icon: string }[] = [
  { label: 'UPI', value: 'UPI', icon: '⚡' },
  { label: 'NEFT / RTGS', value: 'NEFT', icon: '🏦' },
  { label: 'Cheque', value: 'Cheque', icon: '📝' },
  { label: 'Cash', value: 'Cash', icon: '💵' },
  { label: 'Card', value: 'Card', icon: '💳' },
];

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  company,
  onSavePayment,
  onRecordPayment,
  onDeletePayment
}) => {
  if (!invoice) return null;

  const handleSave = onRecordPayment || onSavePayment;
  const summary = getInvoicePaymentSummary(invoice);
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [mode, setMode] = useState<PaymentMode>('UPI');
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'record' | 'history'>('record');

  // Auto-fill remaining balance when opened
  useEffect(() => {
    if (isOpen && invoice) {
      const curSummary = getInvoicePaymentSummary(invoice);
      setAmount(curSummary.balanceDue > 0 ? curSummary.balanceDue.toString() : '');
      setDate(new Date().toISOString().split('T')[0]);
      setMode('UPI');
      setReferenceNo('');
      setNotes('');
      setActiveTab('record');
    }
  }, [isOpen, invoice]);

  const numAmount = parseFloat(amount) || 0;

  const handleQuickFill = (percent: number) => {
    const val = Math.round((summary.balanceDue * percent) * 100) / 100;
    setAmount(val > 0 ? val.toString() : '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      toast.error('Please enter a valid payment amount greater than zero.');
      return;
    }

    if (numAmount > summary.balanceDue + 0.01) {
      const confirmed = window.confirm(
        `Entered amount (₹${numAmount}) exceeds the remaining balance (₹${summary.balanceDue}). Do you wish to record this overpayment/advance?`
      );
      if (!confirmed) return;
    }

    const newPayment: InvoicePayment = {
      id: `PAY-${Date.now().toString().slice(-6)}`,
      date,
      amount: numAmount,
      mode,
      referenceNo: referenceNo.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    if (handleSave) {
      handleSave(invoice.id, newPayment);
    }
    
    const updatedInvoice: Invoice = {
      ...invoice,
      payments: [...(invoice.payments || []), newPayment]
    };

    toast.success(`Payment of ₹${numAmount.toLocaleString('en-IN')} recorded!`, {
      action: {
        label: 'Print Voucher',
        onClick: () => printPaymentReceipt(company, updatedInvoice, newPayment, invoice.client)
      }
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Payment Tracking - Invoice #${invoice.invoiceNumber}`}
    >
      <div className="space-y-5 max-w-xl mx-auto">
        {/* Client & Summary Strip */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client</div>
              <div className="text-sm font-black text-slate-900 dark:text-white truncate" title={invoice.client?.name}>
                {invoice.client?.name || 'Customer'}
              </div>
            </div>
            <div className="text-right">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide inline-block ${
                summary.status === 'Paid'
                  ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : summary.status === 'Partially Paid'
                  ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-rose-100 text-rose-700 ring-1 ring-rose-600/20 dark:bg-rose-900/30 dark:text-rose-400'
              }`}>
                {summary.status}
              </span>
            </div>
          </div>

          {/* 3-Column Financial Numbers */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-center">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Total Bill</div>
              <div className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">
                ₹{invoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-emerald-500 uppercase font-bold">Received</div>
              <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                ₹{summary.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-rose-500 uppercase font-bold">Balance Due</div>
              <div className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                ₹{summary.balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
              <span>Payment Progress</span>
              <span>{summary.progressPercentage}% Paid</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  summary.status === 'Paid' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${summary.progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* View Tabs: Record New vs History */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('record')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'record'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            + Record Installment
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Payment Receipts ({invoice.payments?.length || 0})
          </button>
        </div>

        {/* Tab 1: Record Form */}
        {activeTab === 'record' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quick Fill Buttons */}
            {summary.balanceDue > 0 && (
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Quick Fill Balance:</div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickFill(1.0)}
                    className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                  >
                    Full Balance (₹{summary.balanceDue.toFixed(2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill(0.5)}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors"
                  >
                    50% (₹{(summary.balanceDue * 0.5).toFixed(2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill(0.25)}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors"
                  >
                    25% (₹{(summary.balanceDue * 0.25).toFixed(2)})
                  </button>
                </div>
              </div>
            )}

            {/* Amount & Date Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Amount Received (₹) *
                </label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="e.g. 25000"
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Date *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
            </div>

            {/* Payment Mode Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Payment Mode *
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {PAYMENT_MODES.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMode(m.value)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-0.5 ${
                      mode === m.value
                        ? 'bg-accent/10 border-accent text-accent dark:bg-accent/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reference Number & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reference / UTR / Cheque #
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={e => setReferenceNo(e.target.value)}
                    placeholder="e.g. UTR-987654321"
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Remarks / Notes
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Advance paid via HDFC"
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2.5">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Record Payment {numAmount > 0 && `(₹${numAmount.toLocaleString('en-IN')})`}
              </Button>
            </div>
          </form>
        )}

        {/* Tab 2: Receipts / History */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {!invoice.payments || invoice.payments.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <IndianRupee className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs text-slate-500 font-medium">No partial payments recorded yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Use the "+ Record Installment" tab above to record payments.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {invoice.payments.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="p-3 bg-white dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 rounded-xl flex items-center justify-between gap-3 hover:shadow-sm transition-all"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                          ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-accent">
                          {p.mode}
                        </span>
                        {p.referenceNo && (
                          <span className="text-[10px] font-mono text-slate-400 truncate">
                            Ref: {p.referenceNo}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Date: {p.date} {p.notes ? `• "${p.notes}"` : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => printPaymentReceipt(company, invoice, p, invoice.client)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:text-accent transition-colors"
                        title="Download / Print Receipt Voucher"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => sharePaymentReceiptWhatsApp(company, invoice, p, invoice.client)}
                        className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg text-emerald-600 transition-colors"
                        title="Share Receipt on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                      {onDeletePayment && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete payment of ₹${p.amount}?`)) {
                              onDeletePayment(invoice.id, p.id);
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete Payment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
