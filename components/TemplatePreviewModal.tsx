import React, { useState } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { InvoicePDF } from './InvoicePDF';
import Modal from './common/Modal';
import type { CompanyDetails, Invoice, Company } from '../types';
import Button from './common/Button';

// Mock data for the invoice preview
const mockInvoice: Invoice = {
  id: 'mock-1',
  invoiceNumber: 'INV-001',
  issueDate: '2023-10-15',
  dueDate: '2023-11-14',
  client: {
    id: 'c1',
    name: 'Acme Corporation',
    email: 'billing@acme.com',
    phone: '555-0198',
    address: '123 Business Rd, Suite 100',
    city: 'Mumbai',
    state: 'Maharashtra',
    zip: '400001',
    gstin: '27AADCA1234DZ1'
  },
  items: [
    { id: 'i1', name: 'Web Design Services', quantity: 1, price: 15000, hsn: '9983', unit: 'Project', gstRate: 18, quantityInStock: null },
    { id: 'i2', name: 'Hosting & Maintenance (1 Yr)', quantity: 1, price: 5000, hsn: '9983', unit: 'Year', gstRate: 18, quantityInStock: null },
    { id: 'i3', name: 'SEO Optimization', quantity: 10, price: 1000, hsn: '9983', unit: 'Hours', gstRate: 18, quantityInStock: null }
  ],
  subTotal: 30000,
  cgst: 2700,
  sgst: 2700,
  igst: 0,
  grandTotal: 35400,
  notes: 'Thank you for your business!',
  status: 'Unpaid',
  selectedBankAccountId: 'b1'
};

const mockCompany: Company = {
  id: 'company-1',
  ownerId: 'user-1',
  details: {
    name: 'Your Company Name',
    address: '456 Tech Park, Ring Road',
    city: 'Bangalore',
    state: 'Karnataka',
    zip: '560001',
    phone: '9876543210',
    email: 'hello@yourcompany.com',
    gstin: '29ABCDE1234FZ1',
    pan: 'ABCDE1234F',
    logo: '',
    udyam: '',
    invoicePrefix: 'INV-',
    nextInvoiceNumber: 2,
    invoiceTemplate: 'modern',
    website: 'www.yourcompany.com'
  },
  bankAccounts: [
    {
      id: 'b1',
      bankName: 'HDFC Bank',
      accountNumber: '50100123456789',
      ifsc: 'HDFC0001234',
      isDefault: true
    }
  ],
  clients: [],
  items: [],
  transporters: [],
  invoices: [],
  quotations: [],
  recurringInvoices: [],
  stockHistory: []
};

const numberToWordsMock = (num: number) => "Thirty Five Thousand Four Hundred Only";

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: string | null;
  onSelectTemplate: (template: string, config: {
    brandColor: string;
    showShipping: boolean;
    showHsn: boolean;
    showDiscount: boolean;
    showTerms: boolean;
    showQr: boolean;
    logoPosition: 'Left' | 'Right';
    fontFamily: 'Helvetica' | 'Courier' | 'Times-Roman';
    tablePadding: 'Compact' | 'Normal' | 'Spacious';
    accentStyle: 'None' | 'Line' | 'Frame';
  }) => void;
  isPremium: boolean;
}

