import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/src/app/page";
import { formatRecordedHandProfit } from "@/src/features/app/blindDisplay";
import { replayTimeline } from "@/src/features/app/replayTimeline";
import type { Card } from "@/src/engine/cards/cards";
import { loadData, STORAGE_KEY } from "@/src/storage/storage";
import {
  buttonShoveRunout,
  FLOP_BOARD,
  flopAllInRunout,
  flopForcedRunout,
  flopStreetFold,
  forcedBlindRunout,
  RIVER_BOARD,
  riverStartFold,
  RUNOUT_BOARD,
  singleFold,
  timelineHistory,
} from "../fixtures/replayHands";

const CHINESE_RUNOUT = ["9 方片", "9 红桃", "K 方片", "3 红桃", "8 红桃"];

function boardKey(board: readonly Card[]): string {
  return board.map((card) => `${card.rank}-${card.suit}`).join(" ");
}

function expectBoard(board: readonly Card[], expected: readonly Card[]) {
  expect(boardKey(board)).toBe(boardKey(expected));
}

function replayEvent(): HTMLElement {
  const event = document.querySelector(".replay-event");
  if (!(event instanceof HTMLElement)) throw new Error("Replay event missing");
  return event;
}

function stepText(): string {
  return document.querySelector(".replay-controls span")?.textContent ?? "";
}

function boardLabels(): string[] {
  return [...document.querySelectorAll(".replay-board .playing-card")].map(
    (card) => card.getAttribute("aria-label") ?? "",
  );
}

describe("saved-hand replay frames", () => {
  it("shows the button shove once and keeps the runout on its own final frame", () => {
    const game = buttonShoveRunout();
    const before = JSON.stringify(game);
    const frames = replayTimeline(game);

    expect(game.settled).toBe(true);
    expect(game.outcome?.termination).toBe("all-in-runout");
    expect(game.actions.map((action) => action.action.type)).toEqual([
      "all-in",
      "call",
    ]);
    expect(game.actions[0]).toMatchObject({
      playerId: "button",
      potBefore: 1.5,
      potAfter: 11,
    });
    expect(game.actions.every((action) => action.board.length === 0)).toBe(
      true,
    );
    expectBoard(game.board, RUNOUT_BOARD);
    expect(frames.map((frame) => frame.kind)).toEqual([
      "start",
      "action",
      "action",
      "runout",
    ]);
    expect(frames[0]?.board).toEqual([]);
    expect(frames[1]).toMatchObject({
      kind: "action",
      board: [],
      action: { action: { type: "all-in" }, potBefore: 1.5, potAfter: 11 },
    });
    expect(frames[2]).toMatchObject({
      kind: "action",
      board: [],
      action: { action: { type: "call" } },
    });
    expectBoard(frames[3]?.board ?? [], RUNOUT_BOARD);
    expect(JSON.stringify(game)).toBe(before);
  });

  it("keeps a one-fold hand to the starting frame and that single action", () => {
    const game = singleFold();
    const frames = replayTimeline(game);
    expect(game.actions).toHaveLength(1);
    expect(game.actions[0]?.action.type).toBe("fold");
    expect(game.board).toEqual([]);
    expect(frames.map((frame) => frame.kind)).toEqual(["start", "action"]);
    expect(frames[1]).toMatchObject({
      kind: "action",
      action: { action: { type: "fold" } },
    });
  });

  it("reaches a zero-action forced runout without showing those cards at the start", () => {
    const game = forcedBlindRunout();
    const before = JSON.stringify(game);
    const frames = replayTimeline(game);
    expect(game.actions).toEqual([]);
    expect(game.board).toHaveLength(5);
    expect(game.burnCards).toHaveLength(3);
    expect(frames.map((frame) => frame.kind)).toEqual(["start", "runout"]);
    expect(frames[0]?.board).toEqual([]);
    expect(frames[1]?.board).toHaveLength(5);
    expect(JSON.stringify(game)).toBe(before);
  });

  it("preserves a postflop starting board and hides cards dealt on later streets", () => {
    const folded = flopStreetFold();
    const foldedFrames = replayTimeline(folded);
    expect(folded.actions.map((action) => action.street)).toEqual([
      "flop",
      "flop",
      "turn",
    ]);
    expect(foldedFrames.map((frame) => frame.kind)).toEqual([
      "start",
      "action",
      "action",
      "action",
    ]);
    expectBoard(foldedFrames[0]?.board ?? [], FLOP_BOARD);
    expectBoard(foldedFrames[1]?.board ?? [], FLOP_BOARD);
    expectBoard(foldedFrames[2]?.board ?? [], FLOP_BOARD);
    expect(foldedFrames[3]?.board).toHaveLength(4);
    expectBoard(foldedFrames[3]?.board.slice(0, 3) ?? [], FLOP_BOARD);
    expect(boardKey(foldedFrames[3]?.board ?? [])).not.toBe(
      boardKey(FLOP_BOARD),
    );

    const runout = flopAllInRunout();
    const runoutFrames = replayTimeline(runout);
    expect(runout.outcome?.termination).toBe("all-in-runout");
    expect(runoutFrames.map((frame) => frame.kind)).toEqual([
      "start",
      "action",
      "action",
      "runout",
    ]);
    expect(
      runoutFrames
        .filter((frame) => frame.kind !== "runout")
        .every((frame) => boardKey(frame.board) === boardKey(FLOP_BOARD)),
    ).toBe(true);
    expect(runoutFrames.at(-1)?.board).toHaveLength(5);
    expectBoard(runoutFrames.at(-1)?.board.slice(0, 3) ?? [], FLOP_BOARD);

    const forced = flopForcedRunout();
    const forcedFrames = replayTimeline(forced);
    expect(forced.actions).toEqual([]);
    expect(forced.burnCards).toHaveLength(2);
    expect(forcedFrames.map((frame) => frame.kind)).toEqual([
      "start",
      "runout",
    ]);
    expectBoard(forcedFrames[0]?.board ?? [], FLOP_BOARD);
    expect(forcedFrames[1]?.board).toHaveLength(5);
    expectBoard(forcedFrames[1]?.board.slice(0, 3) ?? [], FLOP_BOARD);

    const river = riverStartFold();
    const riverFrames = replayTimeline(river);
    expect(riverFrames.map((frame) => frame.kind)).toEqual(["start", "action"]);
    expectBoard(riverFrames[0]?.board ?? [], RIVER_BOARD);
    expectBoard(riverFrames[1]?.board ?? [], RIVER_BOARD);
  });

  it("round-trips the synthetic history without changing the saved games", () => {
    const seeded = timelineHistory();
    const serialized = JSON.stringify(seeded);
    window.localStorage.setItem(STORAGE_KEY, serialized);
    const loaded = loadData(window.localStorage);
    expect(loaded.recentHands.map((hand) => hand.id)).toEqual([
      "hand-timeline-runout",
      "hand-timeline-fold",
    ]);
    expect(JSON.stringify(loaded.recentHands[0]?.game)).toBe(
      JSON.stringify(seeded.recentHands[0]?.game),
    );
    expect(JSON.stringify(loaded.recentHands[1]?.game)).toBe(
      JSON.stringify(seeded.recentHands[1]?.game),
    );
  });
});

