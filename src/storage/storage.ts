import { PERSONALITIES } from "../ai/personalities/presets";
import type { OpponentHabitStats, PokerPersonality } from "../ai/types";
import type { PokerGameState } from "../engine/state/gameState";
import type {
  AggregateStats,
  AppSettings,
  DeckTheme,
  PersistedData,
  StoredHand,
  TrainingRecord,
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
  aiDelayMs: 1000,
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

const ANIMATION_SPEEDS: AppSettings["animationSpeed"][] = [
  "fast",
  "normal",
  "slow",
];
const HINT_STRENGTHS: AppSettings["hintStrength"][] = ["off", "light", "full"];
const THINKING_SPEEDS: PokerPersonality["thinkingSpeed"][] = [
  "fast",
  "normal",
  "slow",
];
const PROFILE_NUMBER_KEYS = [
  "vpip",
  "pfr",
  "aggression",
  "bluffFrequency",
  "callDownTendency",
  "foldToPressure",
  "positionAwareness",
  "potOddsAwareness",
  "stackAwareness",
  "boardTextureAwareness",
  "continuationBetFrequency",
  "doubleBarrelFrequency",
  "checkRaiseFrequency",
  "slowPlayFrequency",
  "trapFrequency",
  "tiltSensitivity",
  "adaptability",
  "variance",
] as const satisfies readonly (keyof PokerPersonality)[];
const HABIT_RATE_KEYS = [
  "vpip",
  "pfr",
  "threeBet",
  "foldToThreeBet",
  "continuationBet",
  "foldToContinuationBet",
  "showdownFrequency",
  "bluffFrequencyEstimate",
  "riverCallFrequency",
] as const satisfies readonly (keyof OpponentHabitStats)[];

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function finiteInRange(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
  integer = false,
): number {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum &&
    (!integer || Number.isInteger(value))
    ? value
    : fallback;
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function enumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function validDeckTheme(
  value: unknown,
  fallback = DEFAULT_SETTINGS.deckTheme,
): DeckTheme {
  return DECK_THEMES.includes(value as DeckTheme)
    ? (value as DeckTheme)
    : fallback;
}

function normalizeBuiltInProfile(
  value: Record<string, unknown>,
  fallback: PokerPersonality,
): PokerPersonality {
  const normalized: PokerPersonality = {
    ...fallback,
    name:
      typeof value.name === "string" && value.name.trim()
        ? value.name
        : fallback.name,
    description:
      typeof value.description === "string"
        ? value.description
        : fallback.description,
    thinkingSpeed: enumValue(
      value.thinkingSpeed,
      THINKING_SPEEDS,
      fallback.thinkingSpeed,
    ),
  };
  PROFILE_NUMBER_KEYS.forEach((key) => {
    normalized[key] = finiteInRange(value[key], fallback[key], 0, 1);
  });
  return normalized;
}

function isValidProfileRecord(value: Record<string, unknown>): boolean {
  return (
    typeof value.id === "string" &&
    Boolean(value.id.trim()) &&
    typeof value.name === "string" &&
    Boolean(value.name.trim()) &&
    typeof value.description === "string" &&
    THINKING_SPEEDS.includes(
      value.thinkingSpeed as PokerPersonality["thinkingSpeed"],
    ) &&
    PROFILE_NUMBER_KEYS.every(
      (key) =>
        typeof value[key] === "number" &&
        Number.isFinite(value[key]) &&
        value[key] >= 0 &&
        value[key] <= 1,
    )
  );
}

function normalizeCustomProfile(
  value: Record<string, unknown>,
): PokerPersonality | null {
  if (!isValidProfileRecord(value)) return null;

  const profile = {
    id: value.id,
    name: value.name,
    description: value.description,
    thinkingSpeed: value.thinkingSpeed,
  } as PokerPersonality;
  PROFILE_NUMBER_KEYS.forEach((key) => {
    profile[key] = value[key] as number;
  });
  return profile;
}

function normalizeAiProfiles(value: unknown): PokerPersonality[] {
  if (!Array.isArray(value))
    return PERSONALITIES.map((profile) => ({ ...profile }));

  if (value.length >= PERSONALITIES.length) {
    const validIds = new Set<string>();
    const allValid = value.every((candidate) => {
      const record = recordValue(candidate);
      if (!isValidProfileRecord(record) || validIds.has(record.id as string))
        return false;
      validIds.add(record.id as string);
      return true;
    });
    if (allValid)
      return value.map((profile) => ({ ...profile })) as PokerPersonality[];
  }

  const presets = new Map(
    PERSONALITIES.map((profile) => [profile.id, profile]),
  );
  const seen = new Set<string>();
  const profiles: PokerPersonality[] = [];
  value.forEach((candidate) => {
    const record = recordValue(candidate);
    if (typeof record.id !== "string" || !record.id.trim()) return;
    if (seen.has(record.id)) return;
    const preset = presets.get(record.id);
    const normalized = preset
      ? normalizeBuiltInProfile(record, preset)
      : normalizeCustomProfile(record);
    if (!normalized) return;
    seen.add(normalized.id);
    profiles.push(normalized);
  });
  PERSONALITIES.forEach((preset) => {
    if (profiles.length >= PERSONALITIES.length) return;
    if (seen.has(preset.id)) return;
    seen.add(preset.id);
    profiles.push({ ...preset });
  });
  return profiles;
}

function normalizeAiHabits(value: unknown): Record<string, OpponentHabitStats> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([id, candidate]) => {
      const record = recordValue(candidate);
      const valid =
        Boolean(id.trim()) &&
        typeof record.hands === "number" &&
        Number.isInteger(record.hands) &&
        record.hands >= 0 &&
        typeof record.aggressionFactor === "number" &&
        Number.isFinite(record.aggressionFactor) &&
        record.aggressionFactor >= 0 &&
        HABIT_RATE_KEYS.every(
          (key) =>
            typeof record[key] === "number" &&
            Number.isFinite(record[key]) &&
            record[key] >= 0 &&
            record[key] <= 1,
        );
      return valid
        ? [[id, { ...record } as unknown as OpponentHabitStats] as const]
        : [];
    }),
  );
}

