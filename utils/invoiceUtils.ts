import type { Company, Invoice, InvoicePayment, Client } from '../types';

export interface InvoicePaymentSummary {
  totalPaid: number;
  balanceDue: number;
  status: 'Paid' | 'Partially Paid' | 'Unpaid' | 'Overdue';
  progressPercentage: number;
}

/**
 * Accurately calculate payment status and balance for an invoice,
 * supporting multi-part installments as well as legacy paid invoices.
 */
export const getInvoicePaymentSummary = (invoice: Invoice): InvoicePaymentSummary => {
  const payments = invoice.payments || [];
  let totalPaid = 0;

  if (payments.length > 0) {
    totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  } else if (invoice.status === 'Paid') {
    totalPaid = invoice.grandTotal;
  }

  const grandTotal = invoice.grandTotal || 0;
  const balanceDue = Math.max(0, Number((grandTotal - totalPaid).toFixed(2)));
  const progressPercentage = grandTotal > 0 ? Math.min(100, Math.round((totalPaid / grandTotal) * 100)) : 0;

  let status: 'Paid' | 'Partially Paid' | 'Unpaid' | 'Overdue';
  if (balanceDue === 0 || totalPaid >= grandTotal) {
    status = 'Paid';
  } else if (totalPaid > 0) {
    status = 'Partially Paid';
  } else {
    // If not paid at all, check if overdue
    const todayStr = new Date().toISOString().split('T')[0];
    const isOverdue = invoice.dueDate ? invoice.dueDate < todayStr : false;
    status = isOverdue ? 'Overdue' : 'Unpaid';
  }

  return {
    totalPaid,
    balanceDue,
    status,
    progressPercentage
  };
};

/**
 * Print or download an official Money / Payment Receipt Voucher.
 */
