
import React, { useState, useCallback, useEffect } from 'react';
import type { CompanyDetails } from '../types';
import Input from './common/Input';
import Button from './common/Button';
import { INDIAN_STATES } from '../constants';
import { validateGstin, validatePan, validateEmail, validateRequired, fetchLocationByPincode } from '../utils/validation';
import { Zap, Check, BarChart2, ArrowLeft, Image as ImageIcon } from 'lucide-react';

import Modal from './common/Modal';
import TemplatePreviewModal from './TemplatePreviewModal';
import { supabase } from '../supabase';

interface CompanyManagerProps {
    onAddCompany: (details: CompanyDetails) => void;
    onLogout: () => void;
}

type FormErrors = { [K in keyof Omit<CompanyDetails, 'logo' | 'invoicePrefix' | 'nextInvoiceNumber' | 'signature' | 'website'>]?: string };

const CompanyManager: React.FC<CompanyManagerProps> = ({ onAddCompany, onLogout }) => {
    const [step, setStep] = useState(1);
    const [details, setDetails] = useState<CompanyDetails>({
        name: '', gstin: '', pan: '', phone: '', email: '', website: '',
        address: '', city: '', state: '', zip: '', udyam: '', logo: '', signature: '',
        invoicePrefix: 'INV-', nextInvoiceNumber: 1, invoiceTemplate: 'modern'
    });
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});
    const [logoError, setLogoError] = useState<string | null>(null);
    const [isPincodeLoading, setIsPincodeLoading] = useState(false);
    const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);

    const validateField = useCallback((name: string, value: string): string | null => {
        switch (name) {
            case 'name': return validateRequired(value);
            case 'gstin': return validateGstin(value);
            case 'pan': return validatePan(value);
            case 'email': return validateEmail(value);
            case 'phone': return validateRequired(value);
            case 'address': return validateRequired(value);
            case 'city': return validateRequired(value);
            case 'state': return validateRequired(value);
            case 'zip': return validateRequired(value);
            default: return null;
        }
    }, []);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setDetails(prev => ({ ...prev, [name]: value }));
        // Only validate if it's a field in FormErrors (required ones)
        if (['name', 'gstin', 'pan', 'email', 'phone', 'address', 'city', 'state', 'zip'].includes(name)) {
            const error = validateField(name, value);
            setErrors(prev => ({ ...prev, [name]: error || undefined }));
        }
    }, [validateField]);

    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingSignature, setIsUploadingSignature] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'signature') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) return;
            if (file.size > 2 * 1024 * 1024) return; // 2MB limit

            const isLogo = type === 'logo';
            const setUploading = isLogo ? setIsUploadingLogo : setIsUploadingSignature;
            const setPreview = isLogo ? setLogoPreview : setSignaturePreview;
            
            setUploading(true);
            try {
                // Show local preview immediately
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreview(reader.result as string);
                };
                reader.readAsDataURL(file);

                // Upload to Supabase
                const { uploadFileToSupabase } = await import('../utils/supabaseStorage');
                const path = `${type}s/temp_${Date.now()}_${file.name}`;
                const publicUrl = await uploadFileToSupabase(file, 'company-assets', path);
                
                if (publicUrl) {
                    setDetails(prev => ({ ...prev, [type]: publicUrl }));
                } else {
                    setLogoError(`Failed to upload ${type}.`);
                    setPreview(null); // Revert preview
                }
            } catch (err) {
                console.error(`Error uploading ${type}:`, err);
                setLogoError('An unexpected error occurred.');
                setPreview(null); // Revert preview
            } finally {
                setUploading(false);
            }
        }
    };

    useEffect(() => {
        const pincode = details.zip;
        if (pincode && pincode.length === 6) {
            const timer = setTimeout(async () => {
                setIsPincodeLoading(true);
                const location = await fetchLocationByPincode(pincode);
                if (location) {
                    setDetails(prev => ({ ...prev, city: location.city, state: location.state }));
                    setErrors(prev => ({ ...prev, zip: undefined }));
                } else if (location === null) {
                    setErrors(prev => ({ ...prev, zip: 'Invalid Pincode' }));
                } else {
                    setErrors(prev => ({ ...prev, zip: 'Lookup failed' }));
                }
                setIsPincodeLoading(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [details.zip]);

    const handleNextStep = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: FormErrors = {};
        
        ['name', 'phone', 'address', 'city', 'state', 'zip', 'email'].forEach(key => {
            const value = String(details[key as keyof CompanyDetails] || ''); 
            const error = validateField(key, value);
            if (error) newErrors[key as keyof FormErrors] = error;
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (details.gstin) {
            try {
                const { data: gstinExists, error } = await supabase.rpc('check_gstin_exists', { gstin_to_check: details.gstin });
                if (error) throw error;
                if (gstinExists) {
                    setErrors({ gstin: 'A company with this GSTIN is already registered on another account.' });
                    return;
                }
            } catch (err) {
                console.error('Error validating GSTIN check:', err);
            }
        }

        setStep(2);
    };

    const handleSubmit = () => {
        onAddCompany(details);
    };

    const inputClasses = "w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none text-sm px-4 py-3 transition-all duration-200 ease-in-out border border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-2 focus:ring-accent/20 focus:border-accent";

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-secondary-dark flex items-center justify-center p-4 lg:p-8">
            <div className="max-w-6xl w-full glass-panel rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[800px]">
                
                {/* Left Side - Expanded & Richer */}
                <div className="lg:w-2/5 bg-slate-900 text-white flex flex-col justify-between relative overflow-hidden p-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
                    
                    <div className="relative z-10 space-y-8">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-white/10 p-2 rounded-lg backdrop-blur-md">
                                    <Zap className="h-8 w-8 text-accent" strokeWidth={2} />
                                </div>
                                <span className="text-xl font-bold tracking-tight">InvoicePro</span>
                            </div>
                            <h1 className="text-4xl font-extrabold mb-4 leading-tight">Setup your <br/>workspace</h1>
                            <p className="text-slate-300 text-lg leading-relaxed">
                                You're moments away from professional invoicing. Configure your company profile to automate tax calculations and branding.
                            </p>
                        </div>

                        <div className="space-y-5">
                             <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="p-2 bg-accent/20 rounded-lg text-accent-hover"><Check className="w-5 h-5" strokeWidth={2} /></div>
                                <div>
                                    <h3 className="font-semibold">Unlimited Invoices</h3>
                                    <p className="text-sm text-slate-400">Generate GST-compliant invoices without limits.</p>
                                </div>
                             </div>
                             <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="p-2 bg-accent/20 rounded-lg text-accent-hover"><BarChart2 className="w-5 h-5" strokeWidth={2} /></div>
                                <div>
                                    <h3 className="font-semibold">Analytics Dashboard</h3>
                                    <p className="text-sm text-slate-400">Track revenue, outstanding payments, and more.</p>
                                </div>
                             </div>
                        </div>
                    </div>

                    <div className="relative z-10 mt-12 pt-8 border-t border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900"></div>
                                <div className="w-8 h-8 rounded-full bg-slate-600 border-2 border-slate-900"></div>
                                <div className="w-8 h-8 rounded-full bg-slate-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold">+2k</div>
                            </div>
                            <p className="text-xs font-medium text-slate-400">Trusted by 2,000+ Businesses</p>
                        </div>
                        <button onClick={onLogout} className="text-sm text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
                            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
                            Back to Login
                        </button>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="lg:w-3/5 p-8 lg:p-12 overflow-y-auto glass-panel dark:bg-transparent">
                    <div className="max-w-2xl mx-auto">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {step === 1 ? 'Company Profile' : 'Choose Invoice Format'}
                            </h3>
                            <span className="text-xs font-semibold text-slate-500 bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full">Step {step} of 2</span>
                        </div>

                        {step === 1 ? (
                        <form onSubmit={handleNextStep} className="space-y-8">
                            
                            {/* Logo Section */}
                            <div className="flex items-start gap-6">
                                <div className="flex-shrink-0">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Company Logo</label>
                                    <div className="relative group w-32 h-32 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden hover:border-accent hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all cursor-pointer">
                                        {isUploadingLogo ? (
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
                                        ) : logoPreview ? (
                                            <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <div className="text-center p-4">
                                                <ImageIcon className="w-8 h-8 mx-auto text-slate-400 mb-2" strokeWidth={1.5} />
                                                <span className="text-xs text-slate-500 font-medium">Upload Logo</span>
                                            </div>
                                        )}
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'logo')} accept="image/*" disabled={isUploadingLogo} />
                                    </div>
                                </div>
                                <div className="flex-grow pt-8">
                                    <Input label="Company Name" name="name" value={details.name} onChange={handleChange} required error={errors.name} placeholder="e.g. Acme Corp" />
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800/50">
                                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Contact Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Phone Number" name="phone" type="tel" value={details.phone} onChange={handleChange} required error={errors.phone} placeholder="e.g. 98765 43210" />
                                    <Input label="Email Address" name="email" type="email" value={details.email} onChange={handleChange} error={errors.email} placeholder="e.g. contact@acme.com" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Website" name="website" value={details.website || ''} onChange={handleChange} placeholder="https://www.acme.com" />
                                    <Input label="GSTIN" name="gstin" value={details.gstin} onChange={handleChange} error={errors.gstin} placeholder="e.g. 27AAAAA0000A1Z5" />
                                </div>
                            </div>

                            {/* Address Details */}
                            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800/50">
                                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Location</h4>
                                <Input label="Street Address" name="address" value={details.address} onChange={handleChange} required error={errors.address} placeholder="e.g. 123 Business Park, Main Road" />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="relative">
                                        <Input label="ZIP Code" name="zip" value={details.zip} onChange={handleChange} required maxLength={6} error={errors.zip} placeholder="e.g. 400001" />
                                        {isPincodeLoading && <div className="absolute top-9 right-3 h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>}
                                    </div>
                                    <Input label="City" name="city" value={details.city} onChange={handleChange} required error={errors.city} placeholder="e.g. Mumbai" />
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">State</label>
                                        <select name="state" value={details.state} onChange={handleChange} className={inputClasses}>
                                            <option value="">Select State</option>
                                            {INDIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                                        </select>
                                        {errors.state && <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{errors.state}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Signature Section */}
                            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800/50">
                                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Authentication</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                    <div>
                                        <Input label="PAN" name="pan" value={details.pan} onChange={handleChange} error={errors.pan} placeholder="e.g. ABCDE1234F" />
                                        <div className="mt-4">
                                            <Input label="UDYAM Registration" name="udyam" value={details.udyam} onChange={handleChange} placeholder="Optional" />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Authorized Signature</label>
                                        <div className="relative group w-full h-32 bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden hover:border-accent hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all cursor-pointer">
                                            {isUploadingSignature ? (
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
                                            ) : signaturePreview ? (
                                                <img src={signaturePreview} alt="Signature" className="w-full h-full object-contain p-2" />
                                            ) : (
                                                <div className="text-center p-4">
                                                    <span className="text-xs text-slate-500 font-medium">Upload Signature Image</span>
                                                    <p className="text-[10px] text-slate-400 mt-1">For digital invoices</p>
                                                </div>
                                            )}
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'signature')} accept="image/*" disabled={isUploadingSignature} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-6">
                                <Button type="submit" className="w-full !py-4 !text-lg shadow-xl shadow-accent/20 hover:shadow-accent/30 transition-all transform hover:-translate-y-0.5">Next Step</Button>
                            </div>
                        </form>
                        ) : (
                        <div className="space-y-8 animate-fade-in">
                            <p className="text-slate-600 dark:text-slate-400">Select a template for your invoices. You can change this later in settings.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                        {details.invoiceTemplate === 'modern' && <Check className="w-5 h-5 text-accent" />}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Clean, professional, default look.</p>
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
                                        {details.invoiceTemplate === 'classic' && <Check className="w-5 h-5 text-accent" />}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Traditional, ink-saver, B&W.</p>
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
                                        {details.invoiceTemplate === 'minimal' && <Check className="w-5 h-5 text-accent" />}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Lots of whitespace, elegant.</p>
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
                                        {details.invoiceTemplate === 'tally' && <Check className="w-5 h-5 text-accent" />}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Spreadsheet style borders, structured tax details.</p>
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
                                                <Zap className="w-5 h-5 text-amber-500" />
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
                                        <h4 className="font-bold text-slate-900 dark:text-white">Custom Format</h4>
                                        {details.invoiceTemplate === 'custom' && <Check className="w-5 h-5 text-amber-500" />}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Drag & drop builder, custom colors, remove branding.</p>
                                </div>
                            </div>

                            <div className="pt-6 flex gap-4">
                                <Button type="button" variant="secondary" onClick={() => setStep(1)} className="w-1/3 !py-4 !text-lg">Back</Button>
                                <Button type="button" onClick={handleSubmit} className="w-2/3 !py-4 !text-lg shadow-xl shadow-accent/20 hover:shadow-accent/30 transition-all transform hover:-translate-y-0.5">Complete Setup</Button>
                            </div>
                        </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Template Preview Modal */}
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

export default CompanyManager;
