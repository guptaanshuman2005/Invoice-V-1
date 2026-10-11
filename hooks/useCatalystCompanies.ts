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

      // Update local cache immediately for instant UI feedback
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newCompanies));

      // Asynchronously sync to Catalyst Data Store in background
      const catalystSdk = (window as any).catalyst;
      if (catalystSdk?.table) {
        (async () => {
          for (const company of newCompanies) {
            try {
              const companyId = company.id;
              const compTable = catalystSdk.table.tableId(CATALYST_TABLE_IDS.companies);
              await compTable.addRow({
                owner_id: company.ownerId || userId || 'default',
                details: JSON.stringify(company.details || {}),
                subscription: JSON.stringify(company.subscription || {})
              }).catch(() => {});

              // Sync Clients
              if (company.clients && company.clients.length > 0) {
                const clientTable = catalystSdk.table.tableId(CATALYST_TABLE_IDS.clients);
                for (const client of company.clients) {
                  await clientTable.addRow({
                    company_id: companyId,
                    name: client.name,
                    gstin: client.gstin || '',
                    email: client.email || '',
                    phone: client.phone || '',
                    address: client.address || '',
                    city: client.city || '',
                    state: client.state || '',
                    zip: client.zip || '',
                    shipping_address: client.shippingAddress || '',
                    shipping_city: client.shippingCity || '',
                    shipping_state: client.shippingState || '',
                    shipping_zip: client.shippingZip || '',
                    tags: JSON.stringify(client.tags || [])
                  }).catch(() => {});
                }
              }

              // Sync Items
              if (company.items && company.items.length > 0) {
                const itemTable = catalystSdk.table.tableId(CATALYST_TABLE_IDS.items);
                for (const item of company.items) {
                  await itemTable.addRow({
                    company_id: companyId,
                    name: item.name,
                    hsn: item.hsn || '',
                    price: Number(item.price) || 0,
                    gst_rate: Number(item.gstRate) || 0,
                    unit: item.unit || 'pcs',
                    quantity_in_stock: Number(item.quantityInStock) || 0
                  }).catch(() => {});
                }
              }

              // Sync Bank Accounts
              if (company.bankAccounts && company.bankAccounts.length > 0) {
                const bankTable = catalystSdk.table.tableId(CATALYST_TABLE_IDS.bank_accounts);
                for (const bank of company.bankAccounts) {
                  await bankTable.addRow({
                    company_id: companyId,
                    bank_name: bank.bankName,
                    account_number: bank.accountNumber,
                    ifsc: bank.ifsc,
                    branch: (bank as any).branch || '',
                    upi_id: (bank as any).upiId || '',
                    is_primary: String(bank.isDefault ?? false)
                  }).catch(() => {});
                }
              }

              // Sync Invoices & Line Items
              if (company.invoices && company.invoices.length > 0) {
                const invTable = catalystSdk.table.tableId(CATALYST_TABLE_IDS.invoices);
                const invItemTable = catalystSdk.table.tableId(CATALYST_TABLE_IDS.invoice_items);
                for (const inv of company.invoices) {
                  const calculatedPaid = inv.payments?.reduce((acc, p) => acc + (p.amount || 0), 0) || (inv as any).amountPaid || 0;
                  await invTable.addRow({
                    company_id: companyId,
                    client_id: inv.client?.id || (inv as any).clientId || '',
                    invoice_number: inv.invoiceNumber,
                    issue_date: inv.issueDate,
                    due_date: inv.dueDate,
                    status: inv.status,
                    subtotal: Number(inv.subTotal) || 0,
                    cgst: Number(inv.cgst) || 0,
                    sgst: Number(inv.sgst) || 0,
                    igst: Number(inv.igst) || 0,
                    total: Number(inv.grandTotal) || 0,
                    amount_paid: Number(calculatedPaid),
                    notes: inv.notes || '',
                    terms: (inv as any).terms || '',
                    template: (inv as any).template || 'minimal',
                    payments: JSON.stringify(inv.payments || []),
                    eway_bill_no: inv.ewayBillNumber || ''
                  }).catch(() => {});

                  if (inv.items && inv.items.length > 0) {
                    for (const ii of inv.items) {
                      const itemTotal = Number(ii.price * ii.quantity * (1 + (ii.gstRate || 0) / 100));
                      await invItemTable.addRow({
                        invoice_id: inv.id,
                        item_id: ii.id || '',
                        name: ii.name,
                        hsn: ii.hsn || '',
                        quantity: Number(ii.quantity) || 1,
                        price: Number(ii.price) || 0,
                        gst_rate: Number(ii.gstRate) || 0,
                        unit: ii.unit || 'pcs',
                        total: itemTotal
                      }).catch(() => {});
                    }
                  }
                }
              }

              // Sync Quotations
              if (company.quotations && company.quotations.length > 0) {
                const qTable = catalystSdk.table.tableId(CATALYST_TABLE_IDS.quotations);
                const qItemTable = catalystSdk.table.tableId(CATALYST_TABLE_IDS.quotation_items);
                for (const q of company.quotations) {
                  await qTable.addRow({
                    company_id: companyId,
                    client_id: q.client?.id || (q as any).clientId || '',
                    quotation_number: q.quotationNumber,
                    issue_date: q.issueDate,
                    expiry_date: q.validUntil || (q as any).expiryDate || '',
                    status: q.status,
                    subtotal: Number(q.subTotal) || 0,
                    cgst: Number(q.cgst) || 0,
                    sgst: Number(q.sgst) || 0,
                    igst: Number(q.igst) || 0,
                    total: Number(q.grandTotal) || 0,
                    notes: q.notes || '',
                    terms: (q as any).terms || '',
                    template: (q as any).template || 'minimal'
                  }).catch(() => {});

                  if (q.items && q.items.length > 0) {
                    for (const qi of q.items) {
                      const qItemTotal = Number(qi.price * qi.quantity * (1 + (qi.gstRate || 0) / 100));
                      await qItemTable.addRow({
                        quotation_id: q.id,
                        name: qi.name,
                        hsn: qi.hsn || '',
                        quantity: Number(qi.quantity) || 1,
                        price: Number(qi.price) || 0,
                        gst_rate: Number(qi.gstRate) || 0,
                        unit: qi.unit || 'pcs',
                        total: qItemTotal
                      }).catch(() => {});
                    }
                  }
                }
              }

              // Sync Expenses
              if (company.expenses && company.expenses.length > 0) {
                const expTable = catalystSdk.table.tableId(CATALYST_TABLE_IDS.expenses);
                for (const exp of company.expenses) {
                  await expTable.addRow({
                    company_id: companyId,
                    category: exp.category,
                    amount: Number(exp.amount) || 0,
                    expense_date: exp.date,
                    payment_mode: exp.paymentMode || 'cash',
                    vendor_name: exp.vendorName || (exp as any).vendor || '',
                    notes: exp.notes || '',
                    receipt_url: (exp as any).receiptUrl || ''
                  }).catch(() => {});
                }
              }
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
