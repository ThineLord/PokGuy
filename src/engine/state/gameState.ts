import { assertUniqueCards, type Card } from "../cards/cards";
import { amountToCall } from "../betting/actionValidator";
import {
  applyBettingAction,
  beginNextStreet,
  isRoundComplete,
} from "../betting/bettingEngine";
import type {
  BettingPlayer,
  BettingRoundState,
  PokerAction,
  Street,
} from "../betting/types";
import { createDeck, shuffleDeck } from "../deck/deck";
import { SeededRandom, systemRandom, type RandomSource } from "../deck/random";
import { calculatePotStructure, type SidePot } from "../pots/sidePots";
import {
  awardUncontestedPot,
  resolveShowdown,
  type ShowdownResult,
} from "../showdown/showdown";
import {
  assignForcedPositions,
  firstToActPostflop,
  firstToActPreflop,
  nextSeat,
  type SeatRef,
} from "./positions";

const CHIP_EPSILON = 1e-9;

export interface TablePlayerInput {
  id: string;
  name: string;
  seat: number;
  stack: number;
  kind: "human" | "ai";
  personalityId?: string;
}

export interface HandPlayer extends BettingPlayer {
  name: string;
  kind: "human" | "ai";
  personalityId?: string;
  holeCards: Card[];
  startingStack: number;
  positionLabel: string;
  lastAction: string | null;
}

export interface ActionRecord {
  sequence: number;
  street: Street;
  playerId: string;
  action: PokerAction;
  potBefore: number;
  potAfter: number;
  board: Card[];
}

export interface HandOutcome {
  reason: "folds" | "showdown";
  payouts: Record<string, number>;
  pots: SidePot[];
  uncalledReturns?: Record<string, number>;
  showdown?: ShowdownResult;
}

export interface PokerGameState extends BettingRoundState {
  handId: string;
  dealerSeat: number;
  smallBlind: number;
  deck: Card[];
  board: Card[];
  burnCards: Card[];
  players: HandPlayer[];
  actions: ActionRecord[];
  outcome: HandOutcome | null;
  settled: boolean;
  seed: number;
}

export interface StartHandOptions {
  players: TablePlayerInput[];
  dealerSeat: number;
  smallBlind: number;
  bigBlind: number;
  seed?: number;
  deck?: Card[];
  handId?: string;
}

export interface TrainingScenarioOptions extends Omit<
  StartHandOptions,
  "deck"
> {
  heroId: string;
  heroHoleCards?: [Card, Card];
  board?: Card[];
  startStreet: "preflop" | "flop" | "turn" | "river";
}

function activeSeats(players: TablePlayerInput[]): SeatRef[] {
  return players
    .filter((player) => player.stack > 0)
    .map((player) => ({ id: player.id, seat: player.seat }));
}

function labelPositions(
  players: TablePlayerInput[],
  dealerSeat: number,
): Record<string, string> {
  const seats = activeSeats(players);
  const { button, smallBlind, bigBlind } = assignForcedPositions(
    seats,
    dealerSeat,
  );
  const labels: Record<string, string> = {
    [button.id]: seats.length === 2 ? "BTN / SB" : "BTN",
  };
  labels[smallBlind.id] = smallBlind.id === button.id ? "BTN / SB" : "SB";
  labels[bigBlind.id] = "BB";
  if (seats.length > 3) {
    const middleLabels =
      seats.length === 4
        ? ["CO"]
        : seats.length === 5
          ? ["UTG", "CO"]
          : ["UTG", "HJ", "CO"];
    let cursor = nextSeat(seats, bigBlind.seat);
    middleLabels.forEach((label) => {
      labels[cursor.id] = label;
      cursor = nextSeat(seats, cursor.seat);
    });
  }
  return labels;
}

