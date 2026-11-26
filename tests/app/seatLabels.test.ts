import { disambiguatedSeatLabels } from "@/src/features/app/seatLabels";

function seat(
  id: string,
  seatNumber: number,
  name: string,
  positionLabel: string,
) {
  return {
    id,
    seat: seatNumber,
    name,
    kind: "ai" as const,
    positionLabel,
  };
}

describe("disambiguated seat labels", () => {
  it("keeps a unique display name and qualifies only a shared one", () => {
    const labels = disambiguatedSeatLabels(
      [
        seat("hero", 0, "Hero", "BTN"),
        seat("sb", 1, "Lin · TAG", "SB"),
        seat("bb", 2, "Lin · TAG", "BB"),
        seat("co", 3, "Kai · LAG", "CO"),
      ],
      (player) => player.name,
    );

    expect(labels.get("hero")).toBe("Hero");
    expect(labels.get("sb")).toBe("Lin · TAG · SB");
    expect(labels.get("bb")).toBe("Lin · TAG · BB");
    expect(labels.get("co")).toBe("Kai · LAG");
  });

  it("uses the stored seat when a shared name has no position", () => {
    const labels = disambiguatedSeatLabels(
      [
        seat("sb", 1, "林 · 紧凶型（TAG）", " "),
        seat("bb", 2, "林 · 紧凶型（TAG）", ""),
      ],
      (player) => player.name,
    );

    expect(labels.get("sb")).toBe("林 · 紧凶型（TAG） · 1");
    expect(labels.get("bb")).toBe("林 · 紧凶型（TAG） · 2");
  });
});
