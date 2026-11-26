import { SeededRandom } from "../../engine/deck/random";
import { adaptPersonality } from "../adaptation/adapt";
import { assessHand, publicBoardDanger } from "../assessment/assessHand";
import type { AIDecision, AIObservation, PokerPersonality } from "../types";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

function legal(
  observation: AIObservation,
  action: AIDecision["action"],
): boolean {
  return observation.legalActions.includes(action);
}

function passiveAction(observation: AIObservation): AIDecision["action"] {
  if (legal(observation, "check")) return "check";
  if (legal(observation, "call")) return "call";
  return "fold";
}

function aggressiveAction(observation: AIObservation): AIDecision["action"] {
  if (legal(observation, observation.currentBet === 0 ? "bet" : "raise")) {
    return observation.currentBet === 0 ? "bet" : "raise";
  }
  if (legal(observation, "all-in")) return "all-in";
  return passiveAction(observation);
}

function raiseAmount(
  observation: AIObservation,
  pressure: number,
  sizeFactor = 1,
): number | undefined {
  const minimum = observation.minRaiseTo;
  if (minimum === null) return undefined;
  const potAfterCall = observation.pot + observation.toCall;
  const desired =
    observation.currentBet === 0
      ? Math.max(minimum, potAfterCall * (0.42 + pressure * 0.42))
      : Math.max(
          minimum,
          observation.currentBet + potAfterCall * (0.46 + pressure * 0.28),
        );
  const sized = Math.max(minimum, desired * sizeFactor);
  return Math.min(observation.maxRaiseTo, Number(sized.toFixed(2)));
}

// Fold to pressure is neutral at one half. Zero-to-one moves the continue
// price by 16 equity points, and only while a bet is owed.
const FOLD_PRESSURE_EQUITY_SPAN = 0.16;
const SHORT_STACK_SPR = 4;
const COMMITTING_CALL_RATIO = 0.4;
const NEUTRAL_SPR_MIN = 6;
const NEUTRAL_SPR_MAX = 14;
const STACK_CALL_EQUITY = 0.1;
const STACK_VALUE_RELIEF = 0.12;
const SHORT_SIZE_BOOST = 0.28;
const DEEP_SIZE_CUT = 0.22;
const NEUTRAL_BOARD_DANGER = 0.2;
const TEXTURE_EQUITY_SCALE = 0.3;
const TEXTURE_VALUE_SCALE = 0.24;
const TEXTURE_SHIFT_CAP = 0.08;
const COMMIT_EQUITY = 0.58;
const COMMIT_MADE_HAND = 0.45;

function pushTag(tags: string[], tag: string) {
  if (!tags.includes(tag)) tags.push(tag);
}

function stackDepth(observation: AIObservation) {
  const spr =
    observation.pot > 0 ? observation.effectiveStack / observation.pot : 20;
  const commitRatio =
    observation.toCall > 0 && observation.effectiveStack > 0
      ? observation.toCall / observation.effectiveStack
      : 0;
  return {
    spr,
    short: spr < SHORT_STACK_SPR || commitRatio >= COMMITTING_CALL_RATIO,
  };
}

function stackSizeFactor(spr: number, awareness: number): number {
  if (awareness <= 0 || (spr >= NEUTRAL_SPR_MIN && spr <= NEUTRAL_SPR_MAX))
    return 1;
  if (spr < NEUTRAL_SPR_MIN) {
    const intensity = clamp((NEUTRAL_SPR_MIN - spr) / NEUTRAL_SPR_MIN);
    return 1 + SHORT_SIZE_BOOST * intensity * awareness;
  }
  const intensity = clamp((spr - NEUTRAL_SPR_MAX) / 10);
  return 1 - DEEP_SIZE_CUT * intensity * awareness;
}

