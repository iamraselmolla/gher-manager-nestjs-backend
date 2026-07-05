import { PrismaClient, PlatformRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Bootstraps exactly one SUPER_ADMIN account so the very first login is
 * possible (every other user is created through `POST /users`, which
 * requires an existing SUPER_ADMIN — this script breaks that chicken-and-egg
 * problem). Safe to re-run: it's a no-op if a SUPER_ADMIN already exists.
 *
 * Configure via env vars before running `npm run prisma:seed`:
 *   SEED_ADMIN_MOBILE   (default: 01700000000)
 *   SEED_ADMIN_PASSWORD (default: ChangeMe123 — CHANGE THIS IN PRODUCTION)
 *   SEED_ADMIN_NAME     (default: "Super Admin")
 */
async function main() {
  const existingAdmin = await prisma.user.findFirst({
    where: { platformRole: PlatformRole.SUPER_ADMIN },
  });

  if (existingAdmin) {
    console.log(
      `Seed skipped — a SUPER_ADMIN already exists (${existingAdmin.mobileNumber}).`,
    );
    return;
  }

  const mobileNumber = process.env.SEED_ADMIN_MOBILE ?? '01700000000';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123';
  const name = process.env.SEED_ADMIN_NAME ?? 'Super Admin';

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      mobileNumber,
      name,
      passwordHash,
      platformRole: PlatformRole.SUPER_ADMIN,
      mustChangePassword: true,
    },
  });

  console.log('✅ Seeded SUPER_ADMIN account:');
  console.log(`   mobileNumber: ${admin.mobileNumber}`);
  console.log(`   password:     ${password}  (change this immediately after first login)`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
