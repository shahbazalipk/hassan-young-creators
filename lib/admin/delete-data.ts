import { prisma } from "@/lib/db";
import { removeOwnedUpload, removeOwnedUploads } from "@/lib/admin/media";
import { deleteRemovableAdminData } from "@/lib/admin/default-content";
import type { DeleteScope } from "@/lib/admin/scopes";
import type { Prisma } from "@prisma/client";

export type DeleteCounts = Record<string, number>;

async function collectProjectImagePaths(tx: Prisma.TransactionClient) {
  const projects = await tx.project.findMany({ select: { imagePath: true } });
  return projects.map((p) => p.imagePath);
}

export async function deleteByScope(
  scope: DeleteScope,
  tx: Prisma.TransactionClient
): Promise<{ counts: DeleteCounts; mediaPaths: string[] }> {
  const counts: DeleteCounts = {};
  const mediaPaths: string[] = [];

  switch (scope) {
    case "messages": {
      const result = await tx.contactMessage.deleteMany();
      counts.contactMessages = result.count;
      break;
    }
    case "visitor-messages": {
      const messages = await tx.visitorChatMessage.deleteMany();
      const conversations = await tx.visitorConversation.deleteMany();
      counts.visitorChatMessages = messages.count;
      counts.visitorConversations = conversations.count;
      break;
    }
    case "projects": {
      mediaPaths.push(...((await collectProjectImagePaths(tx)).filter(Boolean) as string[]));
      const result = await tx.project.deleteMany();
      counts.projects = result.count;
      break;
    }
    case "challenges": {
      const submissions = await tx.challengeSubmission.deleteMany();
      const challenges = await tx.challenge.deleteMany();
      counts.challengeSubmissions = submissions.count;
      counts.challenges = challenges.count;
      break;
    }
    case "submissions": {
      const inspiration = await tx.inspirationMessage.deleteMany();
      const guestbook = await tx.guestbookEntry.deleteMany();
      const challengeSubs = await tx.challengeSubmission.deleteMany();
      counts.inspirationMessages = inspiration.count;
      counts.guestbookEntries = guestbook.count;
      counts.challengeSubmissions = challengeSubs.count;
      break;
    }
    case "badges": {
      const result = await tx.badge.deleteMany();
      counts.badges = result.count;
      break;
    }
    case "resources": {
      const result = await tx.learningResource.deleteMany();
      counts.learningResources = result.count;
      break;
    }
    case "inspiration": {
      const result = await tx.inspirationMessage.deleteMany();
      counts.inspirationMessages = result.count;
      break;
    }
    case "activity": {
      const result = await tx.activityLog.deleteMany();
      counts.activityLogs = result.count;
      break;
    }
    case "profile-lists": {
      const skills = await tx.skill.deleteMany();
      const achievements = await tx.achievement.deleteMany();
      const funFacts = await tx.funFact.deleteMany();
      const goals = await tx.goal.deleteMany();
      const journey = await tx.journeyStep.deleteMany();
      const capabilities = await tx.capability.deleteMany();
      counts.skills = skills.count;
      counts.achievements = achievements.count;
      counts.funFacts = funFacts.count;
      counts.goals = goals.count;
      counts.journeySteps = journey.count;
      counts.capabilities = capabilities.count;
      break;
    }
    case "content-cards": {
      const ideas = await tx.projectIdea.deleteMany();
      const roadmap = await tx.roadmapStep.deleteMany();
      const cards = await tx.parentCornerCard.deleteMany();
      counts.projectIdeas = ideas.count;
      counts.roadmapSteps = roadmap.count;
      counts.parentCornerCards = cards.count;
      break;
    }
    default: {
      const _exhaustive: never = scope;
      throw new Error(`Unsupported delete scope: ${_exhaustive}`);
    }
  }

  return { counts, mediaPaths };
}

/** Wipe removable admin/visitor data only. Essential public content is preserved. */
export async function deleteAllAdminManagedData(tx: Prisma.TransactionClient): Promise<{
  counts: DeleteCounts;
  mediaPaths: string[];
}> {
  const counts = await deleteRemovableAdminData(tx);
  return { counts, mediaPaths: [] };
}

export async function runScopedDelete(scope: DeleteScope): Promise<DeleteCounts> {
  const { counts, mediaPaths } = await prisma.$transaction(async (tx) => deleteByScope(scope, tx));
  await removeOwnedUploads(mediaPaths);
  return counts;
}

export async function runGlobalDelete(): Promise<DeleteCounts> {
  const { counts, mediaPaths } = await prisma.$transaction(async (tx) =>
    deleteAllAdminManagedData(tx)
  );
  await removeOwnedUploads(mediaPaths);
  return counts;
}

export async function deleteProjectWithMedia(id: string) {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return null;
  await prisma.project.delete({ where: { id } });
  await removeOwnedUpload(project.imagePath);
  return project;
}
