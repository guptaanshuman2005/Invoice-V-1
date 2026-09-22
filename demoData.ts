import type { Company, Invoice, Client, Item, Quotation, Expense, Transporter } from './types';

export const createDemoCompany = (): Company => {
  const clients: Client[] = [
    {
      id: 'demo_client_1',
      name: 'Tata Digital Systems Ltd',
      email: 'rajesh.verma@tatadigital.com',
      phone: '+91 98450 98765',
      address: '10th Floor, Prestige Trade Tower, Palace Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      zip: '560001',
      gstin: '29AAACT2727Q1ZW',
      shippingAddress: 'Plot 42, Electronics City Phase 1',
      shippingCity: 'Bengaluru',
      shippingState: 'Karnataka',
      shippingZip: '560100'
    },
    {
      id: 'demo_client_2',
      name: 'Reliance Enterprise Solutions Ltd',
      email: 'priya.nair@relsolutions.in',
      phone: '+91 98210 54321',
      address: 'Maker Chambers IV, 222 Nariman Point',
      city: 'Mumbai',
      state: 'Maharashtra',
      zip: '400021',
      gstin: '27AABCR8888P1ZZ',
      shippingAddress: 'Reliance Corporate Park, Thane-Belapur Road, Ghansoli',
      shippingCity: 'Navi Mumbai',
      shippingState: 'Maharashtra',
      shippingZip: '400701'
    },
    {
      id: 'demo_client_3',
      name: 'Infosys BPM Services',
      email: 'amit.kulkarni@infosys-bpm.com',
      phone: '+91 99220 11223',
      address: 'Plot No. 1, Rajiv Gandhi Infotech Park, Hinjawadi Phase 2',
      city: 'Pune',
      state: 'Maharashtra',
      zip: '411057',
      gstin: '27AABCI1990K1ZY'
    },
    {
      id: 'demo_client_4',
      name: 'Freshworks Global Cloud Corp',
      email: 'sneha.sundaram@freshworks.com',
      phone: '+91 94440 99887',
      address: 'Global Infocity Park, 40 MGR Salai, Perungudi',
      city: 'Chennai',
      state: 'Tamil Nadu',
      zip: '600096',
      gstin: '33AABCF4567M1ZX'
    }
  ];

  const items: Item[] = [
    {
      id: 'demo_item_1',
      name: 'Enterprise Cloud ERP Platform (Annual)',
      hsn: '998313',
      price: 45000,
      gstRate: 18,
      unit: 'YR',
      quantityInStock: 35
    },
    {
      id: 'demo_item_2',
      name: 'Custom Web & Microservices Architecture',
      hsn: '998314',
      price: 75000,
      gstRate: 18,
      unit: 'PROJECT',
      quantityInStock: 20
    },
    {
      id: 'demo_item_3',
      name: 'Dell Precision AI Workstation 7920',
      hsn: '847130',
      price: 185000,
      gstRate: 18,
      unit: 'NOS',
      quantityInStock: 2
    },
    {
      id: 'demo_item_4',
      name: 'Ergonomic Executive Mesh Office Chair',
      hsn: '940310',
      price: 14500,
      gstRate: 18,
      unit: 'PCS',
      quantityInStock: 18
    },
    {
      id: 'demo_item_5',
      name: 'Cat6 High-Speed Shielded Patch Cord 100m',
      hsn: '854449',
      price: 3200,
      gstRate: 18,
      unit: 'ROLL',
      quantityInStock: 0
    }
  ];

  const today = new Date();
  const formatDaysAgo = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  const invoices: Invoice[] = [
    {
      id: 'demo_inv_1',
      invoiceNumber: 'AG-INV-101',
      client: clients[0], // Tata Digital (Karnataka - Interstate IGST)
      items: [
        { ...items[0], quantity: 2 },
        { ...items[1], quantity: 1 }
      ],
      issueDate: formatDaysAgo(25),
      dueDate: formatDaysAgo(10),
      notes: 'Payment confirmed via NEFT. Thank you for partnering with Apex Global Technologies.',
      subTotal: 165000,
      cgst: 0,
      sgst: 0,
      igst: 29700,
      grandTotal: 194700,
      status: 'Paid',
      selectedBankAccountId: 'demo_bank_1',
      shippingName: clients[0].name,
      shippingAddress: clients[0].shippingAddress,
      shippingCity: clients[0].shippingCity,
      shippingState: clients[0].shippingState,
      shippingZip: clients[0].shippingZip,
      shippingGstin: clients[0].gstin,
      transporterName: 'SafeXpress Supply Chain Logistics',
      transporterGstin: '27AAACS1234F1Z1',
      vehicleNumber: 'MH-04-AZ-8941',
      ewayBillNumber: '281094821094'
    },
    {
      id: 'demo_inv_2',
      invoiceNumber: 'AG-INV-102',
      client: clients[1], // Reliance (Maharashtra - Intrastate CGST + SGST)
      items: [
        { ...items[2], quantity: 1 },
        { ...items[3], quantity: 4 }
      ],
      issueDate: formatDaysAgo(15),
      dueDate: formatDaysAgo(1),
      notes: 'Payment overdue reminder sent. Balance pending clearance.',
      subTotal: 243000,
      cgst: 21870,
      sgst: 21870,
      igst: 0,
      grandTotal: 286740,
      status: 'Overdue',
      selectedBankAccountId: 'demo_bank_1',
      shippingName: clients[1].name,
      shippingAddress: clients[1].shippingAddress,
      shippingCity: clients[1].shippingCity,
      shippingState: clients[1].shippingState,
      shippingZip: clients[1].shippingZip,
      shippingGstin: clients[1].gstin,
      transporterName: 'Delhivery Surface Express',
      transporterGstin: '06AAACD4999Q1ZX',
      vehicleNumber: 'MH-02-CB-2311',
      ewayBillNumber: '281094899120'
    },
    {
      id: 'demo_inv_3',
      invoiceNumber: 'AG-INV-103',
      client: clients[2], // Infosys (Maharashtra - Intrastate CGST + SGST)
      items: [
        { ...items[0], quantity: 1 },
        { ...items[3], quantity: 2 }
      ],
      issueDate: formatDaysAgo(6),
      dueDate: formatDaysAgo(-9), // Due in 9 days
      notes: 'Invoice generated. Net 15 days payment terms apply.',
      subTotal: 74000,
      cgst: 6660,
      sgst: 6660,
      igst: 0,
      grandTotal: 87320,
      status: 'Unpaid',
      selectedBankAccountId: 'demo_bank_1'
    },
    {
      id: 'demo_inv_4',
      invoiceNumber: 'AG-INV-104',
      client: clients[3], // Freshworks (Tamil Nadu - Interstate IGST)
      items: [
        { ...items[1], quantity: 2 }
      ],
      issueDate: formatDaysAgo(3),
      dueDate: formatDaysAgo(-12),
      notes: 'Advance received, balance payable on deployment signoff.',
      subTotal: 150000,
      cgst: 0,
      sgst: 0,
      igst: 27000,
      grandTotal: 177000,
      status: 'Unpaid',
      selectedBankAccountId: 'demo_bank_1'
    },
    {
      id: 'demo_inv_5',
      invoiceNumber: 'AG-INV-105',
      client: clients[0],
      items: [
        { ...items[3], quantity: 6 }
      ],
      issueDate: formatDaysAgo(45),
      dueDate: formatDaysAgo(30),
      notes: 'Batch delivery complete. Paid in full.',
      subTotal: 87000,
      cgst: 0,
      sgst: 0,
      igst: 15660,
      grandTotal: 102660,
      status: 'Paid',
      selectedBankAccountId: 'demo_bank_2'
    },
    {
      id: 'demo_inv_6',
      invoiceNumber: 'AG-INV-106',
      client: clients[1],
      items: [
        { ...items[0], quantity: 1 }
      ],
      issueDate: formatDaysAgo(1),
      dueDate: formatDaysAgo(-14),
      notes: 'Draft awaiting customer PO approval.',
      subTotal: 45000,
      cgst: 4050,
      sgst: 4050,
      igst: 0,
      grandTotal: 53100,
      status: 'Unpaid',
      selectedBankAccountId: 'demo_bank_1'
    }
  ];

  const quotations: Quotation[] = [
    {
      id: 'demo_quote_1',
      quotationNumber: 'AG-QT-042',
      validUntil: formatDaysAgo(-25),
      client: clients[2],
      items: [
        { ...items[1], quantity: 1 },
        { ...items[2], quantity: 2 }
      ],
      issueDate: formatDaysAgo(5),
      dueDate: formatDaysAgo(-15),
      notes: 'Estimate valid for 30 calendar days from issue date.',
      subTotal: 445000,
      cgst: 40050,
      sgst: 40050,
      igst: 0,
      grandTotal: 525100,
      status: 'Sent',
      selectedBankAccountId: 'demo_bank_1'
    },
    {
      id: 'demo_quote_2',
      quotationNumber: 'AG-QT-043',
      validUntil: formatDaysAgo(-18),
      client: clients[3],
      items: [
        { ...items[3], quantity: 12 }
      ],
      issueDate: formatDaysAgo(12),
      dueDate: formatDaysAgo(-18),
      notes: 'Bulk purchase quotation for developer floor chairs.',
      subTotal: 174000,
      cgst: 0,
      sgst: 0,
      igst: 31320,
      grandTotal: 205320,
      status: 'Accepted',
      selectedBankAccountId: 'demo_bank_1'
    }
  ];

  const expenses: Expense[] = [
    {
      id: 'demo_exp_1',
      category: 'Software',
      description: 'AWS Production Cluster & S3 Storage Ingestion',
      amount: 38500,
      date: formatDaysAgo(5),
      vendorName: 'Amazon Web Services India Pvt Ltd',
      paymentMode: 'Credit Card'
    },
    {
      id: 'demo_exp_2',
      category: 'Rent',
      description: 'Commercial Office Space Maintenance & Electric Utilities',
      amount: 62000,
      date: formatDaysAgo(12),
      vendorName: 'Peninsula Business Park Facility',
      paymentMode: 'Bank Transfer'
    },
    {
      id: 'demo_exp_3',
      category: 'Utilities',
      description: 'High-Speed Dedicated Leased Line Internet',
      amount: 8450,
      date: formatDaysAgo(14),
      vendorName: 'Tata Tele Business Services',
      paymentMode: 'UPI'
    },
    {
      id: 'demo_exp_4',
      category: 'Software',
      description: 'Figma Organization & GitHub Enterprise Subscriptions',
      amount: 14200,
      date: formatDaysAgo(20),
      vendorName: 'Developer Tools Suite',
      paymentMode: 'Credit Card'
    }
  ];

  const transporters: Transporter[] = [
    {
      id: 'demo_trans_1',
      name: 'SafeXpress Supply Chain Logistics',
      gstin: '27AAACS1234F1Z1'
    },
    {
      id: 'demo_trans_2',
      name: 'Delhivery Surface Express Freight',
      gstin: '06AAACD4999Q1ZX'
    }
  ];

  return {
    id: 'demo_company_apex',
    ownerId: 'demo_user',
    details: {
      name: 'Apex Global Technologies Pvt. Ltd.',
      logo: '',
      gstin: '27AABCA1234F1Z5',
      pan: 'AABCA1234F',
      phone: '+91 98200 12345',
      email: 'billing@apextechglobal.in',
      website: 'www.apextechglobal.in',
      address: 'Level 14, Tower B, Peninsula Business Park, Lower Parel',
      city: 'Mumbai',
      state: 'Maharashtra',
      zip: '400013',
      udyam: 'UDYAM-MH-03-0012345',
      signature: '',
      invoicePrefix: 'AG-INV-',
      nextInvoiceNumber: 107,
      brandColor: '#4f46e5',
      invoiceTemplate: 'modern',
      showShipping: true,
      showHsn: true,
      showDiscount: true,
      showTerms: true,
      showQr: true
    },
    bankAccounts: [
      {
        id: 'demo_bank_1',
        bankName: 'HDFC Bank Ltd',
        accountNumber: '50200012345678',
        ifsc: 'HDFC0000060',
        isDefault: true
      },
      {
        id: 'demo_bank_2',
        bankName: 'ICICI Bank Ltd',
        accountNumber: '000405012345',
        ifsc: 'ICIC0000004',
        isDefault: false
      }
    ],
    clients,
    items,
    invoices,
    quotations,
    expenses,
    transporters,
    recurringInvoices: [],
    stockHistory: [
      {
        id: 'log_demo_1',
        itemId: 'demo_item_3',
        itemName: 'Dell Precision AI Workstation 7920',
        previousQuantity: 3,
        newQuantity: 2,
        action: 'Invoice Created',
        timestamp: formatDaysAgo(15),
        referenceId: 'AG-INV-102'
      },
      {
        id: 'log_demo_2',
        itemId: 'demo_item_5',
        itemName: 'Cat6 High-Speed Shielded Patch Cord 100m',
        previousQuantity: 5,
        newQuantity: 0,
        action: 'Invoice Created',
        timestamp: formatDaysAgo(2),
        referenceId: 'AG-INV-105'
      }
    ],
    subscription: {
      plan: 'premium',
      status: 'active',
      currentPeriodEnd: '2027-12-31T23:59:59.000Z',
      invoiceCount: 6,
      invoiceLimit: 1000,
      addonInvoices: 200
    }
  };
};
