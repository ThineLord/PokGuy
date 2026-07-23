import { PERSONALITIES } from "../ai/personalities/presets";
import type { OpponentHabitStats } from "../ai/types";
import type { PokerGameState } from "../engine/state/gameState";
import type {
  AggregateStats,
  AppSettings,
  DeckTheme,
  PersistedData,
  StoredHand,
} from "./types";

export const STORAGE_KEY = "riverlab-poker-v2";

export const DEFAULT_SETTINGS: AppSettings = {
  playerName: "Hero",
  seatCount: 6,
  startingStackBb: 100,
  smallBlind: 0.5,
  bigBlind: 1,
  selectedAiIds: ["tag", "lag", "rock", "station", "grinder"],
  animations: true,
  animationSpeed: "normal",
  deckTheme: "river-current",
  autoAi: true,
  aiDelayMs: 420,
  showEquity: false,
  showPotOdds: true,
  showOuts: false,
  showRecommendedAction: false,
  showRecommendedSizing: false,
  showBoardWarnings: true,
  hintStrength: "light",
  sound: false,
};

export const EMPTY_STATS: AggregateStats = {
  hands: 0,
  profitBb: 0,
  vpipOpportunities: 0,
  vpipHands: 0,
  pfrOpportunities: 0,
  pfrHands: 0,
  threeBetOpportunities: 0,
  threeBets: 0,
  cbetOpportunities: 0,
  cbets: 0,
  showdowns: 0,
  showdownWins: 0,
  byPosition: {},
};

const DECK_THEMES: DeckTheme[] = [
  "river-current",
  "burgundy-weave",
  "graphite",
];

function validDeckTheme(value: unknown): DeckTheme {
  return DECK_THEMES.includes(value as DeckTheme)
    ? (value as DeckTheme)
    : DEFAULT_SETTINGS.deckTheme;
}

export function defaultData(): PersistedData {
  return {
    version: 2,
    settings: {
      ...DEFAULT_SETTINGS,
      selectedAiIds: [...DEFAULT_SETTINGS.selectedAiIds],
    },
    aiProfiles: PERSONALITIES.map((profile) => ({ ...profile })),
    aiHabits: {},
    stats: { ...EMPTY_STATS, byPosition: {} },
    recentHands: [],
    trainingRecords: [],
    playerNotes: {},
  };
}

export function migrateData(raw: unknown): PersistedData {
  const defaults = defaultData();
  if (!raw || typeof raw !== "object") return defaults;
  const version = (raw as { version?: unknown }).version;
  if (version !== 1 && version !== 2) return defaults;
  const candidate = raw as Partial<PersistedData>;
  return {
    version: 2,
    settings: {
      ...defaults.settings,
      ...(candidate.settings ?? {}),
      deckTheme: validDeckTheme(candidate.settings?.deckTheme),
    },
    aiProfiles:
      Array.isArray(candidate.aiProfiles) && candidate.aiProfiles.length >= 8
        ? candidate.aiProfiles
        : defaults.aiProfiles,
    aiHabits:
      candidate.aiHabits && typeof candidate.aiHabits === "object"
        ? candidate.aiHabits
        : {},
    stats: {
      ...defaults.stats,
      ...(candidate.stats ?? {}),
      byPosition: candidate.stats?.byPosition ?? {},
    },
    recentHands: Array.isArray(candidate.recentHands)
      ? candidate.recentHands.slice(0, 100)
      : [],
    trainingRecords: Array.isArray(candidate.trainingRecords)
      ? candidate.trainingRecords
      : [],
    playerNotes:
      candidate.playerNotes && typeof candidate.playerNotes === "object"
        ? candidate.playerNotes
        : {},
  };
}

export function loadData(storage?: Pick<Storage, "getItem">): PersistedData {
  if (!storage) return defaultData();
  try {
    const serialized = storage.getItem(STORAGE_KEY);
    return serialized ? migrateData(JSON.parse(serialized)) : defaultData();
  } catch {
    return defaultData();
  }
}

