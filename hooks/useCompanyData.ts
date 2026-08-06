import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import type { Company, Invoice, Quotation } from '../types';
import { toast } from 'sonner';

// Helper to transform the flat DB response into the nested TypeScript shape if needed
const transformCompanyData = (data: any): Company => {
  if (!data) return data;
  return {
    ...data,
    ownerId: data.owner_id,
    bankAccounts: data.bank_accounts || [],
    stockHistory: data.stock_history ? data.stock_history.map((sh: any) => ({
      ...sh,
      itemId: sh.item_id,
      itemName: sh.item_name,
      previousQuantity: sh.previous_quantity,
      newQuantity: sh.new_quantity,
      referenceId: sh.reference_id
    })) : [],
    invoices: data.invoices ? data.invoices.map((inv: any) => ({
      ...inv,
      invoiceNumber: inv.invoice_number,
      clientId: inv.client_id,
      issueDate: inv.issue_date,
      dueDate: inv.due_date,
      subTotal: inv.sub_total,
      grandTotal: inv.grand_total,
      selectedBankAccountId: inv.selected_bank_account_id,
      shippingName: inv.shipping_name,
      shippingAddress: inv.shipping_address,
      shippingCity: inv.shipping_city,
      shippingState: inv.shipping_state,
      shippingZip: inv.shipping_zip,
      shippingGstin: inv.shipping_gstin,
      transporterName: inv.transporter_name,
      transporterGstin: inv.transporter_gstin,
      vehicleNumber: inv.vehicle_number,
      ewayBillNumber: inv.eway_bill_number,
      // Handle the relation (Supabase returns an array for to-one relationships if not configured as 1:1, or object if it is. Often it's an object if foreign key is on invoices)
      client: inv.clients, 
      items: inv.invoice_items ? inv.invoice_items.map((i: any) => ({
          ...i,
          itemId: i.item_id,
          gstRate: i.gst_rate
      })) : []
    })) : [],
    quotations: data.quotations ? data.quotations.map((q: any) => ({
      ...q,
      quotationNumber: q.quotation_number,
      clientId: q.client_id,
      issueDate: q.issue_date,
      dueDate: q.due_date,
      validUntil: q.valid_until,
      subTotal: q.sub_total,
      grandTotal: q.grand_total,
      selectedBankAccountId: q.selected_bank_account_id,
      shippingName: q.shipping_name,
      shippingAddress: q.shipping_address,
      shippingCity: q.shipping_city,
      shippingState: q.shipping_state,
      shippingZip: q.shipping_zip,
      shippingGstin: q.shipping_gstin,
      transporterName: q.transporter_name,
      transporterGstin: q.transporter_gstin,
      vehicleNumber: q.vehicle_number,
      ewayBillNumber: q.eway_bill_number,
      client: q.clients,
      items: q.quotation_items ? q.quotation_items.map((i: any) => ({
          ...i,
          itemId: i.item_id,
          gstRate: i.gst_rate
      })) : []
    })) : [],
    recurringInvoices: data.recurring_invoices ? data.recurring_invoices.map((r: any) => ({
       ...r,
       clientId: r.client_id,
       startDate: r.start_date,
       endDate: r.end_date,
       nextRunDate: r.next_run_date,
       lastRunDate: r.last_run_date,
       client: r.clients,
       items: r.recurring_invoice_items ? r.recurring_invoice_items.map((i: any) => ({
           ...i,
           itemId: i.item_id,
           gstRate: i.gst_rate
       })) : []
    })) : [],
    items: data.items ? data.items.map((i: any) => ({
      ...i,
      gstRate: i.gst_rate,
      quantityInStock: i.quantity_in_stock
    })) : [],
    clients: data.clients ? data.clients.map((c: any) => ({
      ...c,
      shippingAddress: c.shipping_address,
      shippingCity: c.shipping_city,
      shippingState: c.shipping_state,
      shippingZip: c.shipping_zip
    })) : [],
    transporters: data.transporters || []
  };
};

export function useCompanyData(companyId: string | null) {
  return useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          clients (*),
          items (*),
          invoices (*, clients (*), invoice_items (*)),
          bank_accounts (*),
          transporters (*),
          stock_history (*),
          recurring_invoices (*, clients (*), recurring_invoice_items (*)),
          quotations (*, clients (*), quotation_items (*))
        `)
        .eq('id', companyId)
        .single();

      if (error) throw error;
      return transformCompanyData(data);
    },
    enabled: !!companyId,
  });
}
