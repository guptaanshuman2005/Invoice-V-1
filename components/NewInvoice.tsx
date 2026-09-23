
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Invoice, Item, InvoiceItem, Company, DraftInvoice, Quotation, Client } from '../types';
import Input from './common/Input';
import Button from './common/Button';
import Modal from './common/Modal';
import { INDIAN_STATES } from '../constants';
import { InvoiceView } from './Invoices';
import { MessageCircle, ArrowLeft, Trash2, Check, Info, Eye, UserPlus, Plus } from 'lucide-react';
import { Dropdown } from './common/Dropdown';
import { InvoicePDF } from './InvoicePDF';
import { PDFViewer } from '@react-pdf/renderer';
import { numberToWords } from './Invoices';
import { toast } from 'sonner';

interface NewInvoiceProps {
  company: Company;
  saveInvoice: (data: Omit<Invoice, 'id' | 'status'> | Invoice | Omit<Quotation, 'id' | 'status'>) => void;
  setActiveView: (view: string) => void;
  invoiceToEdit?: Invoice | Quotation | null;
  clearEditingInvoice: () => void;
  onUpdateCompany: (updatedCompany: Company) => void;
  draftInvoice: DraftInvoice;
  setDraftInvoice: React.Dispatch<React.SetStateAction<DraftInvoice>>;
  mode?: 'invoice' | 'quote'; // Added mode
}

const ITEM_UNITS = ['pcs', 'kgs', 'ltr', 'nos', 'box', 'pkt', 'gram', 'set', 'pair', 'm', 'cm', 'ft', 'sqft'];

// WhatsApp Icon for Modal
const WhatsAppIcon = () => <MessageCircle className="w-5 h-5" />;

