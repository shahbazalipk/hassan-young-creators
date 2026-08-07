import { ChallengeStatus, ProjectStatus, PrismaClient, type Prisma } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/db";

type DbClient = PrismaClient | Prisma.TransactionClient;

export const ESSENTIAL_ABOUT_TEXT =
  "Hi! I’m Hassan, a 10-year-old student studying in Class 5. I am curious, creative, and always excited to learn something new. I enjoy exploring technology, solving interesting problems, and creating websites. I believe that age should never stop anyone from learning, building, and achieving great things.";

export const ESSENTIAL_MOTIVATIONAL_MESSAGE =
  "If I can start creating at 10, you can start too. Begin with one small idea, keep learning, and never be afraid of mistakes.";

const DEFAULT_SKILLS = [
  { name: "Website Design", level: 78, note: "Learning and improving with every project", sortOrder: 1 },
  { name: "HTML and CSS", level: 82, note: "Practising clean page layouts", sortOrder: 2 },
  { name: "Basic JavaScript", level: 55, note: "Learning step by step", sortOrder: 3 },
  { name: "Creative Thinking", level: 90, note: "Turning ideas into designs", sortOrder: 4 },
  { name: "Problem Solving", level: 75, note: "Figuring things out patiently", sortOrder: 5 },
  { name: "Fast Learning", level: 88, note: "Curious and quick to try", sortOrder: 6 },
  { name: "Communication", level: 70, note: "Explaining ideas clearly", sortOrder: 7 },
  { name: "Exploring New Technology", level: 80, note: "Always discovering tools", sortOrder: 8 },
] as const;

const DEFAULT_ACHIEVEMENTS = [
  { label: "10 years old", value: 10, icon: "🎂", animated: true, sortOrder: 1 },
  { label: "Class 5 student", value: null, icon: "📚", animated: false, sortOrder: 2 },
  { label: "Created two websites", value: 2, icon: "🌐", animated: true, sortOrder: 3 },
  { label: "Creative thinker", value: null, icon: "💡", animated: false, sortOrder: 4 },
  { label: "Fast learner", value: null, icon: "⚡", animated: false, sortOrder: 5 },
  { label: "Young web creator", value: null, icon: "🚀", animated: false, sortOrder: 6 },
] as const;

const DEFAULT_PROJECTS = [
  {
    title: "KidMind AI",
    description:
      "A child-friendly learning platform where students can explore ideas and enjoy an engaging learning experience.",
    technologies: JSON.stringify(["HTML", "CSS", "JavaScript"]),
    url: "http://localhost:5173/",
    accent: "cyan",
    status: ProjectStatus.PUBLISHED,
    featured: true,
    sortOrder: 1,
  },
  {
    title: "Flash Cards",
    description:
      "An interactive flash-card website that helps students practise topics and remember what they learn.",
    technologies: JSON.stringify(["HTML", "CSS", "JavaScript"]),
    url: "http://127.0.0.1:8765/index.html",
    accent: "amber",
    status: ProjectStatus.PUBLISHED,
    featured: true,
    sortOrder: 2,
  },
] as const;

const DEFAULT_CAPABILITIES = [
  { title: "Build simple and attractive websites", icon: "🖥️", sortOrder: 1 },
  { title: "Learn new digital tools", icon: "🧰", sortOrder: 2 },
  { title: "Think of creative ideas", icon: "✨", sortOrder: 3 },
  { title: "Solve problems", icon: "🧩", sortOrder: 4 },
  { title: "Work hard on projects", icon: "💪", sortOrder: 5 },
  { title: "Improve through practice", icon: "📈", sortOrder: 6 },
  { title: "Help others understand things", icon: "🤝", sortOrder: 7 },
  { title: "Turn imagination into digital creations", icon: "🎨", sortOrder: 8 },
] as const;

const DEFAULT_JOURNEY = [
  {
    title: "Became interested in technology",
    detail: "Curiosity sparked everything.",
    sortOrder: 1,
  },
  {
    title: "Started learning how websites work",
    detail: "HTML, CSS, and first experiments.",
    sortOrder: 2,
  },
  {
    title: "Created the first website",
    detail: "Ideas became something real on screen.",
    sortOrder: 3,
  },
  {
    title: "Continued learning and experimenting",
    detail: "Tried new layouts, colors, and effects.",
    sortOrder: 4,
  },
  {
    title: "Created KidMind AI and Flash Cards",
    detail: "Two real projects built with practice and care.",
    sortOrder: 5,
  },
  {
    title: "Currently building even better projects",
    detail: "Learning more every day.",
    sortOrder: 6,
  },
] as const;

