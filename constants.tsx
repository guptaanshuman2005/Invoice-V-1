
import React from 'react';
import { 
    Home, 
    PlusCircle, 
    FileText, 
    FileSignature, 
    FileSpreadsheet,
    Users, 
    Package, 
    Boxes, 
    Truck, 
    TrendingDown,
    Settings 
} from 'lucide-react';

export const NAV_ITEMS = [
    { name: 'Dashboard', icon: <Home className="w-5 h-5" />, view: 'Dashboard' },
    { name: 'New Invoice', icon: <PlusCircle className="w-5 h-5" />, view: 'NewInvoice' },
    { name: 'Invoices', icon: <FileText className="w-5 h-5" />, view: 'Invoices' },
    { name: 'Quotations', icon: <FileSignature className="w-5 h-5" />, view: 'Quotations' },
    { name: 'GST Reports', icon: <FileSpreadsheet className="w-5 h-5" />, view: 'GstReports' },
    { name: 'Clients', icon: <Users className="w-5 h-5" />, view: 'Clients' },
    { name: 'Items', icon: <Package className="w-5 h-5" />, view: 'Items' },
    { name: 'Inventory', icon: <Boxes className="w-5 h-5" />, view: 'Inventory' },
    { name: 'Expenses', icon: <TrendingDown className="w-5 h-5" />, view: 'Expenses' },
    { name: 'Transporters', icon: <Truck className="w-5 h-5" />, view: 'Transporters' },
    { name: 'Settings', icon: <Settings className="w-5 h-5" />, view: 'Settings' },
];

export const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export const STATE_TO_GST_CODE: Record<string, string> = {
    "Jammu and Kashmir": "01",
    "Himachal Pradesh": "02",
    "Punjab": "03",
    "Chandigarh": "04",
    "Uttarakhand": "05",
    "Haryana": "06",
    "Delhi": "07",
    "Rajasthan": "08",
    "Uttar Pradesh": "09",
    "Bihar": "10",
    "Sikkim": "11",
    "Arunachal Pradesh": "12",
    "Nagaland": "13",
    "Manipur": "14",
    "Mizoram": "15",
    "Tripura": "16",
    "Meghalaya": "17",
    "Assam": "18",
    "West Bengal": "19",
    "Jharkhand": "20",
    "Odisha": "21",
    "Chhattisgarh": "22",
    "Madhya Pradesh": "23",
    "Gujarat": "24",
    "Dadra and Nagar Haveli and Daman and Diu": "26",
    "Maharashtra": "27",
    "Andhra Pradesh": "37",
    "Karnataka": "29",
    "Goa": "30",
    "Lakshadweep": "31",
    "Kerala": "32",
    "Tamil Nadu": "33",
    "Puducherry": "34",
    "Andaman and Nicobar Islands": "35",
    "Telangana": "36",
    "Ladakh": "38"
};

