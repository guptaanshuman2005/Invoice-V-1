
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { Client, Invoice, Company, InvoicePayment } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Modal from './common/Modal';
import { INDIAN_STATES } from '../constants';
import { InvoiceView } from './Invoices';
import { RecordPaymentModal } from './RecordPaymentModal';
import { validateEmail, validateRequired, validateGstin, fetchLocationByPincode } from '../utils/validation';
import { arrayToCSV, downloadCSV } from '../utils/csvExport';
import { Clock, IndianRupee, CheckCircle, FileText, Eye, Edit, Mail, Trash2, AlertCircle, Search, Plus, Download, Upload, X, Maximize2, Minimize2, ArrowLeft, Printer, Share2, Calendar, MessageCircle, FileSpreadsheet, CreditCard } from 'lucide-react';
import { trackEvent } from '../utils/analytics';
import { toast } from 'sonner';

interface ClientsProps {
  clients: Client[];
  setClients: (clients: Client[]) => void;
  invoices: Invoice[];
  company: Company;
  onEditInvoice: (invoiceId: string) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onStatusChange: (invoiceId: string, status: Invoice['status']) => void;
  onBulkDelete: (clientIds: string[]) => void;
  onRecordPayment?: (invoiceId: string, payment: InvoicePayment) => void;
  initialSearchQuery?: string;
}

const emptyClient: Client = { id: '', name: '', gstin: '', email: '', phone: '', address: '', city: '', state: '', zip: '', shippingAddress: '', shippingCity: '', shippingState: '', shippingZip: '', tags: [] };
type ClientFormErrors = { [K in keyof Omit<Client, 'id' | 'tags'>]?: string };