const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({ 
    isOpen, onClose, template, onSelectTemplate, isPremium 
}) => {
  if (!isOpen || !template) return null;

  const [brandColor, setBrandColor] = useState('#4F46E5');
  const [showShipping, setShowShipping] = useState(true);
  const [showHsn, setShowHsn] = useState(true);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showTerms, setShowTerms] = useState(true);
  const [showQr, setShowQr] = useState(false);
  const [logoPosition, setLogoPosition] = useState<'Left' | 'Right'>('Left');
  const [fontFamily, setFontFamily] = useState<'Helvetica' | 'Courier' | 'Times-Roman'>('Helvetica');
  const [tablePadding, setTablePadding] = useState<'Compact' | 'Normal' | 'Spacious'>('Normal');
  const [accentStyle, setAccentStyle] = useState<'None' | 'Line' | 'Frame'>('Line');

  // Map the UI template name format to the internal InvoicePDF template name format
  // Also we need to make sure Company.details.invoiceTemplate is updated in memory to render the correct preview
  const previewCompany = { 
      ...mockCompany, 
      details: { 
          ...mockCompany.details, 
          // Our visual template names vs actual: 'modern', 'classic' -> 'traditional', 'minimal' -> 'premium'
          invoiceTemplate: template === 'classic' ? 'traditional' : template === 'minimal' ? 'premium' : template === 'tally' ? 'tally' : 'modern',
          brandColor: brandColor,
          showShipping: showShipping,
          showHsn: showHsn,
          showDiscount: showDiscount,
          showTerms: showTerms,
          showQr: showQr,
          logoPosition: logoPosition,
          fontFamily: fontFamily,
          tablePadding: tablePadding,
          accentStyle: accentStyle
      },
      // Trick it into rendering premium features for minimal preview
      subscription: { plan: 'premium', status: 'active', currentPeriodEnd: '' } as any
  };

  const isCustom = template === 'custom';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${template.charAt(0).toUpperCase() + template.slice(1)} Template Builder`} size="xl">
        <div className="bg-slate-100 dark:bg-slate-900 h-[600px] w-full relative flex flex-col">
            {!isCustom ? (
                <div className="flex-grow w-full h-full p-4 overflow-hidden">
                    <PDFViewer width="100%" height="100%" style={{ border: 'none', borderRadius: '16px' }} showToolbar={false}>
                        <InvoicePDF 
                            invoice={mockInvoice} 
                            company={previewCompany} 
                            numberToWords={numberToWordsMock} 
                        />
                    </PDFViewer>
                </div>
            ) : (
                <div className="flex-1 w-full h-full flex overflow-hidden bg-white dark:bg-slate-950">
                    
                    {/* Interactive Sidebar controls */}
                    <div className="w-72 border-r border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 p-6 overflow-y-auto flex flex-col gap-6">
                        <div>
                            <h4 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-3 font-display">Logo & Branding</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/20 shadow-sm">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Position</span>
                                    <select 
                                        value={logoPosition} 
                                        onChange={(e) => setLogoPosition(e.target.value as any)}
                                        className="text-xs font-bold bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg border-none focus:outline-none cursor-pointer"
                                    >
                                        <option value="Left">Left</option>
                                        <option value="Right">Right</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/20 shadow-sm">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Brand Accent</span>
                                    <div className="w-4 h-4 rounded-full shadow-inner border border-white" style={{ backgroundColor: brandColor }}></div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-3 font-display">Custom Typography & Layout</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/20 shadow-sm">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Font Family</span>
                                    <select 
                                        value={fontFamily} 
                                        onChange={(e) => setFontFamily(e.target.value as any)}
                                        className="text-xs font-bold bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg border-none focus:outline-none cursor-pointer"
                                    >
                                        <option value="Helvetica">Helvetica (Sans)</option>
                                        <option value="Courier">Courier (Mono)</option>
                                        <option value="Times-Roman">Times (Serif)</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/20 shadow-sm">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Cell Padding</span>
                                    <select 
                                        value={tablePadding} 
                                        onChange={(e) => setTablePadding(e.target.value as any)}
                                        className="text-xs font-bold bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg border-none focus:outline-none cursor-pointer"
                                    >
                                        <option value="Compact">Compact</option>
                                        <option value="Normal">Normal</option>
                                        <option value="Spacious">Spacious</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/20 shadow-sm">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Accent Style</span>
                                    <select 
                                        value={accentStyle} 
                                        onChange={(e) => setAccentStyle(e.target.value as any)}
                                        className="text-xs font-bold bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg border-none focus:outline-none cursor-pointer"
                                    >
                                        <option value="None">None</option>
                                        <option value="Line">Bottom Divider</option>
                                        <option value="Frame">Solid Box Frame</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mb-3 font-display">Custom Layout Fields</h4>
                            <div className="space-y-3.5">
                                <label className="flex items-center gap-3 cursor-pointer select-none group">
                                    <input type="checkbox" checked={showShipping} onChange={(e) => setShowShipping(e.target.checked)} className="rounded border-slate-300 text-accent focus:ring-accent w-4.5 h-4.5 transition-all" />
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 group-hover:dark:text-white transition-colors">Shipping Info block</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer select-none group">
                                    <input type="checkbox" checked={showHsn} onChange={(e) => setShowHsn(e.target.checked)} className="rounded border-slate-300 text-accent focus:ring-accent w-4.5 h-4.5 transition-all" />
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 group-hover:dark:text-white transition-colors">HSN/SAC Column</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer select-none group">
                                    <input type="checkbox" checked={showDiscount} onChange={(e) => setShowDiscount(e.target.checked)} className="rounded border-slate-300 text-accent focus:ring-accent w-4.5 h-4.5 transition-all" />
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 group-hover:dark:text-white transition-colors">Discount Column</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer select-none group">
                                    <input type="checkbox" checked={showTerms} onChange={(e) => setShowTerms(e.target.checked)} className="rounded border-slate-300 text-accent focus:ring-accent w-4.5 h-4.5 transition-all" />
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 group-hover:dark:text-white transition-colors">Terms & Conditions</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer select-none group">
                                    <input type="checkbox" checked={showQr} onChange={(e) => setShowQr(e.target.checked)} className="rounded border-slate-300 text-accent focus:ring-accent w-4.5 h-4.5 transition-all" />
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 group-hover:dark:text-white transition-colors">Pay QR Code</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    {/* Live Preview Canvas */}
                    <div className="flex-1 bg-slate-100 dark:bg-slate-900 p-6 overflow-y-auto flex flex-col justify-between">
                        <div className="h-10 flex items-center justify-between px-2 mb-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/40 dark:border-slate-700/20 shadow-sm shrink-0 animate-fade-in">
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest px-2">Interactive Custom Preview</span>
                            <div className="flex gap-2">
                                {[
                                    { color: '#4F46E5', label: 'Indigo' },
                                    { color: '#10B981', label: 'Green' },
                                    { color: '#F59E0B', label: 'Amber' },
                                    { color: '#EF4444', label: 'Red' }
                                ].map((cfg) => (
                                    <button
                                        key={cfg.color}
                                        onClick={() => setBrandColor(cfg.color)}
                                        className={`w-5 h-5 rounded-full transition-all hover:scale-110 active:scale-95 border border-white/20 ${brandColor === cfg.color ? 'ring-2 ring-offset-1 ring-slate-400 scale-105 shadow-sm' : ''}`}
                                        style={{ backgroundColor: cfg.color }}
                                        title={cfg.label}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex-grow flex items-center justify-center p-4">
                            <div 
                                className="w-full max-w-xl bg-white dark:bg-slate-950 shadow-2xl rounded-2xl p-8 min-h-[420px] transition-all"
                                style={{ 
                                    fontFamily: fontFamily === 'Courier' ? 'monospace' : fontFamily === 'Times-Roman' ? 'serif' : 'sans-serif',
                                    border: accentStyle === 'Frame' ? `3px solid ${brandColor}` : '1px solid rgba(148, 163, 184, 0.15)'
                                }}
                            >
                                <div className="space-y-6">
                                    {/* Header block with Logo position toggling */}
                                    <div 
                                        className={`flex ${logoPosition === 'Left' ? 'flex-row' : 'flex-row-reverse'} justify-between items-center pb-4`}
                                        style={{ borderBottom: accentStyle === 'Line' ? `2px solid ${brandColor}` : '1px solid rgba(226, 232, 240, 0.4)' }}
                                    >
                                        <div className="h-12 w-24 rounded-xl flex items-center justify-center text-xs font-black uppercase text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-300 dark:border-slate-800">Logo block</div>
                                        <div className="text-right">
                                            <h1 className="text-lg font-black uppercase tracking-wider font-display" style={{ color: brandColor }}>INVOICE</h1>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">#INV-001</p>
                                        </div>
                                    </div>

                                    {/* Billing & Shipping block */}
                                    <div className="flex gap-6">
                                        <div className="flex-1 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-200/20 dark:border-slate-800/10">
                                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Bill To</span>
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">Acme Corporation</p>
                                        </div>
                                        {showShipping && (
                                            <div className="flex-1 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-200/20 dark:border-slate-800/10 animate-fade-in">
                                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Ship To</span>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">Shipping Address Location</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Itemized Table block */}
                                    <div className="rounded-xl overflow-hidden border border-slate-200/30 dark:border-slate-800/40">
                                        <div 
                                            className="p-2.5 text-[10px] font-black uppercase tracking-wider text-white flex justify-between"
                                            style={{ backgroundColor: brandColor }}
                                        >
                                            <span>Item Details</span>
                                            <div className="flex gap-6">
                                                {showHsn && <span>HSN</span>}
                                                <span>Qty</span>
                                                <span>Price</span>
                                                {showDiscount && <span>Disc</span>}
                                                <span>Total</span>
                                            </div>
                                        </div>
                                        <div 
                                            className="text-slate-400 dark:text-slate-600 flex justify-between border-t border-slate-100 dark:border-slate-850"
                                            style={{
                                                padding: tablePadding === 'Compact' ? '6px 12px' : tablePadding === 'Spacious' ? '16px 24px' : '10px 16px'
                                            }}
                                        >
                                            <span>Mock Web Design Service</span>
                                            <div className="flex gap-7">
                                                {showHsn && <span>9983</span>}
                                                <span>1</span>
                                                <span>₹15k</span>
                                                {showDiscount && <span>0%</span>}
                                                <span className="font-bold text-slate-900 dark:text-white">₹15,000</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* QR Code and Terms */}
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            {showTerms && (
                                                <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold border-l-2 border-slate-200 dark:border-slate-800 pl-2">
                                                    Terms: Payment due within 15 days of invoice date.
                                                </div>
                                            )}
                                            {showQr && (
                                                <div className="mt-3 p-2 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-center gap-3 w-48 animate-fade-in">
                                                    <div className="w-8 h-8 bg-slate-300 dark:bg-slate-800 rounded-lg shrink-0 border border-slate-200/40"></div>
                                                    <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Bank Pay QR</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-1/3 text-right">
                                            <div className="flex justify-between text-xs font-semibold text-slate-500">
                                                <span>Subtotal:</span>
                                                <span>₹15,000</span>
                                            </div>
                                            <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white mt-1 border-t border-slate-100 dark:border-slate-800 pt-1">
                                                <span>Total:</span>
                                                <span style={{ color: brandColor }}>₹17,700</span>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-850 flex justify-end gap-4 bg-white dark:bg-slate-900 rounded-b-2xl shadow-inner shrink-0">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={() => {
                onSelectTemplate(template, {
                    brandColor,
                    showShipping,
                    showHsn,
                    showDiscount,
                    showTerms,
                    showQr,
                    logoPosition,
                    fontFamily,
                    tablePadding,
                    accentStyle
                });
            }}>
                Use this Template
            </Button>
        </div>
    </Modal>
  );
};

export default TemplatePreviewModal;
