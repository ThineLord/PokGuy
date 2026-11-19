import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/src/app/page";
import { formatBigBlinds } from "@/src/features/app/blindDisplay";
import { act, startHand } from "@/src/engine/state/gameState";
import {
  appendCompletedHand,
  defaultData,
  DEFAULT_SETTINGS,
  STORAGE_KEY,
} from "@/src/storage/storage";

describe("application shell", () => {
  it("renders the PokGuy identity", () => {
    render(<Home />);
    expect(screen.getByText("PokGuy")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "主导航" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("德州扑克牌桌")).toBeInTheDocument();
    expect(screen.getByText("顺时针行动")).toBeInTheDocument();
    expect(screen.getByText("小盲")).toBeInTheDocument();
    expect(screen.getByText("大盲")).toBeInTheDocument();
  });

  it("switches the complete interface to English", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: "切换到英文" }));

    expect(
      screen.getByRole("navigation", { name: "Main navigation" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Texas Hold'em table")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Fold/ })).toBeInTheDocument();
    expect(screen.getByText("Action moves clockwise")).toBeInTheDocument();
    expect(screen.getByText("Small blind")).toBeInTheDocument();
    expect(screen.getByText("Big blind")).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("en");
  });

  it("recovers malformed persisted settings before starting a hand", async () => {
    const user = userEvent.setup();
    const values = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        clear: () => values.clear(),
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
    const corrupted = defaultData();
    corrupted.settings = {
      ...corrupted.settings,
      smallBlind: 0,
      bigBlind: 0,
      selectedAiIds: null as never,
    };
    corrupted.aiProfiles = Array(8).fill(null) as never;
    corrupted.aiHabits = {
      tag: { hands: 1, vpip: 0.2 } as never,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(corrupted));

    render(<Home />);

    expect(
      await screen.findByText(/本地数据.*(迁移|恢复)/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("德州扑克牌桌")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /设置/ }));
    expect(screen.getByLabelText("小盲")).toHaveValue(
      DEFAULT_SETTINGS.smallBlind,
    );
    expect(screen.getByLabelText("大盲")).toHaveValue(
      DEFAULT_SETTINGS.bigBlind,
    );
    expect(screen.getAllByText(/TAG/).length).toBeGreaterThan(0);
  });

  it("rejects a damaged settings import without silently replacing data", async () => {
    const user = userEvent.setup();
    const { container } = render(<Home />);
    await user.click(await screen.findByRole("button", { name: /设置/ }));

    const payload = JSON.stringify({
      settings: { smallBlind: 0, bigBlind: 0 },
      aiProfiles: Array(8).fill(null),
    });
    const file = new File([payload], "damaged-settings.json", {
      type: "application/json",
    });
    Object.defineProperty(file, "text", {
      value: async () => payload,
    });
    const input =
      container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();
    await user.upload(input as HTMLInputElement, file);

    expect(
      await screen.findByText("文件无效、不兼容或超过 10 MB。未修改现有数据。"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("小盲")).toHaveValue(
      DEFAULT_SETTINGS.smallBlind,
    );
    expect(screen.getByLabelText("大盲")).toHaveValue(
      DEFAULT_SETTINGS.bigBlind,
    );
  });
});

describe("independent UI coordination regressions", () => {
  beforeEach(() => vi.stubGlobal("matchMedia", () => ({ matches: false })));
  afterEach(() => vi.unstubAllGlobals());
  it("ignores poker hotkeys away from the table and ignores repeated keydown", async () => {
    const values = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        clear: () => values.clear(),
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
    const data = defaultData();
    data.settings = { ...data.settings, seatCount: 2, autoAi: false };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    const user = userEvent.setup();
    render(<Home />);
    expect(screen.getByRole("button", { name: "弃牌" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: /^统计/ }));
    fireEvent.keyDown(document.body, { key: "f" });
    await user.click(screen.getByRole("button", { name: /^训练桌/ }));
    expect(screen.getByRole("button", { name: "弃牌" })).toBeEnabled();
    fireEvent.keyDown(document.body, { key: "f", repeat: true });
    expect(screen.getByRole("button", { name: "弃牌" })).toBeEnabled();
  });

  it("starts and switches language even when browser storage access throws", async () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, "localStorage")!;
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get: () => {
        throw new DOMException("Blocked", "SecurityError");
      },
    });
    try {
      const user = userEvent.setup();
      render(<Home />);
      expect(screen.getByLabelText("德州扑克牌桌")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "切换到英文" }));
      expect(screen.getByLabelText("Texas Hold'em table")).toBeInTheDocument();
    } finally {
      Object.defineProperty(window, "localStorage", descriptor);
    }
  });
});

