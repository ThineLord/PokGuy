import type { Card } from "../../engine/cards/cards";
import type {
  ActionRecord,
  PokerGameState,
} from "../../engine/state/gameState";

export type ReplayFrame =
  | { kind: "start"; board: Card[] }
  | { kind: "action"; action: ActionRecord; board: Card[] }
  | { kind: "runout"; board: Card[] };

function copyBoard(board: readonly Card[]): Card[] {
  return board.map((card) => ({ rank: card.rank, suit: card.suit }));
}

function sameBoard(left: readonly Card[], right: readonly Card[]): boolean {
  return (
    left.length === right.length &&
    left.every(
      (card, index) =>
        card.rank === right[index]?.rank && card.suit === right[index]?.suit,
    )
  );
}

// A saved action records the board facing that decision. Cards dealt after the
// last action, including a forced runout with no actions at all, are only on
// the settled board. Burn cards are the record of those extra streets: three
// burns deal five cards from preflop, two deal the turn and river from the
// flop, and one deals the river from the turn.
function cardsDealtAfterStart(burnCount: number): number {
  if (burnCount >= 3) return 5;
  if (burnCount === 2) return 2;
  if (burnCount === 1) return 1;
  return 0;
}

function startingBoard(game: PokerGameState): Card[] {
  const first = game.actions[0];
  if (first) return copyBoard(first.board);
  const dealt = cardsDealtAfterStart(game.burnCards.length);
  const kept = Math.max(0, game.board.length - dealt);
  return copyBoard(game.board.slice(0, kept));
}

export function replayTimeline(game: PokerGameState): ReplayFrame[] {
  const frames: ReplayFrame[] = [{ kind: "start", board: startingBoard(game) }];
  for (const action of game.actions) {
    frames.push({ kind: "action", action, board: copyBoard(action.board) });
  }
  const visible = frames[frames.length - 1]?.board ?? [];
  if (!sameBoard(visible, game.board)) {
    frames.push({ kind: "runout", board: copyBoard(game.board) });
  }
  return frames;
}
