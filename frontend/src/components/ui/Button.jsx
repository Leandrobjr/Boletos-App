import React from 'react';

export default function Button({ type = 'button', onClick, disabled, children, ...props }) {
  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}