describe("history replay controls", () => {
  const seeded = timelineHistory();
  const runout = seeded.recentHands[0];
  const fold = seeded.recentHands[1];
  if (!runout || !fold) throw new Error("Timeline fixture is missing a hand");
  const runoutProfit = `${runout.heroProfitBb >= 0 ? "+" : ""}${formatRecordedHandProfit(runout)} BB`;
  const foldProfit = `${fold.heroProfitBb >= 0 ? "+" : ""}${formatRecordedHandProfit(fold)} BB`;

  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function openHistory() {
    const user = userEvent.setup();
    render(<Home />);
    const history = await screen.findByRole("button", { name: /历史与复盘/ });
    await waitFor(() => expect(history).toBeEnabled());
    await user.click(history);
    return user;
  }

  function handButton(profit: string) {
    return screen.getByRole("button", {
      name: new RegExp(profit.replace(/[.+]/g, "\\$&")),
    });
  }

  it("steps the shove, the call, and the five-card runout exactly once", async () => {
    const user = await openHistory();
    const savedGames = JSON.stringify(
      seeded.recentHands.map((hand) => hand.game),
    );

    expect(stepText()).toBe("0/3");
    expect(replayEvent()).toHaveTextContent("起始状态");
    expect(replayEvent()).not.toHaveTextContent("全押");
    expect(replayEvent()).not.toHaveTextContent("1.5 BB → 11 BB");
    expect(boardLabels()).toEqual([]);

    await user.click(screen.getByRole("button", { name: "下一步" }));
    expect(stepText()).toBe("1/3");
    expect(replayEvent()).toHaveTextContent("全押");
    expect(replayEvent()).toHaveTextContent("1.5 BB → 11 BB");
    expect(replayEvent()).not.toHaveTextContent("跟注");
    expect(boardLabels()).toEqual([]);

    await user.click(screen.getByRole("button", { name: "下一步" }));
    expect(stepText()).toBe("2/3");
    expect(replayEvent()).toHaveTextContent("跟注");
    expect(replayEvent()).not.toHaveTextContent("全押");
    expect(replayEvent()).not.toHaveTextContent("1.5 BB → 11 BB");
    expect(boardLabels()).toEqual([]);

    await user.click(screen.getByRole("button", { name: "下一步" }));
    expect(stepText()).toBe("3/3");
    expect(replayEvent()).toHaveTextContent("终局公共牌");
    expect(replayEvent()).toHaveTextContent("公共牌已发完");
    expect(replayEvent()).not.toHaveTextContent("跟注");
    expect(replayEvent()).not.toHaveTextContent("全押");
    expect(boardLabels()).toEqual(CHINESE_RUNOUT);

    await user.click(screen.getByRole("button", { name: "下一步" }));
    expect(stepText()).toBe("3/3");
    await user.click(screen.getByRole("button", { name: "上一步" }));
    expect(stepText()).toBe("2/3");
    expect(boardLabels()).toEqual([]);

    expect(
      JSON.stringify(
        loadData(window.localStorage).recentHands.map((hand) => hand.game),
      ),
    ).toBe(savedGames);
  });

  it("stops autoplay on the terminal frame and restarts the selected hand", async () => {
    const user = await openHistory();
    await user.click(screen.getByRole("button", { name: "自动播放" }));
    await waitFor(
      () => {
        expect(stepText()).toBe("3/3");
        expect(
          screen.queryByRole("button", { name: "暂停" }),
        ).not.toBeInTheDocument();
      },
      { timeout: 5_000 },
    );
    expect(boardLabels()).toEqual(CHINESE_RUNOUT);
    expect(screen.getByRole("button", { name: "自动播放" })).toBeEnabled();

    await user.click(handButton(foldProfit));
    expect(stepText()).toBe("0/1");
    expect(replayEvent()).toHaveTextContent("起始状态");
    expect(replayEvent()).not.toHaveTextContent("终局公共牌");
    expect(boardLabels()).toEqual([]);
    expect(
      screen.queryByRole("button", { name: "暂停" }),
    ).not.toBeInTheDocument();
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    expect(stepText()).toBe("0/1");

    await user.click(handButton(runoutProfit));
    expect(stepText()).toBe("0/3");
    await user.click(screen.getByRole("button", { name: "自动播放" }));
    await user.click(
      within(screen.getByRole("group", { name: "复盘筛选" })).getByRole(
        "button",
        { name: "待复查" },
      ),
    );
    expect(stepText()).toBe("0/1");
    expect(replayEvent()).toHaveTextContent("起始状态");
    expect(
      screen.queryByRole("button", { name: "暂停" }),
    ).not.toBeInTheDocument();
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    expect(stepText()).toBe("0/1");
    expect(document.querySelectorAll(".history-item")).toHaveLength(1);
  });

  it("uses the same endpoints in English", async () => {
    const user = await openHistory();
    await user.click(screen.getByRole("button", { name: "切换到英文" }));
    expect(stepText()).toBe("0/3");
    expect(replayEvent()).toHaveTextContent("Starting state");
    expect(replayEvent()).toHaveTextContent("Blinds");
    expect(replayEvent()).not.toHaveTextContent("All-in");
    expect(replayEvent()).not.toHaveTextContent("1.5 BB → 11 BB");

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(stepText()).toBe("1/3");
    expect(replayEvent()).toHaveTextContent("All-in");
    expect(replayEvent()).toHaveTextContent("Pot 1.5 BB → 11 BB");
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(stepText()).toBe("2/3");
    expect(replayEvent()).toHaveTextContent("Call");
    expect(replayEvent()).not.toHaveTextContent("All-in");
    expect(boardLabels()).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(stepText()).toBe("3/3");
    expect(replayEvent()).toHaveTextContent("Final board");
    expect(replayEvent()).toHaveTextContent("Public cards dealt");
    expect(boardLabels()).toEqual([
      "9 diamonds",
      "9 hearts",
      "K diamonds",
      "3 hearts",
      "8 hearts",
    ]);

    await user.click(handButton(foldProfit));
    expect(stepText()).toBe("0/1");
    expect(replayEvent()).toHaveTextContent("Starting state");
    expect(screen.getByRole("button", { name: "Autoplay" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
  });
});
