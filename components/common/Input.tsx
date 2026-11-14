
import React, { useId } from 'react';
import { AlertCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, id, error, className = '', ...props }) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const errorClasses = "border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20";
  const defaultClasses = "bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl shadow-xs placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none text-sm px-3.5 py-2.5 transition-colors duration-150 border hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15";

  return (
    <div className="w-full group">
      {label && (
        <label 
          htmlFor={inputId} 
          className={`block text-xs font-medium mb-1.5 transition-colors ${error ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-700 dark:text-zinc-300'}`}
        >
          {label} {props.required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={`w-full ${error ? errorClasses : defaultClasses} ${props.disabled ? 'opacity-60 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800' : ''} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
