'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { toastError, toastSuccess } from '../lib/toast';
import detectEthereumProvider from '@metamask/detect-provider';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { SolanaWalletAdapter } from './SolanaWalletAdapter';

export type WalletId = 'phantom' | 'metamask' | 'coinbase' | 'rabby';

/** Wallet display metadata for icons and labels - use for UI (e.g. Header, modals) */
export interface WalletMeta {
  id: WalletId;
  name: string;
  icon: string;
  iconBg?: string;
  /** Official wallet icon image URL (preferred over Iconify for correct branding) */
  iconImage?: string;
}

/** Official/canonical wallet icon URLs for correct branding in the connect modal (simple-icons CDN) */
const WALLET_ICON_IMAGES: Partial<Record<WalletId, string>> = {
  metamask: 'images/icons/metamask.svg',
  phantom: 'images/icons/phantom.svg',
  coinbase: 'images/icons/coinbase.svg',
  rabby: 'images/icons/rabby.svg',
};

export const WALLET_META: Record<WalletId, WalletMeta> = {
  phantom: { id: 'phantom', name: 'Phantom', icon: 'simple-icons:phantom', iconBg: 'bg-[#AB9FF2]', iconImage: WALLET_ICON_IMAGES.phantom },
  metamask: { id: 'metamask', name: 'Metamask', icon: 'simple-icons:metamask', iconBg: 'bg-[#E8832D]', iconImage: WALLET_ICON_IMAGES.metamask },
  coinbase: { id: 'coinbase', name: 'Coinbase', icon: 'simple-icons:coinbase', iconBg: 'bg-[#0052FF]', iconImage: WALLET_ICON_IMAGES.coinbase },
  rabby: { id: 'rabby', name: 'Rabby', icon: 'mdi:rabbit', iconBg: 'bg-[#8697FF]', iconImage: WALLET_ICON_IMAGES.rabby },
};

/** Wallets that use Solana network (via @solana/wallet-adapter) */
export const SOLANA_WALLETS: WalletId[] = ['phantom'];

/** Map Solana adapter wallet name to our WalletId */
function adapterNameToWalletId(name: string): WalletId | null {
  const n = name?.toLowerCase() ?? '';
  if (n === 'phantom') return 'phantom';
  return null;
}

export function getWalletMeta(connector: WalletId | null): WalletMeta | null {
  return connector ? WALLET_META[connector] ?? null : null;
}

const STORAGE_KEY_ADDRESS = 'lm_wallet_address';
const STORAGE_KEY_CONNECTOR = 'lm_wallet_connector';

/** Local types for wallet providers to avoid conflicting with lib declarations of Window.solana / Window.ethereum */
type SolanaProvider = {
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string; toBase58?: () => string } }>;
  disconnect: () => Promise<void>;
  publicKey: { toString: () => string; toBase58?: () => string } | null;
};
type EthLike = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
type WindowWithWallets = {
  solana?: SolanaProvider;
  ethereum?: {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    isMetaMask?: boolean;
    isRabby?: boolean;
    isCoinbaseWallet?: boolean;
    providers?: unknown[];
  };
  phantom?: { ethereum?: EthLike; solana?: SolanaProvider };
  coinbaseWalletExtension?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
};

function getSolanaProvider(walletId: WalletId): SolanaProvider | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as WindowWithWallets;
  if (walletId === 'phantom') return w.solana ?? w.phantom?.solana;
  return undefined;
}

function getEthereumProvider(walletId: WalletId): EthLike | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as WindowWithWallets;
  const eth = w.ethereum;
  switch (walletId) {
    case 'metamask':
      if (eth?.providers) {
        const meta = (eth.providers as WindowWithWallets['ethereum'][])?.find((p) => p?.isMetaMask);
        return meta ? { request: meta.request.bind(meta) } : (eth?.isMetaMask ? { request: eth.request.bind(eth) } : undefined);
      }
      return eth?.isMetaMask ? { request: eth.request.bind(eth) } : undefined;
    case 'rabby':
      if (eth?.providers) {
        const rabby = (eth.providers as WindowWithWallets['ethereum'][])?.find((p) => p?.isRabby);
        return rabby ? { request: rabby.request.bind(rabby) } : (eth?.isRabby ? { request: eth.request.bind(eth) } : undefined);
      }
      return eth?.isRabby ? { request: eth.request.bind(eth) } : undefined;
    case 'coinbase':
      if (w.coinbaseWalletExtension) {
        return { request: w.coinbaseWalletExtension.request.bind(w.coinbaseWalletExtension) };
      }
      if (eth?.providers) {
        const cb = (eth.providers as WindowWithWallets['ethereum'][])?.find((p) => p?.isCoinbaseWallet);
        return cb ? { request: cb.request.bind(cb) } : (eth?.isCoinbaseWallet ? { request: eth.request.bind(eth) } : undefined);
      }
      return eth?.isCoinbaseWallet ? { request: eth.request.bind(eth) } : undefined;
    default:
      return undefined;
  }
}

/** Returns detected wallet ids excluding MetaMask (MetaMask is detected async via detect-provider with mustBeMetaMask). */
function getDetectedWalletsWithoutMetaMask(): WalletId[] {
  if (typeof window === 'undefined') return [];
  const out: WalletId[] = [];
  if (getSolanaProvider('phantom')) out.push('phantom');
  if (getEthereumProvider('coinbase')) out.push('coinbase');
  if (getEthereumProvider('rabby')) out.push('rabby');
  return out;
}

