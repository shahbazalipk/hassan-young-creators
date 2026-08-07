import { prisma } from "@/lib/db";

/** Safe structured backup of admin-managed content. Never includes secrets or auth material. */
export async function buildAdminBackup() {
  const createdAt = new Date().toISOString();

  const [
    projects,
    contactMessages,
    visitorConversations,
    visitorMessages,
    challenges,
    challengeSubmissions,
    badges,
    resources,
    inspiration,
    guestbook,
    profile,
    skills,
    achievements,
    funFacts,
    goals,
    journey,
    capabilities,
    ideas,
    roadmap,
    parentCards,
    activity,
    siteSettingsPublic,
  ] = await Promise.all([
    prisma.project.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.visitorConversation.findMany({
      select: {
        id: true,
        publicId: true,
        status: true,
        archived: true,
        blocked: true,
        flagged: true,
        lastMessageAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.visitorChatMessage.findMany({
      select: {
        id: true,
        publicId: true,
        conversationId: true,
        senderRole: true,
        body: true,
        status: true,
        deliveredAt: true,
        readAt: true,
        visitorReadAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.challenge.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.challengeSubmission.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.badge.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.learningResource.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.inspirationMessage.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.guestbookEntry.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.profile.findUnique({ where: { id: 1 } }),
    prisma.skill.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.achievement.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.funFact.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.goal.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.journeyStep.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.capability.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.projectIdea.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.roadmapStep.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.parentCornerCard.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.activityLog.findMany({
      select: {
        id: true,
        type: true,
        summary: true,
        createdAt: true,
        userId: true,
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.siteSettings.findUnique({
      where: { id: 1 },
      select: {
        showParentEmailPublicly: true,
        contactFormEnabled: true,
        guestbookEnabled: true,
        challengeSubmissionsOn: true,
        maintenanceMode: true,
        themeDefault: true,
        accentCyan: true,
        accentViolet: true,
        accentAmber: true,
        accentCoral: true,
        socialLinksJson: true,
        privacyNotice: true,
        homepageAnnouncement: true,
        footerText: true,
        publicSubmissionsEnabled: true,
        visitorMessagingEnabled: true,
        updatedAt: true,
      },
    }),
  ]);

  return {
    format: "hassan-admin-backup-v1",
    createdAt,
    note: "This backup excludes password hashes, session tokens, API keys, TOTP secrets, CSRF tokens, visitor auth cookies, and environment variables.",
    data: {
      projects,
      contactMessages: contactMessages.map((m) => ({
        ...m,
        ipHash: m.ipHash ? "[redacted]" : null,
      })),
      visitorConversations,
      visitorMessages,
      challenges,
      challengeSubmissions: challengeSubmissions.map((s) => ({
        ...s,
        ipHash: s.ipHash ? "[redacted]" : null,
      })),
      badges,
      learningResources: resources,
      inspirationMessages: inspiration.map((m) => ({
        ...m,
        ipHash: m.ipHash ? "[redacted]" : null,
      })),
      guestbookEntries: guestbook.map((m) => ({
        ...m,
        ipHash: m.ipHash ? "[redacted]" : null,
      })),
      profile: profile
        ? {
            displayName: profile.displayName,
            age: profile.age,
            classLevel: profile.classLevel,
            introHeadline: profile.introHeadline,
            aboutText: profile.aboutText,
            motivationalMessage: profile.motivationalMessage,
            safetyReminder: profile.safetyReminder,
            avatarPath: profile.avatarPath,
            updatedAt: profile.updatedAt,
          }
        : null,
      skills,
      achievements,
      funFacts,
      goals,
      journeySteps: journey,
      capabilities,
      projectIdeas: ideas,
      roadmapSteps: roadmap,
      parentCornerCards: parentCards,
      activityHistory: activity,
      siteSettingsPublic,
    },
  };
}

export function validateBackupPayload(payload: unknown): { ok: true } | { ok: false; error: string } {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "Backup must be a JSON object." };
  }
  const data = payload as Record<string, unknown>;
  if (data.format !== "hassan-admin-backup-v1") {
    return { ok: false, error: "Unsupported or missing backup format." };
  }
  if (typeof data.createdAt !== "string" || !data.createdAt) {
    return { ok: false, error: "Backup is missing a creation date." };
  }
  if (!data.data || typeof data.data !== "object") {
    return { ok: false, error: "Backup is missing a data section." };
  }
  const forbidden = JSON.stringify(payload);
  if (
    /passwordHash|totpSecret|resetTokenHash|SESSION_SECRET|CSRF_SECRET|visitorTokenHash|tokenHash/.test(
      forbidden
    )
  ) {
    return { ok: false, error: "Backup appears to contain secrets and was rejected." };
  }
  return { ok: true };
}
