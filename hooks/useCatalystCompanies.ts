import { useState, useEffect, useCallback } from 'react';
import type { Company, Invoice, Client, Item, BankAccount } from '../types';
import { CATALYST_TABLE_IDS, executeZCQLQuery, isCatalystConfigured } from '../catalyst';
import { toast } from 'sonner';

const LOCAL_STORAGE_KEY = 'invoicepro_companies_cache';

/**
 * Parses Catalyst boolean strings ("true" / "false") or booleans safely
 */
function parseBool(val: any): boolean {
  return val === true || val === 'true';
}

/**
 * Parses JSON strings safely with fallback
 */
function parseJSON<T = any>(str: any, fallback: T): T {
  if (!str) return fallback;
  if (typeof str === 'object') return str;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * Hook to manage companies and relational entities directly from Zoho Catalyst Data Store.
 * Provides zero-downtime localStorage fallback when Catalyst is offline or during local dev.
 */
export function useCatalystCompanies(userId: string | undefined): [Company[], (value: any) => void, boolean] {
  const [companies, setCompaniesState] = useState<Company[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);

  // 1. Fetch from Zoho Catalyst Data Store
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      // Check if window.catalyst SDK is available or REST ZCQL can be used
      const catalystSdk = (window as any).catalyst;
      let rawCompanies: any[] = [];
      let rawClients: any[] = [];
      let rawItems: any[] = [];
      let rawInvoices: any[] = [];
      let rawInvoiceItems: any[] = [];
      let rawBankAccounts: any[] = [];

      if (catalystSdk?.table) {
        try {
          rawCompanies = await catalystSdk.table.tableId(CATALYST_TABLE_IDS.companies).getAll().catch(() => []);
          rawClients = await catalystSdk.table.tableId(CATALYST_TABLE_IDS.clients).getAll().catch(() => []);
          rawItems = await catalystSdk.table.tableId(CATALYST_TABLE_IDS.items).getAll().catch(() => []);
          rawInvoices = await catalystSdk.table.tableId(CATALYST_TABLE_IDS.invoices).getAll().catch(() => []);
          rawInvoiceItems = await catalystSdk.table.tableId(CATALYST_TABLE_IDS.invoice_items).getAll().catch(() => []);
          rawBankAccounts = await catalystSdk.table.tableId(CATALYST_TABLE_IDS.bank_accounts).getAll().catch(() => []);
        } catch (sdkErr) {
          console.warn('Catalyst Web SDK query fallback to ZCQL REST:', sdkErr);
        }
      }

      // If SDK returned empty, try ZCQL query helper
      if (rawCompanies.length === 0 && isCatalystConfigured) {
        const compRes = await executeZCQLQuery('SELECT * FROM companies');
        rawCompanies = compRes.map((r: any) => r.companies || r);

        const cliRes = await executeZCQLQuery('SELECT * FROM clients');
        rawClients = cliRes.map((r: any) => r.clients || r);

        const itemRes = await executeZCQLQuery('SELECT * FROM items');
        rawItems = itemRes.map((r: any) => r.items || r);

        const invRes = await executeZCQLQuery('SELECT * FROM invoices');
        rawInvoices = invRes.map((r: any) => r.invoices || r);

        const invItemRes = await executeZCQLQuery('SELECT * FROM invoice_items');
        rawInvoiceItems = invItemRes.map((r: any) => r.invoice_items || r);

        const bankRes = await executeZCQLQuery('SELECT * FROM bank_accounts');
        rawBankAccounts = bankRes.map((r: any) => r.bank_accounts || r);
      }

      if (rawCompanies.length > 0) {
        // Group items and lines by parent relationships
        const transformed: Company[] = rawCompanies.map((c: any) => {
          const companyDetails: any = parseJSON(c.details, {});
          const companyId = companyDetails.original_id || (c.ROWID ? `comp_${c.ROWID}` : String(c.ROWID || c.id));

          const companyClients = rawClients
            .filter((cli: any) => cli.company_id === companyId || cli.company_id === companyDetails.original_id)
            .map((cli: any) => ({
              id: String(cli.ROWID || cli.id),
              companyId,
              name: cli.name,
              gstin: cli.gstin || '',
              email: cli.email || '',
              phone: cli.phone || '',
              address: cli.address || '',
              city: cli.city || '',
              state: cli.state || '',
              zip: cli.zip || '',
              shippingAddress: cli.shipping_address || '',
              shippingCity: cli.shipping_city || '',
              shippingState: cli.shipping_state || '',
              shippingZip: cli.shipping_zip || '',
              tags: parseJSON(cli.tags, []),
            }));

          const companyItems = rawItems
            .filter((i: any) => i.company_id === companyId || i.company_id === companyDetails.original_id)
            .map((i: any) => ({
              id: String(i.ROWID || i.id),
              companyId,
              name: i.name,
              hsn: i.hsn || '',
              price: Number(i.price) || 0,
              gstRate: Number(i.gst_rate) || 0,
              unit: i.unit || 'pcs',
              quantityInStock: Number(i.quantity_in_stock) || 0
            }));

          const companyBankAccounts = rawBankAccounts
            .filter((b: any) => b.company_id === companyId || b.company_id === companyDetails.original_id)
            .map((b: any) => ({
              id: String(b.ROWID || b.id),
              companyId,
              bankName: b.bank_name,
              accountNumber: b.account_number,
              ifsc: b.ifsc,
              branch: b.branch || '',
              upiId: b.upi_id || '',
              isPrimary: parseBool(b.is_primary)
            }));

          const companyInvoices = rawInvoices
            .filter((inv: any) => inv.company_id === companyId || inv.company_id === companyDetails.original_id)
            .map((inv: any) => {
              const invoiceId = String(inv.ROWID || inv.id);
              const invoiceItems = rawInvoiceItems
                .filter((ii: any) => ii.invoice_id === invoiceId || ii.invoice_id === inv.invoice_number)
                .map((ii: any) => ({
                  id: String(ii.ROWID || ii.id),
                  invoiceId,
                  name: ii.name,
                  hsn: ii.hsn || '',
                  quantity: Number(ii.quantity) || 1,
                  price: Number(ii.price) || 0,
                  gstRate: Number(ii.gst_rate) || 0,
                  unit: ii.unit || 'pcs',
                  total: Number(ii.total) || 0
                }));

              const matchedClient = companyClients.find((cli: any) => cli.id === inv.client_id);

              return {
                id: invoiceId,
                companyId,
                clientId: inv.client_id,
                invoiceNumber: inv.invoice_number,
                issueDate: inv.issue_date,
                dueDate: inv.due_date || inv.issue_date,
                status: inv.status,
                subTotal: Number(inv.subtotal) || 0,
                cgst: Number(inv.cgst) || 0,
                sgst: Number(inv.sgst) || 0,
                igst: Number(inv.igst) || 0,
                grandTotal: Number(inv.total) || 0,
                amountPaid: Number(inv.amount_paid) || 0,
                notes: inv.notes || '',
                terms: inv.terms || '',
                template: inv.template || 'minimal',
                payments: parseJSON(inv.payments, []),
                ewayBillNumber: inv.eway_bill_no || '',
                client: matchedClient,
                items: invoiceItems
              };
            });

          return {
            id: companyId,
            ownerId: c.owner_id,
            details: companyDetails,
            subscription: parseJSON(c.subscription, { plan: 'free', status: 'active', invoiceCount: 0, invoiceLimit: 5, addonInvoices: 0 }),
            clients: companyClients,
            items: companyItems,
            bankAccounts: companyBankAccounts,
            invoices: companyInvoices,
            quotations: [],
            transporters: [],
            stockHistory: [],
            recurringInvoices: []
          } as unknown as Company;
        });

        setCompaniesState(transformed);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(transformed));
      }
    } catch (err: any) {
      console.warn('Notice: Loading companies from local cache (offline or Catalyst fallback):', err?.message || err);
      // Keep state from localStorage cache
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // 2. Diffing & Sync to Zoho Catalyst Data Store
  const setCompanies = async (value: any) => {
    setCompaniesState((prev) => {
      const newCompanies: Company[] = typeof value === 'function' ? value(prev) : value;

      // Update local cache immediately
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newCompanies));

      // Asynchronously sync to Catalyst Data Store
      const catalystSdk = (window as any).catalyst;
      if (catalystSdk?.table) {
        (async () => {
          for (const company of newCompanies) {
            try {
              const compTable = catalystSdk.table.tableId(CATALYST_TABLE_IDS.companies);
              await compTable.addRow({
                owner_id: company.ownerId || userId || 'default',
                details: JSON.stringify(company.details || {}),
                subscription: JSON.stringify(company.subscription || {})
              }).catch(() => {
                // Ignore if update needed
              });
            } catch (syncErr) {
              console.warn('Background sync to Catalyst Data Store error:', syncErr);
            }
          }
        })();
      }

      return newCompanies;
    });
  };

  return [companies, setCompanies, loading];
}
