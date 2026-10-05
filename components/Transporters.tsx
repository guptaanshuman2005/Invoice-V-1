import React, { useState, useCallback } from 'react';
import type { Transporter } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Modal from './common/Modal';
import { validateRequired, validateGstin } from '../utils/validation';
import { Plus, Edit, Trash2, Truck } from 'lucide-react';

interface TransportersProps {
  transporters: Transporter[];
  setTransporters: (transporters: Transporter[]) => void;
}

const emptyTransporter: Transporter = { id: '', name: '', gstin: '' };
type TransporterFormErrors = { [K in keyof Omit<Transporter, 'id'>]?: string };

const TransporterForm: React.FC<{ 
    transporter: Transporter, 
    setTransporter: React.Dispatch<React.SetStateAction<Transporter>>,
    errors: TransporterFormErrors,
    setErrors: React.Dispatch<React.SetStateAction<TransporterFormErrors>>
}> = ({ transporter, setTransporter, errors, setErrors }) => {
    
    const validateField = (name: string, value: string): string | null => {
        switch(name) {
            case 'name': return validateRequired(value);
            case 'gstin': return validateGstin(value);
            default: return null;
        }
    };
    
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTransporter(prev => ({ ...prev, [name]: value }));
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error || undefined }));
    }, [setTransporter, setErrors]);

    return (
        <div className="p-6 space-y-4">
            <Input label="Transporter Name" name="name" value={transporter.name} onChange={handleChange} required error={errors.name} placeholder="e.g. VRL Logistics Ltd"/>
            <Input label="Transporter GSTIN" name="gstin" value={transporter.gstin} onChange={handleChange} error={errors.gstin} placeholder="e.g. 29ABCDE1234F1Z5"/>
        </div>
    );
};

const Transporters: React.FC<TransportersProps> = ({ transporters, setTransporters }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransporter, setEditingTransporter] = useState<Transporter>(emptyTransporter);
  const [errors, setErrors] = useState<TransporterFormErrors>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [transporterToDelete, setTransporterToDelete] = useState<string | null>(null);

  const handleOpenModal = (transporter?: Transporter) => {
    setErrors({});
    setEditingTransporter(transporter || emptyTransporter);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const validateTransporter = (transporter: Transporter): boolean => {
      const formErrors: TransporterFormErrors = {};
      const nameError = validateRequired(transporter.name);
      if(nameError) formErrors.name = nameError;

      const gstinError = validateGstin(transporter.gstin);
      if(gstinError) formErrors.gstin = gstinError;
      
      setErrors(formErrors);
      return Object.values(formErrors).every(e => !e);
  };

  const handleSaveTransporter = () => {
    if (!validateTransporter(editingTransporter)) return;

    if (editingTransporter.id) {
      setTransporters((transporters || []).map(t => t.id === editingTransporter.id ? editingTransporter : t));
    } else {
      setTransporters([...(transporters || []), { ...editingTransporter, id: Date.now().toString() }]);
    }
    handleCloseModal();
  };

  const handleDeleteTransporter = (id: string) => {
    setTransporterToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (transporterToDelete) {
      setTransporters((transporters || []).filter(t => t.id !== transporterToDelete));
    }
    setIsConfirmOpen(false);
    setTransporterToDelete(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">Transporters</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Manage logistics partners and GST numbers for instant E-Way Bill transit docs.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2 shadow-lg shadow-accent/20">
          <Plus className="w-4 h-4" /> Add Transporter
        </Button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm border border-slate-200/50 dark:border-slate-800/50">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
                <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800/60 font-bold">
                    <tr>
                      <th scope="col" className="px-6 py-3.5">Name</th>
                      <th scope="col" className="px-6 py-3.5">GSTIN</th>
                      <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {(transporters || []).map((transporter) => (
                        <tr key={transporter.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">{transporter.name}</td>
                            <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">{transporter.gstin || '—'}</td>
                            <td className="px-6 py-4 text-right space-x-1.5">
                                <button 
                                  onClick={() => handleOpenModal(transporter)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-accent hover:bg-accent/10 active:scale-95 transition-all"
                                  title="Edit Transporter"
                                >
                                  <Edit className="w-4 h-4" strokeWidth={2} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteTransporter(transporter.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 active:scale-95 transition-all"
                                  title="Delete Transporter"
                                >
                                  <Trash2 className="w-4 h-4" strokeWidth={2} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {(!transporters || transporters.length === 0) && (
                      <tr>
                        <td colSpan={3} className="text-center py-14 text-slate-400 dark:text-slate-500">
                          <Truck className="w-10 h-10 mx-auto mb-3 opacity-40" />
                          <p className="font-semibold text-sm">No transporters added yet.</p>
                          <p className="text-xs mt-1">Add your shipping agencies or fleet transporters for E-Way bill generation.</p>
                        </td>
                      </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTransporter.id ? 'Edit Transporter' : 'Add New Transporter'}>
          <TransporterForm transporter={editingTransporter} setTransporter={setEditingTransporter} errors={errors} setErrors={setErrors} />
          <div className="p-6 pt-0 flex justify-end gap-3">
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button onClick={handleSaveTransporter} className="shadow-lg shadow-accent/20">Save Transporter</Button>
          </div>
      </Modal>

      <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="Delete Transporter">
          <div className="p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Are you sure you want to delete this transporter? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
              <Button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white active:scale-95">Confirm Delete</Button>
            </div>
          </div>
      </Modal>
    </div>
  );
};

export default Transporters;