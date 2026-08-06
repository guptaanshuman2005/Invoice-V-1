-- Supabase Schema for InvoicePro (Relational PostgreSQL)

-- We will drop existing tables to start fresh since this is a prototype
DROP TABLE IF EXISTS public.stock_history CASCADE;
DROP TABLE IF EXISTS public.invoice_items CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.quotation_items CASCADE;
DROP TABLE IF EXISTS public.quotations CASCADE;
DROP TABLE IF EXISTS public.recurring_invoice_items CASCADE;
DROP TABLE IF EXISTS public.recurring_invoices CASCADE;
DROP TABLE IF EXISTS public.items CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.transporters CASCADE;
DROP TABLE IF EXISTS public.bank_accounts CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

-- 1. Create the 'companies' table
CREATE TABLE public.companies (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    subscription JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own companies" ON public.companies FOR ALL USING (owner_id = auth.uid()::text) WITH CHECK (owner_id = auth.uid()::text);

-- 2. Create the 'clients' table
CREATE TABLE public.clients (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gstin TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    shipping_address TEXT,
    shipping_city TEXT,
    shipping_state TEXT,
    shipping_zip TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Strict isolation by company owner for clients" ON public.clients FOR ALL USING (EXISTS (SELECT 1 FROM public.companies WHERE companies.id = clients.company_id AND companies.owner_id = auth.uid()::text));

-- 3. Create the 'items' (Inventory) table
CREATE TABLE public.items (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    hsn TEXT,
    price NUMERIC NOT NULL,
    gst_rate NUMERIC NOT NULL,
    unit TEXT,
    quantity_in_stock NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Strict isolation by company owner for items" ON public.items FOR ALL USING (EXISTS (SELECT 1 FROM public.companies WHERE companies.id = items.company_id AND companies.owner_id = auth.uid()::text));

-- 4. Create the 'bank_accounts' table
CREATE TABLE public.bank_accounts (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    ifsc TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Strict isolation by company owner for bank_accounts" ON public.bank_accounts FOR ALL USING (EXISTS (SELECT 1 FROM public.companies WHERE companies.id = bank_accounts.company_id AND companies.owner_id = auth.uid()::text));

-- 5. Create the 'transporters' table
CREATE TABLE public.transporters (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gstin TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.transporters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Strict isolation by company owner for transporters" ON public.transporters FOR ALL USING (EXISTS (SELECT 1 FROM public.companies WHERE companies.id = transporters.company_id AND companies.owner_id = auth.uid()::text));

-- 6. Create the 'invoices' table
CREATE TABLE public.invoices (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    notes TEXT,
    sub_total NUMERIC NOT NULL,
    cgst NUMERIC NOT NULL,
    sgst NUMERIC NOT NULL,
    igst NUMERIC NOT NULL,
    grand_total NUMERIC NOT NULL,
    status TEXT NOT NULL,
    selected_bank_account_id TEXT REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
    
    shipping_name TEXT,
    shipping_address TEXT,
    shipping_city TEXT,
    shipping_state TEXT,
    shipping_zip TEXT,
    shipping_gstin TEXT,
    
    transporter_name TEXT,
    transporter_gstin TEXT,
    vehicle_number TEXT,
    eway_bill_number TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Strict isolation by company owner for invoices" ON public.invoices FOR ALL USING (EXISTS (SELECT 1 FROM public.companies WHERE companies.id = invoices.company_id AND companies.owner_id = auth.uid()::text));

-- 7. Create the 'invoice_items' table (Join table)
CREATE TABLE public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id TEXT NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    item_id TEXT REFERENCES public.items(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    hsn TEXT,
    price NUMERIC NOT NULL,
    gst_rate NUMERIC NOT NULL,
    unit TEXT,
    quantity NUMERIC NOT NULL
);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Strict isolation by company owner for invoice_items" ON public.invoice_items FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.invoices
        JOIN public.companies ON invoices.company_id = companies.id
        WHERE invoices.id = invoice_items.invoice_id AND companies.owner_id = auth.uid()::text
    )
);

-- 8. Create the 'quotations' table
CREATE TABLE public.quotations (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    quotation_number TEXT NOT NULL,
    client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    valid_until DATE NOT NULL,
    notes TEXT,
    sub_total NUMERIC NOT NULL,
    cgst NUMERIC NOT NULL,
    sgst NUMERIC NOT NULL,
    igst NUMERIC NOT NULL,
    grand_total NUMERIC NOT NULL,
    status TEXT NOT NULL,
    selected_bank_account_id TEXT REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
    
    shipping_name TEXT,
    shipping_address TEXT,
    shipping_city TEXT,
    shipping_state TEXT,
    shipping_zip TEXT,
    shipping_gstin TEXT,
    
    transporter_name TEXT,
    transporter_gstin TEXT,
    vehicle_number TEXT,
    eway_bill_number TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Strict isolation by company owner for quotations" ON public.quotations FOR ALL USING (EXISTS (SELECT 1 FROM public.companies WHERE companies.id = quotations.company_id AND companies.owner_id = auth.uid()::text));

-- 9. Create the 'quotation_items' table
CREATE TABLE public.quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id TEXT NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    item_id TEXT REFERENCES public.items(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    hsn TEXT,
    price NUMERIC NOT NULL,
    gst_rate NUMERIC NOT NULL,
    unit TEXT,
    quantity NUMERIC NOT NULL
);

ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Strict isolation by company owner for quotation_items" ON public.quotation_items FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.quotations
        JOIN public.companies ON quotations.company_id = companies.id
        WHERE quotations.id = quotation_items.quotation_id AND companies.owner_id = auth.uid()::text
    )
);

-- 10. Create the 'stock_history' table
CREATE TABLE public.stock_history (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    previous_quantity NUMERIC NOT NULL,
    new_quantity NUMERIC NOT NULL,
    action TEXT NOT NULL,
    reference_id TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL
);

ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Strict isolation by company owner for stock_history" ON public.stock_history FOR ALL USING (EXISTS (SELECT 1 FROM public.companies WHERE companies.id = stock_history.company_id AND companies.owner_id = auth.uid()::text));

-- 11. Create the 'recurring_invoices' table
CREATE TABLE public.recurring_invoices (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    frequency TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    next_run_date DATE NOT NULL,
    last_run_date DATE,
    status TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.recurring_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Strict isolation by company owner for recurring_invoices" ON public.recurring_invoices FOR ALL USING (EXISTS (SELECT 1 FROM public.companies WHERE companies.id = recurring_invoices.company_id AND companies.owner_id = auth.uid()::text));

-- 12. Create 'recurring_invoice_items' table
CREATE TABLE public.recurring_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recurring_invoice_id TEXT NOT NULL REFERENCES public.recurring_invoices(id) ON DELETE CASCADE,
    item_id TEXT REFERENCES public.items(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    hsn TEXT,
    price NUMERIC NOT NULL,
    gst_rate NUMERIC NOT NULL,
    unit TEXT,
    quantity NUMERIC NOT NULL
);

ALTER TABLE public.recurring_invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Strict isolation by company owner for recurring_invoice_items" ON public.recurring_invoice_items FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.recurring_invoices
        JOIN public.companies ON recurring_invoices.company_id = companies.id
        WHERE recurring_invoices.id = recurring_invoice_items.recurring_invoice_id AND companies.owner_id = auth.uid()::text
    )
);

-- Company Assets Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('company-assets', 'company-assets', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Allow users to upload to their own folder" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Allow users to update their own folder" ON storage.objects FOR UPDATE USING (bucket_id = 'company-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Allow users to delete their own folder" ON storage.objects FOR DELETE USING (bucket_id = 'company-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Allow public read access" ON storage.objects FOR SELECT USING (bucket_id = 'company-assets');

-- Feedback Table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own feedback" ON public.feedback FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Users can view their own feedback" ON public.feedback FOR SELECT USING (user_id = auth.uid()::text);

-- GSTIN Validation SECURITY DEFINER RPC function (RLS bypass validation)
CREATE OR REPLACE FUNCTION public.check_gstin_exists(gstin_to_check text)
RETURNS boolean AS $$
DECLARE
    exists_flag boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM public.companies 
        WHERE details->>'gstin' = gstin_to_check
    ) INTO exists_flag;
    RETURN exists_flag;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
