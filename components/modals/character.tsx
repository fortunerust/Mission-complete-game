import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
} from '@solana/spl-token';
import Button from '../Button';
import CharacterItem from '../CharacterItem';
import { Character } from '@/types';
import { gameAPI } from '@/lib/api';
import { toastError } from '@/lib/toast';

const CURRENCY_TOKEN_MINT =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CURRENCY_TOKEN_MINT) ||
  '7MFWQ1jqWVv23UjKibyz2vo2FtaovtJaik4jp6BrWvLX';
const CURRENCY_TOKEN_DECIMALS = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CURRENCY_TOKEN_DECIMALS
  ? Number(process.env.NEXT_PUBLIC_CURRENCY_TOKEN_DECIMALS)
  : 6;
const PLATFORM_WALLET = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS) || '';

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
  purchasedCharacters: string[];
  /** Wallet address for purchase */
  wallet?: string;
  /** Current token balance */
  balance?: number;
  /** Called after successful character purchase to refresh data */
  onPurchaseComplete?: (purchaseData?: any) => void;
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
  purchasedCharacters,
  wallet,
  balance = 0,
  onPurchaseComplete,
  onApplyCharacter,
}: CharacterModalProps) {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [selectedCharacterIndex, setSelectedCharacterIndex] = useState(() =>
    charactersProp?.findIndex((c) => c._id ?? c.name === characterImage) ?? 0
  );
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    const selectedCharacter = charactersProp?.[selectedCharacterIndex];
    if (selectedCharacter == null) return;
    const isPurchased = purchasedCharacters.includes(selectedCharacter._id ?? '');
    
    // If purchased, apply character without payment
    if (isPurchased) {
      setIsApplying(true);
      try {
        const result = onApplyCharacter?.(selectedCharacter);
        if (result != null && typeof (result as Promise<unknown>).then === 'function') {
          await (result as Promise<unknown>);
        }
      } catch (err) {
        const reason = err instanceof Error ? err.message : 'FAILED TO APPLY CHARACTER';
        toastError(reason);
      } finally {
        setIsApplying(false);
      }
      return;
    }

    // If not purchased, handle purchase
    if (!wallet || !selectedCharacter._id) {
      toastError('Wallet not connected or character ID missing');
      return;
    }

    if (isPurchasing) return;

    // Validate purchase with backend first
    try {
      const validationRes = await gameAPI.validateCharacterPurchase(wallet, selectedCharacter._id);
      const { price } = validationRes.data;
      
      if (balance < price) {
        toastError('NOT ENOUGH COINS');
        return;
      }

      if (!publicKey || !sendTransaction) {
        toastError('WALLET NOT CONNECTED');
        return;
      }

      if (!PLATFORM_WALLET) {
        toastError('PLATFORM WALLET NOT CONFIGURED');
        return;
      }

      setIsPurchasing(true);

      // Create and send transaction
      const mint = new PublicKey(CURRENCY_TOKEN_MINT);
      const platformPubkey = new PublicKey(PLATFORM_WALLET);
      const sourceAta = getAssociatedTokenAddressSync(mint, publicKey);
      const destAta = getAssociatedTokenAddressSync(mint, platformPubkey);
      const rawAmount = BigInt(Math.floor(price * 10 ** CURRENCY_TOKEN_DECIMALS));

      const tx = new Transaction();
      tx.add(
        createAssociatedTokenAccountIdempotentInstruction(publicKey, destAta, platformPubkey, mint)
      );
      tx.add(createTransferInstruction(sourceAta, destAta, publicKey, rawAmount));

      const sig = await sendTransaction(tx, connection, { skipPreflight: false, maxRetries: 3 });
      const confirmed = await connection.confirmTransaction(sig, 'confirmed');
      if (!confirmed) {
        toastError('TRANSACTION FAILED');
        setIsPurchasing(false);
        return;
      }

      // Complete purchase on backend
      const maxRetries = 5;
      let lastErr: unknown;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const purchaseRes = await gameAPI.purchaseCharacter(wallet, 'character_purchase', selectedCharacter._id, price, sig);
          if (purchaseRes.data.success) {
            onPurchaseComplete?.(purchaseRes.data);
            setSelectedCharacterIndex(selectedCharacterIndex);
            setIsPurchasing(false);
            return;
          } else {
            toastError('PURCHASE FAILED');
            setIsPurchasing(false);
            return;
          }
        } catch (err) {
          lastErr = err;
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, 800 * attempt));
          }
        }
      }
      const reason = lastErr instanceof Error ? lastErr.message : 'TRANSACTION FAILED';
      toastError(reason.length > 40 ? 'BACKEND SYNC FAILED' : reason);
      setIsPurchasing(false);
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'PURCHASE VALIDATION FAILED';
      toastError(reason);
      setIsPurchasing(false);
    }
  };

  if (!isOpen) return null;

  const filledSegments = getFilledSegments(progress);
  
  // Get the currently selected character
  const selectedCharacter = charactersProp?.[selectedCharacterIndex];
  const displayName = selectedCharacter?.name ?? name;
  const displayImage = selectedCharacter?.imageSrc ?? characterImage;
  const displayLevel = selectedCharacter?.level ?? level;

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
                    <span className="text-white font-normal uppercase text-xl">{displayName}</span>
                    <span className="text-[#95A2FF] font-medium font-anton uppercase shrink-0 text-sm">LVL {displayLevel}</span>
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
                        src={displayImage}
                        alt={displayName}
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
                    <CharacterItem name={character.name} price={character.price} imageSrc={character.imageSrc} selected={selectedCharacterIndex === index} purchased={purchasedCharacters.includes(character._id ?? '')} onClick={() => setSelectedCharacterIndex(index)} />
                  </div>
                ))}
              </div>
              <Button
                variant="primary"
                className="w-fit border-2 border-[#FD8BBA] rounded-lg font-anton uppercase text-md font-medium px-12 py-2 min-w-[120px] flex items-center justify-center gap-2"
                onClick={handleApply}
                disabled={isPurchasing || isApplying || level < (charactersProp?.[selectedCharacterIndex]?.level ?? 1)}
              >
                {isPurchasing || isApplying ? (
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