interface WalletContextValue {
  address: string | null;
  connector: WalletId | null;
  /** Display info for the connected wallet (name, icon, iconBg) - use for correct wallet icon */
  connectorMeta: WalletMeta | null;
  isConnected: boolean;
  isConnecting: boolean;
  isReady: boolean;
  detectedWallets: WalletId[];
  connect: (walletId: WalletId) => Promise<void>;
  disconnect: () => void;
  refreshDetected: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

function WalletContextProviderInner({ children }: { children: React.ReactNode }) {
  const solana = useSolanaWallet();
  const [evmAddress, setEvmAddress] = useState<string | null>(null);
  const [evmConnector, setEvmConnector] = useState<WalletId | null>(null);
  const [isConnectingEvm, setIsConnectingEvm] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [syncDetectedWallets, setSyncDetectedWallets] = useState<WalletId[]>([]);
  const [metamaskDetected, setMetamaskDetected] = useState(false);
  const detectedWallets: WalletId[] = metamaskDetected ? ['metamask', ...syncDetectedWallets] : syncDetectedWallets;

  const refreshDetected = useCallback(() => {
    setSyncDetectedWallets(getDetectedWalletsWithoutMetaMask());
    detectEthereumProvider({ mustBeMetaMask: true }).then((provider: unknown) => {
      setMetamaskDetected(!!provider);
    });
  }, []);

  const isSolanaConnected = !!solana.publicKey;
  const solanaAddress = solana.publicKey?.toBase58?.() ?? solana.publicKey?.toString() ?? null;
  const solanaConnector = solana.wallet ? adapterNameToWalletId(solana.wallet.adapter.name) : null;

  const address = isSolanaConnected ? solanaAddress : evmAddress;
  const connector = isSolanaConnected ? solanaConnector : evmConnector;
  const isConnecting = solana.connecting || isConnectingEvm;

  useEffect(() => {
    refreshDetected();
    if (typeof localStorage !== 'undefined' && !isSolanaConnected && !evmAddress) {
      const stored = localStorage.getItem(STORAGE_KEY_ADDRESS);
      const storedConnector = localStorage.getItem(STORAGE_KEY_CONNECTOR) as WalletId | null;
      if (stored && storedConnector && SOLANA_WALLETS.includes(storedConnector)) {
      } else if (stored && storedConnector) {
        setEvmAddress(stored);
        setEvmConnector(storedConnector);
      }
    }
    setIsReady(true);
  }, [refreshDetected, isSolanaConnected, evmAddress]);

  useEffect(() => {
    if (isSolanaConnected && solanaAddress && solanaConnector && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_ADDRESS, solanaAddress);
      localStorage.setItem(STORAGE_KEY_CONNECTOR, solanaConnector);
    }
  }, [isSolanaConnected, solanaAddress, solanaConnector]);

  const connect = useCallback(
    async (walletId: WalletId) => {
      if (SOLANA_WALLETS.includes(walletId)) {
        const wallet = solana.wallets?.find((w: { adapter: { name: string } }) => adapterNameToWalletId(w.adapter.name) === walletId);
        if (!wallet) {
          toastError(
            walletId === 'phantom'
              ? 'Phantom not installed. Install the Phantom extension for Solana.'
              : 'Solflare not installed. Install the Solflare extension for Solana.'
          );
          return;
        }
        try {
          await solana.select(wallet.adapter.name);
          await solana.connect();
        } catch (err) {
          if (err && typeof (err as { code?: number }).code === 'number' && (err as { code: number }).code === 4001) return;
          toastError('Failed to connect Solana wallet. Please try again.', err);
        }
        return;
      }

      let provider: EthLike | undefined;
      if (walletId === 'metamask') {
        const meta = await detectEthereumProvider({ mustBeMetaMask: true });
        const m = meta as { request: EthLike['request'] } | null;
        provider = m ? { request: m.request.bind(m) } : undefined;
      } else {
        provider = getEthereumProvider(walletId);
      }
      if (!provider?.request) {
        toastError(`${walletId} not detected. Install the wallet extension.`);
        return;
      }
      setIsConnectingEvm(true);
      try {
        const accounts = (await provider.request({ method: 'eth_requestAccounts', params: [] })) as string[];
        const addr = accounts?.[0] ?? null;
        if (addr) {
          setEvmAddress(addr);
          setEvmConnector(walletId);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(STORAGE_KEY_ADDRESS, addr);
            localStorage.setItem(STORAGE_KEY_CONNECTOR, walletId);
          }
          toastSuccess('Wallet connected successfully!');
        }
      } catch (err) {
        if (err && typeof (err as { code?: number }).code === 'number' && (err as { code: number }).code === 4001) return;
        toastError('Failed to connect wallet. Please try again.', err);
      } finally {
        setIsConnectingEvm(false);
      }
    },
    [solana]
  );

  const disconnect = useCallback(() => {
    if (connector && SOLANA_WALLETS.includes(connector)) {
      solana.disconnect();
    }
    setEvmAddress(null);
    setEvmConnector(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_ADDRESS);
      localStorage.removeItem(STORAGE_KEY_CONNECTOR);
    }
    toastSuccess('Wallet disconnected successfully!');
  }, [connector, solana]);

  const value: WalletContextValue = {
    address: address ?? null,
    connector,
    connectorMeta: getWalletMeta(connector),
    isConnected: !!(address ?? null),
    isConnecting,
    isReady,
    detectedWallets,
    connect,
    disconnect,
    refreshDetected,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <SolanaWalletAdapter>
      <WalletContextProviderInner>{children}</WalletContextProviderInner>
    </SolanaWalletAdapter>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}

export function truncateAddress(addr: string, start = 4, end = 2): string {
  if (!addr || addr.length <= start + end) return addr;
  return `${addr.slice(0, start)}....${addr.slice(-end)}`;
}
