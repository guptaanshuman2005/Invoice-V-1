import React, { useState, useMemo } from 'react';
import type { Company, Invoice, Expense } from '../types';
import { 
    FileSpreadsheet, 
    Download, 
    Calendar, 
    FileText, 
    Building2, 
    CheckCircle2, 
    ArrowUpRight, 
    ArrowDownRight, 
    HelpCircle, 
    Copy, 
    Printer, 
    Search, 
    Info, 
    Layers, 
    Receipt, 
    Sparkles, 
    FileJson,
    Users 
} from 'lucide-react';
import Button from './common/Button';
import Input from './common/Input';
import Modal from './common/Modal';
import { INDIAN_STATES, STATE_TO_GST_CODE } from '../constants';
import { 
    downloadCSV, 
    downloadJSON, 
    generateGSTR1CSV, 
    generateGSTR3BCSV, 
    generateGSTR1JSON, 
    getStateCode 
} from '../utils/csvExport';
import { toast } from 'sonner';

interface GstReportsProps {
  company: Company;
}

type TabType = 'b2b' | 'b2cs' | 'cdnr' | 'hsn' | 'docs' | 'gstr3b';

const MONTH_NAMES = [
  { label: 'April', num: 4 },
  { label: 'May', num: 5 },
  { label: 'June', num: 6 },
  { label: 'July', num: 7 },
  { label: 'August', num: 8 },
  { label: 'September', num: 9 },
  { label: 'October', num: 10 },
  { label: 'November', num: 11 },
  { label: 'December', num: 12 },
  { label: 'January', num: 1 },
  { label: 'February', num: 2 },
  { label: 'March', num: 3 },
];

