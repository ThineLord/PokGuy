import { assertUniqueCards, cardId, type Card } from "../engine/cards/cards";
import { chipAmountsEqual, isChipAmount } from "../engine/chips/chips";
import {
  HAND_CATEGORIES,
  compareEvaluations,
  evaluateBestHand,
} from "../engine/evaluator/evaluator";
import { resolveShowdown } from "../engine/showdown/showdown";
import { calculatePotStructure } from "../engine/pots/sidePots";
import { isContender, type PokerGameState } from "../engine/state/gameState";

const streets = ["preflop", "flop", "turn", "river"];
const statuses = ["active", "all-in", "folded", "busted", "sitting-out"];
const actions = ["fold", "check", "call", "bet", "raise", "all-in"];
const count = (value: number) => Number.isSafeInteger(value) && value >= 0;
const text = (value: unknown): value is string => typeof value === "string";
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

function cards(value: unknown): value is Card[] {
  if (!Array.isArray(value)) return false;
  try {
    assertUniqueCards(value);
    return true;
  } catch {
    return false;
  }
}

// History is untrusted input, never a live state to resume. Reject an invalid
// entry as a unit so partial repairs cannot invent a hand or a payout.
export function isCompletedGame(value: unknown): value is PokerGameState {
  if (!object(value)) return false;
  const game = value as unknown as PokerGameState;
  try {
    if (
      !text(game.handId) ||
      !game.handId ||
      game.settled !== true ||
      game.street !== "complete" ||
      game.actingPlayerId !== null ||
      !Number.isSafeInteger(game.dealerSeat) ||
      !count(game.actionSequence) ||
      !Number.isFinite(game.seed) ||
      !isChipAmount(game.smallBlind) ||
      !isChipAmount(game.bigBlind) ||
      game.smallBlind <= 0 ||
      game.bigBlind <= game.smallBlind ||
      !isChipAmount(game.currentBet) ||
      !isChipAmount(game.minRaiseIncrement) ||
      !Array.isArray(game.players) ||
      game.players.length < 2 ||
      game.players.length > 6 ||
      !Array.isArray(game.actions) ||
      game.actions.length !== game.actionSequence ||
      !cards(game.board) ||
      ![0, 3, 4, 5].includes(game.board.length) ||
      !cards(game.deck) ||
      !cards(game.burnCards)
    )
      return false;
    if (
      !game.players.every(
        (player) =>
          object(player) &&
          text(player.id) &&
          !!player.id &&
          text(player.name) &&
          ["human", "ai"].includes(player.kind) &&
          (player.personalityId === undefined || text(player.personalityId)) &&
          Number.isSafeInteger(player.seat) &&
          statuses.includes(player.status) &&
          isChipAmount(player.stack) &&
          isChipAmount(player.startingStack) &&
          isChipAmount(player.streetContribution) &&
          isChipAmount(player.totalContribution) &&
          player.streetContribution <= player.totalContribution &&
          player.totalContribution <= player.startingStack &&
          typeof player.acted === "boolean" &&
          isChipAmount(player.lastActedBet) &&
          text(player.positionLabel) &&
          (player.lastAction === null || text(player.lastAction)) &&
          cards(player.holeCards) &&
          player.holeCards.length === (player.startingStack === 0 ? 0 : 2),
      )
    )
      return false;
    const ids = new Set(game.players.map((player) => player.id));
    if (
      ids.size !== game.players.length ||
      new Set(game.players.map((player) => player.seat)).size !==
        game.players.length
    )
      return false;
    const allCards = [
      ...game.deck,
      ...game.board,
      ...game.burnCards,
      ...game.players.flatMap((player) => player.holeCards),
    ];
    if (allCards.length !== 52 || !cards(allCards)) return false;
    const boardIds = game.board.map(cardId);
    let previousStreet = 0;
    if (
      !game.actions.every((record, index) => {
        if (
          !object(record) ||
          record.sequence !== index + 1 ||
          !ids.has(record.playerId) ||
          !streets.includes(record.street) ||
          !object(record.action) ||
          !actions.includes(record.action.type) ||
          ((record.action.type === "bet" || record.action.type === "raise") &&
            !isChipAmount(record.action.amount!)) ||
          (record.action.amount !== undefined &&
            !isChipAmount(record.action.amount)) ||
          !isChipAmount(record.potBefore) ||
          !isChipAmount(record.potAfter) ||
          record.potAfter < record.potBefore ||
          !cards(record.board) ||
          record.board.length !==
            [0, 3, 4, 5][streets.indexOf(record.street)] ||
          !record.board.every((card, i) => cardId(card) === boardIds[i])
        )
          return false;
        const street = streets.indexOf(record.street);
        if (street < previousStreet) return false;
        previousStreet = street;
        return (
          index === 0 ||
          chipAmountsEqual(record.potBefore, game.actions[index - 1].potAfter)
        );
      })
    )
      return false;
    const outcome = game.outcome;
    if (
      !outcome ||
      !["folds", "showdown"].includes(outcome.reason) ||
      (outcome.termination !== undefined &&
        !["uncontested", "river-showdown", "all-in-runout"].includes(
          outcome.termination,
        ))
    )
      return false;
    const amounts = (raw: unknown): raw is Record<string, number> =>
      object(raw) &&
      Object.entries(raw).every(
        ([id, amount]) =>
          ids.has(id) && typeof amount === "number" && isChipAmount(amount),
      );
    if (
      !amounts(outcome.payouts) ||
      !Array.isArray(outcome.pots) ||
      (outcome.uncalledReturns !== undefined &&
        !amounts(outcome.uncalledReturns))
    )
      return false;
    const contributions = game.players.map((player) => ({
      playerId: player.id,
      seat: player.seat,
      amount: player.totalContribution,
      folded: !isContender(player),
      holeCards: player.holeCards,
    }));
    const expected = calculatePotStructure(contributions);
    if (JSON.stringify(outcome.pots) !== JSON.stringify(expected.pots))
      return false;
    if (
      outcome.uncalledReturns &&
      JSON.stringify(outcome.uncalledReturns) !==
        JSON.stringify(expected.uncalledReturns)
    )
      return false;
    const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
    if (
      !chipAmountsEqual(
        sum(Object.values(outcome.payouts)),
        sum(game.players.map((player) => player.totalContribution)),
      ) ||
      !game.players.every((player) =>
        chipAmountsEqual(
          player.startingStack -
            player.totalContribution +
            (outcome.payouts[player.id] ?? 0),
          player.stack,
        ),
      )
    )
      return false;
    if (outcome.reason === "folds") {
      if (outcome.showdown !== undefined) return false;
      const live = game.players.filter(isContender);
      if (
        live.length !== 1 ||
        Object.entries(outcome.payouts).some(
          ([id, amount]) => id !== live[0].id && amount !== 0,
        )
      )
        return false;
    }
    if (outcome.reason === "showdown") {
      const showdown = outcome.showdown;
      if (
        game.board.length !== 5 ||
        !showdown ||
        !object(showdown.evaluations) ||
        !amounts(showdown.payouts) ||
        !amounts(showdown.uncalledReturns) ||
        !Array.isArray(showdown.awards)
      )
        return false;
      if (
        !Object.entries(showdown.evaluations).every(
          ([id, evaluation]) =>
            ids.has(id) &&
            object(evaluation) &&
            HAND_CATEGORIES.includes(evaluation.category) &&
            evaluation.categoryRank ===
              HAND_CATEGORIES.indexOf(evaluation.category) &&
            cards(evaluation.cards) &&
            evaluation.cards.length === 5 &&
            evaluation.cards.every((card) =>
              [
                ...game.players.find((player) => player.id === id)!.holeCards,
                ...game.board,
              ].some((known) => cardId(known) === cardId(card)),
            ) &&
            Array.isArray(evaluation.tiebreakers) &&
            evaluation.tiebreakers.every(
              (rank) => Number.isInteger(rank) && rank >= 2 && rank <= 14,
            ) &&
            text(evaluation.label),
        )
      )
        return false;
      if (
        showdown.awards.length !== outcome.pots.length ||
        !showdown.awards.every(
          (award, i) =>
            object(award) &&
            JSON.stringify(award.pot) === JSON.stringify(outcome.pots[i]) &&
            Array.isArray(award.winnerIds) &&
            award.winnerIds.length > 0 &&
            award.winnerIds.every((id) =>
              award.pot.eligiblePlayerIds.includes(id),
            ) &&
            amounts(award.shares) &&
            chipAmountsEqual(
              sum(Object.values(award.shares)),
              award.pot.amount,
            ),
        )
      )
        return false;
      const resolved = resolveShowdown(
        contributions,
        game.board,
        game.dealerSeat,
      );
      if (
        Object.keys(showdown.evaluations).length !==
        Object.keys(resolved.evaluations).length
      )
        return false;
      if (
        !game.players.every(
          (player) =>
            chipAmountsEqual(
              outcome.payouts[player.id] ?? 0,
              resolved.payouts[player.id] ?? 0,
            ) &&
            chipAmountsEqual(
              showdown.payouts[player.id] ?? 0,
              resolved.payouts[player.id] ?? 0,
            ),
        )
      )
        return false;
      if (
        !showdown.awards.every(
          (award, i) =>
            award.winnerIds.length === resolved.awards[i].winnerIds.length &&
            award.winnerIds.every((id) =>
              resolved.awards[i].winnerIds.includes(id),
            ) &&
            Object.entries(award.shares).every(([id, share]) =>
              chipAmountsEqual(share, resolved.awards[i].shares[id] ?? 0),
            ),
        )
      )
        return false;
      if (
        !Object.entries(resolved.evaluations).every(
          ([id, evaluation]) =>
            showdown.evaluations[id] &&
            compareEvaluations(evaluation, showdown.evaluations[id]) === 0 &&
            compareEvaluations(
              evaluateBestHand(showdown.evaluations[id].cards),
              evaluation,
            ) === 0,
        )
      )
        return false;
    }
    return true;
  } catch {
    return false;
  }
}
