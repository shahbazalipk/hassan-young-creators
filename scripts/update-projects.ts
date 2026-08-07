import { PrismaClient, ProjectStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.project.deleteMany();

  await prisma.project.createMany({
    data: [
      {
        title: "KidMind AI",
        description:
          "An AI-powered learning website where kids take quizzes, track progress, and earn certificates.",
        technologies: JSON.stringify(["HTML", "CSS", "JavaScript"]),
        url: "/kidmind-ai",
        accent: "cyan",
        status: ProjectStatus.PUBLISHED,
        featured: true,
        sortOrder: 1,
      },
      {
        title: "Flash Cards",
        description:
          "A fun flash-card quiz game that helps kids practice questions and celebrate learning.",
        technologies: JSON.stringify(["HTML", "CSS", "JavaScript"]),
        url: "/flash-cards",
        accent: "amber",
        status: ProjectStatus.PUBLISHED,
        featured: true,
        sortOrder: 2,
      },
    ],
  });

  await prisma.achievement.updateMany({
    where: { label: "Websites Created" },
    data: { value: 2 },
  });

  await prisma.funFact.updateMany({
    where: { text: { contains: "four websites" } },
    data: { text: "I have already made two websites" },
  });

  await prisma.journeyStep.updateMany({
    where: { title: { contains: "four websites" } },
    data: {
      title: "Completed two websites",
      detail: "Practice turned into a growing portfolio.",
    },
  });

  await prisma.badge.updateMany({
    where: { name: { contains: "Four Projects" } },
    data: {
      name: "Two Projects Completed",
      description: "Celebrated steady progress across two projects.",
    },
  });

  const projects = await prisma.project.findMany({ orderBy: { sortOrder: "asc" } });
  console.log(
    "Updated projects:",
    projects.map((p) => ({ title: p.title, url: p.url }))
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
