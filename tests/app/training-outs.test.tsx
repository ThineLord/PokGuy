import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/src/app/page";
import { assessHand } from "@/src/ai/assessment/assessHand";
import { parseCards, type Card } from "@/src/engine/cards/cards";
import {
  defaultData,
  DEFAULT_SETTINGS,
  STORAGE_KEY,
} from "@/src/storage/storage";

function textureOuts(hole: string, board: string): number {
  return Math.round(
    assessHand(parseCards(hole) as [Card, Card], parseCards(board), 1)
      .drawStrength * 16,
  );
}

function outsReadout(
  container: HTMLElement,
): { label: string; count: number } | null {
  const span = [...container.querySelectorAll(".info-strip span")].find(
    (node) => {
      const label = node.querySelector("small")?.textContent ?? "";
      return label === "估算补牌张数" || label === "Estimated outs";
    },
  );
  if (!span) return null;
  const label = span.querySelector("small")?.textContent ?? "";
  const match = span.textContent?.match(/≈\s*(\d+)/);
  if (!match) throw new Error(`Outs readout has no count: ${span.textContent}`);
  return { label, count: Number(match[1]) };
}

async function startScenario(
  user: ReturnType<typeof userEvent.setup>,
  scenario: { hole: string; board: string; street: string; opponents?: string },
) {
  await user.click(screen.getByRole("button", { name: /^单手牌/ }));
  fireEvent.change(screen.getByLabelText("你的底牌"), {
    target: { value: scenario.hole },
  });
  fireEvent.change(screen.getByLabelText("公共牌"), {
    target: { value: scenario.board },
  });
  await user.selectOptions(screen.getByLabelText("起始街"), scenario.street);
  fireEvent.change(screen.getByLabelText("对手数量"), {
    target: { value: scenario.opponents ?? "1" },
  });
  await user.click(screen.getByRole("button", { name: "开始此训练" }));
  await user.click(screen.getByText("牌局详情与训练辅助"));
}

describe("training outs aid", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const data = defaultData();
    data.settings = {
      ...data.settings,
      seatCount: 2,
      autoAi: false,
      animations: false,
      showOuts: true,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  });

  afterEach(() => vi.unstubAllGlobals());

  it("omits outs when the hero already holds a royal flush", async () => {
    const user = userEvent.setup();
    const { container } = render(<Home />);
    await startScenario(user, {
      hole: "AS KS",
      board: "QS JS TS",
      street: "翻牌",
    });

    expect(screen.getByLabelText("公共牌")).toHaveTextContent("Q");
    expect(screen.getAllByLabelText("尚未发出的公共牌")).toHaveLength(2);
    expect(screen.getByLabelText("A 黑桃")).toBeInTheDocument();
    expect(screen.getByLabelText("K 黑桃")).toBeInTheDocument();
    expect(screen.getByLabelText("Q 黑桃")).toBeInTheDocument();
    expect(screen.getByLabelText("J 黑桃")).toBeInTheDocument();
    expect(screen.getByLabelText("10 黑桃")).toBeInTheDocument();
    expect(container.querySelector(".street-label")).toHaveTextContent("翻牌");
    expect(textureOuts("AS KS", "QS JS TS")).toBe(14);
    expect(outsReadout(container)).toBeNull();
    expect(container.querySelector(".info-strip")).toHaveTextContent("翻牌");
  });

  it("omits outs on the river when no board card remains", async () => {
    const user = userEvent.setup();
    const { container } = render(<Home />);
    await startScenario(user, {
      hole: "AS KS",
      board: "2C 3D 4H 5S 7D",
      street: "河牌",
    });

    expect(screen.queryByLabelText("尚未发出的公共牌")).toBeNull();
    expect(screen.getByLabelText("A 黑桃")).toBeInTheDocument();
    expect(screen.getByLabelText("K 黑桃")).toBeInTheDocument();
    expect(screen.getByLabelText("2 梅花")).toBeInTheDocument();
    expect(screen.getByLabelText("3 方片")).toBeInTheDocument();
    expect(screen.getByLabelText("4 红桃")).toBeInTheDocument();
    expect(screen.getByLabelText("5 黑桃")).toBeInTheDocument();
    expect(screen.getByLabelText("7 方片")).toBeInTheDocument();
    expect(container.querySelector(".street-label")).toHaveTextContent("河牌");
    expect(container.querySelectorAll(".seat")).toHaveLength(2);
    expect(textureOuts("AS KS", "2C 3D 4H 5S 7D")).toBe(11);
    expect(outsReadout(container)).toBeNull();
    expect(container.querySelector(".info-strip")).toHaveTextContent("河牌");
  });

  it("keeps a flop four-flush estimate, both labels, and the outs setting", async () => {
    const user = userEvent.setup();
    const hole = "AS KS";
    const board = "QS 7D 2S";
    const expected = textureOuts(hole, board);
    expect(DEFAULT_SETTINGS.showOuts).toBe(false);
    expect(expected).toBeGreaterThan(0);

    const { container } = render(<Home />);
    await startScenario(user, { hole, board, street: "翻牌" });

    expect(screen.getAllByLabelText("尚未发出的公共牌")).toHaveLength(2);
    expect(screen.getByLabelText("A 黑桃")).toBeInTheDocument();
    expect(screen.getByLabelText("K 黑桃")).toBeInTheDocument();
    expect(screen.getByLabelText("Q 黑桃")).toBeInTheDocument();
    expect(screen.getByLabelText("7 方片")).toBeInTheDocument();
    expect(screen.getByLabelText("2 黑桃")).toBeInTheDocument();
    expect(outsReadout(container)).toEqual({
      label: "估算补牌张数",
      count: expected,
    });

    await user.click(screen.getByRole("button", { name: "切换到英文" }));
    expect(outsReadout(container)).toEqual({
      label: "Estimated outs",
      count: expected,
    });

    await user.click(screen.getByRole("button", { name: /Settings/ }));
    const setting = screen.getByRole("checkbox", {
      name: "Show estimated outs",
    });
    expect(setting).toBeChecked();
    await user.click(setting);
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}").settings
        .showOuts,
    ).toBe(false);

    await user.click(screen.getByRole("button", { name: /Training table/ }));
    expect(outsReadout(container)).toBeNull();

    await user.click(screen.getByRole("button", { name: /Settings/ }));
    await user.click(
      screen.getByRole("checkbox", { name: "Show estimated outs" }),
    );
    await user.click(screen.getByRole("button", { name: /Training table/ }));
    expect(outsReadout(container)).toEqual({
      label: "Estimated outs",
      count: expected,
    });
  });

  it("keeps a turn four-flush estimate while one board card remains", async () => {
    const user = userEvent.setup();
    const hole = "AS KS";
    const board = "QS 7D 2S 3C";
    const expected = textureOuts(hole, board);
    expect(expected).toBeGreaterThan(0);

    const { container } = render(<Home />);
    await startScenario(user, { hole, board, street: "转牌" });

    expect(screen.getAllByLabelText("尚未发出的公共牌")).toHaveLength(1);
    expect(screen.getByLabelText("3 梅花")).toBeInTheDocument();
    expect(container.querySelector(".street-label")).toHaveTextContent("转牌");
    expect(outsReadout(container)).toEqual({
      label: "估算补牌张数",
      count: expected,
    });
  });
});
