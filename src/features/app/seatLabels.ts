// Two seats can share one displayed profile name. The hand already stores a
// position for each seat, so labels can point at that seat without rewriting
// the saved player, the profile, or the settlement.

export interface SeatLabelPlayer {
  id: string;
  seat: number;
  name: string;
  kind: "human" | "ai";
  personalityId?: string;
  positionLabel: string;
}

export function disambiguatedSeatLabels<T extends SeatLabelPlayer>(
  players: readonly T[],
  displayName: (player: T) => string,
): Map<string, string> {
  const named = players.map((player) => ({
    player,
    name: displayName(player),
  }));
  const counts = new Map<string, number>();
  for (const entry of named) {
    counts.set(entry.name, (counts.get(entry.name) ?? 0) + 1);
  }
  return new Map(
    named.map(({ player, name }) => {
      if ((counts.get(name) ?? 0) < 2) return [player.id, name];
      const position = player.positionLabel.trim();
      const qualifier = position || String(player.seat);
      return [player.id, `${name} · ${qualifier}`];
    }),
  );
}

export function pokerSeatLabels(
  players: readonly SeatLabelPlayer[],
  aiName: (id: string | undefined, fallback: string) => string,
): Map<string, string> {
  return disambiguatedSeatLabels(players, (player) =>
    player.kind === "ai"
      ? aiName(player.personalityId, player.name)
      : player.name,
  );
}
