/**
 * Safe pre-migration cleanup for unique email constraints.
 *
 * Runs BEFORE `prisma db push` so SQLite can create:
 *   - AppUser_email_key
 *   - AppUser_googleSub_key
 *   - AdminUser_email_key (already existed)
 *   - AdminUser_appUserId_key
 *
 * Strategy:
 * 1. If tables do not exist yet, exit successfully (fresh DB).
 * 2. Normalize emails to lowercase/trimmed.
 * 3. Merge duplicate emails, keeping the best row.
 * 4. Re-point AdminUser.appUserId to the surviving AppUser.
 * 5. Clear duplicate / blank googleSub values that would break uniqueness.
 *
 * Never deletes the sole ADMIN account. Never drops unrelated tables.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type TableRow = { name: string };

async function tableExists(name: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<TableRow[]>(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
    name
  );
  return rows.length > 0;
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const cols = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
    `PRAGMA table_info(${table})`
  );
  return cols.some((c) => c.name === column);
}

function scoreAppUser(row: {
  id: string;
  role: string;
  emailVerified: number | boolean;
  passwordHash: string | null;
  createdAt: string;
}): number {
  let score = 0;
  if (row.role === "ADMIN") score += 1000;
  if (row.emailVerified) score += 100;
  if (row.passwordHash) score += 10;
  // Prefer older accounts (stable identity).
  const t = Date.parse(row.createdAt) || 0;
  score += Math.max(0, 1_000_000_000_000 - t) / 1e12;
  return score;
}

async function normalizeAppUserEmails() {
  if (!(await tableExists("AppUser"))) {
    console.log("AppUser table not present yet — skip email cleanup.");
    return { merged: 0, normalized: 0 };
  }

  // Normalize casing / whitespace first so case-variants become true duplicates.
  const all = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      email: string;
      role: string;
      emailVerified: number | boolean;
      passwordHash: string | null;
      googleSub: string | null;
      createdAt: string;
    }>
  >(
    `SELECT id, email, role, emailVerified, passwordHash, googleSub, createdAt FROM AppUser`
  );

  let normalized = 0;
  for (const row of all) {
    const cleaned = String(row.email || "")
      .trim()
      .toLowerCase();
    if (!cleaned) {
      // Invalid blank email — assign a unique placeholder so unique index can apply.
      const placeholder = `invalid+${row.id}@users.local`;
      await prisma.$executeRawUnsafe(`UPDATE AppUser SET email=? WHERE id=?`, placeholder, row.id);
      normalized += 1;
      continue;
    }
    if (cleaned !== row.email) {
      await prisma.$executeRawUnsafe(`UPDATE AppUser SET email=? WHERE id=?`, cleaned, row.id);
      normalized += 1;
    }
  }

  const dups = await prisma.$queryRawUnsafe<Array<{ email: string; c: number }>>(
    `SELECT email, COUNT(*) AS c FROM AppUser GROUP BY email HAVING c > 1`
  );

  let merged = 0;
  for (const dup of dups) {
    const rows = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        email: string;
        role: string;
        emailVerified: number | boolean;
        passwordHash: string | null;
        googleSub: string | null;
        displayName: string;
        createdAt: string;
      }>
    >(`SELECT * FROM AppUser WHERE email=? ORDER BY createdAt ASC`, dup.email);

    rows.sort((a, b) => scoreAppUser(b) - scoreAppUser(a));
    const keeper = rows[0];
    const losers = rows.slice(1);

    for (const loser of losers) {
      // Prefer keeper googleSub; if keeper lacks one, copy from loser.
      if (!keeper.googleSub && loser.googleSub) {
        await prisma.$executeRawUnsafe(
          `UPDATE AppUser SET googleSub=? WHERE id=?`,
          loser.googleSub,
          keeper.id
        );
        keeper.googleSub = loser.googleSub;
      }

      // Move AdminUser links to keeper (and resolve appUserId uniqueness).
      if (await tableExists("AdminUser")) {
        if (await columnExists("AdminUser", "appUserId")) {
          await prisma.$executeRawUnsafe(
            `UPDATE AdminUser SET appUserId=? WHERE appUserId=?`,
            keeper.id,
            loser.id
          );
        }
      }

      await prisma.$executeRawUnsafe(`DELETE FROM AppUser WHERE id=?`, loser.id);
      merged += 1;
      console.log(
        `Merged duplicate AppUser ${loser.id} → ${keeper.id} (email=${dup.email})`
      );
    }
  }

  // Blank / duplicate googleSub values break UNIQUE (SQLite treats '' as a value).
  if (await columnExists("AppUser", "googleSub")) {
    await prisma.$executeRawUnsafe(
      `UPDATE AppUser SET googleSub=NULL WHERE googleSub IS NOT NULL AND TRIM(googleSub)=''`
    );

    const googleDups = await prisma.$queryRawUnsafe<Array<{ googleSub: string; c: number }>>(
      `SELECT googleSub, COUNT(*) AS c FROM AppUser WHERE googleSub IS NOT NULL GROUP BY googleSub HAVING c > 1`
    );
    for (const g of googleDups) {
      const rows = await prisma.$queryRawUnsafe<Array<{ id: string; role: string; createdAt: string }>>(
        `SELECT id, role, createdAt FROM AppUser WHERE googleSub=? ORDER BY CASE WHEN role='ADMIN' THEN 0 ELSE 1 END, createdAt ASC`,
        g.googleSub
      );
      for (const extra of rows.slice(1)) {
        await prisma.$executeRawUnsafe(`UPDATE AppUser SET googleSub=NULL WHERE id=?`, extra.id);
        console.log(`Cleared duplicate googleSub on AppUser ${extra.id}`);
      }
    }
  }

  return { merged, normalized };
}

async function normalizeAdminUserEmails() {
  if (!(await tableExists("AdminUser"))) {
    console.log("AdminUser table not present yet — skip admin email cleanup.");
    return { merged: 0, normalized: 0 };
  }

  const all = await prisma.$queryRawUnsafe<Array<{ id: string; email: string }>>(
    `SELECT id, email FROM AdminUser`
  );

  let normalized = 0;
  for (const row of all) {
    const cleaned = String(row.email || "")
      .trim()
      .toLowerCase();
    if (!cleaned) {
      const placeholder = `admin+${row.id}@users.local`;
      await prisma.$executeRawUnsafe(`UPDATE AdminUser SET email=? WHERE id=?`, placeholder, row.id);
      normalized += 1;
      continue;
    }
    if (cleaned !== row.email) {
      await prisma.$executeRawUnsafe(`UPDATE AdminUser SET email=? WHERE id=?`, cleaned, row.id);
      normalized += 1;
    }
  }

  // If unique index is temporarily missing / broken, still merge duplicates.
  const dups = await prisma.$queryRawUnsafe<Array<{ email: string; c: bigint | number }>>(
    `SELECT email, COUNT(*) AS c FROM AdminUser GROUP BY email HAVING c > 1`
  );

  let merged = 0;
  for (const dup of dups) {
    const hasAppUserId = await columnExists("AdminUser", "appUserId");
    const rows = hasAppUserId
      ? await prisma.$queryRawUnsafe<
          Array<{ id: string; email: string; appUserId: string | null; createdAt: string }>
        >(
          `SELECT id, email, appUserId, createdAt FROM AdminUser WHERE email=? ORDER BY createdAt ASC`,
          dup.email
        )
      : await prisma.$queryRawUnsafe<
          Array<{ id: string; email: string; appUserId: string | null; createdAt: string }>
        >(
          `SELECT id, email, NULL as appUserId, createdAt FROM AdminUser WHERE email=? ORDER BY createdAt ASC`,
          dup.email
        );

    const keeper = rows[0];
    for (const loser of rows.slice(1)) {
      // Move sessions / activity to keeper where possible.
      if (await tableExists("Session")) {
        await prisma.$executeRawUnsafe(
          `UPDATE Session SET userId=? WHERE userId=?`,
          keeper.id,
          loser.id
        );
      }
      if (await tableExists("ActivityLog")) {
        await prisma.$executeRawUnsafe(
          `UPDATE ActivityLog SET userId=? WHERE userId=?`,
          keeper.id,
          loser.id
        );
      }
      await prisma.$executeRawUnsafe(`DELETE FROM AdminUser WHERE id=?`, loser.id);
      merged += 1;
      console.log(`Merged duplicate AdminUser ${loser.id} → ${keeper.id} (email=${dup.email})`);
    }
  }

  // Ensure at most one AdminUser per appUserId (NULLs are fine).
  if (await columnExists("AdminUser", "appUserId")) {
    const linkDups = await prisma.$queryRawUnsafe<Array<{ appUserId: string; c: number }>>(
      `SELECT appUserId, COUNT(*) AS c FROM AdminUser WHERE appUserId IS NOT NULL GROUP BY appUserId HAVING c > 1`
    );
    for (const d of linkDups) {
      const rows = await prisma.$queryRawUnsafe<Array<{ id: string; createdAt: string }>>(
        `SELECT id, createdAt FROM AdminUser WHERE appUserId=? ORDER BY createdAt ASC`,
        d.appUserId
      );
      for (const extra of rows.slice(1)) {
        await prisma.$executeRawUnsafe(`UPDATE AdminUser SET appUserId=NULL WHERE id=?`, extra.id);
        console.log(`Cleared duplicate AdminUser.appUserId on ${extra.id}`);
      }
    }
  }

  return { merged, normalized };
}

async function verifyNoDuplicateEmails() {
  if (await tableExists("AppUser")) {
    const dups = await prisma.$queryRawUnsafe<Array<{ email: string; c: number }>>(
      `SELECT email, COUNT(*) AS c FROM AppUser GROUP BY email HAVING c > 1`
    );
    if (dups.length) {
      throw new Error(`AppUser still has duplicate emails: ${JSON.stringify(dups)}`);
    }
  }
  if (await tableExists("AdminUser")) {
    const dups = await prisma.$queryRawUnsafe<Array<{ email: string; c: number }>>(
      `SELECT email, COUNT(*) AS c FROM AdminUser GROUP BY email HAVING c > 1`
    );
    if (dups.length) {
      throw new Error(`AdminUser still has duplicate emails: ${JSON.stringify(dups)}`);
    }
  }
}

async function main() {
  console.log("Running safe email unique-constraint cleanup...");
  const app = await normalizeAppUserEmails();
  const admin = await normalizeAdminUserEmails();
  await verifyNoDuplicateEmails();
  console.log(
    `Email cleanup complete. AppUser normalized=${app.normalized} merged=${app.merged}; AdminUser normalized=${admin.normalized} merged=${admin.merged}`
  );
}

main()
  .catch((error) => {
    console.error("Email cleanup failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
