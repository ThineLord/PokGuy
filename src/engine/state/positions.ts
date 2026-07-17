export interface SeatRef {
  id: string;
  seat: number;
  active?: boolean;
}

function orderedActive(seats: SeatRef[]): SeatRef[] {
  return seats.filter((seat) => seat.active !== false).sort((a, b) => a.seat - b.seat);
}

export function nextSeat(seats: SeatRef[], fromSeat: number): SeatRef {
  const active = orderedActive(seats);
  if (active.length === 0) throw new Error("No active seats");
  return active.find((seat) => seat.seat > fromSeat) ?? active[0];
}

export function assignForcedPositions(
  seats: SeatRef[],
  dealerSeat: number,
): { button: SeatRef; smallBlind: SeatRef; bigBlind: SeatRef } {
  const active = orderedActive(seats);
  if (active.length < 2) throw new Error("At least two active players are required");
  const button = active.find((seat) => seat.seat === dealerSeat) ?? nextSeat(active, dealerSeat);
  if (active.length === 2) {
    return { button, smallBlind: button, bigBlind: nextSeat(active, button.seat) };
  }
  const smallBlind = nextSeat(active, button.seat);
  return { button, smallBlind, bigBlind: nextSeat(active, smallBlind.seat) };
}

export function firstToActPreflop(seats: SeatRef[], dealerSeat: number): SeatRef {
  const positions = assignForcedPositions(seats, dealerSeat);
  return seats.filter((seat) => seat.active !== false).length === 2
    ? positions.button
    : nextSeat(seats, positions.bigBlind.seat);
}

export function firstToActPostflop(seats: SeatRef[], dealerSeat: number): SeatRef {
  return nextSeat(seats, dealerSeat);
}

export function rotateButton(seats: SeatRef[], dealerSeat: number): number {
  return nextSeat(seats, dealerSeat).seat;
}