export function normalizeSettings(
  value: unknown,
  fallback: AppSettings = DEFAULT_SETTINGS,
  validAiIds = new Set(PERSONALITIES.map((profile) => profile.id)),
): AppSettings {
  const candidate = recordValue(value);
  const fallbackSeatCount = finiteInRange(
    fallback.seatCount,
    DEFAULT_SETTINGS.seatCount,
    2,
    6,
    true,
  );
  const seatCount = finiteInRange(
    candidate.seatCount,
    fallbackSeatCount,
    2,
    6,
    true,
  );
  const fallbackStartingStackBb = finiteInRange(
    fallback.startingStackBb,
    DEFAULT_SETTINGS.startingStackBb,
    20,
    500,
  );
  const startingStackBb = finiteInRange(
    candidate.startingStackBb,
    fallbackStartingStackBb,
    20,
    500,
  );
  const fallbackSmallBlind = finiteInRange(
    fallback.smallBlind,
    DEFAULT_SETTINGS.smallBlind,
    0.01,
    Number.MAX_VALUE,
  );
  const fallbackBigBlind = finiteInRange(
    fallback.bigBlind,
    DEFAULT_SETTINGS.bigBlind,
    0.02,
    Number.MAX_VALUE,
  );
  const fallbackBlindsAreSafe =
    fallbackBigBlind > fallbackSmallBlind &&
    Number.isFinite(startingStackBb * fallbackBigBlind * seatCount);
  const safeFallbackSmallBlind = fallbackBlindsAreSafe
    ? fallbackSmallBlind
    : DEFAULT_SETTINGS.smallBlind;
  const safeFallbackBigBlind = fallbackBlindsAreSafe
    ? fallbackBigBlind
    : DEFAULT_SETTINGS.bigBlind;
  let smallBlind = finiteInRange(
    candidate.smallBlind,
    safeFallbackSmallBlind,
    0.01,
    Number.MAX_VALUE,
  );
  let bigBlind = finiteInRange(
    candidate.bigBlind,
    safeFallbackBigBlind,
    0.02,
    Number.MAX_VALUE,
  );
  if (
    bigBlind <= smallBlind ||
    !Number.isFinite(startingStackBb * bigBlind * seatCount)
  ) {
    smallBlind = safeFallbackSmallBlind;
    bigBlind = safeFallbackBigBlind;
  }

  const rawAiIds = candidate.selectedAiIds;
  const availableFallbackAiIds = fallback.selectedAiIds.filter((id) =>
    validAiIds.has(id),
  );
  const safeFallbackAiIds = availableFallbackAiIds.length
    ? availableFallbackAiIds
    : Array.from(validAiIds).slice(0, DEFAULT_SETTINGS.selectedAiIds.length);
  const filteredAiIds = Array.isArray(rawAiIds)
    ? Array.from(
        new Set(
          rawAiIds.filter(
            (id): id is string => typeof id === "string" && validAiIds.has(id),
          ),
        ),
      )
    : [...safeFallbackAiIds];
  const selectedAiIds =
    Array.isArray(rawAiIds) && rawAiIds.length > 0 && filteredAiIds.length === 0
      ? safeFallbackAiIds
      : filteredAiIds;

  return {
    playerName:
      typeof candidate.playerName === "string"
        ? candidate.playerName
        : fallback.playerName,
    seatCount,
    startingStackBb,
    smallBlind,
    bigBlind,
    selectedAiIds: [...selectedAiIds],
    animations: booleanValue(candidate.animations, fallback.animations),
    animationSpeed: enumValue(
      candidate.animationSpeed,
      ANIMATION_SPEEDS,
      fallback.animationSpeed,
    ),
    deckTheme: validDeckTheme(
      candidate.deckTheme,
      validDeckTheme(fallback.deckTheme),
    ),
    autoAi: booleanValue(candidate.autoAi, fallback.autoAi),
    aiDelayMs: finiteInRange(candidate.aiDelayMs, fallback.aiDelayMs, 0, 3000),
    showEquity: booleanValue(candidate.showEquity, fallback.showEquity),
    showPotOdds: booleanValue(candidate.showPotOdds, fallback.showPotOdds),
    showOuts: booleanValue(candidate.showOuts, fallback.showOuts),
    showRecommendedAction: booleanValue(
      candidate.showRecommendedAction,
      fallback.showRecommendedAction,
    ),
    showRecommendedSizing: booleanValue(
      candidate.showRecommendedSizing,
      fallback.showRecommendedSizing,
    ),
    showBoardWarnings: booleanValue(
      candidate.showBoardWarnings,
      fallback.showBoardWarnings,
    ),
    hintStrength: enumValue(
      candidate.hintStrength,
      HINT_STRENGTHS,
      fallback.hintStrength,
    ),
    sound: booleanValue(candidate.sound, fallback.sound),
  };
}

