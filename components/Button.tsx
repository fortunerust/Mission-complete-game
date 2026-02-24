import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  disabled?: boolean;
}

export default function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '',
  disabled = false 
}: ButtonProps) {
  const baseClasses = 'font-bold py-2 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-[#F7237A] text-white hover:opacity-90',
    secondary: 'bg-[#0B26F0] text-white hover:opacity-90',
    outline: 'border-2 border-primary-pink text-primary-pink hover:bg-primary-pink hover:text-white',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
