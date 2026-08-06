
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { Company, Item } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Modal from './common/Modal';
import { validateRequired, validateNonNegative } from '../utils/validation';
import { arrayToCSV, downloadCSV } from '../utils/csvExport';
import { AlertTriangle, Search, Plus, Download, Upload, Edit, Trash2 } from 'lucide-react';
import { trackEvent } from '../utils/analytics';

interface ItemsProps {
  items: Item[];
  setItems: (items: Item[]) => void;
  company: Company;
  onBulkDelete: (itemIds: string[]) => void;
  initialSearchQuery?: string;
}

const emptyItem: Item = { id: '', name: '', hsn: '', price: 0, gstRate: 18, unit: 'pcs', quantityInStock: 0 };
type ItemFormErrors = { [K in keyof Omit<Item, 'id' | 'hsn'>]?: string };
const ITEM_UNITS = ['pcs', 'kgs', 'ltr', 'nos', 'box', 'pkt', 'gram', 'set', 'pair', 'm', 'cm', 'ft', 'sqft'];


const ItemForm: React.FC<{ 
    item: Item, 
    setItem: React.Dispatch<React.SetStateAction<Item>>,
    errors: ItemFormErrors,
    setErrors: React.Dispatch<React.SetStateAction<ItemFormErrors>>
}> = ({ item, setItem, errors, setErrors }) => {

    const validateField = (name: string, value: any): string | null => {
        switch(name) {
            case 'name': return validateRequired(value);
            case 'price': 
                if (typeof value === 'number' && value < 0) return "Price cannot be negative";
                return validateRequired(value) || validateNonNegative(value);
            case 'gstRate': 
                if (typeof value === 'number' && value < 0) return "GST % cannot be negative";
                return validateRequired(value) || validateNonNegative(value);
            case 'quantityInStock': 
                if (typeof value === 'number' && value < 0) return "Stock cannot be negative";
                return validateRequired(value) || validateNonNegative(value);
            default: return null;
        }
    }
    
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const parsedValue = type === 'number' ? (value === '' ? '' : parseFloat(value)) : value;
        
        // Prevent negative input right away if possible, though validation catches it on submit too
        if (type === 'number' && typeof parsedValue === 'number' && parsedValue < 0) {
             // We allow typing it but show error immediately
        }

        setItem(prev => ({ ...prev, [name]: parsedValue }));
        const error = validateField(name, parsedValue);
        setErrors(prev => ({ ...prev, [name]: error || undefined }));
    }, [setItem, setErrors]);

    const isCustomUnit = item.unit && !ITEM_UNITS.includes(item.unit.toLowerCase());

    const inputClasses = "w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none text-sm px-4 py-2.5 transition-all duration-200 ease-in-out border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-4 focus:ring-accent/10 dark:focus:ring-accent/20 focus:border-accent";

    return (
        <div className="p-6 space-y-4">
            <Input label="Item Name" name="name" value={item.name} onChange={handleChange} required error={errors.name} />
            <Input label="HSN/SAC Code" name="hsn" value={item.hsn} onChange={handleChange} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label={`Price (₹)`} name="price" type="number" min="0" value={item.price === 0 ? '' : item.price} onChange={handleChange} required error={errors.price}/>
                <Input label="GST Rate (%)" name="gstRate" type="number" min="0" value={item.gstRate === 0 ? '' : item.gstRate} onChange={handleChange} required error={errors.gstRate}/>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="unit" className="block text-sm font-medium text-slate-600 dark:text-medium-text mb-1">Unit</label>
                    <div className="relative">
                        <input 
                            list="unit-options" 
                            name="unit" 
                            value={item.unit} 
                            onChange={handleChange} 
                            className={inputClasses}
                            placeholder="Select or Type..."
                        />
                        <datalist id="unit-options">
                            {ITEM_UNITS.map(unit => <option key={unit} value={unit} />)}
                        </datalist>
                    </div>
                    {isCustomUnit && (
                        <p className="text-[10px] text-orange-500 mt-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Custom unit will be saved
                        </p>
                    )}
                </div>
                 <Input label="Initial Stock Quantity" name="quantityInStock" type="number" min="0" value={item.quantityInStock === 0 ? '' : item.quantityInStock} onChange={handleChange} required error={errors.quantityInStock as string}/>
            </div>
        </div>
    );
};

