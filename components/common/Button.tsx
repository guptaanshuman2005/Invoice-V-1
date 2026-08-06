
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClasses = "px-6 py-3 text-xs uppercase tracking-wider font-extrabold rounded-2xl shadow-sm focus:outline-none focus:ring-4 transition-all duration-300 active:scale-95 hover:-translate-y-0.5 font-display";
  const variantClasses = {
    primary: "bg-gradient-to-r from-accent to-indigo-600 text-white hover:from-accent-hover hover:to-indigo-700 focus:ring-accent/25 shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/25",
    secondary: "bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:ring-slate-500/20 hover:border-slate-300 dark:hover:border-slate-600/60 shadow-sm",
  };

  return (
    <button
      {...props}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
