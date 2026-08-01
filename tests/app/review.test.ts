import {
  handNeedsReview,
  reviewEntriesForHand,
  summarizeReviews,
} from "@/src/features/app/review";
import { startHand, type ActionRecord } from "@/src/engine/state/gameState";
import type { StoredHand, TrainingRecord } from "@/src/storage/types";

function hand(id: string, actions: ActionRecord[] = []): StoredHand {
  const game = startHand({
    players: [
      { id: "hero", name: "Hero", seat: 0, stack: 100, kind: "human" },
      { id: "ai-1", name: "TAG", seat: 1, stack: 100, kind: "ai" },
    ],
    dealerSeat: 0,
    smallBlind: 0.5,
    bigBlind: 1,
    seed: 1,
    handId: id,
  });
  return {
    id,
    startedAt: "2026-08-01T00:00:00.000Z",
    completedAt: "2026-08-01T00:01:00.000Z",
    heroProfitBb: 1,
    aiDecisionTags: {},
    game: {
      ...game,
      actions,
    },
  };
}

function action(sequence: number, type: "check" | "call"): ActionRecord {
  return {
    sequence,
    street: sequence === 1 ? "preflop" : "flop",
    playerId: "hero",
    action: { type },
    potBefore: sequence,
    potAfter: sequence + Number(type === "call"),
    board: [],
  };
}

describe("review helpers", () => {
  it("pairs newest-first persisted feedback with chronological hero actions", () => {
    const storedHand = hand("hand-1", [action(1, "call"), action(2, "check")]);
    const records: TrainingRecord[] = [
      {
        handId: "hand-1",
        createdAt: "2026-08-01T00:00:20.000Z",
        grade: "合理",
      },
      {
        handId: "hand-1",
        createdAt: "2026-08-01T00:00:10.000Z",
        grade: "偏松",
      },
    ];

    const entries = reviewEntriesForHand(storedHand, records);
    expect(entries.map((entry) => entry.record.grade)).toEqual([
      "偏松",
      "合理",
    ]);
    expect(entries.map((entry) => entry.action?.sequence)).toEqual([1, 2]);
  });

  it("does not guess action links when imported records lose newest-first order", () => {
    const storedHand = hand("hand-1", [action(1, "call"), action(2, "check")]);
    const records: TrainingRecord[] = [
      {
        handId: "hand-1",
        createdAt: "2026-08-01T00:00:10.000Z",
        grade: "偏松",
      },
      {
        handId: "hand-1",
        createdAt: "2026-08-01T00:00:20.000Z",
        grade: "合理",
      },
    ];

    const entries = reviewEntriesForHand(storedHand, records);
    expect(entries.map((entry) => entry.record.grade)).toEqual([
      "偏松",
      "合理",
    ]);
    expect(entries.every((entry) => entry.action === null)).toBe(true);
  });

  it("does not guess action links when timestamps cannot establish order", () => {
    const storedHand = hand("hand-1", [action(1, "call"), action(2, "check")]);
    const records: TrainingRecord[] = [
      {
        handId: "hand-1",
        createdAt: "2026-08-01T00:00:10.000Z",
        grade: "偏松",
      },
      {
        handId: "hand-1",
        createdAt: "2026-08-01T00:00:10.000Z",
        grade: "合理",
      },
    ];

    expect(
      reviewEntriesForHand(storedHand, records).every(
        (entry) => entry.action === null,
      ),
    ).toBe(true);
  });

  it("does not guess action links when imported feedback is incomplete", () => {
    const storedHand = hand("hand-1", [action(1, "call"), action(2, "check")]);
    const records: TrainingRecord[] = [
      {
        handId: "hand-1",
        createdAt: "2026-08-01T00:00:20.000Z",
        grade: "高风险",
      },
    ];

    expect(reviewEntriesForHand(storedHand, records)[0]?.action).toBeNull();
  });

  it("summarizes only feedback attached to retained hand history", () => {
    const hands = [hand("hand-1"), hand("hand-2")];
    const records: TrainingRecord[] = [
      {
        handId: "hand-1",
        createdAt: "2026-08-01T00:00:20.000Z",
        grade: "合理",
      },
      {
        handId: "hand-1",
        createdAt: "2026-08-01T00:00:10.000Z",
        grade: "偏紧",
      },
      {
        handId: "deleted-hand",
        createdAt: "2026-08-01T00:00:05.000Z",
        grade: "尺度异常",
      },
    ];

    expect(handNeedsReview("hand-1", records)).toBe(true);
    expect(handNeedsReview("hand-2", records)).toBe(false);
    expect(summarizeReviews(hands, records)).toEqual({
      reviewedDecisions: 2,
      needsReviewDecisions: 1,
      needsReviewHands: 1,
    });
  });
});
