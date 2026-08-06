
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, id, error, className = '', ...props }) => {
  const errorClasses = "border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900/50";
  // Premium glassmorphic styling, soft borders, focus rings, Outfit font integration for labels
  const defaultClasses = "bg-slate-50/40 dark:bg-slate-800/10 border-slate-200/50 dark:border-slate-800/40 text-slate-900 dark:text-white rounded-2xl shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none text-sm px-4 py-3 transition-all duration-200 ease-in-out border hover:border-slate-300 dark:hover:border-slate-700 focus:ring-4 focus:ring-accent/15 focus:border-accent focus:bg-white dark:focus:bg-slate-950";

  return (
    <div className="w-full group">
      {label && (
        <label 
          htmlFor={id} 
          className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 transition-colors font-display ${error ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}
        >
          {label} {props.required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={id}
        {...props}
        className={`w-full ${error ? errorClasses : defaultClasses} ${props.disabled ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1 animate-slide-in">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
