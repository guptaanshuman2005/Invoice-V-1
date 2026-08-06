import React, { useState, useMemo } from 'react';
import type { Company, Expense } from '../types';
import Input from './common/Input';
import Button from './common/Button';
import Modal from './common/Modal';
import { Plus, Search, Filter, Trash2, DollarSign, Calendar, Tag, CreditCard, ArrowDownRight, Building2, TrendingDown } from 'lucide-react';

interface ExpensesProps {
  company: Company;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (expenseId: string) => void;
}

const CATEGORIES: Expense['category'][] = [
  'Rent', 'Salaries', 'Utilities', 'Raw Materials', 'Software', 'Taxes', 'Marketing', 'Other'
];

const PAYMENT_MODES: Expense['paymentMode'][] = [
  'Cash', 'Bank Transfer', 'UPI', 'Credit Card', 'Cheque'
];

const Expenses: React.FC<ExpensesProps> = ({ company, onAddExpense, onDeleteExpense }) => {
  const expenses = useMemo(() => company.expenses || [], [company.expenses]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<Omit<Expense, 'id'>>({
    category: 'Utilities',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    vendorName: '',
    paymentMode: 'UPI',
    notes: ''
  });

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchesSearch = exp.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (exp.vendorName || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchQuery, categoryFilter]);

  const totalExpenseAmount = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const currentMonthExpenses = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return expenses
      .filter(e => e.date.startsWith(currentMonth))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const topCategory = useMemo(() => {
    const catMap: Record<string, number> = {};
    expenses.forEach(e => {
      catMap[e.category] = (catMap[e.category] || 0) + (Number(e.amount) || 0);
    });
    let top = 'N/A';
    let max = 0;
    Object.entries(catMap).forEach(([cat, val]) => {
      if (val > max) {
        max = val;
        top = cat;
      }
    });
    return top;
  }, [expenses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || formData.amount <= 0) return;
    onAddExpense(formData);
    setIsModalOpen(false);
    setFormData({
      category: 'Utilities',
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      vendorName: '',
      paymentMode: 'UPI',
      notes: ''
    });
  };

  return (
    <div className="space-y-8 animate-fade-in p-2 md:p-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight">Business Expense Log</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track company operational expenditures and calculate net profitability.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-accent/20">
          <Plus className="w-4 h-4 mr-2" /> Record New Expense
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/40 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Expenses</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹{totalExpenseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/40 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">This Month</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹{currentMonthExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/40 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold shrink-0">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Highest Category</span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1 truncate max-w-[160px]">{topCategory}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search description or vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent border-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl text-xs font-bold focus:outline-none cursor-pointer border-none"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="glass-panel rounded-3xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/50 dark:bg-slate-800/40 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200/50 dark:border-slate-800/50">
                <th className="py-4 px-6">Description</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Vendor</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Payment Mode</th>
                <th className="py-4 px-6 text-right">Amount</th>
                <th className="py-4 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs font-medium">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500 font-bold">
                    No expense records found. Click "Record New Expense" to get started.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">{exp.description}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-accent/10 text-accent">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-300">{exp.vendorName || '-'}</td>
                    <td className="py-4 px-6 text-slate-500">{exp.date}</td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-300">{exp.paymentMode}</td>
                    <td className="py-4 px-6 text-right font-black text-rose-500">
                      ₹{Number(exp.amount).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => onDeleteExpense(exp.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                        title="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record New Expense">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Expense Description *</label>
            <input
              type="text"
              required
              placeholder="e.g. Office Rent payment for July"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent border-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Amount (₹) *</label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                placeholder="e.g. 15000"
                value={formData.amount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent border-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs font-bold focus:outline-none border-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Vendor / Payee</label>
              <input
                type="text"
                placeholder="e.g. Acme Commercial Real Estate"
                value={formData.vendorName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, vendorName: e.target.value }))}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent border-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Mode</label>
              <select
                value={formData.paymentMode}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentMode: e.target.value as any }))}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs font-bold focus:outline-none border-none"
              >
                {PAYMENT_MODES.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent border-none"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Expense</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Expenses;
