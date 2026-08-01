import type { ActionRecord } from "../../engine/state/gameState";
import type { StoredHand, TrainingRecord } from "../../storage/types";

export interface ReviewEntry {
  action: ActionRecord | null;
  record: TrainingRecord;
}

export interface ReviewSummary {
  reviewedDecisions: number;
  needsReviewDecisions: number;
  needsReviewHands: number;
}

export function needsReview(grade: TrainingRecord["grade"]): boolean {
  return grade !== "合理";
}

export function reviewEntriesForHand(
  hand: StoredHand,
  records: TrainingRecord[],
): ReviewEntry[] {
  const newestFirstRecords = records.filter(
    (record) => record.handId === hand.id,
  );
  const humanIds = new Set(
    hand.game.players
      .filter((player) => player.kind === "human")
      .map((player) => player.id),
  );
  const heroActions = hand.game.actions.filter((action) =>
    humanIds.has(action.playerId),
  );

  // Older or imported data can contain only part of a hand's feedback. In that
  // case, showing the grade without an action is safer than mislabeling a move.
  const timestamps = newestFirstRecords.map((record) =>
    new Date(record.createdAt).getTime(),
  );
  const hasUnambiguousNewestFirstOrder = timestamps.every(
    (timestamp, index) =>
      Number.isFinite(timestamp) &&
      (index === 0 || timestamp < timestamps[index - 1]),
  );
  const chronologicalRecords = newestFirstRecords
    .slice()
    .sort(
      (left, right) =>
        new Date(left.createdAt).getTime() -
        new Date(right.createdAt).getTime(),
    );
  const canPairActions =
    chronologicalRecords.length === heroActions.length &&
    hasUnambiguousNewestFirstOrder;
  return chronologicalRecords.map((record, index) => ({
    record,
    action: canPairActions ? (heroActions[index] ?? null) : null,
  }));
}

export function handNeedsReview(
  handId: string,
  records: TrainingRecord[],
): boolean {
  return records.some(
    (record) => record.handId === handId && needsReview(record.grade),
  );
}

export function summarizeReviews(
  hands: StoredHand[],
  records: TrainingRecord[],
): ReviewSummary {
  const visibleHandIds = new Set(hands.map((hand) => hand.id));
  const visibleRecords = records.filter((record) =>
    visibleHandIds.has(record.handId),
  );
  const needsReviewHandIds = new Set(
    visibleRecords
      .filter((record) => needsReview(record.grade))
      .map((record) => record.handId),
  );
  return {
    reviewedDecisions: visibleRecords.length,
    needsReviewDecisions: visibleRecords.filter((record) =>
      needsReview(record.grade),
    ).length,
    needsReviewHands: needsReviewHandIds.size,
  };
}
