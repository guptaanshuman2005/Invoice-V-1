import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { toast } from 'sonner';
import type { Company, Invoice, Item, Client, Transporter, Quotation, RecurringInvoice, StockHistoryEntry, CompanyDetails } from '../types';

// Helper to update basic company details
export function useUpdateCompanyDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, details }: { id: string, details: CompanyDetails }) => {
      const { error } = await supabase.from('companies').update({ details }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['company', variables.id] });
      toast.success('Company details updated');
    },
    onError: (error) => toast.error(`Failed to update company: ${error.message}`)
  });
}

// Client Mutations
export function useUpsertClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ companyId, client }: { companyId: string, client: Client }) => {
      const { error } = await supabase.from('clients').upsert({
        id: client.id, company_id: companyId, name: client.name, email: client.email, phone: client.phone, address: client.address,
        city: client.city, state: client.state, zip: client.zip, gstin: client.gstin, tags: client.tags,
        shipping_address: client.shippingAddress, shipping_city: client.shippingCity, shipping_state: client.shippingState, shipping_zip: client.shippingZip
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => queryClient.invalidateQueries({ queryKey: ['company', vars.companyId] })
  });
}

export function useDeleteClients() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ companyId, ids }: { companyId: string, ids: string[] }) => {
      const { error } = await supabase.from('clients').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['company', vars.companyId] });
      toast.success('Client(s) deleted');
    }
  });
}

// Items/Inventory Mutations
export function useUpsertItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ companyId, item }: { companyId: string, item: Item }) => {
      const { error } = await supabase.from('items').upsert({
        id: item.id, company_id: companyId, name: item.name, hsn: item.hsn, price: item.price, gst_rate: item.gstRate, unit: item.unit, quantity_in_stock: item.quantityInStock
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => queryClient.invalidateQueries({ queryKey: ['company', vars.companyId] })
  });
}

export function useDeleteItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ companyId, ids }: { companyId: string, ids: string[] }) => {
      const { error } = await supabase.from('items').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
       queryClient.invalidateQueries({ queryKey: ['company', vars.companyId] });
       toast.success('Item(s) deleted');
    }
  });
}

export function useBulkStockUpdate() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: async ({ companyId, updates, stockHistory }: { companyId: string, updates: {itemId: string, newQuantity: number}[], stockHistory: StockHistoryEntry[] }) => {
         // Update items
         for (const update of updates) {
            await supabase.from('items').update({ quantity_in_stock: update.newQuantity }).eq('id', update.itemId);
         }
         // Insert history
         if (stockHistory.length > 0) {
            const mappedHistory = stockHistory.map(h => ({
               id: h.id, company_id: companyId, item_id: h.itemId, item_name: h.itemName, previous_quantity: h.previousQuantity, new_quantity: h.newQuantity, action: h.action, reference_id: h.referenceId, timestamp: h.timestamp
            }));
            await supabase.from('stock_history').insert(mappedHistory);
         }
      },
      onSuccess: (_, vars) => {
         queryClient.invalidateQueries({ queryKey: ['company', vars.companyId] });
         toast.success('Stock updated');
      }
   });
}

// Invoices
export function useSaveInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ companyId, invoice, itemsToUpdate, stockHistory, detailsToUpdate }: any) => {
      // 1. Upsert Invoice
      const invData = {
         id: invoice.id, company_id: companyId, invoice_number: invoice.invoiceNumber, client_id: invoice.client.id, issue_date: invoice.issueDate, due_date: invoice.dueDate, notes: invoice.notes, sub_total: invoice.subTotal, cgst: invoice.cgst, sgst: invoice.sgst, igst: invoice.igst, grand_total: invoice.grandTotal, status: invoice.status, selected_bank_account_id: invoice.selectedBankAccountId,
         shipping_name: invoice.shippingName, shipping_address: invoice.shippingAddress, shipping_city: invoice.shippingCity, shipping_state: invoice.shippingState, shipping_zip: invoice.shippingZip, shipping_gstin: invoice.shippingGstin
      };
      
      const { error: invErr } = await supabase.from('invoices').upsert(invData);
      if (invErr) throw invErr;

      // 2. Refresh Invoice Items (Delete old ones and add new ones)
      await supabase.from('invoice_items').delete().eq('invoice_id', invoice.id);
      if (invoice.items?.length > 0) {
         const mappedItems = invoice.items.map((i: any) => ({
             invoice_id: invoice.id, item_id: i.id, name: i.name, hsn: i.hsn, price: i.price, gst_rate: i.gstRate, unit: i.unit, quantity: i.quantity
         }));
         await supabase.from('invoice_items').insert(mappedItems);
      }

      // 3. Update related items stock
      if (itemsToUpdate && itemsToUpdate.length > 0) {
         for (const item of itemsToUpdate) {
            await supabase.from('items').update({ quantity_in_stock: item.quantityInStock }).eq('id', item.id);
         }
      }

      // 4. Record stock history
      if (stockHistory && stockHistory.length > 0) {
         const mappedHistory = stockHistory.map((h: any) => ({
             id: h.id, company_id: companyId, item_id: h.itemId, item_name: h.itemName, previous_quantity: h.previousQuantity, new_quantity: h.newQuantity, action: h.action, reference_id: h.referenceId, timestamp: h.timestamp
         }));
         await supabase.from('stock_history').insert(mappedHistory);
      }
      
      // 5. Update company details if needed (like nextInvoiceNumber)
      if (detailsToUpdate) {
          await supabase.from('companies').update({ details: detailsToUpdate }).eq('id', companyId);
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['company', vars.companyId] });
      toast.success('Invoice saved successfully');
    },
    onError: (error) => toast.error(`Failed to save invoice: ${error.message}`)
  });
}

export function useDeleteInvoices() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: async ({ companyId, ids, itemsToUpdate, stockHistory, detailsToUpdate }: any) => {
         const { error } = await supabase.from('invoices').delete().in('id', ids);
         if (error) throw error;
         
         if (itemsToUpdate && itemsToUpdate.length > 0) {
             for (const item of itemsToUpdate) {
                 await supabase.from('items').update({ quantity_in_stock: item.quantityInStock }).eq('id', item.id);
             }
         }
         
         if (stockHistory && stockHistory.length > 0) {
             const mappedHistory = stockHistory.map((h: any) => ({
                 id: h.id, company_id: companyId, item_id: h.itemId, item_name: h.itemName, previous_quantity: h.previousQuantity, new_quantity: h.newQuantity, action: h.action, reference_id: h.referenceId, timestamp: h.timestamp
             }));
             await supabase.from('stock_history').insert(mappedHistory);
         }
         
         if (detailsToUpdate) {
             await supabase.from('companies').update({ details: detailsToUpdate }).eq('id', companyId);
         }
      },
      onSuccess: (_, vars) => {
         queryClient.invalidateQueries({ queryKey: ['company', vars.companyId] });
         toast.success('Invoice(s) deleted');
      }
   });
}

export function useUpdateInvoiceStatus() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: async ({ companyId, ids, status }: { companyId: string, ids: string[], status: Invoice['status'] }) => {
         const { error } = await supabase.from('invoices').update({ status }).in('id', ids);
         if (error) throw error;
      },
      onSuccess: (_, vars) => {
         queryClient.invalidateQueries({ queryKey: ['company', vars.companyId] });
         toast.success('Status updated');
      }
   });
}
