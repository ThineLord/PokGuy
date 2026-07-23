export const CHIP_DECIMALS = 2;
export const CHIP_UNIT = 1 / 10 ** CHIP_DECIMALS;
export const CHIP_EPSILON = CHIP_UNIT / 1_000;

export function normalizeChips(amount: number): number {
  if (!Number.isFinite(amount)) throw new Error("Chip amount must be finite");
  const normalized = Number(amount.toFixed(CHIP_DECIMALS));
  return Object.is(normalized, -0) ? 0 : normalized;
}

export function chipAmountsEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= CHIP_EPSILON;
}
