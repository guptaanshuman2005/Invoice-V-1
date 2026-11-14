import React, { useState, useMemo, useEffect } from 'react';
import type { Item, StockHistoryEntry, Company } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Modal from './common/Modal';
import { 
  AlertTriangle, 
  AlertCircle, 
  Download, 
  Package, 
  IndianRupee, 
  CheckCircle2, 
  ShieldAlert, 
  Calculator, 
  ClipboardCheck, 
  TrendingUp, 
  RefreshCw, 
  FileSpreadsheet, 
  Layers,
  Search
} from 'lucide-react';
import { exportStockAuditSchedule } from '../utils/auditExport';
import { 
  computeStockValuation, 
  comparePhysicalStock, 
  exportFifoValuationSchedule, 
  exportPhysicalAuditSchedule,
  type ValuationMethod
} from '../utils/stockValuation';
import { toast } from 'sonner';

interface InventoryProps {
  items: Item[];
  setItems: (items: Item[]) => void;
  onBulkStockUpdate?: (updates: { itemId: string, newQuantity: number }[], action: StockHistoryEntry['action']) => void;
  stockHistory: StockHistoryEntry[];
  initialFilter?: 'all' | 'in' | 'low' | 'out';
  company?: Company;
}

// Helper for fuzzy search
const fuzzyMatch = (text: string, query: string): boolean => {
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (t.includes(q)) return true;
  let qIdx = 0;
  let tIdx = 0;
  while (qIdx < q.length && tIdx < t.length) {
    if (q[qIdx] === t[tIdx]) {
      qIdx++;
    }
    tIdx++;
  }
  return qIdx === q.length;
};

// Icons
const WarningIcon = () => <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
const AlertIcon = () => <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />;