const GstReports: React.FC<GstReportsProps> = ({ company }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  
  // Default FY: If current month >= 4, FY is currentYear - (currentYear+1), else (currentYear-1) - currentYear
  const defaultFy = currentMonth >= 4 ? `${currentYear}-${(currentYear + 1).toString().slice(-2)}` : `${currentYear - 1}-${currentYear.toString().slice(-2)}`;

  const [selectedFy, setSelectedFy] = useState(defaultFy);
  const [periodType, setPeriodType] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(currentMonth >= 4 && currentMonth <= 6 ? 1 : currentMonth >= 7 && currentMonth <= 9 ? 2 : currentMonth >= 10 && currentMonth <= 12 ? 3 : 4);
  const [activeTab, setActiveTab] = useState<TabType>('b2b');
  const [searchQuery, setSearchQuery] = useState('');
  const [showJsonModal, setShowJsonModal] = useState(false);

  // Financial Year options
  const fyOptions = useMemo(() => {
    const list = [];
    const base = currentMonth >= 4 ? currentYear : currentYear - 1;
    for (let y = base + 1; y >= base - 3; y--) {
      list.push(`${y}-${(y + 1).toString().slice(-2)}`);
    }
    return list;
  }, [currentYear, currentMonth]);

  // Compute date range for selected period
  const dateRange = useMemo(() => {
    const startYear = parseInt(selectedFy.split('-')[0], 10);
    const endYear = startYear + 1;

    if (periodType === 'year') {
      return {
        start: new Date(startYear, 3, 1), // 1st April
        end: new Date(endYear, 2, 31, 23, 59, 59), // 31st March
        fp: `03${endYear}`
      };
    }

    if (periodType === 'quarter') {
      if (selectedQuarter === 1) {
        return { start: new Date(startYear, 3, 1), end: new Date(startYear, 5, 30, 23, 59, 59), fp: `06${startYear}` };
      } else if (selectedQuarter === 2) {
        return { start: new Date(startYear, 6, 1), end: new Date(startYear, 8, 30, 23, 59, 59), fp: `09${startYear}` };
      } else if (selectedQuarter === 3) {
        return { start: new Date(startYear, 9, 1), end: new Date(startYear, 11, 31, 23, 59, 59), fp: `12${startYear}` };
      } else {
        return { start: new Date(endYear, 0, 1), end: new Date(endYear, 2, 31, 23, 59, 59), fp: `03${endYear}` };
      }
    }

    // Monthly
    const yearForMonth = selectedMonth >= 4 ? startYear : endYear;
    const start = new Date(yearForMonth, selectedMonth - 1, 1);
    const end = new Date(yearForMonth, selectedMonth, 0, 23, 59, 59);
    const fp = `${String(selectedMonth).padStart(2, '0')}${yearForMonth}`;
    return { start, end, fp };
  }, [selectedFy, periodType, selectedMonth, selectedQuarter]);

  // Filter invoices within period
  const filteredInvoices = useMemo(() => {
    return (company.invoices || []).filter(inv => {
      const invDate = new Date(inv.issueDate);
      if (isNaN(invDate.getTime())) return true; // Include if date parsing fails in sandbox
      return invDate >= dateRange.start && invDate <= dateRange.end;
    });
  }, [company.invoices, dateRange]);

  // Segregate standard invoices, credit notes, and debit notes
  const regularInvoices = useMemo(() => {
    return filteredInvoices.filter(inv => inv.documentType !== 'credit_note' && inv.documentType !== 'debit_note');
  }, [filteredInvoices]);

  const creditNotes = useMemo(() => {
    return filteredInvoices.filter(inv => inv.documentType === 'credit_note');
  }, [filteredInvoices]);

  const debitNotes = useMemo(() => {
    return filteredInvoices.filter(inv => inv.documentType === 'debit_note');
  }, [filteredInvoices]);

  const creditDebitNotes = useMemo(() => {
    return filteredInvoices.filter(inv => inv.documentType === 'credit_note' || inv.documentType === 'debit_note');
  }, [filteredInvoices]);

  // Filter expenses within period to compute Input Tax Credit (ITC)
  const filteredExpenses = useMemo(() => {
    return (company.expenses || []).filter(exp => {
      const expDate = new Date(exp.date);
      if (isNaN(expDate.getTime())) return true;
      return expDate >= dateRange.start && expDate <= dateRange.end;
    });
  }, [company.expenses, dateRange]);

  const companyState = (company.details.state || '').trim().toLowerCase();

  // B2B Invoices (registered buyers with GSTIN, excluding CN/DN)
  const b2bInvoices = useMemo(() => {
    return regularInvoices.filter(inv => {
      const gstin = inv.client.gstin?.trim() || '';
      return gstin.length > 0;
    });
  }, [regularInvoices]);

  // B2CS Invoices (unregistered buyers, excluding CN/DN)
  const b2csInvoices = useMemo(() => {
    return regularInvoices.filter(inv => {
      const gstin = inv.client.gstin?.trim() || '';
      return gstin.length === 0;
    });
  }, [regularInvoices]);

  // Aggregated B2CS by POS & Tax Rate
  const b2csSummary = useMemo(() => {
    const map: Record<string, { pos: string, rate: number, taxable: number, igst: number, cgst: number, sgst: number, total: number }> = {};
    b2csInvoices.forEach(inv => {
      const pos = (inv.shippingState || inv.client.state || company.details.state || '').trim();
      const isInter = pos.toLowerCase() !== companyState && pos !== '';
      
      inv.items.forEach(item => {
        const rate = Number(item.gstRate) || 0;
        const taxable = (Number(item.price) || 0) * (Number(item.quantity) || 0);
        const tax = (taxable * rate) / 100;
        const key = `${pos}_${rate}`;

        if (!map[key]) {
          map[key] = { pos: pos || 'Other', rate, taxable: 0, igst: 0, cgst: 0, sgst: 0, total: 0 };
        }
        map[key].taxable += taxable;
        map[key].total += (taxable + tax);
        if (isInter) {
          map[key].igst += tax;
        } else {
          map[key].cgst += tax / 2;
          map[key].sgst += tax / 2;
        }
      });
    });
    return Object.values(map);
  }, [b2csInvoices, companyState, company.details.state]);

  // HSN Summary aggregation
  const hsnSummary = useMemo(() => {
    const map: Record<string, { hsn: string, desc: string, uqc: string, qty: number, totalVal: number, taxableVal: number, igst: number, cgst: number, sgst: number }> = {};
    
    filteredInvoices.forEach(inv => {
      const pos = (inv.shippingState || inv.client.state || '').trim();
      const isInter = pos.toLowerCase() !== companyState && pos !== '';
      const mult = inv.documentType === 'credit_note' ? -1 : 1;

      inv.items.forEach(item => {
        const hsn = (item.hsn || '9999').trim();
        const rate = Number(item.gstRate) || 0;
        const qty = (Number(item.quantity) || 0) * mult;
        const taxable = ((Number(item.price) || 0) * (Number(item.quantity) || 0)) * mult;
        const tax = (taxable * rate) / 100;
        const total = taxable + tax;
        const uqc = (item.unit || 'PCS').toUpperCase();

        if (!map[hsn]) {
          map[hsn] = {
            hsn,
            desc: item.name || 'Goods/Services',
            uqc,
            qty: 0,
            totalVal: 0,
            taxableVal: 0,
            igst: 0,
            cgst: 0,
            sgst: 0
          };
        }
        map[hsn].qty += qty;
        map[hsn].totalVal += total;
        map[hsn].taxableVal += taxable;
        if (isInter) {
          map[hsn].igst += tax;
        } else {
          map[hsn].cgst += tax / 2;
          map[hsn].sgst += tax / 2;
        }
      });
    });
    return Object.values(map);
  }, [filteredInvoices, companyState]);

  // Overall Totals Net of Credit/Debit Notes
  const totals = useMemo(() => {
    let grossInvoiceTaxable = 0;
    let grossInvoiceIgst = 0;
    let grossInvoiceCgst = 0;
    let grossInvoiceSgst = 0;
    let grossInvoiceTotal = 0;

    regularInvoices.forEach(inv => {
      grossInvoiceTaxable += Number(inv.subTotal) || 0;
      grossInvoiceIgst += Number(inv.igst) || 0;
      grossInvoiceCgst += Number(inv.cgst) || 0;
      grossInvoiceSgst += Number(inv.sgst) || 0;
      grossInvoiceTotal += Number(inv.grandTotal) || 0;
    });

    let cnTaxable = 0, cnIgst = 0, cnCgst = 0, cnSgst = 0, cnTotal = 0;
    creditNotes.forEach(cn => {
      cnTaxable += Number(cn.subTotal) || 0;
      cnIgst += Number(cn.igst) || 0;
      cnCgst += Number(cn.cgst) || 0;
      cnSgst += Number(cn.sgst) || 0;
      cnTotal += Number(cn.grandTotal) || 0;
    });

    let dnTaxable = 0, dnIgst = 0, dnCgst = 0, dnSgst = 0, dnTotal = 0;
    debitNotes.forEach(dn => {
      dnTaxable += Number(dn.subTotal) || 0;
      dnIgst += Number(dn.igst) || 0;
      dnCgst += Number(dn.cgst) || 0;
      dnSgst += Number(dn.sgst) || 0;
      dnTotal += Number(dn.grandTotal) || 0;
    });

    const netTaxable = Math.max(0, grossInvoiceTaxable + dnTaxable - cnTaxable);
    const netIgst = Math.max(0, grossInvoiceIgst + dnIgst - cnIgst);
    const netCgst = Math.max(0, grossInvoiceCgst + dnCgst - cnCgst);
    const netSgst = Math.max(0, grossInvoiceSgst + dnSgst - cnSgst);
    const netGrandTotal = Math.max(0, grossInvoiceTotal + dnTotal - cnTotal);

    const totalOutputTax = netIgst + netCgst + netSgst;

    // Estimate ITC from business expenses: assume standard 18% GST on business expenses if not explicitly given
    let itcEligible = 0;
    filteredExpenses.forEach(exp => {
      const amount = Number(exp.amount) || 0;
      const estimatedGst = (amount * 18) / 118;
      itcEligible += estimatedGst;
    });

    const netTaxPayable = Math.max(0, totalOutputTax - itcEligible);

    return {
      taxable: netTaxable,
      grossInvoiceTaxable,
      cnTaxable,
      dnTaxable,
      igst: netIgst,
      cgst: netCgst,
      sgst: netSgst,
      grossInvoiceIgst,
      grossInvoiceCgst,
      grossInvoiceSgst,
      cnIgst,
      cnCgst,
      cnSgst,
      dnIgst,
      dnCgst,
      dnSgst,
      totalOutputTax,
      itcEligible,
      netTaxPayable,
      grandTotal: netGrandTotal,
      invoiceCount: regularInvoices.length,
      creditNoteCount: creditNotes.length,
      debitNoteCount: debitNotes.length,
      b2bCount: b2bInvoices.length,
      b2csCount: b2csInvoices.length
    };
  }, [regularInvoices, creditNotes, debitNotes, filteredExpenses, b2bInvoices, b2csInvoices]);

  // Document Summary
  const docSummary = useMemo(() => {
    const summarize = (list: Invoice[]) => {
      if (!list.length) return { from: '-', to: '-', total: 0, cancelled: 0, net: 0 };
      const numbers = list.map(i => i.invoiceNumber).sort();
      return {
        from: numbers[0],
        to: numbers[numbers.length - 1],
        total: numbers.length,
        cancelled: 0,
        net: numbers.length
      };
    };

    return {
      invoices: summarize(regularInvoices),
      creditNotes: summarize(creditNotes),
      debitNotes: summarize(debitNotes)
    };
  }, [regularInvoices, creditNotes, debitNotes]);

  // JSON payload for download and modal
  const gstr1JsonPayload = useMemo(() => {
    return generateGSTR1JSON(filteredInvoices, company, dateRange.fp);
  }, [filteredInvoices, company, dateRange.fp]);

  // Handlers
  const handleDownloadJSON = () => {
    const filename = `GSTR1_${(company.details.gstin || 'NO_GSTIN').toUpperCase()}_${dateRange.fp}.json`;
    const success = downloadJSON(gstr1JsonPayload, filename);
    if (success) {
      toast.success(`GSTR-1 JSON downloaded (${filename}) - Ready for GST Portal`);
    }
  };

  const handleDownloadGSTR1CSV = () => {
    const csv = generateGSTR1CSV(filteredInvoices, company);
    const filename = `GSTR1_Report_${(company.details.name || 'Company').replace(/\s+/g, '_')}_${dateRange.fp}.csv`;
    const success = downloadCSV(csv, filename);
    if (success) {
      toast.success(`GSTR-1 CSV exported successfully`);
    }
  };

  const handleDownloadGSTR3BCSV = () => {
    const csv = generateGSTR3BCSV(filteredInvoices, company);
    const filename = `GSTR3B_Summary_${(company.details.name || 'Company').replace(/\s+/g, '_')}_${dateRange.fp}.csv`;
    const success = downloadCSV(csv, filename);
    if (success) {
      toast.success(`GSTR-3B Summary CSV exported successfully`);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(gstr1JsonPayload, null, 2));
    toast.success('GSTR-1 JSON copied to clipboard!');
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered B2B table items based on search query
  const searchedB2B = useMemo(() => {
    if (!searchQuery.trim()) return b2bInvoices;
    const q = searchQuery.toLowerCase();
    return b2bInvoices.filter(inv => 
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.client.name.toLowerCase().includes(q) ||
      (inv.client.gstin && inv.client.gstin.toLowerCase().includes(q))
    );
  }, [b2bInvoices, searchQuery]);

  // Filtered CDNR table items based on search query
  const searchedCDNR = useMemo(() => {
    if (!searchQuery.trim()) return creditDebitNotes;
    const q = searchQuery.toLowerCase();
    return creditDebitNotes.filter(n => 
      n.invoiceNumber.toLowerCase().includes(q) ||
      (n.originalInvoiceNumber && n.originalInvoiceNumber.toLowerCase().includes(q)) ||
      n.client.name.toLowerCase().includes(q) ||
      (n.client.gstin && n.client.gstin.toLowerCase().includes(q))
    );
  }, [creditDebitNotes, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in print:p-0">
      
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-800/80 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-accent to-indigo-600 text-white rounded-xl shadow-md shadow-accent/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">GST Tax Reports & Filings</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              GSTR-1 & 3B Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generate compliant Indian GST return summaries for <strong className="text-slate-800 dark:text-slate-200">{company.details.name}</strong> (GSTIN: {company.details.gstin || 'Not Configured'}).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <Button 
            onClick={handleDownloadJSON} 
            className="flex-1 sm:flex-initial !py-2.5 !px-4 text-xs font-bold gap-2 shadow-md shadow-accent/20 bg-gradient-to-r from-accent to-indigo-600 hover:from-accent-hover hover:to-indigo-700 text-white"
          >
            <FileJson className="w-4 h-4 shrink-0" />
            <span>Download GSTR-1 JSON</span>
          </Button>

          <Button 
            variant="secondary" 
            onClick={handleDownloadGSTR1CSV} 
            className="flex-1 sm:flex-initial !py-2.5 !px-3 text-xs font-bold gap-1.5"
            title="Download GSTR-1 Excel/CSV format"
          >
            <Download className="w-3.5 h-3.5" />
            <span>GSTR-1 CSV</span>
          </Button>

          <Button 
            variant="secondary" 
            onClick={handleDownloadGSTR3BCSV} 
            className="flex-1 sm:flex-initial !py-2.5 !px-3 text-xs font-bold gap-1.5"
            title="Download GSTR-3B Excel/CSV summary"
          >
            <Download className="w-3.5 h-3.5" />
            <span>GSTR-3B CSV</span>
          </Button>

          <Button 
            variant="secondary" 
            onClick={() => setShowJsonModal(true)} 
            className="!py-2.5 !px-3 text-xs font-bold gap-1.5"
            title="Preview JSON schema"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview JSON</span>
          </Button>

          <Button 
            variant="secondary" 
            onClick={handlePrint} 
            className="!py-2.5 !px-3 text-xs font-bold"
            title="Print Summary"
          >
            <Printer className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Period Selection Bar */}
      <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-4 shadow-sm print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          {/* FY selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Financial Year:</span>
            <select
              value={selectedFy}
              onChange={e => setSelectedFy(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-accent"
            >
              {fyOptions.map(fy => (
                <option key={fy} value={fy}>FY {fy}</option>
              ))}
            </select>
          </div>

          {/* Period type tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setPeriodType('month')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${periodType === 'month' ? 'bg-white dark:bg-slate-800 text-accent shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setPeriodType('quarter')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${periodType === 'quarter' ? 'bg-white dark:bg-slate-800 text-accent shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              Quarterly
            </button>
            <button
              onClick={() => setPeriodType('year')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${periodType === 'year' ? 'bg-white dark:bg-slate-800 text-accent shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              Full Year
            </button>
          </div>

          {/* Month selector */}
          {periodType === 'month' && (
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-accent"
            >
              {MONTH_NAMES.map(m => (
                <option key={m.num} value={m.num}>{m.label}</option>
              ))}
            </select>
          )}

          {/* Quarter selector */}
          {periodType === 'quarter' && (
            <select
              value={selectedQuarter}
              onChange={e => setSelectedQuarter(Number(e.target.value))}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-accent"
            >
              <option value={1}>Q1: Apr - Jun</option>
              <option value={2}>Q2: Jul - Sep</option>
              <option value={3}>Q3: Oct - Dec</option>
              <option value={4}>Q4: Jan - Mar</option>
            </select>
          )}
        </div>

        {/* Period info indicator */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-accent" />
          <span>Filing Period Code: <strong className="text-slate-900 dark:text-white font-mono">{dateRange.fp}</strong></span>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Taxable Value */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outward Taxable Value</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              ₹{totals.taxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span>Gross: ₹{totals.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              <span>•</span>
              <span>{totals.invoiceCount} Invoices</span>
            </div>
          </div>
        </div>

        {/* Output Tax Liability */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Output GST Liability</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              ₹{totals.totalOutputTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 truncate">
              IGST: ₹{totals.igst.toFixed(0)} • CGST: ₹{totals.cgst.toFixed(0)} • SGST: ₹{totals.sgst.toFixed(0)}
            </div>
          </div>
        </div>

        {/* Input Tax Credit (ITC) */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Eligible ITC (Expenses)</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              ₹{totals.itcEligible.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              From {filteredExpenses.length} business expense records
            </div>
          </div>
        </div>

        {/* Net Tax Payable */}
        <div className="glass-panel p-5 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05] flex flex-col justify-between relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Net GST Cash Payable</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              ₹{totals.netTaxPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
              Output Tax minus Input Credit
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation & Search */}
      <div className="bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          
          {/* Tab selection */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('b2b')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${activeTab === 'b2b' ? 'bg-white dark:bg-slate-800 text-accent shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Table 4: B2B Invoices ({b2bInvoices.length})
            </button>

            <button
              onClick={() => setActiveTab('b2cs')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${activeTab === 'b2cs' ? 'bg-white dark:bg-slate-800 text-accent shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Table 7: B2CS Small ({b2csSummary.length})
            </button>

            <button
              onClick={() => setActiveTab('cdnr')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${activeTab === 'cdnr' ? 'bg-white dark:bg-slate-800 text-accent shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Table 9B: Credit / Debit Notes ({creditDebitNotes.length})
            </button>

            <button
              onClick={() => setActiveTab('hsn')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${activeTab === 'hsn' ? 'bg-white dark:bg-slate-800 text-accent shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Table 12: HSN Summary ({hsnSummary.length})
            </button>

            <button
              onClick={() => setActiveTab('docs')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${activeTab === 'docs' ? 'bg-white dark:bg-slate-800 text-accent shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Table 13: Documents
            </button>

            <button
              onClick={() => setActiveTab('gstr3b')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${activeTab === 'gstr3b' ? 'bg-white dark:bg-slate-800 text-accent shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Form GSTR-3B Summary
            </button>
          </div>

          {/* Search filter for B2B and CDNR */}
          {(activeTab === 'b2b' || activeTab === 'cdnr') && (
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={activeTab === 'cdnr' ? 'Search Note #, Inv # or Client...' : 'Search Client or GSTIN...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          )}
        </div>

        {/* TAB 1: B2B INVOICES */}
        {activeTab === 'b2b' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3.5">Recipient GSTIN</th>
                  <th className="p-3.5">Receiver Trade Name</th>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Place of Supply</th>
                  <th className="p-3.5 text-right">Taxable Val (₹)</th>
                  <th className="p-3.5 text-right">IGST (₹)</th>
                  <th className="p-3.5 text-right">CGST (₹)</th>
                  <th className="p-3.5 text-right">SGST (₹)</th>
                  <th className="p-3.5 text-right">Invoice Val (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {searchedB2B.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Building2 className="w-8 h-8 opacity-40 text-slate-400" />
                        <p className="font-semibold">No registered B2B invoices found for this filing period.</p>
                        <p className="text-[11px] opacity-70">Invoices issued to clients with a GSTIN will appear here automatically.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  searchedB2B.map(inv => {
                    const pos = inv.shippingState || inv.client.state || '';
                    const posCode = getStateCode(pos);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-accent">{inv.client.gstin}</td>
                        <td className="p-3.5 font-medium text-slate-900 dark:text-white">{inv.client.name}</td>
                        <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">{inv.invoiceNumber}</td>
                        <td className="p-3.5 text-slate-500">{inv.issueDate}</td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-300 font-medium">
                          {posCode} - {pos || 'Same State'}
                        </td>
                        <td className="p-3.5 text-right font-medium">₹{(inv.subTotal || 0).toFixed(2)}</td>
                        <td className="p-3.5 text-right text-slate-600 dark:text-slate-400">₹{(inv.igst || 0).toFixed(2)}</td>
                        <td className="p-3.5 text-right text-slate-600 dark:text-slate-400">₹{(inv.cgst || 0).toFixed(2)}</td>
                        <td className="p-3.5 text-right text-slate-600 dark:text-slate-400">₹{(inv.sgst || 0).toFixed(2)}</td>
                        <td className="p-3.5 text-right font-bold text-slate-900 dark:text-white">₹{inv.grandTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: B2CS (B2C SMALL) */}
        {activeTab === 'b2cs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3.5">Place of Supply (POS)</th>
                  <th className="p-3.5">Supply Type</th>
                  <th className="p-3.5 text-center">Tax Rate (%)</th>
                  <th className="p-3.5 text-right">Taxable Value (₹)</th>
                  <th className="p-3.5 text-right">Integrated Tax (IGST)</th>
                  <th className="p-3.5 text-right">Central Tax (CGST)</th>
                  <th className="p-3.5 text-right">State Tax (SGST)</th>
                  <th className="p-3.5 text-right">Total Invoice Value (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {b2csSummary.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 opacity-40 text-slate-400" />
                        <p className="font-semibold">No B2C supplies found for this filing period.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  b2csSummary.map((row, idx) => {
                    const posCode = getStateCode(row.pos);
                    const isInter = row.pos.toLowerCase() !== companyState && row.pos !== '';
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="p-3.5 font-medium text-slate-900 dark:text-white">
                          <span className="font-mono text-accent mr-1.5">{posCode}</span>
                          {row.pos}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isInter ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                            {isInter ? 'Inter-State' : 'Intra-State'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-bold">{row.rate}%</td>
                        <td className="p-3.5 text-right font-medium">₹{row.taxable.toFixed(2)}</td>
                        <td className="p-3.5 text-right text-slate-600 dark:text-slate-400">₹{row.igst.toFixed(2)}</td>
                        <td className="p-3.5 text-right text-slate-600 dark:text-slate-400">₹{row.cgst.toFixed(2)}</td>
                        <td className="p-3.5 text-right text-slate-600 dark:text-slate-400">₹{row.sgst.toFixed(2)}</td>
                        <td className="p-3.5 text-right font-bold text-slate-900 dark:text-white">₹{row.total.toFixed(2)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: CDNR / CDNUR (CREDIT & DEBIT NOTES) */}
        {activeTab === 'cdnr' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3.5">Doc Type</th>
                  <th className="p-3.5">Note # & Date</th>
                  <th className="p-3.5">Original Inv Ref</th>
                  <th className="p-3.5">Recipient Details</th>
                  <th className="p-3.5">Reason (GST 9B)</th>
                  <th className="p-3.5">Place of Supply</th>
                  <th className="p-3.5 text-right">Taxable Val (₹)</th>
                  <th className="p-3.5 text-right">IGST (₹)</th>
                  <th className="p-3.5 text-right">CGST (₹)</th>
                  <th className="p-3.5 text-right">SGST (₹)</th>
                  <th className="p-3.5 text-right">Note Val (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {searchedCDNR.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileSpreadsheet className="w-8 h-8 opacity-40 text-slate-400" />
                        <p className="font-semibold">No Credit or Debit Notes issued for this filing period.</p>
                        <p className="text-[11px] opacity-70">Credit and Debit notes issued from the Invoices view will appear here automatically.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  searchedCDNR.map(note => {
                    const isCredit = note.documentType === 'credit_note';
                    const pos = note.shippingState || note.client.state || '';
                    const posCode = getStateCode(pos);
                    return (
                      <tr key={note.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${isCredit ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800' : 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800'}`}>
                            {isCredit ? 'Credit Note (C)' : 'Debit Note (D)'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-slate-900 dark:text-white">{note.invoiceNumber}</div>
                          <div className="text-[11px] text-slate-400">{note.issueDate}</div>
                        </td>
                        <td className="p-3.5">
                          {note.originalInvoiceNumber ? (
                            <div>
                              <div className="font-mono text-accent font-semibold">{note.originalInvoiceNumber}</div>
                              <div className="text-[11px] text-slate-400">{note.originalInvoiceDate || '-'}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">None specified</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="font-medium text-slate-900 dark:text-white">{note.client.name}</div>
                          {note.client.gstin ? (
                            <div className="font-mono text-[10px] text-accent font-bold">{note.client.gstin}</div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold">Unregistered (CDNUR)</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {note.reason || 'Correction in Invoice'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-300 font-medium">
                          {posCode} - {pos || 'Same State'}
                        </td>
                        <td className={`p-3.5 text-right font-medium ${isCredit ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                          {isCredit ? '-' : ''}₹{(note.subTotal || 0).toFixed(2)}
                        </td>
                        <td className="p-3.5 text-right text-slate-600 dark:text-slate-400">₹{(note.igst || 0).toFixed(2)}</td>
                        <td className="p-3.5 text-right text-slate-600 dark:text-slate-400">₹{(note.cgst || 0).toFixed(2)}</td>
                        <td className="p-3.5 text-right text-slate-600 dark:text-slate-400">₹{(note.sgst || 0).toFixed(2)}</td>
                        <td className={`p-3.5 text-right font-black ${isCredit ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                          {isCredit ? '-' : ''}₹{note.grandTotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: HSN SUMMARY */}
        {activeTab === 'hsn' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3.5">HSN/SAC</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5">UQC</th>
                  <th className="p-3.5 text-right">Total Qty</th>
                  <th className="p-3.5 text-right">Total Value (₹)</th>
                  <th className="p-3.5 text-right">Taxable Value (₹)</th>
                  <th className="p-3.5 text-right">IGST (₹)</th>
                  <th className="p-3.5 text-right">CGST (₹)</th>
                  <th className="p-3.5 text-right">SGST (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {hsnSummary.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      <p className="font-semibold">No HSN data found for this filing period.</p>
                    </td>
                  </tr>
                ) : (
                  hsnSummary.map((h, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-accent">{h.hsn}</td>
                      <td className="p-3.5 font-medium text-slate-900 dark:text-white">{h.desc}</td>
                      <td className="p-3.5 text-slate-500 uppercase">{h.uqc}</td>
                      <td className="p-3.5 text-right font-medium">{h.qty}</td>
                      <td className="p-3.5 text-right font-medium">₹{h.totalVal.toFixed(2)}</td>
                      <td className="p-3.5 text-right font-bold text-slate-900 dark:text-white">₹{h.taxableVal.toFixed(2)}</td>
                      <td className="p-3.5 text-right text-slate-600 dark:text-slate-400">₹{h.igst.toFixed(2)}</td>
                      <td className="p-3.5 text-right text-slate-600 dark:text-slate-400">₹{h.cgst.toFixed(2)}</td>
                      <td className="p-3.5 text-right text-slate-600 dark:text-slate-400">₹{h.sgst.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: DOCUMENTS ISSUED */}
        {activeTab === 'docs' && (
          <div className="p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Table 13: Summary of Documents Issued during Period</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="p-3.5">Nature of Document</th>
                    <th className="p-3.5">From Serial No.</th>
                    <th className="p-3.5">To Serial No.</th>
                    <th className="p-3.5 text-right">Total Number</th>
                    <th className="p-3.5 text-right">Cancelled</th>
                    <th className="p-3.5 text-right">Net Issued</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white">Invoices for Outward Supply</td>
                    <td className="p-3.5 font-mono text-accent">{docSummary.invoices.from}</td>
                    <td className="p-3.5 font-mono text-accent">{docSummary.invoices.to}</td>
                    <td className="p-3.5 text-right font-medium">{docSummary.invoices.total}</td>
                    <td className="p-3.5 text-right text-slate-400">{docSummary.invoices.cancelled}</td>
                    <td className="p-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">{docSummary.invoices.net}</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white">Credit Notes (GSTR-1 Table 9B)</td>
                    <td className="p-3.5 font-mono text-rose-500">{docSummary.creditNotes.from}</td>
                    <td className="p-3.5 font-mono text-rose-500">{docSummary.creditNotes.to}</td>
                    <td className="p-3.5 text-right font-medium">{docSummary.creditNotes.total}</td>
                    <td className="p-3.5 text-right text-slate-400">{docSummary.creditNotes.cancelled}</td>
                    <td className="p-3.5 text-right font-bold text-rose-600 dark:text-rose-400">{docSummary.creditNotes.net}</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white">Debit Notes (GSTR-1 Table 9B)</td>
                    <td className="p-3.5 font-mono text-indigo-500">{docSummary.debitNotes.from}</td>
                    <td className="p-3.5 font-mono text-indigo-500">{docSummary.debitNotes.to}</td>
                    <td className="p-3.5 text-right font-medium">{docSummary.debitNotes.total}</td>
                    <td className="p-3.5 text-right text-slate-400">{docSummary.debitNotes.cancelled}</td>
                    <td className="p-3.5 text-right font-bold text-indigo-600 dark:text-indigo-400">{docSummary.debitNotes.net}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: GSTR-3B SUMMARY */}
        {activeTab === 'gstr3b' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Form GSTR-3B: Monthly / Quarterly Summary Return</h3>
              <p className="text-xs text-slate-500">Summary of outward supplies, eligible Input Tax Credit (ITC), and net cash liability (Net of Table 9B Credit/Debit Notes).</p>
            </div>

            {/* Table 3.1: Details of Outward Supplies */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300">
                3.1 Details of Outward Supplies and inward supplies liable to reverse charge
              </div>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="p-3">Nature of Supplies</th>
                    <th className="p-3 text-right">Total Taxable Value (₹)</th>
                    <th className="p-3 text-right">Integrated Tax (₹)</th>
                    <th className="p-3 text-right">Central Tax (₹)</th>
                    <th className="p-3 text-right">State/UT Tax (₹)</th>
                    <th className="p-3 text-right">Cess (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                      <div>(a) Outward taxable supplies (other than zero rated, nil rated and exempted)</div>
                      {(totals.cnTaxable > 0 || totals.dnTaxable > 0) && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Net: Invoices ₹{totals.grossInvoiceTaxable.toFixed(2)}
                          {totals.cnTaxable > 0 && <span className="text-rose-500"> - Credit Notes ₹{totals.cnTaxable.toFixed(2)}</span>}
                          {totals.dnTaxable > 0 && <span className="text-indigo-500"> + Debit Notes ₹{totals.dnTaxable.toFixed(2)}</span>}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right font-bold">₹{totals.taxable.toFixed(2)}</td>
                    <td className="p-3 text-right">₹{totals.igst.toFixed(2)}</td>
                    <td className="p-3 text-right">₹{totals.cgst.toFixed(2)}</td>
                    <td className="p-3 text-right">₹{totals.sgst.toFixed(2)}</td>
                    <td className="p-3 text-right text-slate-400">0.00</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-500">(b) Outward taxable supplies (zero rated)</td>
                    <td className="p-3 text-right text-slate-400">0.00</td>
                    <td className="p-3 text-right text-slate-400">0.00</td>
                    <td className="p-3 text-right text-slate-400">0.00</td>
                    <td className="p-3 text-right text-slate-400">0.00</td>
                    <td className="p-3 text-right text-slate-400">0.00</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-500">(c) Other outward supplies (Nil rated, exempted)</td>
                    <td className="p-3 text-right text-slate-400">0.00</td>
                    <td className="p-3 text-right text-slate-400">-</td>
                    <td className="p-3 text-right text-slate-400">-</td>
                    <td className="p-3 text-right text-slate-400">-</td>
                    <td className="p-3 text-right text-slate-400">-</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-500">(d) Inward supplies liable to reverse charge</td>
                    <td className="p-3 text-right text-slate-400">0.00</td>
                    <td className="p-3 text-right text-slate-400">0.00</td>
                    <td className="p-3 text-right text-slate-400">0.00</td>
                    <td className="p-3 text-right text-slate-400">0.00</td>
                    <td className="p-3 text-right text-slate-400">0.00</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Table 4: Eligible ITC */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300">
                4. Eligible Input Tax Credit (ITC) from Business Expenses
              </div>
              <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Net ITC Available (all other ITC from domestic purchases/operating expenses):
                  </div>
                  <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    ₹{totals.itcEligible.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Net Tax to Pay in Cash:</div>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    ₹{totals.netTaxPayable.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* JSON Preview Modal */}
      <Modal isOpen={showJsonModal} onClose={() => setShowJsonModal(false)} title="GSTR-1 JSON Preview (GST Portal Format)" size="lg">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-900 p-3 rounded-xl text-xs">
            <span className="font-mono text-slate-600 dark:text-slate-400">
              GSTIN: <strong>{gstr1JsonPayload.gstin}</strong> • Period: <strong>{gstr1JsonPayload.fp}</strong>
            </span>
            <Button variant="secondary" onClick={handleCopyJson} className="!py-1.5 !px-3 text-xs gap-1.5">
              <Copy className="w-3.5 h-3.5" />
              <span>Copy JSON</span>
            </Button>
          </div>

          <div className="bg-slate-900 text-slate-200 font-mono text-xs p-4 rounded-xl max-h-96 overflow-y-auto border border-slate-800">
            <pre>{JSON.stringify(gstr1JsonPayload, null, 2)}</pre>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowJsonModal(false)}>Close</Button>
            <Button onClick={handleDownloadJSON} className="gap-2">
              <Download className="w-4 h-4" /> Download JSON File
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default GstReports;
