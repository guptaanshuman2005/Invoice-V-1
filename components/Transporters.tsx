import React, { useState, useCallback } from 'react';
import type { Transporter } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Modal from './common/Modal';
import { validateRequired, validateGstin } from '../utils/validation';

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
    }
    
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTransporter(prev => ({ ...prev, [name]: value }));
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error || undefined }));
    }, [setTransporter, setErrors]);

    return (
        <div className="p-6 space-y-4">
            <Input label="Transporter Name" name="name" value={transporter.name} onChange={handleChange} required error={errors.name}/>
            <Input label="Transporter GSTIN" name="gstin" value={transporter.gstin} onChange={handleChange} error={errors.gstin}/>
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
  }

  const handleSaveTransporter = () => {
    if (!validateTransporter(editingTransporter)) return;

    if (editingTransporter.id) {
      setTransporters(transporters.map(t => t.id === editingTransporter.id ? editingTransporter : t));
    } else {
      setTransporters([...transporters, { ...editingTransporter, id: Date.now().toString() }]);
    }
    handleCloseModal();
  };

  const handleDeleteTransporter = (id: string) => {
    setTransporterToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (transporterToDelete) {
      setTransporters(transporters.filter(t => t.id !== transporterToDelete));
    }
    setIsConfirmOpen(false);
    setTransporterToDelete(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-light-text">Transporters</h1>
        <Button onClick={() => handleOpenModal()}>Add New Transporter</Button>
      </div>

      <div className="bg-white dark:bg-primary-dark shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600 dark:text-medium-text">
                <thead className="text-xs text-slate-700 dark:text-light-text uppercase bg-slate-100 dark:bg-tertiary-dark">
                    <tr><th scope="col" className="px-6 py-3">Name</th><th scope="col" className="px-6 py-3">GSTIN</th><th scope="col" className="px-6 py-3 text-right">Actions</th></tr>
                </thead>
                <tbody>
                    {transporters.map((transporter) => (
                        <tr key={transporter.id} className="bg-white dark:bg-primary-dark border-b border-slate-200 dark:border-tertiary-dark hover:bg-slate-50 dark:hover:bg-tertiary-dark">
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-light-text whitespace-nowrap">{transporter.name}</td>
                            <td className="px-6 py-4">{transporter.gstin}</td>
                            <td className="px-6 py-4 text-right space-x-2"><Button variant="secondary" onClick={() => handleOpenModal(transporter)}>Edit</Button><Button variant="secondary" onClick={() => handleDeleteTransporter(transporter.id)} className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-800/80 dark:hover:bg-red-700/80">Delete</Button></td>
                        </tr>
                    ))}
                    {transporters.length === 0 && (<tr><td colSpan={3} className="text-center py-8 text-slate-500 dark:text-medium-text">No transporters found. Add one to get started.</td></tr>)}
                </tbody>
            </table>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTransporter.id ? 'Edit Transporter' : 'Add New Transporter'}>
          <TransporterForm transporter={editingTransporter} setTransporter={setEditingTransporter} errors={errors} setErrors={setErrors} />
           <div className="p-6 pt-0 flex justify-end gap-4"><Button variant="secondary" onClick={handleCloseModal}>Cancel</Button><Button onClick={handleSaveTransporter}>Save Transporter</Button></div>
      </Modal>

      <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="Delete Transporter">
          <div className="p-6"><p className="text-slate-600 dark:text-medium-text mb-6">Are you sure you want to delete this transporter? This action cannot be undone.</p><div className="flex justify-end gap-4"><Button variant="secondary" onClick={() => setIsConfirmOpen(false)}>Cancel</Button><Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 focus:ring-red-500">Confirm Delete</Button></div></div>
      </Modal>
    </div>
  );
};

export default Transporters;