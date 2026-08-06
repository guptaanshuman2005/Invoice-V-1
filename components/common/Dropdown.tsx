import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  className?: string;
  triggerClassName?: string;
  matchWidth?: boolean;
  toggleOnClick?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({ 
  trigger, children, isOpen, onClose, onOpen, 
  className = '', triggerClassName = 'inline-block', 
  matchWidth = false, toggleOnClick = true 
}) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const updateCoords = () => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 4,
        left: matchWidth ? rect.left + window.scrollX : rect.left + window.scrollX + (rect.width / 2),
        width: rect.width
      });
    }
  };

  useEffect(() => {
    updateCoords();
  }, [isOpen, matchWidth]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [isOpen, onClose]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (toggleOnClick) {
      isOpen ? onClose() : onOpen();
    } else if (!isOpen) {
      onOpen();
    }
  };

  return (
    <>
      <div ref={triggerRef} onClick={handleTriggerClick} className={triggerClassName}>
        {trigger}
      </div>
      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className={`absolute z-[9999] bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${matchWidth ? '' : '-translate-x-1/2'} ${className}`}
          style={{ top: coords.top, left: coords.left, ...(matchWidth ? { width: coords.width } : {}) }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>,
        document.body
      )}
    </>
  );
};