const TRAINING_GRADES = new Set<TrainingRecord["grade"]>([
  "合理",
  "有争议",
  "偏松",
  "偏紧",
  "尺度异常",
  "高风险",
]);

function isTrainingRecord(value: unknown): value is TrainingRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<TrainingRecord>;
  return (
    typeof record.handId === "string" &&
    record.handId.trim().length > 0 &&
    typeof record.createdAt === "string" &&
    Number.isFinite(Date.parse(record.createdAt)) &&
    typeof record.grade === "string" &&
    TRAINING_GRADES.has(record.grade as TrainingRecord["grade"]) &&
    (record.note === undefined || typeof record.note === "string")
  );
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
  const aiProfiles = normalizeAiProfiles(candidate.aiProfiles);
  return {
    version: 2,
    settings: normalizeSettings(
      candidate.settings,
      defaults.settings,
      new Set(aiProfiles.map((profile) => profile.id)),
    ),
    aiProfiles,
    aiHabits: normalizeAiHabits(candidate.aiHabits),
    stats: {
      ...defaults.stats,
      ...(candidate.stats ?? {}),
      byPosition: candidate.stats?.byPosition ?? {},
    },
    recentHands: Array.isArray(candidate.recentHands)
      ? candidate.recentHands.slice(0, 100)
      : [],
    trainingRecords: Array.isArray(candidate.trainingRecords)
      ? candidate.trainingRecords.filter(isTrainingRecord).slice(0, 500)
      : [],
    playerNotes:
      candidate.playerNotes && typeof candidate.playerNotes === "object"
        ? candidate.playerNotes
        : {},
  };
}

export function loadData(storage?: Pick<Storage, "getItem">): PersistedData {
  return loadDataWithRecovery(storage).data;
}

export function migrateDataWithRecovery(raw: unknown): {
  data: PersistedData;
  recovered: boolean;
} {
  const data = migrateData(raw);
  return {
    data,
    recovered: JSON.stringify(raw) !== JSON.stringify(data),
  };
}

export function loadDataWithRecovery(storage?: Pick<Storage, "getItem">): {
  data: PersistedData;
  recovered: boolean;
} {
  if (!storage) return { data: defaultData(), recovered: false };
  try {
    const serialized = storage.getItem(STORAGE_KEY);
    if (!serialized) return { data: defaultData(), recovered: false };
    return migrateDataWithRecovery(JSON.parse(serialized) as unknown);
  } catch {
    return { data: defaultData(), recovered: true };
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
    reachedShowdown &&
    (game.outcome.showdown?.awards.some((award) =>
      award.winnerIds.includes(heroId),
    ) ??
      false);
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
