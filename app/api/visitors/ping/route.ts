import { NextRequest, NextResponse } from "next/server";
import {
  getOrCreateAnonymousVisitorKey,
  pingVisitor,
  verifyGoogleIdToken,
  visitorCookieOptions,
} from "@/lib/visitors";
import { jsonError, jsonOk } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, hashIp } from "@/lib/security";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = await rateLimit(`visitor-ping:${hashIp(ip)}`, 60, 15 * 60 * 1000);
  if (!limit.ok) return jsonError("Too many requests.", 429);

  const body = await request.json().catch(() => ({}));
  const idToken = typeof body?.googleIdToken === "string" ? body.googleIdToken : "";
  const google = idToken ? await verifyGoogleIdToken(idToken) : null;

  const { visitorKey, rawCookie, isNewCookie } = await getOrCreateAnonymousVisitorKey();
  const visitor = await pingVisitor({
    anonymousKey: visitorKey,
    google,
  });

  const response = jsonOk({
    visitor: {
      id: visitor.id,
      displayName: visitor.displayName,
      isAnonymous: visitor.isAnonymous,
      authStatus: visitor.authStatus,
      photoUrl: visitor.photoUrl,
      visitCount: visitor.visitCount,
      playerKey: visitor.visitorKey,
    },
    privacyNote:
      "We store a privacy-safe visitor ID and visit counts for site analytics. Google name/email/photo are stored only if you choose Sign in with Google.",
  });

  if (isNewCookie) {
    response.cookies.set(visitorCookieOptions(rawCookie));
  }
  return response;
}

export async function GET() {
  // Lightweight status for clients (does not create a visit count bump by itself).
  const { visitorKey } = await getOrCreateAnonymousVisitorKey();
  return jsonOk({ playerKey: visitorKey });
}