const DEFAULT_GOALS = [
  { text: "Improving programming skills", sortOrder: 1 },
  { text: "Building useful websites", sortOrder: 2 },
  { text: "Learning advanced technology", sortOrder: 3 },
  { text: "Creating fun applications", sortOrder: 4 },
  { text: "Helping people through technology", sortOrder: 5 },
  { text: "Encouraging other young creators", sortOrder: 6 },
] as const;

const DEFAULT_FUN_FACTS = [
  { text: "I ask lots of questions", sortOrder: 1 },
  { text: "I enjoy learning by creating", sortOrder: 2 },
  { text: "I have created two websites", sortOrder: 3 },
  { text: "I believe every mistake teaches something", sortOrder: 4 },
  { text: "I am always ready for a new challenge", sortOrder: 5 },
] as const;

const DEFAULT_ROADMAP = [
  {
    title: "Choose something you are curious about",
    detail: "Pick one idea that makes you smile.",
    sortOrder: 1,
  },
  {
    title: "Learn one small skill",
    detail: "A tiny lesson is enough to begin.",
    sortOrder: 2,
  },
  {
    title: "Build a simple first project",
    detail: "Keep it small and finish it.",
    sortOrder: 3,
  },
  {
    title: "Ask a parent or teacher for help",
    detail: "Grown-ups can keep you safe and supported.",
    sortOrder: 4,
  },
  {
    title: "Improve the project",
    detail: "Change colors, words, or ideas little by little.",
    sortOrder: 5,
  },
  {
    title: "Share it safely",
    detail: "Only share with permission from a trusted adult.",
    sortOrder: 6,
  },
  {
    title: "Celebrate your progress",
    detail: "Be proud of effort, not only perfection.",
    sortOrder: 7,
  },
  {
    title: "Start the next challenge",
    detail: "Curiosity never runs out of adventures.",
    sortOrder: 8,
  },
] as const;

const DEFAULT_CHALLENGES = [
  {
    title: "Design a homepage on paper",
    description: "Sketch a homepage with a title, colors, and one big button.",
    status: ChallengeStatus.PUBLISHED,
    sortOrder: 1,
  },
  {
    title: "Create a colorful digital poster",
    description: "Make a poster that teaches one helpful idea.",
    status: ChallengeStatus.PUBLISHED,
    sortOrder: 2,
  },
  {
    title: "Write three ideas for a useful website",
    description: "Write three website ideas that could help someone.",
    status: ChallengeStatus.PUBLISHED,
    sortOrder: 3,
  },
  {
    title: "Build a simple button using HTML and CSS",
    description: "Create one button and change its color on hover.",
    status: ChallengeStatus.PUBLISHED,
    sortOrder: 4,
  },
  {
    title: "Make a mini quiz",
    description: "Invent three quiz questions about something you love.",
    status: ChallengeStatus.PUBLISHED,
    sortOrder: 5,
  },
  {
    title: "Improve an old project",
    description: "Pick something you made before and make one part better.",
    status: ChallengeStatus.PUBLISHED,
    sortOrder: 6,
  },
  {
    title: "Teach a new skill to a friend or sibling",
    description: "Share one small thing you learned with someone else.",
    status: ChallengeStatus.PUBLISHED,
    sortOrder: 7,
  },
] as const;

