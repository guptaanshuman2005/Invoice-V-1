
import React, { useEffect, useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  allowMaximize?: boolean;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, allowMaximize = true }) => {
  const [show, setShow] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      document.body.style.overflow = 'hidden';
    } else {
      setTimeout(() => setShow(false), 200); // Wait for animation
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Reset maximize on close
  useEffect(() => {
    if (!isOpen) {
      setIsMaximized(false);
    }
  }, [isOpen]);

  if (!show && !isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex justify-center items-center p-2 sm:p-4 md:p-6 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`glass-panel rounded-2xl shadow-2xl flex flex-col transform transition-all duration-300 ${
        isMaximized ? 'w-full max-w-[98vw] h-[95vh] max-h-[95vh]' : 'w-full max-w-4xl max-h-[90vh]'
      } ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        <div className="sticky top-0 bg-white/70 dark:bg-primary-dark/70 backdrop-blur-md p-4 sm:p-5 border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center z-10 rounded-t-2xl shrink-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate mr-4">{title}</h2>
          <div className="flex items-center gap-1.5 shrink-0">
            {allowMaximize && (
              <button 
                onClick={() => setIsMaximized(!isMaximized)} 
                title={isMaximized ? "Restore window size" : "Maximize window"}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                {isMaximized ? <Minimize2 className="h-4 w-4" strokeWidth={2} /> : <Maximize2 className="h-4 w-4" strokeWidth={2} />}
              </button>
            )}
            <button 
              onClick={onClose} 
              title="Close"
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
