import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface CharacterPanelProps {
  name: string;
  physique: number;
  cards: { used: number; total: number };
  packs: number;
  progress: number;
  level: number;
  /** Character image src to display (e.g. selected character from modal). */
  characterImage?: string;
  onUnpack?: () => void;
  onOpenPacksModal?: () => void;
  onOpenCharacterModal?: () => void;
}

export default function CharacterPanel({
  name,
  physique,
  cards,
  packs,
  progress,
  level,
  characterImage = '/images/characters/chad.svg',
  onUnpack,
  onOpenPacksModal,
  onOpenCharacterModal,
}: CharacterPanelProps) {
  const [viewportHeight, setViewportHeight] = useState(0);
  const isSmallHeight = viewportHeight > 0 && viewportHeight < 840;

  useEffect(() => {
    const updateViewport = () => {
      setViewportHeight(window.innerHeight);
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Calculate number of filled segments based on progress percentage
  const getFilledSegments = (progressPercent: number): number => {
    if (progressPercent <= 20) return 1;
    if (progressPercent <= 40) return 2;
    if (progressPercent <= 60) return 3;
    if (progressPercent <= 80) return 4;
    return 5;
  };

  const filledSegments = getFilledSegments(progress);
  return (
    <div className="fixed flex items-center gap-4 left-0 z-40" style={{ top: '46%', transform: 'translateY(-50%)' }}>
      <div
        className={`relative flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-200 origin-center ${isSmallHeight ? 'w-[180px] h-[300px]' : 'w-[300px] h-[500px]'}`}
        onClick={() => onOpenCharacterModal?.()}
        role={onOpenCharacterModal ? 'button' : undefined}
      >
        <Image
          src={characterImage}
          alt="Character"
          fill
          className="object-contain"
          sizes={isSmallHeight ? '180px' : '300px'}
          priority
        />
      </div>

      <div className={`flex flex-col gap-4 font-anton ${isSmallHeight ? 'w-[150px]' : 'w-[250px]'}`}>
        {/* Character Stats Panel */}
        <div className="rounded-md border-2 border-primary-darker">
          {/* Character Name */}
          <div className={`${isSmallHeight ? 'px-1.5 pt-0.5 pb-1' : 'px-2 pt-1 pb-2'} bg-primary-darker`}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className={`text-white font-normal uppercase ${isSmallHeight ? 'text-sm' : 'text-xl'}`}>{name}</span>
              <span className={`text-[#95A2FF] font-medium font-anton uppercase shrink-0 ${isSmallHeight ? 'text-xs' : 'text-sm'}`}>LVL {level}</span>
            </div>
            {/* Progress Bar - 5 segments */}
            <div className="flex items-center justify-start gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Image
                  key={index}
                  src={index < filledSegments
                    ? '/images/icons/power-bar-fill.svg'
                    : '/images/icons/power-bar-nofill.svg'
                  }
                  alt={index < filledSegments ? 'Filled' : 'Empty'}
                  width={isSmallHeight ? 12 : 16}
                  height={isSmallHeight ? 8 : 12}
                  className="object-contain"
                />
              ))}
            </div>
          </div>

          {/* Stats Rows */}
          <div className={`${isSmallHeight ? 'space-y-2 pl-2 pt-3 pb-2' : 'space-y-3 pl-2 pt-4 pb-3'} bg-[#20225380]`}>
            {/* PHYSIQUE */}
            <div className="relative flex items-center gap-2 bg-[#00112D]">
              <div
                className={`absolute bottom-0 left-0 rounded flex items-center justify-center flex-shrink-0 bg-cover bg-center z-10 ${isSmallHeight ? 'w-8 h-8' : 'w-11 h-11'}`}
                style={{ backgroundImage: 'url(/images/icons/icon-bg.svg)' }}
              >
                <Image src="/images/icons/muscle.svg" alt="Physique" width={isSmallHeight ? 24 : 36} height={isSmallHeight ? 24 : 36} className="object-contain" />
              </div>
              <div className={`relative bg-[#00112D] ${isSmallHeight ? 'ml-8 h-[30px]' : 'ml-12 h-[40px]'}`}>
                <div className="absolute top-[-8px] left-0 flex items-center justify-center">
                  <span
                    className={`font-bold font-anton ${isSmallHeight ? 'text-[12px]' : 'text-[18px]'}`}
                    style={{
                      WebkitTextStroke: '1px black',
                      WebkitTextFillColor: '#FF87B8',
                    } as React.CSSProperties}
                  >
                    PHYSIQUE
                  </span>
                </div>
                <div className="absolute bottom-[-2px]">
                  <span
                    className={`text-white font-bold font-anton ${isSmallHeight ? 'text-[16px]' : 'text-[22px]'}`}
                    style={{
                      WebkitTextStroke: '1px black',
                      WebkitTextFillColor: 'white',
                    } as React.CSSProperties}
                  >
                    {physique}
                  </span>
                </div>
              </div>
            </div>

            {/* CARDS */}
            <div className="relative flex items-center gap-2 bg-[#00112D]">
              <div
                className={`absolute bottom-0 left-0 rounded flex items-center justify-center flex-shrink-0 bg-cover bg-center z-10 ${isSmallHeight ? 'w-8 h-8' : 'w-11 h-11'}`}
                style={{ backgroundImage: 'url(/images/icons/icon-bg.svg)' }}
              >
                <Image src="/images/icons/text-box.svg" alt="Cards" width={isSmallHeight ? 16 : 24} height={isSmallHeight ? 16 : 24} className="object-contain" />
              </div>
              <div className={`relative bg-[#00112D] ${isSmallHeight ? 'ml-8 h-[30px]' : 'ml-12 h-[40px]'}`}>
                <div className="absolute top-[-8px] left-0 flex items-center justify-center">
                  <span
                    className={`font-bold font-anton ${isSmallHeight ? 'text-[12px]' : 'text-[18px]'}`}
                    style={{
                      WebkitTextStroke: '1px black',
                      WebkitTextFillColor: '#FF87B8',
                    } as React.CSSProperties}
                  >
                    CARDS
                  </span>
                </div>
                <div className="absolute bottom-[-2px]">
                  <span
                    className={`text-white font-bold font-anton ${isSmallHeight ? 'text-[16px]' : 'text-[22px]'}`}
                    style={{
                      WebkitTextStroke: '1px black',
                      WebkitTextFillColor: 'white',
                    } as React.CSSProperties}
                  >
                    {cards.used}/{cards.total}
                  </span>
                </div>
              </div>
            </div>

            {/* PACKS */}
            <div className="relative flex items-center gap-2 bg-[#00112D]">
              <div
                className={`absolute bottom-0 left-0 rounded flex items-center justify-center flex-shrink-0 bg-cover bg-center z-10 ${isSmallHeight ? 'w-8 h-8' : 'w-11 h-11'}`}
                style={{ backgroundImage: 'url(/images/icons/icon-bg.svg)' }}
              >
                <Image src="/images/icons/jerry-box.svg" alt="Packs" width={isSmallHeight ? 16 : 24} height={isSmallHeight ? 16 : 24} className="object-contain" />
              </div>
              <div className={`relative bg-[#00112D] ${isSmallHeight ? 'ml-8 h-[30px]' : 'ml-12 h-[40px]'}`}>
                <div className="absolute top-[-8px] left-0 flex items-center justify-center">
                  <span
                    className={`font-bold font-anton ${isSmallHeight ? 'text-[12px]' : 'text-[18px]'}`}
                    style={{
                      WebkitTextStroke: '1px black',
                      WebkitTextFillColor: '#FF87B8',
                    } as React.CSSProperties}
                  >
                    PACKS
                  </span>
                </div>
                <div className="absolute bottom-[-2px]">
                  <span
                    className={`text-white font-bold font-anton ${isSmallHeight ? 'text-[16px]' : 'text-[22px]'}`}
                    style={{
                      WebkitTextStroke: '1px black',
                      WebkitTextFillColor: 'white',
                    } as React.CSSProperties}
                  >
                    {packs}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pack Section */}
        <div className="bg-[#20225380] flex flex-col items-center justify-center w-full rounded-md border-2 border-primary-darker px-[12px] py-[10px] relative">
          {/* PACK Banner */}
          <div className={`absolute z-10 ${isSmallHeight ? '-top-1.5 left-[-10px]' : '-top-2.5 left-[-14px]'}`}>
            <Image
              src="/images/pack/pack-btn.svg"
              alt="PACK"
              width={isSmallHeight ? 60 : 84}
              height={40}
              className="object-contain"
            />
          </div>

          {/* Pack Display Area */}
          <div
            className="rounded-3xl w-full mb-3"
            style={{
              background: 'linear-gradient(to bottom, #0967BC, #64B6FF)',
            }}
          >
            <div className="flex justify-center items-center w-full">
              <Image
                src="/images/pack/packs.svg"
                alt="Packs"
                width={isSmallHeight ? 108 : 180}
                height={isSmallHeight ? 80 : 120}
                className="object-contain"
              />
            </div>
          </div>

          {/* UNPACK Button - opens buy packs modal when onOpenPacksModal provided, otherwise unpacks if packs > 0 */}
          <button
            onClick={() => (onOpenPacksModal ? onOpenPacksModal() : packs > 0 && onUnpack?.())}
            disabled={!onOpenPacksModal && packs === 0}
            className={`w-fit bg-[#F7237A] text-[#DFEBFF] font-medium font-anton rounded-lg uppercase ${isSmallHeight ? 'px-6 py-2 text-sm' : 'px-10 py-3'} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            UNPACK
          </button>
        </div>
      </div>
    </div>
  );
}