const DEFAULT_BADGES = [
  {
    name: "Curious Explorer",
    description: "Asked questions and explored new ideas.",
    icon: "🔍",
    color: "#3de7ff",
    sortOrder: 1,
  },
  {
    name: "First Idea",
    description: "Wrote down a creative project idea.",
    icon: "💡",
    color: "#ffd166",
    sortOrder: 2,
  },
  {
    name: "First Webpage",
    description: "Finished a first simple webpage.",
    icon: "🌐",
    color: "#4f7cff",
    sortOrder: 3,
  },
  {
    name: "Creative Thinker",
    description: "Tried imaginative colors, words, or designs.",
    icon: "🎨",
    color: "#9b6bff",
    sortOrder: 4,
  },
  {
    name: "Problem Solver",
    description: "Kept trying until a tricky problem made sense.",
    icon: "🧩",
    color: "#5dffb0",
    sortOrder: 5,
  },
  {
    name: "Helpful Creator",
    description: "Shared kindness while learning or teaching.",
    icon: "🤝",
    color: "#ff7a6e",
    sortOrder: 6,
  },
  {
    name: "Two Projects Completed",
    description: "Celebrated steady progress across two projects.",
    icon: "🏆",
    color: "#ffd166",
    sortOrder: 7,
  },
  {
    name: "Never Gave Up",
    description: "Returned after mistakes and kept going.",
    icon: "💪",
    color: "#3de7ff",
    sortOrder: 8,
  },
] as const;

const DEFAULT_INSPIRATION = [
  {
    nickname: "Hassan",
    message: "Every expert was once a beginner.",
    status: "APPROVED" as const,
    featured: true,
  },
  {
    nickname: "Young Creator",
    message: "Your first project does not have to be perfect.",
    status: "APPROVED" as const,
    featured: false,
  },
  {
    nickname: "Anonymous Creator",
    message: "Small steps can create big results.",
    status: "APPROVED" as const,
    featured: false,
  },
  {
    nickname: "Curious Kid",
    message: "Mistakes help your brain grow.",
    status: "APPROVED" as const,
    featured: false,
  },
  {
    nickname: "Builder",
    message: "Create something today that did not exist yesterday.",
    status: "APPROVED" as const,
    featured: true,
  },
] as const;

const DEFAULT_IDEAS = [
  {
    title: "Animal facts website",
    prompt: "Share fun facts about your favorite animals with bright pictures and colors.",
    sortOrder: 1,
  },
  {
    title: "Space quiz",
    prompt: "Make a short quiz about planets, stars, and astronauts.",
    sortOrder: 2,
  },
  {
    title: "Healthy habits tracker",
    prompt: "Create a simple page that reminds kids to drink water and stretch.",
    sortOrder: 3,
  },
  {
    title: "Book review page",
    prompt: "Review a book you loved and tell others why it was exciting.",
    sortOrder: 4,
  },
  {
    title: "Kindness challenge",
    prompt: "List kind actions kids can try this week.",
    sortOrder: 5,
  },
  {
    title: "Math practice game",
    prompt: "Build a friendly page with easy math questions and cheers for trying.",
    sortOrder: 6,
  },
  {
    title: "Recycling awareness website",
    prompt: "Teach friends how to recycle paper, plastic, and cans.",
    sortOrder: 7,
  },
  {
    title: "Personal art gallery",
    prompt: "Show drawings or crafts (with parent permission) in a colorful gallery.",
    sortOrder: 8,
  },
] as const;

const DEFAULT_RESOURCES = [
  {
    title: "HTML Basics",
    description: "Learn how web pages are structured with headings, paragraphs, and links.",
    category: "HTML Basics",
    url: "https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML",
    isExternal: true,
    sortOrder: 1,
  },
  {
    title: "CSS Basics",
    description: "Discover colors, fonts, spacing, and layouts that make pages beautiful.",
    category: "CSS Basics",
    url: "https://developer.mozilla.org/en-US/docs/Learn/CSS/First_steps",
    isExternal: true,
    sortOrder: 2,
  },
  {
    title: "JavaScript Basics",
    description: "Start with tiny interactions like buttons and simple messages.",
    category: "JavaScript Basics",
    url: "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps",
    isExternal: true,
    sortOrder: 3,
  },
  {
    title: "Internet Safety",
    description: "Remember: ask a trusted adult before sharing anything online.",
    category: "Internet Safety",
    url: "https://www.commonsensemedia.org/articles/internet-safety",
    isExternal: true,
    sortOrder: 4,
  },
  {
    title: "Creative Thinking",
    description: "Practice turning everyday ideas into fun digital projects.",
    category: "Creative Thinking",
    url: null as string | null,
    isExternal: false,
    sortOrder: 5,
  },
  {
    title: "Problem Solving",
    description: "Break big problems into small steps and celebrate each win.",
    category: "Problem Solving",
    url: null as string | null,
    isExternal: false,
    sortOrder: 6,
  },
  {
    title: "Responsible Use of Technology",
    description: "Use screens with balance, kindness, and parent guidance.",
    category: "Responsible Use of Technology",
    url: null as string | null,
    isExternal: false,
    sortOrder: 7,
  },
] as const;

