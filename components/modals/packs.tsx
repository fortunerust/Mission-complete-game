import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
} from '@solana/spl-token';
import { gameAPI } from '../../lib/api';

const CURRENCY_TOKEN_MINT =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CURRENCY_TOKEN_MINT) ||
  '7MFWQ1jqWVv23UjKibyz2vo2FtaovtJaik4jp6BrWvLX';
const CURRENCY_TOKEN_DECIMALS = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CURRENCY_TOKEN_DECIMALS
  ? Number(process.env.NEXT_PUBLIC_CURRENCY_TOKEN_DECIMALS)
  : 6;
const PLATFORM_WALLET = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS) || '';

export interface PacksModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  pricePerPack?: number;
  onPurchase: (quantity: number, totalCost: number, sig: string) => Promise<void>;
  /** Called after a successful on-chain purchase so the app can refresh wallet balance. */
  onPurchaseComplete?: () => void;
}

export default function PacksModal({
  isOpen,
  onClose,
  balance,
  pricePerPack = 230,
  onPurchase,
  onPurchaseComplete,
}: PacksModalProps) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [quantity, setQuantity] = useState(4);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [successModal, setSuccessModal] = useState<{ show: boolean; packCount: number; newBalance: number }>({
    show: false,
    packCount: 0,
    newBalance: 0,
  });
  const [failedModal, setFailedModal] = useState<{ show: boolean; reason: string }>({ show: false, reason: '' });

  const totalCost = pricePerPack * quantity;
  const canAfford = totalCost <= balance;

  const handlePurchase = async () => {
    if (isPurchasing) return;
    if (!canAfford) {
      setFailedModal({ show: true, reason: 'NOT ENOUGH COINS' });
      return;
    }
    if (!publicKey || !sendTransaction) {
      setFailedModal({ show: true, reason: 'WALLET NOT CONNECTED' });
      return;
    }
    if (!PLATFORM_WALLET) {
      setFailedModal({ show: true, reason: 'PLATFORM WALLET NOT CONFIGURED' });
      return;
    }
    setIsPurchasing(true);
    try {
      const mint = new PublicKey(CURRENCY_TOKEN_MINT);
      const platformPubkey = new PublicKey(PLATFORM_WALLET);
      const sourceAta = getAssociatedTokenAddressSync(mint, publicKey);
      const destAta = getAssociatedTokenAddressSync(mint, platformPubkey);
      const rawAmount = BigInt(Math.floor(totalCost * 10 ** CURRENCY_TOKEN_DECIMALS));

      const tx = new Transaction();
      tx.add(
        createAssociatedTokenAccountIdempotentInstruction(publicKey, destAta, platformPubkey, mint)
      );
      tx.add(createTransferInstruction(sourceAta, destAta, publicKey, rawAmount));

      const sig = await sendTransaction(tx, connection, { skipPreflight: false, maxRetries: 3 });
      const confirmed = await connection.confirmTransaction(sig, 'confirmed');
      if (!confirmed) {
        setFailedModal({ show: true, reason: 'TRANSACTION FAILED' });
        return;
      }

      const maxRetries = 5;
      let lastErr: unknown;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await onPurchase(quantity, totalCost, sig);
          onPurchaseComplete?.();
          setSuccessModal({ show: true, packCount: quantity, newBalance: balance - totalCost });
          return;
        } catch (err) {
          lastErr = err;
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, 800 * attempt));
          }
        }
      }
      const reason = lastErr instanceof Error ? lastErr.message : 'TRANSACTION FAILED';
      setFailedModal({ show: true, reason: reason.length > 40 ? 'BACKEND SYNC FAILED' : reason });
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'TRANSACTION FAILED';
      setFailedModal({ show: true, reason: reason.length > 40 ? 'TRANSACTION FAILED' : reason });
    } finally {
      setIsPurchasing(false);
    }
  };

  const closeSuccessModal = () => {
    setSuccessModal((s) => ({ ...s, show: false }));
    onClose();
  };

  const closeFailedModal = () => {
    setFailedModal({ show: false, reason: '' });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/50" onClick={onClose}>
        <div
          className="relative flex flex-col items-center justify-center gap-10 w-[70%] min-h-[85%] rounded-3xl overflow-visible bg-[#00012699]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button - top right */}
          <button
            type="button"
            onClick={onClose}
            className="absolute -top-[3px] -right-[1px] w-14 h-14 bg-[#3E95E3] rounded hover:opacity-90 flex items-center justify-center text-white"
          >
            <img src="/images/pack/text-x.svg" alt="CLOSE" className="h-7 w-auto object-contain" />
          </button>

          {/* Title above modal - centered */}
          <h2 className="text-white font-bold font-anton text-4xl uppercase whitespace-nowrap">
            Buy a pack to obtain more cards
          </h2>
          <div
            className="relative w-full max-w-md mx-4 rounded-2xl overflow-visible bg-[#202253E5] border-2 border-[#0967BC]"
            onClick={(e) => e.stopPropagation()}
          >

            {/* PACK tab - upper left */}
            <div className="absolute -top-5 -left-3 z-10">
              <img src="/images/pack/pack-btn.svg" alt="PACK" className="h-16 w-auto object-contain" />
            </div>

            <div className="flex flex-col items-center justify-center pt-4 pb-20 px-16 gap-2">
              {/* Card packs display - bright blue area */}
              <div
                className="w-full flex justify-center items-center rounded-3xl py-2 px-3"
                style={{
                  background: 'linear-gradient(to bottom,rgba(9, 104, 188, 0.3),rgba(100, 183, 255, 0.3))',
                }}
              >
                <div
                  className="rounded-3xl w-full flex justify-center items-center"
                  style={{ background: 'linear-gradient(to bottom, #0967BC, #64B6FF)' }}
                >
                  <img
                    src="/images/pack/packs.svg"
                    alt="Packs"
                    className="w-[280px] object-contain"
                  />
                </div>
              </div>

              <p className="text-white text-center font-bold text-2xl mb-3 font-['Arial']">1 Pack = {pricePerPack} $Maxx</p>

              {/* Quantity slider */}
              <p className="text-[#53A2FF] font-bold font-anton-sc text-2xl text-right w-full mb-1 mr-2">{quantity} PACKS</p>
              <input
                type="range"
                min={1}
                max={10}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-white"
                style={{
                  background: `linear-gradient(to right, #4DA1ED 0%, #4DA1ED ${((quantity - 1) / 9) * 100}%, #C4C4C4 ${((quantity - 1) / 9) * 100}%, #C4C4C4 100%)`,
                }}
              />

              <div className="flex w-full px-4 justify-between items-center">
                <p className="text-white text-lg font-medium font-['Arial'] mt-2 mb-3">TOTAL:</p>
                <p className="text-[#58B0FF] text-lg font-medium font-['Arial'] mt-2 mb-3">{totalCost} $Maxx</p>
              </div>

              {/* Balance */}
              <div className="w-full rounded-lg px-3 py-2 mb-4 flex justify-between items-center border-[1px] border-[#54A7F3]">
                <span className="text-white text-lg font-normal font-['Arial']">Balance:</span>
                <span className="text-white font-bold font-['Arial']">{balance}</span>
              </div>

              {/* Purchase button - shows spinner only when loading */}
              <button
                type="button"
                onClick={async () => await handlePurchase()}
                disabled={isPurchasing}
                className="absolute bottom-[16px] right-[20px] min-w-[180px] w-[220px] border-[1px] border-[#FD8BBA] bg-[#F7237A] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold font-anton uppercase pl-4 rounded-xl flex items-center justify-center"
              >
                {isPurchasing ? (
                  <div className="flex items-center justify-center py-2">
                    <Icon icon="mdi:loading" className="animate-spin text-white" width={28} height={28} />
                  </div>
                ) : (
                  <div className="flex w-full items-center justify-between gap-2">
                    <p className="w-fit text-lg font-medium font-anton-sc">PURCHASE</p>
                    <div className="flex items-center w-[100px] font-anton-sc font-medium gap-1 pl-2 pr-6 py-2 bg-[#330719] rounded-xl">
                      <div className="relative z-10">
                        <img
                          src="/images/pack/currency.svg"
                          alt="Currency"
                          className="w-auto h-7"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Icon icon="mdi:dollar" width="14" height="14" className="text-white" />
                        </div>
                      </div>
                      {totalCost}
                    </div>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success modal - blue, checkmark, "SUCCESSFULLY PURCHASED", pack count, Balance */}
      {successModal.show && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
          onClick={closeSuccessModal}
        >
          <div
            className="relative flex flex-col justify-center rounded-2xl gap-4 w-full h-[300px] max-w-md mx-4 py-8 px-6 items-center shadow-xl"
            style={{ background: 'linear-gradient(to bottom, #0967BC, #64B6FF)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
              <Icon icon="mdi:check" className="text-[#237DCF]" width={48} height={48} />
            </div>
            <div className="flex flex-col items-center justify-center gap-1">
              <p className="text-white font-medium font-anton uppercase text-lg">SUCCESSFULLY PURCHASED</p>
              <p className="text-white font-medium font-anton uppercase text-3xl">
                {successModal.packCount} PACK{successModal.packCount !== 1 ? 'S' : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Failed modal - pink, red X, "FAILED", reason */}
      {failedModal.show && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
          onClick={closeFailedModal}
        >
          <div
            className="relative flex flex-col justify-center rounded-2xl gap-4 w-full h-[300px] max-w-md mx-4 py-8 px-6 items-center shadow-xl"
            style={{ background: 'linear-gradient(to bottom, #F7237A, #FF7EB3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
              <Icon icon="mdi:close" className="text-red-500" width={48} height={48} />
            </div>
            <div className="flex flex-col items-center justify-center gap-1">
              <p className="text-white font-medium font-anton uppercase text-3xl">FAILED</p>
              <p className="text-white font-medium font-anton uppercase text-xl">{failedModal.reason}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