function dealHoleCards(
  players: HandPlayer[],
  deck: Card[],
  dealerSeat: number,
): { players: HandPlayer[]; deck: Card[] } {
  const seatRefs = players
    .filter((player) => player.status !== "busted")
    .map((player) => ({ id: player.id, seat: player.seat }));
  let cursor = nextSeat(seatRefs, dealerSeat);
  const order: string[] = [];
  for (let index = 0; index < seatRefs.length; index += 1) {
    order.push(cursor.id);
    cursor = nextSeat(seatRefs, cursor.seat);
  }
  const cardsByPlayer: Record<string, Card[]> = Object.fromEntries(
    order.map((id) => [id, []]),
  );
  let deckIndex = 0;
  for (let pass = 0; pass < 2; pass += 1) {
    order.forEach((id) => cardsByPlayer[id].push(deck[deckIndex++]));
  }
  return {
    players: players.map((player) => ({
      ...player,
      holeCards: cardsByPlayer[player.id] ?? [],
    })),
    deck: deck.slice(deckIndex),
  };
}

function postBlind(player: HandPlayer, amount: number): HandPlayer {
  const paid = Math.min(player.stack, amount);
  return {
    ...player,
    stack: player.stack - paid,
    streetContribution: paid,
    totalContribution: paid,
    status: player.stack === paid ? "all-in" : player.status,
  };
}

export function startHand(options: StartHandOptions): PokerGameState {
  if (options.players.length < 2 || options.players.length > 6)
    throw new Error("A table requires 2 to 6 players");
  if (options.smallBlind <= 0 || options.bigBlind <= options.smallBlind)
    throw new Error("Invalid blind structure");
  const seats = options.players.map((player) => player.seat);
  if (new Set(seats).size !== seats.length)
    throw new Error("Seats must be unique");
  const livePlayers = options.players.filter((player) => player.stack > 0);
  if (livePlayers.length < 2)
    throw new Error("At least two funded players are required");

  const seed = options.seed ?? Date.now();
  const random: RandomSource =
    options.seed === undefined ? systemRandom : new SeededRandom(seed);
  const preparedDeck = options.deck
    ? options.deck.map((card) => ({ ...card }))
    : shuffleDeck(createDeck(), random);
  assertUniqueCards(preparedDeck);
  if (preparedDeck.length !== 52)
    throw new Error("A complete 52-card deck is required");
  const labels = labelPositions(options.players, options.dealerSeat);
  let players: HandPlayer[] = options.players.map((player) => ({
    ...player,
    startingStack: player.stack,
    holeCards: [],
    streetContribution: 0,
    totalContribution: 0,
    status: player.stack > 0 ? "active" : "busted",
    acted: player.stack <= 0,
    lastActedBet: 0,
    positionLabel: labels[player.id] ?? "",
    lastAction: null,
  }));
  const dealt = dealHoleCards(players, preparedDeck, options.dealerSeat);
  players = dealt.players;
  const positions = assignForcedPositions(
    activeSeats(options.players),
    options.dealerSeat,
  );
  players = players.map((player) => {
    if (player.id === positions.smallBlind.id)
      return postBlind(player, options.smallBlind);
    if (player.id === positions.bigBlind.id)
      return postBlind(player, options.bigBlind);
    return player;
  });
  const first = firstToActPreflop(
    activeSeats(options.players),
    options.dealerSeat,
  );
  const initial: PokerGameState = {
    handId: options.handId ?? `hand-${seed}`,
    dealerSeat: positions.button.seat,
    smallBlind: options.smallBlind,
    bigBlind: options.bigBlind,
    seed,
    deck: dealt.deck,
    board: [],
    burnCards: [],
    players,
    street: "preflop",
    actingPlayerId:
      players.find(
        (player) => player.id === first.id && player.status === "active",
      )?.id ?? nextActionable(players, first.seat),
    currentBet: options.bigBlind,
    minRaiseIncrement: options.bigBlind,
    actionSequence: 0,
    lastAggressorId: positions.bigBlind.id,
    actions: [],
    outcome: null,
    settled: false,
  };
  return advance(initial);
}

