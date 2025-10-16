import React from 'react';
import { cn } from '../../lib/utils';

const StatusBadge = ({ status, className, ...props }) => {
  // Estilo exato dos botões do header: font-bold, rounded-xl, text-lg, h-12, py-3
  // Cores: lime-600 background, white text, green-800 hover
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-bold transition-colors duration-200',
        'bg-lime-600 text-white hover:bg-green-800',
        className
      )}
      {...props}
    >
      {status}
    </span>
  );
};

export default StatusBadge; 