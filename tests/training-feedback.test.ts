import { evaluateTrainingDecision } from "@/src/features/app/trainingFeedback";
import { reviewEntriesForHand } from "@/src/features/app/review";
import {
  act,
  startHand,
  startTrainingScenario,
} from "@/src/engine/state/gameState";
import { parseCards } from "@/src/engine/cards/cards";
import {
  appendCompletedHand,
  defaultData,
  migrateData,
} from "@/src/storage/storage";
const options = {
  players: [
    { id: "hero", name: "Hero", seat: 0, stack: 100, kind: "human" as const },
    { id: "ai", name: "AI", seat: 1, stack: 100, kind: "ai" as const },
  ],
  dealerSeat: 0,
  smallBlind: 0.5,
  bigBlind: 1,
  seed: 7,
  handId: "scenario-feedback",
};
it("does not endorse uncovered decisions and preserves a pre-action snapshot", () => {
  const game = startHand(options);
  const record = evaluateTrainingDecision(game, "hero", { type: "fold" }, 0.5);
  expect(record.grade).toBe("未充分评估");
  expect(record.context).toMatchObject({
    actionIndex: 0,
    potBefore: 1.5,
    toCall: 0.5,
    stackBefore: 99.5,
    amountCommitted: 0,
    equityEstimate: 0.5,
  });
  const copy = JSON.stringify(record);
  act(game, "hero", { type: "fold" });
  expect(JSON.stringify(record)).toBe(copy);
  expect(JSON.stringify(record)).not.toMatch(/holeCards|deck/);
});
it("uses the same oversize rule for a river bet and an equivalent shove", () => {
  const game = startTrainingScenario({
    ...options,
    heroId: "hero",
    startStreet: "river",
    heroHoleCards: parseCards("3C 4D") as [
      ReturnType<typeof parseCards>[number],
      ReturnType<typeof parseCards>[number],
    ],
    board: parseCards("AS KS QS JS 2H"),
  });
  const hero = game.players.find((p) => p.id === "hero")!;
  const shove = evaluateTrainingDecision(game, "hero", { type: "all-in" }, 0.1);
  const bet = evaluateTrainingDecision(
    game,
    "hero",
    { type: "bet", amount: hero.stack + hero.streetContribution },
    0.1,
  );
  expect(shove.grade).toBe("尺度异常");
  expect(bet.grade).toBe(shove.grade);
  expect(bet.context?.amountCommitted).toBe(shove.context?.amountCommitted);
});
it("treats an all-in call as a call rather than an aggressive shove", () => {
  let game = startHand({ ...options, dealerSeat: 1 });
  game = act(game, "ai", { type: "all-in" });
  const call = evaluateTrainingDecision(game, "hero", { type: "call" }, 0.05);
  const allin = evaluateTrainingDecision(
    game,
    "hero",
    { type: "all-in" },
    0.05,
  );
  expect(call.grade).toBe("偏松");
  expect(allin.grade).toBe(call.grade);
  expect(allin.context?.reason).toBe("low-equity-call");
});
it("does not turn a missing equity estimate into a zero-equity warning", () => {
  const game = startHand(options);
  expect(evaluateTrainingDecision(game, "hero", { type: "call" }).grade).toBe(
    "未充分评估",
  );
});
it("pairs partial reviews by their recorded action index and validates context on import", () => {
  const game = startHand({ ...options, handId: "hand-index" });
  const record = evaluateTrainingDecision(game, "hero", { type: "fold" }, 0.5);
  const data = appendCompletedHand(
    defaultData(),
    act(game, "hero", { type: "fold" }),
    "hero",
  );
  data.trainingRecords = [record];
  expect(migrateData(data).trainingRecords).toEqual([record]);
  expect(
    reviewEntriesForHand(data.recentHands[0], [record])[0].action?.action.type,
  ).toBe("fold");
  const invalid = {
    ...record,
    context: { ...record.context!, actionIndex: -1 },
  };
  expect(
    migrateData({ ...data, trainingRecords: [invalid] }).trainingRecords,
  ).toEqual([]);
  expect(
    reviewEntriesForHand(data.recentHands[0], [
      { ...record, context: { ...record.context!, potBefore: 999 } },
    ])[0].action,
  ).toBeNull();
});
