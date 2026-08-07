import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { restoreDefaultWebsiteContent } from "../lib/admin/default-content";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || "parent@example.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe-StrongPassword-123!";
  const adminName = process.env.ADMIN_NAME || "Hassan's Parent";
  const parentEmail = (process.env.PARENT_CONTACT_EMAIL || adminEmail).toLowerCase();

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash, name: adminName },
    create: {
      email: adminEmail,
      passwordHash,
      name: adminName,
      role: "PARENT_ADMIN",
    },
  });

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {
      parentContactEmail: "",
    },
    create: {
      id: 1,
      parentContactEmail: "",
      privacyNotice:
        "This website belongs to a child. Contact is managed by a parent or guardian. We never ask children for home addresses, phone numbers, school names, or personal email addresses. Contact managed by Hassan’s parent/guardian.",
      homepageAnnouncement:
        "Welcome to Hassan’s Young Creators Club — learn, build, and believe in yourself.",
      footerText: "Designed with curiosity and built with confidence by Hassan.",
    },
  });

  // Keep parent email only in env; DB field stays empty unless parent opts into public display later.
  void parentEmail;

  const created = await restoreDefaultWebsiteContent(prisma);

  console.log("Seed complete.");
  console.log(`Admin login email: ${adminEmail}`);
  console.log("Use ADMIN_PASSWORD from your .env file. Change it after first login.");
  console.log("Restored/verified default content groups:", created);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
