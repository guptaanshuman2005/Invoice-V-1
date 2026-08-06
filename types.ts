
export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  isDefault: boolean;
}

export interface CompanyDetails {
  logo: string;
  name: string;
  gstin: string;
  pan: string;
  phone: string;
  email: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  udyam: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  signature?: string;
  brandColor?: string; // Added for visual customization
  invoiceTemplate?: 'modern' | 'classic' | 'minimal' | 'custom' | 'tally';
  showShipping?: boolean;
  showHsn?: boolean;
  showDiscount?: boolean;
  showTerms?: boolean;
  showQr?: boolean;
  logoPosition?: 'Left' | 'Right';
  fontFamily?: 'Helvetica' | 'Courier' | 'Times-Roman';
  tablePadding?: 'Compact' | 'Normal' | 'Spacious';
  accentStyle?: 'None' | 'Line' | 'Frame';
}

export interface Client {
  id: string;
  name: string;
  gstin: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingZip?: string;
  tags?: string[];
}

export interface Item {
  id: string;
  name: string;
  hsn: string;
  price: number;
  gstRate: number; // in percentage
  unit: string;
  quantityInStock: number;
}

export interface Transporter {
  id: string;
  name: string;
  gstin: string;
}

export interface InvoiceItem extends Item {
  quantity: number;
}

export interface Invoice {
  id:string;
  invoiceNumber: string;
  client: Client;
  items: InvoiceItem[];
  issueDate: string;
  dueDate: string;
  notes: string;
  subTotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
  status: 'Paid' | 'Unpaid' | 'Overdue';
  selectedBankAccountId: string | null;

  // Shipping Details - Snapshot for this specific invoice
  shippingName?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingZip?: string;
  shippingGstin?: string;
  
  // Transporter Details
  transporterName?: string;
  transporterGstin?: string;
  vehicleNumber?: string;
  ewayBillNumber?: string;
}

export interface Quotation extends Omit<Invoice, 'status' | 'invoiceNumber'> {
    quotationNumber: string;
    validUntil: string;
    status: 'Draft' | 'Sent' | 'Accepted' | 'Converted';
}

export type RecurringFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';

export interface RecurringInvoice {
  id: string;
  clientId: string;
  items: InvoiceItem[];
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
  nextRunDate: string;
  lastRunDate?: string;
  status: 'Active' | 'Paused' | 'Completed';
  notes?: string;
}

export interface StockHistoryEntry {
    id: string;
    itemId: string;
    itemName: string;
    previousQuantity: number;
    newQuantity: number;
    action: 'Manual Update' | 'Bulk Update' | 'Invoice Created' | 'Invoice Edited' | 'Invoice Deleted' | 'Voice Update' | 'Initial' | 'Bill Scan';
    timestamp: string;
    referenceId?: string; // e.g., Invoice Number
}

export interface Subscription {
  plan: 'free' | 'basic' | 'standard' | 'premium';
  status: 'active' | 'past_due' | 'canceled' | 'incomplete';
  currentPeriodEnd: string;
  invoiceCount: number;
  invoiceLimit: number;
  addonInvoices?: number;
}

export interface Expense {
  id: string;
  category: 'Rent' | 'Salaries' | 'Utilities' | 'Raw Materials' | 'Software' | 'Taxes' | 'Marketing' | 'Other';
  description: string;
  amount: number;
  date: string;
  vendorName?: string;
  paymentMode: 'Cash' | 'Bank Transfer' | 'UPI' | 'Credit Card' | 'Cheque';
  notes?: string;
}

export interface Company {
  id: string;
  ownerId: string;
  details: CompanyDetails;
  bankAccounts: BankAccount[];
  clients: Client[];
  items: Item[];
  transporters: Transporter[];
  invoices: Invoice[];
  quotations: Quotation[]; // Added quotations
  recurringInvoices: RecurringInvoice[];
  stockHistory: StockHistoryEntry[];
  expenses?: Expense[];
  subscription?: Subscription;
}

export interface User {
    id: string;
    email: string;
    name?: string;
    passwordHash: string; // In a real app, never store plain text passwords
}

export interface DraftInvoice {
    invoiceNumber: string;
    clientId: string;
    items: InvoiceItem[];
    issueDate: string;
    dueDate: string;
    notes: string;
    selectedBankAccountId: string | null;
    shippingDetails: {
        name: string;
        address: string;
        city: string;
        state: string;
        zip: string;
        gstin: string;
    };
    isShippingSameAsBilling: boolean;
    transporterId: string;
    vehicleNumber: string;
    ewayBillNumber: string;
    // Added for Quotation support
    type?: 'invoice' | 'quote';
    validUntil?: string;
}
