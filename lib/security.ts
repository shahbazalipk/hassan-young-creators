import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { createHmac } from "crypto";

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hashIp(ip: string | null | undefined): string {
  const salt = process.env.SESSION_SECRET || "ip-salt";
  return createHmac("sha256", salt)
    .update(ip || "unknown")
    .digest("hex");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

export function stripControlChars(input: string): string {
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

const SENSITIVE_PATTERNS = [
  /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/,
  /\b\(\d{3}\)\s*\d{3}[-.\s]?\d{4}\b/,
  /\b\+\d{1,3}[-.\s]?\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b\d{1,5}\s+\w+\s+(street|st|avenue|ave|road|rd|lane|ln|drive|dr|boulevard|blvd)\b/i,
  /\b(my school is|i live at|my address|phone number|call me at|whatsapp|telegram|discord|password is|my password)\b/i,
  /\bhttps?:\/\/\S+/i,
  /\bwww\.\S+/i,
  /\b(?:instagram|facebook|tiktok|snapchat|youtube)\.com\/\S+/i,
];

export function containsSensitiveInfo(text: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(text));
}

export function filterChildSafeText(text: string): {
  ok: boolean;
  cleaned: string;
  reason?: string;
} {
  const cleaned = stripControlChars(text);
  if (!cleaned) return { ok: false, cleaned, reason: "Please write a short message." };
  if (cleaned.length > 500) {
    return { ok: false, cleaned, reason: "Please keep your message under 500 characters." };
  }
  if (containsSensitiveInfo(cleaned)) {
    return {
      ok: false,
      cleaned,
      reason:
        "Please do not share phone numbers, emails, addresses, or school details. Ask a parent for help.",
    };
  }
  return { ok: true, cleaned };
}

export function filterVisitorChatMessage(text: string): {
  ok: boolean;
  cleaned: string;
  reason?: string;
} {
  // Strip tags / HTML-looking content and control characters.
  const cleaned = stripControlChars(text)
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;|&gt;|&quot;|&#39;/gi, "")
    .trim();

  if (!cleaned) return { ok: false, cleaned, reason: "Please write a short message." };
  if (cleaned.length > 1000) {
    return { ok: false, cleaned, reason: "Please keep your message under 1,000 characters." };
  }
  if (containsSensitiveInfo(cleaned)) {
    return {
      ok: false,
      cleaned,
      reason:
        "Please do not share your full name, email, phone number, school, address, passwords, photos, links, or location.",
    };
  }
  return { ok: true, cleaned };
}
