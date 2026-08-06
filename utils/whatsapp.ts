import type { Invoice, Client, Company } from '../types';

export const sendInvoiceViaWhatsApp = (invoice: Invoice, client: Client | undefined, company: Company) => {
  const clientPhone = client?.phone?.replace(/\D/g, '') || '';
  const docNumber = invoice.invoiceNumber;
  const grandTotal = invoice.grandTotal.toFixed(2);
  const companyName = company.details?.name || 'InvoicePro Merchant';

  const message = `Hello ${client?.name || 'Customer'},\n\n` +
    `Your invoice *#${docNumber}* from *${companyName}* for *₹${grandTotal}* is ready.\n\n` +
    `📅 *Issue Date:* ${invoice.issueDate}\n` +
    `⏳ *Due Date:* ${invoice.dueDate}\n` +
    `💰 *Amount Due:* ₹${grandTotal}\n\n` +
    `Please process the payment at your earliest convenience. Thank you for your business!`;

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
  const companyName = company.details?.name || 'InvoicePro Merchant';

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
