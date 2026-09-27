// Accessing window.localStorage itself can throw under browser privacy policy.
// These adapters keep the app usable in memory when reads or writes fail.
export const browserStorage: Pick<Storage, "getItem" | "setItem"> = {
  getItem(key) {
    return typeof window === "undefined"
      ? null
      : window.localStorage.getItem(key);
  },
  setItem(key, value) {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  },
};

export function readBrowserValue(key: string): string | null {
  try {
    return browserStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeBrowserValue(key: string, value: string): void {
  try {
    browserStorage.setItem(key, value);
  } catch {
    /* State remains available in memory. */
  }
}
