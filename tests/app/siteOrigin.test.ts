import { siteOriginFromHeaders } from "@/src/features/app/siteOrigin";

describe("site origin metadata", () => {
  it.each([
    ["localhost:3000", "http://localhost:3000"],
    ["127.0.0.1:4173", "http://127.0.0.1:4173"],
    ["192.168.1.25:3000", "http://192.168.1.25:3000"],
    ["10.0.0.5:3000", "http://10.0.0.5:3000"],
    ["172.31.2.4:3000", "http://172.31.2.4:3000"],
    ["[::1]:3000", "http://[::1]:3000"],
    ["[fd00::25]:3000", "http://[fd00::25]:3000"],
    ["riverlab.example", "https://riverlab.example"],
    ["riverlab.example:8443", "https://riverlab.example:8443"],
  ])("derives a safe default origin for %s", (host, expected) => {
    expect(siteOriginFromHeaders(host, null)).toBe(expected);
  });

  it("uses an explicit proxy protocol only when proxy headers are trusted", () => {
    expect(siteOriginFromHeaders("riverlab.example", "http", false)).toBe(
      "https://riverlab.example",
    );
    expect(siteOriginFromHeaders("riverlab.example", "http", true)).toBe(
      "http://riverlab.example",
    );
    expect(
      siteOriginFromHeaders("192.168.1.25:3000", "HTTPS, http", true),
    ).toBe("https://192.168.1.25:3000");
  });

  it.each([
    null,
    "",
    "bad host",
    "user@example.com",
    "example.com/path",
    "example.com:99999",
    "example.com,attacker.example",
  ])("falls back for an invalid host header: %s", (host) => {
    expect(siteOriginFromHeaders(host, "javascript")).toBe(
      "http://localhost:3000",
    );
  });
});
