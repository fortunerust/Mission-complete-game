import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardHistory } from '../../types';
import GameCard from '../GameCard';
import { gameAPI } from '../../lib/api';
import { toastError, toastSuccess } from '../../lib/toast';

export interface CardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardsInUse?: CardHistory[];
  cardsPurchased?: CardHistory[];
  wallet?: string;
  onCardsUpdated?: (data: any) => void;
}

export default function CardsModal({
  isOpen,
  onClose,
  cardsInUse,
  cardsPurchased,
  wallet,
  onCardsUpdated,
}: CardsModalProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; history: CardHistory } | null>(null);
  const [loadingCardId, setLoadingCardId] = useState<string | null>(null);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => closeContextMenu();
    const handleScroll = () => closeContextMenu();
    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [contextMenu, closeContextMenu]);

  const handleUseCard = useCallback(
    async (history: CardHistory) => {
      console.log("🔍 ~ CardsModal ~ frontend/components/modals/cards.tsx:41 ~ history:", history);
      const historyId = history._id;
      const action = history.action === 'purchase' ? 'use' : 'purchase';
      if (!wallet || !historyId || loadingCardId) return;
      if (history.action === 'purchase' && !(cardsPurchased ?? []).map((c) => c._id ?? '').filter(Boolean).includes(historyId)) return;
      if (history.action === 'use' && !(cardsInUse ?? []).map((c) => c._id ?? '').filter(Boolean).includes(historyId)) return;
      setLoadingCardId(historyId);
      setContextMenu(null);
      try {
        const res = await gameAPI.updatePlayer(wallet, {
          historyId,
          action,
        });
        onCardsUpdated?.(res.data);
        toastSuccess('Cards updated successfully!');
      } catch (err) {
        toastError('Failed to use card. Please try again.', err);
      } finally {
        setLoadingCardId(null);
      }
    },
    [wallet, cardsInUse, cardsPurchased, loadingCardId, onCardsUpdated]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/50"
      onClick={onClose}>
      <div
        className="relative flex flex-col items-center justify-center gap-10 min-w-[80vw] max-w-[90vw] min-h-0 max-h-[95vh] h-[90vh] md:h-[78vh] rounded-3xl bg-[#00012699] p-4"
        onClick={(e) => {
          e.stopPropagation();
          setContextMenu(null);
        }}
      >
        {/* Close button - top right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-[3px] -right-[1px] w-14 h-14 bg-[#3E95E3] rounded hover:opacity-90 flex items-center justify-center text-white"
        >
          <img src="/images/pack/text-x.svg" alt="CLOSE" className="h-7 w-auto object-contain" />
        </button>
        <div className="flex gap-6 p-6 pt-8 w-full flex-1 min-h-0 overflow-hidden">
          {/* CARDS IN USE - left panel */}
          <div className="flex-1 min-w-0 min-h-0 flex flex-col rounded-2xl bg-[#202253E5] border-2 border-[#0967BC] p-5">
            <p className="flex-shrink-0 text-white font-medium font-anton uppercase text-center text-xl mb-4">CARDS <span className='rounded-md justify-start pl-1 pr-3 py2 bg-[#2D57DE]'>IN USE</span></p>
            <div className="flex flex-wrap gap-3 pt-3 content-start overflow-auto min-h-0 flex-1 w-full hide-scrollbar">
              {cardsInUse?.map((history) => {
                const historyId = history._id ?? '';
                const isLoading = loadingCardId === historyId;
                return (
                  <div key={historyId} className="min-w-0 relative"
                    onContextMenu={(e) => {
                      if (e.button !== 2) return; // only right-click
                      e.preventDefault();
                      if (!wallet || isLoading) return;
                      setContextMenu({ x: e.clientX, y: e.clientY, history });
                    }}>
                    <GameCard
                      _id={historyId}
                      name={(history.cardId as Card)?.name ?? ''}
                      value={(history.cardId as Card)?.value ?? ''}
                      type={(history.cardId as Card)?.type ?? 'blue'}
                      stats={{
                        physique: (history.cardId as Card)?.stats?.physique ?? 0,
                        strength: (history.cardId as Card)?.stats?.strength ?? 0,
                        charisma: (history.cardId as Card)?.stats?.charisma ?? 0,
                        rizz: (history.cardId as Card)?.stats?.rizz ?? 0,
                      }}
                      imageBg={(history.cardId as Card)?.imageBg}
                      imageItem={(history.cardId as Card)?.imageItem}
                    />
                    {isLoading && (
                      <div
                        className="absolute inset-0 rounded-xl bg-black/60 flex items-center justify-center z-10"
                        style={{ width: 180, height: 270 }}
                      >
                        <div className="w-12 h-12 border-4 border-[#0967BC] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* CARDS PURCHASED - right panel */}
          <div className="flex-1 min-w-0 min-h-0 flex flex-col rounded-2xl bg-[#0000004D] border-2 border-[#0967BC] p-5">
            <p className="flex-shrink-0 text-white font-medium font-anton text-center uppercase text-xl mb-4">CARDS PURCHASED</p>
            <div className="flex flex-wrap gap-3 pt-3 content-start overflow-auto min-h-0 flex-1 w-full hide-scrollbar">
              {cardsPurchased?.map((history) => {
                const historyId = history._id ?? '';
                const isLoading = loadingCardId === historyId;
                return (
                  <div
                    key={historyId}
                    className="min-w-0 relative"
                    onContextMenu={(e) => {
                      if (e.button !== 2) return; // only right-click
                      e.preventDefault();
                      if (!wallet || isLoading) return;
                      setContextMenu({ x: e.clientX, y: e.clientY, history });
                    }}
                  >
                    <GameCard
                      _id={historyId}
                      name={(history.cardId as Card)?.name ?? ''}
                      value={(history.cardId as Card)?.value ?? ''}
                      type={(history.cardId as Card)?.type ?? 'blue'}
                      stats={{
                        physique: (history.cardId as Card)?.stats?.physique ?? 0,
                        strength: (history.cardId as Card)?.stats?.strength ?? 0,
                        charisma: (history.cardId as Card)?.stats?.charisma ?? 0,
                        rizz: (history.cardId as Card)?.stats?.rizz ?? 0,
                      }}
                      imageBg={(history.cardId as Card)?.imageBg}
                      imageItem={(history.cardId as Card)?.imageItem}
                    />
                    {isLoading && (
                      <div
                        className="absolute inset-0 rounded-xl bg-black/60 flex items-center justify-center z-10"
                        style={{ width: 180, height: 270 }}
                      >
                        <div className="w-12 h-12 border-4 border-[#0967BC] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right-click context menu */}
          {contextMenu && (
            <div
              className="fixed z-[60] min-w-[120px] rounded-lg bg-[#202253E5] border-2 border-[#0967BC] shadow-xl py-1"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="w-full px-4 py-2 text-left text-white font-medium hover:bg-[#0967BC]/40 transition-colors"
                onClick={() => handleUseCard(contextMenu.history)}
              >
                {contextMenu.history.action === 'purchase' ? 'Use' : 'Purchase'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
