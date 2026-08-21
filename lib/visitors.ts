import { createHash, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const VISITOR_COOKIE = "hassan_site_visitor";

export function hashVisitorToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function getOrCreateAnonymousVisitorKey(): Promise<{
  visitorKey: string;
  rawCookie: string;
  isNewCookie: boolean;
}> {
  const jar = await cookies();
  const existing = jar.get(VISITOR_COOKIE)?.value;
  if (existing && existing.length >= 16) {
    return { visitorKey: `anon:${hashVisitorToken(existing)}`, rawCookie: existing, isNewCookie: false };
  }
  const raw = randomUUID();
  return { visitorKey: `anon:${hashVisitorToken(raw)}`, rawCookie: raw, isNewCookie: true };
}

export function visitorCookieOptions(raw: string) {
  return {
    name: VISITOR_COOKIE,
    value: raw,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  };
}

type GoogleProfile = {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  email_verified?: boolean;
};

/** Verify Google ID token via tokeninfo (no private key in frontend). */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId || !idToken) return null;
  try {
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as GoogleProfile & { aud?: string; exp?: string };
    if (!data.sub || data.aud !== clientId) return null;
    if (data.exp && Number(data.exp) * 1000 < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Upsert a visitor on each "visit ping".
 * Debounce: same visitor within 30 minutes only updates lastVisitAt (no visitCount++).
 */
export async function pingVisitor(options: {
  anonymousKey: string;
  google?: GoogleProfile | null;
}) {
  const now = new Date();
  const debounceMs = 30 * 60 * 1000;

  if (options.google?.sub) {
    const visitorKey = `google:${options.google.sub}`;
    const existing = await prisma.siteVisitor.findUnique({ where: { visitorKey } });
    const shouldCount =
      !existing || now.getTime() - existing.lastVisitAt.getTime() > debounceMs;

    return prisma.siteVisitor.upsert({
      where: { visitorKey },
      create: {
        visitorKey,
        isAnonymous: false,
        googleSub: options.google.sub,
        displayName: options.google.name || "Google User",
        email: options.google.email_verified ? options.google.email || null : null,
        photoUrl: options.google.picture || null,
        firstVisitAt: now,
        lastVisitAt: now,
        visitCount: 1,
        authStatus: "signed_in",
      },
      update: {
        isAnonymous: false,
        googleSub: options.google.sub,
        displayName: options.google.name || existing?.displayName || "Google User",
        email: options.google.email_verified ? options.google.email || null : existing?.email || null,
        photoUrl: options.google.picture || existing?.photoUrl || null,
        lastVisitAt: now,
        visitCount: shouldCount ? { increment: 1 } : undefined,
        authStatus: "signed_in",
      },
    });
  }

  const existing = await prisma.siteVisitor.findUnique({ where: { visitorKey: options.anonymousKey } });
  const shouldCount = !existing || now.getTime() - existing.lastVisitAt.getTime() > debounceMs;

  return prisma.siteVisitor.upsert({
    where: { visitorKey: options.anonymousKey },
    create: {
      visitorKey: options.anonymousKey,
      isAnonymous: true,
      displayName: "Anonymous Visitor",
      firstVisitAt: now,
      lastVisitAt: now,
      visitCount: 1,
      authStatus: "anonymous",
    },
    update: {
      lastVisitAt: now,
      visitCount: shouldCount ? { increment: 1 } : undefined,
      authStatus: "anonymous",
      isAnonymous: true,
      displayName: "Anonymous Visitor",
    },
  });
}
