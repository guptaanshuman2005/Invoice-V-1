import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Menu, Search, User as UserIcon, ChevronDown, Check, MessageSquare, Sun, Moon, LogOut, FileText, Users, Package } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Clients from './components/Clients';
import Items from './components/Items';
import Transporters from './components/Transporters';
import Invoices, { InvoiceContent } from './components/Invoices';
import NewInvoice from './components/NewInvoice';
import Auth from './components/auth/Auth';
import Landing from './components/Landing';
import CompanyManager from './components/CompanyManager';
import UserProfile from './components/UserProfile';
import SubscriptionPrompt from './components/SubscriptionPrompt';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import FeedbackModal from './components/FeedbackModal';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useSupabaseCompanies } from './hooks/useSupabaseCompanies';
import type { Company, Client, Item, Invoice, Transporter, User, CompanyDetails, BankAccount, RecurringInvoice, RecurringFrequency, DraftInvoice, InvoiceItem, StockHistoryEntry, Quotation, Expense } from './types';
import Modal from './components/common/Modal';
import Input from './components/common/Input';
import Button from './components/common/Button';
import Inventory from './components/Inventory';
import Expenses from './components/Expenses';
import Quotations from './components/Quotations';
import CompanyLogo from './components/common/CompanyLogo';
import { supabase } from './supabase';
import { trackPageView, trackEvent } from './utils/analytics';
import { toast } from 'sonner';

