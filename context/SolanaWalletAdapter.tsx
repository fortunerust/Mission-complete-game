'use client';

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

const SOLANA_RPC_ENDPOINT =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SOLANA_RPC_URL) ||
  clusterApiUrl(WalletAdapterNetwork.Devnet);

/**
 * Wraps children with Solana wallet adapter's ConnectionProvider and WalletProvider.
 * Use this once at app root. For Next.js SSR, wallet adapters are only created on client.
 */
export function SolanaWalletAdapter({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => SOLANA_RPC_ENDPOINT, []);
  const wallets = useMemo(() => {
    if (typeof window === 'undefined') return [];
    return [new PhantomWalletAdapter()];
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        {children}
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
