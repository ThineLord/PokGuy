import { migrateData, loadData, saveData, STORAGE_KEY } from "@/src/storage/storage";

describe("versioned LocalStorage", () => {
  it("migrates version 1 settings and fills new defaults", () => {
    const migrated = migrateData({ version: 1, settings: { playerName: "旧玩家", seatCount: 3 } });
    expect(migrated.version).toBe(2);
    expect(migrated.settings.playerName).toBe("旧玩家");
    expect(migrated.settings.animations).toBe(true);
    expect(migrated.aiProfiles).toHaveLength(8);
  });

  it("recovers from corrupted JSON", () => {
    const storage = { getItem: () => "{bad json" };
    expect(loadData(storage).settings.seatCount).toBe(6);
  });

  it("round-trips data through a storage adapter", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
    };
    const data = migrateData({ version: 1, settings: { playerName: "River" } });
    expect(saveData(data, storage)).toBe(true);
    expect(values.has(STORAGE_KEY)).toBe(true);
    expect(loadData(storage).settings.playerName).toBe("River");
  });
});
