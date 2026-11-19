import type { Invoice, Client, Company } from '../types';
import { getInvoicePaymentSummary } from './invoiceUtils';

export const sendInvoiceViaWhatsApp = (invoice: Invoice, client: Client | undefined, company: Company) => {
  const clientPhone = client?.phone?.replace(/\D/g, '') || '';
  const docNumber = invoice.invoiceNumber;
  const grandTotal = invoice.grandTotal.toFixed(2);
  const companyName = company.details?.name || 'InvoiceProIn Merchant';
  const payments = invoice.payments || [];
  const isPaid = invoice.status === 'Paid';

  let message = '';
  if (isPaid) {
    const receiptsCount = payments.length;
    const paymentsList = receiptsCount > 0 
      ? `\n🧾 *Receipts Breakdown (${receiptsCount}):*\n` + payments.map((p, i) => `• Receipt #${i + 1}: ₹${Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} on ${p.date} (${p.mode}${p.referenceNo ? ` • Ref: ${p.referenceNo}` : ''})`).join('\n') + '\n'
      : '';

    message = `Hello ${client?.name || 'Customer'},\n\n` +
      `*PAYMENT RECEIPT ACKNOWLEDGEMENT*\n` +
      `Invoice *#${docNumber}* from *${companyName}* for *₹${grandTotal}* is *FULLY PAID & SETTLED*.\n\n` +
      `📅 *Invoice Date:* ${invoice.issueDate}\n` +
      `💰 *Total Amount:* ₹${grandTotal}\n` +
      `✅ *Balance Due:* ₹0.00 (Fully Cleared)\n` +
      paymentsList +
      `\nThank you for your business!\n*${companyName}*`;
  } else {
    const paymentSummary = getInvoicePaymentSummary(invoice);
    const balanceDue = paymentSummary.balanceDue.toFixed(2);
    message = `Hello ${client?.name || 'Customer'},\n\n` +
      `Your invoice *#${docNumber}* from *${companyName}* for *₹${grandTotal}* is ready.\n\n` +
      `📅 *Issue Date:* ${invoice.issueDate}\n` +
      `⏳ *Due Date:* ${invoice.dueDate}\n` +
      `💰 *Total Amount:* ₹${grandTotal}\n` +
      (paymentSummary.totalPaid > 0 ? `💵 *Amount Paid:* ₹${paymentSummary.totalPaid.toFixed(2)}\n` : '') +
      `⚖️ *Balance Due:* ₹${balanceDue}\n\n` +
      `Please process the payment at your earliest convenience. Thank you for your business!`;
  }

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = clientPhone 
    ? `https://wa.me/${clientPhone}?text=${encodedMessage}`
    : `https://api.whatsapp.com/send?text=${encodedMessage}`;

  window.open(whatsappUrl, '_blank');
};

export const sendPaymentReminderViaWhatsApp = (invoice: Invoice, client: Client | undefined, company: Company) => {
  const clientPhone = client?.phone?.replace(/\D/g, '') || '';
  const docNumber = invoice.invoiceNumber;
  const grandTotal = invoice.grandTotal.toFixed(2);
  const companyName = company.details?.name || 'InvoiceProIn Merchant';

  const message = `⚠️ *PAYMENT REMINDER*\n\n` +
    `Dear ${client?.name || 'Customer'},\n\n` +
    `This is a friendly reminder that invoice *#${docNumber}* for *₹${grandTotal}* from *${companyName}* was due on *${invoice.dueDate}*.\n\n` +
    `📌 *Invoice Number:* #${docNumber}\n` +
    `💰 *Outstanding Balance:* ₹${grandTotal}\n\n` +
    `Kindly arrange for the payment to be settled today. If you have already paid, please ignore this notice. Thank you!`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = clientPhone 
    ? `https://wa.me/${clientPhone}?text=${encodedMessage}`
    : `https://api.whatsapp.com/send?text=${encodedMessage}`;

  window.open(whatsappUrl, '_blank');
};
