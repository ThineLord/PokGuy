const FALLBACK_ORIGIN = "http://localhost:3000";

function isLocalHostname(hostname: string): boolean {
  const normalized = hostname
    .toLowerCase()
    .replace(/^\[/, "")
    .replace(/\]$/, "");
  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized === "0.0.0.0" ||
    normalized === "::" ||
    normalized === "::1"
  )
    return true;

  const ipv4 = normalized.split(".").map(Number);
  if (
    ipv4.length === 4 &&
    ipv4.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)
  ) {
    return (
      ipv4[0] === 10 ||
      ipv4[0] === 127 ||
      (ipv4[0] === 169 && ipv4[1] === 254) ||
      (ipv4[0] === 172 && ipv4[1] >= 16 && ipv4[1] <= 31) ||
      (ipv4[0] === 192 && ipv4[1] === 168)
    );
  }

  return normalized.includes(":") && /^(?:fc|fd|fe[89ab])/i.test(normalized);
}

function validForwardedProtocol(value: string | null): "http" | "https" | null {
  const protocol = value?.split(",", 1)[0]?.trim().toLowerCase();
  return protocol === "http" || protocol === "https" ? protocol : null;
}

export function siteOriginFromHeaders(
  hostHeader: string | null,
  forwardedProtocol: string | null,
  trustProxy = false,
): string {
  if (!hostHeader) return FALLBACK_ORIGIN;
  const candidate = hostHeader.trim().toLowerCase();
  if (!candidate || /[\s,@]/.test(candidate)) return FALLBACK_ORIGIN;

  try {
    const parsed = new URL(`http://${candidate}`);
    if (
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash ||
      parsed.hostname.includes("..")
    )
      return FALLBACK_ORIGIN;

    const protocol =
      (trustProxy ? validForwardedProtocol(forwardedProtocol) : null) ??
      (isLocalHostname(parsed.hostname) ? "http" : "https");
    return `${protocol}://${parsed.host}`;
  } catch {
    return FALLBACK_ORIGIN;
  }
}
