import React from 'react';

export interface CharacterItemProps {
  name: string;
  imageSrc: string;
  selected?: boolean;
  onClick?: () => void;
}

export default function CharacterItem({
  name,
  imageSrc,
  selected = false,
  onClick,
}: CharacterItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full aspect-[3/4] min-w-[100px] max-h-[180px] rounded-xl overflow-hidden text-left flex flex-col transition-all duration-200 ${
        selected
          ? 'ring-2 ring-[#3399FF] ring-offset-2 ring-offset-[#0A1128] shadow-[0_0_20px_rgba(51,153,255,0.5)]'
          : 'border border-[#1e3a5f] hover:border-[#2d4a7c]'
      }`}
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/images/characters/character-bg.svg)' }}
      />
      {/* Blue overlay when selected */}
      {selected && (
        <div
          className="absolute inset-0 bg-[#3399FF] opacity-20 pointer-events-none"
          aria-hidden
        />
      )}
      {/* Character image */}
      <div className="relative flex-1 flex items-center justify-center min-h-0 pt-2">
        <img
          src={imageSrc}
          alt={name}
          className={`w-full h-full object-contain object-center ${selected ? 'brightness-110' : ''}`}
        />
      </div>
      {/* Name at bottom */}
      <div className="relative py-2 flex justify-center items-center bg-gradient-to-t from-black/50 to-transparent">
        <span
          className={`font-medium font-anton uppercase text-sm text-white ${
            selected ? 'drop-shadow-[0_0_8px_rgba(51,153,255,0.8)]' : ''
          }`}
        >
          {name}
        </span>
      </div>
    </button>
  );
}
