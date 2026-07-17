import type { PokerPersonality } from "../ai/types";
import type { OpponentHabitStats } from "../ai/types";
import type { PokerGameState } from "../engine/state/gameState";

export interface AppSettings {
  playerName: string;
  seatCount: number;
  startingStackBb: number;
  smallBlind: number;
  bigBlind: number;
  selectedAiIds: string[];
  animations: boolean;
  animationSpeed: "fast" | "normal" | "slow";
  autoAi: boolean;
  aiDelayMs: number;
  showEquity: boolean;
  showPotOdds: boolean;
  showOuts: boolean;
  showRecommendedAction: boolean;
  showRecommendedSizing: boolean;
  showBoardWarnings: boolean;
  hintStrength: "off" | "light" | "full";
  sound: boolean;
}

export interface StoredHand {
  id: string;
  startedAt: string;
  completedAt: string;
  game: PokerGameState;
  heroProfitBb: number;
  trainingGrade?: string;
  aiDecisionTags: Record<string, string[]>;
}

export interface AggregateStats {
  hands: number;
  profitBb: number;
  vpipOpportunities: number;
  vpipHands: number;
  pfrOpportunities: number;
  pfrHands: number;
  threeBetOpportunities: number;
  threeBets: number;
  cbetOpportunities: number;
  cbets: number;
  showdowns: number;
  showdownWins: number;
  byPosition: Record<
    string,
    { hands: number; profitBb: number; vpip: number; pfr: number }
  >;
}

export interface TrainingRecord {
  handId: string;
  createdAt: string;
  grade: "合理" | "有争议" | "偏松" | "偏紧" | "尺度异常" | "高风险";
  note?: string;
}

export interface PersistedData {
  version: 2;
  settings: AppSettings;
  aiProfiles: PokerPersonality[];
  aiHabits: Record<string, OpponentHabitStats>;
  stats: AggregateStats;
  recentHands: StoredHand[];
  trainingRecords: TrainingRecord[];
  playerNotes: Record<string, string>;
}
