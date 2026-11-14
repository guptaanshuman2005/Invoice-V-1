
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
    <div className={`fixed inset-0 z-50 flex justify-center items-center p-2 sm:p-4 md:p-6 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xs" onClick={onClose}></div>
      <div className={`glass-panel rounded-2xl shadow-xl flex flex-col transform transition-all duration-200 border border-zinc-200 dark:border-zinc-800 ${
        isMaximized ? 'w-full max-w-[98vw] h-[95vh] max-h-[95vh]' : 'w-full max-w-4xl max-h-[90vh]'
      } ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-2'}`}>
        <div className="sticky top-0 bg-white dark:bg-[#121316] px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center z-10 rounded-t-2xl shrink-0">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight truncate mr-4">{title}</h2>
          <div className="flex items-center gap-1 shrink-0">
            {allowMaximize && (
              <button 
                onClick={() => setIsMaximized(!isMaximized)} 
                title={isMaximized ? "Restore window size" : "Maximize window"}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                {isMaximized ? <Minimize2 className="h-4 w-4" strokeWidth={2} /> : <Maximize2 className="h-4 w-4" strokeWidth={2} />}
              </button>
            )}
            <button 
              onClick={onClose} 
              title="Close"
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="h-4 w-4" strokeWidth={2} />
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
