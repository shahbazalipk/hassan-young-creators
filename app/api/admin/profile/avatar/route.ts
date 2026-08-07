import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, requireAdminApi, requireCsrf } from "@/lib/api";
import { logActivity } from "@/lib/auth";
import { saveSafeImage } from "@/lib/uploads";

export async function POST(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;

  const form = await request.formData();
  const csrfToken = String(form.get("csrfToken") || "");
  const csrfFail = requireCsrf(csrfToken);
  if (csrfFail) return csrfFail;

  const file = form.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return jsonError("Please choose an image file.");
  }

  try {
    const avatarPath = await saveSafeImage(file, "avatars");
    const profile = await prisma.profile.update({
      where: { id: 1 },
      data: { avatarPath },
    });
    await logActivity("PROFILE_UPDATE", "Updated Hassan’s profile avatar", auth.user.id);
    return jsonOk({ profile, message: "Avatar updated on the public website." });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Avatar upload failed.");
  }
}