const DEFAULT_PARENT_CARDS = [
  {
    title: "Supporting young creators",
    body: "Sit nearby, celebrate effort, and help children finish small projects from start to end.",
    sortOrder: 1,
  },
  {
    title: "Online safety",
    body: "Never post a child’s address, school name, phone number, or personal email on a public site.",
    sortOrder: 2,
  },
  {
    title: "Healthy screen-time habits",
    body: "Balance creating time with rest, outdoor play, reading, and family moments.",
    sortOrder: 3,
  },
  {
    title: "Project-based learning",
    body: "Choose one tiny goal each week: a poster, a quiz page, or a simple homepage.",
    sortOrder: 4,
  },
  {
    title: "Encouraging effort without pressure",
    body: "Praise curiosity and persistence. Mistakes are part of learning, not a reason to stop.",
    sortOrder: 5,
  },
  {
    title: "Helping children share projects safely",
    body: "Only share with parent or teacher permission, and never include private personal details.",
    sortOrder: 6,
  },
] as const;

export type RestoreSummary = Record<string, number>;

/** Idempotent restore of essential public website defaults. Never duplicates existing records. */
export async function restoreDefaultWebsiteContent(
  db: DbClient = defaultPrisma
): Promise<RestoreSummary> {
  const created: RestoreSummary = {};

  const existingProfile = await db.profile.findUnique({ where: { id: 1 } });
  await db.profile.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      displayName: "Hassan",
      age: 10,
      classLevel: "Class 5",
      introHeadline: "Young Web Creator",
      aboutText: ESSENTIAL_ABOUT_TEXT,
      motivationalMessage: ESSENTIAL_MOTIVATIONAL_MESSAGE,
      safetyReminder: "Always ask a parent, guardian, or teacher before sharing anything online.",
    },
    update: {
      displayName: "Hassan",
      age: 10,
      classLevel: "Class 5",
      introHeadline: "Young Web Creator",
      aboutText: ESSENTIAL_ABOUT_TEXT,
      motivationalMessage: ESSENTIAL_MOTIVATIONAL_MESSAGE,
      safetyReminder: "Always ask a parent, guardian, or teacher before sharing anything online.",
    },
  });
  if (!existingProfile) created.profile = 1;

  for (const skill of DEFAULT_SKILLS) {
    const existing = await db.skill.findFirst({ where: { name: skill.name } });
    if (!existing) {
      await db.skill.create({ data: { ...skill } });
      created.skills = (created.skills || 0) + 1;
    }
  }

  for (const achievement of DEFAULT_ACHIEVEMENTS) {
    const existing = await db.achievement.findFirst({ where: { label: achievement.label } });
    if (!existing) {
      await db.achievement.create({ data: { ...achievement } });
      created.achievements = (created.achievements || 0) + 1;
    }
  }

  for (const project of DEFAULT_PROJECTS) {
    const existing = await db.project.findFirst({ where: { title: project.title } });
    if (!existing) {
      await db.project.create({ data: { ...project } });
      created.projects = (created.projects || 0) + 1;
    } else {
      await db.project.update({
        where: { id: existing.id },
        data: {
          description: project.description,
          technologies: project.technologies,
          url: project.url,
          accent: project.accent,
          status: project.status,
          featured: project.featured,
          sortOrder: project.sortOrder,
        },
      });
    }
  }

  for (const item of DEFAULT_CAPABILITIES) {
    const existing = await db.capability.findFirst({ where: { title: item.title } });
    if (!existing) {
      await db.capability.create({ data: { ...item } });
      created.capabilities = (created.capabilities || 0) + 1;
    }
  }

  for (const step of DEFAULT_JOURNEY) {
    const existing = await db.journeyStep.findFirst({ where: { title: step.title } });
    if (!existing) {
      await db.journeyStep.create({ data: { ...step } });
      created.journeySteps = (created.journeySteps || 0) + 1;
    }
  }

  for (const goal of DEFAULT_GOALS) {
    const existing = await db.goal.findFirst({ where: { text: goal.text } });
    if (!existing) {
      await db.goal.create({ data: { ...goal } });
      created.goals = (created.goals || 0) + 1;
    }
  }

  for (const fact of DEFAULT_FUN_FACTS) {
    const existing = await db.funFact.findFirst({ where: { text: fact.text } });
    if (!existing) {
      await db.funFact.create({ data: { ...fact } });
      created.funFacts = (created.funFacts || 0) + 1;
    }
  }

  for (const step of DEFAULT_ROADMAP) {
    const existing = await db.roadmapStep.findFirst({ where: { title: step.title } });
    if (!existing) {
      await db.roadmapStep.create({ data: { ...step } });
      created.roadmapSteps = (created.roadmapSteps || 0) + 1;
    }
  }

  for (const challenge of DEFAULT_CHALLENGES) {
    const existing = await db.challenge.findFirst({ where: { title: challenge.title } });
    if (!existing) {
      await db.challenge.create({ data: { ...challenge } });
      created.challenges = (created.challenges || 0) + 1;
    }
  }

  for (const badge of DEFAULT_BADGES) {
    const existing = await db.badge.findFirst({ where: { name: badge.name } });
    if (!existing) {
      await db.badge.create({ data: { ...badge, isActive: true } });
      created.badges = (created.badges || 0) + 1;
    }
  }

  for (const message of DEFAULT_INSPIRATION) {
    const existing = await db.inspirationMessage.findFirst({ where: { message: message.message } });
    if (!existing) {
      await db.inspirationMessage.create({ data: { ...message } });
      created.inspirationMessages = (created.inspirationMessages || 0) + 1;
    }
  }

  for (const idea of DEFAULT_IDEAS) {
    const existing = await db.projectIdea.findFirst({ where: { title: idea.title } });
    if (!existing) {
      await db.projectIdea.create({ data: { ...idea, isActive: true } });
      created.projectIdeas = (created.projectIdeas || 0) + 1;
    }
  }

  for (const resource of DEFAULT_RESOURCES) {
    const existing = await db.learningResource.findFirst({ where: { title: resource.title } });
    if (!existing) {
      await db.learningResource.create({
        data: {
          ...resource,
          isPublished: true,
        },
      });
      created.learningResources = (created.learningResources || 0) + 1;
    }
  }

  for (const card of DEFAULT_PARENT_CARDS) {
    const existing = await db.parentCornerCard.findFirst({ where: { title: card.title } });
    if (!existing) {
      await db.parentCornerCard.create({ data: { ...card } });
      created.parentCornerCards = (created.parentCornerCards || 0) + 1;
    }
  }

  return created;
}

