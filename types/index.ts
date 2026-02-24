export interface Player {
  name: string;
  physique: number;
  cards: {
    used: number;
    total: number;
  };
  packs: number;
  energy: number;
  currency: number;
  slots: {
    used: number;
    total: number;
  };
}

export interface Mission {
  _id?: string;
  /** Map this mission belongs to (1 = Beach Side, 2 = Miami Nights, 3 = City Lights). Missions are unique per map. */
  mapId: string;
  order: number;
  name: string;
  description: string;
  duration: string;  
  yield: number;
  stars: number;
  imageSrc: string;
}

export interface Card {
  _id?: string;
  name: string;
  value: string;
  type: 'blue' | 'pink';
  imageBg?: string;
  imageItem?: string;
  stats: {
    physique: number;
    strength: number;
    charisma: number;
    rizz: number;
  };
}

export interface Map {
  _id?: string;
  name: string;
  imageSrc: string;
  order: number;
  unlocked: boolean;
  selected: boolean;
}

export interface Character {
  _id?: string;
  name: string;
  imageSrc: string;
  level: number;
  order: number;
}

export interface PackData {
  price: number;
}

/** In-progress or completed game from backend (missionId may be populated as mission). */
export interface GameHistoryEntry {
  _id?: string;
  player: string;
  missionId: string | Mission;
  gameStation: 'in_progress' | 'completed';
  startTime: string;
  endTime: string;
  completedAt?: string;
  expAwarded?: number;
}

export interface CardHistory {
  _id?: string;
  user: string;
  cardId: string | Card;
  action: 'purchase' | 'use';
}