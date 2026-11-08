import { CHIP_EPSILON, normalizeChips } from "../chips/chips";
import type { PokerGameState } from "./gameState";
import { assignForcedPositions } from "./positions";

// An all-in button can mean a call or a raise. Reconstruct wager levels from
// recorded pot deltas; do not infer aggression from the button's label.
export function actionFacts(game: PokerGameState) {
  const positions = assignForcedPositions(
    game.players
      .filter((player) => player.startingStack > 0)
      .map((player) => ({ id: player.id, seat: player.seat })),
    game.dealerSeat,
  );
  let street = game.actions[0]?.street ?? "preflop";
  let currentBet = street === "preflop" ? game.bigBlind : 0;
  let raises = 0;
  let minRaise = game.bigBlind;
  const lastActedBet = new Map<string, number>();
  const live = new Set(
    game.players.filter((p) => p.startingStack > 0).map((p) => p.id),
  );
  const contributions = new Map(
    game.players.map((player) => [
      player.id,
      street !== "preflop"
        ? 0
        : Math.min(
            player.startingStack,
            player.id === positions.bigBlind.id
              ? game.bigBlind
              : player.id === positions.smallBlind.id
                ? game.smallBlind
                : 0,
          ),
    ]),
  );
  const stacks = new Map(
    game.players.map((player) => [
      player.id,
      player.startingStack -
        (street === "preflop"
          ? contributions.get(player.id)!
          : Math.min(player.startingStack, game.bigBlind)),
    ]),
  );
  return game.actions.map((record) => {
    if (record.street !== street) {
      street = record.street;
      currentBet = 0;
      raises = 0;
      minRaise = game.bigBlind;
      lastActedBet.clear();
      contributions.forEach((_, id) => contributions.set(id, 0));
    }
    const contribution = contributions.get(record.playerId) ?? 0;
    const paid = normalizeChips(record.potAfter - record.potBefore);
    const target = normalizeChips(contribution + paid);
    const aggressive = paid > 0 && target > currentBet + CHIP_EPSILON;
    const toCall = normalizeChips(Math.max(0, currentBet - contribution));
    const stackBefore = stacks.get(record.playerId) ?? 0;
    const lastBet = lastActedBet.get(record.playerId);
    const canRaise =
      stackBefore > toCall + CHIP_EPSILON &&
      [...live].some(
        (id) => id !== record.playerId && (stacks.get(id) ?? 0) > CHIP_EPSILON,
      ) &&
      (lastBet === undefined ||
        currentBet - lastBet >= minRaise - CHIP_EPSILON);
    const fact = {
      record,
      aggressive,
      raisesBefore: raises,
      toCall,
      stackBefore,
      canRaise,
    };
    if (aggressive) {
      raises += 1;
      if (target - currentBet >= minRaise - CHIP_EPSILON)
        minRaise = target - currentBet;
    }
    if (record.action.type === "fold") live.delete(record.playerId);
    lastActedBet.set(record.playerId, Math.max(currentBet, target));
    currentBet = Math.max(currentBet, target);
    contributions.set(record.playerId, target);
    stacks.set(record.playerId, normalizeChips(fact.stackBefore - paid));
    return fact;
  });
}
