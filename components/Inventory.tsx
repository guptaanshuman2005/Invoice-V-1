
import React, { useState, useMemo } from 'react';
import type { Item, StockHistoryEntry } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Modal from './common/Modal';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface InventoryProps {
  items: Item[];
  setItems: (items: Item[]) => void;
  onBulkStockUpdate?: (updates: { itemId: string, newQuantity: number }[], action: StockHistoryEntry['action']) => void;
  stockHistory: StockHistoryEntry[];
  initialFilter?: 'all' | 'in' | 'low' | 'out';
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
const WarningIcon = () => <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
const AlertIcon = () => <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;

const Inventory: React.FC<InventoryProps> = ({ items, setItems, onBulkStockUpdate, stockHistory, initialFilter }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [stockFilter, setStockFilter] = useState<'all' | 'in' | 'low' | 'out'>(initialFilter || 'all');

    React.useEffect(() => {
        if (initialFilter) {
            setStockFilter(initialFilter);
        }
    }, [initialFilter]);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [stockValue, setStockValue] = useState<number>(0);
    const [stockError, setStockError] = useState<string|null>(null);
    
    // Bulk Selection State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkUpdates, setBulkUpdates] = useState<Record<string, number>>({});
    
    // History Modal State
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    const filteredItems = useMemo(() => {
        let result = items;
        if (stockFilter === 'low') result = result.filter(i => i.quantityInStock > 0 && i.quantityInStock <= 5);
        else if (stockFilter === 'out') result = result.filter(i => i.quantityInStock === 0);
        else if (stockFilter === 'in') result = result.filter(i => i.quantityInStock > 0);

        const query = searchQuery.trim();
        if (query) {
            result = result.filter(item => fuzzyMatch(item.name, query) || fuzzyMatch(item.hsn, query) || (item.id.includes(query)));
        }
        return result;
    }, [items, searchQuery, stockFilter]);

    const sortedHistory = useMemo(() => [...stockHistory].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [stockHistory]);

    // Handlers
    const handleEditClick = (item: Item) => { setEditingItemId(item.id); setStockValue(item.quantityInStock); setStockError(null); };
    const handleCancelClick = () => { setEditingItemId(null); setStockError(null); };
    const handleSaveClick = (item: Item) => {
        if(stockValue < 0) { setStockError("Stock cannot be negative."); return; }
        if (onBulkStockUpdate) onBulkStockUpdate([{ itemId: item.id, newQuantity: stockValue }], 'Manual Update');
        else { const updatedItems = items.map(i => i.id === item.id ? { ...i, quantityInStock: stockValue } : i); setItems(updatedItems); }
        setEditingItemId(null);
    };
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.checked) setSelectedIds(filteredItems.map(i => i.id)); else setSelectedIds([]); };
    const handleSelectOne = (id: string) => { if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(sid => sid !== id)); else setSelectedIds([...selectedIds, id]); };
    const openBulkModal = () => {
        const initialUpdates: Record<string, number> = {};
        selectedIds.forEach(id => { const item = items.find(i => i.id === id); if (item) initialUpdates[id] = item.quantityInStock; });
        setBulkUpdates(initialUpdates);
        setIsBulkModalOpen(true);
    };
    const handleBulkUpdateChange = (id: string, value: string) => { const num = parseInt(value) || 0; setBulkUpdates(prev => ({ ...prev, [id]: num })); };
    const saveBulkUpdates = () => {
        if (onBulkStockUpdate) { const updatesArray = Object.entries(bulkUpdates).map(([itemId, newQuantity]) => ({ itemId, newQuantity })); onBulkStockUpdate(updatesArray, 'Bulk Update'); }
        setIsBulkModalOpen(false); setSelectedIds([]);
    };

    const inputClasses = "w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent";

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-light-text">Inventory</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage stock levels</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setIsHistoryModalOpen(true)}>History</Button>
                    {selectedIds.length > 0 && <Button onClick={openBulkModal}>Update ({selectedIds.length})</Button>}
                </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-grow">
                    <Input label="" placeholder="Search items..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="!py-2.5" />
                </div>
                <div className="w-full md:w-64">
                    <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as any)} className={`${inputClasses} h-[42px] mt-0.5 cursor-pointer`}>
                        <option value="all">All Items</option>
                        <option value="in">In Stock (&gt; 0)</option>
                        <option value="low">Low Stock (&le; 5)</option>
                        <option value="out">Out of Stock (0)</option>
                    </select>
                </div>
            </div>
            
            <div className="glass-panel shadow-lg rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-sm text-left text-slate-600 dark:text-medium-text">
                        <thead className="text-xs text-slate-700 dark:text-light-text uppercase bg-slate-100/50 dark:bg-tertiary-dark/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 w-10"><input type="checkbox" checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length} onChange={handleSelectAll} className="rounded border-slate-300 text-accent focus:ring-accent" /></th>
                                <th scope="col" className="px-6 py-3">Item Name</th>
                                <th scope="col" className="px-6 py-3">HSN/SAC</th>
                                <th scope="col" className="px-6 py-3 text-center">Unit</th>
                                <th scope="col" className="px-6 py-3">Current Stock</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item) => {
                                const isLowStock = item.quantityInStock <= 5 && item.quantityInStock > 0;
                                const isOutOfStock = item.quantityInStock === 0;
                                const isSelected = selectedIds.includes(item.id);
                                let rowClass = "bg-transparent";
                                if (isSelected) rowClass = "bg-blue-50/50 dark:bg-blue-900/20";
                                else if (isOutOfStock) rowClass = "bg-red-50/50 dark:bg-red-900/20";
                                else if (isLowStock) rowClass = "bg-orange-50/50 dark:bg-orange-900/20";

                                return (
                                <tr key={item.id} className={`${rowClass} border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors`}>
                                    <td className="px-6 py-4"><input type="checkbox" checked={isSelected} onChange={() => handleSelectOne(item.id)} className="rounded border-slate-300 text-accent focus:ring-accent" /></td>
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-light-text whitespace-nowrap"><div className="flex items-center gap-2">{isOutOfStock && <AlertIcon />}{isLowStock && <WarningIcon />}<span className={isOutOfStock ? 'text-red-700 dark:text-red-300 font-semibold' : ''}>{item.name}</span></div></td>
                                    <td className="px-6 py-4">{item.hsn}</td>
                                    <td className="px-6 py-4 text-center uppercase">{item.unit}</td>
                                    <td className="px-6 py-4">
                                        {editingItemId === item.id ? (
                                            <div className="relative"><Input label="" type="number" value={stockValue} onChange={e => setStockValue(parseInt(e.target.value) || 0)} className="!py-1 w-24" error={stockError || undefined} /></div>
                                        ) : (
                                            <div className="flex items-center gap-2"><span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${isOutOfStock ? 'bg-white text-red-700 border border-red-200' : isLowStock ? 'bg-white text-orange-700 border border-orange-200' : 'bg-green-100 text-green-800'}`}>{item.quantityInStock}</span></div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        {editingItemId === item.id ? ( <><Button variant="secondary" onClick={() => handleSaveClick(item)}>Save</Button><Button variant="secondary" onClick={handleCancelClick}>Cancel</Button></>) : ( <Button variant="secondary" onClick={() => handleEditClick(item)}>Update</Button> )}
                                    </td>
                                </tr>
                            )})}
                            {filteredItems.length === 0 && (<tr><td colSpan={6} className="text-center py-8 text-slate-500 dark:text-medium-text">No items found.</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} title="Bulk Stock Update">
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Set new stock quantities for selected items:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedIds.map(id => {
                            const item = items.find(i => i.id === id);
                            if (!item) return null;
                            return (
                                <div key={id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate pr-4">{item.name}</span>
                                    <input type="number" className="w-20 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-sm focus:ring-accent focus:border-accent" value={bulkUpdates[id] ?? item.quantityInStock} onChange={(e) => handleBulkUpdateChange(id, e.target.value)} min="0" />
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="p-6 pt-0 flex justify-end gap-3"><Button variant="secondary" onClick={() => setIsBulkModalOpen(false)}>Cancel</Button><Button onClick={saveBulkUpdates}>Update All</Button></div>
            </Modal>

            <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title="Stock Movement Log">
                <div className="overflow-x-auto max-h-[70vh]">
                    {sortedHistory.length > 0 ? (
                        <table className="w-full min-w-[600px] text-sm text-left text-slate-600 dark:text-slate-400">
                            <thead className="text-xs text-slate-700 dark:text-light-text uppercase bg-slate-100 dark:bg-slate-800 sticky top-0">
                                <tr><th className="px-6 py-3">Date</th><th className="px-6 py-3">Item</th><th className="px-6 py-3 text-right">Change</th><th className="px-6 py-3">Action</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {sortedHistory.map(entry => {
                                    const change = entry.newQuantity - entry.previousQuantity;
                                    return (
                                        <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-6 py-3 whitespace-nowrap">{new Date(entry.timestamp).toLocaleDateString()}</td>
                                            <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">{entry.itemName}</td>
                                            <td className="px-6 py-3 text-right"><span className={`font-bold ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>{change > 0 ? '+' : ''}{change}</span></td>
                                            <td className="px-6 py-3">{entry.action}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (<div className="p-8 text-center text-slate-500">No stock history recorded yet.</div>)}
                </div>
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end"><Button variant="secondary" onClick={() => setIsHistoryModalOpen(false)}>Close</Button></div>
            </Modal>
        </div>
    );
};

export default Inventory;
