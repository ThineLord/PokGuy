function formatChips(value: number) {
  return Number(value.toFixed(2)).toString();
}

export function chipsToBigBlinds(chips: number, bigBlind: number) {
  return bigBlind > 0 ? chips / bigBlind : chips;
}

export function bigBlindStep(bigBlind: number) {
  return bigBlind > 0 ? 0.01 / bigBlind : 0.01;
}

export function formatBigBlinds(chips: number, bigBlind: number) {
  if (!(bigBlind > 0) || !Number.isFinite(bigBlind) || !Number.isFinite(chips))
    return formatChips(chips);
  const ratio = chips / bigBlind;
  const step = bigBlindStep(bigBlind);
  let decimals = 2;
  if (Number.isFinite(step) && step > 0 && step < 0.01) {
    const needed = Math.ceil(-Math.log10(step) - 1e-12);
    if (Number.isFinite(needed)) decimals = Math.max(2, needed);
  }
  decimals = Math.min(20, decimals);
  let shown = Number(ratio.toFixed(decimals));
  while (
    decimals < 20 &&
    (collidesWithNeighbor(chips, bigBlind, decimals, shown) ||
      (chips !== 0 && shown === 0))
  ) {
    decimals += 1;
    shown = Number(ratio.toFixed(decimals));
  }
  return Object.is(shown, -0) ? "0" : shown.toString();
}

function collidesWithNeighbor(
  chips: number,
  bigBlind: number,
  decimals: number,
  shown: number,
) {
  return [-0.01, 0.01].some((offset) => {
    const neighbor = chips + offset;
    if (neighbor < 0) return false;
    return Number((neighbor / bigBlind).toFixed(decimals)) === shown;
  });
}

export function reasonWithBlindUnits(reason: string, bigBlind: number) {
  const minimum = reason.match(/^Minimum legal total is (.+)$/);
  if (minimum && Number.isFinite(Number(minimum[1]))) {
    return `Minimum legal total is ${formatBigBlinds(Number(minimum[1]), bigBlind)} BB`;
  }
  const facing = reason.match(/^Cannot check facing (.+)$/);
  if (facing && Number.isFinite(Number(facing[1]))) {
    return `Cannot check facing ${formatBigBlinds(Number(facing[1]), bigBlind)} BB`;
  }
  return reason;
}