export function saveData(
  data: PersistedData,
  storage?: Pick<Storage, "setItem">,
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...data, version: 2 }));
    return true;
  } catch {
    return false;
  }
}

function heroStatsFor(game: PokerGameState, heroId: string) {
  const preflop = game.actions.filter(
    (action) => action.playerId === heroId && action.street === "preflop",
  );
  return {
    vpip: preflop.some((action) =>
      ["call", "bet", "raise", "all-in"].includes(action.action.type),
    ),
    pfr: preflop.some((action) =>
      ["bet", "raise", "all-in"].includes(action.action.type),
    ),
  };
}

function runningRate(
  previous: number,
  hands: number,
  observed: boolean,
  priorWeight = 20,
): number {
  const weightedHands = hands + priorWeight;
  return (previous * weightedHands + Number(observed)) / (weightedHands + 1);
}

function updateAiHabits(
  data: PersistedData,
  game: PokerGameState,
  tags: Record<string, string[]>,
): Record<string, OpponentHabitStats> {
  const updated = { ...data.aiHabits };
  game.players
    .filter((player) => player.kind === "ai")
    .forEach((player) => {
      const habitId = player.personalityId ?? player.id;
      const previous = updated[habitId] ?? {
        hands: 0,
        vpip:
          data.aiProfiles.find((profile) => profile.id === player.personalityId)
            ?.vpip ?? 0.25,
        pfr:
          data.aiProfiles.find((profile) => profile.id === player.personalityId)
            ?.pfr ?? 0.18,
        threeBet: 0.08,
        foldToThreeBet: 0.5,
        continuationBet: 0.55,
        foldToContinuationBet: 0.45,
        aggressionFactor: 1.5,
        showdownFrequency: 0.3,
        bluffFrequencyEstimate: 0.15,
        riverCallFrequency: 0.45,
      };
      const actions = game.actions.filter(
        (action) => action.playerId === player.id,
      );
      const preflop = actions.filter((action) => action.street === "preflop");
      const aggressive = actions.filter((action) =>
        ["bet", "raise", "all-in"].includes(action.action.type),
      ).length;
      const calls = actions.filter(
        (action) => action.action.type === "call",
      ).length;
      const preflopRaises = game.actions.filter(
        (action) =>
          action.street === "preflop" &&
          ["raise", "all-in"].includes(action.action.type),
      );
      const playerRaiseIndex = preflopRaises.findIndex(
        (action) => action.playerId === player.id,
      );
      const atShowdown =
        game.outcome?.showdown?.evaluations[player.id] !== undefined;
      const bluffed = Object.entries(tags).some(
        ([key, values]) =>
          key.includes(player.id) && values.includes("high-fold-equity"),
      );
      const riverCall = actions.some(
        (action) => action.street === "river" && action.action.type === "call",
      );
      const hands = previous.hands;
      updated[habitId] = {
        hands: hands + 1,
        vpip: runningRate(
          previous.vpip,
          hands,
          preflop.some((action) =>
            ["call", "raise", "all-in"].includes(action.action.type),
          ),
        ),
        pfr: runningRate(
          previous.pfr,
          hands,
          preflop.some((action) =>
            ["raise", "all-in"].includes(action.action.type),
          ),
        ),
        threeBet: runningRate(previous.threeBet, hands, playerRaiseIndex >= 1),
        foldToThreeBet: previous.foldToThreeBet,
        continuationBet: runningRate(
          previous.continuationBet,
          hands,
          actions.some(
            (action) =>
              action.street === "flop" &&
              ["bet", "raise"].includes(action.action.type),
          ),
        ),
        foldToContinuationBet: previous.foldToContinuationBet,
        aggressionFactor:
          (previous.aggressionFactor * (hands + 20) +
            aggressive / Math.max(1, calls)) /
          (hands + 21),
        showdownFrequency: runningRate(
          previous.showdownFrequency,
          hands,
          atShowdown,
        ),
        bluffFrequencyEstimate: runningRate(
          previous.bluffFrequencyEstimate,
          hands,
          bluffed,
        ),
        riverCallFrequency: runningRate(
          previous.riverCallFrequency,
          hands,
          riverCall,
        ),
      };
    });
  return updated;
}

