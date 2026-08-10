export type HouseType = 'LOTUS' | 'CRANE' | 'RONIN';

export interface HouseCard {
  id: string;
  type: HouseType;
  nameVi: string;
  descriptionVi: string;
  icon: string;
}

export type CardRank = 1 | 2 | 3 | 4;

export type EffectType =
  | 'SPY_HOUSE'          // Look at player's house card
  | 'SPY_DECK'           // Look at top 2 deck cards
  | 'SPY_CLAN_CHECK'     // Check if target is Lotus/Crane
  | 'SWAP_HOUSE'         // Swap house cards between 2 players
  | 'FORCE_REVEAL'       // Force 1 player to publicly reveal house
  | 'MIND_SHIFT'         // Swap hand cards with another player
  | 'ASSASSINATE'        // Try to kill target player
  | 'TWIN_BLADES'        // Kill adjacent left/right player
  | 'POISON_SHURIKEN'    // Kill target player + bonus honor token if success
  | 'IRON_GUARD'         // Protect self from assassinations this round
  | 'SUBSTITUTION'       // Deflect assassination onto another player
  | 'RETALIATION'        // If killed this round, kill your assassin back!
  | 'HONOR_THIEF';       // Steal 1 honor token from a surviving player

export interface NinjaCard {
  id: string;
  name: string;
  nameVi: string;
  rank: CardRank;
  rankNameVi: string;
  descriptionVi: string;
  effectType: EffectType;
  requiresTarget: boolean;
  targetType?: 'ANY_PLAYER' | 'OTHER_PLAYER' | 'ADJACENT_PLAYER' | 'TWO_PLAYERS';
  icon: string;
  flavorQuoteVi?: string;
}

export interface HonorToken {
  id: string;
  value: number; // 2, 3, 4, or 5 points
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isBot: boolean;
  isHost: boolean;
  isReady: boolean;
  
  // Secret/Game State
  house: HouseCard | null;
  revealedHouse: boolean;
  isAlive: boolean;
  
  // Hand & Selection
  draftHand: NinjaCard[];
  selectedCards: NinjaCard[]; // Up to 3 cards picked during drafting phase
  playedCardsThisPhase: NinjaCard[];
  
  // Status flags during execution
  isProtected: boolean; // From Iron Guard
  substituteTargetId?: string; // From Substitution
  retaliateOnDeath: boolean; // From Retaliation
  
  // Scoring
  honorTokens: HonorToken[];
  totalScore: number;
  killsThisRound: number;
}

export interface ActionLogEntry {
  id: string;
  timestamp: string;
  phase?: CardRank | 'DRAFT' | 'ROUND_START' | 'ROUND_END';
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

export type GameMode = 'SOLO_BOTS' | 'PASS_AND_PLAY' | 'ONLINE_ROOM';

export interface GameState {
  roomCode: string;
  status: GameStatus;
  gameMode: GameMode;
  currentRound: number; // 1, 2, or 3
  maxRounds: number; // 3
  
  // Execution Sub-phase
  executionRank: CardRank; // 1, 2, 3, or 4
  executionStep: number; // Index of current acting card in queue
  
  // Pass & Play active turn tracker
  passAndPlayCurrentPlayerId: string | null;
  passAndPlayRevealed: boolean;

  players: Player[];
  honorDeck: HonorToken[];
  ninjaDeck: NinjaCard[];
  
  // Round results
  roundWinnerClan: HouseType | 'DRAW' | null;
  roundSummaryLogs: string[];
  actionLogs: ActionLogEntry[];

  // Information visible only to the player who triggered a secret effect.
  privateNotices?: Record<string, string[]>;
  
  // Bot belief state for Bot AI (stored on server/local engine)
  botBeliefs?: Record<string, Record<string, { LOTUS: number; CRANE: number; RONIN: number }>>;
}
