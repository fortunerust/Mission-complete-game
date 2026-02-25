import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Suspense } from 'react';
import Image from 'next/image';
import { PublicKey } from '@solana/web3.js';
import { useConnection } from '@solana/wallet-adapter-react';
import Header from '../components/Header';
import CharacterPanel from '../components/CharacterPanel';
import Navigation from '../components/Navigation';
import CityActivities from '../components/CityActivities';
import PacksModal from '../components/modals/packs';
import CardsModal from '../components/modals/cards';
import CharacterModal from '../components/modals/character';
import MissionsModal from '../components/modals/missions';
import MapsModal from '../components/modals/maps';
import WalletsModal from '../components/modals/wallets';
import { useWallet, SOLANA_WALLETS } from '../context/WalletContext';
import { useCharacter } from '../context/CharacterContext';
import { useGameSettings } from '../context/GameSettingsContext';
import { gameAPI } from '../lib/api';
import { toastError } from '../lib/toast';
import type { Card, CardHistory, Character, Map, Mission } from '../types';
import Loading from '../components/Loading';

/** SPL token mint used as in-game currency (wallet balance = currency). From .env. */
const CURRENCY_TOKEN_MINT =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CURRENCY_TOKEN_MINT) ||
  '7MFWQ1jqWVv23UjKibyz2vo2FtaovtJaik4jp6BrWvLX';

