'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY_RESOLUTION = 'lm_game_resolution';

const DEFAULT_RESOLUTION = '1920x1444';

export function parseResolution(value: string): { width: number; height: number } {
  const match = value.match(/^(\d+)\s*x\s*(\d+)$/i) || value.match(/^(\d+)x(\d+)$/i) || value.match(/^(\d+)\s*×\s*(\d+)$/i);
  if (match) {
    const w = parseInt(match[1], 10);
    const h = parseInt(match[2], 10);
    if (w > 0 && h > 0) return { width: w, height: h };
  }
  return { width: 1920, height: 1444 };
}

interface GameSettingsContextValue {
  resolution: string;
  setResolution: (value: string) => void;
  resolutionSize: { width: number; height: number };
}

const GameSettingsContext = createContext<GameSettingsContextValue | null>(null);

export function GameSettingsProvider({ children }: { children: React.ReactNode }) {
  const [resolution, setResolutionState] = useState(DEFAULT_RESOLUTION);

  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_RESOLUTION) : null;
      if (stored) setResolutionState(stored);
    } catch {
      // ignore
    }
  }, []);

  const setResolution = useCallback((value: string) => {
    setResolutionState(value);
    try {
      localStorage.setItem(STORAGE_KEY_RESOLUTION, value);
    } catch {
      // ignore
    }
  }, []);

  const resolutionSize = parseResolution(resolution);

  const value: GameSettingsContextValue = {
    resolution,
    setResolution,
    resolutionSize,
  };

  return <GameSettingsContext.Provider value={value}>{children}</GameSettingsContext.Provider>;
}

export function useGameSettings(): GameSettingsContextValue {
  const ctx = useContext(GameSettingsContext);
  if (!ctx) {
    const size = parseResolution(DEFAULT_RESOLUTION);
    return {
      resolution: DEFAULT_RESOLUTION,
      setResolution: () => {},
      resolutionSize: size,
    };
  }
  return ctx;
}
