import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/src/app/page";
import { defaultData, STORAGE_KEY } from "@/src/storage/storage";

vi.mock("@/src/engine/state/gameState", async () => {
  const actual = await vi.importActual<
    typeof import("@/src/engine/state/gameState")
  >("@/src/engine/state/gameState");
  const game = actual.act(
    actual.startHand({
      players: [
        { id: "hero", name: "Hero", seat: 0, stack: 10, kind: "human" },
        { id: "ai-1", name: "Button", seat: 1, stack: 100, kind: "ai" },
      ],
      dealerSeat: 1,
      smallBlind: 0.5,
      bigBlind: 1,
      seed: 19,
      handId: "hand-short-call-ui",
    }),
    "ai-1",
    { type: "all-in" },
  );
  return { ...actual, startHand: () => game };
});

describe("rendered short-stack call", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const data = defaultData();
    data.settings = {
      ...data.settings,
      seatCount: 2,
      autoAi: false,
      animations: false,
      showPotOdds: true,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shows the payable 9-chip call and 45% price, then records that call", async () => {
    const user = userEvent.setup();
    const { container } = render(<Home />);
    const call = await screen.findByRole("button", { name: /^跟注 9(?:\s|$)/ });
    expect(call).toBeEnabled();
    expect(call.textContent?.replace(/\s+/g, " ").trim()).toBe("跟注 9 C");
    expect(screen.queryByRole("button", { name: /^跟注 99/ })).toBeNull();
    expect(container.querySelector(".pot-pill")).toHaveTextContent("101 BB");
    expect(container.querySelector(".decision-context")).toHaveTextContent(
      "底池 101",
    );
    expect(container.querySelector(".decision-context")).toHaveTextContent(
      "跟注 9",
    );
    expect(container.querySelector(".decision-context")).not.toHaveTextContent(
      "跟注 99",
    );

    await user.click(screen.getByText("牌局详情与训练辅助"));
    const strip = container.querySelector(".info-strip");
    expect(strip).toHaveTextContent(/底池赔率\s*45\.0%/);
    expect(strip).not.toHaveTextContent("49.5%");
    expect(strip).toHaveTextContent(/跟注\s*9 BB/);

    await user.click(call);
    expect(await screen.findByText("主池")).toBeInTheDocument();
    const ledger = container.querySelector(".showdown-pot-ledger");
    expect(ledger).toHaveTextContent("20 BB");
    expect(ledger).toHaveTextContent("90 BB");
    await waitFor(() => {
      const saved = JSON.parse(
        window.localStorage.getItem(STORAGE_KEY) ?? "{}",
      );
      expect(saved.version).toBe(2);
      expect(saved.trainingRecords[0].context).toMatchObject({
        toCall: 9,
        amountCommitted: 9,
        stackBefore: 9,
        potBefore: 101,
      });
    });
  });
});
