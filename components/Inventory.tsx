import React, { useState, useMemo } from 'react';
import type { Item, StockHistoryEntry, Company } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Modal from './common/Modal';
import { AlertTriangle, AlertCircle, Download, Package, IndianRupee, CheckCircle2, ShieldAlert } from 'lucide-react';
import { exportStockAuditSchedule } from '../utils/auditExport';

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
const WarningIcon = () => <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />;
const AlertIcon = () => <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />;

const Inventory: React.FC<InventoryProps> = ({ items, setItems, onBulkStockUpdate, stockHistory, initialFilter, company }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [stockFilter, setStockFilter] = useState<'all' | 'in' | 'low' | 'out'>(initialFilter || 'all');

    React.useEffect(() => {
        if (initialFilter) {
            setStockFilter(initialFilter);
        }
    }, [initialFilter]);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [stockValue, setStockValue] = useState<number>(0);
    const [stockReason, setStockReason] = useState<StockHistoryEntry['action']>('Manual Update');
    const [stockError, setStockError] = useState<string|null>(null);
    
    // Bulk Selection State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkUpdates, setBulkUpdates] = useState<Record<string, number>>({});
    const [bulkReason, setBulkReason] = useState<StockHistoryEntry['action']>('Bulk Update');
    
    // History Modal State
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    // Stock Valuation Metrics for Indian CA Audit / Form 3CD
    const valuationMetrics = useMemo(() => {
        let totalValuation = 0;
        let inStockCount = 0;
        let lowStockCount = 0;
        let outStockCount = 0;
        let negativeStockCount = 0;

        items.forEach(i => {
            const qty = i.quantityInStock || 0;
            const price = i.price || 0;
            if (qty > 0) {
                totalValuation += qty * price;
                if (qty <= 5) lowStockCount++;
                else inStockCount++;
            } else if (qty === 0) {
                outStockCount++;
            } else {
                negativeStockCount++;
            }
        });

        return {
            totalValuation,
            inStockCount,
            lowStockCount,
            outStockCount,
            negativeStockCount,
            totalItems: items.length
        };
    }, [items]);

    const filteredItems = useMemo(() => {
        let result = items;
        if (stockFilter === 'low') result = result.filter(i => i.quantityInStock > 0 && i.quantityInStock <= 5);
        else if (stockFilter === 'out') result = result.filter(i => i.quantityInStock <= 0);
        else if (stockFilter === 'in') result = result.filter(i => i.quantityInStock > 0);

        const query = searchQuery.trim();
        if (query) {
            result = result.filter(item => fuzzyMatch(item.name, query) || fuzzyMatch(item.hsn, query) || (item.id.includes(query)));
        }
        return result;
    }, [items, searchQuery, stockFilter]);

    const sortedHistory = useMemo(() => [...stockHistory].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [stockHistory]);

    // Handlers
    const handleEditClick = (item: Item) => { 
        setEditingItemId(item.id); 
        setStockValue(item.quantityInStock); 
        setStockReason('Manual Update');
        setStockError(null); 
    };
    const handleCancelClick = () => { setEditingItemId(null); setStockError(null); };
    const handleSaveClick = (item: Item) => {
        if (onBulkStockUpdate) onBulkStockUpdate([{ itemId: item.id, newQuantity: stockValue }], stockReason);
        else { const updatedItems = items.map(i => i.id === item.id ? { ...i, quantityInStock: stockValue } : i); setItems(updatedItems); }
        setEditingItemId(null);
    };
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.checked) setSelectedIds(filteredItems.map(i => i.id)); else setSelectedIds([]); };
    const handleSelectOne = (id: string) => { if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(sid => sid !== id)); else setSelectedIds([...selectedIds, id]); };
    const openBulkModal = () => {
        const initialUpdates: Record<string, number> = {};
        selectedIds.forEach(id => { const item = items.find(i => i.id === id); if (item) initialUpdates[id] = item.quantityInStock; });
        setBulkUpdates(initialUpdates);
        setBulkReason('Bulk Update');
        setIsBulkModalOpen(true);
    };
    const handleBulkUpdateChange = (id: string, value: string) => { const num = parseInt(value) || 0; setBulkUpdates(prev => ({ ...prev, [id]: num })); };
    const saveBulkUpdates = () => {
        if (onBulkStockUpdate) { const updatesArray = Object.entries(bulkUpdates).map(([itemId, newQuantity]) => ({ itemId, newQuantity })); onBulkStockUpdate(updatesArray, bulkReason); }
        setIsBulkModalOpen(false); setSelectedIds([]);
    };

    const handleExportAudit = () => {
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
    };

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Inventory</h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Form 3CD Clause 35 compliant stock register, warehouse valuation, and audit tracking.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                    <button
                        onClick={handleExportAudit}
                        className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-750 rounded-xl font-medium text-xs border border-zinc-200 dark:border-zinc-700 transition-colors shadow-xs active:scale-[0.98]"
                        title="Download Form 3CD Clause 35 Quantitative Stock Register for CA Audit"
                    >
                        <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>CA Stock Audit (Form 3CD)</span>
                    </button>
                    <Button variant="secondary" onClick={() => setIsHistoryModalOpen(true)} className="gap-2 text-xs">
                        Movement Log
                    </Button>
                    {selectedIds.length > 0 && (
                        <Button onClick={openBulkModal} className="shadow-xs text-xs">
                            Update Selected ({selectedIds.length})
                        </Button>
                    )}
                </div>
            </div>

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
                        ₹{valuationMetrics.totalValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Lower of Cost or NRV</p>
                </div>

                <div className="glass-panel p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
                    <div className="flex items-center justify-between text-zinc-500 mb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Active SKUs</span>
                        <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                            <Package className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-xl font-bold text-zinc-900 dark:text-white">
                        {valuationMetrics.totalItems}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{valuationMetrics.inStockCount} healthy items</p>
                </div>

                <div className="glass-panel p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
                    <div className="flex items-center justify-between text-zinc-500 mb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">In Stock</span>
                        <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {valuationMetrics.inStockCount}
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
                        {valuationMetrics.lowStockCount}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">1 - 5 units left</p>
                </div>

                <div className="glass-panel p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-between text-zinc-500 mb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider">Audit Alert</span>
                        <div className={`p-1.5 rounded-lg ${valuationMetrics.negativeStockCount > 0 ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                            <ShieldAlert className="w-4 h-4" />
                        </div>
                    </div>
                    <div className={`text-xl font-bold ${valuationMetrics.negativeStockCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-900 dark:text-white'}`}>
                        {valuationMetrics.negativeStockCount}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                        {valuationMetrics.negativeStockCount > 0 ? 'Negative stock detected' : `${valuationMetrics.outStockCount} zero stock`}
                    </p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-grow">
                    <Input label="" placeholder="Search items by name, HSN, or ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="!py-2.5 !rounded-xl text-xs" />
                </div>
                <div className="w-full md:w-64">
                    <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as any)} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl shadow-xs px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-all">
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
                                <th scope="col" className="px-5 py-3 w-10"><input type="checkbox" checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length} onChange={handleSelectAll} className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" /></th>
                                <th scope="col" className="px-5 py-3">Item Name</th>
                                <th scope="col" className="px-5 py-3">HSN/SAC</th>
                                <th scope="col" className="px-5 py-3 text-center">Unit</th>
                                <th scope="col" className="px-5 py-3 text-right">Unit Price</th>
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
                                const itemValuation = Math.max(0, (item.quantityInStock || 0) * (item.price || 0));

                                return (
                                <tr key={item.id} className={`${isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : isNegativeStock ? 'bg-rose-50/40 dark:bg-rose-950/20' : 'bg-transparent'} hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors`}>
                                    <td className="px-5 py-4"><input type="checkbox" checked={isSelected} onChange={() => handleSelectOne(item.id)} className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" /></td>
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
                            )})}
                            {filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-zinc-400">
                                        No items found matching the selected filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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
