'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY_IMAGE = 'lm_character_image';
const STORAGE_KEY_NAME = 'lm_character_name';

const DEFAULT_IMAGE = '/images/characters/chad.svg';
const DEFAULT_NAME = 'CHAD';

interface CharacterContextValue {
  characterImage: string;
  characterName: string;
  setCharacter: (image: string, name: string) => void;
}

const CharacterContext = createContext<CharacterContextValue | null>(null);

export function CharacterProvider({ children }: { children: React.ReactNode }) {
  const [characterImage, setCharacterImage] = useState(DEFAULT_IMAGE);
  const [characterName, setCharacterName] = useState(DEFAULT_NAME);

  useEffect(() => {
    try {
      const img = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_IMAGE) : null;
      const name = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_NAME) : null;
      if (img) setCharacterImage(img);
      if (name) setCharacterName(name);
    } catch {
      // ignore
    }
  }, []);

  const setCharacter = useCallback((image: string, name: string) => {
    setCharacterImage(image);
    setCharacterName(name);
    try {
      localStorage.setItem(STORAGE_KEY_IMAGE, image);
      localStorage.setItem(STORAGE_KEY_NAME, name);
    } catch {
      // ignore
    }
  }, []);

  const value: CharacterContextValue = {
    characterImage,
    characterName,
    setCharacter,
  };

  return <CharacterContext.Provider value={value}>{children}</CharacterContext.Provider>;
}

export function useCharacter(): CharacterContextValue {
  const ctx = useContext(CharacterContext);
  if (!ctx) {
    return {
      characterImage: DEFAULT_IMAGE,
      characterName: DEFAULT_NAME,
      setCharacter: () => {},
    };
  }
  return ctx;
}
