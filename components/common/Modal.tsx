import React, { useEffect, useState, useId } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  allowMaximize?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  allowMaximize = true,
  size = 'md' 
}) => {
  const [show, setShow] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [pressedBackdrop, setPressedBackdrop] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (isOpen) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Escape key handler for accessible platform dismissal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset maximize state on close
  useEffect(() => {
    if (!isOpen) {
      setIsMaximized(false);
      setPressedBackdrop(false);
    }
  }, [isOpen]);

  if (!show && !isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={`fixed inset-0 z-50 flex justify-center items-center p-2 sm:p-4 md:p-6 transition-opacity duration-200 overscroll-contain ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      {/* Backdrop with safe light-dismiss verification */}
      <div 
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xs overscroll-contain"
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) setPressedBackdrop(true);
        }}
        onPointerUp={(e) => {
          if (pressedBackdrop && e.target === e.currentTarget) {
            onClose();
          }
          setPressedBackdrop(false);
        }}
      />

      <div 
        className={`glass-panel rounded-2xl shadow-xl flex flex-col transform transition-all duration-200 border border-zinc-200 dark:border-zinc-800 overscroll-contain z-10 w-full ${
          isMaximized 
            ? 'max-w-[98vw] h-[95vh] max-h-[95vh]' 
            : `${sizeClasses[size]} max-h-[90vh]`
        } ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-2'}`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-[#121316] px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center z-10 rounded-t-2xl shrink-0">
          <h2 id={titleId} className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight truncate mr-4">
            {title}
          </h2>
          <div className="flex items-center gap-1 shrink-0">
            {allowMaximize && (
              <button 
                type="button"
                onClick={() => setIsMaximized(!isMaximized)} 
                title={isMaximized ? "Restore window size" : "Maximize window"}
                aria-label={isMaximized ? "Restore window size" : "Maximize window"}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                {isMaximized ? <Minimize2 className="h-4 w-4" strokeWidth={2} /> : <Maximize2 className="h-4 w-4" strokeWidth={2} />}
              </button>
            )}
            <button 
              type="button"
              onClick={onClose} 
              title="Close modal"
              aria-label="Close dialog"
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div className="overflow-y-auto custom-scrollbar flex-1 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
