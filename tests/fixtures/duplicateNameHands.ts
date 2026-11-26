import { PERSONALITIES } from "../../src/ai/personalities/presets";
import {
  act,
  startHand,
  type PokerGameState,
  type TablePlayerInput,
} from "../../src/engine/state/gameState";

function profile(id: string) {
  const found = PERSONALITIES.find((item) => item.id === id);
  if (!found) throw new Error(`Missing profile ${id}`);
  return found;
}

function table(
  opponents: ReadonlyArray<{ id: string; stack: number }>,
  heroStack: number,
): TablePlayerInput[] {
  return [
    { id: "hero", name: "Hero", seat: 0, stack: heroStack, kind: "human" },
    ...opponents.map((opponent, index) => {
      const personality = profile(opponent.id);
      return {
        id: `ai-${index + 1}`,
        name: personality.name,
        seat: index + 1,
        stack: opponent.stack,
        kind: "ai" as const,
        personalityId: personality.id,
      };
    }),
  ];
}

function play(
  players: TablePlayerInput[],
  seed: number,
  handId: string,
  actions: ReadonlyArray<"fold" | "call" | "all-in">,
): PokerGameState {
  let game = startHand({
    players,
    dealerSeat: 0,
    smallBlind: 0.5,
    bigBlind: 1,
    seed,
    handId,
  });
  for (const type of actions) {
    const actor = game.actingPlayerId;
    if (!actor) throw new Error(`No player to ${type}`);
    game = act(game, actor, { type });
  }
  if (!game.settled || game.outcome?.reason !== "showdown") {
    throw new Error(`${handId} did not reach showdown`);
  }
  return game;
}

// Button folds, the small blind shoves, and the big blind calls.
// Both blinds use the built-in TAG profile.
export function threeSeatDuplicateTags(): PokerGameState {
  return play(
    table(
      [
        { id: "tag", stack: 100 },
        { id: "tag", stack: 100 },
      ],
      100,
    ),
    31,
    "hand-dup-three-1700000000000",
    ["fold", "all-in", "call"],
  );
}

// Same action line with one TAG and one LAG, so each display name is unique.
export function threeSeatUniqueNames(): PokerGameState {
  return play(
    table(
      [
        { id: "tag", stack: 100 },
        { id: "lag", stack: 100 },
      ],
      100,
    ),
    31,
    "hand-unique-three-1700000000000",
    ["fold", "all-in", "call"],
  );
}

// Seed 6: 5 BB TAG small blind, 20 BB TAG big blind, 20 BB LAG.
// The cutoff shoves, the button folds, and both blinds call.
export function fourSeatSeed6(): PokerGameState {
  return play(
    table(
      [
        { id: "tag", stack: 5 },
        { id: "tag", stack: 20 },
        { id: "lag", stack: 20 },
      ],
      100,
    ),
    6,
    "hand-seed6-1700000000000",
    ["all-in", "fold", "call", "call"],
  );
}
