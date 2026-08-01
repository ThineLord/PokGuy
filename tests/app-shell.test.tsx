import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";
import {
  defaultData,
  DEFAULT_SETTINGS,
  STORAGE_KEY,
} from "@/src/storage/storage";

describe("application shell", () => {
  it("renders the RiverLab identity", () => {
    render(<Home />);
    expect(screen.getByText("RiverLab")).toBeInTheDocument();
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

  it("reports repairs applied to an imported settings file", async () => {
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
      await screen.findByText(/本地数据.*(迁移|恢复)/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("小盲")).toHaveValue(
      DEFAULT_SETTINGS.smallBlind,
    );
    expect(screen.getByLabelText("大盲")).toHaveValue(
      DEFAULT_SETTINGS.bigBlind,
    );
  });
});
