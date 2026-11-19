import type { ActionValidation } from "../../engine/betting/types";

export type HintAction = "fold" | "check" | "call" | "bet" | "raise";

export function recommendedHintAction(input: {
  equity: number | null | undefined;
  currentBet: number;
  toCall: number;
  pot: number;
  legal: Record<string, Pick<ActionValidation, "legal">> | null;
}): HintAction | null {
  if (input.equity == null || !Number.isFinite(input.equity)) return null;
  const allowed = (action: HintAction) => input.legal?.[action]?.legal === true;
  const potOdds =
    input.toCall > 0 ? input.toCall / (input.pot + input.toCall) : 0;
  if (input.equity > 0.62) {
    if (input.currentBet === 0 && allowed("bet")) return "bet";
    if (input.currentBet !== 0 && allowed("raise")) return "raise";
    if (input.toCall === 0 && allowed("check")) return "check";
    if (allowed("call")) return "call";
    if (allowed("check")) return "check";
    return null;
  }
  if (input.toCall === 0) return allowed("check") ? "check" : null;
  if (input.equity + 0.04 >= potOdds) return allowed("call") ? "call" : null;
  return allowed("fold") ? "fold" : null;
}