const simpleHash = (s: string) => {
    let h = 0;
    for(let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    return h.toString();
};

const emptyCompanyDetails: CompanyDetails = { 
    logo: '', name: '', gstin: '', pan: '', phone: '', email: '', website: '',
    address: '', city: '', state: '', zip: '', udyam: '', signature: '',
    invoicePrefix: 'INV-', nextInvoiceNumber: 1
};

const defaultCompany: Omit<Company, 'id' | 'ownerId'> = {
    details: { ...emptyCompanyDetails, name: 'My First Company' },
    bankAccounts: [], clients: [], items: [], transporters: [], invoices: [], quotations: [], recurringInvoices: [], stockHistory: []
};

const emptyDraftInvoice: DraftInvoice = {
    invoiceNumber: '',
    clientId: '',
    items: [],
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    notes: '',
    selectedBankAccountId: null,
    shippingDetails: { name: '', address: '', city: '', state: '', zip: '', gstin: '' },
    isShippingSameAsBilling: true,
    transporterId: 'self',
    vehicleNumber: '',
    ewayBillNumber: '',
    type: 'invoice'
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState(() => {
    return sessionStorage.getItem('activeView') || 'Dashboard';
  });
  const [invoiceFilter, setInvoiceFilter] = useState<string>('');
  const [activeSearchQuery, setActiveSearchQuery] = useState<string>('');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'in' | 'low' | 'out'>('all');
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'dark');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [companies, setCompanies, isLoadingCompanies] = useSupabaseCompanies(currentUser?.id);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(() => {
    return sessionStorage.getItem('activeCompanyId');
  });
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | Quotation | null>(null);
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCompanySwitcherOpen, setIsCompanySwitcherOpen] = useState(false);
  const [isSubscriptionPromptOpen, setIsSubscriptionPromptOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  
  // Global Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  
  // Profile State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  // Lifted State for New Invoice Draft
  const [draftInvoice, setDraftInvoice] = useState<DraftInvoice>(emptyDraftInvoice);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  const activeCompany = useMemo(() => companies.find(c => c.id === activeCompanyId) || null, [companies, activeCompanyId]);
  const userCompanies = useMemo(() => companies.filter(c => c.ownerId === currentUser?.id), [companies, currentUser]);

  useEffect(() => {
    if (activeCompanyId) {
      sessionStorage.setItem('activeCompanyId', activeCompanyId);
    } else {
      sessionStorage.removeItem('activeCompanyId');
    }
  }, [activeCompanyId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node) && 
          searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    if (!globalSearchQuery.trim() || !activeCompany) return { invoices: [], clients: [], items: [] };
    const query = globalSearchQuery.toLowerCase();
    
    return {
      invoices: activeCompany.invoices.filter(inv => 
        inv.invoiceNumber.toLowerCase().includes(query) || 
        (activeCompany.clients.find(c => c.id === inv.clientId)?.name || '').toLowerCase().includes(query)
      ).slice(0, 5),
      clients: activeCompany.clients.filter(client => 
        client.name.toLowerCase().includes(query) || 
        (client.email || '').toLowerCase().includes(query)
      ).slice(0, 5),
      items: activeCompany.items.filter(item => 
        item.name.toLowerCase().includes(query) || 
        (item.hsn || '').toLowerCase().includes(query)
      ).slice(0, 5)
    };
  }, [globalSearchQuery, activeCompany]);

  const handleSearchResultClick = (type: 'invoice' | 'client' | 'item', id: string, nameOrNumber: string) => {
    setIsSearchDropdownOpen(false);
    setGlobalSearchQuery('');
    setActiveSearchQuery(nameOrNumber);
    if (type === 'invoice') {
      handleSetActiveView('Invoices');
    } else if (type === 'client') {
      handleSetActiveView('Clients');
    } else if (type === 'item') {
      handleSetActiveView('Items');
    }
  };

  useEffect(() => {
    trackPageView(activeView);
  }, [activeView]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    if (sessionId) {
      // Clear the session_id from the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      alert('Subscription successful! You can now create invoices.');
      // The webhook will update the database, and the realtime subscription will update the UI.
      // For immediate feedback, we could optimistically update the active company here,
      // but waiting for the webhook is safer.
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser({ 
          id: session.user.id, 
          email: session.user.email || '', 
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '', 
          passwordHash: '' 
        });
      } else {
        setCurrentUser(null);
      }
      setIsAuthReady(true);
    }).catch(err => {
      console.error("Error getting session:", err);
      setIsAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({ 
          id: session.user.id, 
          email: session.user.email || '', 
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '', 
          passwordHash: '' 
        });
      } else {
        setCurrentUser(null);
      }
      setIsAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser && companies.length > 0 && !activeCompanyId) {
        const firstCompany = companies.find(c => c.ownerId === currentUser.id);
        if (firstCompany) setActiveCompanyId(firstCompany.id);
    }
  }, [currentUser, companies, activeCompanyId]);

  useEffect(() => {
    const handleOpenSubscription = () => setIsSubscriptionPromptOpen(true);
    window.addEventListener('openSubscriptionPrompt', handleOpenSubscription);
    return () => window.removeEventListener('openSubscriptionPrompt', handleOpenSubscription);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key.toLowerCase() === 's' || e.code === 'KeyS')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        handleSetActiveView(customEvent.detail);
      }
    };
    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  
  // Apply brand color
  useEffect(() => {
    if (activeCompany?.details.brandColor) {
        const color = activeCompany.details.brandColor;
        document.documentElement.style.setProperty('--accent-color', color);
        
        // Simple darken function for hover state
        let r = parseInt(color.substring(1, 3), 16);
        let g = parseInt(color.substring(3, 5), 16);
        let b = parseInt(color.substring(5, 7), 16);
        
        r = Math.max(0, Math.floor(r * 0.85));
        g = Math.max(0, Math.floor(g * 0.85));
        b = Math.max(0, Math.floor(b * 0.85));
        
        const hoverColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        document.documentElement.style.setProperty('--accent-hover-color', hoverColor);
    } else {
        document.documentElement.style.removeProperty('--accent-color');
        document.documentElement.style.removeProperty('--accent-hover-color');
    }
  }, [activeCompany?.details.brandColor]);
  
  // Initialize draft invoice number when active company changes
  useEffect(() => {
      if (activeCompany) {
          const prefix = activeCompany.details.invoicePrefix || 'INV-';
          const defaultBank = activeCompany.bankAccounts.find(b => b.isDefault)?.id || (activeCompany.bankAccounts[0]?.id || null);
          
          let nextNum = activeCompany.details.nextInvoiceNumber || 1;
          let prefixStr = prefix;
          
          if (activeView === 'NewQuotation') {
              prefixStr = 'QT-';
              nextNum = (activeCompany.quotations?.length || 0) + 1;
          }

          setDraftInvoice(prev => ({
              ...prev,
              invoiceNumber: `${prefixStr}${nextNum.toString().padStart(3, '0')}`,
              selectedBankAccountId: defaultBank,
              type: activeView === 'NewQuotation' ? 'quote' : 'invoice'
          }));
      }
  }, [activeCompany?.id, activeCompany?.details.nextInvoiceNumber, activeView]);

  // --- Auth Handlers ---
  const handleLogout = async () => {
      try {
          await supabase.auth.signOut();
      } catch (err) {
          console.error("Error signing out:", err);
      } finally {
          setCurrentUser(null);
          setActiveCompanyId(null);
      }
  };
  
  const handleUpdateProfile = (updatedUser: User) => {
      setCurrentUser(updatedUser);
  };

  const handleSetActiveView = (view: string) => {
    setActiveView(view);
    sessionStorage.setItem('activeView', view);
  };

  // --- Company Handlers ---
  const handleAddCompany = (companyDetails: CompanyDetails) => {
      if(!currentUser) return;
      const newCompany: Company = {
          id: `comp_${Date.now()}`,
          ownerId: currentUser.id,
          details: companyDetails,
          bankAccounts: [], clients: [], items: [], transporters: [], invoices: [], quotations: [], recurringInvoices: [], stockHistory: []
      };
      setCompanies([...companies, newCompany]);
      setActiveCompanyId(newCompany.id);
      setActiveView('Dashboard');
      trackEvent('create_company', { companyId: newCompany.id });
  };

  const handleCreateNewCompany = () => {
    if (newCompanyName.trim()) {
        handleAddCompany({ ...emptyCompanyDetails, name: newCompanyName.trim() });
        setIsAddCompanyModalOpen(false);
        setNewCompanyName('');
    }
  };

  const handleUpdateCompany = (updatedCompany: Company) => {
      setCompanies(companies.map(c => c.id === updatedCompany.id ? updatedCompany : c));
  };
  
  const handleSwitchCompany = (companyId: string) => {
      setActiveCompanyId(companyId);
      setActiveView('Dashboard');
  };

  // --- Stock Log Helper ---
  const createStockLog = (
      itemId: string, 
      itemName: string, 
      prevQty: number, 
      newQty: number, 
      action: StockHistoryEntry['action'], 
      refId?: string
  ): StockHistoryEntry => ({
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      itemId,
      itemName,
      previousQuantity: prevQty,
      newQuantity: newQty,
      action,
      timestamp: new Date().toISOString(),
      referenceId: refId
  });

  // --- Recurring Invoice Generation Logic ---
  useEffect(() => {
      if (!activeCompany || !activeCompany.recurringInvoices) return;
      
      const today = new Date().toISOString().split('T')[0];
      let updatedInvoices = [...activeCompany.invoices];
      let updatedRecurring = [...(activeCompany.recurringInvoices || [])];
      let updatedItems = [...activeCompany.items];
      let updatedDetails = { ...activeCompany.details };
      let newHistoryLogs: StockHistoryEntry[] = [];
      let hasChanges = false;
      let nextInvoiceNum = updatedDetails.nextInvoiceNumber;

      const getNextDate = (current: string, freq: RecurringFrequency): string => {
          const date = new Date(current);
          if (freq === 'Daily') date.setDate(date.getDate() + 1);
          if (freq === 'Weekly') date.setDate(date.getDate() + 7);
          if (freq === 'Monthly') date.setMonth(date.getMonth() + 1);
          if (freq === 'Quarterly') date.setMonth(date.getMonth() + 3);
          if (freq === 'Yearly') date.setFullYear(date.getFullYear() + 1);
          return date.toISOString().split('T')[0];
      };

      updatedRecurring = updatedRecurring.map(rec => {
          if (rec.status === 'Active' && rec.nextRunDate <= today) {
              if (rec.endDate && rec.nextRunDate > rec.endDate) {
                  return { ...rec, status: 'Completed' };
              }
              const client = activeCompany.clients.find(c => c.id === rec.clientId);
              if (client) {
                  hasChanges = true;
                  const invoiceNumber = `${updatedDetails.invoicePrefix}${nextInvoiceNum.toString().padStart(3, '0')}`;
                  nextInvoiceNum++;
                  
                  let subTotal = 0, cgst = 0, sgst = 0, igst = 0;
                  const isIntraState = client.state === activeCompany.details.state;
                  
                  const items = rec.items.map(i => {
                      const taxable = i.price * i.quantity;
                      subTotal += taxable;
                      const tax = (taxable * i.gstRate) / 100;
                      if (isIntraState) { cgst += tax / 2; sgst += tax / 2; } else { igst += tax; }
                      
                      const itemIndex = updatedItems.findIndex(invItem => invItem.id === i.id);
                      if (itemIndex > -1) {
                        const prevQty = Number(updatedItems[itemIndex].quantityInStock) || 0;
                        const newQty = prevQty - i.quantity;
                        updatedItems[itemIndex] = { ...updatedItems[itemIndex], quantityInStock: newQty };
                        
                        newHistoryLogs.push(createStockLog(
                            i.id, i.name, prevQty, newQty, 'Invoice Created', invoiceNumber
                        ));
                      }
                      return i;
                  });
                  
                  const grandTotal = subTotal + cgst + sgst + igst;
                  const newInvoice: Invoice = {
                      id: `inv_rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                      invoiceNumber, client, items, issueDate: rec.nextRunDate, dueDate: rec.nextRunDate,
                      notes: rec.notes || 'Recurring Invoice', subTotal, cgst, sgst, igst, grandTotal,
                      status: 'Unpaid', selectedBankAccountId: activeCompany.bankAccounts.find(b => b.isDefault)?.id || null,
                      shippingName: client.name, shippingAddress: client.shippingAddress || client.address,
                      shippingCity: client.shippingCity || client.city, shippingState: client.shippingState || client.state,
                      shippingZip: client.shippingZip || client.zip, shippingGstin: client.gstin
                  };
                  updatedInvoices.push(newInvoice);
                  return { ...rec, lastRunDate: rec.nextRunDate, nextRunDate: getNextDate(rec.nextRunDate, rec.frequency) };
              }
          }
          return rec;
      });

      if (hasChanges) {
          updatedDetails.nextInvoiceNumber = nextInvoiceNum;
          handleUpdateCompany({ 
              ...activeCompany, 
              details: updatedDetails, 
              invoices: updatedInvoices.sort((a,b) => b.invoiceNumber.localeCompare(a.invoiceNumber, undefined, {numeric: true})), 
              recurringInvoices: updatedRecurring, 
              items: updatedItems,
              stockHistory: [...(activeCompany.stockHistory || []), ...newHistoryLogs]
          });
      }
  }, [activeCompanyId]);

  const handleAddRecurring = (profile: Omit<RecurringInvoice, 'id'>) => {
      if (!activeCompany) return;
      handleUpdateCompany({ ...activeCompany, recurringInvoices: [...(activeCompany.recurringInvoices || []), { ...profile, id: `rec_${Date.now()}` }] });
  };

  const handleUpdateRecurring = (updatedProfile: RecurringInvoice) => {
      if (!activeCompany) return;
      handleUpdateCompany({ ...activeCompany, recurringInvoices: activeCompany.recurringInvoices.map(r => r.id === updatedProfile.id ? updatedProfile : r) });
  };

  const handleDeleteRecurring = (id: string) => {
      if (!activeCompany) return;
      handleUpdateCompany({ ...activeCompany, recurringInvoices: activeCompany.recurringInvoices.filter(r => r.id !== id) });
  };

  const createCompanyDataUpdater = <T,>(dataType: keyof Omit<Company, 'id' | 'ownerId' | 'details' | 'invoices' | 'recurringInvoices' | 'stockHistory' | 'quotations'>) => (data: T[]) => {
      if(!activeCompany) return;
      const prevLength = (activeCompany[dataType] as any[] || []).length;
      const newLength = data.length;
      const label = dataType === 'clients' ? 'Client' : dataType === 'items' ? 'Item' : dataType === 'transporters' ? 'Transporter' : 'Data';
      
      if (newLength > prevLength) {
          toast.success(`${label} saved to database`);
      } else if (newLength < prevLength) {
          toast.success(`${label} deleted`);
      } else {
          toast.success(`${label} updated`);
      }
      
      const updatedCompany = { ...activeCompany, [dataType]: data };
      handleUpdateCompany(updatedCompany as Company);
  };

  const setClients = createCompanyDataUpdater<Client>('clients');
  // Replaced setItems with custom logic inside bulk updates, but keeping this for direct access if needed
  const setItems = createCompanyDataUpdater<Item>('items');
  const setTransporters = createCompanyDataUpdater<Transporter>('transporters');
  
  // New Bulk Update Logic for Inventory Page
  const handleBulkStockUpdate = (updates: { itemId: string, newQuantity: number }[], actionType: StockHistoryEntry['action'] = 'Bulk Update') => {
      if (!activeCompany) return;
      const updatedItems = [...activeCompany.items];
      const newHistoryLogs: StockHistoryEntry[] = [];

      updates.forEach(update => {
          const idx = updatedItems.findIndex(i => i.id === update.itemId);
          if (idx !== -1) {
              const prevQty = updatedItems[idx].quantityInStock;
              if (prevQty !== update.newQuantity) {
                  updatedItems[idx] = { ...updatedItems[idx], quantityInStock: update.newQuantity };
                  newHistoryLogs.push(createStockLog(
                      updatedItems[idx].id, 
                      updatedItems[idx].name, 
                      prevQty, 
                      update.newQuantity, 
                      actionType
                  ));
              }
          }
      });

      if (newHistoryLogs.length > 0) {
          handleUpdateCompany({
              ...activeCompany,
              items: updatedItems,
              stockHistory: [...(activeCompany.stockHistory || []), ...newHistoryLogs]
          });
      }
  };

  const handleSaveInvoice = (data: Omit<Invoice, 'id' | 'status'> | Invoice | Omit<Quotation, 'id' | 'status'>) => {
        if (!activeCompany) return;
        let updatedItems = [...activeCompany.items];
        let updatedInvoices = [...activeCompany.invoices];
        let updatedQuotations = [...(activeCompany.quotations || [])];
        let updatedDetails = { ...activeCompany.details };
        let newHistoryLogs: StockHistoryEntry[] = [];

        // Check if it's a Quotation
        if ('quotationNumber' in data) {
            const quotationData = data as Quotation | Omit<Quotation, 'id' | 'status'>;
            if ('id' in quotationData) {
                // Update existing quote
                updatedQuotations = updatedQuotations.map(q => q.id === quotationData.id ? { ...q, ...quotationData } as Quotation : q);
                trackEvent('update_quotation', { quotationId: quotationData.id });
                toast.success(`Quotation ${quotationData.quotationNumber} updated`);
            } else {
                // New Quote
                const newQuote: Quotation = { 
                    ...quotationData, 
                    id: `qt_${Date.now()}`, 
                    status: 'Draft',
                    selectedBankAccountId: quotationData.selectedBankAccountId || null
                } as Quotation;
                updatedQuotations.push(newQuote);
                toast.success(`Quotation ${newQuote.quotationNumber} saved to database`);
            }
            // Save logic
            handleUpdateCompany({ ...activeCompany, quotations: updatedQuotations });
            setDraftInvoice(emptyDraftInvoice);
            return;
        }

        // Invoice Logic
        const invoiceData = data as Invoice | Omit<Invoice, 'id' | 'status'>;
        if ('id' in invoiceData) {
            // Edit Mode
            const updatedInvoice = invoiceData as Invoice;
            const originalInvoice = activeCompany.invoices.find(inv => inv.id === updatedInvoice.id);
            if (!originalInvoice) return; 
            
            const originalItemsMap = new Map<string, number>(originalInvoice.items.map(item => [item.id, item.quantity] as [string, number]));
            const updatedItemsMap = new Map<string, number>(updatedInvoice.items.map(item => [item.id, item.quantity] as [string, number]));
            const allItemIds = new Set([...originalItemsMap.keys(), ...updatedItemsMap.keys()]);

            allItemIds.forEach(itemId => {
                const originalQty = originalItemsMap.get(itemId) || 0;
                const updatedQty = updatedItemsMap.get(itemId) || 0;
                const diff = originalQty - updatedQty; // +ve means item removed from invoice (stock increase), -ve means item added (stock decrease)
                
                if (diff !== 0) {
                    const itemIndex = updatedItems.findIndex(i => i.id === itemId);
                    if (itemIndex > -1) {
                        const prevStock = Number(updatedItems[itemIndex].quantityInStock) || 0;
                        const newStock = prevStock + diff;
                        updatedItems[itemIndex] = { ...updatedItems[itemIndex], quantityInStock: newStock };
                        
                        newHistoryLogs.push(createStockLog(
                            updatedItems[itemIndex].id,
                            updatedItems[itemIndex].name,
                            prevStock,
                            newStock,
                            'Invoice Edited',
                            updatedInvoice.invoiceNumber
                        ));
                    }
                }
            });
            updatedInvoices = updatedInvoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv);
            trackEvent('update_invoice', { invoiceId: updatedInvoice.id });
            toast.success(`Invoice ${updatedInvoice.invoiceNumber} updated`);
        } else {
            // Create Mode
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const invoicesThisMonth = activeCompany.invoices.filter(inv => {
                const d = new Date(inv.issueDate);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            }).length;

            const sub = activeCompany.subscription;
            const monthlyLimit = (!sub || sub.plan === 'free') ? 10 : sub.invoiceLimit;
            let newAddonInvoices = sub?.addonInvoices || 0;

            if (invoicesThisMonth >= monthlyLimit) {
                if (newAddonInvoices > 0) {
                    newAddonInvoices -= 1;
                } else {
                    alert('You have reached your invoice limit for this month. Please purchase an add-on or upgrade your plan.');
                    setIsSubscriptionPromptOpen(true);
                    return;
                }
            }

            const newInvoiceData = invoiceData as Omit<Invoice, 'id' | 'status'>;
            const nextNumber = Number(activeCompany.details.nextInvoiceNumber || 1);
            const expectedInvoiceNumber = `${activeCompany.details.invoicePrefix || 'INV-'}${nextNumber.toString().padStart(3, '0')}`;
            
            newInvoiceData.items.forEach(soldItem => {
                const itemIndex = updatedItems.findIndex(i => i.id === soldItem.id);
                if (itemIndex > -1) {
                    const prevStock = Number(updatedItems[itemIndex].quantityInStock) || 0;
                    const newStock = prevStock - soldItem.quantity;
                    updatedItems[itemIndex] = { ...updatedItems[itemIndex], quantityInStock: newStock };
                    
                    newHistoryLogs.push(createStockLog(
                        updatedItems[itemIndex].id,
                        updatedItems[itemIndex].name,
                        prevStock,
                        newStock,
                        'Invoice Created',
                        newInvoiceData.invoiceNumber
                    ));
                }
            });
            const newInvoice: Invoice = { ...newInvoiceData, id: `inv_${Date.now()}`, status: 'Unpaid' };
            updatedInvoices.push(newInvoice);
            if (newInvoiceData.invoiceNumber === expectedInvoiceNumber) updatedDetails.nextInvoiceNumber = nextNumber + 1;
            trackEvent('create_invoice', { invoiceId: newInvoice.id });
            toast.success(`Invoice ${newInvoice.invoiceNumber} saved to database`);
        }
        
        const updatedSubscription = activeCompany.subscription ? {
            ...activeCompany.subscription,
            invoiceCount: ('id' in invoiceData) ? activeCompany.subscription.invoiceCount : (activeCompany.subscription.invoiceCount || 0) + 1,
            addonInvoices: ('id' in invoiceData) ? activeCompany.subscription.addonInvoices : (activeCompany.subscription.addonInvoices || 0)
        } : {
            plan: 'free' as const,
            status: 'active' as const,
            currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
            invoiceCount: ('id' in invoiceData) ? 0 : 1,
            invoiceLimit: 10,
            addonInvoices: 0
        };

        // If we consumed an add-on, update it
        if (!('id' in invoiceData)) {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const invoicesThisMonth = activeCompany.invoices.filter(inv => {
                const d = new Date(inv.issueDate);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            }).length;
            const monthlyLimit = (!activeCompany.subscription || activeCompany.subscription.plan === 'free') ? 10 : activeCompany.subscription.invoiceLimit;
            
            if (invoicesThisMonth >= monthlyLimit && updatedSubscription.addonInvoices && updatedSubscription.addonInvoices > 0) {
                updatedSubscription.addonInvoices -= 1;
            }
        }

        handleUpdateCompany({ 
            ...activeCompany, 
            items: updatedItems, 
            invoices: updatedInvoices.sort((a,b) => b.invoiceNumber.localeCompare(a.invoiceNumber, undefined, {numeric: true})), 
            details: updatedDetails,
            stockHistory: [...(activeCompany.stockHistory || []), ...newHistoryLogs],
            subscription: updatedSubscription
        });
        
        setDraftInvoice(emptyDraftInvoice);
  };
  
    const handleDeleteInvoice = (invoiceId: string) => handleBulkDeleteInvoices([invoiceId]);

    const handleBulkDeleteInvoices = (ids: string[]) => {
        if (!activeCompany) return;
        let updatedItems = [...activeCompany.items];
        let newHistoryLogs: StockHistoryEntry[] = [];
        
        const invoicesToDelete = activeCompany.invoices.filter(inv => ids.includes(inv.id));
        let maxDeletedNumber = 0;
        const prefix = activeCompany.details.invoicePrefix || 'INV-';
        
        invoicesToDelete.forEach(invoice => {
             // Track the max number of invoices being deleted
             if (invoice.invoiceNumber && invoice.invoiceNumber.startsWith(prefix)) {
                const numStr = invoice.invoiceNumber.substring(prefix.length);
                const num = parseInt(numStr, 10);
                if (!isNaN(num) && num > maxDeletedNumber) maxDeletedNumber = num;
             }
             
             invoice.items.forEach(soldItem => {
                const itemIndex = updatedItems.findIndex(i => i.id === soldItem.id);
                if (itemIndex > -1) {
                    const prevStock = Number(updatedItems[itemIndex].quantityInStock) || 0;
                    const newStock = prevStock + soldItem.quantity; // Restore stock
                    updatedItems[itemIndex] = { ...updatedItems[itemIndex], quantityInStock: newStock };
                    
                    newHistoryLogs.push(createStockLog(
                        updatedItems[itemIndex].id,
                        updatedItems[itemIndex].name,
                        prevStock,
                        newStock,
                        'Invoice Deleted',
                        invoice.invoiceNumber
                    ));
                }
             });
        });
        const updatedInvoices = activeCompany.invoices.filter(inv => !ids.includes(inv.id));
        
        let newDetails = activeCompany.details;
        if (maxDeletedNumber > 0 && maxDeletedNumber === ((activeCompany.details.nextInvoiceNumber || 1) - 1)) {
            const remainingNums = updatedInvoices
                .filter(inv => inv.invoiceNumber && inv.invoiceNumber.startsWith(prefix))
                .map(inv => parseInt(inv.invoiceNumber.substring(prefix.length), 10))
                .filter(n => !isNaN(n));
            const newMax = remainingNums.length > 0 ? Math.max(...remainingNums) : 0;
            newDetails = { ...newDetails, nextInvoiceNumber: Math.max(1, newMax + 1) };
        }

        handleUpdateCompany({ 
            ...activeCompany, 
            details: newDetails,
            items: updatedItems, 
            invoices: updatedInvoices,
            stockHistory: [...(activeCompany.stockHistory || []), ...newHistoryLogs]
        });
        toast.success("Invoice(s) deleted");
    };

    const handleUpdateInvoiceStatus = (invoiceId: string, status: Invoice['status']) => handleBulkStatusChange([invoiceId], status);

    const handleUpdateQuotationStatus = (quotationId: string, status: Quotation['status']) => {
        if (!activeCompany) return;
        const updatedQuotations = activeCompany.quotations.map(q => q.id === quotationId ? { ...q, status } : q);
        handleUpdateCompany({ ...activeCompany, quotations: updatedQuotations });
    };

    const handleBulkStatusChange = (ids: string[], status: Invoice['status']) => {
        if (!activeCompany) return;
        const updatedInvoices = activeCompany.invoices.map(inv => ids.includes(inv.id) ? { ...inv, status } : inv);
        handleUpdateCompany({ ...activeCompany, invoices: updatedInvoices });
    };

    const handleBulkDeleteClients = (ids: string[]) => {
        if(!activeCompany) return;
        handleUpdateCompany({ ...activeCompany, clients: activeCompany.clients.filter(c => !ids.includes(c.id)) });
        toast.success("Client(s) deleted");
    };

    const handleBulkDeleteItems = (ids: string[]) => {
        if(!activeCompany) return;
        handleUpdateCompany({ ...activeCompany, items: activeCompany.items.filter(i => !ids.includes(i.id)) });
        toast.success("Item(s) deleted");
    };

    const handleEditInvoice = (invoiceId: string) => {
    const invoice = activeCompany?.invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
      setInvoiceToEdit(invoice);
      handleSetActiveView('NewInvoice');
    }
  };

  const handleEditQuotation = (quotationId: string) => {
      const quote = activeCompany?.quotations.find(q => q.id === quotationId);
      if (quote) {
          setInvoiceToEdit(quote);
          handleSetActiveView('NewQuotation');
      }
  };

  const handleDeleteQuotation = (id: string) => {
      if(!activeCompany) return;
      handleUpdateCompany({ ...activeCompany, quotations: activeCompany.quotations.filter(q => q.id !== id) });
      toast.success("Quotation deleted");
  };

  const handleConvertQuoteToInvoice = (id: string) => {
      const quote = activeCompany?.quotations.find(q => q.id === id);
      if(!quote) return;
      
      const updatedQuotes = activeCompany.quotations.map(q => q.id === id ? { ...q, status: 'Converted' as const } : q);
      const nextNum = activeCompany.details.nextInvoiceNumber || 1;
      const prefix = activeCompany.details.invoicePrefix || 'INV-';
      
      setDraftInvoice({
          invoiceNumber: `${prefix}${nextNum.toString().padStart(3, '0')}`,
          clientId: quote.client.id,
          items: quote.items,
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date().toISOString().split('T')[0],
          notes: quote.notes,
          selectedBankAccountId: quote.selectedBankAccountId,
          shippingDetails: {
              name: quote.shippingName || quote.client.name,
              address: quote.shippingAddress || quote.client.address,
              city: quote.shippingCity || quote.client.city,
              state: quote.shippingState || quote.client.state,
              zip: quote.shippingZip || quote.client.zip,
              gstin: quote.shippingGstin || quote.client.gstin || ''
          },
          isShippingSameAsBilling: false, 
          transporterId: '',
          vehicleNumber: '',
          ewayBillNumber: '',
          type: 'invoice'
      });
      
      handleUpdateCompany({ ...activeCompany, quotations: updatedQuotes });
      handleSetActiveView('NewInvoice');
  };

  if (!isAuthReady || isLoadingCompanies) {
    return <div className="w-full h-screen bg-slate-100 dark:bg-secondary-dark flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div></div>;
  }

  if (!currentUser) {
    if (activeView === 'PrivacyPolicy') {
      return <PrivacyPolicy onBack={() => handleSetActiveView('Dashboard')} />;
    }
    if (activeView === 'TermsOfService') {
      return <TermsOfService onBack={() => handleSetActiveView('Dashboard')} />;
    }
    if (showAuth) {
      return <Auth onBack={() => setShowAuth(false)} />;
    }
    return <Landing 
      onGetStarted={() => setShowAuth(true)} 
      onNavigateToPrivacy={() => handleSetActiveView('PrivacyPolicy')}
      onNavigateToTerms={() => handleSetActiveView('TermsOfService')}
    />;
  }

  if (!activeCompany) {
    return <CompanyManager onAddCompany={handleAddCompany} onLogout={handleLogout}/>;
  }

  const handleAddExpense = (expenseData: Omit<Expense, 'id'>) => {
    if (!activeCompany) return;
    const newExpense: Expense = {
      ...expenseData,
      id: `exp_${Date.now()}`
    };
    const updatedExpenses = [...(activeCompany.expenses || []), newExpense];
    handleUpdateCompany({
      ...activeCompany,
      expenses: updatedExpenses
    });
    toast.success('Expense recorded successfully');
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (!activeCompany) return;
    const updatedExpenses = (activeCompany.expenses || []).filter(e => e.id !== expenseId);
    handleUpdateCompany({
      ...activeCompany,
      expenses: updatedExpenses
    });
    toast.success('Expense removed');
  };

  const renderView = () => {
    switch (activeView) {
      case 'Dashboard': 
        return <Dashboard 
          invoices={activeCompany.invoices} 
          items={activeCompany.items} 
          company={activeCompany} 
          setActiveView={handleSetActiveView} 
          setInvoiceFilter={setInvoiceFilter}
          setInventoryFilter={setInventoryFilter}
          onContinueDraft={() => {
            setInvoiceToEdit(null);
            handleSetActiveView('NewInvoice');
          }}
        />;
      case 'NewInvoice': return <NewInvoice company={activeCompany} saveInvoice={handleSaveInvoice} setActiveView={handleSetActiveView} invoiceToEdit={invoiceToEdit as Invoice} clearEditingInvoice={() => setInvoiceToEdit(null)} onUpdateCompany={handleUpdateCompany} draftInvoice={draftInvoice} setDraftInvoice={setDraftInvoice} mode="invoice" />;
      case 'NewQuotation': return <NewInvoice company={activeCompany} saveInvoice={handleSaveInvoice} setActiveView={handleSetActiveView} invoiceToEdit={invoiceToEdit as Quotation} clearEditingInvoice={() => setInvoiceToEdit(null)} onUpdateCompany={handleUpdateCompany} draftInvoice={draftInvoice} setDraftInvoice={setDraftInvoice} mode="quote" />;
      case 'Invoices': return <Invoices invoices={activeCompany.invoices} company={activeCompany} setActiveView={handleSetActiveView} onEdit={handleEditInvoice} onDelete={handleDeleteInvoice} onStatusChange={handleUpdateInvoiceStatus} onBulkDelete={handleBulkDeleteInvoices} onBulkStatusChange={handleBulkStatusChange} onAddRecurring={handleAddRecurring} onUpdateRecurring={handleUpdateRecurring} onDeleteRecurring={handleDeleteRecurring} initialFilter={invoiceFilter} initialSearchQuery={activeSearchQuery} />;
      case 'Quotations': return <Quotations quotations={activeCompany.quotations || []} company={activeCompany} setActiveView={handleSetActiveView} onEdit={handleEditQuotation} onDelete={handleDeleteQuotation} onConvert={handleConvertQuoteToInvoice} onStatusChange={handleUpdateQuotationStatus} />;
      case 'Clients': return <Clients clients={activeCompany.clients} setClients={setClients} invoices={activeCompany.invoices} company={activeCompany} onEditInvoice={handleEditInvoice} onDeleteInvoice={handleDeleteInvoice} onStatusChange={handleUpdateInvoiceStatus} onBulkDelete={handleBulkDeleteClients} initialSearchQuery={activeSearchQuery} />;
      case 'Items': return <Items items={activeCompany.items} setItems={setItems} company={activeCompany} onBulkDelete={handleBulkDeleteItems} initialSearchQuery={activeSearchQuery} />;
      case 'Inventory': return <Inventory items={activeCompany.items} setItems={setItems} onBulkStockUpdate={handleBulkStockUpdate} stockHistory={activeCompany.stockHistory || []} initialFilter={inventoryFilter} />;
      case 'Expenses': return <Expenses company={activeCompany} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} />;
      case 'Transporters': return <Transporters transporters={activeCompany.transporters} setTransporters={setTransporters} />;
      case 'Settings': return <Settings activeCompany={activeCompany} updateCompany={handleUpdateCompany} />;
      case 'PrivacyPolicy': return <PrivacyPolicy onBack={() => handleSetActiveView('Dashboard')} />;
      case 'TermsOfService': return <TermsOfService onBack={() => handleSetActiveView('Dashboard')} />;
      default: return (
        <Dashboard 
          invoices={activeCompany.invoices} 
          items={activeCompany.items} 
          company={activeCompany} 
          setActiveView={handleSetActiveView}
          setInvoiceFilter={setInvoiceFilter}
          setInventoryFilter={setInventoryFilter}
          onContinueDraft={() => {
            setInvoiceToEdit(null);
            handleSetActiveView('NewInvoice');
          }}
        />
      );
    }
  };

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-secondary-dark font-sans transition-all relative overflow-hidden">
            <Sidebar
                activeView={activeView}
                setActiveView={handleSetActiveView}
                theme={theme}
                setTheme={setTheme}
                userCompanies={userCompanies}
                activeCompany={activeCompany}
                onSwitchCompany={handleSwitchCompany}
                onAddCompany={() => setIsAddCompanyModalOpen(true)}
                onLogout={handleLogout}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                currentUser={currentUser}
                onOpenProfile={() => setIsProfileOpen(true)}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
            <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-0' : ''}`}>
                {/* Top Header / Search Bar */}
                <header className="h-20 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30">
                    <div className="flex items-center gap-4 flex-1 max-w-2xl">
                        <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <Menu className="h-6 w-6" />
                        </button>
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-accent transition-colors" />
                            <input 
                                ref={searchInputRef}
                                type="text" 
                                value={globalSearchQuery}
                                onChange={(e) => {
                                    setGlobalSearchQuery(e.target.value);
                                    setIsSearchDropdownOpen(true);
                                }}
                                onFocus={() => setIsSearchDropdownOpen(true)}
                                placeholder="Search invoices, clients, or items... (Alt + S)"
                                className="w-full bg-slate-100/50 dark:bg-slate-800/50 border border-transparent focus:border-accent/30 focus:bg-white dark:focus:bg-slate-900 rounded-2xl py-2.5 pl-11 pr-16 text-sm outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-400">
                                <span>ALT</span>
                                <span>S</span>
                            </div>
                            
                            {/* Search Dropdown */}
                            {isSearchDropdownOpen && globalSearchQuery.trim() && (
                                <div ref={searchDropdownRef} className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 max-h-96 overflow-y-auto custom-scrollbar">
                                    {searchResults.invoices.length === 0 && searchResults.clients.length === 0 && searchResults.items.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-slate-500">No results found for "{globalSearchQuery}"</div>
                                    ) : (
                                        <div className="py-2">
                                            {searchResults.invoices.length > 0 && (
                                                <div className="mb-2">
                                                    <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoices</div>
                                                    {searchResults.invoices.map(inv => (
                                                        <button key={inv.id} onClick={() => handleSearchResultClick('invoice', inv.id, inv.invoiceNumber)} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors">
                                                            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg"><FileText className="w-4 h-4" /></div>
                                                            <div>
                                                                <div className="text-sm font-medium text-slate-900 dark:text-white">{inv.invoiceNumber}</div>
                                                                <div className="text-xs text-slate-500">{activeCompany?.clients.find(c => c.id === inv.clientId)?.name}</div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {searchResults.clients.length > 0 && (
                                                <div className="mb-2">
                                                    <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clients</div>
                                                    {searchResults.clients.map(client => (
                                                        <button key={client.id} onClick={() => handleSearchResultClick('client', client.id, client.name)} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors">
                                                            <div className="p-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg"><Users className="w-4 h-4" /></div>
                                                            <div>
                                                                <div className="text-sm font-medium text-slate-900 dark:text-white">{client.name}</div>
                                                                <div className="text-xs text-slate-500">{client.email || 'No email'}</div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {searchResults.items.length > 0 && (
                                                <div>
                                                    <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Items</div>
                                                    {searchResults.items.map(item => (
                                                        <button key={item.id} onClick={() => handleSearchResultClick('item', item.id, item.name)} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors">
                                                            <div className="p-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg"><Package className="w-4 h-4" /></div>
                                                            <div>
                                                                <div className="text-sm font-medium text-slate-900 dark:text-white">{item.name}</div>
                                                                <div className="text-xs text-slate-500">HSN: {item.hsn || 'N/A'}</div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 ml-4">
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors hidden sm:block"
                            title="Sign Out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>

                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

                        <div className="relative">
                            <button
                                onClick={() => setIsCompanySwitcherOpen(!isCompanySwitcherOpen)}
                                className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group"
                            >
                                <CompanyLogo company={activeCompany} size="sm" />
                                <div className="hidden lg:flex flex-col items-start mr-2">
                                    <span className="text-xs font-black text-slate-900 dark:text-white leading-none group-hover:text-accent transition-colors">{activeCompany?.details.name}</span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mt-1">Active Workspace</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isCompanySwitcherOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isCompanySwitcherOpen && (
                                <div className="absolute z-50 top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden ring-1 ring-black ring-opacity-5 animate-fade-in">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Switch Workspace</p>
                                    </div>
                                    <ul className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                                        {userCompanies.map(company => (
                                            <li key={company.id}>
                                                <button
                                                    onClick={() => {
                                                        handleSwitchCompany(company.id);
                                                        setIsCompanySwitcherOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${activeCompany?.id === company.id ? 'bg-slate-50 dark:bg-slate-700/50' : ''}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <CompanyLogo company={company} size="sm" />
                                                        <span className={`truncate text-xs ${activeCompany?.id === company.id ? 'font-black text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 font-bold'}`}>
                                                            {company.details.name}
                                                        </span>
                                                    </div>
                                                    {activeCompany?.id === company.id && <Check className="w-4 h-4 text-accent" />}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                        <button
                                            onClick={() => {
                                                setIsAddCompanyModalOpen(true);
                                                setIsCompanySwitcherOpen(false);
                                            }}
                                            className="w-full text-center px-4 py-2.5 text-[10px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-accent dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-600 font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                                        >
                                            + New Company
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setIsFeedbackModalOpen(true)} title="Help & Feedback" className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-all shadow-sm">
                            <MessageSquare className="w-5 h-5" />
                        </button>
                        <button onClick={() => setIsProfileOpen(true)} className="w-10 h-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center hover:bg-accent hover:text-white transition-all shadow-sm">
                            <UserIcon className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    {renderView()}
                </div>
            </main>

       <Modal isOpen={isAddCompanyModalOpen} onClose={() => setIsAddCompanyModalOpen(false)} title="Create New Company">
          <div className="p-6 space-y-4">
            <Input label="Company Name" id="new-company-name" value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} placeholder="Enter your new company's name" required />
          </div>
          <div className="p-6 pt-0 flex justify-end gap-4">
            <Button variant="secondary" onClick={() => { setIsAddCompanyModalOpen(false); setNewCompanyName(''); }}>Cancel</Button>
            <Button onClick={handleCreateNewCompany} disabled={!newCompanyName.trim()}>Create Company</Button>
          </div>
        </Modal>

        <Modal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} title="User Profile">
            {currentUser && <UserProfile user={currentUser} onUpdateProfile={handleUpdateProfile} onClose={() => setIsProfileOpen(false)} />}
        </Modal>

        {currentUser && (
          <FeedbackModal 
            isOpen={isFeedbackModalOpen} 
            onClose={() => setIsFeedbackModalOpen(false)} 
            userId={currentUser.id} 
          />
        )}

        <SubscriptionPrompt 
          isOpen={isSubscriptionPromptOpen} 
          onClose={() => setIsSubscriptionPromptOpen(false)} 
          onSubscribe={async (plan) => {
            if (!activeCompany) return;
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) throw new Error("Not authenticated");

              const response = await fetch('/api/create-cashfree-order', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                  plan,
                  companyId: activeCompany.id,
                  customerEmail: currentUser?.email,
                  customerName: currentUser?.name || 'Customer',
                }),
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create order');
              }
              
              const { payment_session_id } = await response.json();
              if (payment_session_id) {
                // Initialize Cashfree
                const cashfree = window.Cashfree({
                  mode: "sandbox", // Change to "production" for live
                });
                
                cashfree.checkout({
                  paymentSessionId: payment_session_id,
                  redirectTarget: "_self",
                });
              }
            } catch (error) {
              console.error('Error creating checkout session:', error);
              alert('Failed to start checkout process. Please try again.');
            }
          }} 
        />
    </div>
  );
};

export default App;