import React, { useState } from 'react';
import { NAV_ITEMS } from '../constants';
import type { Company, User } from '../types';
import { Sun, Moon, LogOut, ChevronDown, X, Check, User as UserIcon, Receipt, PlusCircle, Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

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

const SHORTCUT_MAP: Record<string, string> = {
  Dashboard: 'Alt+D',
  NewInvoice: 'Alt+N',
  Invoices: 'Alt+I',
  Clients: 'Alt+C',
  Inventory: 'Alt+K'
};

const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, setActiveView, theme, setTheme, 
  userCompanies, activeCompany, onSwitchCompany, onAddCompany, onLogout, onOpenProfile,
  isOpen, onClose, currentUser, isCollapsed, onToggleCollapse
}) => {
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const { isInstallable, isInstalled, installApp } = usePWAInstall();

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
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 md:hidden transition-all duration-300" 
          onClick={onClose}
        ></div>
      )}
      
      <aside className={`
        fixed inset-y-0 left-0 z-50 glass-panel flex flex-col border-r border-slate-200/50 dark:border-slate-800/50 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) md:relative md:translate-x-0 shadow-2xl md:shadow-none bg-slate-50/90 dark:bg-secondary-dark/95 backdrop-blur-lg
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCollapsed ? 'w-20' : 'w-72'}
      `}>
        {/* Brand Area */}
        <div className={`p-5 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
             <div className="flex items-center gap-3 overflow-hidden">
                <img 
                    src="/icons/icon-192.png" 
                    alt="InvoiceProIn Logo" 
                    className="w-9 h-9 rounded-xl shadow-xs shrink-0 object-contain" 
                />
                {!isCollapsed && (
                    <div className="text-left">
                        <div className="text-base font-bold tracking-tight text-zinc-900 dark:text-white leading-none flex items-center">
                          InvoicePro<span className="text-indigo-600 dark:text-indigo-400 font-bold ml-0.5">In</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium tracking-wide mt-1">Cloud Billing • India</div>
                    </div>
                )}
             </div>
             {!isCollapsed && <button onClick={onClose} className="md:hidden text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors"><X className="w-5 h-5" /></button>}
        </div>

        {/* Collapse Toggle (Desktop) */}
        <button 
            onClick={onToggleCollapse}
            className="hidden md:flex absolute -right-3 top-7 w-6 h-6 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full items-center justify-center text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-xs z-50"
        >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-90'}`} />
        </button>

        {/* Company Quick Switcher Widget */}
        {activeCompany && !isCollapsed && (
          <div className="px-3 mb-3 relative z-30">
            <button 
              onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
              className="w-full flex items-center justify-between gap-3 p-2.5 bg-white dark:bg-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 rounded-xl transition-colors shadow-xs"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {activeCompany.details.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="text-left overflow-hidden">
                  <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{activeCompany.details.name}</div>
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500">Active Workspace</div>
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${isCompanyDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCompanyDropdownOpen && (
              <div className="absolute top-full left-3 right-3 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg overflow-hidden z-30">
                <div className="p-1.5 space-y-0.5">
                  {userCompanies.map(comp => (
                    <button
                      key={comp.id}
                      onClick={() => {
                        onSwitchCompany(comp.id);
                        setIsCompanyDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left text-xs transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${comp.id === activeCompany.id ? 'bg-zinc-100 dark:bg-zinc-800/80 font-semibold text-indigo-600 dark:text-indigo-400' : 'text-zinc-700 dark:text-zinc-300'}`}
                    >
                      <div className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center font-bold text-[9px]">
                        {comp.details.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate">{comp.details.name}</span>
                      {comp.id === activeCompany.id && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ml-auto shrink-0" />}
                    </button>
                  ))}
                  <div className="border-t border-zinc-200 dark:border-zinc-800 my-1"></div>
                  <button
                    onClick={() => {
                      onAddCompany();
                      setIsCompanyDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 font-medium"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create Workspace</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Navigation */}
        <nav className="flex-grow px-3 overflow-y-auto custom-scrollbar py-2">
          {!isCollapsed && <p className="px-3 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Main Menu</p>}
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeView === item.view;
              return (
              <li key={item.name}>
                <button
                  onClick={() => handleViewChange(item.view)}
                  disabled={!activeCompany}
                  title={isCollapsed ? item.name : ''}
                  className={`relative w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                  } ${!activeCompany ? 'opacity-50 cursor-not-allowed' : ''} ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <span className={`shrink-0 ${isActive ? 'text-white' : 'text-zinc-400 dark:text-zinc-500'}`}>
                      {item.icon}
                  </span>
                  {!isCollapsed && <span className="truncate flex-grow">{item.name}</span>}
                  {!isCollapsed && SHORTCUT_MAP[item.view] && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                      isActive 
                        ? 'bg-indigo-700/60 text-indigo-100' 
                        : 'text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800'
                    }`}>
                      {SHORTCUT_MAP[item.view]}
                    </span>
                  )}
                </button>
              </li>
            )})}
          </ul>
        </nav>

        {/* PWA Install Button */}
        {isInstallable && !isInstalled && (
          <div className="px-3 mb-2 shrink-0">
            <button
              onClick={installApp}
              title="Install InvoiceProIn App"
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'gap-2 px-3 py-2'} bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition-colors`}
            >
              <Download className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span className="truncate">Install App</span>}
            </button>
          </div>
        )}

        {/* User Profile & Actions bottom section */}
        <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 shrink-0">
          <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div 
              onClick={onOpenProfile}
              className="flex items-center gap-2.5 cursor-pointer group/profile overflow-hidden"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'G'}
              </div>
              {!isCollapsed && (
                <div className="text-left overflow-hidden">
                  <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate group-hover/profile:text-indigo-600 transition-colors">{currentUser?.name || 'Guest User'}</div>
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">{currentUser?.email || 'Offline Guest'}</div>
                </div>
              )}
            </div>
            
            {!isCollapsed && (
              <div className="flex items-center gap-0.5 shrink-0">
                {/* Theme Toggle button */}
                <button 
                  onClick={toggleTheme}
                  title="Toggle Theme"
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                </button>

                {/* Logout button */}
                <button 
                  onClick={onLogout}
                  title="Log out"
                  className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
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
