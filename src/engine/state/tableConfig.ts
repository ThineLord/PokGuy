export const MIN_TABLE_PLAYERS = 2;
export const MAX_TABLE_PLAYERS = 9;
export const TABLE_SIZES = [2, 3, 4, 5, 6, 7, 8, 9] as const;

// Clockwise from the button; shared by live hands and scenario selection.
export function tablePositions(playerCount: number): string[] {
  switch (playerCount) {
    case 2:
      return ["BTN", "BB"];
    case 3:
      return ["BTN", "SB", "BB"];
    case 4:
      return ["BTN", "SB", "BB", "CO"];
    case 5:
      return ["BTN", "SB", "BB", "UTG", "CO"];
    case 6:
      return ["BTN", "SB", "BB", "UTG", "HJ", "CO"];
    case 7:
      return ["BTN", "SB", "BB", "UTG", "LJ", "HJ", "CO"];
    case 8:
      return ["BTN", "SB", "BB", "UTG", "UTG+1", "LJ", "HJ", "CO"];
    case 9:
      return ["BTN", "SB", "BB", "UTG", "UTG+1", "MP", "LJ", "HJ", "CO"];
    default:
      throw new Error("A table requires 2 to 9 players");
  }
}
