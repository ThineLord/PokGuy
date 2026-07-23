import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";

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
});