export function startTrainingScenario(
  options: TrainingScenarioOptions,
): PokerGameState {
  const requiredBoard = { preflop: 0, flop: 3, turn: 4, river: 5 }[
    options.startStreet
  ];
  if ((options.board?.length ?? 0) > requiredBoard)
    throw new Error("Too many board cards for the selected street");
  const seed = options.seed ?? Date.now();
  const random = new SeededRandom(seed);
  const specified = [
    ...(options.heroHoleCards ?? []),
    ...(options.board ?? []),
  ];
  assertUniqueCards(specified);
  let available = shuffleDeck(
    createDeck().filter(
      (card) =>
        !new Set(specified.map((known) => `${known.rank}-${known.suit}`)).has(
          `${card.rank}-${card.suit}`,
        ),
    ),
    random,
  );
  const heroHoleCards =
    options.heroHoleCards ??
    ([available.shift()!, available.shift()!] as [Card, Card]);
  const board = [...(options.board ?? [])];
  while (board.length < requiredBoard) board.push(available.shift()!);
  let game = startHand({
    ...options,
    seed,
    deck: shuffleDeck(createDeck(), new SeededRandom(seed + 1)),
  });
  const players = game.players.map((player) => {
    const holeCards =
      player.id === options.heroId
        ? heroHoleCards
        : ([available.shift()!, available.shift()!] as [Card, Card]);
    return {
      ...player,
      holeCards,
      streetContribution:
        options.startStreet === "preflop" ? player.streetContribution : 0,
      acted:
        options.startStreet === "preflop"
          ? player.acted
          : player.status !== "active",
      lastActedBet: 0,
    };
  });
  const usedIds = new Set(
    [...players.flatMap((player) => player.holeCards), ...board].map(
      (card) => `${card.rank}-${card.suit}`,
    ),
  );
  available = available.filter(
    (card) => !usedIds.has(`${card.rank}-${card.suit}`),
  );
  if (options.startStreet !== "preflop") {
    const first = nextActionable(players, game.dealerSeat);
    game = {
      ...game,
      players,
      board,
      deck: available,
      street: options.startStreet,
      actingPlayerId: first,
      currentBet: 0,
      minRaiseIncrement: options.bigBlind,
      lastAggressorId: null,
    };
  } else {
    game = { ...game, players, deck: available };
  }
  return game;
}

function nextActionable(
  players: HandPlayer[],
  fromSeat: number,
): string | null {
  const refs = players
    .filter(
      (player) => player.status === "active" && player.stack > CHIP_EPSILON,
    )
    .map((player) => ({ id: player.id, seat: player.seat }));
  if (refs.length === 0) return null;
  return nextSeat(refs, fromSeat).id;
}

function potSize(players: HandPlayer[]): number {
  return players.reduce((sum, player) => sum + player.totalContribution, 0);
}

function contenders(players: HandPlayer[]): HandPlayer[] {
  return players.filter(
    (player) =>
      player.status !== "folded" &&
      player.status !== "busted" &&
      player.status !== "sitting-out",
  );
}

function dealStreet(
  state: PokerGameState,
  street: "flop" | "turn" | "river",
): PokerGameState {
  const boardCount = street === "flop" ? 3 : 1;
  if (state.deck.length < boardCount + 1) throw new Error("Deck exhausted");
  const burn = state.deck[0];
  const boardCards = state.deck.slice(1, boardCount + 1);
  const deck = state.deck.slice(boardCount + 1);
  const first = firstToActPostflop(
    contenders(state.players).map((player) => ({
      id: player.id,
      seat: player.seat,
    })),
    state.dealerSeat,
  );
  const base = beginNextStreet(
    state,
    street,
    nextActionable(state.players, state.dealerSeat) ?? first.id,
  );
  const players = base.players.map((player) => ({
    ...(state.players.find(
      (existing) => existing.id === player.id,
    ) as HandPlayer),
    ...player,
  }));
  return {
    ...state,
    ...base,
    players,
    deck,
    board: [...state.board, ...boardCards],
    burnCards: [...state.burnCards, burn],
  };
}

