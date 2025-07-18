import React from 'react';
import ReactDOM from 'react-dom';

export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null;
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-fade-in flex flex-col items-center">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          onClick={() => onOpenChange(false)}
          aria-label="Fechar"
        >
          ×
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function DialogContent({ className = '', children }) {
  return <div className={`w-full ${className}`}>{children}</div>;
}

export function DialogHeader({ children }) {
  return <div className="mb-6 text-center">{children}</div>;
}

export function DialogTitle({ children }) {
  return <h2 className="text-2xl font-bold mb-2 text-lime-800">{children}</h2>;
}

export function DialogDescription({ children }) {
  return <p className="text-gray-600 text-base mb-4">{children}</p>;
} 