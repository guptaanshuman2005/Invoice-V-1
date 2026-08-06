
import React, { useState, useMemo } from 'react';
import type { Quotation, Company } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Modal from './common/Modal';
import { InvoiceView } from './Invoices';
import { FileText, Edit, Trash2, ChevronDown } from 'lucide-react';
import { Dropdown } from './common/Dropdown';

interface QuotationsProps {
  quotations: Quotation[];
  company: Company;
  setActiveView: (view: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onConvert: (id: string) => void;
  onStatusChange: (id: string, status: Quotation['status']) => void;
}

const Quotations: React.FC<QuotationsProps> = ({ 
    quotations, company, setActiveView, onEdit, onDelete, onConvert, onStatusChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const currency = '₹';

  const filteredQuotations = useMemo(() => {
    let result = [...quotations];
    const lowercasedQuery = searchQuery.toLowerCase();
    if (lowercasedQuery) {
        result = result.filter(q => 
            (q.quotationNumber || '').toLowerCase().includes(lowercasedQuery) ||
            (q.client?.name || '').toLowerCase().includes(lowercasedQuery)
        );
    }
    return result.sort((a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [quotations, searchQuery]);

  const getStatusBadge = (status: Quotation['status']) => {
    switch (status) {
        case 'Converted': return 'bg-green-100 text-green-700 ring-1 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400';
        case 'Sent': return 'bg-blue-100 text-blue-700 ring-1 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400';
        case 'Accepted': return 'bg-purple-100 text-purple-700 ring-1 ring-purple-600/20 dark:bg-purple-900/30 dark:text-purple-400';
        case 'Draft': return 'bg-slate-100 text-slate-600 ring-1 ring-slate-600/20 dark:bg-slate-700 dark:text-slate-300';
        default: return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-light-text tracking-tight">Quotations</h1>
        <div className="flex gap-3">
             <Button onClick={() => setActiveView('NewQuotation')} className="shadow-lg shadow-accent/20">+ New Quote</Button>
        </div>
      </div>

      <div className="mb-6 flex gap-4">
          <div className="flex-grow">
              <Input label="" placeholder="Search quotes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="!py-2.5 !rounded-xl"/>
          </div>
      </div>

      {filteredQuotations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
                  <FileText className="h-8 w-8" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mt-2">No quotations yet</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">Create estimates for your clients and convert them to invoices later.</p>
              <Button className="mt-6" onClick={() => setActiveView('NewQuotation')}>Create First Quote</Button>
          </div>
      ) : (
          <div className="glass-panel rounded-3xl overflow-hidden animate-fade-in-up">
              <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
                  <thead className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                          <th className="px-6 py-4">Number</th>
                          <th className="px-6 py-4">Client</th>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4 text-right">Amount</th>
                          <th className="px-6 py-4 text-center">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredQuotations.map((quote) => (
                          <tr key={quote.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setSelectedQuotation(quote)}>
                              <td className="px-6 py-4 font-mono font-medium text-slate-900 dark:text-white">{quote.quotationNumber}</td>
                              <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">{quote.client?.name || 'Unknown Client'}</td>
                              <td className="px-6 py-4">{quote.issueDate}</td>
                              <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">{currency}{quote.grandTotal.toLocaleString()}</td>
                              <td className="px-6 py-4 text-center" onClick={e => e.stopPropagation()}>
                                  <Dropdown
                                      trigger={
                                          <button className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all hover:ring-2 hover:ring-offset-1 ${getStatusBadge(quote.status)}`}>
                                              {quote.status}
                                              <ChevronDown className="w-3 h-3 opacity-50" />
                                          </button>
                                      }
                                      isOpen={openDropdownId === quote.id}
                                      onOpen={() => setOpenDropdownId(quote.id)}
                                      onClose={() => setOpenDropdownId(null)}
                                  >
                                      <div className="py-1 w-32 flex flex-col">
                                          <button onClick={() => { onStatusChange(quote.id, 'Draft'); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold transition-colors">Mark Draft</button>
                                          <button onClick={() => { onStatusChange(quote.id, 'Sent'); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2.5 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 font-bold transition-colors">Mark Sent</button>
                                          <button onClick={() => { onStatusChange(quote.id, 'Accepted'); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2.5 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 font-bold transition-colors">Mark Accepted</button>
                                      </div>
                                  </Dropdown>
                              </td>
                              <td className="px-6 py-4 text-right space-x-2" onClick={e => e.stopPropagation()}>
                                  {quote.status !== 'Converted' && (
                                      <button onClick={() => onConvert(quote.id)} className="text-accent hover:text-accent-hover font-bold text-xs bg-accent/10 hover:bg-accent/20 px-3 py-1.5 rounded transition-all mr-2">Convert to Invoice</button>
                                  )}
                                  <button onClick={() => onEdit(quote.id)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 transition-all"><Edit className="h-4 w-4" strokeWidth={2} /></button>
                                  <button onClick={() => onDelete(quote.id)} className="text-slate-400 hover:text-red-500 p-1 transition-all"><Trash2 className="h-4 w-4" strokeWidth={2} /></button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}
      
      <Modal isOpen={!!selectedQuotation} onClose={() => setSelectedQuotation(null)} title={`Quotation #${selectedQuotation?.quotationNumber}`}>
          {selectedQuotation && (
              <div className="relative">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full z-20">PREVIEW MODE</div>
                  <InvoiceView 
                        invoice={selectedQuotation as unknown as any} 
                        company={company} 
                        onClose={() => setSelectedQuotation(null)} 
                        onStatusChange={onStatusChange}
                        documentTitle="Quotation"
                  />
              </div>
          )}
      </Modal>
    </div>
  );
};

export default Quotations;
