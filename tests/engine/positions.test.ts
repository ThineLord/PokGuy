import {
  assignForcedPositions,
  firstToActPostflop,
  firstToActPreflop,
  rotateButton,
} from "@/src/engine/state/positions";

const sixSeats = Array.from({ length: 6 }, (_, seat) => ({
  id: String(seat),
  seat,
}));

describe("positions and action order", () => {
  it("assigns blinds and UTG preflop at a six-max table", () => {
    const positions = assignForcedPositions(sixSeats, 0);
    expect(positions.smallBlind.seat).toBe(1);
    expect(positions.bigBlind.seat).toBe(2);
    expect(firstToActPreflop(sixSeats, 0).seat).toBe(3);
    expect(firstToActPostflop(sixSeats, 0).seat).toBe(1);
  });

  it("uses button as small blind and first preflop in heads-up", () => {
    const headsUp = [
      { id: "hero", seat: 0 },
      { id: "villain", seat: 4 },
    ];
    const positions = assignForcedPositions(headsUp, 0);
    expect(positions.smallBlind.id).toBe("hero");
    expect(positions.bigBlind.id).toBe("villain");
    expect(firstToActPreflop(headsUp, 0).id).toBe("hero");
    expect(firstToActPostflop(headsUp, 0).id).toBe("villain");
  });

  it("rotates the button clockwise while skipping inactive seats", () => {
    expect(
      rotateButton(
        [
          { id: "a", seat: 0 },
          { id: "b", seat: 2, active: false },
          { id: "c", seat: 4 },
        ],
        0,
      ),
    ).toBe(4);
  });
});
