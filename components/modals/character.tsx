import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import Button from '../Button';
import CharacterItem from '../CharacterItem';
import { Character } from '@/types';

export interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  physique: number;
  cards: { used: number; total: number };
  packs: number;
  progress: number;
  level: number;
  /** Current character image src (used for main display in modal). */
  characterImage?: string;
  /** List from API (id, name, imageSrc); when provided, used instead of default grid. */
  characters?: Character[];
  /** Called when user clicks APPLY with the selected character. May return a Promise so the modal can show loading until done. */
  onApplyCharacter?: (character: Character) => void | Promise<unknown>;
}

function getFilledSegments(progressPercent: number): number {
  if (progressPercent <= 20) return 1;
  if (progressPercent <= 40) return 2;
  if (progressPercent <= 60) return 3;
  if (progressPercent <= 80) return 4;
  return 5;
}

export default function CharacterModal({
  isOpen,
  onClose,
  name,
  physique,
  cards,
  packs,
  progress,
  level,
  characterImage = '/images/characters/chad.svg',
  characters: charactersProp,
  onApplyCharacter,
}: CharacterModalProps) {
  const [selectedCharacterIndex, setSelectedCharacterIndex] = useState(() =>
    charactersProp?.findIndex((c) => c._id ?? c.name === characterImage) ?? 0
  );
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    const selectedCharacter = charactersProp?.[selectedCharacterIndex];
    if (selectedCharacter == null) return;
    setIsApplying(true);
    try {
      const result = onApplyCharacter?.(selectedCharacter);
      if (result != null && typeof (result as Promise<unknown>).then === 'function') {
        await (result as Promise<unknown>);
      }
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  const filledSegments = getFilledSegments(progress);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/50"
      onClick={onClose}>
      <div
        className="relative flex flex-col items-center justify-center gap-4 min-w-[80vw] max-w-[90vw] max-h-[90vh] min-h-0 px-16 py-10 rounded-3xl bg-[#00012699]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title - center */}
        <div className="flex-shrink-0 flex justify-center pt-6 pb-4">
          <h2 className="text-white font-medium font-anton uppercase text-3xl sm:text-5xl">CHARACTER</h2>
        </div>

        {/* Close button - top right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-[3px] -right-[1px] w-14 h-14 bg-[#3E95E3] rounded hover:opacity-90 flex items-center justify-center text-white"
        >
          <img src="/images/pack/text-x.svg" alt="CLOSE" className="h-7 w-auto object-contain" />
        </button>
        <div className="flex gap-6 min-h-0 flex-1 w-full">
          <div className="flex flex-1 gap-6 min-w-0 w-full">
            <div className="relative flex rounded-2xl bg-[#202253E5] border-2 border-[#0967BC] py-5 pl-6 pr-12 w-full gap-6 overflow-auto hide-scrollbar">
              <div className="flex flex-col gap-2">
                <div className="px-2 pt-1 pb-2 bg-primary-darker w-[220px] h-[48px] rounded-tr-xl rounded-tl-xl">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-white font-normal uppercase text-xl">{name}</span>
                    <span className="text-[#95A2FF] font-medium font-anton uppercase shrink-0 text-sm">LVL {level}</span>
                  </div>
                  <div className="flex items-center justify-start gap-1">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <img
                        key={index}
                        src={index < filledSegments ? '/images/icons/power-bar-fill.svg' : '/images/icons/power-bar-nofill.svg'}
                        alt={index < filledSegments ? 'Filled' : 'Empty'}
                        className="h-3 w-4 object-contain"
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-start justify-center gap-12">
                  <div className="flex flex-col gap-2 pt-2">
                    {/* Hanger icon panel */}
                    <div className="relative w-12 h-11 flex items-center justify-center flex-shrink-0">
                      <img
                        src="/images/characters/icon-bg.svg"
                        alt=""
                        className="absolute inset-0 w-full h-full object-contain"
                        aria-hidden
                      />
                      <img
                        src="/images/icons/hugeicons_hanger.svg"
                        alt=""
                        className="relative z-10 w-6 h-6 object-contain"
                        aria-hidden
                      />
                    </div>
                    {/* Text-box icon panel */}
                    <div className="relative w-12 h-11 flex items-center justify-center flex-shrink-0">
                      <img
                        src="/images/characters/icon-bg.svg"
                        alt=""
                        className="absolute inset-0 w-full h-full object-contain"
                        aria-hidden
                      />
                      <img
                        src="/images/icons/text-box.svg"
                        alt=""
                        className="relative z-10 w-6 h-6 object-contain"
                        aria-hidden
                      />
                    </div>
                  </div>
                  <div className="flex items-start justify-center w-full">
                    {/* Character image - left (current/selected character) */}
                    <div className="flex items-center justify-center flex-shrink-0">
                      <img
                        src={characterImage}
                        alt="Character"
                        className="w-[220px] h-[420px] object-contain"
                      />
                    </div>
                    {/* Character Stats Panel */}
                    <div className="flex flex-col gap-5 w-[300px] bg-[#09091E4D] py-8 rounded-3xl">

                      <div className="space-y-5 pl-8 pr-12">
                        {/* PHYSIQUE */}
                        <div className="relative flex items-center gap-2 bg-[#00112D]">
                          <div className="absolute bottom-0 left-0 rounded flex items-center justify-center flex-shrink-0 bg-cover bg-center z-10 w-11 h-11" style={{ backgroundImage: 'url(/images/icons/icon-bg.svg)' }}>
                            <img src="/images/icons/muscle.svg" alt="Physique" className="w-9 h-9 object-contain" />
                          </div>
                          <div className="relative bg-[#00112D] ml-12 h-[40px]">
                            <div className="absolute top-[-8px] left-0 flex items-center justify-center">
                              <span className="text-white font-bold font-anton text-[16px]" style={{ WebkitTextStroke: '1px black', WebkitTextFillColor: 'white' } as React.CSSProperties}>PHYSIQUE</span>
                            </div>
                            <div className="absolute bottom-0">
                              <span className="text-white font-bold font-anton text-[22px]" style={{ WebkitTextStroke: '1px black', WebkitTextFillColor: 'white' } as React.CSSProperties}>{physique}</span>
                            </div>
                          </div>
                        </div>

                        {/* CARDS */}
                        <div className="relative flex items-center gap-2 bg-[#00112D]">
                          <div className="absolute bottom-0 left-0 rounded flex items-center justify-center flex-shrink-0 bg-cover bg-center z-10 w-11 h-11" style={{ backgroundImage: 'url(/images/icons/icon-bg.svg)' }}>
                            <img src="/images/icons/text-box.svg" alt="Cards" className="w-6 h-6 object-contain" />
                          </div>
                          <div className="relative bg-[#00112D] ml-12 h-[40px]">
                            <div className="absolute top-[-8px] left-0 flex items-center justify-center">
                              <span className="text-white font-bold font-anton text-[16px]" style={{ WebkitTextStroke: '1px black', WebkitTextFillColor: 'white' } as React.CSSProperties}>CARDS</span>
                            </div>
                            <div className="absolute bottom-0">
                              <span className="text-white font-bold font-anton text-[22px]" style={{ WebkitTextStroke: '1px black', WebkitTextFillColor: 'white' } as React.CSSProperties}>{cards.used}/{cards.total}</span>
                            </div>
                          </div>
                        </div>

                        {/* PACKS */}
                        <div className="relative flex items-center gap-2 bg-[#00112D]">
                          <div className="absolute bottom-0 left-0 rounded flex items-center justify-center flex-shrink-0 bg-cover bg-center z-10 w-11 h-11" style={{ backgroundImage: 'url(/images/icons/icon-bg.svg)' }}>
                            <img src="/images/icons/jerry-box.svg" alt="Packs" className="w-6 h-6 object-contain" />
                          </div>
                          <div className="relative bg-[#00112D] ml-12 h-[40px]">
                            <div className="absolute top-[-8px] left-0 flex items-center justify-center">
                              <span className="text-white font-bold font-anton text-[16px]" style={{ WebkitTextStroke: '1px black', WebkitTextFillColor: 'white' } as React.CSSProperties}>PACKS</span>
                            </div>
                            <div className="absolute bottom-0">
                              <span className="text-white font-bold font-anton text-[22px]" style={{ WebkitTextStroke: '1px black', WebkitTextFillColor: 'white' } as React.CSSProperties}>{packs}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex pl-8 pr-9">
                        <div className="flex justify-around items-center gap-4 w-full bg-[#00112D99] rounded-xl py-4 pl-4 pr-8">
                          {/* HEALTH */}
                          <div className="flex flex-col items-center gap-2">
                            <div className="relative w-14 h-14">
                              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15" fill="none" stroke="#3A3F47" strokeWidth="3" />
                                <circle
                                  cx="18"
                                  cy="18"
                                  r="15"
                                  fill="none"
                                  stroke="#FF6B99"
                                  strokeWidth="3"
                                  strokeDasharray={`${2 * Math.PI * 15}`}
                                  strokeDashoffset={`${2 * Math.PI * 15 * (1 - 0.78)}`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Icon icon="mdi:heart" className="text-[#FF6B99]" width={22} height={22} />
                              </div>
                            </div>
                            <span className="text-[#FF6B99] font-bold font-saira-condensed text-xs uppercase">HEALTH</span>
                          </div>
                          {/* FITNESS */}
                          <div className="flex flex-col items-center gap-2">
                            <div className="relative w-14 h-14">
                              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15" fill="none" stroke="#3A3F47" strokeWidth="3" />
                                <circle
                                  cx="18"
                                  cy="18"
                                  r="15"
                                  fill="none"
                                  stroke="#3399FF"
                                  strokeWidth="3"
                                  strokeDasharray={`${2 * Math.PI * 15}`}
                                  strokeDashoffset={`${2 * Math.PI * 15 * (1 - 0.63)}`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Icon icon="mdi:shield" className="text-[#3399FF]" width={22} height={22} />
                              </div>
                            </div>
                            <span className="text-[#3399FF] font-bold font-saira-condensed text-xs uppercase">FITNESS</span>
                          </div>
                          {/* BOOST */}
                          <div className="flex flex-col items-center gap-2">
                            <div className="relative w-14 h-14">
                              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15" fill="none" stroke="#3A3F47" strokeWidth="3" />
                                <circle
                                  cx="18"
                                  cy="18"
                                  r="15"
                                  fill="none"
                                  stroke="#33FF99"
                                  strokeWidth="3"
                                  strokeDasharray={`${2 * Math.PI * 15}`}
                                  strokeDashoffset={`${2 * Math.PI * 15 * (1 - 0.42)}`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Icon icon="mdi:arrow-up" className="text-[#33FF99]" width={22} height={22} />
                              </div>
                            </div>
                            <span className="text-[#33FF99] font-bold font-saira-condensed text-xs uppercase">BOOST</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-6 min-w-0 min-h-0 max-w-[600px]">
            <div className="flex flex-col items-end justify-center rounded-2xl bg-[#2E2F4FE5] border-2 border-[#0967BC] pt-10 pb-4 px-10 w-full gap-6 min-h-0 flex-1">
              <div className="flex flex-wrap gap-4 rounded-2xl bg-[#09091EE5] px-6 py-8 w-full overflow-auto min-h-0 flex-1 hide-scrollbar">
                {charactersProp?.map((character, index) => (
                  <div key={character._id != null ? `char-${character._id}` : `${character.name}-${index}`} className="">
                    <CharacterItem name={character.name} imageSrc={character.imageSrc} selected={selectedCharacterIndex === index} onClick={() => setSelectedCharacterIndex(index)} />
                  </div>
                ))}
              </div>
              <Button
                variant="primary"
                className="w-fit border-2 border-[#FD8BBA] rounded-lg font-anton uppercase text-md font-medium px-12 py-2 min-w-[120px] flex items-center justify-center gap-2"
                onClick={handleApply}
                disabled={isApplying || level < (charactersProp?.[selectedCharacterIndex]?.level ?? 1)}
              >
                {isApplying ? (
                  <Icon icon="eos-icons:bubble-loading" className="text-white" width={24} height={24} aria-hidden />
                ) : (
                  'APPLY'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
