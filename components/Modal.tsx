import React from 'react';
import { Icon } from '@iconify/react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

export default function Modal({ isOpen, onClose, title, children, showCloseButton = true }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-primary-dark border border-primary-blue rounded-lg p-6 max-w-md w-full mx-4 relative">
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-primary-blue text-white w-8 h-8 rounded flex items-center justify-center hover:opacity-90"
          >
            <Icon icon="mdi:close" className="text-xl" />
          </button>
        )}
        {title && (
          <h2 className="text-2xl font-bold mb-4 text-white">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