const Inventory: React.FC<InventoryProps> = ({ 
  items, 
  setItems, 
  onBulkStockUpdate, 
  stockHistory, 
  initialFilter, 
  company 
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'valuation' | 'verification'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in' | 'low' | 'out'>(initialFilter || 'all');
  const [valuationMethod, setValuationMethod] = useState<ValuationMethod>('FIFO');

  useEffect(() => {
    if (initialFilter) {
      setStockFilter(initialFilter);
    }
  }, [initialFilter]);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState<number>(0);
  const [costPriceValue, setCostPriceValue] = useState<number>(0);
  const [stockReason, setStockReason] = useState<StockHistoryEntry['action']>('Manual Update');
  const [stockError, setStockError] = useState<string | null>(null);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkUpdates, setBulkUpdates] = useState<Record<string, number>>({});
  const [bulkReason, setBulkReason] = useState<StockHistoryEntry['action']>('Bulk Update');

  // History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Physical Stock Verification Audit State
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, number>>({});
  const [isReconcileConfirmOpen, setIsReconcileConfirmOpen] = useState(false);

  // Initialize physical counts with current book stock
  useEffect(() => {
    const initial: Record<string, number> = {};
    items.forEach(i => {
      initial[i.id] = i.quantityInStock || 0;
    });
    setPhysicalCounts(initial);
  }, [items]);

  // Comprehensive Statutory Stock Valuation Summary (FIFO / WAC / AS-2)
  const valuationSummary = useMemo(() => {
    return computeStockValuation(items, stockHistory, company?.invoices || [], valuationMethod);
  }, [items, stockHistory, company?.invoices, valuationMethod]);

  // Physical Stock Verification Comparator (CARO 2020 Clause 3(ii))
  const physicalAuditComparison = useMemo(() => {
    return comparePhysicalStock(items, physicalCounts, valuationMethod);
  }, [items, physicalCounts, valuationMethod]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (stockFilter === 'low') result = result.filter(i => i.quantityInStock > 0 && i.quantityInStock <= 5);
    else if (stockFilter === 'out') result = result.filter(i => i.quantityInStock <= 0);
    else if (stockFilter === 'in') result = result.filter(i => i.quantityInStock > 0);

    const query = searchQuery.trim();
    if (query) {
      result = result.filter(item => fuzzyMatch(item.name, query) || fuzzyMatch(item.hsn, query) || item.id.includes(query));
    }
    return result;
  }, [items, searchQuery, stockFilter]);

  const sortedHistory = useMemo(() => 
    [...stockHistory].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), 
    [stockHistory]
  );

  // Handlers
  const handleEditClick = (item: Item) => {
    setEditingItemId(item.id);
    setStockValue(item.quantityInStock);
    setCostPriceValue(item.costPrice || Number((item.price * 0.75).toFixed(2)));
    setStockReason('Manual Update');
    setStockError(null);
  };

  const handleCancelClick = () => {
    setEditingItemId(null);
    setStockError(null);
  };

  const handleSaveClick = (item: Item) => {
    const updatedItems = items.map(i => i.id === item.id ? { 
      ...i, 
      quantityInStock: stockValue, 
      costPrice: costPriceValue > 0 ? costPriceValue : undefined 
    } : i);
    setItems(updatedItems);

    if (onBulkStockUpdate) {
      onBulkStockUpdate([{ itemId: item.id, newQuantity: stockValue }], stockReason);
    }
    setEditingItemId(null);
    toast.success(`Updated stock & cost for ${item.name}`);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(filteredItems.map(i => i.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(sid => sid !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const openBulkModal = () => {
    const initialUpdates: Record<string, number> = {};
    selectedIds.forEach(id => {
      const item = items.find(i => i.id === id);
      if (item) initialUpdates[id] = item.quantityInStock;
    });
    setBulkUpdates(initialUpdates);
    setBulkReason('Bulk Update');
    setIsBulkModalOpen(true);
  };

  const handleBulkUpdateChange = (id: string, value: string) => {
    const num = parseInt(value) || 0;
    setBulkUpdates(prev => ({ ...prev, [id]: num }));
  };

  const saveBulkUpdates = () => {
    if (onBulkStockUpdate) {
      const updatesArray = Object.entries(bulkUpdates).map(([itemId, newQuantity]) => ({ itemId, newQuantity }));
      onBulkStockUpdate(updatesArray, bulkReason);
    }
    setIsBulkModalOpen(false);
    setSelectedIds([]);
    toast.success(`Bulk stock updated for ${Object.keys(bulkUpdates).length} items`);
  };

  const handleExportForm3CD = () => {
    const fallbackCompany: Company = company || {
      id: 'default',
      ownerId: 'default',
      details: { name: 'My Business', gstin: 'Unregistered' } as any,
      bankAccounts: [],
      clients: [],
      items: items,
      invoices: [],
      quotations: [],
      recurringInvoices: [],
      stockHistory: stockHistory
    };
    exportStockAuditSchedule(items, fallbackCompany);
    toast.success('Form 3CD Clause 35 Stock Register downloaded');
  };

  const handleExportFifoSchedule = () => {
    if (!company) {
      toast.error('Company details required for CA schedule');
      return;
    }
    exportFifoValuationSchedule(valuationSummary, company);
    toast.success(`Statutory ${valuationMethod} Stock Valuation Schedule downloaded`);
  };

  const handleExportPhysicalAudit = () => {
    if (!company) {
      toast.error('Company details required for audit schedule');
      return;
    }
    exportPhysicalAuditSchedule(physicalAuditComparison, company);
    toast.success('CARO 2020 Physical Stock Audit Schedule downloaded');
  };

  const handleApplyPhysicalReconciliation = () => {
    const updates = items.map(item => ({
      itemId: item.id,
      newQuantity: physicalCounts[item.id] !== undefined ? physicalCounts[item.id] : item.quantityInStock
    })).filter(u => {
      const orig = items.find(i => i.id === u.itemId);
      return orig && orig.quantityInStock !== u.newQuantity;
    });

    if (updates.length === 0) {
      toast.info('Book stock already matches physical count perfectly. No adjustments needed.');
      setIsReconcileConfirmOpen(false);
      return;
    }

    if (onBulkStockUpdate) {
      onBulkStockUpdate(updates, 'Physical Audit Adjustment');
    } else {
      const newMap = new Map(updates.map(u => [u.itemId, u.newQuantity]));
      setItems(items.map(i => newMap.has(i.id) ? { ...i, quantityInStock: newMap.get(i.id)! } : i));
    }

    setIsReconcileConfirmOpen(false);
    toast.success(`Reconciled ${updates.length} items. Physical audit adjustments recorded in stock ledger.`);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Inventory & Valuation</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              AS-2 & Form 3CD
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Statutory FIFO stock valuation, P&L Trading Account closing stock, and CARO 2020 physical verification.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {activeTab === 'inventory' && (
            <button
              onClick={handleExportForm3CD}
              className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-750 rounded-xl font-medium text-xs border border-zinc-200 dark:border-zinc-700 transition-colors shadow-xs active:scale-[0.98]"
              title="Download Form 3CD Clause 35 Quantitative Stock Register for Tax Audit"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Form 3CD Stock (CSV)</span>
            </button>
          )}

          {activeTab === 'valuation' && (
            <button
              onClick={handleExportFifoSchedule}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-xs transition-colors shadow-xs active:scale-[0.98]"
              title="Download FIFO / AS-2 Valuation Schedule for Trading & Profit & Loss Statement"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export {valuationMethod} Schedule (CA)</span>
            </button>
          )}

          {activeTab === 'verification' && (
            <>
              <button
                onClick={handleExportPhysicalAudit}
                className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-750 rounded-xl font-medium text-xs border border-zinc-200 dark:border-zinc-700 transition-colors shadow-xs active:scale-[0.98]"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>CARO 2020 Sheet (CSV)</span>
              </button>
              <button
                onClick={() => setIsReconcileConfirmOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium text-xs transition-colors shadow-xs active:scale-[0.98]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reconcile Book Stock</span>
              </button>
            </>
          )}

          <Button variant="secondary" onClick={() => setIsHistoryModalOpen(true)} className="gap-1.5 text-xs">
            <Layers className="w-3.5 h-3.5" />
            <span>Movement Log</span>
          </Button>

          {selectedIds.length > 0 && activeTab === 'inventory' && (
            <Button onClick={openBulkModal} className="shadow-xs text-xs">
              Update ({selectedIds.length})
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'inventory'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Stock Register & Master</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
            {items.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('valuation')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'valuation'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>FIFO & P&L Valuation (AS-2)</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold font-mono">
            ₹{(valuationSummary.totalValuation / 1000).toFixed(0)}k
          </span>
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'verification'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Physical Stock Verification</span>
          {physicalAuditComparison.materialDiscrepancyCount > 0 ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold">
              {physicalAuditComparison.materialDiscrepancyCount} CARO Alert
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              CARO 2020
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: STOCK MASTER & INVENTORY LIST */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Statutory Stock Valuation Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="glass-panel p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
              <div className="flex items-center justify-between text-zinc-500 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Total Stock Worth</span>
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-zinc-900 dark:text-white font-mono">
                ₹{valuationSummary.totalValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">Lower of Cost or NRV (AS-2)</p>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
              <div className="flex items-center justify-between text-zinc-500 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Active SKUs</span>
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-zinc-900 dark:text-white">
                {valuationSummary.totalItems}
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">{valuationSummary.inStockCount} items healthy</p>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
              <div className="flex items-center justify-between text-zinc-500 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">In Stock</span>
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {valuationSummary.inStockCount}
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">&gt; 5 units available</p>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
              <div className="flex items-center justify-between text-zinc-500 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Low Stock</span>
                <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {valuationSummary.lowStockCount}
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">1 - 5 units left</p>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-zinc-500 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Audit Alert</span>
                <div className={`p-1.5 rounded-lg ${valuationSummary.negativeStockCount > 0 ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-xl font-bold ${valuationSummary.negativeStockCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-900 dark:text-white'}`}>
                {valuationSummary.negativeStockCount}
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                {valuationSummary.negativeStockCount > 0 ? 'Negative stock detected' : `${valuationSummary.outStockCount} zero stock`}
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-grow">
              <Input 
                label="" 
                placeholder="Search items by name, HSN, or ID..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                className="!py-2.5 !rounded-xl text-xs" 
              />
            </div>
            <div className="w-full md:w-64">
              <select 
                value={stockFilter} 
                onChange={(e) => setStockFilter(e.target.value as any)} 
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl shadow-xs px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-all"
              >
                <option value="all">All Items ({items.length})</option>
                <option value="in">In Stock (&gt; 0)</option>
                <option value="low">Low Stock (1-5)</option>
                <option value="out">Out or Negative Stock (&le; 0)</option>
              </select>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="glass-panel rounded-xl overflow-hidden shadow-xs border border-zinc-200 dark:border-zinc-800">
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Inventory Stock Table">
              <table className="w-full min-w-[750px] text-sm text-left text-zinc-600 dark:text-zinc-300">
                <thead className="text-xs text-zinc-700 dark:text-zinc-300 uppercase bg-zinc-100/95 dark:bg-zinc-800/95 sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 backdrop-blur-xs">
                  <tr>
                    <th scope="col" className="px-5 py-3 w-10">
                      <input 
                        type="checkbox" 
                        checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length} 
                        onChange={handleSelectAll} 
                        className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" 
                      />
                    </th>
                    <th scope="col" className="px-5 py-3">Item Name</th>
                    <th scope="col" className="px-5 py-3">HSN/SAC</th>
                    <th scope="col" className="px-5 py-3 text-center">Unit</th>
                    <th scope="col" className="px-5 py-3 text-right">Selling Price</th>
                    <th scope="col" className="px-5 py-3 text-right">Cost Price (AS-2)</th>
                    <th scope="col" className="px-5 py-3">Stock Level</th>
                    <th scope="col" className="px-5 py-3 text-right">Valuation (INR)</th>
                    <th scope="col" className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800">
                  {filteredItems.map((item) => {
                    const isNegativeStock = item.quantityInStock < 0;
                    const isOutOfStock = item.quantityInStock <= 0;
                    const isLowStock = item.quantityInStock <= 5 && item.quantityInStock > 0;
                    const isSelected = selectedIds.includes(item.id);
                    const effectiveCost = item.costPrice || (item.price > 0 ? item.price * 0.75 : 0);
                    const valuationRate = Math.min(effectiveCost, item.price || 0);
                    const itemValuation = Math.max(0, (item.quantityInStock || 0) * valuationRate);

                    return (
                      <tr key={item.id} className={`${isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : isNegativeStock ? 'bg-rose-50/40 dark:bg-rose-950/20' : 'bg-transparent'} hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors`}>
                        <td className="px-5 py-4">
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={() => handleSelectOne(item.id)} 
                            className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" 
                          />
                        </td>
                        <td className="px-5 py-4 font-medium text-zinc-900 dark:text-white whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {isOutOfStock && <AlertIcon />}
                            {isLowStock && <WarningIcon />}
                            <span className={isNegativeStock ? 'text-rose-600 dark:text-rose-400 font-bold' : isOutOfStock ? 'text-zinc-500 dark:text-zinc-400' : ''}>{item.name}</span>
                          </div>
                          {isNegativeStock && (
                            <div className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-0.5">
                              ⚠️ Negative Stock ({item.quantityInStock}) • Record inward purchase to reconcile
                            </div>
                          )}
                          {item.quantityInStock === 0 && (
                            <div className="text-[11px] text-zinc-400 font-normal mt-0.5">
                              Zero inventory • Ready for restocking
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 font-mono text-xs">{item.hsn || '—'}</td>
                        <td className="px-5 py-4 text-center uppercase text-xs font-semibold">{item.unit || 'pcs'}</td>
                        <td className="px-5 py-4 text-right font-mono text-xs">₹{(item.price || 0).toFixed(2)}</td>
                        <td className="px-5 py-4 text-right font-mono text-xs text-zinc-500 dark:text-zinc-400">
                          {editingItemId === item.id ? (
                            <input 
                              type="number" 
                              value={costPriceValue} 
                              onChange={e => setCostPriceValue(parseFloat(e.target.value) || 0)} 
                              className="w-20 px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-mono text-right"
                              placeholder="Cost ₹"
                            />
                          ) : (
                            <span>₹{effectiveCost.toFixed(2)}</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {editingItemId === item.id ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <input 
                                  type="number" 
                                  value={stockValue} 
                                  onChange={e => setStockValue(parseInt(e.target.value) || 0)} 
                                  className="w-24 px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                                />
                                <span className="text-xs text-zinc-400">{item.unit || 'pcs'}</span>
                              </div>
                              <select
                                value={stockReason}
                                onChange={e => setStockReason(e.target.value as any)}
                                className="w-full text-[11px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-zinc-700 dark:text-zinc-300"
                              >
                                <option value="Manual Update">Manual Stock Count</option>
                                <option value="Purchase Inward">Purchase Inward</option>
                                <option value="Sales Return">Sales Return</option>
                                <option value="Damaged / Expired">Damaged / Expired</option>
                                <option value="Physical Audit Adjustment">Physical Audit Adjustment</option>
                              </select>
                              {stockError && <p className="text-[10px] text-rose-600">{stockError}</p>}
                            </div>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isNegativeStock 
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800' 
                                : item.quantityInStock === 0 
                                  ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700' 
                                  : isLowStock 
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700' 
                                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            }`}>
                              {item.quantityInStock} {isNegativeStock ? '(Negative)' : item.quantityInStock === 0 ? '(Out of Stock)' : isLowStock ? '(Low)' : ''}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right font-mono font-semibold text-xs text-zinc-900 dark:text-white">
                          ₹{itemValuation.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {editingItemId === item.id ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => handleSaveClick(item)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-xs active:scale-[0.98]">Save</button>
                              <button onClick={handleCancelClick} className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => handleEditClick(item)} className="px-3 py-1.5 text-xs font-medium rounded-lg text-zinc-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors shadow-xs active:scale-[0.98]">Update</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-zinc-400">
                        No items found matching the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FIFO & TRADING / P&L VALUATION (AS-2 / Ind AS 2) */}
      {activeTab === 'valuation' && (
        <div className="space-y-6">
          {/* Method Selector & Statutory Notice */}
          <div className="glass-panel p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Cost Valuation Formula:
              </span>
              <div className="inline-flex rounded-xl p-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={() => setValuationMethod('FIFO')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    valuationMethod === 'FIFO'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  FIFO (First-In, First-Out)
                </button>
                <button
                  onClick={() => setValuationMethod('WAC')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    valuationMethod === 'WAC'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Weighted Average (WAC)
                </button>
                <button
                  onClick={() => setValuationMethod('NRV')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    valuationMethod === 'NRV'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Standard Cost / NRV
                </button>
              </div>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md">
              <strong className="text-zinc-700 dark:text-zinc-200">ICDS-II & AS-2 Compliance:</strong> Inventories are valued at the lower of historical cost and net realizable value. FIFO assumes the oldest stock lots are sold first.
            </p>
          </div>

          {/* CA Trading Account / P&L Stock Schedule Summary */}
          <div className="glass-panel p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-linear-to-b from-indigo-50/30 to-transparent dark:from-indigo-950/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Trading & Profit & Loss Account — Stock Impact Schedule
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Direct figures required by your Chartered Accountant for filing Form 3CD & computing taxable Gross Profit.
                </p>
              </div>
              <button
                onClick={handleExportFifoSchedule}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-xs font-semibold hover:bg-indigo-50 dark:hover:bg-zinc-750 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Schedule (CSV)</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                  Est. Opening Stock (Debit)
                </span>
                <span className="text-lg font-bold font-mono text-zinc-800 dark:text-zinc-200">
                  ₹{valuationSummary.tradingAccount.estimatedOpeningStock.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">As on 1st April</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                  Add: Inwards / Purchases
                </span>
                <span className="text-lg font-bold font-mono text-zinc-800 dark:text-zinc-200">
                  ₹{valuationSummary.tradingAccount.totalInwardValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">Vendor deliveries</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                  Cost of Goods Sold (COGS)
                </span>
                <span className="text-lg font-bold font-mono text-zinc-800 dark:text-zinc-200">
                  ₹{valuationSummary.tradingAccount.costOfGoodsSold.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">Cost of invoiced items</span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block mb-1">
                  Audited Closing Stock (Credit)
                </span>
                <span className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300">
                  ₹{valuationSummary.tradingAccount.closingStockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5 font-semibold">
                  For Trading A/c & Balance Sheet
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 shadow-xs col-span-2 md:col-span-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block mb-1">
                  Gross Profit Contribution
                </span>
                <span className="text-lg font-bold font-mono text-indigo-700 dark:text-indigo-300">
                  ₹{valuationSummary.tradingAccount.grossProfitContribution.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block mt-0.5">
                  Revenue - COGS
                </span>
              </div>
            </div>
          </div>

          {/* Itemized Statutory FIFO Valuation Table */}
          <div className="glass-panel rounded-xl overflow-hidden shadow-xs border border-zinc-200 dark:border-zinc-800">
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Statutory Valuation Table">
              <table className="w-full min-w-[850px] text-sm text-left text-zinc-600 dark:text-zinc-300">
                <thead className="text-xs text-zinc-700 dark:text-zinc-300 uppercase bg-zinc-100/95 dark:bg-zinc-800/95 sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 backdrop-blur-xs">
                  <tr>
                    <th scope="col" className="px-5 py-3">Item Description</th>
                    <th scope="col" className="px-5 py-3">HSN Code</th>
                    <th scope="col" className="px-5 py-3 text-center">Closing Qty</th>
                    <th scope="col" className="px-5 py-3 text-right">Cost Rate ({valuationMethod})</th>
                    <th scope="col" className="px-5 py-3 text-right">Selling Rate (NRV)</th>
                    <th scope="col" className="px-5 py-3 text-right">Valuation Rate (AS-2)</th>
                    <th scope="col" className="px-5 py-3 text-right">Total Valuation (₹)</th>
                    <th scope="col" className="px-5 py-3">Audit Lot Breakdown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800">
                  {valuationSummary.items.map(res => (
                    <tr key={res.itemId} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-zinc-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{res.name}</span>
                          {res.status === 'NEGATIVE_STOCK' && (
                            <span className="text-[10px] px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 rounded font-bold">
                              Negative
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs">{res.hsn || '—'}</td>
                      <td className="px-5 py-3.5 text-center font-mono font-bold text-xs text-zinc-900 dark:text-white">
                        {res.quantity} <span className="text-zinc-400 font-normal uppercase text-[10px]">{res.unit}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-xs">₹{res.effectiveCostPrice.toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-xs text-zinc-500">₹{res.sellingPrice.toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        ₹{res.valuationRate.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-xs text-zinc-900 dark:text-white">
                        ₹{res.totalValuation.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-zinc-500">
                        {res.batchesRemaining.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {res.batchesRemaining.slice(0, 2).map((b, idx) => (
                              <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono">
                                {b.qty} @ ₹{b.unitCost}
                              </span>
                            ))}
                            {res.batchesRemaining.length > 2 && (
                              <span className="text-[10px] text-zinc-400">+{res.batchesRemaining.length - 2} more</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PHYSICAL STOCK VERIFICATION (CARO 2020 Clause 3(ii)) */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          {/* Statutory Verification Callout */}
          <div className="glass-panel p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-amber-50/20 dark:bg-amber-950/10">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 shrink-0">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    CARO 2020 Clause 3(ii) Physical Stock Verification Sentinel
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    Statutory Audit Requirement
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  Management must physically count inventory at reasonable intervals. Under CARO 2020, any material discrepancy of <strong>10% or more</strong> in aggregate for each class of inventory between physical inventory and book records must be reported in the statutory audit report.
                </p>
              </div>
            </div>
          </div>

          {/* Audit Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="glass-panel p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                Total Book Value
              </span>
              <span className="text-lg font-bold font-mono text-zinc-900 dark:text-white">
                ₹{physicalAuditComparison.totalBookValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">As per software system</span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                Audited Physical Value
              </span>
              <span className="text-lg font-bold font-mono text-zinc-900 dark:text-white">
                ₹{physicalAuditComparison.totalPhysicalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">Physical count entered</span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                Net Variance Financial Impact
              </span>
              <span className={`text-lg font-bold font-mono ${
                physicalAuditComparison.totalVarianceValue < 0 
                  ? 'text-rose-600 dark:text-rose-400' 
                  : physicalAuditComparison.totalVarianceValue > 0 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-zinc-900 dark:text-white'
              }`}>
                {physicalAuditComparison.totalVarianceValue >= 0 ? '+' : ''}₹{physicalAuditComparison.totalVarianceValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">Shortage (-) / Excess (+)</span>
            </div>

            <div className={`glass-panel p-4 rounded-xl border shadow-xs ${
              physicalAuditComparison.materialDiscrepancyCount > 0 
                ? 'border-rose-300 bg-rose-50/30 dark:bg-rose-950/20 dark:border-rose-900' 
                : 'border-zinc-200 dark:border-zinc-800'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                CARO Discrepancies (≥10%)
              </span>
              <span className={`text-lg font-bold ${
                physicalAuditComparison.materialDiscrepancyCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {physicalAuditComparison.materialDiscrepancyCount} Items
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                {physicalAuditComparison.materialDiscrepancyCount > 0 ? 'Auditor note required' : 'All items within 10% tolerance'}
              </span>
            </div>
          </div>

          {/* Interactive Physical Count Entry Table */}
          <div className="glass-panel rounded-xl overflow-hidden shadow-xs border border-zinc-200 dark:border-zinc-800">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center flex-wrap gap-2">
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Physical Inventory Verification Sheet</h4>
                <p className="text-xs text-zinc-500 mt-0.5">Enter the verified physical count from your warehouse stock audit:</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExportPhysicalAudit}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 transition-colors shadow-xs"
                >
                  Download CARO Schedule (CSV)
                </button>
                <button
                  onClick={() => setIsReconcileConfirmOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs"
                >
                  Reconcile & Apply Counts
                </button>
              </div>
            </div>

            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Physical Verification Table">
              <table className="w-full min-w-[850px] text-sm text-left text-zinc-600 dark:text-zinc-300">
                <thead className="text-xs text-zinc-700 dark:text-zinc-300 uppercase bg-zinc-100/95 dark:bg-zinc-800/95 sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 backdrop-blur-xs">
                  <tr>
                    <th scope="col" className="px-5 py-3">Item Description</th>
                    <th scope="col" className="px-5 py-3">HSN Code</th>
                    <th scope="col" className="px-5 py-3 text-center">Book Qty</th>
                    <th scope="col" className="px-5 py-3 text-center">Physical Count</th>
                    <th scope="col" className="px-5 py-3 text-center">Variance (Qty)</th>
                    <th scope="col" className="px-5 py-3 text-center">Variance %</th>
                    <th scope="col" className="px-5 py-3 text-right">Unit Rate</th>
                    <th scope="col" className="px-5 py-3 text-right">Variance Value (₹)</th>
                    <th scope="col" className="px-5 py-3">CARO Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800">
                  {physicalAuditComparison.comparisons.map(c => {
                    const isDiscrepancy = c.isMaterialDiscrepancy;
                    return (
                      <tr key={c.itemId} className={`${isDiscrepancy ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''} hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors`}>
                        <td className="px-5 py-3.5 font-medium text-zinc-900 dark:text-white">
                          {c.name}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs">{c.hsn || '—'}</td>
                        <td className="px-5 py-3.5 text-center font-mono font-bold text-xs text-zinc-700 dark:text-zinc-300">
                          {c.bookQuantity} {c.unit}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <input
                            type="number"
                            value={physicalCounts[c.itemId] !== undefined ? physicalCounts[c.itemId] : c.bookQuantity}
                            onChange={e => {
                              const val = parseInt(e.target.value) || 0;
                              setPhysicalCounts(prev => ({ ...prev, [c.itemId]: val }));
                            }}
                            className="w-24 px-2.5 py-1 text-center bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-mono font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-5 py-3.5 text-center font-mono font-bold text-xs">
                          <span className={c.varianceQty > 0 ? 'text-emerald-600 dark:text-emerald-400' : c.varianceQty < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-400'}>
                            {c.varianceQty > 0 ? `+${c.varianceQty}` : c.varianceQty}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center text-xs font-mono">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isDiscrepancy 
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300' 
                              : c.varianceQty !== 0 
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                          }`}>
                            {c.variancePercentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-xs">₹{c.unitRate.toFixed(2)}</td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-xs">
                          <span className={c.varianceValue < 0 ? 'text-rose-600 dark:text-rose-400' : c.varianceValue > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}>
                            {c.varianceValue >= 0 ? '+' : ''}₹{c.varianceValue.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs">
                          {isDiscrepancy ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                              <AlertCircle className="w-3.5 h-3.5" />
                              CARO &ge;10% Alert
                            </span>
                          ) : c.varianceQty !== 0 ? (
                            <span className="text-[11px] text-amber-600 dark:text-amber-400">Minor Variance</span>
                          ) : (
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Exact Tally</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Stock Update Modal */}
      <Modal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} title="Bulk Stock Update">
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
              Reason for Stock Movement (CA Audit Trail)
            </label>
            <select
              value={bulkReason}
              onChange={e => setBulkReason(e.target.value as any)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Bulk Update">Bulk Stock Count</option>
              <option value="Purchase Inward">Purchase Inward (Vendor Delivery)</option>
              <option value="Sales Return">Sales Return (Customer Return)</option>
              <option value="Damaged / Expired">Damaged / Expired Stock</option>
              <option value="Physical Audit Adjustment">Physical Audit Discrepancy Adjustment</option>
            </select>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">Set new stock quantities for selected items:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedIds.map(id => {
              const item = items.find(i => i.id === id);
              if (!item) return null;
              return (
                <div key={id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-200 dark:border-zinc-700">
                  <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate pr-3">{item.name}</span>
                  <input 
                    type="number" 
                    className="w-24 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-zinc-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                    value={bulkUpdates[id] ?? item.quantityInStock} 
                    onChange={(e) => handleBulkUpdateChange(id, e.target.value)} 
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div className="p-6 pt-0 flex justify-end gap-2.5">
          <Button variant="secondary" onClick={() => setIsBulkModalOpen(false)}>Cancel</Button>
          <Button onClick={saveBulkUpdates} className="shadow-xs">Apply Updates</Button>
        </div>
      </Modal>

      {/* Reconcile Physical Stock Confirmation Modal */}
      <Modal isOpen={isReconcileConfirmOpen} onClose={() => setIsReconcileConfirmOpen(false)} title="Reconcile Physical Stock to Books">
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Permanent Stock Reconciliation</p>
              <p className="mt-0.5">
                This action will adjust the book quantities of all items to match your entered physical counts, and automatically log a timestamped <strong>"Physical Audit Adjustment"</strong> entry for each changed item in the stock audit ledger.
              </p>
            </div>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Net Financial Variance: <strong>{physicalAuditComparison.totalVarianceValue >= 0 ? '+' : ''}₹{physicalAuditComparison.totalVarianceValue.toLocaleString('en-IN')}</strong>. Proceed with reconciliation?
          </p>
        </div>
        <div className="p-6 pt-0 flex justify-end gap-2.5">
          <Button variant="secondary" onClick={() => setIsReconcileConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleApplyPhysicalReconciliation} className="bg-emerald-600 hover:bg-emerald-500 shadow-xs">
            Confirm & Reconcile
          </Button>
        </div>
      </Modal>

      {/* Movement History Log Modal */}
      <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title="Stock Movement & Audit Log">
        <div className="overflow-x-auto max-h-[70vh]">
          {sortedHistory.length > 0 ? (
            <table className="w-full min-w-[650px] text-sm text-left text-zinc-600 dark:text-zinc-400">
              <thead className="text-xs text-zinc-700 dark:text-zinc-300 uppercase bg-zinc-100 dark:bg-zinc-800 sticky top-0 border-b border-zinc-200 dark:border-zinc-700">
                <tr>
                  <th className="px-5 py-3">Date & Time</th>
                  <th className="px-5 py-3">Item Name</th>
                  <th className="px-5 py-3 text-right">Previous</th>
                  <th className="px-5 py-3 text-right">New Stock</th>
                  <th className="px-5 py-3 text-right">Delta</th>
                  <th className="px-5 py-3">Audit Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {sortedHistory.map(entry => {
                  const change = entry.newQuantity - entry.previousQuantity;
                  return (
                    <tr key={entry.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="px-5 py-3 whitespace-nowrap text-xs">
                        {new Date(entry.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="px-5 py-3 font-medium text-zinc-900 dark:text-white text-xs">{entry.itemName}</td>
                      <td className="px-5 py-3 text-right font-mono text-xs">{entry.previousQuantity}</td>
                      <td className="px-5 py-3 text-right font-mono text-xs font-bold text-zinc-900 dark:text-white">{entry.newQuantity}</td>
                      <td className="px-5 py-3 text-right text-xs">
                        <span className={`font-mono font-bold ${change > 0 ? 'text-emerald-600 dark:text-emerald-400' : change < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-400'}`}>
                          {change > 0 ? `+${change}` : change}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {entry.action}
                        </span>
                        {entry.referenceId && (
                          <span className="ml-1 text-[10px] text-zinc-400 font-mono">
                            ({entry.referenceId})
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-zinc-400">
              No stock movement recorded yet. Changes will be logged automatically here.
            </div>
          )}
        </div>
        <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <Button variant="secondary" onClick={() => setIsHistoryModalOpen(false)}>Close</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Inventory;
