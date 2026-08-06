
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { Company, BankAccount, CompanyDetails } from '../types';
import Input from './common/Input';
import Button from './common/Button';
import Modal from './common/Modal';
import { INDIAN_STATES } from '../constants';
import { validateGstin, validatePan, validateEmail, validateIfsc, validateRequired, fetchLocationByPincode } from '../utils/validation';
import { Building, Image as ImageIcon, Zap } from 'lucide-react';
import { trackEvent } from '../utils/analytics';
import TemplatePreviewModal from './TemplatePreviewModal';
import { supabase } from '../supabase';

interface SettingsProps {
  activeCompany: Company;
  updateCompany: (updatedCompany: Company) => void;
}

type DetailsFormErrors = { [K in keyof Omit<CompanyDetails, 'logo' | 'invoicePrefix' | 'nextInvoiceNumber'>]?: string };
type BankFormErrors = { [K in keyof Omit<BankAccount, 'id' | 'isDefault'>]?: string };

const emptyBankAccount: Omit<BankAccount, 'id'> = { bankName: '', accountNumber: '', ifsc: '', isDefault: false };

const BankAccountForm: React.FC<{ 
    account: Omit<BankAccount, 'id'> | BankAccount; 
    setAccount: React.Dispatch<React.SetStateAction<Omit<BankAccount, 'id'> | BankAccount>>;
    errors: BankFormErrors;
}> = ({ account, setAccount, errors }) => {
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        let { name, value } = e.target;
        if (name === 'ifsc') value = value.toUpperCase();
        setAccount(prev => ({ ...prev, [name]: value }));
    }, [setAccount]);

    return (
        <div className="p-6 space-y-4">
            <Input label="Bank Name" name="bankName" value={account.bankName} onChange={handleChange} required error={errors.bankName} placeholder="e.g. HDFC Bank"/>
            <Input label="Account Number" name="accountNumber" value={account.accountNumber} onChange={handleChange} required error={errors.accountNumber} placeholder="e.g. 502000..."/>
            <Input label="IFSC Code" name="ifsc" value={account.ifsc} onChange={handleChange} required error={errors.ifsc} placeholder="e.g. HDFC0001234"/>
        </div>
    );
};