export default function Home() {
  const router = useRouter();
  const { address, connector, isReady } = useWallet();
  const { characterImage, characterName, setCharacter } = useCharacter();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showPacksModal, setShowPacksModal] = useState(false);
  const [showCardsModal, setShowCardsModal] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showMissionsModal, setShowMissionsModal] = useState(false);
  const [missionsPreselectedName, setMissionsPreselectedName] = useState<string | null>(null);
  const [showMapsModal, setShowMapsModal] = useState(false);
  const [currentMap, setCurrentMap] = useState<Map>({ name: 'BEACH SIDE', imageSrc: '/images/maps/map1.png', order: 1, unlocked: true, selected: true });
  const [missionsForMap, setMissionsForMap] = useState<Mission[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<{ activity: Mission; index: number } | null>(null);
  const expandedCardRef = useRef<HTMLDivElement>(null);

  // Close expanded activity when user clicks outside the expanded card
  useEffect(() => {
    if (selectedActivity == null) return;
    const handlePointerDown = (e: PointerEvent) => {
      const el = expandedCardRef.current;
      if (el && !el.contains(e.target as Node)) setSelectedActivity(null);
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [selectedActivity]);

  const [viewportWidth, setViewportWidth] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [timeLoadingElapsed, setTimeLoadingElapsed] = useState(false);
  const [playerData, setPlayerData] = useState({
    name: '',
    physique: 0,
    cards: { used: 0, total: 0 },
    packs: 0,
    energy: 0,
    currency: 0,
    experience: 0,
    level: 1,
    cardsInUse: [] as Card[],
    cardsPurchased: [] as Card[],
    purchasedCharacters: [] as string[],
  });
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [balanceRefreshKey, setBalanceRefreshKey] = useState(0);
  const { connection } = useConnection();
  // Map dimensions: use selected resolution from settings
  const { resolutionSize } = useGameSettings();
  const MAP_WIDTH = resolutionSize.width;
  const MAP_HEIGHT = resolutionSize.height;
  const MAP_ASPECT_RATIO = MAP_WIDTH / MAP_HEIGHT;

  // Fetch wallet's SPL token balance only when connected with a Solana wallet (address is base58). EVM addresses (0x...) are invalid for PublicKey.
  const isSolanaWallet = connector != null && SOLANA_WALLETS.includes(connector);
  useEffect(() => {
    if (!address || !connection || !isSolanaWallet) {
      setTokenBalance(0);
      return;
    }
    let cancelled = false;
    const mint = new PublicKey(CURRENCY_TOKEN_MINT);
    const owner = new PublicKey(address);
    connection
      .getParsedTokenAccountsByOwner(owner, { mint })
      .then((res: { value: Array<{ account?: { data?: { parsed?: { info?: { tokenAmount?: { uiAmount?: number | null } } } } } }> }) => {
        if (cancelled) return;
        const first = res.value?.[0]?.account?.data?.parsed?.info?.tokenAmount;
        const amount = first?.uiAmount ?? 0;
        setTokenBalance(typeof amount === 'number' ? amount : 0);
      })
      .catch(() => {
        if (!cancelled) setTokenBalance(0);
      });
    return () => {
      cancelled = true;
    };
  }, [address, connection, isSolanaWallet, balanceRefreshKey]);

  // Fetch player and sync character from backend when wallet is connected (currency = game balance from backend, not real wallet balance)
  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    gameAPI.getPlayer(address).then((res) => {
      if (cancelled) return;
      const p = res.data;
      console.log("🔍 ~ Home ~ frontend/pages/index.tsx:111 ~ p:", p);
      const name = p.character?.name;
      const physique = p.cardsInUse?.reduce((acc: number, history: CardHistory) => acc + ((history.cardId as Card)?.stats?.physique ?? 0), 0);
      const cards = { used: p.cardsInUse?.length ?? 0, total: 8 };
      const packs = p.packs;
      const energy = p.energy;
      setPlayerData((prev) => ({
        ...prev,
        name: name ?? prev.name,
        physique: physique ?? prev.physique,
        cards: cards ?? prev.cards,
        packs: packs ?? prev.packs,
        energy: energy ?? prev.energy,
        experience: p.experience ?? prev.experience,
        level: p.level ?? prev.level,
        cardsInUse: p.cardsInUse ?? prev.cardsInUse,
        cardsPurchased: p.cardsPurchased ?? prev.cardsPurchased,
        purchasedCharacters: p.purchasedCharacters ?? prev.purchasedCharacters,
      }));
      const map = p.map;
      if (map) setCurrentMap(map);
    }).catch(() => { });
    return () => { cancelled = true; };
  }, [address, setCharacter]);

  // Fetch missions for current map from backend
  useEffect(() => {
    let cancelled = false;
    if (!currentMap) return;
    gameAPI.getMissions(currentMap._id).then((res) => {
      if (!cancelled && Array.isArray(res.data)) {
        setMissionsForMap(res.data);
        setMissionsPreselectedName(res.data[0]?.name ?? null);
      }
    }).catch(() => { });
    return () => { cancelled = true; };
  }, [currentMap]);

  // Fetch characters from backend (for character modal)
  useEffect(() => {
    let cancelled = false;
    gameAPI.getCharacters().then((res) => {
      console.log("🚀 ~ Home ~ res.data:", res.data)
      if (!cancelled && Array.isArray(res.data)) setCharacters(res.data);
    }).catch(() => { });
    return () => { cancelled = true; };
  }, []);

  // Sync token balance into player currency (Header, modals use playerData.currency)
  useEffect(() => {
    setPlayerData((prev) => ({ ...prev, currency: tokenBalance }));
  }, [tokenBalance]);

  // Redirect to landing when wallet not connected
  useEffect(() => {
    if (router.isReady && isReady && !address) {
      router.replace('/landing');
    }
  }, [router.isReady, isReady, address, router]);

  // After Suspense resolves, show TimeLoading for 3s before game content
  useEffect(() => {
    if (!address) return;
    const t = setTimeout(() => setTimeLoadingElapsed(true), 3100);
    return () => clearTimeout(t);
  }, [address]);

  // Update viewport width on mount and resize
  useEffect(() => {
    const updateViewport = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Calculate container dimensions
  // Map size scales proportionally to match display while maintaining original aspect ratio
  // Aspect ratio = MAP_WIDTH / MAP_HEIGHT (1536 / 1024 = 1.5)
  let containerWidth: number;
  let containerHeight: number;
  let overflowX: 'auto' | 'hidden' = 'auto';
  let overflowY: 'auto' | 'hidden' = 'auto';

  if (viewportWidth > 0 && viewportHeight > 0) {
    const isWidthLarger = viewportWidth > MAP_WIDTH;
    const isHeightLarger = viewportHeight > MAP_HEIGHT;

    if (isWidthLarger && isHeightLarger) {
      // Both dimensions are larger
      // First, try width-based scaling: map width = display width, height = display width / aspect ratio
      const heightFromWidth = viewportWidth / MAP_ASPECT_RATIO;

      // If display height > calculated height from width, switch to height-based scaling
      if (viewportHeight > heightFromWidth) {
        // Use height-based scaling: map height = display height, width = display height × aspect ratio
        containerHeight = viewportHeight;
        containerWidth = viewportHeight * MAP_ASPECT_RATIO;
        // Enable overflow for width if it exceeds viewport
        overflowX = containerWidth > viewportWidth ? 'auto' : 'hidden';
        overflowY = 'hidden';
      } else {
        // Use width-based scaling: map width = display width, height = display width / aspect ratio
        containerWidth = viewportWidth;
        containerHeight = heightFromWidth;
        // Enable overflow for height if it doesn't fill viewport
        overflowY = heightFromWidth < viewportHeight ? 'auto' : 'hidden';
        overflowX = 'hidden';
      }
    } else if (isWidthLarger) {
      // First case: display width > origin map width
      // Map width = display width, height = display width / aspect ratio
      containerWidth = viewportWidth;
      containerHeight = viewportWidth / MAP_ASPECT_RATIO;
      // Enable overflow for height if it exceeds viewport
      overflowY = containerHeight > viewportHeight ? 'auto' : 'hidden';
      overflowX = 'hidden';
    } else if (isHeightLarger) {
      // Second case: display height > origin map height (but width <= origin map width)
      // Map height = display height, width = display height × aspect ratio
      containerHeight = viewportHeight;
      containerWidth = viewportHeight * MAP_ASPECT_RATIO;
      // Enable overflow for width if it exceeds viewport
      overflowX = containerWidth > viewportWidth ? 'auto' : 'hidden';
      overflowY = 'hidden';
    } else {
      // Display is smaller: keep map fixed at original dimensions
      containerWidth = MAP_WIDTH;
      containerHeight = MAP_HEIGHT;
      // Enable overflow when display is smaller
      overflowX = viewportWidth < MAP_WIDTH ? 'auto' : 'hidden';
      overflowY = viewportHeight < MAP_HEIGHT ? 'auto' : 'hidden';
    }
  } else {
    // Fallback to map dimensions
    containerWidth = MAP_WIDTH;
    containerHeight = MAP_HEIGHT;
    overflowX = 'auto';
    overflowY = 'auto';
  }

  // const ACTIVITIES_BY_MAP: Record<number, Activity[]> = {
  //   1: [
  //     { name: 'GYM SESSION', icon: 'mdi:dumbbell', image: '/images/missioins/gym.svg', stars: 0 },
  //     { name: 'LOCK IN', icon: 'mdi:brain', image: '/images/missioins/lockin.svg', stars: 0 },
  //     { name: 'PERPS TRADING', icon: 'mdi:chart-line-variant', image: '/images/missioins/perps.svg', stars: 0 },
  //     { name: 'POOL PARTY', icon: 'mdi:pool', image: '/images/missioins/pool.svg', stars: 0 },
  //   ],
  //   2: [
  //     { name: 'GYM SESSION', icon: 'mdi:dumbbell', image: '/images/missioins/gym.svg', stars: 0 },
  //     { name: 'LOCK IN', icon: 'mdi:brain', image: '/images/missioins/lockin.svg', stars: 0 },
  //     { name: 'PERPS TRADING', icon: 'mdi:chart-line-variant', image: '/images/missioins/perps.svg', stars: 0 },
  //     { name: 'POOL PARTY', icon: 'mdi:pool', image: '/images/missioins/pool.svg', stars: 0 },
  //   ],
  //   3: [
  //     { name: 'LOCK IN', icon: 'mdi:brain', image: '/images/missioins/lockin.svg', stars: 0 },
  //     { name: 'GYM SESSION', icon: 'mdi:dumbbell', image: '/images/missioins/gym.svg', stars: 0 },
  //     { name: 'POOL PARTY', icon: 'mdi:pool', image: '/images/missioins/pool.svg', stars: 0 },
  //     { name: 'PERPS TRADING', icon: 'mdi:chart-line-variant', image: '/images/missioins/perps.svg', stars: 0 },
  //   ],
  // };
  const activities = missionsForMap

  const handleConnectWallet = () => setShowWalletModal(true);

  const handleUnpack = () => {
    if (playerData.packs > 0 && address) {
      gameAPI.purchasePacks(address, 'pack_purchase', 1, 230, '').catch(() => { });
    }
  };

  const handlePurchasePacks = async (quantity: number, totalCost: number, sig: string) => {
    if (address) {
      gameAPI.purchasePacks(address, 'pack_purchase', quantity, totalCost, sig)
      .then(async (res) => {
        const p = res.data;
        console.log("🔍 ~ Home ~ frontend/pages/index.tsx:285 ~ p:", p);
        setPlayerData((prev) => ({ 
          ...prev, 
          packs: p.packs,
          cardsPurchased: [...prev.cardsPurchased, ...p.cardHistory]
        }));
      })
      .catch((err) => {
        toastError('Could not update player. Please try again.', err);
      });
    }
  };
  return (
    <Suspense fallback={<Loading />}>
      <div
        className="bg-primary-darker relative hide-scrollbar"
        style={{
          width: '100vw',
          height: '100vh',
          overflowX: overflowX,
          overflowY: overflowY,
          position: 'fixed',
          top: 0,
          left: 0,
        }}
      >
        <div
          className="relative"
          style={{
            width: `${containerWidth}px`,
            height: `${containerHeight}px`,
            minWidth: `${containerWidth}px`,
            minHeight: `${containerHeight}px`,
          }}
        >
          {/* Background City Map - use Next/Image so Vercel optimizes (WebP, sizing) */}
          <div
            className="absolute top-0 left-0 overflow-hidden"
            style={{
              width: `${containerWidth}px`,
              height: `${containerHeight}px`,
            }}
          >
            <Image
              src={currentMap?.imageSrc ?? '/images/maps/map1.png'}
              alt={currentMap?.name ?? 'BEACH SIDE'}
              fill
              className="object-cover object-center"
              sizes={`${containerWidth}px`}
              priority
            />
            <div
              className="absolute inset-0 bg-gradient-to-b from-transparent to-primary-darker opacity-40 pointer-events-none"
              style={{
                width: `${containerWidth}px`,
                height: `${containerHeight}px`,
              }}
            />
          </div>

          <Header
            energy={playerData.energy}
            currency={playerData.currency}
            slots={playerData.cards}
            onConnectWallet={handleConnectWallet}
            onSwitchWallet={handleConnectWallet}
          />

          <CharacterPanel
            name={characterName}
            physique={playerData.physique}
            cards={playerData.cards}
            packs={playerData.packs}
            progress={(playerData.experience % 1000) / 10}
            level={playerData.level}
            characterImage={characterImage}
            onUnpack={handleUnpack}
            onOpenPacksModal={() => setShowPacksModal(true)}
            onOpenCharacterModal={() => setShowCharacterModal(true)}
          />

          {/* Main Content Area — expanded card ref used for click-outside to close */}
          <div className={selectedActivity != null ? 'relative z-[55]' : ''}>
            <CityActivities
                expandedCardRef={expandedCardRef}
                activities={activities}
                containerWidth={containerWidth}
                containerHeight={containerHeight}
                selectedActivity={selectedActivity}
                currentMap={currentMap ?? undefined}
                onSelectActivity={(activity: Mission, index: number) => setSelectedActivity({ activity, index })}
                onCloseActivity={() => setSelectedActivity(null)}
                onStartActivity={(activity: Mission) => {
                  setShowMissionsModal(true);
                  setMissionsPreselectedName(activity.name);
                }}
              />
          </div>

          <Navigation
            experience={playerData.experience}
            wallet={address}
            onOpenCardsModal={() => setShowCardsModal(true)}
            onOpenMissionsModal={() => setShowMissionsModal(true)}
            onOpenMapsModal={() => setShowMapsModal(true)}
            onClaimComplete={() => setBalanceRefreshKey((k) => k + 1)}
          />

          {/* Character Modal */}
          <CharacterModal
            isOpen={showCharacterModal}
            onClose={() => setShowCharacterModal(false)}
            name={characterName}
            physique={playerData.physique}
            cards={playerData.cards}
            packs={playerData.packs}
            progress={(playerData.experience % 1000) / 10}
            wallet={address ?? undefined}
            balance={tokenBalance}
            onPurchaseComplete={(purchaseData: any) => {
              if (address) {
                const purchasedCharacters = purchaseData.purchasedCharacters;
                const character = purchaseData.character;
                setPlayerData((prev) => ({
                  ...prev,
                  name: character?.name ?? prev.name,
                  purchasedCharacters: purchasedCharacters ?? prev.purchasedCharacters,
                }));
                if (character) setCharacter(character.imageSrc, character.name);
                setBalanceRefreshKey((prev) => prev + 1);
              }
            }}
            level={playerData.level}
            characterImage={characterImage}
            characters={characters.length > 0 ? characters : undefined}
            purchasedCharacters={playerData.purchasedCharacters}
            onApplyCharacter={async (character) => {
              if (address && character._id != null) {
                const res = await gameAPI.updatePlayer(address, { characterId: character._id });
                const p = res.data;
                setPlayerData((prev) => ({
                  ...prev,
                  name: p.character?.name ?? prev.name,
                  physique: p.cardsInUse?.reduce((acc: number, c: Card) => acc + (c.stats?.physique ?? 0), 0) ?? prev.physique,
                  cards: { used: p.cardsInUse?.length ?? 0, total: prev.cards.total },
                  packs: p.packs ?? prev.packs,
                  energy: p.energy ?? prev.energy,
                }));
                if (p.character) {
                  setCharacter(p.character.imageSrc, p.character.name);
                }
              }
            }}
          />

          {/* Cards Modal */}
          <CardsModal
            isOpen={showCardsModal}
            onClose={() => setShowCardsModal(false)}
            cardsInUse={playerData.cardsInUse as unknown as CardHistory[]}
            cardsPurchased={playerData.cardsPurchased as unknown as CardHistory[]}
            wallet={address ?? undefined}
            onCardsUpdated={(data: any) => {
              if (!address) return;
              const physique = data.cardsInUse?.reduce((acc: number, history: CardHistory) => acc + ((history.cardId as Card)?.stats?.physique ?? 0), 0) ?? 0;
              const cards = { used: data.cardsInUse?.length ?? 0, total: 8 };
              setPlayerData((prev) => ({
                ...prev,
                physique: physique ?? prev.physique,
                cards: cards ?? prev.cards,
                cardsInUse: data.cardsInUse ?? prev.cardsInUse,
                cardsPurchased: data.cardsPurchased ?? prev.cardsPurchased,
              }));
            }}
          />

          {/* Missions Modal */}
          <MissionsModal
            isOpen={showMissionsModal}
            onClose={() => {
              setShowMissionsModal(false);
              setMissionsPreselectedName(null);
            }}
            missions={missionsForMap.length > 0 ? missionsForMap : undefined}
            currentMap={currentMap}
            wallet={address ?? undefined}
            balance={playerData.currency}
            initialSelectedMissionName={missionsPreselectedName}
            onMissionCompleted={(userData: any) => {
              setPlayerData((prev) => ({
                ...prev,
                experience: userData.experience ?? prev.experience,
                level: userData.level ?? prev.level,
              }));
            }}
          />

          {/* Maps Modal */}
          <MapsModal
            isOpen={showMapsModal}
            onClose={() => setShowMapsModal(false)}
            currentMapId={currentMap?._id}
            onApplyMap={async (map) => {
              if (!address || !map._id) return;
              const res = await gameAPI.updatePlayer(address, { mapId: map._id });
              const p = res.data;
              setPlayerData((prev) => ({ ...prev, map: p.map }));
              if (p.map) setCurrentMap(p.map);
              setShowMapsModal(false);
            }}
          />

          {/* Buy Packs Modal */}
          <PacksModal
            isOpen={showPacksModal}
            onClose={() => setShowPacksModal(false)}
            balance={playerData.currency}
            pricePerPack={230}
            onPurchase={handlePurchasePacks}
            onPurchaseComplete={() => setBalanceRefreshKey((k) => k + 1)}
          />

          <WalletsModal
            isOpen={showWalletModal}
            onClose={() => setShowWalletModal(false)}
          />
        </div>
      </div>
    </Suspense>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
