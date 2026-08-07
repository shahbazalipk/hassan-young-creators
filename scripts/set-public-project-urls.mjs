import { PrismaClient, ProjectStatus } from "@prisma/client";

const prisma = new PrismaClient();

const projects = [
  {
    title: "KidMind AI",
    description:
      "A child-friendly learning platform where students can explore ideas and enjoy an engaging learning experience.",
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
      "An interactive flash-card website that helps students practise topics and remember what they learn.",
    technologies: JSON.stringify(["HTML", "CSS", "JavaScript"]),
    url: "/flash-cards",
    accent: "amber",
    status: ProjectStatus.PUBLISHED,
    featured: true,
    sortOrder: 2,
  },
];

try {
  await prisma.project.deleteMany();
  await prisma.project.createMany({ data: projects });
  const saved = await prisma.project.findMany({ orderBy: { sortOrder: "asc" } });
  console.log(
    "Updated projects:",
    saved.map((p) => ({ title: p.title, url: p.url }))
  );
} finally {
  await prisma.$disconnect();
}
