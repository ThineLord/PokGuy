import "@testing-library/jest-dom/vitest";

afterEach(() => {
  if (typeof window !== "undefined") window.localStorage?.clear();
});
