
import React from 'react';
import { 
    Home, 
    PlusCircle, 
    FileText, 
    FileSignature, 
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
