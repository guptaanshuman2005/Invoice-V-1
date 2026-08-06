import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Invoice, Company } from '../types';

const commonStyles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, backgroundColor: '#ffffff' },
  logo: { width: 60, height: 60, objectFit: 'contain' },
  table: { width: '100%', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', marginBottom: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tableRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  col1: { width: '5%' },
  col2: { width: '35%' },
  col3: { width: '10%', textAlign: 'center' },
  col4: { width: '10%', textAlign: 'right' },
  col5: { width: '10%', textAlign: 'right' },
  col6: { width: '15%', textAlign: 'right' },
  col7: { width: '15%', textAlign: 'right' },
  headerText: { fontSize: 8, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' },
});

interface InvoicePDFProps {
  invoice: Invoice;
  company: Company;
  documentTitle?: string;
  numberToWords: (n: number) => string;
}

const ModernInvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, company, documentTitle = 'Invoice', numberToWords }) => {
  const selectedBankAccount = company.bankAccounts.find(ba => ba.id === invoice.selectedBankAccountId);
  const docNumber = invoice.invoiceNumber || (invoice as any).quotationNumber;
  const dateLabel = documentTitle === 'Quotation' ? 'Date' : 'Invoice Date';
  const validUntilLabel = documentTitle === 'Quotation' ? 'Valid Until' : 'Due Date';
  const validUntilValue = documentTitle === 'Quotation' ? ((invoice as any).validUntil || invoice.dueDate) : invoice.dueDate;

  return (
    <Document>
      <Page size="A4" style={commonStyles.page}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 }}>
          <View style={{ flexDirection: 'row', gap: 15 }}>
            {company.details?.logo && <Image src={company.details.logo} style={commonStyles.logo} />}
            <View style={{ maxWidth: 250 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a' }}>{company.details?.name || 'Company Name'}</Text>
              <Text style={{ color: '#64748b', fontSize: 9 }}>{company.details?.address || ''}</Text>
              <Text style={{ color: '#64748b', fontSize: 9 }}>{company.details?.city || ''} {company.details?.zip || ''}</Text>
              <Text style={{ color: '#64748b', fontSize: 9 }}>Tel: {company.details?.phone || 'N/A'}</Text>
              {company.details?.gstin && <Text style={{ fontWeight: 'bold', marginTop: 4, fontSize: 9 }}>GSTIN: {company.details.gstin}</Text>}
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#cbd5e1', textTransform: 'uppercase' }}>{documentTitle}</Text>
            <View style={{ marginTop: 10, padding: 10, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4 }}>
              <Text style={{ fontSize: 9, color: '#64748b' }}>{documentTitle} No: <Text style={{ color: '#0f172a', fontWeight: 'bold' }}>{docNumber}</Text></Text>
              <Text style={{ fontSize: 9, color: '#64748b' }}>{dateLabel}: <Text style={{ color: '#0f172a' }}>{invoice.issueDate}</Text></Text>
              <Text style={{ fontSize: 9, color: '#64748b' }}>{validUntilLabel}: <Text style={{ color: '#0f172a' }}>{validUntilValue}</Text></Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 40, marginBottom: 30 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Bill To</Text>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a' }}>{invoice.client?.name || 'Unknown Client'}</Text>
            <Text style={{ color: '#64748b', fontSize: 9 }}>{invoice.client?.address || ''}</Text>
            <Text style={{ color: '#64748b', fontSize: 9 }}>{invoice.client?.city || ''}, {invoice.client?.state || ''} {invoice.client?.zip || ''}</Text>
            {invoice.client?.gstin && <Text style={{ marginTop: 4, fontWeight: 'bold', fontSize: 9 }}>GSTIN: {invoice.client.gstin}</Text>}
          </View>
          {invoice.shippingName && (
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Ship To</Text>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a' }}>{invoice.shippingName}</Text>
              <Text style={{ color: '#64748b', fontSize: 9 }}>{invoice.shippingAddress}</Text>
              <Text style={{ color: '#64748b', fontSize: 9 }}>{invoice.shippingCity}, {invoice.shippingState} {invoice.shippingZip}</Text>
            </View>
          )}
        </View>

        <View style={commonStyles.table}>
          <View style={commonStyles.tableHeader}>
            <Text style={[commonStyles.col1, commonStyles.headerText]}>#</Text>
            <Text style={[commonStyles.col2, commonStyles.headerText]}>Item Description</Text>
            <Text style={[commonStyles.col3, commonStyles.headerText]}>HSN</Text>
            <Text style={[commonStyles.col4, commonStyles.headerText]}>Qty</Text>
            <Text style={[commonStyles.col5, commonStyles.headerText]}>Price</Text>
            <Text style={[commonStyles.col6, commonStyles.headerText]}>Tax</Text>
            <Text style={[commonStyles.col7, commonStyles.headerText]}>Amount</Text>
          </View>
          {invoice.items.map((item, index) => {
            const taxAmount = (item.price * item.quantity * (item.gstRate || 0)) / 100;
            return (
            <View key={index} style={commonStyles.tableRow}>
              <Text style={[commonStyles.col1, { color: '#94a3b8' }]}>{index + 1}</Text>
              <Text style={[commonStyles.col2, { fontWeight: 'bold', color: '#0f172a' }]}>{item.name}</Text>
              <Text style={[commonStyles.col3, { color: '#64748b' }]}>{item.hsn || '-'}</Text>
              <Text style={[commonStyles.col4, { color: '#0f172a' }]}>{item.quantity} {item.unit}</Text>
              <Text style={[commonStyles.col5, { color: '#0f172a' }]}>{item.price.toFixed(2)}</Text>
              <Text style={[commonStyles.col6, { color: '#64748b', fontSize: 8 }]}>{item.gstRate ? `${item.gstRate}%` : '-'}{'\n'}{taxAmount > 0 ? taxAmount.toFixed(2) : ''}</Text>
              <Text style={[commonStyles.col7, { fontWeight: 'bold', color: '#0f172a' }]}>{(item.price * item.quantity + taxAmount).toFixed(2)}</Text>
            </View>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 }}>
          <View style={{ flex: 1, marginRight: 40 }}>
            <View style={{ backgroundColor: '#f8fafc', padding: 10, borderRadius: 4, marginBottom: 15 }}>
              <Text style={{ fontSize: 7, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>Total in Words</Text>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#0f172a' }}>{numberToWords(invoice.grandTotal)}</Text>
            </View>
            {selectedBankAccount && (
              <View>
                <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Bank Details</Text>
                <Text style={{ fontSize: 9, color: '#64748b' }}>{selectedBankAccount.bankName} • {selectedBankAccount.accountNumber} • {selectedBankAccount.ifsc}</Text>
              </View>
            )}
          </View>
          <View style={{ width: 200, borderWidth: 1, borderColor: '#e2e8f0', padding: 15, borderRadius: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: '#64748b' }}>Subtotal</Text>
              <Text>Rs. {invoice.subTotal.toFixed(2)}</Text>
            </View>
            {invoice.cgst > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: '#64748b' }}>CGST</Text>
                <Text>Rs. {invoice.cgst.toFixed(2)}</Text>
              </View>
            )}
            {invoice.sgst > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: '#64748b' }}>SGST</Text>
                <Text>Rs. {invoice.sgst.toFixed(2)}</Text>
              </View>
            )}
            {invoice.igst > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: '#64748b' }}>IGST</Text>
                <Text>Rs. {invoice.igst.toFixed(2)}</Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e2e8f0' }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0f172a' }}>Total</Text>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0f172a' }}>Rs. {invoice.grandTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 'auto', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 20 }}>
          <View style={{ maxWidth: 250 }}>
            <Text style={{ fontWeight: 'bold', color: '#64748b', marginBottom: 4 }}>Terms & Conditions:</Text>
            <Text style={{ color: '#94a3b8', fontSize: 8 }}>{invoice.notes || (documentTitle === 'Quotation' ? 'Valid for 30 days.' : 'Payment due within 15 days.')}</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            {company.details?.signature && <Image src={company.details.signature} style={{ height: 40, width: 'auto', marginBottom: 5 }} />}
            <Text style={{ fontWeight: 'bold', fontSize: 10, color: '#0f172a' }}>{company.details?.name || 'Company Name'}</Text>
            <Text style={{ fontSize: 7, color: '#94a3b8', textTransform: 'uppercase', marginTop: 2 }}>Authorized Signatory</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

const TraditionalInvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, company, documentTitle = 'Invoice', numberToWords }) => {
  const selectedBankAccount = company.bankAccounts.find(ba => ba.id === invoice.selectedBankAccountId);
  const docNumber = invoice.invoiceNumber || (invoice as any).quotationNumber;
  const dateLabel = documentTitle === 'Quotation' ? 'Date' : 'Invoice Date';
  const validUntilLabel = documentTitle === 'Quotation' ? 'Valid Until' : 'Due Date';
  const validUntilValue = documentTitle === 'Quotation' ? ((invoice as any).validUntil || invoice.dueDate) : invoice.dueDate;

  return (
    <Document>
      <Page size="A4" style={{ padding: 30, fontFamily: 'Helvetica', fontSize: 9, color: '#000000', backgroundColor: '#ffffff' }}>
        <View style={{ borderWidth: 1, borderColor: '#000000', flex: 1 }}>
          
          <View style={{ borderBottomWidth: 1, borderBottomColor: '#000000', padding: 10, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 }}>{documentTitle}</Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{company.details?.name || 'Company Name'}</Text>
            <Text style={{ fontSize: 8 }}>{company.details?.address || ''}, {company.details?.city || ''} {company.details?.zip || ''}</Text>
            <Text style={{ fontSize: 8 }}>Ph: {company.details?.phone || 'N/A'} | Email: {company.details?.email || 'N/A'}</Text>
            {company.details?.gstin && <Text style={{ fontSize: 8, fontWeight: 'bold', marginTop: 2 }}>GSTIN: {company.details.gstin}</Text>}
          </View>

          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000000' }}>
            <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: '#000000', padding: 10 }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 }}>Billed To:</Text>
              <Text style={{ fontWeight: 'bold' }}>{invoice.client?.name || 'Unknown Client'}</Text>
              <Text style={{ fontSize: 8 }}>{invoice.client?.address || ''}</Text>
              <Text style={{ fontSize: 8 }}>{invoice.client?.city || ''}, {invoice.client?.state || ''} {invoice.client?.zip || ''}</Text>
              {invoice.client?.gstin && <Text style={{ fontSize: 8, fontWeight: 'bold', marginTop: 2 }}>GSTIN: {invoice.client.gstin}</Text>}
            </View>
            <View style={{ flex: 1, padding: 10 }}>
              <View style={{ flexDirection: 'row', marginBottom: 2 }}><Text style={{ width: 80, fontWeight: 'bold' }}>{documentTitle} No:</Text><Text>{docNumber}</Text></View>
              <View style={{ flexDirection: 'row', marginBottom: 2 }}><Text style={{ width: 80, fontWeight: 'bold' }}>{dateLabel}:</Text><Text>{invoice.issueDate}</Text></View>
              <View style={{ flexDirection: 'row', marginBottom: 2 }}><Text style={{ width: 80, fontWeight: 'bold' }}>{validUntilLabel}:</Text><Text>{validUntilValue}</Text></View>
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000000', backgroundColor: '#f0f0f0' }}>
              <Text style={{ width: '5%', borderRightWidth: 1, borderRightColor: '#000000', padding: 4, textAlign: 'center', fontWeight: 'bold' }}>S.No</Text>
              <Text style={{ width: '35%', borderRightWidth: 1, borderRightColor: '#000000', padding: 4, fontWeight: 'bold' }}>Description of Goods</Text>
              <Text style={{ width: '10%', borderRightWidth: 1, borderRightColor: '#000000', padding: 4, textAlign: 'center', fontWeight: 'bold' }}>HSN</Text>
              <Text style={{ width: '10%', borderRightWidth: 1, borderRightColor: '#000000', padding: 4, textAlign: 'right', fontWeight: 'bold' }}>Qty</Text>
              <Text style={{ width: '10%', borderRightWidth: 1, borderRightColor: '#000000', padding: 4, textAlign: 'right', fontWeight: 'bold' }}>Rate</Text>
              <Text style={{ width: '15%', borderRightWidth: 1, borderRightColor: '#000000', padding: 4, textAlign: 'right', fontWeight: 'bold' }}>Tax</Text>
              <Text style={{ width: '15%', padding: 4, textAlign: 'right', fontWeight: 'bold' }}>Amount</Text>
            </View>
            {invoice.items.map((item, index) => {
                const taxAmount = (item.price * item.quantity * (item.gstRate || 0)) / 100;
                return (
              <View key={index} style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000000' }}>
                <Text style={{ width: '5%', borderRightWidth: 1, borderRightColor: '#000000', padding: 4, textAlign: 'center' }}>{index + 1}</Text>
                <Text style={{ width: '35%', borderRightWidth: 1, borderRightColor: '#000000', padding: 4 }}>{item.name}</Text>
                <Text style={{ width: '10%', borderRightWidth: 1, borderRightColor: '#000000', padding: 4, textAlign: 'center' }}>{item.hsn || '-'}</Text>
                <Text style={{ width: '10%', borderRightWidth: 1, borderRightColor: '#000000', padding: 4, textAlign: 'right' }}>{item.quantity} {item.unit}</Text>
                <Text style={{ width: '10%', borderRightWidth: 1, borderRightColor: '#000000', padding: 4, textAlign: 'right' }}>{item.price.toFixed(2)}</Text>
                <Text style={{ width: '15%', borderRightWidth: 1, borderRightColor: '#000000', padding: 4, textAlign: 'right' }}>{item.gstRate ? `${item.gstRate}%` : '-'}{'\n'}{taxAmount > 0 ? taxAmount.toFixed(2) : ''}</Text>
                <Text style={{ width: '15%', padding: 4, textAlign: 'right' }}>{(item.price * item.quantity + taxAmount).toFixed(2)}</Text>
              </View>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#000000' }}>
            <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: '#000000', padding: 10 }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold', marginBottom: 2 }}>Amount in Words:</Text>
              <Text style={{ fontSize: 9, fontStyle: 'italic' }}>{numberToWords(invoice.grandTotal)}</Text>
              {selectedBankAccount && (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ fontSize: 8, fontWeight: 'bold', marginBottom: 2 }}>Bank Details:</Text>
                  <Text style={{ fontSize: 8 }}>Bank: {selectedBankAccount.bankName}</Text>
                  <Text style={{ fontSize: 8 }}>A/C No: {selectedBankAccount.accountNumber}</Text>
                  <Text style={{ fontSize: 8 }}>IFSC: {selectedBankAccount.ifsc}</Text>
                </View>
              )}
            </View>
            <View style={{ width: 200 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottomWidth: 1, borderBottomColor: '#000000' }}>
                <Text>Taxable Amount</Text>
                <Text>{invoice.subTotal.toFixed(2)}</Text>
              </View>
              {(invoice.cgst > 0 || invoice.sgst > 0) && (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottomWidth: 1, borderBottomColor: '#000000' }}>
                    <Text>Add: CGST</Text>
                    <Text>{invoice.cgst.toFixed(2)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottomWidth: 1, borderBottomColor: '#000000' }}>
                    <Text>Add: SGST</Text>
                    <Text>{invoice.sgst.toFixed(2)}</Text>
                  </View>
                </>
              )}
              {invoice.igst > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottomWidth: 1, borderBottomColor: '#000000' }}>
                  <Text>Add: IGST</Text>
                  <Text>{invoice.igst.toFixed(2)}</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 4, fontWeight: 'bold' }}>
                <Text>Total Amount</Text>
                <Text>Rs. {invoice.grandTotal.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#000000', padding: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold', marginBottom: 2 }}>Terms & Conditions:</Text>
              <Text style={{ fontSize: 8 }}>{invoice.notes || 'E. & O.E.'}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'flex-end' }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold', marginBottom: 20 }}>For {company.details?.name || 'Company Name'}</Text>
              {company.details?.signature && <Image src={company.details.signature} style={{ height: 30, width: 'auto', marginBottom: 2 }} />}
              <Text style={{ fontSize: 8, borderTopWidth: 1, borderTopColor: '#000000', paddingTop: 2 }}>Authorized Signatory</Text>
            </View>
          </View>

        </View>
      </Page>
    </Document>
  );
};

const PremiumInvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, company, documentTitle = 'Invoice', numberToWords }) => {
  const selectedBankAccount = company.bankAccounts.find(ba => ba.id === invoice.selectedBankAccountId);
  const docNumber = invoice.invoiceNumber || (invoice as any).quotationNumber;
  const dateLabel = documentTitle === 'Quotation' ? 'Date' : 'Invoice Date';
  const validUntilLabel = documentTitle === 'Quotation' ? 'Valid Until' : 'Due Date';
  const validUntilValue = documentTitle === 'Quotation' ? ((invoice as any).validUntil || invoice.dueDate) : invoice.dueDate;
  
  const brandColor = company.details?.brandColor || '#4F46E5';

  return (
    <Document>
      <Page size="A4" style={{ padding: 0, fontFamily: 'Helvetica', fontSize: 10, backgroundColor: '#ffffff' }}>
        <View style={{ backgroundColor: brandColor, padding: 40, color: '#ffffff', flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', gap: 15 }}>
            {company.details?.logo && (
              <View style={{ backgroundColor: '#ffffff', padding: 5, borderRadius: 8 }}>
                <Image src={company.details.logo} style={{ width: 50, height: 50, objectFit: 'contain' }} />
              </View>
            )}
            <View style={{ maxWidth: 250 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{company.details?.name || 'Company Name'}</Text>
              <Text style={{ fontSize: 9, opacity: 0.8, marginTop: 4 }}>{company.details?.email} | {company.details?.phone}</Text>
              {company.details?.gstin && <Text style={{ fontSize: 9, fontWeight: 'bold', marginTop: 2 }}>GSTIN: {company.details.gstin}</Text>}
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', textTransform: 'uppercase' }}>{documentTitle}</Text>
            <Text style={{ fontSize: 14, marginTop: 4 }}>#{docNumber}</Text>
          </View>
        </View>

        <View style={{ padding: 40 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 15, borderRadius: 8, marginBottom: 30 }}>
            <View>
              <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>{dateLabel}</Text>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#0f172a', marginTop: 2 }}>{invoice.issueDate}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>{validUntilLabel}</Text>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#0f172a', marginTop: 2 }}>{validUntilValue}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Amount Due</Text>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: brandColor, marginTop: 2 }}>Rs. {invoice.grandTotal.toFixed(2)}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 40, marginBottom: 30 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: brandColor, textTransform: 'uppercase', marginBottom: 6 }}>Billed To</Text>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a' }}>{invoice.client?.name || 'Unknown Client'}</Text>
              <Text style={{ color: '#64748b', fontSize: 9, marginTop: 2 }}>{invoice.client?.address || ''}</Text>
              <Text style={{ color: '#64748b', fontSize: 9 }}>{invoice.client?.city || ''}, {invoice.client?.state || ''} {invoice.client?.zip || ''}</Text>
              {invoice.client?.gstin && <Text style={{ marginTop: 4, fontWeight: 'bold', fontSize: 9, color: '#0f172a' }}>GSTIN: {invoice.client.gstin}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: brandColor, textTransform: 'uppercase', marginBottom: 6 }}>Company Details</Text>
              <Text style={{ color: '#64748b', fontSize: 9 }}>{company.details?.address || ''}</Text>
              <Text style={{ color: '#64748b', fontSize: 9 }}>{company.details?.city || ''}, {company.details?.state || ''} {company.details?.zip || ''}</Text>
            </View>
          </View>

          <View style={{ marginBottom: 30 }}>
            <View style={{ flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: brandColor, paddingBottom: 8, marginBottom: 8 }}>
              <Text style={[commonStyles.col1, { fontWeight: 'bold', color: '#0f172a' }]}>#</Text>
              <Text style={[commonStyles.col2, { fontWeight: 'bold', color: '#0f172a' }]}>Description</Text>
              <Text style={[commonStyles.col3, { fontWeight: 'bold', color: '#0f172a' }]}>HSN</Text>
              <Text style={[commonStyles.col4, { fontWeight: 'bold', color: '#0f172a' }]}>Qty</Text>
              <Text style={[commonStyles.col5, { fontWeight: 'bold', color: '#0f172a' }]}>Price</Text>
              <Text style={[commonStyles.col6, { fontWeight: 'bold', color: '#0f172a' }]}>Tax</Text>
              <Text style={[commonStyles.col7, { fontWeight: 'bold', color: '#0f172a' }]}>Total</Text>
            </View>
            {invoice.items.map((item, index) => {
              const taxAmount = (item.price * item.quantity * (item.gstRate || 0)) / 100;
              return (
              <View key={index} style={{ flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <Text style={[commonStyles.col1, { color: '#94a3b8' }]}>{index + 1}</Text>
                <Text style={[commonStyles.col2, { fontWeight: 'bold', color: '#0f172a' }]}>{item.name}</Text>
                <Text style={[commonStyles.col3, { color: '#64748b' }]}>{item.hsn || '-'}</Text>
                <Text style={[commonStyles.col4, { color: '#64748b' }]}>{item.quantity} {item.unit}</Text>
                <Text style={[commonStyles.col5, { color: '#64748b' }]}>{item.price.toFixed(2)}</Text>
                <Text style={[commonStyles.col6, { color: '#64748b', fontSize: 8 }]}>{item.gstRate ? `${item.gstRate}%` : '-'}{'\n'}{taxAmount > 0 ? taxAmount.toFixed(2) : ''}</Text>
                <Text style={[commonStyles.col7, { fontWeight: 'bold', color: '#0f172a' }]}>{(item.price * item.quantity + taxAmount).toFixed(2)}</Text>
              </View>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, marginRight: 40 }}>
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 8, fontWeight: 'bold', color: brandColor, textTransform: 'uppercase', marginBottom: 4 }}>Amount in Words</Text>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#0f172a' }}>{numberToWords(invoice.grandTotal)}</Text>
              </View>
              {selectedBankAccount && (
                <View style={{ backgroundColor: '#f8fafc', padding: 10, borderRadius: 8 }}>
                  <Text style={{ fontSize: 8, fontWeight: 'bold', color: brandColor, textTransform: 'uppercase', marginBottom: 4 }}>Payment Details</Text>
                  <Text style={{ fontSize: 9, color: '#0f172a' }}>Bank: {selectedBankAccount.bankName}</Text>
                  <Text style={{ fontSize: 9, color: '#0f172a' }}>A/C No: {selectedBankAccount.accountNumber}</Text>
                  <Text style={{ fontSize: 9, color: '#0f172a' }}>IFSC: {selectedBankAccount.ifsc}</Text>
                </View>
              )}
            </View>
            <View style={{ width: 200 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: '#64748b' }}>Subtotal</Text>
                <Text>Rs. {invoice.subTotal.toFixed(2)}</Text>
              </View>
              {(invoice.cgst > 0 || invoice.sgst > 0) && (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ color: '#64748b' }}>CGST</Text>
                    <Text>Rs. {invoice.cgst.toFixed(2)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ color: '#64748b' }}>SGST</Text>
                    <Text>Rs. {invoice.sgst.toFixed(2)}</Text>
                  </View>
                </>
              )}
              {invoice.igst > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ color: '#64748b' }}>IGST</Text>
                  <Text>Rs. {invoice.igst.toFixed(2)}</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: brandColor, color: '#ffffff', padding: 10, borderRadius: 8, marginTop: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Total</Text>
                <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Rs. {invoice.grandTotal.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 20 }}>
            <View style={{ maxWidth: 250 }}>
              <Text style={{ fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>Notes:</Text>
              <Text style={{ color: '#64748b', fontSize: 9 }}>{invoice.notes || 'Thank you for your business.'}</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              {company.details?.signature && <Image src={company.details.signature} style={{ height: 40, width: 'auto', marginBottom: 5 }} />}
              <Text style={{ fontWeight: 'bold', fontSize: 10, color: '#0f172a' }}>{company.details?.name || 'Company Name'}</Text>
              <Text style={{ fontSize: 7, color: '#94a3b8', textTransform: 'uppercase', marginTop: 2 }}>Authorized Signatory</Text>
            </View>
          </View>

        </View>
      </Page>
    </Document>
  );
};

const CustomInvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, company, documentTitle = 'Invoice', numberToWords }) => {
  const selectedBankAccount = company.bankAccounts.find(ba => ba.id === invoice.selectedBankAccountId);
  const docNumber = invoice.invoiceNumber || (invoice as any).quotationNumber;
  const dateLabel = documentTitle === 'Quotation' ? 'Date' : 'Invoice Date';
  const validUntilLabel = documentTitle === 'Quotation' ? 'Valid Until' : 'Due Date';
  const validUntilValue = documentTitle === 'Quotation' ? ((invoice as any).validUntil || invoice.dueDate) : invoice.dueDate;

  const brandColor = company.details?.brandColor || '#4F46E5';
  const showShipping = company.details?.showShipping !== false;
  const showHsn = company.details?.showHsn !== false;
  const showDiscount = company.details?.showDiscount === true;
  const showTerms = company.details?.showTerms !== false;
  const showQr = company.details?.showQr === true;
  const logoPosition = company.details?.logoPosition || 'Left';
  const fontFamily = company.details?.fontFamily || 'Helvetica';
  const tablePadding = company.details?.tablePadding || 'Normal';
  const accentStyle = company.details?.accentStyle || 'Line';

  // Construct standard UPI Pay link
  let upiUrl = '';
  if (selectedBankAccount) {
    const payeeName = encodeURIComponent(company.details?.name || 'InvoicePay');
    const upiAddress = `${selectedBankAccount.accountNumber}@${selectedBankAccount.ifsc}.ifsc.npci`;
    const amount = invoice.grandTotal.toFixed(2);
    upiUrl = `upi://pay?pa=${upiAddress}&pn=${payeeName}&am=${amount}&cu=INR`;
  }

  const qrCodeUrl = upiUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiUrl)}` : '';

  const col1Width = '5%';
  const col2Width = showHsn ? (showDiscount ? '30%' : '35%') : (showDiscount ? '40%' : '45%');
  const col3Width = '10%';
  const col4Width = '10%';
  const col5Width = '10%';
  const col6Width = showDiscount ? '10%' : '15%';
  const col7Width = '15%';

  const cellPadding = tablePadding === 'Compact' ? 4 : tablePadding === 'Spacious' ? 12 : 8;

  return (
    <Document>
      <Page size="A4" style={[
        commonStyles.page, 
        { 
          fontFamily: fontFamily,
          borderWidth: accentStyle === 'Frame' ? 3 : 0,
          borderColor: brandColor
        }
      ]}>
        {/* Header Block */}
        <View style={{ 
          flexDirection: logoPosition === 'Right' ? 'row-reverse' : 'row', 
          justifyContent: 'space-between', 
          marginBottom: 30,
          borderBottomWidth: accentStyle === 'Line' ? 2 : accentStyle === 'Frame' ? 1 : 0,
          borderBottomColor: brandColor,
          paddingBottom: 15
        }}>
          <View style={{ flexDirection: 'row', gap: 15 }}>
            {company.details?.logo && <Image src={company.details.logo} style={commonStyles.logo} />}
            <View style={{ maxWidth: 250 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a' }}>{company.details?.name || 'Company Name'}</Text>
              <Text style={{ color: '#64748b', fontSize: 9 }}>{company.details?.address || ''}</Text>
              <Text style={{ color: '#64748b', fontSize: 9 }}>{company.details?.city || ''} {company.details?.zip || ''}</Text>
              <Text style={{ color: '#64748b', fontSize: 9 }}>Tel: {company.details?.phone || 'N/A'}</Text>
              {company.details?.gstin && <Text style={{ fontWeight: 'bold', marginTop: 4, fontSize: 9 }}>GSTIN: {company.details.gstin}</Text>}
            </View>
          </View>
          <View style={{ alignItems: logoPosition === 'Right' ? 'flex-start' : 'flex-end' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: brandColor, textTransform: 'uppercase' }}>{documentTitle}</Text>
            <View style={{ marginTop: 10, padding: 8, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, backgroundColor: '#f8fafc' }}>
              <Text style={{ fontSize: 9, color: '#64748b' }}>{documentTitle} No: <Text style={{ color: '#0f172a', fontWeight: 'bold' }}>{docNumber}</Text></Text>
              <Text style={{ fontSize: 9, color: '#64748b' }}>{dateLabel}: <Text style={{ color: '#0f172a' }}>{invoice.issueDate}</Text></Text>
              <Text style={{ fontSize: 9, color: '#64748b' }}>{validUntilLabel}: <Text style={{ color: '#0f172a' }}>{validUntilValue}</Text></Text>
            </View>
          </View>
        </View>

        {/* Billing / Shipping Block */}
        <View style={{ flexDirection: 'row', gap: 40, marginBottom: 30 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Bill To</Text>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a' }}>{invoice.client?.name || 'Unknown Client'}</Text>
            <Text style={{ color: '#64748b', fontSize: 9 }}>{invoice.client?.address || ''}</Text>
            <Text style={{ color: '#64748b', fontSize: 9 }}>{invoice.client?.city || ''}, {invoice.client?.state || ''} {invoice.client?.zip || ''}</Text>
            {invoice.client?.gstin && <Text style={{ marginTop: 4, fontWeight: 'bold', fontSize: 9 }}>GSTIN: {invoice.client.gstin}</Text>}
          </View>
          {showShipping && invoice.shippingName && (
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Ship To</Text>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a' }}>{invoice.shippingName}</Text>
              <Text style={{ color: '#64748b', fontSize: 9 }}>{invoice.shippingAddress}</Text>
              <Text style={{ color: '#64748b', fontSize: 9 }}>{invoice.shippingCity}, {invoice.shippingState} {invoice.shippingZip}</Text>
            </View>
          )}
        </View>

        {/* Table Block */}
        <View style={commonStyles.table}>
          <View style={[commonStyles.tableHeader, { backgroundColor: brandColor, padding: cellPadding }]}>
            <Text style={[{ width: col1Width }, commonStyles.headerText, { color: '#ffffff' }]}>#</Text>
            <Text style={[{ width: col2Width }, commonStyles.headerText, { color: '#ffffff' }]}>Item Description</Text>
            {showHsn && <Text style={[{ width: col3Width }, commonStyles.headerText, { color: '#ffffff' }]}>HSN</Text>}
            <Text style={[{ width: col4Width }, commonStyles.headerText, { color: '#ffffff' }]}>Qty</Text>
            <Text style={[{ width: col5Width }, commonStyles.headerText, { color: '#ffffff' }]}>Price</Text>
            {showDiscount && <Text style={[{ width: col6Width }, commonStyles.headerText, { color: '#ffffff' }]}>Disc</Text>}
            <Text style={[{ width: col6Width }, commonStyles.headerText, { color: '#ffffff' }]}>Tax</Text>
            <Text style={[{ width: col7Width }, commonStyles.headerText, { color: '#ffffff' }]}>Amount</Text>
          </View>
          {invoice.items.map((item, index) => {
            const taxAmount = (item.price * item.quantity * (item.gstRate || 0)) / 100;
            return (
              <View key={index} style={[commonStyles.tableRow, { padding: cellPadding }]}>
                <Text style={[{ width: col1Width }, { color: '#94a3b8' }]}>{index + 1}</Text>
                <Text style={[{ width: col2Width }, { fontWeight: 'bold', color: '#0f172a' }]}>{item.name}</Text>
                {showHsn && <Text style={[{ width: col3Width }, { color: '#64748b', textAlign: 'center' }]}>{item.hsn || '-'}</Text>}
                <Text style={[{ width: col4Width }, { color: '#0f172a', textAlign: 'right' }]}>{item.quantity} {item.unit}</Text>
                <Text style={[{ width: col5Width }, { color: '#0f172a', textAlign: 'right' }]}>{item.price.toFixed(2)}</Text>
                {showDiscount && <Text style={[{ width: col6Width }, { color: '#64748b', textAlign: 'right' }]}>0%</Text>}
                <Text style={[{ width: col6Width }, { color: '#64748b', fontSize: 8, textAlign: 'right' }]}>{item.gstRate ? `${item.gstRate}%` : '-'}{'\n'}{taxAmount > 0 ? taxAmount.toFixed(2) : ''}</Text>
                <Text style={[{ width: col7Width }, { fontWeight: 'bold', color: '#0f172a', textAlign: 'right' }]}>{(item.price * item.quantity + taxAmount).toFixed(2)}</Text>
              </View>
            );
          })}
        </View>

        {/* Totals & QR Block */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 }}>
          <View style={{ flex: 1, marginRight: 40 }}>
            <View style={{ backgroundColor: '#f8fafc', padding: 10, borderRadius: 6, marginBottom: 15, borderLeftWidth: 3, borderLeftColor: brandColor }}>
              <Text style={{ fontSize: 7, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>Total in Words</Text>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#0f172a' }}>{numberToWords(invoice.grandTotal)}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 15, alignItems: 'center' }}>
              {selectedBankAccount && (
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Bank Details</Text>
                  <Text style={{ fontSize: 9, color: '#0f172a', fontWeight: 'bold' }}>{selectedBankAccount.bankName}</Text>
                  <Text style={{ fontSize: 8, color: '#64748b' }}>A/c: {selectedBankAccount.accountNumber}</Text>
                  <Text style={{ fontSize: 8, color: '#64748b' }}>IFSC: {selectedBankAccount.ifsc}</Text>
                </View>
              )}
              {showQr && qrCodeUrl && (
                <View style={{ alignItems: 'center', padding: 6, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, backgroundColor: '#ffffff' }}>
                  <Image src={qrCodeUrl} style={{ width: 60, height: 60 }} />
                  <Text style={{ fontSize: 6, color: '#64748b', marginTop: 3, fontWeight: 'bold' }}>Scan to Pay via UPI</Text>
                </View>
              )}
            </View>
          </View>
          <View style={{ width: 200, borderWidth: 1, borderColor: '#e2e8f0', padding: 15, borderRadius: 8, backgroundColor: '#f8fafc' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: '#64748b', fontSize: 9 }}>Subtotal</Text>
              <Text style={{ fontSize: 9 }}>Rs. {invoice.subTotal.toFixed(2)}</Text>
            </View>
            {invoice.cgst > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: '#64748b', fontSize: 9 }}>CGST</Text>
                <Text style={{ fontSize: 9 }}>Rs. {invoice.cgst.toFixed(2)}</Text>
              </View>
            )}
            {invoice.sgst > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: '#64748b', fontSize: 9 }}>SGST</Text>
                <Text style={{ fontSize: 9 }}>Rs. {invoice.sgst.toFixed(2)}</Text>
              </View>
            )}
            {invoice.igst > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: '#64748b', fontSize: 9 }}>IGST</Text>
                <Text style={{ fontSize: 9 }}>Rs. {invoice.igst.toFixed(2)}</Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e2e8f0' }}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0f172a' }}>Total</Text>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: brandColor }}>Rs. {invoice.grandTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Footer / Terms Block */}
        <View style={{ marginTop: 'auto', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 20 }}>
          <View style={{ maxWidth: 250 }}>
            {showTerms && (
              <>
                <Text style={{ fontWeight: 'bold', color: '#64748b', marginBottom: 4, fontSize: 8 }}>Terms & Conditions:</Text>
                <Text style={{ color: '#94a3b8', fontSize: 8 }}>{invoice.notes || (documentTitle === 'Quotation' ? 'Valid for 30 days.' : 'Payment due within 15 days.')}</Text>
              </>
            )}
          </View>
          <View style={{ alignItems: 'center' }}>
            {company.details?.signature && <Image src={company.details.signature} style={{ height: 40, width: 'auto', marginBottom: 5 }} />}
            <Text style={{ fontWeight: 'bold', fontSize: 10, color: '#0f172a' }}>{company.details?.name || 'Company Name'}</Text>
            <Text style={{ fontSize: 7, color: '#94a3b8', textTransform: 'uppercase', marginTop: 2 }}>Authorized Signatory</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, company, documentTitle = 'Invoice', numberToWords }) => {
  const template = company.details?.invoiceTemplate || 'modern';
  
  if (template === 'traditional' || template === 'classic') {
    return <TraditionalInvoicePDF invoice={invoice} company={company} documentTitle={documentTitle} numberToWords={numberToWords} />;
  }
  
  if (template === 'premium' || template === 'minimal') {
    return <PremiumInvoicePDF invoice={invoice} company={company} documentTitle={documentTitle} numberToWords={numberToWords} />;
  }

  if (template === 'custom') {
    return <CustomInvoicePDF invoice={invoice} company={company} documentTitle={documentTitle} numberToWords={numberToWords} />;
  }

  if (template === 'tally') {
    return <TallyInvoicePDF invoice={invoice} company={company} documentTitle={documentTitle} numberToWords={numberToWords} />;
  }
  
  return <ModernInvoicePDF invoice={invoice} company={company} documentTitle={documentTitle} numberToWords={numberToWords} />;
};

const TallyInvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, company, documentTitle = 'Invoice', numberToWords }) => {
  const selectedBankAccount = company.bankAccounts.find(ba => ba.id === invoice.selectedBankAccountId);
  const docNumber = invoice.invoiceNumber || (invoice as any).quotationNumber;
  const dateLabel = documentTitle === 'Quotation' ? 'Date' : 'Invoice Date';
  const borderCol = '#1e293b';

  return (
    <Document>
      <Page size="A4" style={{ padding: 25, fontFamily: 'Helvetica', fontSize: 8, backgroundColor: '#ffffff' }}>
        
        {/* Outer Frame */}
        <View style={{ border: `1px solid ${borderCol}`, flexGrow: 1, flexDirection: 'column' }}>
          
          {/* Top Title Bar */}
          <View style={{ borderBottom: `1px solid ${borderCol}`, padding: 4, alignItems: 'center', backgroundColor: '#f1f5f9' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 10, letterSpacing: 1 }}>{documentTitle.toUpperCase()}</Text>
          </View>

          {/* Header Split Section */}
          <View style={{ flexDirection: 'row', borderBottom: `1px solid ${borderCol}`, minHeight: 100 }}>
            {/* Left: Company Details */}
            <View style={{ flex: 1, padding: 6, borderRight: `1px solid ${borderCol}` }}>
              <Text style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 2 }}>{company.details?.name || 'Company Name'}</Text>
              <Text style={{ color: '#475569', marginBottom: 1 }}>{company.details?.address || ''}</Text>
              <Text style={{ color: '#475569', marginBottom: 1 }}>{company.details?.city || ''} - {company.details?.zip || ''}, {company.details?.state || ''}</Text>
              <Text style={{ color: '#475569', marginBottom: 3 }}>Phone: {company.details?.phone || 'N/A'}</Text>
              {company.details?.gstin && (
                <Text style={{ fontWeight: 'bold', marginTop: 2 }}>GSTIN/UIN: {company.details.gstin}</Text>
              )}
            </View>
            {/* Right: Invoice Metadata */}
            <View style={{ flex: 1, flexDirection: 'column' }}>
              <View style={{ flexDirection: 'row', borderBottom: `1px solid ${borderCol}`, flex: 1 }}>
                <View style={{ flex: 1, padding: 4, borderRight: `1px solid ${borderCol}` }}>
                  <Text style={{ color: '#64748b', fontSize: 7 }}>Invoice No.</Text>
                  <Text style={{ fontWeight: 'bold', marginTop: 2 }}>{docNumber}</Text>
                </View>
                <View style={{ flex: 1, padding: 4 }}>
                  <Text style={{ color: '#64748b', fontSize: 7 }}>Dated</Text>
                  <Text style={{ fontWeight: 'bold', marginTop: 2 }}>{invoice.issueDate}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', borderBottom: `1px solid ${borderCol}`, flex: 1 }}>
                <View style={{ flex: 1, padding: 4, borderRight: `1px solid ${borderCol}` }}>
                  <Text style={{ color: '#64748b', fontSize: 7 }}>Delivery Note</Text>
                  <Text style={{ marginTop: 2 }}>N/A</Text>
                </View>
                <View style={{ flex: 1, padding: 4 }}>
                  <Text style={{ color: '#64748b', fontSize: 7 }}>Mode/Terms of Payment</Text>
                  <Text style={{ marginTop: 2 }}>Immediate / Net Bank</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', flex: 1 }}>
                <View style={{ flex: 1, padding: 4, borderRight: `1px solid ${borderCol}` }}>
                  <Text style={{ color: '#64748b', fontSize: 7 }}>Buyer's Order No.</Text>
                  <Text style={{ marginTop: 2 }}>N/A</Text>
                </View>
                <View style={{ flex: 1, padding: 4 }}>
                  <Text style={{ color: '#64748b', fontSize: 7 }}>Dated</Text>
                  <Text style={{ marginTop: 2 }}>N/A</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Consignee & Buyer Split Section */}
          <View style={{ flexDirection: 'row', borderBottom: `1px solid ${borderCol}`, minHeight: 80 }}>
            {/* Buyer Details */}
            <View style={{ flex: 1, padding: 6, borderRight: `1px solid ${borderCol}` }}>
              <Text style={{ color: '#64748b', fontSize: 7, textTransform: 'uppercase', marginBottom: 2 }}>Buyer (Bill to)</Text>
              <Text style={{ fontWeight: 'bold', fontSize: 9 }}>{invoice.client?.name || 'Unknown Client'}</Text>
              <Text style={{ color: '#475569' }}>{invoice.client?.address || ''}</Text>
              <Text style={{ color: '#475569' }}>{invoice.client?.city || ''}, {invoice.client?.state || ''} {invoice.client?.zip || ''}</Text>
              {invoice.client?.gstin && <Text style={{ fontWeight: 'bold', marginTop: 4 }}>GSTIN/UIN: {invoice.client.gstin}</Text>}
            </View>
            {/* Consignee / Dispatch Details */}
            <View style={{ flex: 1, padding: 6 }}>
              <Text style={{ color: '#64748b', fontSize: 7, textTransform: 'uppercase', marginBottom: 2 }}>Consignee (Ship to)</Text>
              {invoice.shippingName ? (
                <>
                  <Text style={{ fontWeight: 'bold', fontSize: 9 }}>{invoice.shippingName}</Text>
                  <Text style={{ color: '#475569' }}>{invoice.shippingAddress}</Text>
                  <Text style={{ color: '#475569' }}>{invoice.shippingCity}, {invoice.shippingState} {invoice.shippingZip}</Text>
                </>
              ) : (
                <Text style={{ color: '#94a3b8', fontStyle: 'italic' }}>Same as Billing Address</Text>
              )}
            </View>
          </View>

          {/* Main Table */}
          <View style={{ flexGrow: 1, flexDirection: 'column' }}>
            <View style={{ flexDirection: 'row', borderBottom: `1px solid ${borderCol}`, backgroundColor: '#f8fafc', paddingVertical: 4 }}>
              <Text style={{ width: '8%', textAlign: 'center', fontWeight: 'bold' }}>Sl No.</Text>
              <Text style={{ width: '42%', paddingLeft: 6, fontWeight: 'bold' }}>Description of Goods</Text>
              <Text style={{ width: '12%', textAlign: 'center', fontWeight: 'bold' }}>HSN/SAC</Text>
              <Text style={{ width: '12%', textAlign: 'right', fontWeight: 'bold' }}>Quantity</Text>
              <Text style={{ width: '12%', textAlign: 'right', fontWeight: 'bold' }}>Rate</Text>
              <Text style={{ width: '14%', textAlign: 'right', paddingRight: 6, fontWeight: 'bold' }}>Amount</Text>
            </View>

            {invoice.items.map((item, index) => {
              const itemTotal = item.price * item.quantity;
              return (
                <View key={index} style={{ flexDirection: 'row', paddingVertical: 5, borderBottom: `1px solid #f1f5f9` }}>
                  <Text style={{ width: '8%', textAlign: 'center' }}>{index + 1}</Text>
                  <Text style={{ width: '42%', paddingLeft: 6, fontWeight: 'bold' }}>{item.name}</Text>
                  <Text style={{ width: '12%', textAlign: 'center' }}>{item.hsn || '-'}</Text>
                  <Text style={{ width: '12%', textAlign: 'right' }}>{item.quantity} {item.unit}</Text>
                  <Text style={{ width: '12%', textAlign: 'right' }}>{item.price.toFixed(2)}</Text>
                  <Text style={{ width: '14%', textAlign: 'right', paddingRight: 6, fontWeight: 'bold' }}>{itemTotal.toFixed(2)}</Text>
                </View>
              );
            })}

            <View style={{ flexGrow: 1 }} />

            <View style={{ flexDirection: 'row', borderTop: `1px solid ${borderCol}`, borderBottom: `1px solid ${borderCol}`, paddingVertical: 4, backgroundColor: '#f8fafc' }}>
              <Text style={{ width: '8%' }}></Text>
              <Text style={{ width: '42%', paddingLeft: 6, fontWeight: 'bold' }}>Total</Text>
              <Text style={{ width: '12%' }}></Text>
              <Text style={{ width: '12%', textAlign: 'right', fontWeight: 'bold' }}>
                {invoice.items.reduce((sum, item) => sum + item.quantity, 0)} pcs
              </Text>
              <Text style={{ width: '12%' }}></Text>
              <Text style={{ width: '14%', textAlign: 'right', paddingRight: 6, fontWeight: 'bold' }}>
                ₹{invoice.subTotal.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* GST Tax Breakdown */}
          <View style={{ borderBottom: `1px solid ${borderCol}`, padding: 6 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 7, textTransform: 'uppercase', marginBottom: 4 }}>Tax Amount (in words):</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 8, color: '#0f172a' }}>
              INR {numberToWords(invoice.cgst + invoice.sgst + invoice.igst)} Only
            </Text>

            <View style={{ marginTop: 6, borderWidth: 1, borderColor: borderCol }}>
              <View style={{ flexDirection: 'row', backgroundColor: '#f1f5f9', borderBottomWidth: 1, borderBottomColor: borderCol, paddingVertical: 2 }}>
                <Text style={{ width: '40%', fontWeight: 'bold', paddingLeft: 4 }}>Taxable Value</Text>
                <Text style={{ width: '20%', fontWeight: 'bold', textAlign: 'right' }}>CGST Rate/Amt</Text>
                <Text style={{ width: '20%', fontWeight: 'bold', textAlign: 'right' }}>SGST Rate/Amt</Text>
                <Text style={{ width: '20%', fontWeight: 'bold', textAlign: 'right', paddingRight: 4 }}>Total Tax</Text>
              </View>
              <View style={{ flexDirection: 'row', paddingVertical: 2 }}>
                <Text style={{ width: '40%', paddingLeft: 4 }}>₹{invoice.subTotal.toFixed(2)}</Text>
                <Text style={{ width: '20%', textAlign: 'right' }}>₹{invoice.cgst.toFixed(2)}</Text>
                <Text style={{ width: '20%', textAlign: 'right' }}>₹{invoice.sgst.toFixed(2)}</Text>
                <Text style={{ width: '20%', textAlign: 'right', paddingRight: 4, fontWeight: 'bold' }}>
                  ₹{(invoice.cgst + invoice.sgst + invoice.igst).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>

          {/* Bank & Grand Total words */}
          <View style={{ flexDirection: 'row', borderBottom: `1px solid ${borderCol}` }}>
            <View style={{ flex: 1, padding: 6, borderRight: `1px solid ${borderCol}` }}>
              {selectedBankAccount && (
                <>
                  <Text style={{ color: '#64748b', fontSize: 7, textTransform: 'uppercase' }}>Company's Bank Details:</Text>
                  <Text style={{ fontWeight: 'bold', marginTop: 2 }}>Bank Name: {selectedBankAccount.bankName}</Text>
                  <Text>A/c No.: {selectedBankAccount.accountNumber}</Text>
                  <Text>IFSC Code: {selectedBankAccount.ifsc}</Text>
                </>
              )}
            </View>
            <View style={{ flex: 1, padding: 6 }}>
              <Text style={{ color: '#64748b', fontSize: 7, textTransform: 'uppercase' }}>Amount Chargeable (in words):</Text>
              <Text style={{ fontWeight: 'bold', fontSize: 8, marginTop: 2 }}>
                INR {numberToWords(invoice.grandTotal)} Only
              </Text>
            </View>
          </View>

          {/* Signatures */}
          <View style={{ flexDirection: 'row', minHeight: 60 }}>
            <View style={{ flex: 1.2, padding: 6, borderRight: `1px solid ${borderCol}` }}>
              <Text style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 2 }}>Declaration:</Text>
              <Text style={{ color: '#475569', fontSize: 6.5 }}>
                We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
              </Text>
            </View>
            <View style={{ flex: 0.8, padding: 6, flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontWeight: 'bold', fontSize: 7 }}>for {company.details?.name || 'Company Name'}</Text>
              {company.details?.signature && (
                <Image src={company.details.signature} style={{ height: 25, width: 'auto' }} />
              )}
              <Text style={{ fontSize: 7, borderTop: '1px solid #cbd5e1', width: '100%', textAlign: 'center', paddingTop: 2 }}>
                Authorized Signatory
              </Text>
            </View>
          </View>

        </View>
      </Page>
    </Document>
  );
};

