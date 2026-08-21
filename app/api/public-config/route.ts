import { jsonOk } from "@/lib/api";

/** Public, non-secret client config for static apps. */
export async function GET() {
  return jsonOk({
    googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || null,
    privacyNote:
      "Anonymous visits use a privacy-safe ID. Google name/email/photo are stored only if you choose Sign in with Google.",
  });
}
