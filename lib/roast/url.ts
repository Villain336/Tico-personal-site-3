import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Turns whatever a visitor typed into a safe, public http(s) URL — or throws
 * a human-readable error. The roast fetches the target server-side, so we
 * refuse anything that could point back into our own network.
 */
export async function normalizePublicUrl(input: string): Promise<URL> {
  const trimmed = input.trim();
  if (!trimmed) throw new RoastInputError("Paste a URL first.");
  if (trimmed.length > 2048) throw new RoastInputError("That URL is suspiciously long.");

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new RoastInputError("That doesn't look like a valid URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new RoastInputError("Only http and https pages can be roasted.");
  }
  if (url.username || url.password) {
    throw new RoastInputError("Drop the credentials from that URL.");
  }
  url.hash = "";

  await assertPublicHost(url.hostname);
  return url;
}

export async function assertPublicHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    !host.includes(".")
  ) {
    throw new RoastInputError("Public websites only — nice try though.");
  }

  const literal = host.replace(/^\[|\]$/g, "");
  if (isIP(literal)) {
    if (isPrivateAddress(literal)) {
      throw new RoastInputError("Public websites only — nice try though.");
    }
    return;
  }

  let addresses: { address: string }[];
  try {
    addresses = await lookup(host, { all: true });
  } catch {
    throw new RoastInputError("Couldn't find that domain. Typo?");
  }
  if (addresses.some((a) => isPrivateAddress(a.address))) {
    throw new RoastInputError("Public websites only — nice try though.");
  }
}

export function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  if (v6 === "::" || v6 === "::1") return true;
  if (v6.startsWith("fe80:") || v6.startsWith("fc") || v6.startsWith("fd")) return true;
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateAddress(mapped[1]);
  return false;
}

export class RoastInputError extends Error {
  status = 400;
}
