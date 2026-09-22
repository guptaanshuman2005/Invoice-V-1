
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { Client, Invoice, Company } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Modal from './common/Modal';
import { INDIAN_STATES } from '../constants';
import { InvoiceView } from './Invoices';
import { validateEmail, validateRequired, validateGstin, fetchLocationByPincode } from '../utils/validation';
import { arrayToCSV, downloadCSV } from '../utils/csvExport';
import { Clock, IndianRupee, CheckCircle, FileText, Eye, Edit, Mail, Trash2, AlertCircle, Search, Plus, Download, Upload, X, Maximize2, Minimize2, ArrowLeft } from 'lucide-react';
import { trackEvent } from '../utils/analytics';

interface ClientsProps {
  clients: Client[];
  setClients: (clients: Client[]) => void;
  invoices: Invoice[];
  company: Company;
  onEditInvoice: (invoiceId: string) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onStatusChange: (invoiceId: string, status: Invoice['status']) => void;
  onBulkDelete: (clientIds: string[]) => void;
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
    onEditInvoice: (id: string) => void;
    onViewInvoice: (inv: Invoice) => void;
    onDeleteInvoice: (id: string) => void;
    onEmailInvoice: (inv: Invoice) => void;
    onClose: () => void;
    isMaximized: boolean;
    onToggleMaximize: () => void;
    panelWidth?: number;
}

const ClientHistoryPanel: React.FC<ClientHistoryPanelProps> = ({ 
    client, invoices, currency, onEditInvoice, onViewInvoice, onDeleteInvoice, onEmailInvoice,
    onClose, isMaximized, onToggleMaximize, panelWidth = 490
}) => {
    const [activeTab, setActiveTab] = useState<'invoices' | 'timeline'>('invoices');

    const clientInvoices = useMemo(() => 
        invoices.filter(inv => inv.client?.id === client.id).sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
    , [invoices, client.id]);

    const stats = useMemo(() => {
        const totalInvoiced = clientInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
        const totalPaid = clientInvoices.filter(inv => inv.status === 'Paid').reduce((acc, inv) => acc + inv.grandTotal, 0);
        const totalOutstanding = clientInvoices.filter(inv => inv.status !== 'Paid').reduce((acc, inv) => acc + inv.grandTotal, 0);
        return { totalInvoiced, totalPaid, totalOutstanding, count: clientInvoices.length };
    }, [clientInvoices]);

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
            <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 mb-5">
                <button 
                    onClick={() => setActiveTab('invoices')} 
                    className={`pb-2.5 text-xs sm:text-sm font-bold transition-all relative ${activeTab === 'invoices' ? 'text-accent' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                    Invoice History ({clientInvoices.length})
                    {activeTab === 'invoices' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent rounded-t-full"></span>}
                </button>
                <button 
                    onClick={() => setActiveTab('timeline')} 
                    className={`pb-2.5 text-xs sm:text-sm font-bold transition-all relative ${activeTab === 'timeline' ? 'text-accent' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                    Timeline & Activity ({timelineEvents.length})
                    {activeTab === 'timeline' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent rounded-t-full"></span>}
                </button>
            </div>

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

const Clients: React.FC<ClientsProps> = ({ clients, setClients, invoices, company, onEditInvoice, onDeleteInvoice, onStatusChange, onBulkDelete, initialSearchQuery }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client>(emptyClient);
  const [errors, setErrors] = useState<ClientFormErrors>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  
  // For History Panel
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [invoiceToView, setInvoiceToView] = useState<Invoice | null>(null);

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
                              onEditInvoice={onEditInvoice} 
                              onDeleteInvoice={onDeleteInvoice} 
                              onViewInvoice={(inv) => setInvoiceToView(inv)}
                              onEmailInvoice={(inv) => alert(`This functionality is mainly in Invoices tab. In a real app, this would open email modal for ${inv.invoiceNumber}.`)}
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
      </div>
  );
};

export default Clients;
