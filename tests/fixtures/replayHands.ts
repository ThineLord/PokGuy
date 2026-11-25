import type { Card, Rank, Suit } from "../../src/engine/cards/cards";
import { createDeck } from "../../src/engine/deck/deck";
import {
  act,
  startHand,
  startTrainingScenario,
  type PokerGameState,
  type TablePlayerInput,
} from "../../src/engine/state/gameState";
import { appendCompletedHand, defaultData } from "../../src/storage/storage";
import type { PersistedData } from "../../src/storage/types";

export const RUNOUT_BOARD: Card[] = [
  { rank: 9, suit: "diamonds" },
  { rank: 9, suit: "hearts" },
  { rank: 13, suit: "diamonds" },
  { rank: 3, suit: "hearts" },
  { rank: 8, suit: "hearts" },
];

export const FLOP_BOARD: Card[] = [
  { rank: 14, suit: "hearts" },
  { rank: 7, suit: "clubs" },
  { rank: 2, suit: "diamonds" },
];

export const RIVER_BOARD: Card[] = [
  { rank: 14, suit: "spades" },
  { rank: 13, suit: "spades" },
  { rank: 12, suit: "spades" },
  { rank: 11, suit: "spades" },
  { rank: 9, suit: "clubs" },
];

function card(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

function withPrefix(prefix: readonly Card[]): Card[] {
  const seen = new Set(prefix.map((item) => `${item.rank}-${item.suit}`));
  if (seen.size !== prefix.length) throw new Error("Duplicate deck prefix");
  const rest = createDeck().filter(
    (item) => !seen.has(`${item.rank}-${item.suit}`),
  );
  return [...prefix.map((item) => ({ ...item })), ...rest];
}

function headsUp(stack: number): TablePlayerInput[] {
  return [
    { id: "button", name: "Button", seat: 0, stack, kind: "human" },
    { id: "bb", name: "Big Blind", seat: 1, stack, kind: "ai" },
  ];
}

function actAs(
  game: PokerGameState,
  action: "fold" | "check" | "call" | "all-in",
) {
  const actor = game.actingPlayerId;
  if (!actor) throw new Error("No player is facing a decision");
  return act(game, actor, { type: action });
}

export function buttonShoveRunout(): PokerGameState {
  const deck = withPrefix([
    card(14, "clubs"),
    card(14, "diamonds"),
    card(13, "clubs"),
    card(14, "hearts"),
    card(2, "clubs"),
    RUNOUT_BOARD[0],
    RUNOUT_BOARD[1],
    RUNOUT_BOARD[2],
    card(2, "diamonds"),
    RUNOUT_BOARD[3],
    card(2, "hearts"),
    RUNOUT_BOARD[4],
  ]);
  let game = startHand({
    players: headsUp(10),
    dealerSeat: 0,
    smallBlind: 0.5,
    bigBlind: 1,
    seed: 1126,
    deck,
    handId: "hand-timeline-runout",
  });
  game = actAs(game, "all-in");
  game = actAs(game, "call");
  return game;
}

export function singleFold(): PokerGameState {
  return actAs(
    startHand({
      players: headsUp(10),
      dealerSeat: 0,
      smallBlind: 0.5,
      bigBlind: 1,
      seed: 7,
      handId: "hand-timeline-fold",
    }),
    "fold",
  );
}

export function forcedBlindRunout(): PokerGameState {
  return startHand({
    players: [
      { id: "button", name: "Button", seat: 0, stack: 0.5, kind: "human" },
      { id: "bb", name: "Big Blind", seat: 1, stack: 1, kind: "ai" },
    ],
    dealerSeat: 0,
    smallBlind: 0.5,
    bigBlind: 1,
    seed: 3,
    handId: "hand-timeline-forced",
  });
}

export function flopStreetFold(): PokerGameState {
  let game = startTrainingScenario({
    players: [
      { id: "hero", name: "Hero", seat: 0, stack: 100, kind: "human" },
      { id: "villain", name: "Villain", seat: 1, stack: 100, kind: "ai" },
    ],
    dealerSeat: 0,
    smallBlind: 0.5,
    bigBlind: 1,
    heroId: "hero",
    startStreet: "flop",
    board: FLOP_BOARD,
    seed: 11,
    handId: "scenario-timeline-flop",
  });
  game = actAs(game, "check");
  game = actAs(game, "check");
  return actAs(game, "fold");
}

export function flopAllInRunout(): PokerGameState {
  let game = startTrainingScenario({
    players: [
      { id: "hero", name: "Hero", seat: 0, stack: 10, kind: "human" },
      { id: "villain", name: "Villain", seat: 1, stack: 10, kind: "ai" },
    ],
    dealerSeat: 0,
    smallBlind: 0.5,
    bigBlind: 1,
    heroId: "hero",
    startStreet: "flop",
    board: FLOP_BOARD,
    seed: 19,
    handId: "scenario-timeline-runout",
  });
  game = actAs(game, "all-in");
  return actAs(game, "call");
}

export function flopForcedRunout(): PokerGameState {
  return startTrainingScenario({
    players: [
      { id: "hero", name: "Hero", seat: 0, stack: 1, kind: "human" },
      { id: "villain", name: "Villain", seat: 1, stack: 1, kind: "ai" },
    ],
    dealerSeat: 0,
    smallBlind: 0.5,
    bigBlind: 1,
    heroId: "hero",
    startStreet: "flop",
    board: FLOP_BOARD,
    seed: 23,
    handId: "scenario-timeline-forced",
  });
}

export function riverStartFold(): PokerGameState {
  return actAs(
    startTrainingScenario({
      players: [
        { id: "hero", name: "Hero", seat: 0, stack: 100, kind: "human" },
        { id: "villain", name: "Villain", seat: 1, stack: 100, kind: "ai" },
      ],
      dealerSeat: 0,
      smallBlind: 0.5,
      bigBlind: 1,
      heroId: "hero",
      startStreet: "river",
      board: RIVER_BOARD,
      seed: 29,
      handId: "scenario-timeline-river",
    }),
    "fold",
  );
}

export function timelineHistory(): PersistedData {
  const data = defaultData();
  data.settings = {
    ...data.settings,
    seatCount: 2,
    autoAi: false,
    animations: false,
  };
  const fold = singleFold();
  const runout = buttonShoveRunout();
  const stored = appendCompletedHand(
    appendCompletedHand(data, fold, "button"),
    runout,
    "button",
  );
  return {
    ...stored,
    trainingRecords: [
      {
        handId: fold.handId,
        createdAt: "2026-11-25T12:00:00.000Z",
        grade: "偏紧",
      },
    ],
  };
}