describe("table size selection", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const data = defaultData();
    data.settings = { ...data.settings, autoAi: false, animations: false };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("previews each size without interrupting the hand, then starts and persists a new table", async () => {
    const user = userEvent.setup();
    const { container, unmount } = render(<Home />);
    for (const count of [2, 3, 4, 5, 6, 7, 8, 9]) {
      const before = container.querySelectorAll(".seat").length;
      await user.selectOptions(
        screen.getByLabelText("选择人数场"),
        String(count),
      );
      expect(container.querySelectorAll(".seat")).toHaveLength(before);
      await user.click(
        screen.getByRole("button", { name: `开启 ${count} 人场` }),
      );
      expect(container.querySelectorAll(".seat")).toHaveLength(count);
      expect(
        container.querySelectorAll(".hole-cards .playing-card"),
      ).toHaveLength(count * 2);
      expect(
        JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).settings
          .seatCount,
      ).toBe(count);
    }
    unmount();
    render(<Home />);
    expect(
      screen.getByRole("heading", { name: "9 人桌 · 100 BB" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "切换到英文" }));
    expect(screen.getByLabelText("Table size")).toHaveValue("9");
  });

  it("keeps a running table's size when settings are changed before the next hand", async () => {
    const data = defaultData();
    data.settings = {
      ...data.settings,
      seatCount: 2,
      autoAi: false,
      animations: false,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    const user = userEvent.setup();
    const { container } = render(<Home />);
    await user.click(screen.getByRole("button", { name: "弃牌" }));
    await user.click(screen.getByRole("button", { name: /^设置/ }));
    await user.selectOptions(screen.getByLabelText("桌面人数"), "9");
    await user.click(screen.getByRole("button", { name: /^训练桌/ }));
    await user.click(screen.getByRole("button", { name: "下一手" }));
    expect(container.querySelectorAll(".seat")).toHaveLength(2);
    expect(
      container.querySelector('.seat[data-seat="0"] .seat-meta'),
    ).toHaveTextContent("98.5 BB");
    await user.click(screen.getByRole("button", { name: "开启 9 人场" }));
    expect(container.querySelectorAll(".seat")).toHaveLength(9);
  });

  it("supports full-ring scenario positions and restores the cash table afterward", async () => {
    const user = userEvent.setup();
    const { container } = render(<Home />);
    await user.selectOptions(screen.getByLabelText("选择人数场"), "9");
    await user.click(screen.getByRole("button", { name: "开启 9 人场" }));
    await user.click(screen.getByRole("button", { name: /^单手牌/ }));
    fireEvent.change(screen.getByLabelText("对手数量"), {
      target: { value: "8" },
    });
    await user.selectOptions(screen.getByLabelText("位置"), "UTG+1");
    await user.click(screen.getByRole("button", { name: "开始此训练" }));
    expect(container.querySelectorAll(".seat")).toHaveLength(9);
    expect(
      container.querySelector('.seat[data-seat="0"] .seat-position'),
    ).toHaveTextContent("UTG+1");
    await user.click(screen.getByRole("button", { name: "返回现金桌" }));
    expect(container.querySelectorAll(".seat")).toHaveLength(9);
    expect(
      container.querySelector('.seat[data-seat="0"] .dealer-button'),
    ).toBeInTheDocument();
  });

  it("labels table amounts in big blinds when one blind is more than one chip", () => {
    const data = defaultData();
    data.settings = {
      ...data.settings,
      seatCount: 2,
      smallBlind: 1,
      bigBlind: 2,
      autoAi: false,
      animations: false,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    const { container } = render(<Home />);
    expect(container.querySelector(".pot-pill strong")).toHaveTextContent(
      "1.5 BB",
    );
    expect(
      container.querySelector('.seat[data-seat="0"] .seat-meta'),
    ).toHaveTextContent("99.5 BB");
    expect(
      container.querySelector('.seat[data-seat="0"] .seat-bet'),
    ).toHaveTextContent("投入 0.5");
    expect(screen.getByRole("button", { name: /^跟注/ })).toHaveTextContent(
      "0.5",
    );
    expect(container.querySelector(".info-strip")).toHaveTextContent(
      /跟注\s*0\.5 BB/,
    );
    const wager = screen.getByLabelText("下注总额");
    expect(wager).toHaveValue(2.5);
    fireEvent.change(wager, { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: /^加注/ }));
    expect(
      container.querySelector('.seat[data-seat="0"] .seat-bet'),
    ).toHaveTextContent("投入 3");
  });

  it("reports an undersized raise in big blinds, not raw chips", () => {
    const data = defaultData();
    data.settings = {
      ...data.settings,
      seatCount: 2,
      smallBlind: 1,
      bigBlind: 2,
      autoAi: false,
      animations: false,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    render(<Home />);
    const wager = screen.getByLabelText("下注总额");
    fireEvent.change(wager, { target: { value: "1.5" } });
    expect(wager).toHaveValue(1.5);
    const error = document.querySelector(".sizing-error");
    expect(error).toHaveTextContent("最小合法加注总额为 2 BB");
    expect(error).toHaveTextContent("最近合法值 2 BB");
    expect(error).not.toHaveTextContent("总额为 4");
    expect(error?.textContent).not.toMatch(/最近合法值(?:为)?\s*4/);
  });

  it("shows the legal minimum in big blinds when the blind is not an integer", () => {
    const data = defaultData();
    data.settings = {
      ...data.settings,
      seatCount: 2,
      smallBlind: 0.5,
      bigBlind: 1.5,
      autoAi: false,
      animations: false,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    const { container } = render(<Home />);
    expect(container.querySelector(".info-strip")).toHaveTextContent(
      /最小加注到\s*2 BB/,
    );
    const wager = screen.getByLabelText("下注总额");
    fireEvent.change(wager, { target: { value: "1.5" } });
    expect(wager).toHaveValue(1.5);
    expect(document.querySelector(".sizing-error")).toHaveTextContent(
      "最小合法加注总额为 2 BB",
    );
  });

  it("keeps a 6.01 chip bet on the native step and advances it by one chip", () => {
    const data = defaultData();
    data.settings = {
      ...data.settings,
      seatCount: 2,
      smallBlind: 1,
      bigBlind: 3,
      autoAi: false,
      animations: false,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    render(<Home />);
    const wager = screen.getByLabelText("下注总额") as HTMLInputElement;
    const slider = screen.getByLabelText("下注滑杆") as HTMLInputElement;
    fireEvent.change(wager, { target: { value: String(6.01 / 3) } });
    expect(wager.value).not.toBe("2.003");
    expect(Number((wager.valueAsNumber * 3).toFixed(2))).toBe(6.01);
    expect(slider.valueAsNumber).toBeCloseTo(6.01 / 3, 10);
    wager.stepUp();
    fireEvent.input(wager);
    expect(Number((wager.valueAsNumber * 3).toFixed(2))).toBe(6.02);
    expect(slider.valueAsNumber).toBeCloseTo(6.02 / 3, 10);
    expect(slider.valueAsNumber).not.toBeCloseTo(6.01 / 3, 10);
  });

  it("does not give two legal chip totals the same sizing value at a 10,000,000 blind", () => {
    const data = defaultData();
    data.settings = {
      ...data.settings,
      seatCount: 2,
      smallBlind: 5_000_000,
      bigBlind: 10_000_000,
      autoAi: false,
      animations: false,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    render(<Home />);
    const wager = screen.getByLabelText("下注总额") as HTMLInputElement;
    const slider = screen.getByLabelText("下注滑杆") as HTMLInputElement;
    fireEvent.change(wager, { target: { value: "2.000000001" } });
    expect(Number((wager.valueAsNumber * 10_000_000).toFixed(2))).toBe(
      20_000_000.01,
    );
    expect(wager.valueAsNumber).not.toBe(2);
    expect(slider.valueAsNumber).not.toBe(2);
    expect(formatBigBlinds(0.01, 10_000_000)).not.toBe("0");
  });

  it("shows chip remainders for seats, details, review, and hand profit at a 3-chip blind", async () => {
    const user = userEvent.setup();
    let settled = startHand({
      players: [
        { id: "hero", name: "Hero", seat: 0, stack: 300, kind: "human" },
        { id: "ai", name: "Villain", seat: 1, stack: 300.01, kind: "ai" },
      ],
      dealerSeat: 0,
      smallBlind: 1,
      bigBlind: 3,
      seed: 4,
      handId: "hand-bb3-remainder",
    });
    settled = act(settled, "hero", { type: "fold" });
    const data = appendCompletedHand(defaultData(), settled, "hero");
    data.settings = {
      ...data.settings,
      seatCount: 2,
      smallBlind: 1,
      bigBlind: 3,
      autoAi: false,
      animations: false,
    };
    const heroAction = settled.actions.find(
      (action) => action.playerId === "hero",
    )!;
    data.trainingRecords = [
      {
        handId: settled.handId,
        createdAt: "2026-11-19T00:00:02.000Z",
        grade: "未充分评估",
        context: {
          policyVersion: 1,
          actionIndex: settled.actions.indexOf(heroAction),
          street: heroAction.street,
          potBefore: heroAction.potBefore,
          toCall: 0.01,
          stackBefore: 300.01,
          amountCommitted: 0,
          equityEstimate: null,
          reason: "unassessed",
        },
      },
    ];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.open = true;
    };
    const { container } = render(<Home />);
    const heroSeat = container.querySelector('.seat[data-seat="0"]')!;
    expect(heroSeat.querySelector(".seat-meta")).toHaveTextContent("99.667 BB");
    expect(heroSeat).toHaveAccessibleName(/筹码 99\.667/);
    await user.click(screen.getByRole("button", { name: "查看座位详情 Hero" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("99.667 BB");
    await user.click(screen.getByRole("button", { name: "关闭座位详情" }));
    await user.click(screen.getByRole("button", { name: /历史与复盘/ }));
    expect(screen.getByRole("button", { name: /-0\.333 BB/ })).toBeVisible();
    expect(document.querySelector(".review-panel")).toHaveTextContent(
      "行动前筹码 100.003 BB",
    );
    expect(document.querySelector(".review-panel")).toHaveTextContent(
      "需跟注 0.003 BB",
    );
    await user.click(screen.getByRole("button", { name: /训练桌/ }));
    await user.click(screen.getByRole("button", { name: "弃牌" }));
    expect(container.querySelector(".info-strip")).toHaveTextContent(
      /-0\.333 BB/,
    );
  });
});
