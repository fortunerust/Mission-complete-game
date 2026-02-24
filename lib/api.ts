import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Transaction types for backend (saved in MongoDB). */
export type TransactionType =
  | 'pack_purchase'
  | 'mission_start'
  | 'mission_complete'
  | string;

export const gameAPI = {
  getPlayer: (wallet: string) => api.get('/player', { params: { wallet } }),
  updatePlayer: (wallet: string, data: Record<string, unknown>) =>
    api.patch('/player', { wallet, ...data }),
  getMissions: (mapId?: string) =>
    api.get('/missions', mapId != null ? { params: { mapId } } : {}),
  getMaps: () => api.get('/maps'),
  getCharacters: () => api.get('/characters'),
  purchasePacks: (user: string, type: TransactionType, quantity: number, totalCost: number, txSignature: string) => api.post('/packs/purchase', { user, type, quantity, totalCost, txSignature }),
  /** Record a user transaction (saved in DB by type). */
  recordTransaction: (
    user: string,
    type: TransactionType,
    payload?: Record<string, unknown>,
    txSignature?: string
  ) =>
    api.post('/transactions', {
      user,
      type,
      payload: payload ?? {},
      txSignature: txSignature ?? undefined,
    }),
  getTransactions: (params?: { user?: string; type?: string; limit?: number }) =>
    api.get('/transactions', { params }),
  getGameHistory: (wallet: string, status?: 'in_progress' | 'completed') =>
    api.get('/game-history', { params: { wallet, ...(status && { status }) } }),
  startGame: (wallet: string, missionId: string) =>
    api.post('/game-history', { wallet, missionId }),
  /** Fetch recent mission completions for this wallet (from cron). Consumes and returns; use when mission completes in UI. */
  getRecentCompletions: (wallet: string) =>
    api.get('/game-history/recent-completions', { params: { wallet } }),
};

export default api;
