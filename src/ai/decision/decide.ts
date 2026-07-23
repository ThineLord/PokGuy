import { SeededRandom } from "../../engine/deck/random";
import { adaptPersonality } from "../adaptation/adapt";
import { assessHand } from "../assessment/assessHand";
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
  return Math.min(observation.maxRaiseTo, Number(desired.toFixed(2)));
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
    observation.toCall <= 0
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

  const bluffWindow =
    random.next() <
    personality.bluffFrequency * (0.35 + personality.aggression * 0.65);
  const shouldValueRaise =
    value >
    (observation.street === "preflop" ? 0.61 - personality.pfr * 0.18 : 0.61);
  const shouldPressure =
    bluffWindow &&
    assessment.equityEstimate > 0.16 &&
    observation.opponents <= 2;
  if (
    (shouldValueRaise || shouldPressure) &&
    aggressiveAction(observation) !== passiveAction(observation)
  ) {
    const action = aggressiveAction(observation);
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
    return {
      action,
      amount: raiseAmount(observation, pressure),
      confidence: clamp(0.55 + Math.abs(value - 0.52)),
      reasoningTags: tags,
    };
  }

  if (observation.toCall > 0) {
    const callMargin =
      personality.callDownTendency * 0.09 + personality.potOddsAwareness * 0.03;
    if (
      assessment.equityEstimate + callMargin >= potOdds &&
      value > 0.25 - personality.vpip * 0.08
    ) {
      return {
        action: legal(observation, "call")
          ? "call"
          : passiveAction(observation),
        confidence: clamp(0.46 + Math.abs(assessment.equityEstimate - potOdds)),
        reasoningTags: tags,
      };
    }
    return {
      action: legal(observation, "fold") ? "fold" : passiveAction(observation),
      confidence: clamp(0.52 + (potOdds - assessment.equityEstimate)),
      reasoningTags: tags,
    };
  }

  if (
    observation.wasPreflopAggressor &&
    random.next() < personality.continuationBetFrequency &&
    legal(observation, "bet")
  ) {
    tags.push("continuation-bet");
    return {
      action: "bet",
      amount: raiseAmount(observation, pressure),
      confidence: 0.58,
      reasoningTags: tags,
    };
  }
  return {
    action: passiveAction(observation),
    confidence: clamp(0.48 + assessment.showdownValue * 0.32),
    reasoningTags: tags,
  };
}
