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

  it("keeps user names even when they match generated labels", () => {
    const labels = disambiguatedSeatLabels(
      [
        seat("sb", 1, "Lin · TAG", "SB"),
        seat("bb", 2, "Lin · TAG", "BB"),
        seat("hero", 0, "Lin · TAG · SB", "BTN"),
        seat("co", 3, "Lin · TAG · SB · 1", "CO"),
      ],
      (player) => player.name,
    );

    expect(labels.get("hero")).toBe("Lin · TAG · SB");
    expect(labels.get("co")).toBe("Lin · TAG · SB · 1");
    expect(labels.get("bb")).toBe("Lin · TAG · BB");
    expect(new Set(labels.values()).size).toBe(4);
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
