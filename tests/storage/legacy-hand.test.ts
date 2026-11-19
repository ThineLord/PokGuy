import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createBackup, parseBackup } from "@/src/storage/backup";
import {
  defaultData,
  loadDataWithRecovery,
  STORAGE_KEY,
} from "@/src/storage/storage";
import type { PersistedData } from "@/src/storage/types";
import type { SidePot } from "@/src/engine/pots/sidePots";

const prefs = { locale: "en" as const, theme: "dark" as const };
const fixture = JSON.parse(
  readFileSync(
    resolve("tests/storage/fixtures/legacy-same-eligibility-pots.json"),
    "utf8",
  ),
) as PersistedData;

function load(data: PersistedData) {
  return loadDataWithRecovery({
    getItem: (key: string) =>
      key === STORAGE_KEY ? JSON.stringify(data) : null,
  });
}

function reorderPot(pot: SidePot): SidePot {
  return {
    eligiblePlayerIds: pot.eligiblePlayerIds,
    contributors: pot.contributors,
    cap: pot.cap,
    amount: pot.amount,
    id: pot.id,
  };
}

describe("schema 2 hands settled by the previous pot layers", () => {
  it("keeps the original 0.11 and 0.13 payouts in history and backup", () => {
    const loaded = load(fixture);
    const hand = loaded.data.recentHands[0];
    expect(loaded.data.recentHands).toHaveLength(1);
    expect(hand.game.outcome?.payouts).toEqual({
      hero: 0.11,
      s1: 0,
      s2: 0,
      s3: 0,
      s4: 0.13,
    });
    expect(hand.game.outcome?.pots.map((pot) => pot.amount)).toEqual([
      0.05, 0.04, 0.09, 0.06,
    ]);
    expect(
      new Set(
        hand.game.outcome?.pots.map((pot) => pot.eligiblePlayerIds.join()),
      ),
    ).toEqual(new Set(["hero,s4"]));
    const restored = parseBackup(
      JSON.stringify(createBackup(fixture, prefs)),
      defaultData(),
      prefs,
    );
    expect(restored.backup.data.recentHands[0].game.outcome?.payouts).toEqual(
      hand.game.outcome?.payouts,
    );
    expect(restored.backup.preferences).toEqual(prefs);
  });

  it("still accepts that hand when only pot object keys are reversed", () => {
    const data = structuredClone(fixture);
    const outcome = data.recentHands[0].game.outcome;
    if (!outcome) throw new Error("fixture must be complete");
    outcome.pots = outcome.pots.map(reorderPot);
    const loaded = load(data);
    expect(loaded.data.recentHands[0].game.outcome?.payouts).toEqual({
      hero: 0.11,
      s1: 0,
      s2: 0,
      s3: 0,
      s4: 0.13,
    });
    expect(() =>
      parseBackup(
        JSON.stringify(createBackup(data, prefs)),
        defaultData(),
        prefs,
      ),
    ).not.toThrow();
  });

  it("rejects changed amounts, eligibility, shares, and payouts", () => {
    const cases = [
      (data: PersistedData) => {
        data.recentHands[0].game.outcome!.pots[0].amount = 0.06;
      },
      (data: PersistedData) => {
        data.recentHands[0].game.outcome!.pots[0].cap = 0.03;
      },
      (data: PersistedData) => {
        data.recentHands[0].game.outcome!.pots[0].contributors.pop();
      },
      (data: PersistedData) => {
        data.recentHands[0].game.outcome!.pots[0].eligiblePlayerIds.pop();
      },
      (data: PersistedData) => {
        const award = data.recentHands[0].game.outcome?.showdown?.awards[0];
        if (!award) throw new Error("missing award");
        award.shares = { hero: 0.03, s4: 0.02 };
      },
      (data: PersistedData) => {
        const game = data.recentHands[0].game;
        game.outcome!.payouts.hero = 0.12;
        game.outcome!.payouts.s4 = 0.12;
        game.outcome!.showdown!.payouts.hero = 0.12;
        game.outcome!.showdown!.payouts.s4 = 0.12;
        const hero = game.players.find((player) => player.id === "hero")!;
        const seat = game.players.find((player) => player.id === "s4")!;
        hero.stack = 10.04;
        seat.stack = 10.04;
      },
    ];
    for (const mutate of cases) {
      const data = structuredClone(fixture);
      mutate(data);
      expect(load(data).data.recentHands).toEqual([]);
      expect(() =>
        parseBackup(
          JSON.stringify(createBackup(data, prefs)),
          defaultData(),
          prefs,
        ),
      ).toThrow("backup-invalid-data");
    }
  });
});
