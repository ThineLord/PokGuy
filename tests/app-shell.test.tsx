import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("application shell", () => {
  it("renders the RiverLab identity", () => {
    render(<Home />);
    expect(screen.getByText("RiverLab")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "主导航" })).toBeInTheDocument();
    expect(screen.getByLabelText("德州扑克牌桌")).toBeInTheDocument();
  });
});