function settle(state: PokerGameState, outcome: HandOutcome): PokerGameState {
  if (state.settled) return state;
  return {
    ...state,
    street: "complete",
    actingPlayerId: null,
    outcome,
    settled: true,
    players: state.players.map((player) => ({
      ...player,
      stack: player.stack + (outcome.payouts[player.id] ?? 0),
    })),
  };
}

function finishByFolds(state: PokerGameState): PokerGameState {
  const winner = contenders(state.players)[0];
  if (!winner) throw new Error("No player remains to win the pot");
  const contributions = state.players.map((player) => ({
    playerId: player.id,
    seat: player.seat,
    amount: player.totalContribution,
    folded: player.status === "folded",
  }));
  const { pots, uncalledReturns } = calculatePotStructure(contributions);
  return settle(state, {
    reason: "folds",
    payouts: awardUncontestedPot(winner.id, contributions),
    pots,
    uncalledReturns,
  });
}

function finishShowdown(state: PokerGameState): PokerGameState {
  if (state.board.length !== 5)
    throw new Error("Cannot resolve showdown before the river");
  const showdown = resolveShowdown(
    state.players.map((player) => ({
      playerId: player.id,
      seat: player.seat,
      amount: player.totalContribution,
      folded: player.status === "folded",
      holeCards: player.holeCards,
    })),
    state.board,
    state.dealerSeat,
  );
  return settle(state, {
    reason: "showdown",
    payouts: showdown.payouts,
    pots: showdown.awards.map((award) => award.pot),
    uncalledReturns: showdown.uncalledReturns,
    showdown,
  });
}

function autoRunout(state: PokerGameState): PokerGameState {
  let next = state;
  while (next.board.length < 5) {
    const street =
      next.board.length === 0
        ? "flop"
        : next.board.length === 3
          ? "turn"
          : "river";
    next = dealStreet(next, street);
  }
  return finishShowdown(next);
}

function advance(state: PokerGameState): PokerGameState {
  const remaining = contenders(state.players);
  if (remaining.length === 1) return finishByFolds(state);
  const actionable = remaining.filter(
    (player) => player.status === "active" && player.stack > CHIP_EPSILON,
  );
  if (actionable.length === 0) return autoRunout(state);
  if (actionable.length === 1 && amountToCall(state, actionable[0]) === 0)
    return autoRunout(state);
  if (actionable.length <= 1 && isRoundComplete(state))
    return autoRunout(state);
  if (!isRoundComplete(state)) return state;
  if (state.street === "river") return finishShowdown(state);
  if (state.street === "preflop") return dealStreet(state, "flop");
  if (state.street === "flop") return dealStreet(state, "turn");
  if (state.street === "turn") return dealStreet(state, "river");
  return state;
}

export function act(
  state: PokerGameState,
  playerId: string,
  action: PokerAction,
): PokerGameState {
  if (state.settled) throw new Error("Hand is already complete");
  const before = potSize(state.players);
  const actorBefore = state.players.find((player) => player.id === playerId)!;
  const callPaid = Math.min(
    Math.max(0, state.currentBet - actorBefore.streetContribution),
    actorBefore.stack,
  );
  const betting = applyBettingAction(state, playerId, action);
  const actorAction = action.type === "call" ? `call ${callPaid}` : action.type;
  const players = betting.players.map((player) => ({
    ...(state.players.find(
      (existing) => existing.id === player.id,
    ) as HandPlayer),
    ...player,
    lastAction:
      player.id === playerId
        ? actorAction
        : (state.players.find((existing) => existing.id === player.id)
            ?.lastAction ?? null),
  }));
  const record: ActionRecord = {
    sequence: state.actionSequence + 1,
    street: state.street,
    playerId,
    action: { ...action },
    potBefore: before,
    potAfter: potSize(players),
    board: [...state.board],
  };
  return advance({
    ...state,
    ...betting,
    players,
    actions: [...state.actions, record],
  });
}
