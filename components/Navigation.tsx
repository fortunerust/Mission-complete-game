import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import Button from './Button';
import { gameAPI } from '../lib/api';
import { toastError, toastSuccess } from '../lib/toast';

interface NavigationProps {
  experience: number;
  wallet?: string | null;
  onOpenCardsModal?: () => void;
  onOpenMissionsModal?: () => void;
  onOpenMapsModal?: () => void;
  onClaimComplete?: () => void;
}

function formatTimer(remainingMs: number): string {
  if (remainingMs <= 0) return '00 : 00 : 00';
  const totalSec = Math.floor(remainingMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(' : ');
}

export default function Navigation({ experience, wallet, onOpenCardsModal, onOpenMissionsModal, onOpenMapsModal, onClaimComplete }: NavigationProps) {
  const [showMaxxedTooltip, setShowMaxxedTooltip] = useState(false);
  const [showCardsTooltip, setShowCardsTooltip] = useState(false);
  const [showMissionsTooltip, setShowMissionsTooltip] = useState(false);
  const [showMapsTooltip, setShowMapsTooltip] = useState(false);
  const [totalClaimable, setTotalClaimable] = useState(0);
  const [latestEndTime, setLatestEndTime] = useState<string | null>(null);
  const [hasInProgress, setHasInProgress] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [timerTick, setTimerTick] = useState(Date.now());

  const progress = (experience % 1000) / 10;

  // Fetch claimable info
  useEffect(() => {
    if (!wallet?.trim()) {
      setTotalClaimable(0);
      setLatestEndTime(null);
      setHasInProgress(false);
      return;
    }

    const fetchClaimableInfo = async () => {
      try {
        const res = await gameAPI.getClaimableInfo(wallet.trim());
        setTotalClaimable(res.data.totalClaimable ?? 0);
        setLatestEndTime(res.data.latestEndTime ?? null);
        setHasInProgress(res.data.hasInProgress ?? false);
      } catch (err) {
        console.error('Failed to fetch claimable info:', err);
      }
    };

    fetchClaimableInfo();
    const interval = setInterval(fetchClaimableInfo, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [wallet]);

  // Timer for in-progress missions
  useEffect(() => {
    if (!hasInProgress || !latestEndTime) {
      return;
    }

    const interval = setInterval(() => {
      setTimerTick(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [hasInProgress, latestEndTime]);

  const remainingMs = latestEndTime ? Math.max(0, new Date(latestEndTime).getTime() - timerTick) : 0;
  const canClaim = totalClaimable > 0 && (!hasInProgress || remainingMs <= 0);

  const handleClaim = async () => {
    if (!wallet?.trim() || isClaiming || !canClaim) return;

    setIsClaiming(true);
    try {
      const res = await gameAPI.claimTokens(wallet.trim());
      if (res.data.success) {
        toastSuccess(`Successfully claimed ${res.data.totalClaimed} tokens!`);
        setTotalClaimable(0);
        onClaimComplete?.();
        // Refresh claimable info
        const infoRes = await gameAPI.getClaimableInfo(wallet.trim());
        setTotalClaimable(infoRes.data.totalClaimable ?? 0);
        setLatestEndTime(infoRes.data.latestEndTime ?? null);
        setHasInProgress(infoRes.data.hasInProgress ?? false);
      } else {
        toastError(res.data.error || 'Failed to claim tokens');
      }
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to claim tokens');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <nav className="fixed top-[calc(100%-98px)] left-[35px] right-[35px] z-40">
      <div className="flex justify-between items-center py-2">
        <div className="relative flex items-center gap-8">
          {/* MAXXED Banner */}
          <div
            className="relative flex items-center group cursor-pointer"
            onMouseEnter={() => setShowMaxxedTooltip(true)}
            onMouseLeave={() => setShowMaxxedTooltip(false)}
          >
            {/* Pink Background */}
            <div className="relative h-[54px] w-[180px]">
              <Image src="/images/navigation/pink-bg.svg" alt="MAXXED Background" fill className="object-contain object-left" sizes="220px" priority />
              {/* Light Pink Diagonal Section */}
              <div className="absolute top-0 right-0 h-full w-[40px]">
                <Image src="/images/navigation/top-bg.svg" alt="Diagonal Cut" fill className="object-contain object-right" sizes="120px" priority />
              </div>
              {/* MAXXED Text and Progress Bar */}
              <div className="absolute inset-0 flex flex-col items-start justify-center pr-3">
                <span
                  className="text-white font-bold font-anton uppercase text-2xl text-center leading-none mb-1 pl-8"
                  style={{
                    WebkitTextStroke: '1px black',
                    WebkitTextFillColor: 'white',
                    textShadow: '1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black',
                  } as React.CSSProperties}
                >
                  MAXXED
                </span>
                {/* Progress Bar */}
                <div className="relative w-[118px] h-[12px] ml-4 overflow-hidden" style={{ clipPath: 'polygon(1.75% 7%, 98.6% 2.2%, 97% 89.3%, 1.2% 94.1%)' }}>
                  {/* Filled Section - Blue with gradient */}
                  <div
                    className="absolute top-0 left-0 h-full z-30"
                    style={{
                      width: `${progress}%`,
                      background: 'linear-gradient(to bottom, #5DACFB 0%, #5DACFB 50%, #4A90E2 50%, #4A90E2 100%)',
                      clipPath: 'polygon(5.7% 7%, 100% 2.2%, 96% 89.3%, 0% 94.1%)'
                    }}
                  />
                  {/* Unfilled Section - Dark gray with gradient */}
                  <div
                    className="absolute top-0 left-0 h-full"
                    style={{
                      width: '100%',
                      background: 'linear-gradient(to bottom, #21273A 0%, #21273A 50%, #1a1a3e 50%, #1a1a3e 100%)',
                      clipPath: 'polygon(6% 2.2%, 99% 7%, 95.7% 94.1%, 0% 89.3%)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* MAXXED Tooltip - above, arrow down */}
            <div className={showMaxxedTooltip ? 'contents' : 'hidden'}>
              <div className="absolute left-[53%] -translate-x-1/2 bottom-full mb-[-16px] z-50 w-[265px]">
                <div className="relative w-full aspect-[265/100]">
                  <Image src="/images/tooltips/pink-down.svg" alt="" fill className="object-contain" sizes="265px" aria-hidden unoptimized />
                  <div className="absolute inset-0 flex items-center justify-center px-5 -mt-7">
                    <p className="text-white text-sm text-center leading-snug">
                      The character’s stage and the development level until next character
                      unlock
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* CARDS Banner */}
          <div
            className="relative flex items-center group cursor-pointer"
            onMouseEnter={() => setShowCardsTooltip(true)}
            onMouseLeave={() => setShowCardsTooltip(false)}
            onClick={() => onOpenCardsModal?.()}
          >
            {/* Blue Background */}
            <div className="relative h-[54px] w-[176px]">
              <Image src="/images/navigation/blue-bg.svg" alt="MAXXED Background" fill className="object-contain object-left" sizes="176px" priority />
              {/* Light Pink Diagonal Section */}
              <div className="absolute top-0 right-0 h-full w-[100px]">
                <Image src="/images/navigation/top-bg.svg" alt="Diagonal Cut" fill className="object-contain object-right" sizes="100px" priority />
              </div>
              {/* USERS Icon */}
              <div className="absolute top-0 left-0 translate-x-[50%] translate-y-[-70%] w-[80px] h-[80px]">
                <Image src="/images/navigation/users.svg" alt="User Icon" fill className="object-contain" sizes="80px" priority />
              </div>
              {/* CARDS Text */}
              <div className="absolute inset-0 flex flex-col items-start justify-center pl-12 pr-3">
                <span
                  className="text-white font-medium font-anton-sc uppercase text-2xl text-center leading-none"
                >
                  CARDS
                </span>
              </div>
            </div>

            {/* CARDS Tooltip - above, arrow down */}
            <div className={showCardsTooltip ? 'contents' : 'hidden'}>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-[-16px] z-50 w-[265px]">
                <div className="relative w-full aspect-[265/100]">
                  <Image src="/images/tooltips/blue-down.svg" alt="" fill className="object-cover" sizes="265px" aria-hidden unoptimized />
                  <div className="absolute inset-0 flex items-center justify-center px-5 -mt-7">
                    <p className="text-white text-sm text-center leading-snug">
                      All purchased cards and the ones currently in use
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Yield Display */}
          <div className="absolute bottom-0 left-[calc(176px+176px+66px)] w-[170px] gap-2 flex flex-col bg-[#00112D] border-2 border-[#090909] rounded-lg p-1">
            <div className="text-center flex flex-col justify-center items-center w-full">
              <div className="flex items-center justify-between rounded-lg px-4 py-2.5 bg-[#1F1F38] w-full">
                <p className="text-white font-medium font-anton-sc text-xl">YIELD</p>
                <p className="text-[#FF5098] font-medium font-anton-sc text-xl">{totalClaimable.toFixed(1)}</p>
              </div>
              {hasInProgress && latestEndTime && remainingMs > 0 ? (
                <div className="text-[#FF98C2] font-anton-sc text-xl font-medium bg-[#1F1F38B2] rounded-bl-lg rounded-br-lg px-2 py-2.5 w-fit">{formatTimer(remainingMs)}</div>
              ) : (
                <div className="text-[#FF98C2] font-anton-sc text-xl font-medium bg-[#1F1F38B2] rounded-bl-lg rounded-br-lg px-2 py-2.5 w-fit">{formatTimer(0)}</div>
              )}
            </div>
            <Button
              variant="primary"
              className="w-fit mx-auto px-10 py-2 rounded-md font-anton font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleClaim}
              disabled={!canClaim || isClaiming}
            >
              {isClaiming ? (
                <>
                  CLAIMING...
                </>
              ) : (
                'CLAIM'
              )}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* MISSIONS Banner */}
          <div
            className="relative flex items-center group cursor-pointer"
            onMouseEnter={() => setShowMissionsTooltip(true)}
            onMouseLeave={() => setShowMissionsTooltip(false)}
            onClick={() => onOpenMissionsModal?.()}
          >
            {/* Blue Background */}
            <div className="relative h-[54px] w-[176px]">
              <Image src="/images/navigation/pink-bg.svg" alt="MAXXED Background" fill className="object-contain object-left" sizes="176px" priority />
              {/* Light Pink Diagonal Section */}
              <div className="absolute top-0 right-0 h-full w-[100px]">
                <Image src="/images/navigation/top-bg.svg" alt="Diagonal Cut" fill className="object-contain object-right" sizes="100px" priority />
              </div>
              {/* USERS Icon */}
              <div className="absolute top-0 left-0 translate-x-[80%] translate-y-[-70%] flex items-center justify-center w-[68px] h-[68px]">
                <Image src="/images/navigation/target-bg.svg" alt="User Icon" fill className="object-contain" sizes="68px" priority />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon icon="mdi:target" width="34" height="34" className="text-[#F7237A]" />
                </div>
              </div>
              {/* CARDS Text */}
              <div className="absolute inset-0 flex flex-col items-start justify-center pl-8 pr-3">
                <span
                  className="text-white font-medium font-anton-sc uppercase text-2xl text-center leading-none"
                >
                  MISSIONS
                </span>
              </div>
            </div>

            {/* MISSIONS Tooltip - above, arrow down */}
            <div className={showMissionsTooltip ? 'contents' : 'hidden'}>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-[-16px] z-50 w-[265px]">
                <div className="relative w-full aspect-[265/100]">
                  <Image src="/images/tooltips/pink-down.svg" alt="" fill className="object-cover" sizes="265px" aria-hidden unoptimized />
                  <div className="absolute inset-0 flex items-center justify-center px-5 -mt-7">
                    <p className="text-white text-sm text-center leading-snug">
                      Start and complete different missions to earn points and rewards
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* MAPS Banner */}
          <div
            className="relative flex items-center group cursor-pointer"
            onMouseEnter={() => setShowMapsTooltip(true)}
            onMouseLeave={() => setShowMapsTooltip(false)}
            onClick={() => onOpenMapsModal?.()}
          >
            {/* Blue Background */}
            <div className="relative h-[54px] w-[176px]">
              <Image src="/images/navigation/blue-bg.svg" alt="MAXXED Background" fill className="object-contain object-left" sizes="176px" priority />
              {/* Light Pink Diagonal Section */}
              <div className="absolute top-0 right-0 h-full w-[100px]">
                <Image src="/images/navigation/top-bg.svg" alt="Diagonal Cut" fill className="object-contain object-right" sizes="100px" priority />
              </div>
              {/* USERS Icon */}
              <div className="absolute top-0 left-0 translate-x-[42%] translate-y-[-70%] flex items-center justify-center w-[90px] h-[90px]">
                <Image src="/images/navigation/location-bg.svg" alt="User Icon" fill className="object-contain" sizes="90px" priority />
                <div className="absolute top-0 left-0 translate-x-[95%] translate-y-[98%] flex items-center justify-center">
                  <Icon icon="streamline-plump:location-pin-solid" width="32" height="32" className="text-white" />
                </div>
              </div>
              {/* CARDS Text */}
              <div className="absolute inset-0 flex flex-col items-start justify-center pl-12 pr-3">
                <span
                  className="text-white font-medium font-anton-sc uppercase text-2xl text-center leading-none"
                >
                  MAPS
                </span>
              </div>
            </div>

            {/* MAPS Tooltip - above, arrow down */}
            <div className={showMapsTooltip ? 'contents' : 'hidden'}>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-[-16px] z-50 w-[265px]">
                <div className="relative w-full aspect-[265/100]">
                  <Image src="/images/tooltips/blue-down.svg" alt="" fill className="object-cover" sizes="265px" aria-hidden unoptimized />
                  <div className="absolute inset-0 flex items-center justify-center px-5 -mt-7">
                    <p className="text-white text-sm text-center leading-snug">
                      Switch between different maps for other playable missions
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
