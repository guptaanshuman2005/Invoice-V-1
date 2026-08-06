
import React from 'react';
import type { Company } from '../../types';

interface CompanyLogoProps {
  company: Company | null;
  size?: "sm" | "md";
}

const CompanyLogo: React.FC<CompanyLogoProps> = ({ company, size = "md" }) => {
  const sizeClasses = size === "sm" ? "w-6 h-6 text-xs" : "w-10 h-10 text-sm";
  
  if (!company) return <div className={`${sizeClasses} rounded bg-slate-200 dark:bg-slate-700`}></div>;

  if (company.details.logo) {
      return <img src={company.details.logo} alt={company.details.name} className={`${sizeClasses} rounded object-contain bg-white border border-slate-200 dark:border-slate-700`} referrerPolicy="no-referrer" />;
  }
  
  const initials = company.details.name.substring(0, 2).toUpperCase();
  return (
      <div className={`${sizeClasses} rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold border border-indigo-200 dark:border-indigo-800`}>
          {initials}
      </div>
  );
};

export default CompanyLogo;