const NewInvoice: React.FC<NewInvoiceProps> = ({ 
    company, saveInvoice, setActiveView, 
    invoiceToEdit, clearEditingInvoice, onUpdateCompany,
    draftInvoice, setDraftInvoice, mode = 'invoice'
}) => {
    const isEditing = !!invoiceToEdit;
    const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false);
    const [newItemData, setNewItemData] = useState<Partial<Item>>({ name: '', price: 0, gstRate: 18, unit: 'pcs', quantityInStock: 0, hsn: '' });
    const [itemModalError, setItemModalError] = useState<string | null>(null);
    const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
    const [itemSearchTerms, setItemSearchTerms] = useState<string[]>([]);
    const [viewItemDetails, setViewItemDetails] = useState<Item | null>(null);
    const [newItemIndex, setNewItemIndex] = useState<number | null>(null);

    // Client Creation Modal State
    const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false);
    const [newClientData, setNewClientData] = useState<{
        name: string; phone: string; email: string; gstin: string;
        address: string; city: string; state: string; zip: string;
    }>({
        name: '', phone: '', email: '', gstin: '',
        address: '', city: '', state: '', zip: ''
    });
    const [clientError, setClientError] = useState<string | null>(null);
    
    // Success Modal State
    const [savedInvoice, setSavedInvoice] = useState<Invoice | Quotation | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showLivePreview, setShowLivePreview] = useState(false);

    // Initialize editing state or load draft
    useEffect(() => {
        if (invoiceToEdit) {
            const client = invoiceToEdit.client;
            // Handle differences between Invoice and Quotation types safely
            const invNum = 'invoiceNumber' in invoiceToEdit ? invoiceToEdit.invoiceNumber : (invoiceToEdit as Quotation).quotationNumber;
            const validUntil = 'validUntil' in invoiceToEdit ? (invoiceToEdit as Quotation).validUntil : '';
            
            setDraftInvoice({
                invoiceNumber: invNum,
                clientId: client.id,
                items: invoiceToEdit.items,
                issueDate: invoiceToEdit.issueDate,
                dueDate: invoiceToEdit.dueDate,
                validUntil: validUntil,
                notes: invoiceToEdit.notes,
                selectedBankAccountId: invoiceToEdit.selectedBankAccountId,
                shippingDetails: {
                    name: invoiceToEdit.shippingName || client.name,
                    address: invoiceToEdit.shippingAddress || client.address,
                    city: invoiceToEdit.shippingCity || client.city,
                    state: invoiceToEdit.shippingState || client.state,
                    zip: invoiceToEdit.shippingZip || client.zip,
                    gstin: invoiceToEdit.shippingGstin || client.gstin
                },
                isShippingSameAsBilling: 
                    (invoiceToEdit.shippingAddress === client.address && 
                     invoiceToEdit.shippingState === client.state) || !invoiceToEdit.shippingAddress,
                transporterId: (invoiceToEdit as any).transporterId || 'self', 
                vehicleNumber: invoiceToEdit.vehicleNumber || '',
                ewayBillNumber: invoiceToEdit.ewayBillNumber || '',
                type: mode
            });
        } else {
            // Load from localStorage if available
            const savedDraft = localStorage.getItem(`invoice_draft_${company.id}`);
            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    // Only load if it matches the current mode
                    if (parsed.type === mode) {
                        setDraftInvoice(parsed);
                    }
                } catch (e) {
                    console.error("Failed to parse draft", e);
                }
            }
        }
    }, [invoiceToEdit, setDraftInvoice, mode, company.id]);

    // Auto-Save Draft to LocalStorage
    useEffect(() => {
        if (!isEditing && draftInvoice.items.length > 0) {
            const key = `invoice_draft_${company.id}`;
            localStorage.setItem(key, JSON.stringify(draftInvoice));
        }
    }, [draftInvoice, company.id, isEditing]);

    // Handlers
    const handleClientChange = (clientId: string) => {
        const client = company.clients.find(c => c.id === clientId);
        setDraftInvoice(prev => ({
            ...prev,
            clientId: clientId,
            isShippingSameAsBilling: true, // Always reset to safe default when changing client
            shippingDetails: client ? {
                name: client.name,
                address: client.address,
                city: client.city,
                state: client.state,
                zip: client.zip,
                gstin: client.gstin
            } : prev.shippingDetails
        }));
    };

    const handleShippingChange = (field: string, value: string) => {
        setDraftInvoice(prev => ({
            ...prev,
            shippingDetails: { ...prev.shippingDetails, [field]: value }
        }));
    };

    const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
        const updatedItems = [...draftInvoice.items];
        const currentItem = { ...updatedItems[index] };
        
        if (field === 'id') {
            const selectedItem = company.items.find(i => i.id === value);
            if (selectedItem) {
                // Populate row with selected item details
                updatedItems[index] = { 
                    ...currentItem, 
                    ...selectedItem, 
                    id: selectedItem.id, // Ensure ID is linked
                    quantity: currentItem.quantity || 1 
                };
            } else {
                // Clear the row if "Select Item" is chosen (empty ID)
                updatedItems[index] = {
                    ...currentItem,
                    id: '', 
                    name: '', 
                    price: 0, 
                    gstRate: 18, 
                    hsn: '', 
                    unit: 'pcs'
                };
            }
        } else {
            // Real-time validation for quantity and price
            let validatedValue = value;
            if (field === 'quantity' || field === 'price' || field === 'gstRate') {
                if (value === '') {
                    validatedValue = ''; // Allow empty string while typing
                } else {
                    const numValue = parseFloat(value);
                    if (isNaN(numValue) || numValue < 0) {
                        validatedValue = 0;
                    } else {
                        validatedValue = numValue;
                    }
                }
            }
            
            updatedItems[index] = { ...currentItem, [field]: validatedValue };
            
            // If name is changed manually, unlink from the saved item
            if (field === 'name' && currentItem.id) {
                updatedItems[index].id = '';
            }
        }
        setDraftInvoice(prev => ({ ...prev, items: updatedItems }));
    };

    const handleRemoveItem = (index: number) => {
        const updatedItems = draftInvoice.items.filter((_, i) => i !== index);
        setDraftInvoice(prev => ({ ...prev, items: updatedItems }));
    };

    const handleAddItem = () => {
        setDraftInvoice(prev => ({
            ...prev, 
            items: [...prev.items, { id: '', name: '', hsn: '', price: 0, gstRate: 18, quantity: 1, unit: 'pcs', quantityInStock: 0 }]
        }));
    };

    const handleCreateNewClient = () => {
        if (!newClientData.name.trim()) {
            setClientError("Client name is required.");
            return;
        }
        const newClient: Client = {
            id: `client_${Date.now()}`,
            name: newClientData.name.trim(),
            phone: newClientData.phone.trim(),
            email: newClientData.email.trim(),
            gstin: newClientData.gstin.trim(),
            address: newClientData.address.trim(),
            city: newClientData.city.trim(),
            state: newClientData.state.trim(),
            zip: newClientData.zip.trim(),
            shippingAddress: newClientData.address.trim(),
            shippingCity: newClientData.city.trim(),
            shippingState: newClientData.state.trim(),
            shippingZip: newClientData.zip.trim(),
            tags: []
        };
        onUpdateCompany({ ...company, clients: [...company.clients, newClient] });
        handleClientChange(newClient.id);
        setIsCreateClientModalOpen(false);
        setNewClientData({ name: '', phone: '', email: '', gstin: '', address: '', city: '', state: '', zip: '' });
        setClientError(null);
        toast.success(`Client "${newClient.name}" created and selected!`);
    };

    const handleCreateNewItem = () => {
        if (!newItemData.name || !newItemData.name.trim()) {
            setItemModalError("Item name is required.");
            return;
        }
        const newItem: Item = {
            id: `item_${Date.now()}`,
            name: newItemData.name.trim(),
            price: Number(newItemData.price) || 0,
            gstRate: Number(newItemData.gstRate) || 0,
            unit: newItemData.unit || 'pcs',
            hsn: newItemData.hsn ? newItemData.hsn.trim() : '',
            quantityInStock: Number(newItemData.quantityInStock) || 0
        };
        onUpdateCompany({ ...company, items: [...company.items, newItem] });
        
        if (newItemIndex !== null) {
            const updatedItems = [...draftInvoice.items];
            const currentItem = { ...updatedItems[newItemIndex] };
            updatedItems[newItemIndex] = {
                ...currentItem,
                ...newItem,
                id: newItem.id,
                quantity: currentItem.quantity || 1
            };
            setDraftInvoice(prev => ({ ...prev, items: updatedItems }));
            
            const newTerms = [...itemSearchTerms];
            newTerms[newItemIndex] = newItem.name;
            setItemSearchTerms(newTerms);
            setNewItemIndex(null);
        } else {
            // Append as a new row to invoice items
            setDraftInvoice(prev => ({
                ...prev,
                items: [...prev.items, { ...newItem, id: newItem.id, quantity: 1 }]
            }));
            setItemSearchTerms(prev => [...prev, newItem.name]);
        }
        
        setIsCreateItemModalOpen(false);
        setNewItemData({ name: '', price: 0, gstRate: 18, unit: 'pcs', quantityInStock: 0, hsn: '' });
        setItemModalError(null);
        toast.success(`Item "${newItem.name}" saved to items catalog and added!`);
    };

    const calculateTotals = () => {
        let subTotal = 0, cgst = 0, sgst = 0, igst = 0;
        const client = company.clients.find(c => c.id === draftInvoice.clientId);
        
        const posState = !draftInvoice.isShippingSameAsBilling && draftInvoice.shippingDetails.state 
            ? draftInvoice.shippingDetails.state 
            : (client?.state || '');
            
        const companyState = company.details.state || '';
        const isIntraState = !posState || !companyState || posState.toLowerCase() === companyState.toLowerCase();

        draftInvoice.items.forEach(item => {
            const price = Number(item.price) || 0;
            const quantity = Number(item.quantity) || 0;
            const gstRate = Number(item.gstRate) || 0;
            const taxable = price * quantity;
            subTotal += taxable;
            const taxAmount = (taxable * gstRate) / 100;
            if (isIntraState) { 
                cgst += taxAmount / 2; 
                sgst += taxAmount / 2; 
            } else { 
                igst += taxAmount; 
            }
        });

        return { subTotal, cgst, sgst, igst, grandTotal: subTotal + cgst + sgst + igst };
    };

    const totals = calculateTotals();

    const handleSave = () => {
        // Strict Validation
        if (!draftInvoice.clientId) {
            alert("Please select a Client.");
            return;
        }
        if (draftInvoice.items.length === 0) {
            alert("Please add at least one item.");
            return;
        }
        
        // Validate incomplete items
        const invalidItem = draftInvoice.items.find(i => !i.name.trim() || Number(i.quantity) <= 0 || Number(i.price) < 0);
        if (invalidItem) {
            alert("One or more items have missing names, invalid quantity, or negative price.");
            return;
        }
        
        const client = company.clients.find(c => c.id === draftInvoice.clientId);
        if(!client) return;

        const shippingData = draftInvoice.isShippingSameAsBilling ? {
            name: client.name,
            address: client.address,
            city: client.city,
            state: client.state,
            zip: client.zip,
            gstin: client.gstin
        } : draftInvoice.shippingDetails;

        // Ensure numeric values are numbers
        const sanitizedItems = draftInvoice.items.map(item => ({
            ...item,
            quantity: Number(item.quantity) || 0,
            price: Number(item.price) || 0,
            gstRate: Number(item.gstRate) || 0,
        }));

        const commonData = {
            client: client,
            items: sanitizedItems,
            issueDate: draftInvoice.issueDate,
            dueDate: draftInvoice.dueDate,
            notes: draftInvoice.notes,
            subTotal: totals.subTotal,
            cgst: totals.cgst,
            sgst: totals.sgst,
            igst: totals.igst,
            grandTotal: totals.grandTotal,
            selectedBankAccountId: draftInvoice.selectedBankAccountId,
            shippingName: shippingData.name,
            shippingAddress: shippingData.address,
            shippingCity: shippingData.city,
            shippingState: shippingData.state,
            shippingZip: shippingData.zip,
            shippingGstin: shippingData.gstin,
            transporterName: draftInvoice.transporterId === 'self' ? 'Self' : company.transporters.find(t => t.id === draftInvoice.transporterId)?.name,
            vehicleNumber: draftInvoice.vehicleNumber,
            ewayBillNumber: draftInvoice.ewayBillNumber
        };

        if (mode === 'quote') {
            const quotation: Omit<Quotation, 'id' | 'status'> | Quotation = {
                ...commonData,
                quotationNumber: draftInvoice.invoiceNumber, // Used as Quote Number
                validUntil: draftInvoice.validUntil || draftInvoice.dueDate, // Default to due date logic if validUntil empty
                ...(isEditing && invoiceToEdit && 'quotationNumber' in invoiceToEdit ? { id: invoiceToEdit.id, status: (invoiceToEdit as Quotation).status } : {})
            };
            saveInvoice(quotation);
            setSavedInvoice(quotation as Quotation);
        } else {
            const finalInvoice: Omit<Invoice, 'id' | 'status'> | Invoice = {
                ...commonData,
                invoiceNumber: draftInvoice.invoiceNumber,
                ...(isEditing && invoiceToEdit && 'invoiceNumber' in invoiceToEdit ? { id: invoiceToEdit.id, status: (invoiceToEdit as Invoice).status } : {})
            };
            saveInvoice(finalInvoice);
            setSavedInvoice(finalInvoice as Invoice);
        }
        
        // Clear Draft Storage
        localStorage.removeItem(`invoice_draft_${company.id}`);
        setShowSuccessModal(true);
    };

    const handleShareWhatsApp = async () => {
        if (!savedInvoice) return;
        const num = (savedInvoice as any).invoiceNumber || (savedInvoice as any).quotationNumber;
        const type = mode === 'quote' ? 'Quotation' : 'Invoice';
        const text = `*${type} from ${company.details?.name || 'Company'}*\n\nHello ${savedInvoice.client?.name || 'Client'},\n\nHere are the details for *${type} ${num}*:\n\n*Total Amount:* Rs. ${savedInvoice.grandTotal.toFixed(2)}\n*Date:* ${savedInvoice.issueDate}\n\nPlease review attached details.\n\nThank you.`; 
        
        // If Web Share API is supported, try to share the PDF file
        if (navigator.share && navigator.canShare) {
            try {
                const { pdf } = await import('@react-pdf/renderer');
                // Dynamically import numberToWords from Invoices.tsx
                const { numberToWords } = await import('./Invoices');
                const blob = await pdf(<InvoicePDF invoice={savedInvoice} company={company} documentTitle={type} numberToWords={numberToWords} />).toBlob();
                const file = new File([blob], `${type}-${num}.pdf`, { type: 'application/pdf' });
                
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `${type} ${num}`,
                        text: text,
                    });
                    setActiveView(mode === 'quote' ? 'Quotations' : 'Invoices');
                    clearEditingInvoice();
                    return; // Successfully shared via native share sheet
                }
            } catch (error) {
                console.error("Error generating or sharing PDF:", error);
                // Fallthrough to wa.me fallback
            }
        }
        
        // Fallback to wa.me if file sharing is not supported or failed
        // We do this synchronously if navigator.share is missing to avoid popup blockers
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank'); 
        setActiveView(mode === 'quote' ? 'Quotations' : 'Invoices');
        clearEditingInvoice();
    };

    const handleFinish = () => {
        setActiveView(mode === 'quote' ? 'Quotations' : 'Invoices');
        clearEditingInvoice();
    };

    return (
        <div className="max-w-6xl mx-auto pb-20 animate-fade-in">
             <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                     <button onClick={() => { setActiveView(mode === 'quote' ? 'Quotations' : 'Invoices'); clearEditingInvoice(); }} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors">
                        <ArrowLeft className="w-6 h-6" strokeWidth={2} />
                     </button>
                     <h1 className="text-2xl font-bold text-slate-900 dark:text-light-text">
                         {isEditing ? `Edit ${mode === 'quote' ? 'Quotation' : 'Invoice'}` : `New ${mode === 'quote' ? 'Quotation' : 'Invoice'}`}
                     </h1>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => { setActiveView(mode === 'quote' ? 'Quotations' : 'Invoices'); clearEditingInvoice(); }}>Cancel</Button>
                    <Button variant="secondary" onClick={() => setShowLivePreview(true)} className="flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Live Preview
                    </Button>
                    <Button onClick={handleSave} className="shadow-lg shadow-accent/20">Save {mode === 'quote' ? 'Quotation' : 'Invoice'}</Button>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                 <div className="lg:col-span-2 space-y-6">
                     <div className="glass-panel p-6 rounded-2xl">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                 <div className="flex justify-between items-center mb-2">
                                     <label className="block text-xs font-bold text-slate-500 uppercase">Bill To</label>
                                     <button 
                                         type="button" 
                                         onClick={() => { setClientError(null); setIsCreateClientModalOpen(true); }}
                                         className="text-xs font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                                     >
                                         <UserPlus className="w-3.5 h-3.5" /> + Add Client
                                     </button>
                                 </div>
                                 <select 
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-accent focus:outline-none transition-shadow mb-4 cursor-pointer"
                                    value={draftInvoice.clientId}
                                    onChange={(e) => {
                                        if (e.target.value === '__NEW__') {
                                            setClientError(null);
                                            setIsCreateClientModalOpen(true);
                                        } else {
                                            handleClientChange(e.target.value);
                                        }
                                    }}
                                 >
                                     <option value="">Select Client</option>
                                     {company.clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                     <option value="__NEW__" className="text-accent font-bold bg-accent/5">+ Create New Client...</option>
                                 </select>
                                 
                                 <div className="grid grid-cols-2 gap-4">
                                     <Input label={mode === 'quote' ? "Quotation #" : "Invoice #"} value={draftInvoice.invoiceNumber} onChange={e => setDraftInvoice({...draftInvoice, invoiceNumber: e.target.value})} />
                                     <Input label="Issue Date" type="date" value={draftInvoice.issueDate} onChange={e => setDraftInvoice({...draftInvoice, issueDate: e.target.value})} />
                                 </div>
                             </div>

                             <div className="border-l border-slate-100 dark:border-slate-700 pl-0 md:pl-6 pt-6 md:pt-0 border-t md:border-t-0">
                                 <div className="flex justify-between items-center mb-2">
                                     <label className="block text-xs font-bold text-slate-500 uppercase">Ship To</label>
                                     <div className="flex items-center gap-2">
                                         <input 
                                            type="checkbox" 
                                            id="sameAsBilling"
                                            className="rounded text-accent focus:ring-accent"
                                            checked={draftInvoice.isShippingSameAsBilling}
                                            onChange={(e) => setDraftInvoice(prev => ({ ...prev, isShippingSameAsBilling: e.target.checked }))}
                                         />
                                         <label htmlFor="sameAsBilling" className="text-xs text-slate-500 cursor-pointer">Same as Billing</label>
                                     </div>
                                 </div>

                                 {draftInvoice.isShippingSameAsBilling ? (
                                     <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm text-slate-500 dark:text-slate-400 italic text-center h-[120px] flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-700">
                                         Shipping address same as billing.
                                     </div>
                                 ) : (
                                     <div className="space-y-3 animate-fade-in">
                                         <Input label="Shipping Name" value={draftInvoice.shippingDetails.name} onChange={e => handleShippingChange('name', e.target.value)} className="!py-2 !text-xs" />
                                         <Input label="Address" value={draftInvoice.shippingDetails.address} onChange={e => handleShippingChange('address', e.target.value)} className="!py-2 !text-xs" />
                                         <div className="grid grid-cols-2 gap-2">
                                             <Input label="City" value={draftInvoice.shippingDetails.city} onChange={e => handleShippingChange('city', e.target.value)} className="!py-2 !text-xs" />
                                             <Input label="Zip" value={draftInvoice.shippingDetails.zip} onChange={e => handleShippingChange('zip', e.target.value)} className="!py-2 !text-xs" />
                                         </div>
                                         <div className="grid grid-cols-2 gap-2">
                                             <div>
                                                 <select 
                                                    value={draftInvoice.shippingDetails.state} 
                                                    onChange={e => handleShippingChange('state', e.target.value)}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-accent"
                                                 >
                                                     <option value="">State</option>
                                                     {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                                 </select>
                                             </div>
                                             <Input label="GSTIN" value={draftInvoice.shippingDetails.gstin} onChange={e => handleShippingChange('gstin', e.target.value)} className="!py-2 !text-xs" />
                                         </div>
                                     </div>
                                 )}
                             </div>
                         </div>
                     </div>
                 </div>

                 <div className="lg:col-span-1 space-y-6">
                     <div className="glass-panel p-6 rounded-2xl">
                         <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Payment & Transport</h4>
                         <div className="space-y-4">
                            <Input 
                                label={mode === 'quote' ? "Valid Until" : "Due Date"} 
                                type="date" 
                                value={mode === 'quote' ? (draftInvoice.validUntil || draftInvoice.dueDate) : draftInvoice.dueDate} 
                                onChange={e => setDraftInvoice({...draftInvoice, [mode === 'quote' ? 'validUntil' : 'dueDate']: e.target.value})} 
                            />
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Bank Account</label>
                                <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm" value={draftInvoice.selectedBankAccountId || ''} onChange={e => setDraftInvoice({...draftInvoice, selectedBankAccountId: e.target.value})}>
                                    <option value="">None (Cash/Cheque)</option>
                                    {company.bankAccounts.map(b => <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Transporter</label>
                                <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm" value={draftInvoice.transporterId} onChange={e => setDraftInvoice({...draftInvoice, transporterId: e.target.value})}>
                                    <option value="self">Self (Own Vehicle)</option>
                                    {company.transporters.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Input label="Vehicle No." value={draftInvoice.vehicleNumber} onChange={e => setDraftInvoice({...draftInvoice, vehicleNumber: e.target.value})} placeholder="MH01AB1234" />
                                <Input label="E-Way Bill" value={draftInvoice.ewayBillNumber} onChange={e => setDraftInvoice({...draftInvoice, ewayBillNumber: e.target.value})} placeholder="Optional" />
                            </div>
                         </div>
                     </div>
                 </div>
             </div>

             <div className="glass-panel p-6 rounded-2xl mb-6">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Items</h3>
                    <Button variant="secondary" onClick={() => setIsCreateItemModalOpen(true)} className="text-xs">+ New Item</Button>
                 </div>
                 
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 uppercase font-semibold">
                            <tr>
                                <th className="px-4 py-3 min-w-[200px]">Item Description</th>
                                <th className="px-4 py-3 w-24 text-center">Qty</th>
                                <th className="px-4 py-3 w-24 text-center">Unit</th>
                                <th className="px-4 py-3 w-32 text-right">Price</th>
                                <th className="px-4 py-3 w-20 text-center">GST%</th>
                                <th className="px-4 py-3 w-32 text-right">Amount</th>
                                <th className="px-4 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {draftInvoice.items.map((item, index) => (
                                <tr key={index} className="group hover:bg-slate-50 dark:hover:bg-slate-800/20">
                                    <td className="p-3 relative">
                                        <div className="flex items-center gap-2">
                                            <Dropdown
                                                trigger={
                                                    <input
                                                        type="text"
                                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-accent focus:outline-none placeholder-slate-400 text-slate-900 dark:text-white"
                                                        placeholder="Search or select item..."
                                                        value={activeDropdownIndex === index ? (itemSearchTerms[index] ?? '') : (item.name || '')}
                                                        onChange={(e) => {
                                                            const newTerms = [...itemSearchTerms];
                                                            newTerms[index] = e.target.value;
                                                            setItemSearchTerms(newTerms);
                                                            setActiveDropdownIndex(index);
                                                            if (!e.target.value) {
                                                                handleItemChange(index, 'id', ''); // This clears the row
                                                            } else {
                                                                handleItemChange(index, 'name', e.target.value);
                                                            }
                                                        }}
                                                        onFocus={() => setActiveDropdownIndex(index)}
                                                    />
                                                }
                                                isOpen={activeDropdownIndex === index}
                                                onOpen={() => setActiveDropdownIndex(index)}
                                                onClose={() => setActiveDropdownIndex(null)}
                                                matchWidth={true}
                                                toggleOnClick={false}
                                                triggerClassName="flex-1"
                                                className="max-h-60 overflow-y-auto"
                                            >
                                                <div className="flex flex-col">
                                                    {company.items.filter(i => i.name.toLowerCase().includes((itemSearchTerms[index] || '').toLowerCase())).length > 0 ? (
                                                        company.items.filter(i => i.name.toLowerCase().includes((itemSearchTerms[index] || '').toLowerCase())).map(i => (
                                                            <div 
                                                                key={i.id} 
                                                                className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-sm text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 last:border-0"
                                                                onClick={() => {
                                                                    handleItemChange(index, 'id', i.id);
                                                                    setActiveDropdownIndex(null);
                                                                    const newTerms = [...itemSearchTerms];
                                                                    newTerms[index] = i.name;
                                                                    setItemSearchTerms(newTerms);
                                                                }}
                                                            >
                                                                <div className="font-medium">{i.name}</div>
                                                                <div className="text-[10px]">
                                                                    {i.quantityInStock < 0 ? (
                                                                        <span className="text-red-600 dark:text-red-400 font-bold">₹{i.price} | Stock: {i.quantityInStock} (Negative - Out of stock)</span>
                                                                    ) : i.quantityInStock === 0 ? (
                                                                        <span className="text-red-600 dark:text-red-400 font-bold">₹{i.price} | Stock: 0 (Out of stock)</span>
                                                                    ) : i.quantityInStock <= 5 ? (
                                                                        <span className="text-amber-600 dark:text-amber-400 font-semibold">₹{i.price} | Stock: {i.quantityInStock} (Low on item)</span>
                                                                    ) : (
                                                                        <span className="text-slate-400">₹{i.price} | Stock: {i.quantityInStock}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="px-4 py-3 text-sm text-slate-500 text-center">
                                                            No matching items found.
                                                        </div>
                                                    )}
                                                    
                                                    {/* Persistent + Create New Item action button */}
                                                    <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 sticky bottom-0">
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setNewItemData({ name: itemSearchTerms[index] || '', price: 0, gstRate: 18, unit: 'pcs', quantityInStock: 0, hsn: '' });
                                                                setNewItemIndex(index);
                                                                setIsCreateItemModalOpen(true);
                                                                setActiveDropdownIndex(null);
                                                            }}
                                                            className="w-full text-left text-xs font-bold text-accent hover:underline flex items-center gap-1.5 py-1 px-1 cursor-pointer"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" /> + Create New Item {itemSearchTerms[index] ? `"${itemSearchTerms[index]}"` : ''}
                                                        </button>
                                                    </div>
                                                </div>
                                            </Dropdown>
                                            {item.id && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        const fullItem = company.items.find(i => i.id === item.id);
                                                        if (fullItem) setViewItemDetails(fullItem);
                                                    }}
                                                    className="text-slate-400 hover:text-accent transition-colors"
                                                    title="View Item Details"
                                                >
                                                    <Info className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="mt-1">
                                            {item.id && (() => {
                                                const fullItem = company.items.find(ci => ci.id === item.id) || item;
                                                const stock = typeof fullItem.quantityInStock === 'number' ? fullItem.quantityInStock : (item as any).quantityInStock ?? 0;
                                                if (stock < 0) {
                                                    return (
                                                        <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-200 dark:border-red-800 w-fit mt-1">
                                                            <span>⚠️ Out of stock ({stock} in inventory)! Please update item in Items section</span>
                                                        </div>
                                                    );
                                                }
                                                if (stock === 0) {
                                                    return (
                                                        <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-200 dark:border-red-800 w-fit mt-1">
                                                            <span>⚠️ No item available (0 in stock)! Please update item in Items section</span>
                                                        </div>
                                                    );
                                                }
                                                if (stock <= 5) {
                                                    return (
                                                        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 w-fit mt-1">
                                                            <span>⚠️ Low on item: only {stock} left in stock</span>
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div className="text-[10px] text-slate-400">HSN: {item.hsn || 'N/A'} | Stock: {stock}</div>
                                                );
                                            })()}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <input type="number" min="0" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 text-center focus:ring-1 focus:ring-accent focus:outline-none" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} />
                                    </td>
                                    <td className="p-3">
                                        <select className="w-full bg-transparent border-b border-transparent focus:border-accent focus:outline-none py-1 text-center" value={item.unit} onChange={e => handleItemChange(index, 'unit', e.target.value)}>
                                            {ITEM_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-3">
                                        <input type="number" min="0" className="w-full bg-transparent border-b border-transparent focus:border-accent focus:outline-none py-1 text-right" value={item.price} onChange={e => handleItemChange(index, 'price', e.target.value)} />
                                    </td>
                                    <td className="p-3">
                                        <input type="number" min="0" className="w-full bg-transparent border-b border-transparent focus:border-accent focus:outline-none py-1 text-center" value={item.gstRate} onChange={e => handleItemChange(index, 'gstRate', e.target.value)} />
                                    </td>
                                    <td className="p-3 text-right font-medium text-slate-900 dark:text-white">
                                        ₹{((Number(item.price) || 0) * (Number(item.quantity) || 0)).toFixed(2)}
                                    </td>
                                    <td className="p-3 text-center">
                                        <button onClick={() => handleRemoveItem(index)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 className="w-5 h-5" strokeWidth={2} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
                 <button onClick={handleAddItem} className="w-full py-3 text-center text-sm font-bold text-accent hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-t border-slate-100 dark:border-slate-800 mt-2">
                     + Add Another Item
                 </button>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="space-y-4">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Notes / Terms & Conditions</label>
                    <textarea className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-accent focus:border-accent outline-none" placeholder="e.g. Payment due within 15 days" rows={4} value={draftInvoice.notes} onChange={e => setDraftInvoice({...draftInvoice, notes: e.target.value})} />
                 </div>

                 <div className="glass-panel p-6 rounded-2xl h-fit">
                     <h4 className="text-sm font-bold text-slate-500 uppercase mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">Amount Due</h4>
                     <div className="space-y-3 text-sm">
                         <div className="flex justify-between text-slate-600 dark:text-slate-400">
                             <span>Subtotal</span>
                             <span>₹{totals.subTotal.toFixed(2)}</span>
                         </div>
                         {(totals.cgst > 0 || totals.sgst > 0) && (
                             <>
                                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                    <span>CGST</span>
                                    <span>₹{totals.cgst.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                    <span>SGST</span>
                                    <span>₹{totals.sgst.toFixed(2)}</span>
                                </div>
                             </>
                         )}
                         {totals.igst > 0 && (
                             <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                 <span>IGST</span>
                                 <span>₹{totals.igst.toFixed(2)}</span>
                             </div>
                         )}
                         <div className="border-t border-slate-100 dark:border-slate-800 my-3 pt-3 flex justify-between items-center">
                             <span className="text-lg font-bold text-slate-900 dark:text-white">Grand Total</span>
                             <span className="text-2xl font-black text-accent">₹{totals.grandTotal.toFixed(2)}</span>
                         </div>
                     </div>
                 </div>
             </div>

             <Modal isOpen={isCreateItemModalOpen} onClose={() => { setIsCreateItemModalOpen(false); setItemModalError(null); }} title="Create New Item" size="md">
                 <div className="p-6 space-y-4">
                     {itemModalError && (
                         <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 font-medium">
                             {itemModalError}
                         </div>
                     )}
                     
                     <Input 
                         label="Item / Product Name *" 
                         placeholder="e.g. Wireless Keyboard or Web Development Service" 
                         value={newItemData.name || ''} 
                         onChange={e => setNewItemData({...newItemData, name: e.target.value})} 
                         required 
                         autoFocus 
                     />

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <Input 
                             label="HSN / SAC Code" 
                             placeholder="e.g. 84713010 or 998314" 
                             value={newItemData.hsn || ''} 
                             onChange={e => setNewItemData({...newItemData, hsn: e.target.value})} 
                         />
                         <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">Unit</label>
                             <select 
                                 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-accent focus:border-accent outline-none"
                                 value={newItemData.unit || 'pcs'}
                                 onChange={e => setNewItemData({...newItemData, unit: e.target.value})}
                             >
                                 {ITEM_UNITS.map(u => (
                                     <option key={u} value={u}>{u}</option>
                                 ))}
                             </select>
                         </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <Input 
                             label="Selling Price (₹) *" 
                             type="number" 
                             min="0" 
                             step="0.01" 
                             value={newItemData.price ?? 0} 
                             onChange={e => setNewItemData({...newItemData, price: parseFloat(e.target.value) || 0})} 
                             required 
                         />
                         <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">GST Rate (%)</label>
                             <select 
                                 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-accent focus:border-accent outline-none"
                                 value={newItemData.gstRate ?? 18}
                                 onChange={e => setNewItemData({...newItemData, gstRate: parseFloat(e.target.value) || 0})}
                             >
                                 {[0, 5, 12, 18, 28].map(rate => (
                                     <option key={rate} value={rate}>{rate}%</option>
                                 ))}
                             </select>
                         </div>
                     </div>

                     <div>
                         <Input 
                             label="Opening / Initial Stock Quantity" 
                             type="number" 
                             min="0" 
                             value={newItemData.quantityInStock ?? 0} 
                             onChange={e => setNewItemData({...newItemData, quantityInStock: parseFloat(e.target.value) || 0})} 
                         />
                         <p className="text-xs text-slate-400 mt-1">
                             Stock will be tracked automatically in Inventory. Items reaching 0 or negative stock display warning alerts.
                         </p>
                     </div>
                 </div>
                 <div className="p-6 pt-0 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                     <Button variant="secondary" onClick={() => { setIsCreateItemModalOpen(false); setItemModalError(null); }}>
                         Cancel
                     </Button>
                     <Button onClick={handleCreateNewItem}>
                         Save & Add Item
                     </Button>
                 </div>
             </Modal>

             {/* Inline Create Client Modal */}
             <Modal isOpen={isCreateClientModalOpen} onClose={() => { setIsCreateClientModalOpen(false); setClientError(null); }} title="Add New Client" size="lg">
                 <div className="p-6 space-y-4">
                     {clientError && (
                         <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 font-medium">
                             {clientError}
                         </div>
                     )}
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Input 
                             label="Client / Business Name *" 
                             placeholder="e.g. Acme Corp or John Doe" 
                             value={newClientData.name} 
                             onChange={e => setNewClientData({...newClientData, name: e.target.value})} 
                             required 
                             autoFocus 
                         />
                         <Input 
                             label="GSTIN (Optional)" 
                             placeholder="e.g. 29ABCDE1234F1Z5" 
                             value={newClientData.gstin} 
                             onChange={e => setNewClientData({...newClientData, gstin: e.target.value.toUpperCase()})} 
                         />
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Input 
                             label="Phone Number" 
                             placeholder="e.g. 9876543210" 
                             value={newClientData.phone} 
                             onChange={e => setNewClientData({...newClientData, phone: e.target.value})} 
                         />
                         <Input 
                             label="Email Address" 
                             type="email" 
                             placeholder="e.g. billing@acme.com" 
                             value={newClientData.email} 
                             onChange={e => setNewClientData({...newClientData, email: e.target.value})} 
                         />
                     </div>

                     <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Billing Street Address</label>
                         <textarea 
                             className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm focus:ring-accent focus:border-accent outline-none" 
                             placeholder="Street address, building, suite..." 
                             rows={2} 
                             value={newClientData.address} 
                             onChange={e => setNewClientData({...newClientData, address: e.target.value})} 
                         />
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         <Input 
                             label="City" 
                             placeholder="e.g. Mumbai" 
                             value={newClientData.city} 
                             onChange={e => setNewClientData({...newClientData, city: e.target.value})} 
                         />
                         <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">State</label>
                             <select 
                                 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-accent focus:border-accent outline-none"
                                 value={newClientData.state}
                                 onChange={e => setNewClientData({...newClientData, state: e.target.value})}
                             >
                                 <option value="">Select State</option>
                                 {INDIAN_STATES.map(s => (
                                     <option key={s} value={s}>{s}</option>
                                 ))}
                             </select>
                         </div>
                         <Input 
                             label="PIN Code" 
                             placeholder="e.g. 400001" 
                             value={newClientData.zip} 
                             onChange={e => setNewClientData({...newClientData, zip: e.target.value})} 
                         />
                     </div>
                 </div>
                 <div className="p-6 pt-0 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                     <Button variant="secondary" onClick={() => { setIsCreateClientModalOpen(false); setClientError(null); }}>
                         Cancel
                     </Button>
                     <Button onClick={handleCreateNewClient}>
                         Save & Select Client
                     </Button>
                 </div>
             </Modal>

             {/* Item Details Modal */}
             <Modal isOpen={!!viewItemDetails} onClose={() => setViewItemDetails(null)} title="Item Details">
                 {viewItemDetails && (
                     <div className="p-6 space-y-4">
                         <div>
                             <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                             <div className="text-sm font-medium text-slate-900 dark:text-white">{viewItemDetails.name}</div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 mb-1">Price</label>
                                 <div className="text-sm font-medium text-slate-900 dark:text-white">₹{viewItemDetails.price}</div>
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 mb-1">GST Rate</label>
                                 <div className="text-sm font-medium text-slate-900 dark:text-white">{viewItemDetails.gstRate}%</div>
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 mb-1">Unit</label>
                                 <div className="text-sm font-medium text-slate-900 dark:text-white">{viewItemDetails.unit}</div>
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 mb-1">Stock</label>
                                 <div className="text-sm font-medium text-slate-900 dark:text-white">{viewItemDetails.quantityInStock}</div>
                             </div>
                             {viewItemDetails.hsn && (
                                 <div>
                                     <label className="block text-xs font-bold text-slate-500 mb-1">HSN</label>
                                     <div className="text-sm font-medium text-slate-900 dark:text-white">{viewItemDetails.hsn}</div>
                                 </div>
                             )}
                         </div>
                     </div>
                 )}
                 <div className="p-6 pt-0 flex justify-end">
                     <Button onClick={() => setViewItemDetails(null)}>Close</Button>
                 </div>
             </Modal>

             {/* Live Preview Modal */}
             <Modal isOpen={showLivePreview} onClose={() => setShowLivePreview(false)} title="Live PDF Preview" size="xl">
                 <div className="h-[600px] p-4 bg-slate-100 dark:bg-slate-900 flex flex-col gap-4">
                     <div className="flex-grow w-full h-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                         <PDFViewer width="100%" height="100%" style={{ border: 'none' }} showToolbar={true}>
                             <InvoicePDF 
                                 invoice={{
                                     id: 'draft',
                                     invoiceNumber: draftInvoice.invoiceNumber,
                                     client: company.clients.find(c => c.id === draftInvoice.clientId) || {
                                         id: 'temp',
                                         name: 'Client Name Placeholder',
                                         gstin: '',
                                         email: '',
                                         phone: '',
                                         address: '123 Client St',
                                         city: 'City',
                                         state: 'State',
                                         zip: '123456'
                                     },
                                     items: draftInvoice.items.map(item => ({
                                         ...item,
                                         quantity: item.quantity
                                     })),
                                     issueDate: draftInvoice.issueDate,
                                     dueDate: draftInvoice.dueDate,
                                     notes: draftInvoice.notes,
                                     subTotal: totals.subTotal,
                                     cgst: totals.cgst,
                                     sgst: totals.sgst,
                                     igst: totals.igst,
                                     grandTotal: totals.grandTotal,
                                     status: 'Unpaid',
                                     selectedBankAccountId: draftInvoice.selectedBankAccountId,
                                     shippingName: draftInvoice.isShippingSameAsBilling ? undefined : draftInvoice.shippingDetails.name,
                                     shippingAddress: draftInvoice.isShippingSameAsBilling ? undefined : draftInvoice.shippingDetails.address,
                                     shippingCity: draftInvoice.isShippingSameAsBilling ? undefined : draftInvoice.shippingDetails.city,
                                     shippingState: draftInvoice.isShippingSameAsBilling ? undefined : draftInvoice.shippingDetails.state,
                                     shippingZip: draftInvoice.isShippingSameAsBilling ? undefined : draftInvoice.shippingDetails.zip
                                 }} 
                                 company={company} 
                                 documentTitle={mode === 'quote' ? 'Quotation' : 'Invoice'} 
                                 numberToWords={numberToWords} 
                             />
                         </PDFViewer>
                     </div>
                     <div className="flex justify-end gap-3 shrink-0">
                         <Button onClick={() => setShowLivePreview(false)}>Close Preview</Button>
                     </div>
                 </div>
             </Modal>

             {/* Success Modal */}
             <Modal isOpen={showSuccessModal} onClose={handleFinish} title="Invoice Saved!">
                <div className="p-6">
                    <div className="flex flex-col items-center justify-center mb-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-scale-in">
                            <Check className="w-8 h-8 text-green-600" strokeWidth={3} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Success!</h3>
                        <p className="text-slate-500 text-center text-sm mt-1">{mode === 'quote' ? 'Quotation' : 'Invoice'} #{savedInvoice && ('invoiceNumber' in savedInvoice ? savedInvoice.invoiceNumber : savedInvoice.quotationNumber)} has been created.</p>
                    </div>

                    {/* WhatsApp Preview Card */}
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">WhatsApp Message Preview</p>
                        <div className="bg-[#DCF8C6] dark:bg-[#056162] text-slate-900 dark:text-white p-3 rounded-lg rounded-tl-none shadow-sm text-sm relative">
                            <p className="font-bold">{mode === 'quote' ? 'Quotation' : 'Invoice'} from {company.details?.name || 'Company'}</p>
                            <p className="mt-1">Hello {savedInvoice?.client?.name || 'Client'},</p>
                            <p className="mt-1">Here are the details for {mode === 'quote' ? 'Quotation' : 'Invoice'} <strong>#{savedInvoice && ('invoiceNumber' in savedInvoice ? savedInvoice.invoiceNumber : savedInvoice.quotationNumber)}</strong>:</p>
                            <p className="mt-2 font-mono">Total Amount: ₹{savedInvoice?.grandTotal.toFixed(2)}</p>
                            <p className="mt-1">Date: {savedInvoice?.issueDate}</p>
                            <p className="mt-2 text-xs opacity-70">10:42 AM</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                            onClick={handleShareWhatsApp}
                            className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-green-500/20"
                        >
                            <WhatsAppIcon /> Send on WhatsApp
                        </button>
                        
                        <div className="flex flex-1 gap-3">
                            <Button variant="secondary" className="flex-1" onClick={() => { setActiveView('Invoices'); setShowSuccessModal(false); }}>
                                Print / View
                            </Button>
                            <Button variant="secondary" onClick={handleFinish}>
                                Done
                            </Button>
                        </div>
                    </div>
                </div>
             </Modal>
        </div>
    );
};

export default NewInvoice;
