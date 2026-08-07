import { createHmac, randomBytes, timingSafeEqual } from "crypto";

function csrfSecret(): string {
  const secret = process.env.CSRF_SECRET || process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("CSRF_SECRET or SESSION_SECRET must be at least 32 characters.");
  }
  return secret;
}

export function createCsrfToken(): string {
  const nonce = randomBytes(24).toString("hex");
  const sig = createHmac("sha256", csrfSecret()).update(nonce).digest("hex");
  return `${nonce}.${sig}`;
}

export function verifyCsrfToken(token: string | null | undefined): boolean {
  if (!token || !token.includes(".")) return false;
  const [nonce, sig] = token.split(".");
  if (!nonce || !sig) return false;
  const expected = createHmac("sha256", csrfSecret()).update(nonce).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}
