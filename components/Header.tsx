import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import Button from './Button';
import { useWallet, truncateAddress } from '../context/WalletContext';

interface HeaderProps {
  energy?: number;
  currency?: number;
  slots?: { used: number; total: number };
  /** Opens wallet connect modal (e.g. for "Connect" or "Switch wallet") */
  onConnectWallet?: () => void;
  /** Opens wallet modal for switching wallet; if not set, falls back to onConnectWallet */
  onSwitchWallet?: () => void;
  showWalletButton?: boolean;
}

/** Format currency with M (millions) and B (billions). Uses 3 decimals then trims trailing zeros so 499,997,240 → 499.997M (not 500.00M). */
function formatCurrencyCompact(value: number): string {
  if (value >= 1e9) {
    const n = (value / 1e9).toFixed(3).replace(/\.?0+$/, '');
    return `${n}B`;
  }
  if (value >= 1e6) {
    const n = (value / 1e6).toFixed(3).replace(/\.?0+$/, '');
    return `${n}M`;
  }
  return value.toLocaleString();
}

export default function Header({
  energy = 75,
  currency = 1236,
  slots = { used: 4, total: 6 },
  onConnectWallet,
  onSwitchWallet,
  showWalletButton = true,
}: HeaderProps) {
  const [showEnergyTooltip, setShowEnergyTooltip] = useState(false);
  const [showCurrencyTooltip, setShowCurrencyTooltip] = useState(false);
  const [showSlotsTooltip, setShowSlotsTooltip] = useState(false);
  const [showWalletTooltip, setShowWalletTooltip] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { address, disconnect } = useWallet();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowWalletDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-30">
      <div className="flex items-center justify-between px-4 py-6">
        <div className="flex items-center justify-center">

          <Link
            href="/dashboard"
            className="bg-[#0B26F0] text-white w-16 h-12 rounded flex items-center justify-center mb-2"
          >
            <Icon icon="mdi:menu" className="text-5xl" />
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {/* Energy Display */}
          <div
            className="relative group cursor-pointer"
            onMouseEnter={() => setShowEnergyTooltip(true)}
            onMouseLeave={() => setShowEnergyTooltip(false)}
          >
            {/* Blue Rectangle Overlay */}
            <div className="relative h-12 w-[183px]">
              <Image src="/images/header/blue-retangle.svg" alt="Energy Border" fill className="object-contain object-left" sizes="183px" priority />
              {/* Black Rectangle Background */}
              <div className="absolute top-[-2px] left-[-4px] w-full h-full">
                <Image src="/images/header/black-retangle.svg" alt="Energy Background" fill className="object-contain object-left" sizes="183px" priority />
                {/* Content */}
                <div className="absolute inset-0 flex items-center gap-2 px-3 pt-2">
                  {/* Lightning Icon */}
                  <div className="bg-[#2781EA] rounded flex items-center justify-center w-[26px] h-[26px] flex-shrink-0">
                    <Icon icon="si:lightning-fill" width="24" height="24" className="text-white" />
                  </div>
                  <div className="flex flex-col items-start justify-end">
                    {/* Energy Text */}
                    <span className="text-[#53A2FF] font-anton-sc font-medium text-sm uppercase text-left">
                      ENERGY
                    </span>
                    {/* Progress Bar - 5 segments */}
                    <div className="flex items-center gap-1 ml-auto">
                      {Array.from({ length: 5 }).map((_, index) => {
                        // Each segment represents 20% of energy
                        const segmentStart = index * 20;
                        const segmentEnd = (index + 1) * 20;

                        // Calculate if this segment is before, current, or after the energy level
                        let fillPercentage = 0;

                        if (energy >= segmentEnd) {
                          // Segment is completely filled
                          fillPercentage = 100;
                        } else if (energy > segmentStart) {
                          // Segment is partially filled
                          const energyInSegment = energy - segmentStart;
                          fillPercentage = (energyInSegment / 20) * 100;
                        } else {
                          // Segment is empty
                          fillPercentage = 0;
                        }

                        return (
                          <div
                            key={index}
                            className="w-[18px] h-1.5 bg-gray-700 relative overflow-hidden"
                          >
                            <div
                              className="absolute inset-0 bg-[#2781EA] transition-all"
                              style={{ width: `${fillPercentage}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Energy Tooltip */}
            <div className={showEnergyTooltip ? 'contents' : 'hidden'}>
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[2px] z-50 w-[260px]">
                <div
                  className="relative w-full aspect-[260/100] bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: 'url(/images/tooltips/blue-up.svg)' }}
                  aria-hidden
                >
                  <div className="absolute inset-0 flex items-center px-5 -mt-3">
                    <p className="text-white/90 text-sm text-left leading-snug">
                      The amount of energy the character has before need to refill
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Currency Display */}
          <div
            className="relative flex items-center cursor-pointer"
            onMouseEnter={() => setShowCurrencyTooltip(true)}
            onMouseLeave={() => setShowCurrencyTooltip(false)}
          >
            {/* Dollar Circle Icon */}
            <div className="relative z-10 w-12 h-12">
              <Image src="/images/header/dolla-circle.svg" alt="Dollar" fill className="object-contain" sizes="44px" priority />
              <div className="absolute inset-0 flex items-center justify-center">
                <Image src="/images/icons/dollar.svg" alt="" width={12} height={12} className="object-contain" aria-hidden priority />
              </div>
            </div>
            {/* Amount Rectangle */}
            <div className="relative -ml-2.5 h-[34px] w-[96px]">
              <Image src="/images/header/amount-retangle.svg" alt="Amount Background" fill className="object-contain object-left" sizes="80px" priority />
              <div className="absolute inset-0 flex items-center justify-center pl-4 pr-2">
                <span className="text-white font-medium text-lg font-anton-sc text-left">
                  {formatCurrencyCompact(currency)}
                </span>
              </div>
            </div>

            {/* Currency Tooltip */}
            <div className={showCurrencyTooltip ? 'contents' : 'hidden'}>
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[1px] z-50 w-[265px]">
                <div
                  className="relative w-full aspect-[265/100] bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: 'url(/images/tooltips/pink-up.svg)' }}
                  aria-hidden
                >
                  <div className="absolute inset-0 flex items-center px-5 -mt-3">
                    <p className="text-white text-sm text-left leading-snug">
                      The total coins the character has for in game purchases
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Slots Display */}
          <div
            className="relative flex items-center cursor-pointer"
            onMouseEnter={() => setShowSlotsTooltip(true)}
            onMouseLeave={() => setShowSlotsTooltip(false)}
          >
            {/* User Rectangle Icon */}
            <div className="relative z-10 w-12 h-12">
              <Image src="/images/header/user-retangle.svg" alt="User" fill className="object-contain" sizes="44px" priority />
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon icon="heroicons:user-16-solid" width="24" height="24" className="text-white" />
              </div>
            </div>
            {/* Amount Rectangle */}
            <div className="relative -ml-2.5 h-[34px] w-[96px]">
              <Image src="/images/header/amount-retangle.svg" alt="Slots Background" fill className="object-contain object-left" sizes="80px" priority />
              <div className="absolute inset-0 flex items-center justify-center pl-4 pr-2">
                <span className="text-white font-medium text-lg font-anton-sc text-left">
                  {slots.used}/{slots.total}
                </span>
              </div>
            </div>

            {/* Slots Tooltip */}
            <div className={showSlotsTooltip ? 'contents' : 'hidden'}>
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[1px] z-50 w-[265px]">
                <div
                  className="relative w-full aspect-[265/100] bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: 'url(/images/tooltips/pink-up.svg)' }}
                  aria-hidden
                >
                  <div className="absolute inset-0 flex items-center px-5 -mt-3">
                    <p className="text-white text-sm text-left leading-snug">
                      The number of cards possessed by the character
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {showWalletButton && (
            <div className="relative" ref={dropdownRef}>
              {address ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowWalletDropdown((v) => !v)}
                    className="relative flex items-center justify-center min-w-[160px] h-[34px]"
                    onMouseEnter={() => setShowWalletTooltip(true)}
                    onMouseLeave={() => setShowWalletTooltip(false)}
                  >
                    <Image
                      src="/images/header/connect-retangle.svg"
                      alt="Wallet"
                      fill
                      className="object-contain"
                      sizes="100px"
                      priority
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[#FF5B9E] text-nowrap font-lilita-one font-medium text-sm uppercase">
                        {truncateAddress(address, 4, 2)}
                      </span>
                    </div>
                  </button>
                  {showWalletDropdown && (
                    <div className="absolute right-0 top-full mt-1 z-50 min-w-[210px] rounded-xl bg-[#1A1A2EEA] shadow-xl overflow-hidden">
                      <button
                        type="button"
                        className="w-full px-4 py-3 text-left text-white text-lg hover:bg-[#2D2D44] flex items-center justify-center gap-2"
                        onClick={() => {
                          setShowWalletDropdown(false);
                          const openModal = onSwitchWallet ?? onConnectWallet;
                          if (openModal) {
                            requestAnimationFrame(() => openModal());
                          }
                        }}
                      >
                        <Icon icon="mdi:swap-horizontal" width={28} height={28} />
                        Switch wallet
                      </button>
                      <button
                        type="button"
                        className="w-full px-4 py-3 text-left text-white text-lg hover:bg-[#2D2D44] flex items-center justify-center gap-2"
                        onClick={() => { setShowWalletDropdown(false); disconnect(); }}
                      >
                        <Icon icon="mdi:logout" width={28} height={28} />
                        Disconnect
                      </button>
                    </div>
                  )}
                  <div className={showWalletTooltip && !showWalletDropdown ? 'contents' : 'hidden'}>
                    <div className="absolute left-[10%] -translate-x-1/2 top-full mt-[1px] z-50 w-[210px] pointer-events-none">
                      <div
                        className="relative w-full aspect-[210/80] bg-contain bg-center bg-no-repeat"
                        style={{ backgroundImage: 'url(/images/tooltips/pink-up.svg)' }}
                        aria-hidden
                      >
                        <div className="absolute inset-0 flex items-center px-5 -mt-3">
                          <p className="text-white text-sm text-left leading-snug">Switch wallet or disconnect</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <button
                  onClick={onConnectWallet}
                  className="relative h-[34px] min-w-[100px]"
                  onMouseEnter={() => setShowWalletTooltip(true)}
                  onMouseLeave={() => setShowWalletTooltip(false)}
                >
                  <Image
                    src="/images/header/connect-retangle.svg"
                    alt="Connect Wallet"
                    fill
                    className="object-contain"
                    sizes="100px"
                    priority
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[#FF5B9E] text-nowrap font-lilita-one font-bold text-sm uppercase">
                      CONNECT WALLET
                    </span>
                  </div>
                  <div className={showWalletTooltip ? 'contents' : 'hidden'}>
                    <div className="absolute left-[20px] -translate-x-1/2 top-full mt-[1px] z-50 w-[210px]">
                      <div
                        className="relative w-full aspect-[210/80] bg-contain bg-center bg-no-repeat"
                        style={{ backgroundImage: 'url(/images/tooltips/pink-up.svg)' }}
                        aria-hidden
                      >
                        <div className="absolute inset-0 flex items-center px-5 -mt-3">
                          <p className="text-white text-sm text-left leading-snug">Connect your wallet to the game</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
