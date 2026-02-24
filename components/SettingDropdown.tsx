'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';

export interface SettingDropdownOption {
  value: string;
  label: string;
}

interface SettingDropdownProps {
  label: string;
  value: string;
  options: SettingDropdownOption[];
  onSelect?: (value: string) => void;
}

export default function SettingDropdown({ label, value, options, onSelect }: SettingDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const displayLabel = options.find((o) => o.value === value)?.label ?? value;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between rounded-lg bg-[#16162799] border border-[#4C4C4C] pl-8 pr-4 py-2 text-white hover:border-[#5DACFB]/60 transition-colors"
      >
        <span className="font-medium font-anton text-xl">{label}</span>
        <span className="flex items-center gap-2 text-white/80 font-medium font-anton text-xl">
          {displayLabel}
          <Icon
            icon="iconoir:nav-arrow-down"
            width={40}
            height={40}
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg bg-[#161627] border border-[#4C4C4C] shadow-xl overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onSelect?.(opt.value);
                setIsOpen(false);
              }}
              className={`w-full px-6 py-3 text-left font-medium font-anton text-xl transition-colors ${
                opt.value === value
                  ? 'bg-[#3E95E3]/40 text-white'
                  : 'text-white/90 hover:bg-[#2D2D44]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
