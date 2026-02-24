import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'blue' | 'pink' | 'green';
  className?: string;
}

export default function ProgressBar({ 
  value, 
  max = 100, 
  color = 'blue',
  className = '' 
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colorClasses = {
    blue: 'bg-primary-blue',
    pink: 'bg-primary-pink',
    green: 'bg-green-500',
  };

  return (
    <div className={`w-full h-2 bg-gray-700 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full ${colorClasses[color]} transition-all duration-300`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
