export interface RandomSource {
  next(): number;
  integerBelow?(bound: number): number;
}

export class SeededRandom implements RandomSource {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0 || 0x6d2b79f5;
  }

  next(): number {
    let value = (this.state += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  }
}

export function randomUint32(): number {
  const value = new Uint32Array(1);
  globalThis.crypto.getRandomValues(value);
  return value[0];
}

export const systemRandom: RandomSource = {
  next: () => randomUint32() / 4_294_967_296,
  integerBelow: (bound) => {
    if (!Number.isSafeInteger(bound) || bound < 1 || bound > 4_294_967_296)
      throw new Error("Invalid random integer bound");
    const limit = 4_294_967_296 - (4_294_967_296 % bound);
    let sample: number;
    do {
      sample = randomUint32();
    } while (sample >= limit);
    return sample % bound;
  },
};
