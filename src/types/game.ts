export type HouseType = 'LOTUS' | 'CRANE' | 'RONIN';

export interface HouseCard {
  id: string;
  type: HouseType;
  rank: number | null;
  nameVi: string;
  descriptionVi: string;
  icon: string;
}

export type NinjaPhase = 'SPY' | 'MYSTIC' | 'TRICKSTER' | 'BLIND_ASSASSIN' | 'SHINOBI';
export type CardPriority = 1 | 2 | 3 | 4 | 5 | 6;
export type NinjaCardType = 'NORMAL' | 'TRICKSTER' | 'REACTION' | 'REVEAL';

export type EffectType =
  | 'LOOK_HOUSE'
  | 'LOOK_HOUSE_AND_NINJA'
  | 'SHAPESHIFTER'
  | 'GRAVE_DIGGER'
  | 'TROUBLEMAKER'
  | 'SPIRIT_MERCHANT'
  | 'THIEF'
  | 'JUDGE_KILL'
  | 'BLIND_ASSASSIN_KILL'
  | 'SHINOBI_KILL'
  | 'MIRROR_MONK'
  | 'MARTYR'
  | 'MASTERMIND';

export type CardTargetType = 'OTHER_PLAYER' | 'TWO_PLAYERS' | 'DISCARD_CARD';

export interface NinjaCard {
  id: string;
  name: string;
  nameVi: string;
  cardType: NinjaCardType;
  phase: NinjaPhase | null;
  priority: CardPriority | null;
  phaseNameVi: string;
  descriptionVi: string;
  effectType: EffectType;
  requiresTarget: boolean;
  targetType?: CardTargetType;
  icon: string;
  flavorQuoteVi?: string;
}

export interface HonorToken {
  id: string;
  value: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isBot: boolean;
  isHost: boolean;
  isReady: boolean;
  house: HouseCard | null;
  revealedHouse: boolean;
  /** True after Shapeshifter swaps this player's House; even its owner cannot inspect it. */
  unknownCurrentHouse: boolean;
  isAlive: boolean;
  draftHand: NinjaCard[];
  selectedCards: NinjaCard[];
  playedCardsThisPhase: NinjaCard[];
  honorTokens: HonorToken[];
  totalScore: number;
  killsThisRound: number;
}

export interface ActionLogEntry {
  id: string;
  timestamp: string;
  phase?: NinjaPhase | 'DRAFT' | 'ROUND_START' | 'ROUND_END';
  messageVi: string;
  type: 'INFO' | 'ACTION' | 'KILL' | 'DEFENSE' | 'REVEAL' | 'HONOR';
  actorId?: string;
  targetId?: string;
}

export type GameStatus =
  | 'LOBBY'
  | 'HOUSE_DEALING'
  | 'DRAFTING'
  | 'CARD_SELECTION'
  | 'EXECUTION'
  | 'ROUND_SUMMARY'
  | 'GAME_OVER';

export type GameMode = 'SOLO_BOTS' | 'ONLINE_ROOM';

export interface GameState {
  roomCode: string;
  status: GameStatus;
  gameMode: GameMode;
  currentRound: number;
  draftPickNumber: 1 | 2;
  executionPhase: NinjaPhase;
  executionStep: number;
  players: Player[];
  honorDeck: HonorToken[];
  ninjaDeck: NinjaCard[];
  ninjaDiscardPile: NinjaCard[];
  roundWinnerClan: HouseType | 'DRAW' | null;
  roundSummaryLogs: string[];
  actionLogs: ActionLogEntry[];
  privateNotices?: Record<string, string[]>;
  gameWinners?: string[];
  botBeliefs?: Record<string, Record<string, { LOTUS: number; CRANE: number; RONIN: number }>>;
}