function textureShift(
  board: AIObservation["board"],
  awareness: number,
): { equity: number; value: number } {
  const danger = publicBoardDanger(board);
  if (danger === null || awareness <= 0) return { equity: 0, value: 0 };
  const gap = danger - NEUTRAL_BOARD_DANGER;
  return {
    equity: Math.max(
      -TEXTURE_SHIFT_CAP,
      Math.min(TEXTURE_SHIFT_CAP, gap * awareness * TEXTURE_EQUITY_SCALE),
    ),
    value: Math.max(
      -TEXTURE_SHIFT_CAP,
      Math.min(TEXTURE_SHIFT_CAP, gap * awareness * TEXTURE_VALUE_SCALE),
    ),
  };
}

export function decideAIAction(
  observation: AIObservation,
  basePersonality: PokerPersonality,
  seed: number,
): AIDecision {
  const personality = adaptPersonality(
    basePersonality,
    observation.userProfile,
  );
  const random = new SeededRandom(seed);
  const assessment = assessHand(
    observation.heroHoleCards,
    observation.board,
    observation.opponents,
    seed + 11,
    120,
  );
  const potOdds =
    typeof observation.callOdds === "number" &&
    Number.isFinite(observation.callOdds)
      ? Math.max(0, observation.callOdds)
      : observation.toCall <= 0
        ? 0
        : observation.toCall / (observation.pot + observation.toCall);
  const spr =
    observation.pot > 0 ? observation.effectiveStack / observation.pot : 20;
  const positionEdge =
    (observation.position - 0.5) * personality.positionAwareness * 0.13;
  const noise = (random.next() - 0.5) * personality.variance * 0.28;
  const pressure = clamp(
    personality.aggression * 0.55 +
      personality.bluffFrequency * 0.25 +
      positionEdge +
      noise,
  );
  const value = clamp(
    assessment.equityEstimate * 0.62 +
      assessment.madeHandStrength * 0.28 +
      assessment.drawStrength * 0.1 +
      positionEdge +
      noise,
  );
  const tags: string[] = [];

  if (assessment.madeHandStrength > 0.58) tags.push("strong-made-hand");
  if (assessment.drawStrength > 0.42) tags.push("semi-bluff");
  if (observation.position > 0.68) tags.push("position-advantage");
  if (potOdds > 0 && assessment.equityEstimate + 0.03 >= potOdds)
    tags.push("good-pot-odds");
  if (assessment.boardDanger > 0.58) tags.push("board-too-dangerous");
  if (spr < 2.2) tags.push("stack-pressure");
  if (personality.id === "station") tags.push("calling-station-profile");

  const foldAwareness = clamp(personality.foldToPressure);
  const stackAwareness = clamp(personality.stackAwareness);
  const textureAwareness = clamp(personality.boardTextureAwareness);
  const depth = stackDepth(observation);
  const foldEquity =
    observation.toCall > 0
      ? (foldAwareness - 0.5) * FOLD_PRESSURE_EQUITY_SPAN
      : 0;
  const stackEquity = depth.short ? stackAwareness * STACK_CALL_EQUITY : 0;
  const stackRelief = depth.short ? stackAwareness * STACK_VALUE_RELIEF : 0;
  const texture = textureShift(observation.board, textureAwareness);
  const sizeFactor = stackSizeFactor(depth.spr, stackAwareness);
  const canCommit =
    stackRelief > 0 &&
    (assessment.equityEstimate >= COMMIT_EQUITY ||
      (observation.street !== "preflop" &&
        assessment.madeHandStrength >= COMMIT_MADE_HAND));
  const baseValueThreshold =
    observation.street === "preflop" ? 0.61 - personality.pfr * 0.18 : 0.61;
  const valueThreshold =
    baseValueThreshold - (canCommit ? stackRelief : 0) + texture.value;
  const bluffWindow =
    random.next() <
    personality.bluffFrequency * (0.35 + personality.aggression * 0.65);
  const shouldValueRaise = value > valueThreshold;
  const shouldPressure =
    bluffWindow &&
    assessment.equityEstimate > 0.16 &&
    observation.opponents <= 2;
  const aggressive = aggressiveAction(observation);
  const passive = passiveAction(observation);
  const tookAggressive =
    (shouldValueRaise || shouldPressure) && aggressive !== passive;
  if (
    tookAggressive &&
    canCommit &&
    !(shouldPressure || value > baseValueThreshold + texture.value)
  ) {
    pushTag(tags, "committed-short-stack");
  }
  if (
    tookAggressive &&
    shouldValueRaise &&
    !shouldPressure &&
    texture.value < 0 &&
    !(value > baseValueThreshold - (canCommit ? stackRelief : 0))
  ) {
    pushTag(tags, "dry-board-continue");
  }
  const suppressedValueBet =
    !shouldValueRaise &&
    !shouldPressure &&
    texture.value > 0 &&
    value > baseValueThreshold - (canCommit ? stackRelief : 0);
  if (tookAggressive) {
    if (shouldPressure && !shouldValueRaise) tags.push("high-fold-equity");
    if (
      observation.maxRaiseTo <= (observation.minRaiseTo ?? Infinity) &&
      legal(observation, "all-in")
    ) {
      return {
        action: "all-in",
        confidence: clamp(0.5 + Math.abs(value - 0.5)),
        reasoningTags: tags,
      };
    }
    const amount = raiseAmount(observation, pressure, sizeFactor);
    if (
      amount !== undefined &&
      amount !== raiseAmount(observation, pressure, 1)
    ) {
      pushTag(tags, "sized-to-stack-depth");
    }
    return {
      action: aggressive,
      amount,
      confidence: clamp(0.55 + Math.abs(value - 0.52)),
      reasoningTags: tags,
    };
  }

  const callMargin =
    personality.callDownTendency * 0.09 + personality.potOddsAwareness * 0.03;
  const valueFloor = 0.25 - personality.vpip * 0.08;
  const equityShift = foldEquity + stackEquity + texture.equity;
  const continuesAt = (shift: number) =>
    assessment.equityEstimate + callMargin - shift >= potOdds &&
    value > valueFloor;
  if (observation.toCall > 0) {
    if (continuesAt(equityShift)) {
      if (suppressedValueBet) pushTag(tags, "cautious-board-texture");
      return {
        action: legal(observation, "call") ? "call" : passive,
        confidence: clamp(0.46 + Math.abs(assessment.equityEstimate - potOdds)),
        reasoningTags: tags,
      };
    }
    if (foldEquity > 0 && continuesAt(equityShift - foldEquity)) {
      pushTag(tags, "folded-to-pressure");
    }
    if (stackEquity > 0 && continuesAt(equityShift - stackEquity)) {
      pushTag(tags, "respected-stack-depth");
    }
    if (texture.equity > 0 && continuesAt(equityShift - texture.equity)) {
      pushTag(tags, "cautious-board-texture");
    }
    return {
      action: legal(observation, "fold") ? "fold" : passive,
      confidence: clamp(0.52 + (potOdds - assessment.equityEstimate)),
      reasoningTags: tags,
    };
  }

  if (observation.wasPreflopAggressor) {
    const roll = random.next();
    const baseContinuation = clamp(personality.continuationBetFrequency);
    const continuation = clamp(baseContinuation * (1 - texture.value * 4));
    if (roll < continuation && legal(observation, "bet")) {
      tags.push("continuation-bet");
      if (texture.value < 0 && roll >= baseContinuation) {
        pushTag(tags, "dry-board-continue");
      }
      const amount = raiseAmount(observation, pressure, sizeFactor);
      if (
        amount !== undefined &&
        amount !== raiseAmount(observation, pressure, 1)
      ) {
        pushTag(tags, "sized-to-stack-depth");
      }
      return {
        action: "bet",
        amount,
        confidence: 0.58,
        reasoningTags: tags,
      };
    }
    if (
      texture.value > 0 &&
      roll < baseContinuation &&
      legal(observation, "bet")
    ) {
      pushTag(tags, "cautious-board-texture");
    }
  }
  if (suppressedValueBet) pushTag(tags, "cautious-board-texture");
  return {
    action: passive,
    confidence: clamp(0.48 + assessment.showdownValue * 0.32),
    reasoningTags: tags,
  };
}
