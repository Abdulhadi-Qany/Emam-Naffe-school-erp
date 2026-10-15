// NEW: scripts/seed-admin.ts
/**
 * Run with:  npx tsx scripts/seed-admin.ts
 * Requires:  BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_SCHOOL_ID
 *
 * Guarantees:
 *   • The `school_admin` role exists with least-privilege permissions.
 *   • The named user has the role in the given school.
 *   • Idempotent. Safe to re-run.
 *   • Never elevates anyone implicitly at request time.
 */
import { eq, and, isNull } from "drizzle-orm";
import { db } from "../src/infrastructure/db/client";
import { roles, userRoles, users } from "../src/infrastructure/db/schema";
import { DEFAULT_ROLE_PERMISSIONS, ROLES } from "../src/domain/auth/roles";

async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const schoolId = process.env.BOOTSTRAP_ADMIN_SCHOOL_ID;
  if (!email || !schoolId) {
    throw new Error("BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_SCHOOL_ID must be set");
  }

  // 1. Ensure role exists (idempotent).
  const existing = await db
    .select()
    .from(roles)
    .where(and(eq(roles.name, ROLES.SCHOOL_ADMIN), eq(roles.schoolId, schoolId)));

  let roleId: string;
  if (existing[0]) {
    roleId = existing[0].id;
    await db
      .update(roles)
      .set({ permissions: [...DEFAULT_ROLE_PERMISSIONS[ROLES.SCHOOL_ADMIN]] })
      .where(eq(roles.id, roleId));
  } else {
    const inserted = await db
      .insert(roles)
      .values({
        name: ROLES.SCHOOL_ADMIN,
        schoolId,
        permissions: [...DEFAULT_ROLE_PERMISSIONS[ROLES.SCHOOL_ADMIN]],
      })
      .returning({ id: roles.id });
    roleId = inserted[0].id;
  }

  // 2. Find user.
  const userRows = await db.select().from(users).where(eq(users.email, email));
  if (!userRows[0]) {
    throw new Error(
      `User ${email} not found. Sign up first, then re-run this script.`,
    );
  }
  const userId = userRows[0].id;

  // 3. Grant (idempotent).
  await db
    .insert(userRoles)
    .values({ userId, roleId, schoolId })
    .onConflictDoNothing();

  console.log(`✔ ${email} is now ${ROLES.SCHOOL_ADMIN} in school ${schoolId}`);
  process.exit(0);
}

main().catch((e) => {
  console.error("seed-admin failed:", e);
  process.exit(1);
});