const getTagColor = (tag: string) => {
    const colors = [
        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
        'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    ];
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const ClientForm: React.FC<{ 
    client: Client; 
    setClient: React.Dispatch<React.SetStateAction<Client>>;
    errors: ClientFormErrors;
    setErrors: React.Dispatch<React.SetStateAction<ClientFormErrors>>;
    availableTags: string[];
}> = ({ client, setClient, errors, setErrors, availableTags }) => {
    const [isSameAsBilling, setIsSameAsBilling] = useState(false);
    const [isBillingPincodeLoading, setIsBillingPincodeLoading] = useState(false);
    const [isShippingPincodeLoading, setIsShippingPincodeLoading] = useState(false);
    const [tagInput, setTagInput] = useState('');

    const validateField = (name: string, value: string): string | null => {
        switch(name) {
            case 'name': return validateRequired(value);
            case 'email': return validateEmail(value);
            case 'gstin': return validateGstin(value);
            default: return null;
        }
    }

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setClient(prev => ({ ...prev, [name]: value }));
        const error = validateField(name, value);
        setErrors(prev => ({...prev, [name]: error || undefined}));
    }, [setClient, setErrors]);

    const handleTagAdd = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = tagInput.trim();
            if (newTag && !client.tags?.includes(newTag)) {
                setClient(prev => ({ ...prev, tags: [...(prev.tags || []), newTag] }));
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setClient(prev => ({ ...prev, tags: prev.tags?.filter(t => t !== tagToRemove) }));
    };

    useEffect(() => {
        if (client.id) {
            const isShippingEmpty = !client.shippingAddress && !client.shippingCity && !client.shippingState && !client.shippingZip;
            const addressesAreSame = 
                (client.address || '') === (client.shippingAddress || '') &&
                (client.city || '') === (client.shippingCity || '') &&
                (client.state || '') === (client.shippingState || '') &&
                (client.zip || '') === (client.shippingZip || '');
            
            setIsSameAsBilling(addressesAreSame || isShippingEmpty);
        } else {
            setIsSameAsBilling(true);
        }
    }, [client.id]);

    useEffect(() => {
        if (isSameAsBilling) {
            const billingMatchShipping = 
                client.address === client.shippingAddress &&
                client.city === client.shippingCity &&
                client.state === client.shippingState &&
                client.zip === client.shippingZip;
                
            if (!billingMatchShipping) {
                setClient(prev => ({
                    ...prev,
                    shippingAddress: prev.address,
                    shippingCity: prev.city,
                    shippingState: prev.state,
                    shippingZip: prev.zip,
                }));
            }
        }
    }, [isSameAsBilling, client.address, client.city, client.state, client.zip, client.shippingAddress, client.shippingCity, client.shippingState, client.shippingZip, setClient]);
    
    useEffect(() => {
        const pincode = client.zip;
        if (pincode && pincode.length === 6) {
          const timer = setTimeout(async () => {
            setIsBillingPincodeLoading(true);
            const location = await fetchLocationByPincode(pincode);
            if (location) {
              setClient(prev => ({ ...prev, city: location.city, state: location.state }));
              setErrors(prev => ({ ...prev, zip: undefined }));
            } else if (location === null) {
              setErrors(prev => ({ ...prev, zip: 'Invalid Pincode' }));
            } else {
              setErrors(prev => ({ ...prev, zip: 'Lookup failed' }));
            }
            setIsBillingPincodeLoading(false);
          }, 500);
          return () => clearTimeout(timer);
        }
      }, [client.zip, setClient, setErrors]);

    useEffect(() => {
        if (isSameAsBilling) return;
        const pincode = client.shippingZip;
        if (pincode && pincode.length === 6) {
          const timer = setTimeout(async () => {
            setIsShippingPincodeLoading(true);
            const location = await fetchLocationByPincode(pincode);
            if (location) {
              setClient(prev => ({ ...prev, shippingCity: location.city, shippingState: location.state }));
              setErrors(prev => ({ ...prev, shippingZip: undefined }));
            } else if (location === null) {
              setErrors(prev => ({ ...prev, shippingZip: 'Invalid Pincode' }));
            } else {
              setErrors(prev => ({ ...prev, shippingZip: 'Lookup failed' }));
            }
            setIsShippingPincodeLoading(false);
          }, 500);
          return () => clearTimeout(timer);
        }
    }, [client.shippingZip, isSameAsBilling, setClient, setErrors]);

    const inputClasses = "w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none text-sm px-4 py-3 transition-all duration-200 ease-in-out border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-2 focus:ring-accent/20 focus:border-accent";

    return (
        <div className="p-6 space-y-4">
            <Input label="Client Name" name="name" value={client.name} onChange={handleChange} required error={errors.name} placeholder="e.g. Reliance Industries" />
            <Input label="GSTIN" name="gstin" value={client.gstin} onChange={handleChange} error={errors.gstin} placeholder="e.g. 27AAAAA0000A1Z5" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Email" name="email" type="email" value={client.email} onChange={handleChange} error={errors.email} placeholder="e.g. accounts@reliance.com" />
                <Input label="Phone" name="phone" type="tel" value={client.phone} onChange={handleChange} placeholder="e.g. +91 98765 43210" />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-medium-text mb-1">Tags / Groups</label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {client.tags?.map(tag => (
                        <span key={tag} className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getTagColor(tag)}`}>
                            {tag}
                            <button onClick={() => removeTag(tag)} className="hover:text-slate-900 font-bold ml-1">×</button>
                        </span>
                    ))}
                </div>
                <Input 
                    label="" 
                    placeholder="Add tags (press Enter or comma)" 
                    value={tagInput} 
                    onChange={e => setTagInput(e.target.value)} 
                    onKeyDown={handleTagAdd}
                    list="tagSuggestions"
                />
                <datalist id="tagSuggestions">
                    {availableTags.filter(t => !client.tags?.includes(t)).map(tag => (
                        <option key={tag} value={tag} />
                    ))}
                </datalist>
            </div>
            
            <div className="pt-4 border-t border-slate-200 dark:border-tertiary-dark">
                <h3 className="text-lg font-medium text-slate-800 dark:text-light-text mb-2">Billing Address</h3>
                <div className="space-y-4">
                    <Input label="Address" name="address" value={client.address} onChange={handleChange} placeholder="Street, Sector, Area" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div className="relative">
                            <Input label="ZIP Code" name="zip" value={client.zip} onChange={handleChange} maxLength={6} error={errors.zip} placeholder="e.g. 400001" />
                            {isBillingPincodeLoading && <div className="absolute top-8 right-2 h-5 w-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>}
                        </div>
                        <Input label="City" name="city" value={client.city} onChange={handleChange} placeholder="e.g. Mumbai" />
                        <div>
                          <label htmlFor="state" className="block text-sm font-medium text-slate-600 dark:text-medium-text mb-1">State</label>
                          <select id="state" name="state" value={client.state} onChange={handleChange} className={`${inputClasses}`}>
                            <option value="">Select State</option>
                            {INDIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                          </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-tertiary-dark">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium text-slate-800 dark:text-light-text">Shipping Address</h3>
                    <div className="flex items-center">
                        <input type="checkbox" id="sameAsBilling" checked={isSameAsBilling} onChange={e => setIsSameAsBilling(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent" />
                        <label htmlFor="sameAsBilling" className="ml-2 block text-sm text-slate-600 dark:text-medium-text">Same as billing</label>
                    </div>
                </div>
                <div className={`space-y-4 ${isSameAsBilling ? 'opacity-50' : ''}`}>
                    <Input label="Shipping Address" name="shippingAddress" value={client.shippingAddress || ''} onChange={handleChange} disabled={isSameAsBilling} placeholder="Street, Sector, Area" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Input label="Shipping ZIP Code" name="shippingZip" value={client.shippingZip || ''} onChange={handleChange} maxLength={6} disabled={isSameAsBilling} error={errors.shippingZip} placeholder="e.g. 400001" />
                             {isShippingPincodeLoading && <div className="absolute top-8 right-2 h-5 w-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>}
                        </div>
                        <Input label="Shipping City" name="shippingCity" value={client.shippingCity || ''} onChange={handleChange} disabled={isSameAsBilling} placeholder="e.g. Mumbai" />
                        <div>
                          <label htmlFor="shippingState" className="block text-sm font-medium text-slate-600 dark:text-medium-text mb-1">Shipping State</label>
                          <select id="shippingState" name="shippingState" value={client.shippingState || ''} onChange={handleChange} disabled={isSameAsBilling} className={`${inputClasses} disabled:opacity-70`}>
                            <option value="">Select State</option>
                            {INDIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                          </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- NEW HISTORY PANEL COMPONENT ---
interface ClientHistoryPanelProps {
    client: Client;
    invoices: Invoice[];
    currency: string;
    company: Company;
    onEditInvoice: (id: string) => void;
    onViewInvoice: (inv: Invoice) => void;
    onDeleteInvoice: (id: string) => void;
    onEmailInvoice: (inv: Invoice) => void;
    onRecordPaymentClick?: (inv: Invoice) => void;
    onClose: () => void;
    isMaximized: boolean;
    onToggleMaximize: () => void;
    panelWidth?: number;
}

const ClientHistoryPanel: React.FC<ClientHistoryPanelProps> = ({ 
    client, invoices, currency, company, onEditInvoice, onViewInvoice, onDeleteInvoice, onEmailInvoice,
    onRecordPaymentClick,
    onClose, isMaximized, onToggleMaximize, panelWidth = 490
}) => {
    const [activeTab, setActiveTab] = useState<'invoices' | 'ledger' | 'timeline'>('invoices');
    const [ledgerViewMode, setLedgerViewMode] = useState<'cards' | 'table'>('cards');

    useEffect(() => {
        if (isMaximized) {
            setLedgerViewMode('table');
        }
    }, [isMaximized]);

    // Financial year default dates for Indian SME Khata (April 1 to today)
    const defaultDates = useMemo(() => {
        const today = new Date();
        const curYear = today.getFullYear();
        const curMonth = today.getMonth(); // 0-11
        const startYear = curMonth >= 3 ? curYear : curYear - 1;
        return {
            start: `${startYear}-04-01`,
            end: today.toISOString().split('T')[0]
        };
    }, []);

    const [ledgerStartDate, setLedgerStartDate] = useState(defaultDates.start);
    const [ledgerEndDate, setLedgerEndDate] = useState(defaultDates.end);

    const clientInvoices = useMemo(() => 
        invoices.filter(inv => inv.client?.id === client.id).sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
    , [invoices, client.id]);

    const stats = useMemo(() => {
        let totalInvoiced = 0;
        let totalPaid = 0;
        let totalOutstanding = 0;

        clientInvoices.forEach(inv => {
            const isCN = inv.documentType === 'credit_note';
            if (isCN) {
                totalInvoiced -= inv.grandTotal;
                return;
            }
            totalInvoiced += inv.grandTotal;
            const payments = inv.payments || [];
            if (payments.length > 0) {
                const paid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
                totalPaid += paid;
                totalOutstanding += Math.max(0, inv.grandTotal - paid);
            } else if (inv.status === 'Paid') {
                totalPaid += inv.grandTotal;
            } else {
                totalOutstanding += inv.grandTotal;
            }
        });

        return { totalInvoiced, totalPaid, totalOutstanding, count: clientInvoices.length };
    }, [clientInvoices]);

    // Chronological Account Ledger (Khata) calculation
    const ledgerData = useMemo(() => {
        const start = new Date(ledgerStartDate + 'T00:00:00');
        const end = new Date(ledgerEndDate + 'T23:59:59');

        let openingBalance = 0;
        interface LedgerRow {
            id: string;
            date: string;
            type: 'Invoice' | 'Credit Note' | 'Debit Note' | 'Payment';
            particulars: string;
            ref: string;
            debit: number;
            credit: number;
            runningBalance: number;
        }

        const periodEntries: Omit<LedgerRow, 'runningBalance'>[] = [];
        const sortedInvoices = [...clientInvoices].sort((a, b) => new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime());

        sortedInvoices.forEach(inv => {
            const invDate = new Date(inv.issueDate);
            const isCN = inv.documentType === 'credit_note';
            const isDN = inv.documentType === 'debit_note';
            const isPrior = invDate < start;
            const isInRange = invDate >= start && invDate <= end;

            if (isCN) {
                if (isPrior) {
                    openingBalance -= inv.grandTotal;
                } else if (isInRange) {
                    periodEntries.push({
                        id: `cn_${inv.id}`,
                        date: inv.issueDate,
                        type: 'Credit Note',
                        particulars: `Credit Note #${inv.invoiceNumber}${inv.originalInvoiceNumber ? ` (Inv #${inv.originalInvoiceNumber})` : ''}`,
                        ref: inv.invoiceNumber,
                        debit: 0,
                        credit: inv.grandTotal
                    });
                }
            } else if (isDN) {
                if (isPrior) {
                    openingBalance += inv.grandTotal;
                } else if (isInRange) {
                    periodEntries.push({
                        id: `dn_${inv.id}`,
                        date: inv.issueDate,
                        type: 'Debit Note',
                        particulars: `Debit Note #${inv.invoiceNumber}`,
                        ref: inv.invoiceNumber,
                        debit: inv.grandTotal,
                        credit: 0
                    });
                }
            } else {
                // Regular Tax Invoice
                if (isPrior) {
                    openingBalance += inv.grandTotal;
                } else if (isInRange) {
                    periodEntries.push({
                        id: `inv_${inv.id}`,
                        date: inv.issueDate,
                        type: 'Invoice',
                        particulars: `Tax Invoice #${inv.invoiceNumber}`,
                        ref: inv.invoiceNumber,
                        debit: inv.grandTotal,
                        credit: 0
                    });
                }

                // If invoice has payments recorded, credit each payment installment
                if (inv.payments && inv.payments.length > 0) {
                    inv.payments.forEach(p => {
                        const payDateStr = p.date || inv.issueDate;
                        const payDate = new Date(payDateStr);
                        const isPayPrior = payDate < start;
                        const isPayInRange = payDate >= start && payDate <= end;
                        const payAmt = Number(p.amount) || 0;

                        if (isPayPrior) {
                            openingBalance -= payAmt;
                        } else if (isPayInRange) {
                            periodEntries.push({
                                id: `pay_${p.id || Math.random()}`,
                                date: payDateStr,
                                type: 'Payment',
                                particulars: `Payment Received (${p.mode}${p.referenceNo ? ` • Ref: ${p.referenceNo}` : ''}) • Inv #${inv.invoiceNumber}`,
                                ref: p.referenceNo || `REC-${inv.invoiceNumber}`,
                                debit: 0,
                                credit: payAmt
                            });
                        }
                    });
                } else if (inv.status === 'Paid') {
                    // Legacy paid invoice fallback
                    const payDateStr = inv.dueDate || inv.issueDate;
                    const payDate = new Date(payDateStr);
                    const isPayPrior = payDate < start;
                    const isPayInRange = payDate >= start && payDate <= end;

                    if (isPayPrior) {
                        openingBalance -= inv.grandTotal;
                    } else if (isPayInRange) {
                        periodEntries.push({
                            id: `pay_${inv.id}`,
                            date: payDateStr,
                            type: 'Payment',
                            particulars: `Payment Received (Full) • Inv #${inv.invoiceNumber}`,
                            ref: `REC-${inv.invoiceNumber}`,
                            debit: 0,
                            credit: inv.grandTotal
                        });
                    }
                }
            }
        });

        periodEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let running = openingBalance;
        let totalDebit = 0;
        let totalCredit = 0;

        const rows: LedgerRow[] = periodEntries.map(e => {
            totalDebit += e.debit;
            totalCredit += e.credit;
            running += (e.debit - e.credit);
            return {
                ...e,
                runningBalance: running
            };
        });

        return {
            openingBalance,
            rows,
            totalDebit,
            totalCredit,
            closingBalance: running
        };
    }, [clientInvoices, ledgerStartDate, ledgerEndDate]);

    const handlePresetRange = (preset: 'month' | 'fy' | '90days' | 'all') => {
        const today = new Date();
        const curYear = today.getFullYear();
        const curMonth = today.getMonth();
        const todayStr = today.toISOString().split('T')[0];

        if (preset === 'month') {
            const firstDay = new Date(curYear, curMonth, 1).toISOString().split('T')[0];
            setLedgerStartDate(firstDay);
            setLedgerEndDate(todayStr);
        } else if (preset === 'fy') {
            const startYear = curMonth >= 3 ? curYear : curYear - 1;
            setLedgerStartDate(`${startYear}-04-01`);
            setLedgerEndDate(todayStr);
        } else if (preset === '90days') {
            const past90 = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            setLedgerStartDate(past90);
            setLedgerEndDate(todayStr);
        } else {
            setLedgerStartDate('2020-01-01');
            setLedgerEndDate(todayStr);
        }
    };

    const handleDownloadLedgerCSV = () => {
        const lines: string[][] = [
            ['CLIENT STATEMENT / ACCOUNT LEDGER (KHATA)'],
            ['Company Name', company.details.name || ''],
            ['GSTIN', company.details.gstin || 'N/A'],
            ['Client Name', client.name],
            ['Client GSTIN', client.gstin || 'N/A'],
            ['Statement Period', `${ledgerStartDate} to ${ledgerEndDate}`],
            [],
            ['Date', 'Particulars', 'Voucher #', 'Debit (Dr) (₹)', 'Credit (Cr) (₹)', 'Running Balance (₹)'],
            [ledgerStartDate, 'Opening Balance B/F', '-', '-', '-', ledgerData.openingBalance.toFixed(2)]
        ];

        ledgerData.rows.forEach(r => {
            lines.push([
                r.date,
                r.particulars,
                r.ref,
                r.debit > 0 ? r.debit.toFixed(2) : '-',
                r.credit > 0 ? r.credit.toFixed(2) : '-',
                r.runningBalance.toFixed(2)
            ]);
        });

        lines.push([]);
        lines.push(['Total Transactions', '', '', ledgerData.totalDebit.toFixed(2), ledgerData.totalCredit.toFixed(2), '']);
        lines.push(['Closing Balance', `As on ${ledgerEndDate}`, '', '', '', ledgerData.closingBalance.toFixed(2)]);

        const csvString = lines.map(l => l.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const filename = `Statement_${client.name.replace(/\s+/g, '_')}_${ledgerStartDate}_to_${ledgerEndDate}.csv`;
        downloadCSV(csvString, filename);
        toast.success(`Ledger statement exported (${filename})`);
    };

    const handlePrintStatement = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            window.print();
            return;
        }

        const rowsHtml = ledgerData.rows.map(r => `
            <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${r.date}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${r.particulars}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${r.ref}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${r.debit > 0 ? `₹${r.debit.toFixed(2)}` : '-'}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${r.credit > 0 ? `₹${r.credit.toFixed(2)}` : '-'}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">₹${r.runningBalance.toFixed(2)} ${r.runningBalance >= 0 ? 'Dr' : 'Cr'}</td>
            </tr>
        `).join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Account Statement - ${client.name}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 40px; margin: 0; }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 24px; }
                    .title { font-size: 24px; font-weight: 900; color: #0f172a; margin-bottom: 4px; }
                    .subtitle { font-size: 13px; color: #64748b; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; font-size: 13px; }
                    .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
                    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
                    .kpi { background: #f1f5f9; padding: 12px; border-radius: 8px; text-align: center; }
                    .kpi-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 4px; }
                    .kpi-value { font-size: 18px; font-weight: 900; color: #0f172a; }
                    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 30px; }
                    th { background: #f8fafc; text-align: left; padding: 10px 12px; border-bottom: 2px solid #cbd5e1; font-size: 11px; text-transform: uppercase; color: #475569; }
                    .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
                    @media print { body { padding: 0; } button { display: none; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="title">${company.details.name || 'Company Name'}</div>
                        <div class="subtitle">${company.details.address || ''} ${company.details.city || ''} ${company.details.state || ''}</div>
                        <div class="subtitle">GSTIN: <strong>${company.details.gstin || 'N/A'}</strong> • Phone: ${company.details.phone || 'N/A'}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 20px; font-weight: 800; color: #4f46e5;">ACCOUNT STATEMENT</div>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Khata / Ledger</div>
                        <div style="font-size: 12px; font-weight: 600; margin-top: 4px;">Period: ${ledgerStartDate} to ${ledgerEndDate}</div>
                    </div>
                </div>

                <div class="grid">
                    <div class="box">
                        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">Client Details:</div>
                        <div style="font-size: 15px; font-weight: 800; color: #0f172a;">${client.name}</div>
                        ${client.address ? `<div>${client.address}, ${client.city || ''} ${client.state || ''}</div>` : ''}
                        <div>GSTIN: <strong>${client.gstin || 'Unregistered'}</strong></div>
                        ${client.phone ? `<div>Phone: ${client.phone}</div>` : ''}
                    </div>
                    <div class="box">
                        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">Statement Summary:</div>
                        <div>Opening Balance: <strong>₹${ledgerData.openingBalance.toFixed(2)}</strong></div>
                        <div>Total Debits (Bills): <strong>₹${ledgerData.totalDebit.toFixed(2)}</strong></div>
                        <div>Total Credits (Receipts): <strong>₹${ledgerData.totalCredit.toFixed(2)}</strong></div>
                        <div style="font-size: 14px; font-weight: 800; margin-top: 4px; color: ${ledgerData.closingBalance > 0 ? '#b91c1c' : '#047857'};">
                            Closing Balance: ₹${ledgerData.closingBalance.toFixed(2)} ${ledgerData.closingBalance >= 0 ? '(Receivable)' : '(Advance)'}
                        </div>
                    </div>
                </div>

                <div class="kpi-grid">
                    <div class="kpi">
                        <div class="kpi-label">Opening Balance</div>
                        <div class="kpi-value">₹${ledgerData.openingBalance.toFixed(2)}</div>
                    </div>
                    <div class="kpi">
                        <div class="kpi-label">Total Invoiced (Dr)</div>
                        <div class="kpi-value" style="color: #2563eb;">₹${ledgerData.totalDebit.toFixed(2)}</div>
                    </div>
                    <div class="kpi">
                        <div class="kpi-label">Total Paid (Cr)</div>
                        <div class="kpi-value" style="color: #16a34a;">₹${ledgerData.totalCredit.toFixed(2)}</div>
                    </div>
                    <div class="kpi" style="background: ${ledgerData.closingBalance > 0 ? '#fef2f2' : '#f0fdf4'}; border: 1px solid ${ledgerData.closingBalance > 0 ? '#fecaca' : '#bbf7d0'};">
                        <div class="kpi-label" style="color: ${ledgerData.closingBalance > 0 ? '#b91c1c' : '#15803d'};">Closing Balance Due</div>
                        <div class="kpi-value" style="color: ${ledgerData.closingBalance > 0 ? '#b91c1c' : '#15803d'};">₹${ledgerData.closingBalance.toFixed(2)}</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 100px;">Date</th>
                            <th>Particulars / Description</th>
                            <th style="width: 120px;">Voucher #</th>
                            <th style="width: 110px; text-align: right;">Debit (Dr)</th>
                            <th style="width: 110px; text-align: right;">Credit (Cr)</th>
                            <th style="width: 130px; text-align: right;">Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="background: #f8fafc; font-weight: 600;">
                            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${ledgerStartDate}</td>
                            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">Opening Balance B/F</td>
                            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">-</td>
                            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">-</td>
                            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">-</td>
                            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">₹${ledgerData.openingBalance.toFixed(2)}</td>
                        </tr>
                        ${rowsHtml}
                    </tbody>
                    <tfoot>
                        <tr style="background: #f1f5f9; font-weight: 800; border-top: 2px solid #cbd5e1;">
                            <td colspan="3" style="padding: 10px 12px;">Total Activity & Closing Balance</td>
                            <td style="padding: 10px 12px; text-align: right;">₹${ledgerData.totalDebit.toFixed(2)}</td>
                            <td style="padding: 10px 12px; text-align: right;">₹${ledgerData.totalCredit.toFixed(2)}</td>
                            <td style="padding: 10px 12px; text-align: right; color: ${ledgerData.closingBalance > 0 ? '#b91c1c' : '#047857'}; font-size: 13px;">₹${ledgerData.closingBalance.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>

                <div class="footer">
                    <div>
                        <p>This is a computer-generated account statement and ledger.</p>
                        <p>Please notify us within 7 days in case of any discrepancy.</p>
                    </div>
                    <div style="text-align: center; width: 220px; border-top: 1px solid #0f172a; padding-top: 8px;">
                        <strong>For ${company.details.name || 'Company'}</strong><br/>
                        <span style="font-size: 11px;">Authorized Signatory</span>
                    </div>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 300);
    };

    const handleShareLedgerWhatsApp = () => {
        const cleanPhone = (client.phone || '').replace(/[^0-9]/g, '');
        const phoneParam = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        const msg = `*ACCOUNT STATEMENT / KHATA LEDGER*\n\n` +
            `Dear *${client.name}*,\n` +
            `Here is your account statement from *${company.details.name || 'our company'}* for the period *${ledgerStartDate}* to *${ledgerEndDate}*:\n\n` +
            `• *Opening Balance:* ₹${ledgerData.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n` +
            `• *Total Bills (Debit):* ₹${ledgerData.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n` +
            `• *Total Payments/Credits:* ₹${ledgerData.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n` +
            `• *Net Balance Due:* ₹${ledgerData.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ${ledgerData.closingBalance > 0 ? '(Receivable)' : ledgerData.closingBalance < 0 ? '(Advance)' : '(Nil)'}\n\n` +
            `Please verify and clear any pending balance at your earliest convenience. Thank you!`;

        const url = `https://wa.me/${phoneParam}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    const timelineEvents = useMemo(() => {
        const events: { date: string, title: string, description: string, type: 'created' | 'due' | 'paid', status?: string }[] = [];
        
        clientInvoices.forEach(inv => {
            events.push({
                date: inv.issueDate,
                title: `Invoice #${inv.invoiceNumber} Created`,
                description: `Amount: ${currency}${inv.grandTotal.toFixed(2)}`,
                type: 'created',
                status: inv.status
            });
            
            if (inv.status === 'Overdue') {
                 events.push({
                    date: inv.dueDate,
                    title: `Payment Overdue #${inv.invoiceNumber}`,
                    description: `Due Date Passed. Amount: ${currency}${inv.grandTotal.toFixed(2)}`,
                    type: 'due'
                });
            }
        });
        
        return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [clientInvoices, currency]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Paid': return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'Partially Paid': return 'bg-blue-100 text-blue-700 ring-1 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400';
            case 'Unpaid': return 'bg-amber-100 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400';
            case 'Overdue': return 'bg-rose-100 text-rose-700 ring-1 ring-rose-600/20 dark:bg-rose-900/30 dark:text-rose-400';
            default: return 'bg-slate-100 text-slate-800 ring-1 ring-slate-600/20';
        }
    };

    return (
        <div className="animate-fade-in bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-lg backdrop-blur-md">
            {/* Header with Title, Client Badge & Window Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-accent/10 text-accent dark:bg-accent/20">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                Client History & Analytics
                            </h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 max-w-[240px] sm:max-w-xs" title={client.name}>
                            {client.name} {client.city ? `• ${client.city}` : ''}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 ml-auto">
                    <button 
                        onClick={onToggleMaximize} 
                        className="p-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-700/60 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                        title={isMaximized ? "Restore split view" : "Maximize panel to full width"}
                    >
                        {isMaximized ? <Minimize2 className="h-4 w-4" strokeWidth={2} /> : <Maximize2 className="h-4 w-4" strokeWidth={2} />}
                    </button>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-all"
                        title="Close panel"
                    >
                        <X className="h-4 w-4" strokeWidth={2} />
                    </button>
                </div>
            </div>

            {/* Stats Overview: 2-column or 4-column depending on width */}
            <div className={`grid ${isMaximized ? 'grid-cols-2 md:grid-cols-4' : (panelWidth >= 620 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2')} gap-3 mb-6`}>
                <div className="glass-panel p-3.5 sm:p-4 rounded-xl relative overflow-hidden group hover:shadow-md transition-all border border-slate-200/60 dark:border-slate-700/60">
                    <div className="absolute right-1 top-1 p-2 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none text-slate-900 dark:text-white">
                        <IndianRupee className="h-12 w-12" strokeWidth={2} />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold truncate">Total Invoiced</p>
                    <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight truncate" title={`${currency}${stats.totalInvoiced.toLocaleString('en-IN')}`}>
                        {currency}{stats.totalInvoiced.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                </div>

                <div className="glass-panel p-3.5 sm:p-4 rounded-xl relative overflow-hidden group hover:shadow-md transition-all border border-slate-200/60 dark:border-slate-700/60">
                    <div className="absolute right-1 top-1 p-2 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none text-green-500">
                        <CheckCircle className="h-12 w-12" strokeWidth={2} />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold truncate">Total Paid</p>
                    <p className="text-xl sm:text-2xl font-black text-green-600 dark:text-green-400 mt-1 tracking-tight truncate" title={`${currency}${stats.totalPaid.toLocaleString('en-IN')}`}>
                        {currency}{stats.totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                </div>

                <div className="glass-panel p-3.5 sm:p-4 rounded-xl relative overflow-hidden group hover:shadow-md transition-all border border-slate-200/60 dark:border-slate-700/60">
                    <div className="absolute right-1 top-1 p-2 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none text-orange-500">
                        <Clock className="h-12 w-12" strokeWidth={2} />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold truncate">Outstanding</p>
                    <p className="text-xl sm:text-2xl font-black text-orange-500 dark:text-orange-400 mt-1 tracking-tight truncate" title={`${currency}${stats.totalOutstanding.toLocaleString('en-IN')}`}>
                        {currency}{stats.totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                </div>

                <div className="glass-panel p-3.5 sm:p-4 rounded-xl relative overflow-hidden group hover:shadow-md transition-all border border-slate-200/60 dark:border-slate-700/60">
                    <div className="absolute right-1 top-1 p-2 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none text-blue-500">
                        <FileText className="h-12 w-12" strokeWidth={2} />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold truncate">Total Invoices</p>
                    <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight truncate">
                        {stats.count}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-4 border-b border-slate-200 dark:border-slate-700 mb-5">
                <button 
                    onClick={() => setActiveTab('invoices')} 
                    className={`pb-2.5 text-xs sm:text-sm font-bold transition-all relative ${activeTab === 'invoices' ? 'text-accent' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                    Invoice History ({clientInvoices.length})
                    {activeTab === 'invoices' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent rounded-t-full"></span>}
                </button>
                <button 
                    onClick={() => setActiveTab('ledger')} 
                    className={`pb-2.5 text-xs sm:text-sm font-bold transition-all relative flex items-center gap-1.5 ${activeTab === 'ledger' ? 'text-accent' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Account Ledger (Khata)
                    {activeTab === 'ledger' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent rounded-t-full"></span>}
                </button>
                <button 
                    onClick={() => setActiveTab('timeline')} 
                    className={`pb-2.5 text-xs sm:text-sm font-bold transition-all relative ${activeTab === 'timeline' ? 'text-accent' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                    Timeline & Activity ({timelineEvents.length})
                    {activeTab === 'timeline' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent rounded-t-full"></span>}
                </button>
            </div>

            {/* Ledger (Khata) Tab */}
            {activeTab === 'ledger' && (
                <div className="space-y-4">
                    {/* Date Filter & Export Header */}
                    <div className="bg-white dark:bg-slate-900/60 p-3 sm:p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <Calendar className="w-3.5 h-3.5 text-accent shrink-0" />
                                <input
                                    type="date"
                                    value={ledgerStartDate}
                                    onChange={e => setLedgerStartDate(e.target.value)}
                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-accent min-w-0 flex-1"
                                />
                                <span className="text-xs text-slate-400 shrink-0">to</span>
                                <input
                                    type="date"
                                    value={ledgerEndDate}
                                    onChange={e => setLedgerEndDate(e.target.value)}
                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-accent min-w-0 flex-1"
                                />
                            </div>

                            {/* Export & View Mode Buttons */}
                            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                                {!isMaximized && (
                                    <button
                                        onClick={() => setLedgerViewMode(prev => prev === 'cards' ? 'table' : 'cards')}
                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
                                        title={ledgerViewMode === 'cards' ? "Switch to Accountant Table View" : "Switch to Compact Card Feed"}
                                    >
                                        <FileSpreadsheet className="w-3.5 h-3.5" />
                                        <span>{ledgerViewMode === 'cards' ? 'Table' : 'Feed'}</span>
                                    </button>
                                )}
                                <button
                                    onClick={handleDownloadLedgerCSV}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
                                    title="Export to Excel CSV"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>CSV</span>
                                </button>
                                <button
                                    onClick={handlePrintStatement}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
                                    title="Download Statement as PDF / Print"
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>PDF</span>
                                </button>
                                <button
                                    onClick={handleShareLedgerWhatsApp}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
                                    title="Share statement summary on WhatsApp"
                                >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>WhatsApp</span>
                                </button>
                            </div>
                        </div>

                        {/* Presets Chips */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">Quick Select:</span>
                            <button
                                onClick={() => handlePresetRange('month')}
                                className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors"
                            >
                                This Month
                            </button>
                            <button
                                onClick={() => handlePresetRange('fy')}
                                className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-accent font-bold hover:bg-indigo-100 transition-colors"
                            >
                                Current FY
                            </button>
                            <button
                                onClick={() => handlePresetRange('90days')}
                                className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors"
                            >
                                Last 90 Days
                            </button>
                            <button
                                onClick={() => handlePresetRange('all')}
                                className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors"
                            >
                                All Time
                            </button>
                        </div>
                    </div>

                    {/* Summary Balances Card */}
                    <div className={`grid ${isMaximized ? 'grid-cols-2 md:grid-cols-4' : (panelWidth >= 680 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2')} gap-2.5`}>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 min-w-0 overflow-hidden">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Opening Balance</div>
                            <div className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-200 mt-0.5 font-mono truncate" title={`₹${ledgerData.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}>
                                ₹{ledgerData.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-[10px] text-slate-400 font-semibold truncate">{ledgerData.openingBalance >= 0 ? 'Dr (Receivable)' : 'Cr (Advance)'}</div>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 min-w-0 overflow-hidden">
                            <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider truncate">Total Debits (Bills)</div>
                            <div className="text-sm sm:text-base font-black text-blue-600 dark:text-blue-400 mt-0.5 font-mono truncate" title={`₹${ledgerData.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}>
                                ₹{ledgerData.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-[10px] text-slate-400 font-semibold truncate">{ledgerData.rows.filter(r => r.debit > 0).length} transactions</div>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 min-w-0 overflow-hidden">
                            <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider truncate">Total Credits (Paid)</div>
                            <div className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono truncate" title={`₹${ledgerData.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}>
                                ₹{ledgerData.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-[10px] text-slate-400 font-semibold truncate">{ledgerData.rows.filter(r => r.credit > 0).length} receipts</div>
                        </div>

                        <div className={`p-3 rounded-xl border min-w-0 overflow-hidden ${ledgerData.closingBalance > 0 ? 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40' : 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'}`}>
                            <div className={`text-[10px] font-bold uppercase tracking-wider truncate ${ledgerData.closingBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                Closing Balance
                            </div>
                            <div className={`text-sm sm:text-base font-black mt-0.5 font-mono truncate ${ledgerData.closingBalance > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`} title={`₹${ledgerData.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}>
                                ₹{ledgerData.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className={`text-[10px] font-bold truncate ${ledgerData.closingBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {ledgerData.closingBalance > 0 ? 'Due from Client' : ledgerData.closingBalance < 0 ? 'Advance with Us' : 'All Cleared (Nil)'}
                            </div>
                        </div>
                    </div>

                    {/* Ledger Content: Adaptive Feed for Normal/Split View, 6-Column Accountant Table for Full Screen */}
                    {ledgerViewMode === 'cards' && !isMaximized ? (
                        <div className="space-y-2.5">
                            {/* Opening Balance Card */}
                            <div className="p-3 bg-slate-100/70 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-slate-500 text-[11px]">{ledgerStartDate}</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300 italic">Opening Balance B/F</span>
                                </div>
                                <div className="font-mono font-bold text-slate-900 dark:text-white">
                                    ₹{ledgerData.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} {ledgerData.openingBalance >= 0 ? 'Dr' : 'Cr'}
                                </div>
                            </div>

                            {/* Transactions Cards */}
                            {ledgerData.rows.length === 0 ? (
                                <div className="p-8 text-center bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200/60 dark:border-slate-800 text-slate-400 italic text-xs">
                                    No transactions recorded in this date range.
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
                                    {ledgerData.rows.map(row => (
                                        <div 
                                            key={row.id} 
                                            className="p-3 bg-white dark:bg-slate-800/70 rounded-xl border border-slate-200/80 dark:border-slate-700/80 hover:border-accent/40 dark:hover:border-accent/40 transition-all shadow-sm"
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <span className="text-[10px] font-mono text-slate-500 font-semibold">{row.date}</span>
                                                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                                        row.type === 'Invoice' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                                                        row.type === 'Payment' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                                                        'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                                    }`}>
                                                        {row.type}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-accent font-bold truncate max-w-[130px]">{row.ref}</span>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    {row.debit > 0 ? (
                                                        <span className="text-xs font-black text-blue-600 dark:text-blue-400 font-mono">
                                                            +₹{row.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })} <span className="text-[9px] font-bold">Dr</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                                            -₹{row.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })} <span className="text-[9px] font-bold">Cr</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100 dark:border-slate-700/60">
                                                <span className="truncate pr-2 text-slate-700 dark:text-slate-300 font-medium">{row.particulars}</span>
                                                <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0 text-xs">
                                                    Bal: ₹{row.runningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} <span className="text-[10px] text-slate-400">{row.runningBalance >= 0 ? 'Dr' : 'Cr'}</span>
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Summary Card Footer */}
                            <div className="p-3.5 bg-slate-900 text-white dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs font-bold shadow-sm">
                                <div>
                                    <div className="text-[10px] uppercase text-slate-400">Total Activity</div>
                                    <div className="mt-0.5">
                                        <span className="text-blue-400 font-mono">Dr: ₹{ledgerData.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</span>
                                        <span className="mx-1.5 text-slate-600">•</span>
                                        <span className="text-emerald-400 font-mono">Cr: ₹{ledgerData.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] uppercase text-slate-400">Closing Balance</div>
                                    <div className={`text-sm font-black font-mono mt-0.5 ${ledgerData.closingBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                        ₹{ledgerData.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} {ledgerData.closingBalance >= 0 ? 'Dr' : 'Cr'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-panel rounded-xl overflow-hidden shadow-sm border border-slate-200/60 dark:border-slate-800/60">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-xs text-left min-w-[540px]">
                                    <thead className="bg-slate-100/70 dark:bg-slate-800/70 text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="px-3.5 py-2.5">Date</th>
                                            <th className="px-3.5 py-2.5">Particulars</th>
                                            <th className="px-3.5 py-2.5">Voucher #</th>
                                            <th className="px-3.5 py-2.5 text-right">Debit (Dr)</th>
                                            <th className="px-3.5 py-2.5 text-right">Credit (Cr)</th>
                                            <th className="px-3.5 py-2.5 text-right">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {/* Opening Balance Row */}
                                        <tr className="bg-slate-50/60 dark:bg-slate-900/30 font-semibold">
                                            <td className="px-3.5 py-2 font-mono text-slate-500">{ledgerStartDate}</td>
                                            <td className="px-3.5 py-2 text-slate-700 dark:text-slate-300 italic">Opening Balance B/F</td>
                                            <td className="px-3.5 py-2 text-slate-400">-</td>
                                            <td className="px-3.5 py-2 text-right text-slate-400">-</td>
                                            <td className="px-3.5 py-2 text-right text-slate-400">-</td>
                                            <td className="px-3.5 py-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                ₹{ledgerData.openingBalance.toFixed(2)} <span className="text-[10px] text-slate-400">{ledgerData.openingBalance >= 0 ? 'Dr' : 'Cr'}</span>
                                            </td>
                                        </tr>

                                        {/* Transactions Rows */}
                                        {ledgerData.rows.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-3.5 py-6 text-center text-slate-400 italic">
                                                    No transactions recorded in this date range.
                                                </td>
                                            </tr>
                                        ) : (
                                            ledgerData.rows.map(row => (
                                                <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                                    <td className="px-3.5 py-2.5 font-mono text-slate-500 whitespace-nowrap">{row.date}</td>
                                                    <td className="px-3.5 py-2.5">
                                                        <span className="font-medium text-slate-800 dark:text-slate-200">{row.particulars}</span>
                                                    </td>
                                                    <td className="px-3.5 py-2.5 font-mono text-accent font-semibold">{row.ref}</td>
                                                    <td className="px-3.5 py-2.5 text-right font-mono font-medium text-blue-600 dark:text-blue-400">
                                                        {row.debit > 0 ? `₹${row.debit.toFixed(2)}` : '-'}
                                                    </td>
                                                    <td className="px-3.5 py-2.5 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
                                                        {row.credit > 0 ? `₹${row.credit.toFixed(2)}` : '-'}
                                                    </td>
                                                    <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                        ₹{row.runningBalance.toFixed(2)} <span className="text-[10px] text-slate-400">{row.runningBalance >= 0 ? 'Dr' : 'Cr'}</span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    <tfoot className="bg-slate-100/70 dark:bg-slate-800/70 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                                        <tr>
                                            <td colSpan={3} className="px-3.5 py-2.5 uppercase text-[11px] text-slate-600 dark:text-slate-300">Total Period Activity</td>
                                            <td className="px-3.5 py-2.5 text-right font-mono text-blue-600 dark:text-blue-400">₹{ledgerData.totalDebit.toFixed(2)}</td>
                                            <td className="px-3.5 py-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400">₹{ledgerData.totalCredit.toFixed(2)}</td>
                                            <td className={`px-3.5 py-2.5 text-right font-mono text-xs ${ledgerData.closingBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                ₹{ledgerData.closingBalance.toFixed(2)} {ledgerData.closingBalance >= 0 ? 'Dr' : 'Cr'}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
                <div className="glass-panel rounded-xl overflow-hidden shadow-sm border border-slate-200/60 dark:border-slate-800/60">
                    {clientInvoices.length > 0 ? (
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-sm text-left min-w-[480px]">
                                <thead className="bg-slate-100/70 dark:bg-slate-800/70 text-[11px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="px-3.5 py-3 whitespace-nowrap">Date</th>
                                        <th className="px-3.5 py-3 whitespace-nowrap">Invoice #</th>
                                        <th className="px-3.5 py-3 text-right whitespace-nowrap">Amount</th>
                                        <th className="px-3.5 py-3 text-center whitespace-nowrap">Status</th>
                                        <th className="px-3.5 py-3 text-right whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {clientInvoices.map(inv => (
                                        <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-3.5 py-3 text-slate-600 dark:text-slate-300 font-mono text-xs whitespace-nowrap">{inv.issueDate}</td>
                                            <td className="px-3.5 py-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">{inv.invoiceNumber}</td>
                                            <td className="px-3.5 py-3 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap font-mono">{currency}{inv.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-3.5 py-3 text-center whitespace-nowrap">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide inline-block ${getStatusBadge(inv.status)}`}>{inv.status}</span>
                                            </td>
                                            <td className="px-3.5 py-3 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1">
                                                    {onRecordPaymentClick && inv.documentType !== 'quotation' && (
                                                        <button 
                                                            onClick={() => onRecordPaymentClick(inv)} 
                                                            className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg text-slate-500 hover:text-emerald-600 transition-colors" 
                                                            title="Record Payment / View Receipts"
                                                        >
                                                            <CreditCard className="h-4 w-4" strokeWidth={2} />
                                                        </button>
                                                    )}
                                                    <button onClick={() => onViewInvoice(inv)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-accent transition-colors" title="View Invoice"><Eye className="h-4 w-4" strokeWidth={2} /></button>
                                                    <button onClick={() => onEditInvoice(inv.id)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors" title="Edit Invoice"><Edit className="h-4 w-4" strokeWidth={2} /></button>
                                                    <button onClick={() => onEmailInvoice(inv)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-blue-500 transition-colors" title="Send Email / WhatsApp"><Mail className="h-4 w-4" strokeWidth={2} /></button>
                                                    <button onClick={() => onDeleteInvoice(inv.id)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-red-500 transition-colors" title="Delete Invoice"><Trash2 className="h-4 w-4" strokeWidth={2} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                            <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" strokeWidth={1} />
                            <p className="text-sm font-medium">No invoice history found for this client.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
                <div className="glass-panel p-5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    <div className="relative pl-4">
                        <div className="absolute top-0 bottom-0 left-[21px] w-px bg-slate-200 dark:bg-slate-700"></div>
                        <div className="space-y-6">
                            {timelineEvents.map((event, idx) => (
                                <div key={idx} className="relative flex gap-4 group">
                                    <div className={`absolute left-0 mt-1 w-9 h-9 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center z-10 shadow-sm
                                        ${event.type === 'created' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400' : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'}`}>
                                        {event.type === 'created' ? (
                                            <FileText className="h-4 w-4" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4" />
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 ml-10 pt-0.5">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-accent transition-colors">{event.title}</h4>
                                            <span className="text-[11px] font-mono font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{event.date}</span>
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">{event.description}</p>
                                        {event.status && (
                                            <span className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded ${getStatusBadge(event.status)}`}>
                                                {event.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {timelineEvents.length === 0 && (
                                <p className="text-sm text-slate-500 italic pl-10">No activity recorded yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Actions */}
            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3">
                {isMaximized ? (
                    <Button variant="secondary" className="w-full flex items-center justify-center gap-2" onClick={onToggleMaximize}>
                        <ArrowLeft className="w-4 h-4" />
                        Back to Client List
                    </Button>
                ) : (
                    <Button variant="secondary" className="w-full" onClick={onClose}>
                        Close History Panel
                    </Button>
                )}
            </div>
        </div>
    );
};

const Clients: React.FC<ClientsProps> = ({ clients, setClients, invoices, company, onEditInvoice, onDeleteInvoice, onStatusChange, onBulkDelete, onRecordPayment, initialSearchQuery }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client>(emptyClient);
  const [errors, setErrors] = useState<ClientFormErrors>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  
  // For History Panel
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [invoiceToView, setInvoiceToView] = useState<Invoice | null>(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);

  // Resizable History Panel State
  const [panelWidth, setPanelWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('invoicepro_client_panel_width');
      return saved ? Math.max(380, Math.min(850, parseInt(saved, 10))) : 490;
    } catch {
      return 490;
    }
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const newWidth = rect.right - e.clientX;
      const maxPanelWidth = Math.max(400, rect.width - 320);
      const clampedWidth = Math.max(380, Math.min(maxPanelWidth, newWidth));
      setPanelWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      try {
        localStorage.setItem('invoicepro_client_panel_width', panelWidth.toString());
      } catch {}
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, panelWidth]);

  const handleResetWidth = () => {
    setPanelWidth(490);
    try {
      localStorage.setItem('invoicepro_client_panel_width', '490');
    } catch {}
  };

  // Derived state
  const filteredClients = useMemo(() => {
      if (!searchQuery) return clients;
      const lower = searchQuery.toLowerCase();
      return clients.filter(c => 
          c.name.toLowerCase().includes(lower) || 
          c.email.toLowerCase().includes(lower) ||
          c.phone.includes(lower) ||
          (c.city && c.city.toLowerCase().includes(lower)) ||
          (c.state && c.state.toLowerCase().includes(lower)) ||
          (c.tags && c.tags.some(t => t.toLowerCase().includes(lower)))
      );
  }, [clients, searchQuery]);

  // Handlers
  const handleOpenModal = (client?: Client) => {
      setErrors({});
      setEditingClient(client || emptyClient);
      setIsModalOpen(true);
  };

  const validateClient = (client: Client) => {
      const newErrors: ClientFormErrors = {};
      const nameError = validateRequired(client.name);
      if(nameError) newErrors.name = nameError;
      
      const emailError = validateEmail(client.email);
      if(client.email && emailError) newErrors.email = emailError;
      
      const gstinError = validateGstin(client.gstin);
      if(client.gstin && gstinError) newErrors.gstin = gstinError;
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  const handleSaveClient = () => {
      if (!validateClient(editingClient)) return;
      
      if (editingClient.id) {
          setClients(clients.map(c => c.id === editingClient.id ? editingClient : c));
          trackEvent('update_client', { clientId: editingClient.id });
      } else {
          const newId = Date.now().toString();
          setClients([...clients, { ...editingClient, id: newId }]);
          trackEvent('create_client', { clientId: newId });
      }
      setIsModalOpen(false);
  };

  const handleDeleteClient = (id: string) => {
      setClientToDelete(id);
      setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
      if (clientToDelete) {
          setClients(clients.filter(c => c.id !== clientToDelete));
          if(viewingClient?.id === clientToDelete) setViewingClient(null);
      }
      setIsConfirmOpen(false);
      setClientToDelete(null);
  };

  // Bulk actions
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) setSelectedIds(filteredClients.map(c => c.id));
      else setSelectedIds([]);
  };

  const handleSelectOne = (id: string) => {
      if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
      else setSelectedIds([...selectedIds, id]);
  };

  const handleBulkDelete = () => {
      if (window.confirm(`Delete ${selectedIds.length} clients?`)) {
          onBulkDelete(selectedIds);
          setSelectedIds([]);
      }
  };
  
  const handleExport = () => {
      const data = selectedIds.length ? clients.filter(c => selectedIds.includes(c.id)) : clients;
      const csv = arrayToCSV(data, [
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
          { key: 'gstin', label: 'GSTIN' },
          { key: 'city', label: 'City' }
      ]);
      downloadCSV(csv, 'clients.csv');
  };

  const uniqueTags = useMemo(() => Array.from(new Set(clients.flatMap(c => c.tags || []))), [clients]);

  return (
      <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">Clients Directory</h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Manage accounts, billing details, and view comprehensive invoice activity.</p>
              </div>
              <div className="flex gap-2.5 shrink-0">
                  <Button variant="secondary" onClick={handleExport} className="gap-2">
                      <Download className="w-4 h-4" />
                      Export
                  </Button>
                  <Button onClick={() => handleOpenModal()} className="gap-2 shadow-lg shadow-accent/20">
                      <Plus className="w-4 h-4" />
                      Add Client
                  </Button>
              </div>
          </div>

          {/* Search & Counter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-lg">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input 
                      type="text" 
                      placeholder="Search clients by name, email, phone, city, or tags..." 
                      value={searchQuery} 
                      onChange={e => setSearchQuery(e.target.value)} 
                      className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-accent focus:outline-none transition-all shadow-sm" 
                  />
                  {searchQuery && (
                      <button 
                          onClick={() => setSearchQuery('')} 
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                          title="Clear search"
                      >
                          <X className="w-3.5 h-3.5" />
                      </button>
                  )}
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                      {filteredClients.length} of {clients.length} Clients
                  </span>
              </div>
          </div>

          {selectedIds.length > 0 && (
              <div className="bg-accent text-white px-5 py-3 rounded-xl flex justify-between items-center animate-slide-in-top shadow-lg shadow-accent/30">
                  <span className="text-sm font-bold">{selectedIds.length} Clients Selected</span>
                  <div className="flex gap-2">
                      <Button variant="secondary" className="!py-1 !px-3 !text-xs bg-white/20 text-white hover:bg-white/30 border-transparent" onClick={handleBulkDelete}>Delete Selected</Button>
                      <button onClick={() => setSelectedIds([])} className="text-xs font-bold hover:underline px-2 py-1">Clear</button>
                  </div>
              </div>
          )}

          {/* Resizable Split Container */}
          <div ref={splitContainerRef} className="flex flex-col lg:flex-row items-stretch relative min-h-[550px] w-full gap-0">
              {/* Client List (Left Pane) */}
              <div 
                  style={{
                      display: isMaximized && viewingClient ? 'none' : 'block',
                      flex: viewingClient ? '1 1 0%' : '1 1 100%',
                      minWidth: viewingClient ? '320px' : '100%'
                  }}
                  className="glass-panel rounded-2xl overflow-hidden transition-[flex] duration-150 min-w-0 flex flex-col border border-slate-200/80 dark:border-slate-800/80 shadow-sm"
              >
                  <div className="overflow-x-auto custom-scrollbar flex-1">
                      <table className="w-full min-w-[650px] text-left text-sm">
                          <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                              <tr>
                                  <th className="px-4 py-3 w-10"><input type="checkbox" checked={selectedIds.length === filteredClients.length && filteredClients.length > 0} onChange={handleSelectAll} className="rounded border-slate-300 text-accent focus:ring-accent" /></th>
                                  <th className="px-4 py-3">Name</th>
                                  <th className="px-4 py-3">Contact</th>
                                  <th className="px-4 py-3">Location</th>
                                  <th className="px-4 py-3 text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {filteredClients.map(client => {
                                  const isSelected = viewingClient?.id === client.id;
                                  return (
                                      <tr 
                                          key={client.id} 
                                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors relative ${
                                              isSelected ? 'bg-indigo-50/90 dark:bg-indigo-950/30' : ''
                                          }`} 
                                          onClick={() => setViewingClient(client)}
                                      >
                                          <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                                              <input type="checkbox" checked={selectedIds.includes(client.id)} onChange={() => handleSelectOne(client.id)} className="rounded border-slate-300 text-accent focus:ring-accent" />
                                          </td>
                                          <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                                              <div className="flex items-center gap-2">
                                                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>}
                                                  <span>{client.name}</span>
                                              </div>
                                              {client.tags && client.tags.length > 0 && (
                                                  <div className="flex gap-1 mt-1 flex-wrap">
                                                      {client.tags.map(t => <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getTagColor(t)}`}>{t}</span>)}
                                                  </div>
                                              )}
                                          </td>
                                          <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                                              <div className="flex flex-col text-xs">
                                                  <span className="font-medium text-slate-700 dark:text-slate-300">{client.email || '—'}</span>
                                                  <span className="text-slate-400 mt-0.5">{client.phone || '—'}</span>
                                              </div>
                                          </td>
                                          <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                                              {client.city ? `${client.city}${client.state ? `, ${client.state}` : ''}` : '—'}
                                          </td>
                                          <td className="px-4 py-3.5 text-right space-x-1" onClick={e => e.stopPropagation()}>
                                              <button onClick={() => handleOpenModal(client)} className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700" title="Edit Client"><Edit className="h-4 w-4" strokeWidth={2} /></button>
                                              <button onClick={() => handleDeleteClient(client.id)} className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700" title="Delete Client"><Trash2 className="h-4 w-4" strokeWidth={2} /></button>
                                          </td>
                                      </tr>
                                  );
                              })}
                              {filteredClients.length === 0 && (
                                  <tr>
                                      <td colSpan={5} className="text-center py-12 text-slate-500 dark:text-slate-400">
                                          <p className="font-medium">No clients found matching "{searchQuery}".</p>
                                          {searchQuery && (
                                              <button onClick={() => setSearchQuery('')} className="mt-2 text-xs text-accent font-bold hover:underline">
                                                  Clear search
                                              </button>
                                          )}
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>

              {/* Draggable Divider (Desktop) */}
              {viewingClient && !isMaximized && (
                  <div 
                      onMouseDown={handleMouseDown}
                      onDoubleClick={handleResetWidth}
                      title="Drag left/right to resize • Double-click to reset"
                      className={`hidden lg:flex flex-col justify-center items-center w-4 -mx-2 z-20 cursor-col-resize select-none transition-colors group ${
                          isDragging ? 'bg-accent/20' : 'hover:bg-accent/15'
                      }`}
                  >
                      <div className={`w-1 h-16 rounded-full transition-all duration-200 ${
                          isDragging 
                              ? 'bg-accent shadow-lg shadow-accent/50 scale-y-110' 
                              : 'bg-slate-300 dark:bg-slate-700 group-hover:bg-accent group-hover:scale-y-110'
                      }`} />
                  </div>
              )}

              {/* History Panel Side View */}
              {viewingClient && (
                  <div 
                      style={{
                          width: isMaximized ? '100%' : `${panelWidth}px`,
                          maxWidth: '100%'
                      }}
                      className={`w-full ${isMaximized ? '' : 'lg:shrink-0'} animate-fade-in mt-6 lg:mt-0 ${viewingClient && !isMaximized ? 'lg:pl-3' : ''}`}
                  >
                      <div className="sticky top-6">
                          <ClientHistoryPanel 
                              client={viewingClient} 
                              invoices={invoices} 
                              currency="₹" 
                              company={company} 
                              onEditInvoice={onEditInvoice} 
                              onDeleteInvoice={onDeleteInvoice} 
                              onViewInvoice={(inv) => setInvoiceToView(inv)}
                              onEmailInvoice={(inv) => alert(`This functionality is mainly in Invoices tab. In a real app, this would open email modal for ${inv.invoiceNumber}.`)}
                              onRecordPaymentClick={(inv) => setPaymentModalInvoice(inv)}
                              onClose={() => setViewingClient(null)}
                              isMaximized={isMaximized}
                              onToggleMaximize={() => setIsMaximized(!isMaximized)}
                              panelWidth={panelWidth}
                          />
                      </div>
                  </div>
              )}
          </div>

          {/* Modals */}
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingClient.id ? "Edit Client" : "New Client"}>
              <ClientForm client={editingClient} setClient={setEditingClient} errors={errors} setErrors={setErrors} availableTags={uniqueTags} />
              <div className="p-6 pt-0 flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveClient}>Save Client</Button>
              </div>
          </Modal>

          <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="Delete Client">
              <div className="p-6">
                  <p className="text-slate-600 dark:text-slate-400">Are you sure you want to delete this client? This action cannot be undone.</p>
                  <div className="flex justify-end gap-3 mt-6">
                      <Button variant="secondary" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
                      <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>Delete</Button>
                  </div>
              </div>
          </Modal>

          {/* Invoice View Modal */}
          <Modal isOpen={!!invoiceToView} onClose={() => setInvoiceToView(null)} title={invoiceToView ? `Invoice #${invoiceToView.invoiceNumber}` : ''}>
              {invoiceToView && <InvoiceView invoice={invoiceToView} company={company} onClose={() => setInvoiceToView(null)} onStatusChange={onStatusChange} />}
          </Modal>

          {/* Record Payment Modal */}
          {paymentModalInvoice && (
              <RecordPaymentModal
                  isOpen={!!paymentModalInvoice}
                  onClose={() => setPaymentModalInvoice(null)}
                  invoice={paymentModalInvoice}
                  company={company}
                  onRecordPayment={(invId, payment) => {
                      onRecordPayment?.(invId, payment);
                      // Update invoice in modal view
                      setPaymentModalInvoice(prev => prev ? {
                          ...prev,
                          payments: [...(prev.payments || []), payment]
                      } : null);
                  }}
              />
          )}
      </div>
  );
};

export default Clients;
