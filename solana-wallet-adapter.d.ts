/**
 * Type declarations for @solana/wallet-adapter-react when the package is not yet installed.
 * Run: npm install
 * After install, the package's own types will be used.
 */
declare module '@solana/wallet-adapter-react' {
  import type { ReactNode } from 'react';

  export interface WalletAdapter {
    name: string;
    publicKey: { toBase58(): string; toString(): string } | null;
  }

  export interface Wallet {
    adapter: WalletAdapter;
  }

  export interface WalletContextState {
    publicKey: { toBase58(): string; toString(): string } | null;
    wallet: Wallet | null;
    wallets: Wallet[];
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    select: (walletName: string) => void;
    sendTransaction: (
      transaction: import('@solana/web3.js').Transaction,
      connection: import('@solana/web3.js').Connection,
      options?: { skipPreflight?: boolean; maxRetries?: number }
    ) => Promise<string>;
    connecting: boolean;
    connected: boolean;
  }

  export function useWallet(): WalletContextState;
  export function useConnection(): { connection: import('@solana/web3.js').Connection };
  export function ConnectionProvider(props: { endpoint: string; children: ReactNode }): JSX.Element;
  export function WalletProvider(props: { wallets: unknown[]; autoConnect?: boolean; children: ReactNode }): JSX.Element;
}

declare module '@solana/wallet-adapter-wallets' {
  export class PhantomWalletAdapter {}
  export class SolflareWalletAdapter {}
}

declare module '@solana/web3.js' {
  export function clusterApiUrl(network: unknown): string;
  export class PublicKey {
    constructor(value: string | Uint8Array | number[]);
    toBase58(): string;
    toString(): string;
  }
  export class Transaction {
    add(...items: TransactionInstruction[]): void;
  }
  export interface TransactionInstruction {
    keys: unknown[];
    programId: PublicKey;
    data: Buffer | Uint8Array;
  }
  export class Connection {
    getParsedTokenAccountsByOwner(
      owner: PublicKey,
      filter: { mint?: PublicKey; programId?: PublicKey }
    ): Promise<{
      value: Array<{
        account: {
          data: {
            parsed?: {
              info?: {
                tokenAmount?: {
                  amount: string;
                  decimals: number;
                  uiAmount: number | null;
                  uiAmountString: string;
                };
              };
            };
          };
        };
      }>;
    }>;
    confirmTransaction(signature: string, commitment?: string): Promise<unknown>;
  }
}

declare module '@solana/wallet-adapter-base' {
  export enum WalletAdapterNetwork {
    Mainnet = 'mainnet-beta',
    Devnet = 'devnet',
    Testnet = 'testnet',
  }
}
