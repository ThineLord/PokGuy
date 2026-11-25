import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/src/app/page";
import { STORAGE_KEY } from "@/src/storage/storage";

type StoredTableSettings = {
  startingStackBb: number;
  smallBlind: number;
  bigBlind: number;
  aiDelayMs: number;
};

function storedSettings(): StoredTableSettings {
  const serialized = window.localStorage.getItem(STORAGE_KEY);
  const stored = serialized
    ? (JSON.parse(serialized) as { settings?: StoredTableSettings })
    : null;
  if (!stored?.settings) throw new Error("missing riverlab-poker-v2 settings");
  return stored.settings;
}

async function showSettings(user: ReturnType<typeof userEvent.setup>) {
  render(<Home />);
  await user.click(await screen.findByRole("button", { name: /设置/ }));
}

function field(label: string) {
  return screen.getByLabelText(label) as HTMLInputElement;
}

async function selectAllAndType(
  user: ReturnType<typeof userEvent.setup>,
  input: HTMLInputElement,
  text: string,
) {
  input.focus();
  await user.keyboard("{Control>}a{/Control}");
  for (const key of text) await user.keyboard(key);
}

describe("settings table numeric entry", () => {
  it("keeps sequential stack and fractional blind text until commit", async () => {
    const user = userEvent.setup();
    await showSettings(user);
    const stack = field("初始筹码（BB）");
    const smallBlind = field("小盲");

    await selectAllAndType(user, stack, "7");
    expect(stack.value).toBe("7");
    const whileTyping = window.localStorage.getItem(STORAGE_KEY);
    if (whileTyping) {
      expect(
        (JSON.parse(whileTyping) as { settings?: StoredTableSettings }).settings
          ?.startingStackBb,
      ).toBe(100);
    }
    await user.keyboard("5{Tab}");
    expect(stack).toHaveValue(75);
    expect(storedSettings().startingStackBb).toBe(75);

    await selectAllAndType(user, smallBlind, "0");
    expect(Number(smallBlind.value)).toBe(0);
    expect(storedSettings().smallBlind).toBe(0.5);
    await user.keyboard(".25{Tab}");
    expect(smallBlind).toHaveValue(0.25);
    expect(storedSettings()).toMatchObject({
      smallBlind: 0.25,
      bigBlind: 1,
    });

    const bigBlind = field("大盲");
    await selectAllAndType(user, bigBlind, "2");
    await user.keyboard("{Enter}");
    expect(bigBlind).toHaveValue(2);
    expect(storedSettings().bigBlind).toBe(2);
  });

  it("restores the previous amount when the committed text is not usable", async () => {
    const user = userEvent.setup();
    await showSettings(user);
    const stack = field("初始筹码（BB）");
    const smallBlind = field("小盲");
    const bigBlind = field("大盲");

    await selectAllAndType(user, stack, "7");
    await user.tab();
    expect(stack).toHaveValue(100);

    await selectAllAndType(user, stack, "75");
    await user.tab();
    expect(storedSettings().startingStackBb).toBe(75);
    await selectAllAndType(user, stack, "7");
    await user.tab();
    expect(stack).toHaveValue(75);
    expect(storedSettings().startingStackBb).toBe(75);

    smallBlind.focus();
    await user.keyboard("{Control>}a{/Control}{Backspace}{Tab}");
    expect(smallBlind).toHaveValue(0.5);
    expect(storedSettings().smallBlind).toBe(0.5);

    await selectAllAndType(user, smallBlind, "0.255");
    await user.tab();
    expect(smallBlind).toHaveValue(0.5);
    expect(storedSettings()).toMatchObject({ smallBlind: 0.5, bigBlind: 1 });

    await selectAllAndType(user, bigBlind, "0.25");
    await user.tab();
    expect(bigBlind).toHaveValue(1);
    expect(smallBlind).toHaveValue(0.5);
    expect(storedSettings()).toMatchObject({ smallBlind: 0.5, bigBlind: 1 });
  });

  it("accepts a pasted or filled valid amount and keeps the current hand", async () => {
    const user = userEvent.setup();
    render(<Home />);
    expect(await screen.findByLabelText("小盲，0.5 BB")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /设置/ }));
    const stack = field("初始筹码（BB）");
    const smallBlind = field("小盲");

    stack.focus();
    await user.keyboard("{Control>}a{/Control}");
    await user.paste("120");
    await user.tab();
    expect(stack).toHaveValue(120);
    expect(storedSettings().startingStackBb).toBe(120);

    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    setter?.call(smallBlind, "0.3");
    fireEvent.input(smallBlind);
    fireEvent.blur(smallBlind);
    expect(smallBlind).toHaveValue(0.3);
    expect(storedSettings().smallBlind).toBe(0.3);

    await user.click(screen.getByRole("button", { name: /训练桌/ }));
    expect(screen.getByLabelText("小盲，0.5 BB")).toBeInTheDocument();
    expect(screen.queryByLabelText("小盲，0.3 BB")).not.toBeInTheDocument();
  });

  it("reloads the committed stack and blind from riverlab-poker-v2", async () => {
    const user = userEvent.setup();
    const view = render(<Home />);
    await user.click(await screen.findByRole("button", { name: /设置/ }));
    const stack = field("初始筹码（BB）");
    await selectAllAndType(user, stack, "75");
    await user.tab();
    const smallBlind = field("小盲");
    await selectAllAndType(user, smallBlind, "0.25");
    await user.tab();
    expect(storedSettings()).toMatchObject({
      startingStackBb: 75,
      smallBlind: 0.25,
      bigBlind: 1,
    });

    view.unmount();
    render(<Home />);
    await user.click(await screen.findByRole("button", { name: /设置/ }));
    expect(field("初始筹码（BB）")).toHaveValue(75);
    expect(field("小盲")).toHaveValue(0.25);
    expect(field("大盲")).toHaveValue(1);
    expect(STORAGE_KEY).toBe("riverlab-poker-v2");
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain(
      '"startingStackBb":75',
    );
  });
});
