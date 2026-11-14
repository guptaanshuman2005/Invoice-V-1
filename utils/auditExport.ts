import type { Company, Invoice, Item, Expense, StockHistoryEntry } from '../types';
import { getInvoicePaymentSummary } from './invoiceUtils';
import { getFinancialYear } from './subscriptionUtils';
import { downloadCSV } from './csvExport';

/**
 * Form 3CD Clause 35 Quantitative Stock Valuation Register Exporter
 * Generates an audit-ready inventory schedule for Income Tax and Statutory Audit.
 */
export const exportStockAuditSchedule = (items: Item[], company: Company, fy?: string) => {
  const headers = [
    'Item ID',
    'Item Name',
    'HSN / SAC Code',
    'Unit of Measure (UOM)',
    'Rate / Unit Price (INR)',
    'Closing Stock (Qty)',
    'Stock Valuation (INR)',
    'Stock Status',
    'Negative Stock Warning'
  ];

  let totalValuation = 0;

  const rows = items.map(item => {
    const qty = item.quantityInStock || 0;
    const price = item.price || 0;
    const valuation = Math.max(0, qty * price);
    totalValuation += valuation;

    const status = qty < 0 ? 'NEGATIVE' : qty === 0 ? 'OUT OF STOCK' : qty <= 5 ? 'LOW STOCK' : 'IN STOCK';
    const warning = qty < 0 ? 'AUDIT ALERT: Sold without recording purchase/inward' : 'None';

    return [
      `"${item.id}"`,
      `"${(item.name || '').replace(/"/g, '""')}"`,
      `"${item.hsn || 'N/A'}"`,
      `"${(item.unit || 'pcs').toUpperCase()}"`,
      price.toFixed(2),
      qty.toString(),
      valuation.toFixed(2),
      `"${status}"`,
      `"${warning}"`
    ].join(',');
  });

  // Summary Row
  rows.push([
    '"TOTAL"',
    `"Total SKUs: ${items.length}"`,
    '""',
    '""',
    '""',
    '""',
    totalValuation.toFixed(2),
    '""',
    '""'
  ].join(','));

  const companyName = company.details?.name || 'Company';
  const gstin = company.details?.gstin || 'Unregistered';
  const title = `"Form 3CD Clause 35 - Quantitative Stock Valuation Register"\n"Entity: ${companyName} | GSTIN: ${gstin} | Period: ${fy || 'All Time'}"\n"Valuation Principle: Lower of Cost or Net Realizable Value (AS-2 / Ind AS 2)"\n\n`;

  const csvContent = title + headers.join(',') + '\n' + rows.join('\n');
  const filename = `Stock_Valuation_Audit_Schedule_${(fy || 'All').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  return downloadCSV(csvContent, filename);
};

/**
 * Form 3CD Clause 21(d) & Clause 31 Cash Compliance Audit Log Exporter
 * Flags cash transactions exceeding Income Tax Act limits:
 * - Section 40A(3): Business expenses > ₹10,000 paid in cash.
 * - Section 269ST: Cash receipts >= ₹2,00,000.
 */
export const exportCashComplianceAuditLog = (invoices: Invoice[], expenses: Expense[] = [], company: Company, fy?: string) => {
  const headers = [
    'Transaction Type',
    'Reference #',
    'Date',
    'Party / Client / Vendor',
    'Amount (INR)',
    'Payment Mode',
    'Income Tax Act Section',
    'Audit Status / Compliance Warning'
  ];

  const rows: string[] = [];

  // 1. Audit Cash Expenses (Section 40A(3) - Limit ₹10,000)
  expenses.forEach(exp => {
    if (fy && fy !== 'all') {
      if (getFinancialYear(exp.date) !== fy) return;
    }

    const isCash = exp.paymentMode === 'Cash';
    const amount = Number(exp.amount) || 0;
    const isViolation = isCash && amount > 10000;

    rows.push([
      '"Business Expense"',
      `"EXP-${exp.id.slice(-6)}"`,
      `"${exp.date}"`,
      `"${(exp.vendorName || exp.category || 'General Expense').replace(/"/g, '""')}"`,
      amount.toFixed(2),
      `"${exp.paymentMode}"`,
      `"${isCash ? 'Sec 40A(3)' : 'Standard'}"`,
      `"${isViolation ? 'DISALLOWANCE RISK: Cash payment > Rs. 10,000' : 'Compliant'}"`
    ].join(','));
  });

  // 2. Audit Cash Receipts (Section 269ST - Limit ₹2,00,000)
  invoices.forEach(inv => {
    if (fy && fy !== 'all') {
      if (getFinancialYear(inv.issueDate) !== fy) return;
    }

    const payments = inv.payments || [];
    payments.forEach(p => {
      const isCash = p.mode === 'Cash';
      const amount = Number(p.amount) || 0;
      const isViolation = isCash && amount >= 200000;

      rows.push([
        '"Customer Receipt"',
        `"${inv.invoiceNumber}"`,
        `"${p.date || inv.issueDate}"`,
        `"${(inv.client?.name || 'Customer').replace(/"/g, '""')}"`,
        amount.toFixed(2),
        `"${p.mode}"`,
        `"${isCash ? 'Sec 269ST' : 'Standard'}"`,
        `"${isViolation ? 'CRITICAL RISK: Cash receipt >= Rs. 2,00,000 (100% penalty under Sec 271DA)' : 'Compliant'}"`
      ].join(','));
    });
  });

  const companyName = company.details?.name || 'Company';
  const gstin = company.details?.gstin || 'Unregistered';
  const title = `"Income Tax Act Statutory Cash Compliance Register (Sec 40A(3) & Sec 269ST)"\n"Entity: ${companyName} | GSTIN: ${gstin} | Period: ${fy || 'All Time'}"\n\n`;

  const csvContent = title + headers.join(',') + '\n' + (rows.length ? rows.join('\n') : '"No cash transactions recorded in this period."');
  const filename = `Cash_Compliance_Audit_Log_${(fy || 'All').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  return downloadCSV(csvContent, filename);
};

/**
 * Sundry Debtors (Trade Receivables) Aging Schedule for CARO 2020 / Balance Sheet Audit
 */
export const exportDebtorsAgingSchedule = (invoices: Invoice[], company: Company, fy?: string) => {
  const headers = [
    'Client / Debtor Name',
    'GSTIN',
    'Contact Phone',
    'State / City',
    'Total Invoiced (INR)',
    'Total Collected (INR)',
    'Total Outstanding (INR)',
    '0-30 Days',
    '31-60 Days',
    '61-90 Days',
    '90+ Days (Critical)'
  ];

  const today = new Date();
  const debtorMap = new Map<string, {
    name: string;
    gstin: string;
    phone: string;
    location: string;
    totalInvoiced: number;
    totalCollected: number;
    balanceDue: number;
    b0to30: number;
    b31to60: number;
    b61to90: number;
    b90plus: number;
  }>();

  invoices.forEach(inv => {
    if (inv.documentType === 'credit_note') return;
    if (fy && fy !== 'all') {
      if (getFinancialYear(inv.issueDate) !== fy) return;
    }

    const clientId = inv.client?.id || inv.client?.name || 'Unknown';
    const summary = getInvoicePaymentSummary(inv);

    const existing = debtorMap.get(clientId) || {
      name: inv.client?.name || 'Unknown Debtor',
      gstin: inv.client?.gstin || 'Unregistered',
      phone: inv.client?.phone || 'N/A',
      location: `${inv.client?.city || ''}${inv.client?.state ? ', ' + inv.client.state : ''}`,
      totalInvoiced: 0,
      totalCollected: 0,
      balanceDue: 0,
      b0to30: 0,
      b31to60: 0,
      b61to90: 0,
      b90plus: 0
    };

    existing.totalInvoiced += inv.grandTotal;
    existing.totalCollected += summary.totalPaid;
    existing.balanceDue += summary.balanceDue;

    if (summary.balanceDue > 0) {
      const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.issueDate);
      const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

      if (daysOverdue <= 30) existing.b0to30 += summary.balanceDue;
      else if (daysOverdue <= 60) existing.b31to60 += summary.balanceDue;
      else if (daysOverdue <= 90) existing.b61to90 += summary.balanceDue;
      else existing.b90plus += summary.balanceDue;
    }

    debtorMap.set(clientId, existing);
  });

  const rows = Array.from(debtorMap.values())
    .filter(d => d.balanceDue > 0)
    .sort((a, b) => b.balanceDue - a.balanceDue)
    .map(d => [
      `"${d.name.replace(/"/g, '""')}"`,
      `"${d.gstin}"`,
      `"${d.phone}"`,
      `"${d.location}"`,
      d.totalInvoiced.toFixed(2),
      d.totalCollected.toFixed(2),
      d.balanceDue.toFixed(2),
      d.b0to30.toFixed(2),
      d.b31to60.toFixed(2),
      d.b61to90.toFixed(2),
      d.b90plus.toFixed(2)
    ].join(','));

  const companyName = company.details?.name || 'Company';
  const gstin = company.details?.gstin || 'Unregistered';
  const title = `"Sundry Debtors Aging Schedule (CARO 2020 / Balance Sheet Audit)"\n"Entity: ${companyName} | GSTIN: ${gstin} | Period: ${fy || 'All Time'}"\n\n`;

  const csvContent = title + headers.join(',') + '\n' + (rows.length ? rows.join('\n') : '"No outstanding trade receivables for this period."');
  const filename = `Debtors_Aging_Schedule_${(fy || 'All').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  return downloadCSV(csvContent, filename);
};
