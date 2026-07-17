import type { PokerPersonality } from "../types";

const preset = (
  values: Pick<PokerPersonality, "id" | "name" | "description" | "thinkingSpeed"> & Partial<PokerPersonality>,
): PokerPersonality => ({
  vpip: 0.24,
  pfr: 0.18,
  aggression: 0.55,
  bluffFrequency: 0.18,
  callDownTendency: 0.42,
  foldToPressure: 0.5,
  positionAwareness: 0.65,
  potOddsAwareness: 0.65,
  stackAwareness: 0.65,
  boardTextureAwareness: 0.65,
  continuationBetFrequency: 0.62,
  doubleBarrelFrequency: 0.43,
  checkRaiseFrequency: 0.09,
  slowPlayFrequency: 0.09,
  trapFrequency: 0.07,
  tiltSensitivity: 0.2,
  adaptability: 0.45,
  variance: 0.12,
  ...values,
});

export const PERSONALITIES: PokerPersonality[] = [
  preset({ id: "tag", name: "林 · TAG", description: "选择性入池，主动争夺价值，位置纪律良好。", thinkingSpeed: "normal", vpip: 0.22, pfr: 0.18, aggression: 0.68, bluffFrequency: 0.16, positionAwareness: 0.85, foldToPressure: 0.56, adaptability: 0.68 }),
  preset({ id: "lag", name: "Kai · LAG", description: "范围宽、施压频繁，擅长利用位置和弃牌率。", thinkingSpeed: "normal", vpip: 0.38, pfr: 0.3, aggression: 0.78, bluffFrequency: 0.34, foldToPressure: 0.42, positionAwareness: 0.82, variance: 0.2, adaptability: 0.72 }),
  preset({ id: "rock", name: "石 · Rock", description: "极其谨慎，只用强范围投入大底池。", thinkingSpeed: "fast", vpip: 0.13, pfr: 0.09, aggression: 0.32, bluffFrequency: 0.04, callDownTendency: 0.25, foldToPressure: 0.76, slowPlayFrequency: 0.05, variance: 0.05 }),
  preset({ id: "station", name: "Momo · Calling Station", description: "入池宽、喜欢跟到底，主动加注较少。", thinkingSpeed: "fast", vpip: 0.47, pfr: 0.08, aggression: 0.18, bluffFrequency: 0.05, callDownTendency: 0.82, foldToPressure: 0.2, potOddsAwareness: 0.38, boardTextureAwareness: 0.36, variance: 0.11 }),
  preset({ id: "recreational", name: "阿乐 · Recreational", description: "被动而随性，偏爱看翻牌，尺度偶有偏差。", thinkingSpeed: "fast", vpip: 0.41, pfr: 0.12, aggression: 0.24, bluffFrequency: 0.12, callDownTendency: 0.62, foldToPressure: 0.38, potOddsAwareness: 0.3, positionAwareness: 0.28, variance: 0.28 }),
  preset({ id: "maniac", name: "Vex · Maniac", description: "极高频率下注与诈唬，用巨大方差持续施压。", thinkingSpeed: "fast", vpip: 0.62, pfr: 0.48, aggression: 0.95, bluffFrequency: 0.58, callDownTendency: 0.57, foldToPressure: 0.17, continuationBetFrequency: 0.88, doubleBarrelFrequency: 0.76, variance: 0.34 }),
  preset({ id: "grinder", name: "Nora · Grinder", description: "数学导向，重视赔率、有效筹码和稳定决策。", thinkingSpeed: "slow", vpip: 0.25, pfr: 0.2, aggression: 0.61, bluffFrequency: 0.17, callDownTendency: 0.46, potOddsAwareness: 0.96, stackAwareness: 0.94, boardTextureAwareness: 0.9, variance: 0.04, adaptability: 0.75 }),
  preset({ id: "trapper", name: "Silva · Trapper", description: "控制底池并隐藏强度，伺机慢打与反加。", thinkingSpeed: "slow", vpip: 0.23, pfr: 0.14, aggression: 0.5, bluffFrequency: 0.13, callDownTendency: 0.5, checkRaiseFrequency: 0.27, slowPlayFrequency: 0.38, trapFrequency: 0.42, variance: 0.1 }),
];

export function getPersonality(id: string): PokerPersonality {
  return PERSONALITIES.find((personality) => personality.id === id) ?? PERSONALITIES[0];
}
