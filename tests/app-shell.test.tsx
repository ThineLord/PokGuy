import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("application shell", () => {
  it("renders the RiverLab identity", () => {
    render(<Home />);
    expect(screen.getByText("训练桌正在就位")).toBeInTheDocument();
  });
});
