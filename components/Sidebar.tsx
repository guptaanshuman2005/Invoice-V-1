import React, { useState } from 'react';
import { NAV_ITEMS } from '../constants';
import type { Company, User } from '../types';
import { Sun, Moon, LogOut, ChevronDown, X, Check, User as UserIcon, Receipt, PlusCircle } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  userCompanies: Company[];
  activeCompany: Company | null;
  onSwitchCompany: (companyId: string) => void;
  onAddCompany: () => void;
  onLogout: () => void;
  onOpenProfile: () => void;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, setActiveView, theme, setTheme, 
  userCompanies, activeCompany, onSwitchCompany, onAddCompany, onLogout, onOpenProfile,
  isOpen, onClose, currentUser, isCollapsed, onToggleCollapse
}) => {
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleViewChange = (view: string) => {
      setActiveView(view);
      if(window.innerWidth < 768) onClose();
  };

  return (
    <>
      {/* Mobile Overlay with Blur */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-45 md:hidden transition-all duration-300" 
          onClick={onClose}
        ></div>
      )}
      
      <aside className={`
        fixed inset-y-0 left-0 z-50 glass-panel flex flex-col border-r border-slate-200/50 dark:border-slate-800/50 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) md:relative md:translate-x-0 shadow-2xl md:shadow-none bg-slate-50/90 dark:bg-secondary-dark/95 backdrop-blur-lg
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCollapsed ? 'w-20' : 'w-72'}
      `}>
        {/* Brand Area */}
        <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
             <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-gradient-to-br from-accent to-indigo-600 text-white p-2.5 rounded-2xl shadow-lg shadow-accent/20 shrink-0 hover:shadow-accent/40 hover:scale-105 active:scale-95 transition-all duration-300">
                    <Receipt className="w-5 h-5" />
                </div>
                {!isCollapsed && (
                    <div className="animate-fade-in text-left">
                        <div className="text-lg font-black tracking-tight text-slate-900 dark:text-white leading-none font-display">InvoicePro</div>
                        <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-widest uppercase mt-1">Cloud Billing</div>
                    </div>
                )}
             </div>
             {!isCollapsed && <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><X className="w-6 h-6" /></button>}
        </div>

        {/* Collapse Toggle (Desktop) */}
        <button 
            onClick={onToggleCollapse}
            className="hidden md:flex absolute -right-3 top-8 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full items-center justify-center text-slate-400 hover:text-accent transition-all shadow-md z-50 hover:scale-110 active:scale-90"
        >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-90'}`} />
        </button>

        {/* Company Quick Switcher Widget */}
        {activeCompany && !isCollapsed && (
          <div className="px-4 mb-4 relative z-30">
            <button 
              onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
              className="w-full flex items-center justify-between gap-3 p-3 bg-white/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/80 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl transition-all duration-200 shadow-sm"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-accent to-indigo-500 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm">
                  {activeCompany.details.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="text-left overflow-hidden">
                  <div className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{activeCompany.details.name}</div>
                  <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">Active Workspace</div>
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isCompanyDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCompanyDropdownOpen && (
              <div className="absolute top-full left-4 right-4 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-fade-in z-30">
                <div className="p-1.5 space-y-1">
                  {userCompanies.map(comp => (
                    <button
                      key={comp.id}
                      onClick={() => {
                        onSwitchCompany(comp.id);
                        setIsCompanyDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${comp.id === activeCompany.id ? 'bg-slate-50 dark:bg-slate-800/60 font-bold text-accent' : 'text-slate-700 dark:text-slate-350'}`}
                    >
                      <div className="w-5 h-5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-650 dark:text-slate-300 flex items-center justify-center font-bold text-[9px]">
                        {comp.details.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate">{comp.details.name}</span>
                      {comp.id === activeCompany.id && <Check className="w-3.5 h-3.5 text-accent ml-auto shrink-0" />}
                    </button>
                  ))}
                  <div className="border-t border-slate-150 dark:border-slate-800 my-1"></div>
                  <button
                    onClick={() => {
                      onAddCompany();
                      setIsCompanyDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left text-xs text-accent hover:bg-accent/5 font-bold"
                  >
                    <PlusCircle className="w-4.5 h-4.5" />
                    <span>Create Workspace</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Navigation */}
        <nav className="flex-grow px-4 overflow-y-auto custom-scrollbar py-4">
          {!isCollapsed && <p className="px-4 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 animate-fade-in">Main Menu</p>}
          <ul className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = activeView === item.view;
              return (
              <li key={item.name}>
                <button
                  onClick={() => handleViewChange(item.view)}
                  disabled={!activeCompany}
                  title={isCollapsed ? item.name : ''}
                  className={`group relative w-full text-left flex items-center gap-3 p-3 rounded-2xl text-sm font-bold transition-all duration-300 ease-out border border-transparent ${
                    isActive
                      ? 'bg-gradient-to-r from-accent to-indigo-600 dark:from-accent dark:to-indigo-500 text-white shadow-[0_8px_20px_-6px_rgba(79,70,229,0.4)] translate-x-1'
                      : 'text-slate-500 hover:bg-white/80 dark:hover:bg-slate-800/40 hover:shadow-sm hover:border-zinc-200/50 dark:hover:border-zinc-800/50 hover:translate-x-1 dark:text-slate-400 dark:hover:text-slate-200'
                  } ${!activeCompany ? 'opacity-50 cursor-not-allowed' : ''} ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  {/* Active/Hover Indicator */}
                  {!isActive && !isCollapsed && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-accent dark:bg-indigo-400 rounded-r-full transition-all duration-300 group-hover:h-1/2 opacity-0 group-hover:opacity-100"></span>
                  )}
                  
                  <span className={`transition-colors relative z-10 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-accent transition-colors'}`}>
                      {item.icon}
                  </span>
                  {!isCollapsed && <span className="relative z-10 truncate animate-fade-in">{item.name}</span>}
                </button>
              </li>
            )})}
          </ul>
        </nav>

        {/* User Profile & Actions bottom section */}
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-100/30 dark:bg-slate-900/20 shrink-0">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div 
              onClick={onOpenProfile}
              className="flex items-center gap-3 cursor-pointer group/profile overflow-hidden"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-accent to-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-accent/15 shrink-0 hover:scale-105 transition-all">
                {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'G'}
              </div>
              {!isCollapsed && (
                <div className="text-left overflow-hidden">
                  <div className="text-xs font-black text-slate-800 dark:text-slate-200 truncate group-hover/profile:text-accent transition-colors">{currentUser?.name || 'Guest User'}</div>
                  <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 truncate">{currentUser?.email || 'Offline Guest'}</div>
                </div>
              )}
            </div>
            
            {!isCollapsed && (
              <div className="flex items-center gap-1 shrink-0">
                {/* Theme Toggle button */}
                <button 
                  onClick={toggleTheme}
                  title="Toggle Theme"
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-xl transition-all"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                </button>

                {/* Logout button */}
                <button 
                  onClick={onLogout}
                  title="Log out"
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
