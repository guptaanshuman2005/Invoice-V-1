import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import type { Company } from '../types';
import { toast } from 'sonner';

/**
 * A drop-in relational bridge replacement for the original useSupabaseCompanies.
 * It manages robust backend fetching and transparently fragments the NoSQL `Company` state 
 * into our strict PostgreSQL tables!
 */
export function useSupabaseCompanies(userId: string | undefined): [Company[], (value: any) => void, boolean] {
  const [companies, setCompaniesState] = useState<Company[]>([]);
  const [loading, setLoading] = useState(!!userId);

  // 1. Robust Fetching Logic parsing relational joins into the NoSQL 'Company' type shape
  const fetchCompanies = async () => {
    if (!userId) {
      setCompaniesState([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          clients (*),
          items (*),
          bank_accounts (*),
          transporters (*),
          stock_history (*),
          invoices (*, clients (*), invoice_items (*)),
          quotations (*, clients (*), quotation_items (*)),
          recurring_invoices (*, clients (*), recurring_invoice_items (*))
        `)
        .eq('owner_id', userId);

      if (error) throw error;

      // Transform relational data back into the App's expected shape
      const transformed: Company[] = (data || []).map((c: any) => ({
        id: c.id,
        ownerId: c.owner_id,
        details: c.details || {},
        subscription: c.subscription,
        bankAccounts: c.bank_accounts || [],
        clients: c.clients ? c.clients.map((cli: any) => ({
           ...cli,
           shippingAddress: cli.shipping_address,
           shippingCity: cli.shipping_city,
           shippingState: cli.shipping_state,
           shippingZip: cli.shipping_zip
        })) : [],
        items: c.items ? c.items.map((i: any) => ({ ...i, gstRate: i.gst_rate, quantityInStock: i.quantity_in_stock })) : [],
        transporters: c.transporters || [],
        stockHistory: c.stock_history ? c.stock_history.map((sh: any) => ({
          ...sh, itemId: sh.item_id, itemName: sh.item_name, previousQuantity: sh.previous_quantity, newQuantity: sh.new_quantity, referenceId: sh.reference_id
        })) : [],
        invoices: c.invoices ? c.invoices.map((inv: any) => ({
          ...inv, invoiceNumber: inv.invoice_number, clientId: inv.client_id, issueDate: inv.issue_date, dueDate: inv.due_date, subTotal: inv.sub_total, grandTotal: inv.grand_total, selectedBankAccountId: inv.selected_bank_account_id,
          shippingName: inv.shipping_name, shippingAddress: inv.shipping_address, shippingCity: inv.shipping_city, shippingState: inv.shipping_state, shippingZip: inv.shipping_zip, shippingGstin: inv.shipping_gstin,
          transporterName: inv.transporter_name, transporterGstin: inv.transporter_gstin, vehicleNumber: inv.vehicle_number, ewayBillNumber: inv.eway_bill_number,
          client: inv.clients, items: inv.invoice_items ? inv.invoice_items.map((i: any) => ({ ...i, itemId: i.item_id, gstRate: i.gst_rate })) : []
        })) : [],
        quotations: c.quotations ? c.quotations.map((q: any) => ({
          ...q, quotationNumber: q.quotation_number, clientId: q.client_id, issueDate: q.issue_date, dueDate: q.due_date, validUntil: q.valid_until, subTotal: q.sub_total, grandTotal: q.grand_total, selectedBankAccountId: q.selected_bank_account_id,
          shippingName: q.shipping_name, shippingAddress: q.shipping_address, shippingCity: q.shipping_city, shippingState: q.shipping_state, shippingZip: q.shipping_zip, shippingGstin: q.shipping_gstin,
          transporterName: q.transporter_name, transporterGstin: q.transporter_gstin, vehicleNumber: q.vehicle_number, ewayBillNumber: q.eway_bill_number,
          client: q.clients, items: q.quotation_items ? q.quotation_items.map((i: any) => ({ ...i, itemId: i.item_id, gstRate: i.gst_rate })) : []
        })) : [],
        recurringInvoices: c.recurring_invoices ? c.recurring_invoices.map((r: any) => ({
           ...r, clientId: r.client_id, startDate: r.start_date, endDate: r.end_date, nextRunDate: r.next_run_date, lastRunDate: r.last_run_date,
           client: r.clients, items: r.recurring_invoice_items ? r.recurring_invoice_items.map((i: any) => ({ ...i, itemId: i.item_id, gstRate: i.gst_rate })) : []
        })) : []
      }));

      setCompaniesState(transformed);
    } catch (err: any) {
      console.error('Network error fetching companies:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [userId]);

  // 2. Diffing & Relational Sync Logic
  const setCompanies = async (value: any) => {
    setCompaniesState((prev) => {
      const newCompanies: Company[] = typeof value === 'function' ? value(prev) : value;
      
      // Async Relational Database Sync
      if (userId) {
        const syncData = async () => {
          for (const company of newCompanies) {
            try {
              const companyId = company.id;
              
              // 1. Primary Company Detail
              await supabase.from('companies').upsert({ id: companyId, owner_id: company.ownerId, details: company.details, subscription: company.subscription });
              
              // Helper to diff and sync standard company relations
              const syncRelation = async (
                tableName: string,
                incomingItems: any[],
                mapFn: (item: any) => any
              ) => {
                const { data: dbItems, error: fetchErr } = await supabase
                  .from(tableName)
                  .select('id')
                  .eq('company_id', companyId);
                
                if (fetchErr) throw fetchErr;
                
                const dbIds = (dbItems || []).map((x: any) => x.id);
                const incomingIds = incomingItems.map((x: any) => x.id);
                const deletedIds = dbIds.filter(id => !incomingIds.includes(id));
                
                if (deletedIds.length > 0) {
                  const { error: delErr } = await supabase.from(tableName).delete().in('id', deletedIds);
                  if (delErr) throw delErr;
                }
                
                if (incomingItems.length > 0) {
                  const { error: upsertErr } = await supabase.from(tableName).upsert(incomingItems.map(mapFn));
                  if (upsertErr) throw upsertErr;
                }
              };

              // 2. Clients
              await syncRelation('clients', company.clients || [], c => ({
                id: c.id,
                company_id: companyId,
                name: c.name,
                email: c.email,
                phone: c.phone,
                address: c.address,
                city: c.city,
                state: c.state,
                zip: c.zip,
                gstin: c.gstin,
                tags: c.tags || [],
                shipping_address: c.shippingAddress,
                shipping_city: c.shippingCity,
                shipping_state: c.shippingState,
                shipping_zip: c.shippingZip
              }));

              // 3. Items
              await syncRelation('items', company.items || [], i => ({
                id: i.id,
                company_id: companyId,
                name: i.name,
                hsn: i.hsn,
                price: i.price,
                gst_rate: i.gstRate,
                unit: i.unit,
                quantity_in_stock: i.quantityInStock
              }));

              // 4. Bank Accounts
              await syncRelation('bank_accounts', company.bankAccounts || [], b => ({
                id: b.id,
                company_id: companyId,
                bank_name: b.bankName,
                account_number: b.accountNumber,
                ifsc: b.ifsc,
                is_default: b.isDefault
              }));

              // 5. Transporters
              await syncRelation('transporters', company.transporters || [], t => ({
                id: t.id,
                company_id: companyId,
                name: t.name,
                gstin: t.gstin
              }));

              // 6. Invoices & Invoice Items
              await syncRelation('invoices', company.invoices || [], inv => ({
                id: inv.id,
                company_id: companyId,
                invoice_number: inv.invoiceNumber,
                client_id: inv.client?.id || inv.clientId,
                issue_date: inv.issueDate,
                due_date: inv.dueDate,
                notes: inv.notes,
                sub_total: inv.subTotal,
                cgst: inv.cgst,
                sgst: inv.sgst,
                igst: inv.igst,
                grand_total: inv.grandTotal,
                status: inv.status,
                selected_bank_account_id: inv.selectedBankAccountId,
                shipping_name: inv.shippingName,
                shipping_address: inv.shippingAddress,
                shipping_city: inv.shippingCity,
                shipping_state: inv.shippingState,
                shipping_zip: inv.shippingZip,
                shipping_gstin: inv.shippingGstin,
                transporter_name: inv.transporterName,
                transporter_gstin: inv.transporterGstin,
                vehicle_number: inv.vehicleNumber,
                eway_bill_number: inv.ewayBillNumber
              }));

              for (const inv of company.invoices || []) {
                await supabase.from('invoice_items').delete().eq('invoice_id', inv.id);
                if (inv.items && inv.items.length > 0) {
                  const { error: itemsErr } = await supabase.from('invoice_items').insert(inv.items.map((i: any) => ({
                    invoice_id: inv.id,
                    item_id: i.id || i.itemId,
                    name: i.name,
                    hsn: i.hsn,
                    price: i.price,
                    gst_rate: i.gstRate,
                    unit: i.unit,
                    quantity: i.quantity
                  })));
                  if (itemsErr) throw itemsErr;
                }
              }

              // 7. Quotations & Quotation Items
              await syncRelation('quotations', company.quotations || [], q => ({
                id: q.id,
                company_id: companyId,
                quotation_number: q.quotationNumber,
                client_id: q.client?.id || q.clientId,
                issue_date: q.issueDate,
                due_date: q.dueDate,
                valid_until: q.validUntil,
                notes: q.notes,
                sub_total: q.subTotal,
                cgst: q.cgst,
                sgst: q.sgst,
                igst: q.igst,
                grand_total: q.grandTotal,
                status: q.status,
                selected_bank_account_id: q.selectedBankAccountId,
                shipping_name: q.shippingName,
                shipping_address: q.shippingAddress,
                shipping_city: q.shippingCity,
                shipping_state: q.shippingState,
                shipping_zip: q.shippingZip,
                shipping_gstin: q.shippingGstin,
                transporter_name: q.transporterName,
                transporter_gstin: q.transporterGstin,
                vehicle_number: q.vehicleNumber,
                eway_bill_number: q.ewayBillNumber
              }));

              for (const q of company.quotations || []) {
                await supabase.from('quotation_items').delete().eq('quotation_id', q.id);
                if (q.items && q.items.length > 0) {
                  const { error: itemsErr } = await supabase.from('quotation_items').insert(q.items.map((i: any) => ({
                    quotation_id: q.id,
                    item_id: i.id || i.itemId,
                    name: i.name,
                    hsn: i.hsn,
                    price: i.price,
                    gst_rate: i.gstRate,
                    unit: i.unit,
                    quantity: i.quantity
                  })));
                  if (itemsErr) throw itemsErr;
                }
              }

              // 8. Recurring Invoices & Items
              await syncRelation('recurring_invoices', company.recurringInvoices || [], r => ({
                id: r.id,
                company_id: companyId,
                client_id: r.clientId,
                frequency: r.frequency,
                start_date: r.startDate,
                end_date: r.endDate,
                next_run_date: r.nextRunDate,
                last_run_date: r.lastRunDate,
                status: r.status,
                notes: r.notes
              }));

              for (const r of company.recurringInvoices || []) {
                await supabase.from('recurring_invoice_items').delete().eq('recurring_invoice_id', r.id);
                if (r.items && r.items.length > 0) {
                  const { error: itemsErr } = await supabase.from('recurring_invoice_items').insert(r.items.map((i: any) => ({
                    recurring_invoice_id: r.id,
                    item_id: i.id || i.itemId,
                    name: i.name,
                    hsn: i.hsn,
                    price: i.price,
                    gst_rate: i.gstRate,
                    unit: i.unit,
                    quantity: i.quantity
                  })));
                  if (itemsErr) throw itemsErr;
                }
              }

              // 9. Stock Logs Sync
              if (company.stockHistory && company.stockHistory.length > 0) {
                const historyMap = company.stockHistory.map(h => ({
                  id: h.id,
                  company_id: companyId,
                  item_id: h.itemId,
                  item_name: h.itemName,
                  previous_quantity: h.previousQuantity,
                  new_quantity: h.newQuantity,
                  action: h.action,
                  reference_id: h.referenceId,
                  timestamp: h.timestamp
                }));
                await supabase.from('stock_history').upsert(historyMap, { onConflict: 'id' });
              }
              
              toast.success('Database in sync', { id: 'sync', duration: 1000 });
            } catch (err: any) {
              console.error('Sync error:', err);
              toast.error('Failed to sync to database', { id: 'sync-err' });
            }
          }
        };
        syncData();
      }
      
      return newCompanies;
    });
  };

  return [companies, setCompanies, loading];
}
