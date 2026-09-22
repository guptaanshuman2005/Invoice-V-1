<div align="center">

# 🧾 InvoicePro

### Modern GST Invoicing, Inventory & Business Management Suite

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)](https://invoicepro-pi.vercel.app)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

<p align="center">
  A blazing-fast, GST-compliant invoicing and business suite designed for Indian freelancers, agencies, and SMEs. Generate PDF tax invoices in seconds, track inventory, convert quotations, and manage recurring billing seamlessly.
</p>

[**🌐 Live Application**](https://invoicepro-pi.vercel.app) • [**🎮 Interactive Demo**](https://invoicepro-pi.vercel.app) • [**✨ Report Bug**](https://github.com/guptaanshuman2005/Invoice-V-1/issues)

</div>

---

## 🌟 Key Features

### ⚡ GST-Compliant Invoicing
- **Smart Tax Calculations**: Automated CGST, SGST, and IGST computation based on company state vs. client place of supply.
- **HSN / SAC Code Support**: Easy product classification with standard GST tax rates (0%, 5%, 12%, 18%, 28%).
- **Shipping & Logistics**: Full support for shipping addresses, e-Way bill numbers, vehicle numbers, and transporter details.
- **Dynamic Bank Details**: Select and attach specific company bank accounts to each invoice with IFSC and QR codes.

### 📄 Quotations & Estimates
- Create professional business estimates and quotations.
- **One-Click Conversion**: Instantly transform approved quotations into active GST invoices without re-entering data.
- Track quotation status from Draft, Sent, to Accepted or Expired.

### 📦 Real-time Inventory & Stock Tracking
- **Automatic Stock Deduction**: Item inventory quantities adjust in real-time as invoices are finalized.
- **Stock History Audit**: Complete chronological movement log recording every item increment, deduction, and reference invoice.
- Low-stock alerts and pricing management.

### 🎨 Multiple Professional PDF Templates
- Choose between **Modern**, **Minimalist**, **Classic**, and **Corporate** PDF styles.
- Live client-side PDF rendering powered by `@react-pdf/renderer`.
- Upload company logos, signatures, custom brand color accents, and customized terms & conditions.

### 🔄 Recurring Invoices & Retainers
- Automate repetitive client billing cycles (Weekly, Monthly, Quarterly, Yearly).
- Auto-calculate next run dates and keep retainers organized.

### 🏢 Multi-Company Workspace
- Manage multiple businesses or brand identities under a single account.
- Complete isolation with dedicated GSTINs, addresses, client databases, and bank accounts per company.

### 🎮 Zero-Barrier Interactive Demo Mode
- Test the full suite immediately with realistic preloaded data (invoices, products, clients, analytics).
- No credit card or registration required to evaluate features.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Bundler & Tooling** | [Vite 6](https://vitejs.dev/) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security) |
| **Object Storage** | Supabase Storage (`company-assets` bucket for logos & signatures) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) with full Dark/Light mode |
| **PDF Generation** | [`@react-pdf/renderer`](https://react-pdf.org/) |
| **Icons & UI** | [Lucide React](https://lucide.dev/), Sonner Toasts |
| **Analytics & Hosting**| [Vercel](https://vercel.com/) & [@vercel/analytics](https://vercel.com/analytics) |

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0 or later)
- [npm](https://www.npmjs.com/) (or yarn / pnpm)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/guptaanshuman2005/Invoice-V-1.git
   cd Invoice-V-1
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**:
   Execute the SQL script located in [`supabase_schema.sql`](supabase_schema.sql) in your Supabase SQL Editor. This will provision all relational tables, RLS security policies, and storage bucket configuration.

5. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📁 Project Structure

```
invoicepro/
├── components/          # Reusable UI views (Invoices, Quotations, Inventory, Clients, Settings)
├── hooks/               # Custom hooks for Supabase mutations, companies, and data fetching
├── utils/               # PDF generators, GST calculators, and formatting utilities
├── App.tsx              # Main layout, routing, sidebar navigation, and demo mode handler
├── demoData.ts          # Realistic mock dataset for instant product demonstration
├── index.tsx            # Application entry point with React Query and Vercel Analytics
├── supabase_schema.sql  # Complete PostgreSQL database schema with RLS policies
├── types.ts             # TypeScript definitions for Invoices, Companies, Items, etc.
└── vercel.json          # Vercel deployment routing and caching configurations
```

---

## 🔒 Security & Privacy

- **Row Level Security (RLS)**: Enforced on all Supabase tables so each user can only read, create, and modify their own business data.
- **Client-Side PDF Compilation**: Invoices and quotations are compiled on-device without exposing sensitive financial figures to third-party rendering APIs.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