export const printPaymentReceipt = (
  company: Company,
  invoice: Invoice,
  payment: InvoicePayment,
  client?: Client
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  const receiptNo = `REC-${invoice.invoiceNumber}-${(payment.id || Date.now().toString()).slice(-4).toUpperCase()}`;
  const paymentSummary = getInvoicePaymentSummary(invoice);
  const targetClient = client || invoice.client;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Payment Receipt - ${receiptNo}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 40px;
          background: #ffffff;
        }
        .receipt-card {
          max-width: 680px;
          margin: 0 auto;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 36px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #4f46e5;
          padding-bottom: 20px;
          margin-bottom: 24px;
        }
        .brand {
          font-size: 24px;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .sub-text {
          font-size: 12px;
          color: #64748b;
          line-height: 1.5;
        }
        .badge-title {
          font-size: 18px;
          font-weight: 900;
          color: #4f46e5;
          text-align: right;
          letter-spacing: 0.5px;
        }
        .voucher-num {
          font-family: monospace;
          font-weight: bold;
          font-size: 13px;
          color: #334155;
          margin-top: 4px;
          text-align: right;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-bottom: 24px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px 20px;
          font-size: 13px;
        }
        .field-label {
          font-size: 10px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }
        .field-val {
          font-weight: 700;
          color: #0f172a;
        }
        .amount-banner {
          background: #f0fdf4;
          border: 2px dashed #86efac;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          margin-bottom: 24px;
        }
        .amount-label {
          font-size: 11px;
          font-weight: 800;
          color: #15803d;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .amount-val {
          font-size: 32px;
          font-weight: 900;
          color: #166534;
          font-family: monospace;
          margin-top: 4px;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-bottom: 28px;
        }
        .table th {
          background: #f1f5f9;
          text-align: left;
          padding: 10px 12px;
          font-size: 11px;
          text-transform: uppercase;
          color: #475569;
          border-bottom: 1px solid #cbd5e1;
        }
        .table td {
          padding: 10px 12px;
          border-bottom: 1px solid #f1f5f9;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 40px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
        }
        .sign-box {
          text-align: center;
          width: 180px;
        }
        .sign-line {
          border-bottom: 1px solid #94a3b8;
          margin-bottom: 6px;
          height: 36px;
        }
        .sign-text {
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
        }
        @media print {
          body { padding: 0; background: none; }
          .receipt-card { border: none; box-shadow: none; padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="header">
          <div>
            <div class="brand">${company.details.name || 'Company Name'}</div>
            <div class="sub-text">${company.details.address || ''} ${company.details.city || ''}</div>
            <div class="sub-text">GSTIN: <strong>${company.details.gstin || 'N/A'}</strong> • Phone: ${company.details.phone || 'N/A'}</div>
          </div>
          <div>
            <div class="badge-title">OFFICIAL PAYMENT RECEIPT</div>
            <div class="voucher-num">${receiptNo}</div>
            <div class="sub-text" style="text-align: right; margin-top: 2px;">Date: <strong>${payment.date}</strong></div>
          </div>
        </div>

        <div class="details-grid">
          <div>
            <div class="field-label">Received With Thanks From:</div>
            <div class="field-val" style="font-size: 15px;">${targetClient.name}</div>
            ${targetClient.phone ? `<div class="sub-text">Phone: ${targetClient.phone}</div>` : ''}
            ${targetClient.gstin ? `<div class="sub-text">GSTIN: ${targetClient.gstin}</div>` : ''}
          </div>
          <div>
            <div class="field-label">Against Tax Invoice:</div>
            <div class="field-val">#${invoice.invoiceNumber}</div>
            <div class="sub-text">Issue Date: ${invoice.issueDate}</div>
            <div class="sub-text">Payment Mode: <strong>${payment.mode}</strong></div>
            ${payment.referenceNo ? `<div class="sub-text">Reference / UTR #: <strong>${payment.referenceNo}</strong></div>` : ''}
          </div>
        </div>

        <div class="amount-banner">
          <div class="amount-label">Amount Received (In Words & Figures)</div>
          <div class="amount-val">₹${Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          ${payment.notes ? `<div class="sub-text" style="margin-top: 6px;">Note: "${payment.notes}"</div>` : ''}
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Invoice Value (Inc. GST)</td>
              <td style="text-align: right; font-weight: bold; font-family: monospace;">₹${invoice.grandTotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td>This Receipt (${payment.mode} ${payment.referenceNo ? `• Ref: ${payment.referenceNo}` : ''})</td>
              <td style="text-align: right; font-weight: bold; font-family: monospace; color: #15803d;">+ ₹${Number(payment.amount).toFixed(2)}</td>
            </tr>
            <tr>
              <td>Total Paid to Date</td>
              <td style="text-align: right; font-weight: bold; font-family: monospace;">₹${paymentSummary.totalPaid.toFixed(2)}</td>
            </tr>
            <tr style="background: #f8fafc; font-weight: bold;">
              <td>Remaining Balance Due</td>
              <td style="text-align: right; font-family: monospace; color: ${paymentSummary.balanceDue > 0 ? '#b91c1c' : '#047857'};">
                ₹${paymentSummary.balanceDue.toFixed(2)} ${paymentSummary.balanceDue === 0 ? '(Fully Cleared)' : ''}
              </td>
            </tr>
          </tbody>
        </table>

        <div class="signatures">
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-text">Client Signature / Stamp</div>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <div class="sign-text">For ${company.details.name || 'Authorized Signatory'}</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 300);
};

/**
 * 1-Click WhatsApp payment receipt sharing.
 */
export const sharePaymentReceiptWhatsApp = (
  company: Company,
  invoice: Invoice,
  payment: InvoicePayment,
  client?: Client
) => {
  const targetClient = client || invoice.client;
  const cleanPhone = (targetClient.phone || '').replace(/[^0-9]/g, '');
  const phoneParam = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const paymentSummary = getInvoicePaymentSummary(invoice);

  const message =
    `*PAYMENT RECEIPT ACKNOWLEDGEMENT*\n\n` +
    `Dear *${targetClient.name}*,\n\n` +
    `We have received your payment of *₹${Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}* towards Invoice *#${invoice.invoiceNumber}*.\n\n` +
    `📌 *Payment Details:*\n` +
    `• *Amount Received:* ₹${Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n` +
    `• *Date:* ${payment.date}\n` +
    `• *Payment Mode:* ${payment.mode}\n` +
    (payment.referenceNo ? `• *Reference / UTR:* ${payment.referenceNo}\n` : '') +
    `\n📊 *Invoice Balance Summary:*\n` +
    `• *Total Invoice Amount:* ₹${invoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n` +
    `• *Total Received to Date:* ₹${paymentSummary.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n` +
    `• *Remaining Balance Due:* ₹${paymentSummary.balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ${paymentSummary.balanceDue === 0 ? '*(Fully Paid!)*' : ''}\n\n` +
    `Thank you for your business!\n` +
    `*${company.details.name || 'InvoicePro Merchant'}*`;

  const url = phoneParam
    ? `https://wa.me/${phoneParam}?text=${encodeURIComponent(message)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

  window.open(url, '_blank');
};
