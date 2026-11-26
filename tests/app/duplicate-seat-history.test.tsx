import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/src/app/page";
import type { PokerGameState } from "@/src/engine/state/gameState";
import {
  appendCompletedHand,
  defaultData,
  loadData,
  STORAGE_KEY,
} from "@/src/storage/storage";
import {
  fourSeatSeed6,
  threeSeatDuplicateTags,
  threeSeatUniqueNames,
} from "../fixtures/duplicateNameHands";

const CATEGORY = {
  "zh-CN": {
    "high-card": "高牌",
    pair: "一对",
    "two-pair": "两对",
    "three-of-a-kind": "三条",
    straight: "顺子",
    flush: "同花",
    "full-house": "葫芦",
    "four-of-a-kind": "四条",
    "straight-flush": "同花顺",
  },
  en: {
    "high-card": "High card",
    pair: "One pair",
    "two-pair": "Two pair",
    "three-of-a-kind": "Three of a kind",
    straight: "Straight",
    flush: "Flush",
    "full-house": "Full house",
    "four-of-a-kind": "Four of a kind",
    "straight-flush": "Straight flush",
  },
} as const;

function compact(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function replayText() {
  return compact(document.querySelector(".replay-event")?.textContent);
}

function summaryLines() {
  return [...document.querySelectorAll(".showdown-summary span")].map((node) =>
    compact(node.textContent),
  );
}

function categoryOf(game: PokerGameState, playerId: string) {
  const category = game.outcome?.showdown?.evaluations[playerId]?.category;
  if (!category) throw new Error(`No showdown hand for ${playerId}`);
  return category as keyof (typeof CATEGORY)["en"];
}

function persistedHands() {
  const duplicate = threeSeatDuplicateTags();
  const unique = threeSeatUniqueNames();
  const seed6 = fourSeatSeed6();
  let data = appendCompletedHand(defaultData(), duplicate, "hero");
  data = appendCompletedHand(data, unique, "hero");
  data = appendCompletedHand(data, seed6, "hero");
  const byId = new Map(data.recentHands.map((hand) => [hand.id, hand]));
  data = {
    ...data,
    settings: { ...data.settings, autoAi: false, animations: false },
    recentHands: [duplicate.handId, unique.handId, seed6.handId].map((id) => {
      const hand = byId.get(id);
      if (!hand) throw new Error(`Stored hand ${id} was dropped`);
      return hand;
    }),
  };
  return { data, duplicate, unique, seed6 };
}

describe("history labels for shared display names", () => {
  const { data, duplicate, unique, seed6 } = persistedHands();
  const savedGames = JSON.stringify(data.recentHands.map((hand) => hand.game));

  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps schema 2 identities and settles the genuine action lines", () => {
    expect(STORAGE_KEY).toBe("riverlab-poker-v2");
    const loaded = loadData({
      getItem: () => JSON.stringify(data),
    });
    expect(loaded.version).toBe(2);
    expect(JSON.stringify(loaded.recentHands.map((hand) => hand.game))).toBe(
      savedGames,
    );
    for (const hand of loaded.recentHands) {
      for (const player of hand.game.players) {
        expect(player.name).not.toMatch(/ · (BTN|SB|BB|CO)$/);
        expect(player.positionLabel.length).toBeGreaterThan(0);
      }
    }

    expect(duplicate.players.map((player) => player.positionLabel)).toEqual([
      "BTN",
      "SB",
      "BB",
    ]);
    expect(
      duplicate.players
        .filter((player) => player.kind === "ai")
        .map((player) => player.personalityId),
    ).toEqual(["tag", "tag"]);
    expect(
      duplicate.actions.map((action) => [action.playerId, action.action.type]),
    ).toEqual([
      ["hero", "fold"],
      ["ai-1", "all-in"],
      ["ai-2", "call"],
    ]);

    expect(
      unique.players.map((player) => player.personalityId ?? "human"),
    ).toEqual(["human", "tag", "lag"]);
    expect(unique.actions.map((action) => action.action.type)).toEqual([
      "fold",
      "all-in",
      "call",
    ]);

    expect(seed6.seed).toBe(6);
    expect(seed6.players.map((player) => player.positionLabel)).toEqual([
      "BTN",
      "SB",
      "BB",
      "CO",
    ]);
    expect(
      seed6.players.map((player) => [
        player.personalityId ?? "human",
        player.startingStack,
      ]),
    ).toEqual([
      ["human", 100],
      ["tag", 5],
      ["tag", 20],
      ["lag", 20],
    ]);
    expect(
      seed6.actions.map((action) => [action.playerId, action.action.type]),
    ).toEqual([
      ["ai-3", "all-in"],
      ["hero", "fold"],
      ["ai-1", "call"],
      ["ai-2", "call"],
    ]);
    expect(categoryOf(seed6, "ai-1")).toBe("straight");
    expect(categoryOf(seed6, "ai-2")).toBe("pair");
    expect(categoryOf(seed6, "ai-3")).toBe("high-card");
    expect(
      seed6.outcome?.showdown?.awards.map((award) => award.pot.amount),
    ).toEqual([15, 30]);
    expect(seed6.outcome?.showdown?.awards[0]).toMatchObject({
      winnerIds: ["ai-1"],
      shares: { "ai-1": 15 },
    });
    expect(seed6.outcome?.showdown?.awards[1]).toMatchObject({
      winnerIds: ["ai-2"],
      shares: { "ai-2": 30 },
    });
    const chips = seed6.players.reduce((sum, player) => sum + player.stack, 0);
    const started = seed6.players.reduce(
      (sum, player) => sum + player.startingStack,
      0,
    );
    expect(chips).toBe(started);
  });

  async function openHistory() {
    const user = userEvent.setup();
    render(<Home />);
    const history = await screen.findByRole("button", { name: /历史与复盘/ });
    await waitFor(() => expect(history).toBeEnabled());
    await user.click(history);
    await screen.findByText("逐街复盘");
    return user;
  }

  async function step(user: ReturnType<typeof userEvent.setup>, name: string) {
    await user.click(screen.getByRole("button", { name }));
  }

  function chooseHand(index: number) {
    const item = document.querySelectorAll(".history-item")[index];
    if (!(item instanceof HTMLElement))
      throw new Error(`Missing hand ${index}`);
    return item;
  }

  function expectHandLine(
    lines: string[],
    game: PokerGameState,
    playerId: string,
    locale: "zh-CN" | "en",
    position: string | null,
  ) {
    const name =
      game.players.find((player) => player.id === playerId)?.personalityId ===
      "lag"
        ? locale === "zh-CN"
          ? "凯 · 松凶型（LAG）"
          : "Kai · LAG"
        : locale === "zh-CN"
          ? "林 · 紧凶型（TAG）"
          : "Lin · TAG";
    const label = position ? `${name} · ${position}` : name;
    const separator = locale === "zh-CN" ? "：" : ": ";
    const category = CATEGORY[locale][categoryOf(game, playerId)];
    expect(lines).toContain(`${label}${separator}${category}`);
  }

  it("connects the three-seat shove, the unique-name hand, and seed 6 in Chinese", async () => {
    const user = await openHistory();
    expect(summaryLines()).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^林 · 紧凶型（TAG） · SB：/),
        expect.stringMatching(/^林 · 紧凶型（TAG） · BB：/),
      ]),
    );
    expect(
      summaryLines().some((line) => /^林 · 紧凶型（TAG）：/.test(line)),
    ).toBe(false);
    expectHandLine(summaryLines(), duplicate, "ai-1", "zh-CN", "SB");
    expectHandLine(summaryLines(), duplicate, "ai-2", "zh-CN", "BB");

    expect(replayText()).toContain("起始状态");
    await step(user, "下一步");
    expect(replayText()).toContain("Hero · 翻牌前 · 弃牌");
    expect(replayText()).not.toContain("Hero · BTN");
    await step(user, "下一步");
    expect(replayText()).toContain("林 · 紧凶型（TAG） · SB · 翻牌前 · 全押");
    expect(replayText()).not.toContain(
      "林 · 紧凶型（TAG） · BB · 翻牌前 · 全押",
    );
    await step(user, "下一步");
    expect(replayText()).toContain("林 · 紧凶型（TAG） · BB · 翻牌前 · 跟注");
    expect(replayText()).not.toContain(
      "林 · 紧凶型（TAG） · SB · 翻牌前 · 跟注",
    );

    await user.click(chooseHand(1));
    expectHandLine(summaryLines(), unique, "ai-1", "zh-CN", null);
    expectHandLine(summaryLines(), unique, "ai-2", "zh-CN", null);
    expect(summaryLines().join(" ")).not.toMatch(/（TAG） · |（LAG） · /);
    await step(user, "下一步");
    expect(replayText()).toContain("Hero · 翻牌前 · 弃牌");
    await step(user, "下一步");
    expect(replayText()).toContain("林 · 紧凶型（TAG） · 翻牌前 · 全押");
    expect(replayText()).not.toContain("林 · 紧凶型（TAG） · SB");
    await step(user, "下一步");
    expect(replayText()).toContain("凯 · 松凶型（LAG） · 翻牌前 · 跟注");
    expect(replayText()).not.toContain("凯 · 松凶型（LAG） · BB");

    await user.click(chooseHand(2));
    expectHandLine(summaryLines(), seed6, "ai-1", "zh-CN", "SB");
    expectHandLine(summaryLines(), seed6, "ai-2", "zh-CN", "BB");
    expectHandLine(summaryLines(), seed6, "ai-3", "zh-CN", null);
    expect(summaryLines()).toContain("林 · 紧凶型（TAG） · SB：顺子");
    expect(summaryLines()).toContain("林 · 紧凶型（TAG） · BB：一对");
    expect(summaryLines()).toContain("凯 · 松凶型（LAG）：高牌");
    await step(user, "下一步");
    expect(replayText()).toContain("凯 · 松凶型（LAG） · 翻牌前 · 全押");
    expect(replayText()).not.toContain("凯 · 松凶型（LAG） · CO");
    await step(user, "下一步");
    expect(replayText()).toContain("Hero · 翻牌前 · 弃牌");
    expect(replayText()).not.toContain("Hero · BTN");
    await step(user, "下一步");
    expect(replayText()).toContain("林 · 紧凶型（TAG） · SB · 翻牌前 · 跟注");
    await step(user, "下一步");
    expect(replayText()).toContain("林 · 紧凶型（TAG） · BB · 翻牌前 · 跟注");

    expect(
      JSON.stringify(
        loadData(window.localStorage).recentHands.map((hand) => hand.game),
      ),
    ).toBe(savedGames);
  });

  it("uses the same seat positions in English", async () => {
    const user = await openHistory();
    await user.click(screen.getByRole("button", { name: "切换到英文" }));
    await waitFor(() => expect(replayText()).toContain("Starting state"));

    expectHandLine(summaryLines(), duplicate, "ai-1", "en", "SB");
    expectHandLine(summaryLines(), duplicate, "ai-2", "en", "BB");
    await step(user, "Next");
    expect(replayText()).toContain("Hero · Preflop · Fold");
    expect(replayText()).not.toContain("Hero · BTN");
    await step(user, "Next");
    expect(replayText()).toContain("Lin · TAG · SB · Preflop · All-in");
    await step(user, "Next");
    expect(replayText()).toContain("Lin · TAG · BB · Preflop · Call");

    await user.click(chooseHand(1));
    expectHandLine(summaryLines(), unique, "ai-1", "en", null);
    expectHandLine(summaryLines(), unique, "ai-2", "en", null);
    expect(summaryLines().join(" ")).not.toMatch(/TAG · |LAG · /);
    await step(user, "Next");
    await step(user, "Next");
    expect(replayText()).toContain("Lin · TAG · Preflop · All-in");
    expect(replayText()).not.toContain("Lin · TAG · SB");
    await step(user, "Next");
    expect(replayText()).toContain("Kai · LAG · Preflop · Call");
    expect(replayText()).not.toContain("Kai · LAG · BB");

    await user.click(chooseHand(2));
    expect(summaryLines()).toContain("Lin · TAG · SB: Straight");
    expect(summaryLines()).toContain("Lin · TAG · BB: One pair");
    expect(summaryLines()).toContain("Kai · LAG: High card");
    await step(user, "Next");
    expect(replayText()).toContain("Kai · LAG · Preflop · All-in");
    expect(replayText()).not.toContain("Kai · LAG · CO");
    await step(user, "Next");
    expect(replayText()).toContain("Hero · Preflop · Fold");
    await step(user, "Next");
    expect(replayText()).toContain("Lin · TAG · SB · Preflop · Call");
    await step(user, "Next");
    expect(replayText()).toContain("Lin · TAG · BB · Preflop · Call");

    expect(
      JSON.stringify(
        loadData(window.localStorage).recentHands.map((hand) => hand.game),
      ),
    ).toBe(savedGames);
  });
});