/**
 * Delete only removable admin/visitor-generated records.
 * Essential public website content is preserved and re-seeded if missing.
 */
export async function deleteRemovableAdminData(tx: Prisma.TransactionClient): Promise<DeleteCounts> {
  const counts: Record<string, number> = {};

  const visitorMessages = await tx.visitorChatMessage.deleteMany();
  const visitorConversations = await tx.visitorConversation.deleteMany();
  const contactMessages = await tx.contactMessage.deleteMany();
  const challengeSubs = await tx.challengeSubmission.deleteMany();
  const guestbook = await tx.guestbookEntry.deleteMany();
  // Only remove non-default inspiration (visitor/pending/rejected). Keep approved defaults by message text.
  const defaultMessages = DEFAULT_INSPIRATION.map((m) => m.message);
  const customInspiration = await tx.inspirationMessage.deleteMany({
    where: { message: { notIn: [...defaultMessages] } },
  });
  const blocked = await tx.blockedIp.deleteMany();
  const activity = await tx.activityLog.deleteMany();

  counts.visitorChatMessages = visitorMessages.count;
  counts.visitorConversations = visitorConversations.count;
  counts.contactMessages = contactMessages.count;
  counts.challengeSubmissions = challengeSubs.count;
  counts.guestbookEntries = guestbook.count;
  counts.customInspirationMessages = customInspiration.count;
  counts.blockedIps = blocked.count;
  counts.activityLogs = activity.count;

  // Ensure essential public content still exists after cleanup.
  await restoreDefaultWebsiteContent(tx);

  return counts;
}

type DeleteCounts = Record<string, number>;
