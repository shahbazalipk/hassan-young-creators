import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk, requireAdminApi, requireCsrf } from "@/lib/api";
import { logActivity } from "@/lib/auth";
import { z } from "zod";

const profileSchema = z.object({
  displayName: z.string().min(2).max(40),
  age: z.number().int().min(5).max(17),
  classLevel: z.string().min(2).max(40),
  introHeadline: z.string().min(2).max(80),
  aboutText: z.string().min(20).max(4000),
  motivationalMessage: z.string().min(10).max(500),
  safetyReminder: z.string().min(10).max(300),
  skills: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(2).max(80),
        level: z.number().int().min(0).max(100),
        note: z.string().max(200),
      })
    )
    .max(20),
  achievements: z
    .array(
      z.object({
        id: z.string().optional(),
        label: z.string().min(2).max(80),
        value: z.number().int().nullable().optional(),
        icon: z.string().max(8),
        animated: z.boolean(),
      })
    )
    .max(20),
  funFacts: z.array(z.string().min(2).max(200)).max(20),
  goals: z.array(z.string().min(2).max(200)).max(20),
  journey: z
    .array(z.object({ title: z.string().min(2).max(120), detail: z.string().min(2).max(300) }))
    .max(20),
  csrfToken: z.string().min(10),
});

export async function GET() {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;

  const [profile, skills, achievements, funFacts, goals, journey] = await Promise.all([
    prisma.profile.findUnique({ where: { id: 1 } }),
    prisma.skill.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.achievement.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.funFact.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.goal.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.journeyStep.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return jsonOk({ profile, skills, achievements, funFacts, goals, journey });
}

export async function PUT(request: NextRequest) {
  const { auth, response } = await requireAdminApi();
  if (!auth) return response;
  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return jsonError("Please check the profile fields.");
  const csrfFail = requireCsrf(parsed.data.csrfToken);
  if (csrfFail) return csrfFail;

  await prisma.$transaction(async (tx) => {
    await tx.profile.update({
      where: { id: 1 },
      data: {
        displayName: parsed.data.displayName,
        age: parsed.data.age,
        classLevel: parsed.data.classLevel,
        introHeadline: parsed.data.introHeadline,
        aboutText: parsed.data.aboutText,
        motivationalMessage: parsed.data.motivationalMessage,
        safetyReminder: parsed.data.safetyReminder,
      },
    });

    await tx.skill.deleteMany();
    await tx.skill.createMany({
      data: parsed.data.skills.map((s, i) => ({
        name: s.name,
        level: s.level,
        note: s.note,
        sortOrder: i + 1,
      })),
    });

    await tx.achievement.deleteMany();
    await tx.achievement.createMany({
      data: parsed.data.achievements.map((a, i) => ({
        label: a.label,
        value: a.value ?? null,
        icon: a.icon,
        animated: a.animated,
        sortOrder: i + 1,
      })),
    });

    await tx.funFact.deleteMany();
    await tx.funFact.createMany({
      data: parsed.data.funFacts.map((text, i) => ({ text, sortOrder: i + 1 })),
    });

    await tx.goal.deleteMany();
    await tx.goal.createMany({
      data: parsed.data.goals.map((text, i) => ({ text, sortOrder: i + 1 })),
    });

    await tx.journeyStep.deleteMany();
    await tx.journeyStep.createMany({
      data: parsed.data.journey.map((step, i) => ({
        title: step.title,
        detail: step.detail,
        sortOrder: i + 1,
      })),
    });
  });

  await logActivity("PROFILE_UPDATE", "Updated Hassan’s public profile content", auth.user.id);
  return jsonOk({ message: "Profile published to the public website." });
}