const Items: React.FC<ItemsProps> = ({ items, setItems, company, onBulkDelete, initialSearchQuery }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item>(emptyItem);
  const [errors, setErrors] = useState<ItemFormErrors>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const currency = '₹';

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [showFilters, setShowFilters] = useState(false);
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState('All');
  const [filterGstRate, setFilterGstRate] = useState('');

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const filteredItems = useMemo(() => {
      let result = [...items];
      const lowercased = searchQuery.toLowerCase();
      
      // Search
      if(lowercased) {
          result = result.filter(item => item.name.toLowerCase().includes(lowercased) || item.hsn.toLowerCase().includes(lowercased));
      }

      // Filters
      if (filterPriceMin) result = result.filter(i => i.price >= parseFloat(filterPriceMin));
      if (filterPriceMax) result = result.filter(i => i.price <= parseFloat(filterPriceMax));
      if (filterGstRate) result = result.filter(i => i.gstRate === parseFloat(filterGstRate));
      
      if (filterStockStatus === 'Low') result = result.filter(i => i.quantityInStock > 0 && i.quantityInStock <= 5);
      else if (filterStockStatus === 'Out') result = result.filter(i => i.quantityInStock === 0);
      else if (filterStockStatus === 'In') result = result.filter(i => i.quantityInStock > 0);

      return result;
  }, [items, searchQuery, filterPriceMin, filterPriceMax, filterGstRate, filterStockStatus]);

  const handleOpenModal = (item?: Item) => {
    setErrors({});
    setEditingItem(item || emptyItem);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const validateItem = (item: Item): boolean => {
      const formErrors: ItemFormErrors = {};
      const nameError = validateRequired(item.name);
      if(nameError) formErrors.name = nameError;

      const priceError = validateRequired(item.price) || validateNonNegative(item.price);
      if(priceError) formErrors.price = priceError;
      
      const gstRateError = validateRequired(item.gstRate) || validateNonNegative(item.gstRate);
      if(gstRateError) formErrors.gstRate = gstRateError;
       
      const stockError = validateRequired(item.quantityInStock) || validateNonNegative(item.quantityInStock);
      if(stockError) formErrors.quantityInStock = stockError;
      
      setErrors(formErrors);
      return Object.values(formErrors).every(e => !e);
  }

  const handleSaveItem = () => {
    if (!validateItem(editingItem)) return;

    if (editingItem.id) {
      setItems(items.map(i => i.id === editingItem.id ? editingItem : i));
      trackEvent('update_item', { itemId: editingItem.id });
    } else {
      const newId = Date.now().toString();
      setItems([...items, { ...editingItem, id: newId }]);
      trackEvent('create_item', { itemId: newId });
    }
    handleCloseModal();
  };

  const handleDeleteItem = (id: string) => {
    setItemToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      setItems(items.filter(i => i.id !== itemToDelete));
    }
    setIsConfirmOpen(false);
    setItemToDelete(null);
  };
  
  // Bulk Actions
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
          setSelectedIds(filteredItems.map(i => i.id));
      } else {
          setSelectedIds([]);
      }
  };

  const handleSelectOne = (id: string) => {
      if (selectedIds.includes(id)) {
          setSelectedIds(selectedIds.filter(sid => sid !== id));
      } else {
          setSelectedIds([...selectedIds, id]);
      }
  };

  const handleBulkDelete = () => {
      if(window.confirm(`Are you sure you want to delete ${selectedIds.length} items?`)) {
          onBulkDelete(selectedIds);
          setSelectedIds([]);
      }
  };

  const handleExport = (exportAll: boolean = false) => {
      const dataToExport = exportAll ? items : filteredItems.filter(i => selectedIds.length === 0 || selectedIds.includes(i.id));
      const csvData = arrayToCSV(dataToExport, [
          { key: 'name', label: 'Name' },
          { key: 'hsn', label: 'HSN' },
          { key: 'unit', label: 'Unit' },
          { key: 'price', label: 'Price' },
          { key: 'gstRate', label: 'GST %' },
          { key: 'quantityInStock', label: 'Stock' }
      ]);
      downloadCSV(csvData, `items_export_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const inputClasses = "w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none text-sm px-4 py-2.5 transition-all duration-200 ease-in-out border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-4 focus:ring-accent/10 dark:focus:ring-accent/20 focus:border-accent";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-light-text">Items</h1>
        <div className="flex gap-4">
             <Button variant="secondary" onClick={() => handleExport(true)}>Export All</Button>
             <Button onClick={() => handleOpenModal()}>Add New Item</Button>
        </div>
      </div>
      
      <div className="space-y-4 mb-4">
          <div className="flex gap-4">
            <div className="flex-grow">
                 <Input label="" placeholder="Search by name or HSN..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="!py-2.5"/>
            </div>
            <Button variant="secondary" onClick={() => setShowFilters(!showFilters)} className="h-[42px] mt-0.5">
                {showFilters ? 'Hide Filters' : 'Filters'}
            </Button>
          </div>

          {showFilters && (
            <div className="glass-panel p-4 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-fade-in">
                <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-medium-text mb-1">Stock Status</label>
                    <select value={filterStockStatus} onChange={e => setFilterStockStatus(e.target.value)} className={`${inputClasses} !py-2 text-sm`}>
                        <option value="All">All Items</option>
                        <option value="In">In Stock</option>
                        <option value="Low">Low Stock (≤ 5)</option>
                        <option value="Out">Out of Stock</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Input label="Min Price" type="number" min="0" value={filterPriceMin} onChange={e => setFilterPriceMin(e.target.value)} placeholder="0" />
                    <Input label="Max Price" type="number" min="0" value={filterPriceMax} onChange={e => setFilterPriceMax(e.target.value)} placeholder="∞" />
                </div>
                <div>
                    <Input label="GST Rate (%)" type="number" min="0" value={filterGstRate} onChange={e => setFilterGstRate(e.target.value)} placeholder="18" />
                </div>
                <div className="flex justify-end">
                     <Button variant="secondary" onClick={() => { setFilterStockStatus('All'); setFilterPriceMin(''); setFilterPriceMax(''); setFilterGstRate(''); }} className="w-full text-xs">Clear Filters</Button>
                </div>
            </div>
          )}
      </div>

      {selectedIds.length > 0 && (
          <div className="bg-accent/10 dark:bg-accent/20 border border-accent/20 p-3 rounded-md flex items-center justify-between mb-4 animate-fade-in">
              <span className="text-sm font-semibold text-accent dark:text-indigo-300">{selectedIds.length} items selected</span>
              <div className="flex gap-2">
                   <Button variant="secondary" className="!py-1 !text-xs" onClick={() => handleExport(false)}>Export Selected</Button>
                   <Button variant="secondary" className="!py-1 !text-xs bg-red-600 hover:bg-red-700 !text-white dark:bg-red-800/80" onClick={handleBulkDelete}>Delete Selected</Button>
              </div>
          </div>
      )}

      <div className="glass-panel shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600 dark:text-medium-text">
                <thead className="text-xs text-slate-700 dark:text-light-text uppercase bg-slate-100/50 dark:bg-tertiary-dark/50">
                    <tr>
                        <th scope="col" className="px-6 py-3 w-10">
                            <input type="checkbox" checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length} onChange={handleSelectAll} className="rounded border-slate-300 text-accent focus:ring-accent" />
                        </th>
                        <th scope="col" className="px-6 py-3">Name</th><th scope="col" className="px-6 py-3">HSN/SAC</th><th scope="col" className="px-6 py-3">Unit</th><th scope="col" className="px-6 py-3">Price</th><th scope="col" className="px-6 py-3">GST Rate</th><th scope="col" className="px-6 py-3">Stock</th><th scope="col" className="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredItems.map((item) => (
                        <tr key={item.id} className={`border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.includes(item.id) ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                            <td className="px-6 py-4">
                                <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => handleSelectOne(item.id)} className="rounded border-slate-300 text-accent focus:ring-accent" />
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-light-text whitespace-nowrap">{item.name}</td>
                            <td className="px-6 py-4">{item.hsn}</td>
                            <td className="px-6 py-4 uppercase">{item.unit}</td>
                            <td className="px-6 py-4">{currency}{item.price.toFixed(2)}</td>
                            <td className="px-6 py-4">{item.gstRate}%</td>
                            <td className="px-6 py-4">
                                <span className={`font-semibold ${item.quantityInStock <= 5 ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                                    {item.quantityInStock}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2"><Button variant="secondary" onClick={() => handleOpenModal(item)}>Edit</Button><Button variant="secondary" onClick={() => handleDeleteItem(item.id)} className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-800/80 dark:hover:bg-red-700/80">Delete</Button></td>
                        </tr>
                    ))}
                    {filteredItems.length === 0 && (<tr><td colSpan={8} className="text-center py-8 text-slate-500 dark:text-medium-text">{items.length > 0 ? 'No items match your filters.' : 'No items found. Add one to get started.'}</td></tr>)}
                </tbody>
            </table>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem.id ? 'Edit Item' : 'Add New Item'}>
          <ItemForm item={editingItem} setItem={setEditingItem} errors={errors} setErrors={setErrors}/>
           <div className="p-6 pt-0 flex justify-end gap-4"><Button variant="secondary" onClick={handleCloseModal}>Cancel</Button><Button onClick={handleSaveItem}>Save Item</Button></div>
      </Modal>

      <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="Delete Item">
          <div className="p-6"><p className="text-slate-600 dark:text-medium-text mb-6">Are you sure you want to delete this item? This action is permanent and cannot be undone.</p><div className="flex justify-end gap-4"><Button variant="secondary" onClick={() => setIsConfirmOpen(false)}>Cancel</Button><Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 focus:ring-red-500">Confirm Delete</Button></div></div>
      </Modal>
    </div>
  );
};

export default Items;