export function appendCompletedHand(
  data: PersistedData,
  game: PokerGameState,
  heroId: string,
  aiDecisionTags: Record<string, string[]> = {},
): PersistedData {
  if (!game.outcome || !game.settled) return data;
  if (data.recentHands.some((hand) => hand.id === game.handId)) return data;
  const hero = game.players.find((player) => player.id === heroId);
  if (!hero) return data;
  const profitBb = (hero.stack - hero.startingStack) / game.bigBlind;
  const preflop = heroStatsFor(game, heroId);
  const heroPreflopRaises = game.actions.filter(
    (action) =>
      action.street === "preflop" &&
      ["raise", "all-in"].includes(action.action.type),
  );
  const heroRaiseIndex = heroPreflopRaises.findIndex(
    (action) => action.playerId === heroId,
  );
  const threeBetOpportunity = heroPreflopRaises.some(
    (action) => action.playerId !== heroId,
  );
  const wasPreflopAggressor =
    [...heroPreflopRaises].at(-1)?.playerId === heroId;
  const reachedFlop = game.actions.some((action) => action.street === "flop");
  const cbet = game.actions.some(
    (action) =>
      action.playerId === heroId &&
      action.street === "flop" &&
      ["bet", "raise"].includes(action.action.type),
  );
  const position = hero.positionLabel || "Unknown";
  const previousPosition = data.stats.byPosition[position] ?? {
    hands: 0,
    profitBb: 0,
    vpip: 0,
    pfr: 0,
  };
  const reachedShowdown =
    game.outcome.reason === "showdown" &&
    game.outcome.showdown?.evaluations[heroId] !== undefined;
  const wonShowdown =
    reachedShowdown && (game.outcome.payouts[heroId] ?? 0) > 0;
  const stats: AggregateStats = {
    ...data.stats,
    hands: data.stats.hands + 1,
    profitBb: data.stats.profitBb + profitBb,
    vpipOpportunities: data.stats.vpipOpportunities + 1,
    vpipHands: data.stats.vpipHands + Number(preflop.vpip),
    pfrOpportunities: data.stats.pfrOpportunities + 1,
    pfrHands: data.stats.pfrHands + Number(preflop.pfr),
    threeBetOpportunities:
      data.stats.threeBetOpportunities + Number(threeBetOpportunity),
    threeBets: data.stats.threeBets + Number(heroRaiseIndex >= 1),
    cbetOpportunities:
      data.stats.cbetOpportunities + Number(wasPreflopAggressor && reachedFlop),
    cbets:
      data.stats.cbets + Number(wasPreflopAggressor && reachedFlop && cbet),
    showdowns: data.stats.showdowns + Number(reachedShowdown),
    showdownWins: data.stats.showdownWins + Number(wonShowdown),
    byPosition: {
      ...data.stats.byPosition,
      [position]: {
        hands: previousPosition.hands + 1,
        profitBb: previousPosition.profitBb + profitBb,
        vpip: previousPosition.vpip + Number(preflop.vpip),
        pfr: previousPosition.pfr + Number(preflop.pfr),
      },
    },
  };
  const stored: StoredHand = {
    id: game.handId,
    startedAt: new Date(
      Number(game.handId.split("-").at(-1)) || Date.now(),
    ).toISOString(),
    completedAt: new Date().toISOString(),
    game,
    heroProfitBb: profitBb,
    aiDecisionTags,
  };
  return {
    ...data,
    stats,
    aiHabits: updateAiHabits(data, game, aiDecisionTags),
    recentHands: [stored, ...data.recentHands].slice(0, 100),
  };
}
