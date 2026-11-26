import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/src/app/page";
import type { PokerGameState } from "@/src/engine/state/gameState";
import { defaultData, loadData, STORAGE_KEY } from "@/src/storage/storage";

function seed6Game(): PokerGameState {
  const game = (globalThis as { __seed6Game?: PokerGameState }).__seed6Game;
  if (!game) throw new Error("Seed 6 hand was not dealt");
  return game;
}

vi.mock("@/src/engine/state/gameState", async () => {
  const actual = await vi.importActual<
    typeof import("@/src/engine/state/gameState")
  >("@/src/engine/state/gameState");
  let game = actual.startHand({
    players: [
      { id: "hero", name: "Hero", seat: 0, stack: 100, kind: "human" },
      {
        id: "ai-1",
        name: "林 · TAG",
        seat: 1,
        stack: 5,
        kind: "ai",
        personalityId: "tag",
      },
      {
        id: "ai-2",
        name: "林 · TAG",
        seat: 2,
        stack: 20,
        kind: "ai",
        personalityId: "tag",
      },
      {
        id: "ai-3",
        name: "Kai · LAG",
        seat: 3,
        stack: 20,
        kind: "ai",
        personalityId: "lag",
      },
    ],
    dealerSeat: 0,
    smallBlind: 0.5,
    bigBlind: 1,
    seed: 6,
    handId: "hand-seed6-1700000000000",
  });
  for (const type of ["all-in", "fold", "call", "call"] as const) {
    const actor = game.actingPlayerId;
    if (!actor) throw new Error(`No player to ${type}`);
    game = actual.act(game, actor, { type });
  }
  (globalThis as { __seed6Game?: typeof game }).__seed6Game = game;
  return { ...actual, startHand: () => game };
});

function compact(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function text(selector: string) {
  return compact(document.querySelector(selector)?.textContent);
}

function winnerNames() {
  return [...document.querySelectorAll(".showdown-player.is-winner")].map(
    (article) => ({
      name: compact(
        article.querySelector(".showdown-player-title strong")?.textContent,
      ),
      hand: compact(
        article.querySelector(".showdown-hand-label strong")?.textContent,
      ),
    }),
  );
}

function seatNames() {
  return [...document.querySelectorAll(".seat-topline strong")].map((node) =>
    compact(node.textContent),
  );
}

describe("live showdown labels for the seed 6 double winner", () => {
  const original = JSON.stringify(seed6Game());

  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const data = defaultData();
    data.settings = { ...data.settings, autoAi: false, animations: false };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("distinguishes both TAG payouts in Chinese and English without renaming seats", async () => {
    const user = userEvent.setup();
    render(<Home />);
    expect(await screen.findByText("主池")).toBeInTheDocument();

    expect(text(".showdown-pot-ledger")).toMatch(
      /林 · 紧凶型（TAG） · SB \+\s*15/,
    );
    expect(text(".showdown-pot-ledger")).toMatch(
      /林 · 紧凶型（TAG） · BB \+\s*30/,
    );
    expect(text(".showdown-pot-ledger")).not.toMatch(
      /林 · 紧凶型（TAG）(?! · )/,
    );
    expect(text(".pot-award")).toContain("林 · 紧凶型（TAG） · SB");
    expect(text(".pot-award")).toContain("林 · 紧凶型（TAG） · BB");
    expect(text(".pot-award")).not.toMatch(/林 · 紧凶型（TAG）(?! · )/);
    expect(winnerNames()).toEqual(
      expect.arrayContaining([
        { name: "林 · 紧凶型（TAG） · SB", hand: "顺子" },
        { name: "林 · 紧凶型（TAG） · BB", hand: "一对" },
      ]),
    );
    expect(
      compact(
        [...document.querySelectorAll(".showdown-player")]
          .find((article) =>
            compact(article.textContent).includes("凯 · 松凶型（LAG）"),
          )
          ?.querySelector(".showdown-player-title strong")?.textContent,
      ),
    ).toBe("凯 · 松凶型（LAG）");
    expect(document.querySelectorAll(".showdown-player")).toHaveLength(3);
    expect(
      seatNames().filter((name) => name === "林 · 紧凶型（TAG）"),
    ).toHaveLength(2);
    expect(seatNames()).toContain("凯 · 松凶型（LAG）");
    expect(seatNames()).toContain("Hero");
    expect(seatNames().join(" ")).not.toMatch(/ · (SB|BB|CO|BTN)/);

    await user.click(screen.getByRole("button", { name: "切换到英文" }));
    await screen.findByText("Main pot");
    expect(text(".showdown-pot-ledger")).toMatch(/Lin · TAG · SB \+\s*15/);
    expect(text(".showdown-pot-ledger")).toMatch(/Lin · TAG · BB \+\s*30/);
    expect(text(".showdown-pot-ledger")).not.toMatch(/Lin · TAG(?! · )/);
    expect(text(".pot-award")).toContain("Lin · TAG · SB");
    expect(text(".pot-award")).toContain("Lin · TAG · BB");
    expect(winnerNames()).toEqual(
      expect.arrayContaining([
        { name: "Lin · TAG · SB", hand: "Straight" },
        { name: "Lin · TAG · BB", hand: "One pair" },
      ]),
    );
    expect(
      [...document.querySelectorAll(".showdown-player-title strong")].map(
        (node) => compact(node.textContent),
      ),
    ).toContain("Kai · LAG");
    expect(
      [...document.querySelectorAll(".showdown-player-title strong")]
        .map((node) => compact(node.textContent))
        .filter((name) => name === "Kai · LAG · CO"),
    ).toEqual([]);
    expect(seatNames().filter((name) => name === "Lin · TAG")).toHaveLength(2);
    expect(seatNames()).toContain("Kai · LAG");

    await waitFor(() => {
      const stored = loadData(window.localStorage);
      expect(stored.version).toBe(2);
      expect(stored.recentHands).toHaveLength(1);
      expect(JSON.stringify(stored.recentHands[0]?.game)).toBe(original);
    });
    expect(JSON.stringify(seed6Game())).toBe(original);
    const storedPlayers = loadData(window.localStorage).recentHands[0]?.game
      .players;
    expect(
      storedPlayers?.map((player) => player.personalityId ?? "human"),
    ).toEqual(["human", "tag", "tag", "lag"]);
    expect(storedPlayers?.map((player) => player.name)).toEqual([
      "Hero",
      "林 · TAG",
      "林 · TAG",
      "Kai · LAG",
    ]);
    expect(
      storedPlayers?.every((player) => player.holeCards.length === 2),
    ).toBe(true);
    expect(document.querySelectorAll(".showdown-mini-card")).toHaveLength(21);
  });
});
