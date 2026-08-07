import { prisma } from "@/lib/db";
import { parentEmailFromEnv } from "@/lib/auth";

export async function getPublicSiteData() {
  const [
    profile,
    settings,
    projects,
    skills,
    achievements,
    funFacts,
    goals,
    journey,
    capabilities,
    challenges,
    badges,
    inspiration,
    resources,
    ideas,
    roadmap,
    parentCards,
  ] = await Promise.all([
    prisma.profile.findUnique({ where: { id: 1 } }),
    prisma.siteSettings.findUnique({ where: { id: 1 } }),
    prisma.project.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.skill.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.achievement.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.funFact.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.goal.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.journeyStep.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.capability.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.challenge.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.badge.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.inspirationMessage.findMany({
      where: { status: "APPROVED" },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 24,
    }),
    prisma.learningResource.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.projectIdea.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.roadmapStep.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.parentCornerCard.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const parentEmail = parentEmailFromEnv();
  const showEmail = Boolean(settings?.showParentEmailPublicly && parentEmail);

  return {
    profile,
    settings: settings
      ? {
          ...settings,
          parentContactEmail: showEmail ? parentEmail : "",
          // Never send server secrets to the client beyond intentional public flags.
        }
      : null,
    projects: projects.map((p) => ({
      ...p,
      technologies: safeJsonArray(p.technologies),
    })),
    skills,
    achievements,
    funFacts,
    goals,
    journey,
    capabilities,
    challenges,
    badges,
    inspiration,
    resources,
    ideas,
    roadmap,
    parentCards,
  };
}

export async function getAdminDashboardStats() {
  const [
    totalProjects,
    publishedProjects,
    draftProjects,
    skills,
    achievements,
    messages,
    pendingGuestbook,
    pendingInspiration,
    pendingChallenges,
    approvedGuestbook,
    recentActivity,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: "PUBLISHED" } }),
    prisma.project.count({ where: { status: "DRAFT" } }),
    prisma.skill.count(),
    prisma.achievement.count(),
    prisma.contactMessage.count({ where: { status: { not: "ARCHIVED" } } }),
    prisma.guestbookEntry.count({ where: { status: "PENDING" } }),
    prisma.inspirationMessage.count({ where: { status: "PENDING" } }),
    prisma.challengeSubmission.count({ where: { status: "PENDING" } }),
    prisma.guestbookEntry.count({ where: { status: "APPROVED" } }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  return {
    totalProjects,
    publishedProjects,
    draftProjects,
    skills,
    achievements,
    messages,
    pendingChildSubmissions: pendingGuestbook + pendingInspiration + pendingChallenges,
    approvedGuestbook,
    recentActivity,
  };
}

function safeJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