const Settings: React.FC<SettingsProps> = ({ activeCompany, updateCompany }) => {
  const [details, setDetails] = useState(activeCompany.details);
  const [logoPreview, setLogoPreview] = useState<string | null>(activeCompany.details.logo);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | Omit<BankAccount, 'id'>>(emptyBankAccount);
  const [showSuccess, setShowSuccess] = useState(false);
  const [bankSuccessMessage, setBankSuccessMessage] = useState('');
  const [isBankDeleteConfirmOpen, setIsBankDeleteConfirmOpen] = useState(false);
  const [accountToDeleteId, setAccountToDeleteId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'customization' | 'bank' | 'billing'>('profile');
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);

  const [detailErrors, setDetailErrors] = useState<DetailsFormErrors>({});
  const [bankErrors, setBankErrors] = useState<BankFormErrors>({});
  const [logoError, setLogoError] = useState<string|null>(null);
  const [signatureError, setSignatureError] = useState<string|null>(null);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(activeCompany.details.signature || null);

  useEffect(() => {
    setDetails(activeCompany.details);
    setLogoPreview(activeCompany.details.logo);
    setSignaturePreview(activeCompany.details.signature || null);
    setDetailErrors({});
  }, [activeCompany]);

  // Live preview of brand color
  useEffect(() => {
    if (details.brandColor) {
        const color = details.brandColor;
        document.documentElement.style.setProperty('--color-accent', color);
        
        let r = parseInt(color.substring(1, 3), 16);
        let g = parseInt(color.substring(3, 5), 16);
        let b = parseInt(color.substring(5, 7), 16);
        
        r = Math.max(0, Math.floor(r * 0.85));
        g = Math.max(0, Math.floor(g * 0.85));
        b = Math.max(0, Math.floor(b * 0.85));
        
        const hoverColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        document.documentElement.style.setProperty('--color-accent-hover', hoverColor);
    }
    
    // Cleanup function to revert to saved color if unmounted without saving
    return () => {
        if (activeCompany.details.brandColor) {
            const savedColor = activeCompany.details.brandColor;
            document.documentElement.style.setProperty('--color-accent', savedColor);
            
            let r = parseInt(savedColor.substring(1, 3), 16);
            let g = parseInt(savedColor.substring(3, 5), 16);
            let b = parseInt(savedColor.substring(5, 7), 16);
            
            r = Math.max(0, Math.floor(r * 0.85));
            g = Math.max(0, Math.floor(g * 0.85));
            b = Math.max(0, Math.floor(b * 0.85));
            
            const savedHoverColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            document.documentElement.style.setProperty('--color-accent-hover', savedHoverColor);
        } else {
            document.documentElement.style.removeProperty('--color-accent');
            document.documentElement.style.removeProperty('--color-accent-hover');
        }
    };
  }, [details.brandColor, activeCompany.details.brandColor]);

    useEffect(() => {
    const pincode = details.zip;
    if (pincode && pincode.length === 6) {
      const timer = setTimeout(async () => {
        setIsPincodeLoading(true);
        const location = await fetchLocationByPincode(pincode);
        if (location) {
          setDetails(prev => ({ ...prev, city: location.city, state: location.state }));
          setDetailErrors(prev => ({...prev, zip: undefined}));
        } else if (location === null) {
           setDetailErrors(prev => ({...prev, zip: 'Invalid Pincode'}));
        } else {
           // Don't block saving if lookup fails, just clear the error
           setDetailErrors(prev => ({...prev, zip: undefined}));
        }
        setIsPincodeLoading(false);
      }, 500); // Debounce
      return () => clearTimeout(timer);
    }
  }, [details.zip]);

  const validateDetailsField = useCallback((name: string, value: string): string | null => {
    switch (name) {
      case 'name': return validateRequired(value);
      case 'gstin': return validateGstin(value);
      case 'pan': return validatePan(value);
      case 'email': return validateEmail(value);
      case 'zip': return value && (value.length !== 6 || !/^\d+$/.test(value)) ? 'Pincode must be 6 digits' : null;
      default: return null;
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let { name, value, type } = e.target;
    if (['gstin', 'pan', 'ifsc'].includes(name)) {
        value = value.toUpperCase();
    }
    setDetails(prev => ({ ...prev, [name]: type === 'number' ? (value === '' ? '' : parseInt(value)) : value }));
    const error = validateDetailsField(name, value);
    setDetailErrors(prev => ({...prev, [name]: error || undefined }));
  }, [validateDetailsField]);

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError(null);
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (!file.type.startsWith('image/')) {
            setLogoError('Please select an image file.');
            return;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            setLogoError('Image size should be less than 2MB.');
            return;
        }
        
        setIsUploadingLogo(true);
        try {
            // Show local preview immediately
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Upload to Supabase
            const { uploadFileToSupabase } = await import('../utils/supabaseStorage');
            const path = `logos/${activeCompany.id}/${Date.now()}_${file.name}`;
            const publicUrl = await uploadFileToSupabase(file, 'company-assets', path);
            
            if (publicUrl) {
                setDetails(prev => ({ ...prev, logo: publicUrl }));
            } else {
                setLogoError('Failed to upload logo to storage.');
                setLogoPreview(activeCompany.details.logo); // Revert preview
            }
        } catch (err) {
            console.error('Error uploading logo:', err);
            setLogoError('An unexpected error occurred.');
            setLogoPreview(activeCompany.details.logo); // Revert preview
        } finally {
            setIsUploadingLogo(false);
        }
    }
  };

  const handleSignatureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignatureError(null);
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (!file.type.startsWith('image/')) {
            setSignatureError('Please select an image file.');
            return;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            setSignatureError('Image size should be less than 2MB.');
            return;
        }
        
        setIsUploadingSignature(true);
        try {
            // Show local preview immediately
            const reader = new FileReader();
            reader.onloadend = () => {
                setSignaturePreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Upload to Supabase
            const { uploadFileToSupabase } = await import('../utils/supabaseStorage');
            const path = `signatures/${activeCompany.id}/${Date.now()}_${file.name}`;
            const publicUrl = await uploadFileToSupabase(file, 'company-assets', path);
            
            if (publicUrl) {
                setDetails(prev => ({ ...prev, signature: publicUrl }));
            } else {
                setSignatureError('Failed to upload signature to storage.');
                setSignaturePreview(activeCompany.details.signature || null); // Revert preview
            }
        } catch (err) {
            console.error('Error uploading signature:', err);
            setSignatureError('An unexpected error occurred.');
            setSignaturePreview(activeCompany.details.signature || null); // Revert preview
        } finally {
            setIsUploadingSignature(false);
        }
    }
  };
  const handleSaveDetails = async () => {
    // Validate all fields before saving
    const newErrors: DetailsFormErrors = {};
    newErrors.name = validateRequired(details.name) || undefined;
    newErrors.phone = validateRequired(details.phone) || undefined;
    newErrors.address = validateRequired(details.address) || undefined;
    newErrors.city = validateRequired(details.city) || undefined;
    newErrors.state = validateRequired(details.state) || undefined;
    newErrors.zip = validateRequired(details.zip) || validateDetailsField('zip', details.zip) || undefined;
    
    if (details.gstin) newErrors.gstin = validateDetailsField('gstin', details.gstin) || undefined;
    if (details.pan) newErrors.pan = validateDetailsField('pan', details.pan) || undefined;
    if (details.email) newErrors.email = validateDetailsField('email', details.email) || undefined;

    // Clean up undefined values
    Object.keys(newErrors).forEach(key => {
        if (newErrors[key as keyof DetailsFormErrors] === undefined) {
            delete newErrors[key as keyof DetailsFormErrors];
        }
    });
    
    // Check existing errors and new validations
    const hasErrors = Object.values(detailErrors).some(e => e) || Object.keys(newErrors).length > 0;
    
    if (hasErrors) {
        setDetailErrors(prev => ({ ...prev, ...newErrors }));
        setSaveError('Please fill all required fields correctly.');
        setTimeout(() => setSaveError(null), 3000);
        return;
    }

    if (details.gstin && details.gstin !== activeCompany.details.gstin) {
        try {
            const { data: gstinExists, error } = await supabase.rpc('check_gstin_exists', { gstin_to_check: details.gstin });
            if (error) throw error;
            if (gstinExists) {
                setSaveError('A company with this GSTIN is already registered on another account.');
                setTimeout(() => setSaveError(null), 5000);
                return;
            }
        } catch (err) {
            console.error('Error validating GSTIN check:', err);
        }
    }

    setSaveError(null);
    updateCompany({ ...activeCompany, details });
    setShowSuccess(true);
    trackEvent('update_company_settings', { companyId: activeCompany.id });
    setTimeout(() => setShowSuccess(false), 3000);
  };
  
  const handleOpenBankModal = (account?: BankAccount) => {
    setBankErrors({});
    setEditingAccount(account || emptyBankAccount);
    setIsBankModalOpen(true);
  };
  
  const validateBankAccount = (account: Omit<BankAccount, 'id'> | BankAccount): boolean => {
      const errors: BankFormErrors = {};
      if (validateRequired(account.bankName)) errors.bankName = "Bank Name is required.";
      if (validateRequired(account.accountNumber)) errors.accountNumber = "Account Number is required.";
      const ifscError = validateRequired(account.ifsc) || validateIfsc(account.ifsc);
      if (ifscError) errors.ifsc = ifscError;
      setBankErrors(errors);
      return Object.keys(errors).length === 0;
  }
  
  const handleSaveBankAccount = () => {
    if (!validateBankAccount(editingAccount)) return;

    let updatedAccounts: BankAccount[];
    const isNew = !('id' in editingAccount);
    
    if (editingAccount.isDefault) {
      activeCompany.bankAccounts.forEach(acc => acc.isDefault = false);
    }

    if (isNew) {
      updatedAccounts = [...activeCompany.bankAccounts, { ...editingAccount, id: Date.now().toString() }];
    } else {
      updatedAccounts = activeCompany.bankAccounts.map(acc => acc.id === (editingAccount as BankAccount).id ? (editingAccount as BankAccount) : acc);
    }
    
    // Auto-set default if it's the first and only account
    if (updatedAccounts.length === 1) {
        updatedAccounts[0].isDefault = true;
    } else if (updatedAccounts.length > 0 && !updatedAccounts.some(acc => acc.isDefault)) {
        updatedAccounts[0].isDefault = true;
    }
    
    updateCompany({ ...activeCompany, bankAccounts: updatedAccounts });
    setIsBankModalOpen(false);
    setBankSuccessMessage(`Bank account successfully ${isNew ? 'added' : 'updated'}.`);
    setTimeout(() => setBankSuccessMessage(''), 3000);
  };

  const handleDeleteBankAccount = (accountId: string) => {
    setAccountToDeleteId(accountId);
    setIsBankDeleteConfirmOpen(true);
  };

  const confirmDeleteBankAccount = () => {
    if (accountToDeleteId) {
      const updatedAccounts = activeCompany.bankAccounts.filter(acc => acc.id !== accountToDeleteId);
      if (updatedAccounts.length > 0 && !updatedAccounts.some(acc => acc.isDefault)) {
        updatedAccounts[0].isDefault = true;
      }
      updateCompany({ ...activeCompany, bankAccounts: updatedAccounts });
      setBankSuccessMessage('Bank account successfully deleted.');
      setTimeout(() => setBankSuccessMessage(''), 3000);
    }
    setIsBankDeleteConfirmOpen(false);
    setAccountToDeleteId(null);
  };

  const handleSetDefault = (accountId: string) => {
      const updatedAccounts = activeCompany.bankAccounts.map(acc => ({ ...acc, isDefault: acc.id === accountId }));
      updateCompany({ ...activeCompany, bankAccounts: updatedAccounts });
  };

  const inputClasses = "w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none text-sm px-4 py-3 transition-all duration-200 ease-in-out border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-2 focus:ring-accent/20 focus:border-accent";

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-light-text tracking-tight">Settings</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your company profile, billing, and preferences.</p>
          </div>
          {showSuccess && <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-semibold animate-fade-in mb-1">Settings Saved!</div>}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl overflow-x-auto">
        {['profile', 'customization', 'bank', 'billing'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-2.5 text-sm font-medium rounded-lg capitalize whitespace-nowrap transition-all ${
              activeTab === tab 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            }`}
          >
            {tab === 'bank' ? 'Bank Accounts' : tab === 'billing' ? 'Billing & Usage' : tab}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-8 animate-fade-in">
            {/* Identity Card */}
            <div className="glass-panel p-8 rounded-2xl">
                <h2 className="text-lg font-bold text-slate-900 dark:text-light-text mb-6 border-b border-slate-100 dark:border-slate-700/50 pb-4">Identity & Branding</h2>
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                    <div className="flex-shrink-0">
                        <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Logo</label>
                        <div className="relative group w-32 h-32 bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden hover:border-accent transition-colors">
                            {isUploadingLogo ? (
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
                            ) : logoPreview ? (
                                <img src={logoPreview} alt="Company Logo" className="w-full h-full object-contain p-2" />
                            ) : (
                                <span className="text-xs text-slate-400 text-center px-2">Upload<br/>Logo</span>
                            )}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <span className="text-white text-xs font-bold">Change</span>
                            </div>
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleLogoChange} accept="image/*" disabled={isUploadingLogo} />
                        </div>
                        {logoError && <p className="text-xs text-red-500 mt-1">{logoError}</p>}
                    </div>
                    <div className="flex-shrink-0">
                        <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Signature</label>
                        <div className="relative group w-32 h-32 bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden hover:border-accent transition-colors">
                            {isUploadingSignature ? (
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
                            ) : signaturePreview ? (
                                <img src={signaturePreview} alt="Signature" className="w-full h-full object-contain p-2" />
                            ) : (
                                <span className="text-xs text-slate-400 text-center px-2">Upload<br/>Signature</span>
                            )}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <span className="text-white text-xs font-bold">Change</span>
                            </div>
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleSignatureChange} accept="image/*" disabled={isUploadingSignature} />
                        </div>
                        {signatureError && <p className="text-xs text-red-500 mt-1">{signatureError}</p>}
                    </div>
                    <div className="flex-grow space-y-6">
                        <Input label="Company Name" name="name" value={details.name} onChange={handleChange} required error={detailErrors.name} placeholder="e.g. Acme Corp" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Phone" name="phone" type="tel" value={details.phone} onChange={handleChange} required error={detailErrors.phone} placeholder="e.g. +91 98765 43210"/>
                            <Input label="Email" name="email" type="email" value={details.email} onChange={handleChange} error={detailErrors.email} placeholder="e.g. contact@acme.com" />
                        </div>
                    </div>
                </div>
                
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Address</h3>
                <div className="space-y-6">
                    <div>
                        <textarea name="address" rows={2} value={details.address} onChange={handleChange} className={`${inputClasses} ${detailErrors.address ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}`} placeholder="Street Address, Area, Landmark" />
                        {detailErrors.address && <p className="text-xs text-red-500 mt-1">{detailErrors.address}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="relative">
                            <Input label="ZIP Code" name="zip" value={details.zip} onChange={handleChange} error={detailErrors.zip} maxLength={6} required placeholder="e.g. 400001" />
                            {isPincodeLoading && <div className="absolute top-9 right-3 h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>}
                        </div>
                        <Input label="City" name="city" value={details.city} onChange={handleChange} required error={detailErrors.city} placeholder="e.g. Mumbai" />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">State <span className="text-red-500">*</span></label>
                            <select id="state" name="state" value={details.state} onChange={handleChange} className={`${inputClasses} ${detailErrors.state ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}`}>
                                <option value="">Select State</option>
                                {INDIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                            </select>
                            {detailErrors.state && <p className="text-xs text-red-500 mt-1">{detailErrors.state}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Legal Card */}
            <div className="glass-panel p-8 rounded-2xl">
                <h2 className="text-lg font-bold text-slate-900 dark:text-light-text mb-6 border-b border-slate-100 dark:border-slate-700/50 pb-4">Legal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input label="GSTIN" name="gstin" value={details.gstin} onChange={handleChange} error={detailErrors.gstin} placeholder="e.g. 27AAAAA0000A1Z5" />
                    <Input label="PAN" name="pan" value={details.pan} onChange={handleChange} error={detailErrors.pan} placeholder="e.g. ABCDE1234F" />
                    <Input label="UDYAM" name="udyam" value={details.udyam} onChange={handleChange} placeholder="Optional" />
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <a href="/privacy" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('navigate', { detail: 'PrivacyPolicy' })); }} className="text-sm text-slate-500 hover:text-accent transition-colors">Privacy Policy</a>
                        <a href="/terms" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('navigate', { detail: 'TermsOfService' })); }} className="text-sm text-slate-500 hover:text-accent transition-colors">Terms of Service</a>
                    </div>
                    <div className="flex items-center gap-4">
                        {saveError && <span className="text-sm font-semibold text-red-500 animate-fade-in">{saveError}</span>}
                        <Button onClick={handleSaveDetails} className="px-8 !py-3 !text-base shadow-lg shadow-accent/20">Save Profile</Button>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* Customization Tab */}
        {activeTab === 'customization' && (
          <div className="space-y-8 animate-fade-in">
            <div className="glass-panel p-8 rounded-2xl">
                <h2 className="text-lg font-bold text-slate-900 dark:text-light-text mb-6 border-b border-slate-100 dark:border-slate-700/50 pb-4">Brand Color</h2>
                <div className="flex items-center gap-6">
                    <input 
                        type="color" 
                        name="brandColor"
                        value={details.brandColor || '#4F46E5'} 
                        onChange={handleChange}
                        className="h-16 w-32 p-1 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer" 
                    />
                    <div>
                        <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">{details.brandColor || '#4F46E5'}</span>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">This color will be used for buttons, links, and invoice headers.</p>
                    </div>
                </div>
            </div>

            <div className="glass-panel p-8 rounded-2xl">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700/50 pb-4">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-light-text">Invoice Template</h2>
                    {activeCompany.subscription?.plan === 'premium' ? (
                        <span className="text-xs font-bold uppercase tracking-wider bg-amber-500 text-white px-3 py-1 rounded-full">Premium Unlocked</span>
                    ) : (
                        <Button variant="secondary" className="text-xs" onClick={() => window.dispatchEvent(new CustomEvent('openSubscriptionPrompt'))}>Upgrade to Premium</Button>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Modern Template */}
                    <div 
                        onClick={() => setPreviewTemplate('modern')}
                        className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-all group ${details.invoiceTemplate === 'modern' ? 'border-accent bg-accent/5' : 'border-slate-200 dark:border-slate-700 hover:border-accent/50'}`}
                    >
                        <div className="aspect-[1/1.4] bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 mb-4 overflow-hidden flex flex-col relative">
                            <div className="h-8 bg-slate-100 dark:bg-slate-700 w-full flex items-center px-3 justify-between">
                                <div className="w-12 h-3 bg-slate-200 dark:bg-slate-600 rounded"></div>
                                <div className="w-8 h-3 bg-accent/40 rounded"></div>
                            </div>
                            <div className="p-3 space-y-2 flex-grow">
                                <div className="w-1/2 h-2 bg-slate-200 dark:bg-slate-600 rounded"></div>
                                <div className="w-1/3 h-2 bg-slate-200 dark:bg-slate-600 rounded"></div>
                                <div className="mt-4 w-full h-16 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-700"></div>
                            </div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setPreviewTemplate('modern'); }}
                                    className="bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg hover:bg-slate-100"
                                >
                                    Preview
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900 dark:text-white">Modern</h4>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${details.invoiceTemplate === 'modern' ? 'border-accent bg-accent' : 'border-slate-300'}`}>
                                {details.invoiceTemplate === 'modern' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                            </div>
                        </div>
                    </div>

                    {/* Classic Template */}
                    <div 
                        onClick={() => setPreviewTemplate('classic')}
                        className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-all group ${details.invoiceTemplate === 'classic' ? 'border-accent bg-accent/5' : 'border-slate-200 dark:border-slate-700 hover:border-accent/50'}`}
                    >
                        <div className="aspect-[1/1.4] bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 mb-4 overflow-hidden flex flex-col p-3 relative">
                            <div className="w-full h-4 border-b border-slate-300 dark:border-slate-600 mb-2 flex justify-center"><div className="w-16 h-2 bg-slate-300 dark:bg-slate-600 rounded"></div></div>
                            <div className="space-y-1.5 mt-2">
                                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                <div className="w-3/4 h-1.5 bg-slate-200 dark:bg-slate-700 rounded"></div>
                            </div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setPreviewTemplate('classic'); }}
                                    className="bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg hover:bg-slate-100"
                                >
                                    Preview
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900 dark:text-white">Classic</h4>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${details.invoiceTemplate === 'classic' ? 'border-accent bg-accent' : 'border-slate-300'}`}>
                                {details.invoiceTemplate === 'classic' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                            </div>
                        </div>
                    </div>

                    {/* Minimal Template */}
                    <div 
                        onClick={() => setPreviewTemplate('minimal')}
                        className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-all group ${details.invoiceTemplate === 'minimal' ? 'border-accent bg-accent/5' : 'border-slate-200 dark:border-slate-700 hover:border-accent/50'}`}
                    >
                        <div className="aspect-[1/1.4] bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 mb-4 overflow-hidden flex flex-col p-4 relative">
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 mb-4"></div>
                            <div className="w-24 h-2 bg-slate-200 dark:bg-slate-600 rounded mb-2"></div>
                            <div className="w-16 h-2 bg-slate-200 dark:bg-slate-600 rounded"></div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setPreviewTemplate('minimal'); }}
                                    className="bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg hover:bg-slate-100"
                                >
                                    Preview
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900 dark:text-white">Minimal</h4>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${details.invoiceTemplate === 'minimal' ? 'border-accent bg-accent' : 'border-slate-300'}`}>
                                {details.invoiceTemplate === 'minimal' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                            </div>
                        </div>
                    </div>

                    {/* Tally Prime Template */}
                    <div 
                        onClick={() => setPreviewTemplate('tally')}
                        className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-all group ${details.invoiceTemplate === 'tally' ? 'border-accent bg-accent/5' : 'border-slate-200 dark:border-slate-700 hover:border-accent/50'}`}
                    >
                        <div className="aspect-[1/1.4] bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 mb-4 overflow-hidden flex flex-col p-4 relative justify-center">
                            <div className="border border-slate-300 dark:border-slate-700 p-2 flex flex-col gap-2 rounded">
                                <div className="h-2 w-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                <div className="border-t border-slate-200 dark:border-slate-700 pt-1 flex justify-between">
                                    <div className="h-1.5 w-6 bg-slate-150 dark:bg-slate-600 rounded"></div>
                                    <div className="h-1.5 w-6 bg-slate-150 dark:bg-slate-650 rounded"></div>
                                </div>
                                <div className="h-4 w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-750 rounded"></div>
                            </div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setPreviewTemplate('tally'); }}
                                    className="bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg hover:bg-slate-100"
                                >
                                    Preview
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900 dark:text-white">Tally Prime Style</h4>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${details.invoiceTemplate === 'tally' ? 'border-accent bg-accent' : 'border-slate-300'}`}>
                                {details.invoiceTemplate === 'tally' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                            </div>
                        </div>
                    </div>

                    {/* Custom (Premium) Template */}
                    <div 

                        onClick={() => setPreviewTemplate('custom')}
                        className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-all group ${details.invoiceTemplate === 'custom' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10' : 'border-slate-200 dark:border-slate-700 hover:border-amber-500/50'}`}
                    >
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10">PREMIUM</div>
                        <div className="aspect-[1/1.4] bg-slate-50 dark:bg-slate-800/50 rounded-lg shadow-sm border border-dashed border-amber-300 dark:border-amber-700/50 mb-4 overflow-hidden flex items-center justify-center relative">
                            <div className="text-center p-4">
                                <div className="w-10 h-10 mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-2">
                                    <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </div>
                                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Custom Builder</span>
                            </div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setPreviewTemplate('custom'); }}
                                    className="bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg hover:bg-slate-100"
                                >
                                    Preview
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900 dark:text-white">Custom</h4>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${details.invoiceTemplate === 'custom' ? 'border-amber-500 bg-amber-500' : 'border-slate-300'}`}>
                                {details.invoiceTemplate === 'custom' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <Button onClick={handleSaveDetails} className="px-8 !py-3 !text-base shadow-lg shadow-accent/20">Save Customization</Button>
                </div>
            </div>
          </div>
        )}

        {/* Bank Accounts Tab */}
        {activeTab === 'bank' && (
          <div className="space-y-8 animate-fade-in">
            <div className="glass-panel p-8 rounded-2xl">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700/50 pb-4">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-light-text">Bank Accounts</h2>
                    <Button onClick={() => handleOpenBankModal()} className="text-sm px-4 py-2">+ Add Account</Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeCompany.bankAccounts.map(account => (
                        <div key={account.id} className={`p-6 rounded-2xl border-2 transition-all ${account.isDefault ? 'border-accent bg-accent/5 dark:bg-accent/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-slate-800 dark:text-white text-lg">{account.bankName}</h3>
                                {account.isDefault && <span className="text-[10px] font-bold uppercase tracking-wider bg-accent text-white px-2 py-1 rounded-full">Default</span>}
                            </div>
                            <div className="space-y-1 mb-6">
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-mono tracking-wider">{account.accountNumber}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">IFSC: <span className="font-mono">{account.ifsc}</span></p>
                            </div>
                            
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                                {!account.isDefault && (
                                    <button onClick={() => handleSetDefault(account.id)} className="text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">Make Default</button>
                                )}
                                <button onClick={() => handleOpenBankModal(account)} className="text-sm font-semibold text-accent hover:text-accent-hover dark:text-indigo-400 transition-colors">Edit</button>
                                <button onClick={() => handleDeleteBankAccount(account.id)} className="text-sm font-semibold text-red-500 hover:text-red-700 transition-colors">Delete</button>
                            </div>
                        </div>
                    ))}
                    
                    {activeCompany.bankAccounts.length === 0 && (
                        <div className="col-span-full text-center py-16 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                            <Building className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500 dark:text-slate-400 mb-6">No bank accounts added yet. Add one to receive payments.</p>
                            <Button onClick={() => handleOpenBankModal()} variant="secondary">Add First Account</Button>
                        </div>
                    )}
                </div>
                
                {bankSuccessMessage && <div className="mt-6 text-center text-sm font-bold text-green-600 bg-green-50 dark:bg-green-900/20 py-3 rounded-lg animate-fade-in">{bankSuccessMessage}</div>}
            </div>
          </div>
        )}

        {/* Billing & Usage Tab */}
        {activeTab === 'billing' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Current Plan */}
                <div className="glass-panel p-8 rounded-2xl">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-light-text mb-6 border-b border-slate-100 dark:border-slate-700/50 pb-4">Current Plan</h2>
                    
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                                <Zap className="w-6 h-6 text-accent" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white capitalize">{activeCompany.subscription?.plan || 'Free'} Plan</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {activeCompany.subscription?.status === 'active' ? 'Active Subscription' : 'Basic Features'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {activeCompany.subscription && activeCompany.subscription.plan !== 'free' && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-100 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-500 dark:text-slate-400">Renews On</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    {new Date(activeCompany.subscription.currentPeriodEnd).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <Button className="w-full !py-3" onClick={() => window.dispatchEvent(new CustomEvent('openSubscriptionPrompt'))}>
                            Upgrade Plan
                        </Button>
                        {activeCompany.subscription && activeCompany.subscription.plan !== 'free' && (
                            <Button variant="secondary" className="w-full !py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900/30" onClick={() => {
                                if (window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing cycle.')) {
                                    alert('Subscription cancellation requested. Please contact support to finalize.');
                                    trackEvent('cancel_subscription_requested', { companyId: activeCompany.id });
                                }
                            }}>
                                Cancel Subscription
                            </Button>
                        )}
                    </div>
                </div>

                {/* Usage */}
                <div className="glass-panel p-8 rounded-2xl">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-light-text mb-6 border-b border-slate-100 dark:border-slate-700/50 pb-4">Invoice Usage</h2>
                    
                    {(() => {
                        const sub = activeCompany.subscription || { plan: 'free', invoiceCount: 0, invoiceLimit: 10, addonInvoices: 0 };
                        const totalLimit = sub.invoiceLimit + (sub.addonInvoices || 0);
                        const used = sub.invoiceCount;
                        const remaining = Math.max(0, totalLimit - used);
                        const percentUsed = Math.min(100, (used / totalLimit) * 100);
                        
                        return (
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <span className="text-3xl font-bold text-slate-900 dark:text-white">{remaining}</span>
                                        <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">invoices left</span>
                                    </div>
                                    <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                        {used} / {totalLimit} used
                                    </div>
                                </div>
                                
                                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-6">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-500 ${percentUsed > 90 ? 'bg-red-500' : percentUsed > 75 ? 'bg-amber-500' : 'bg-accent'}`}
                                        style={{ width: `${percentUsed}%` }}
                                    ></div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-100 dark:border-slate-700">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Need more invoices?</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">You can buy add-on packs that never expire and stack with your monthly limit.</p>
                                    <Button variant="secondary" className="w-full text-sm" onClick={() => window.dispatchEvent(new CustomEvent('openSubscriptionPrompt'))}>
                                        Buy Add-on Invoices
                                    </Button>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={isBankModalOpen} onClose={() => setIsBankModalOpen(false)} title={'id' in editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}>
          <BankAccountForm account={editingAccount} setAccount={setEditingAccount} errors={bankErrors} />
          <div className="p-6 pt-0 flex justify-end gap-4">
              <Button variant="secondary" onClick={() => setIsBankModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveBankAccount}>Save Account</Button>
          </div>
      </Modal>

      <Modal isOpen={isBankDeleteConfirmOpen} onClose={() => setIsBankDeleteConfirmOpen(false)} title="Delete Bank Account">
          <div className="p-6">
            <p className="text-slate-600 dark:text-medium-text mb-6">Are you sure you want to delete this bank account? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <Button variant="secondary" onClick={() => setIsBankDeleteConfirmOpen(false)}>Cancel</Button>
              <Button onClick={confirmDeleteBankAccount} className="bg-red-600 hover:bg-red-700 focus:ring-red-500">Confirm Delete</Button>
            </div>
          </div>
      </Modal>

      <TemplatePreviewModal 
          isOpen={previewTemplate !== null} 
          onClose={() => setPreviewTemplate(null)} 
          template={previewTemplate} 
          onSelectTemplate={(template, config) => {
              setDetails(prev => ({ 
                  ...prev, 
                  invoiceTemplate: template as any,
                  brandColor: config.brandColor,
                  showShipping: config.showShipping,
                  showHsn: config.showHsn,
                  showDiscount: config.showDiscount,
                  showTerms: config.showTerms,
                  showQr: config.showQr,
                  logoPosition: config.logoPosition
              }));
              setPreviewTemplate(null);
          }}
          isPremium={true}
      />

    </div>
  );
};

export default Settings;
