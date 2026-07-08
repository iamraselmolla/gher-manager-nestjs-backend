import { PrismaClient, PlatformRole, FishCategory } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_FISH_SPECIES: { category: FishCategory; nameBn: string; nameEn: string }[] = [
  { category: FishCategory.SHRIMP, nameBn: 'বাগদা', nameEn: 'Bagda (Black Tiger Shrimp)' },
  { category: FishCategory.SHRIMP, nameBn: 'গলদা', nameEn: 'Golda (Freshwater Prawn)' },
  { category: FishCategory.SHRIMP, nameBn: 'ভেনামী', nameEn: 'Vannamei' },
  { category: FishCategory.SHRIMP, nameBn: 'হরিনা', nameEn: 'Horina' },
  { category: FishCategory.CARP, nameBn: 'রুই', nameEn: 'Rui (Rohu)' },
  { category: FishCategory.CARP, nameBn: 'কাতলা', nameEn: 'Catla' },
  { category: FishCategory.CARP, nameBn: 'মৃগেল', nameEn: 'Mrigel' },
  { category: FishCategory.CARP, nameBn: 'গ্রাস কার্প', nameEn: 'Grass Carp' },
];

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
async function seedAdmin() {
  const existingAdmin = await prisma.user.findFirst({
    where: { platformRole: PlatformRole.SUPER_ADMIN },
  });

  if (existingAdmin) {
    console.log(
      `Admin seed skipped — a SUPER_ADMIN already exists (${existingAdmin.mobileNumber}).`,
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

/** Seeds the default fish/shrimp species catalog. Safe to re-run — skips any name already present. */
async function seedFishSpecies() {
  let created = 0;
  for (const species of DEFAULT_FISH_SPECIES) {
    const existing = await prisma.fishSpecies.findFirst({
      where: { nameEn: species.nameEn },
    });
    if (existing) continue;
    await prisma.fishSpecies.create({ data: species });
    created++;
  }
  console.log(
    created > 0
      ? `✅ Seeded ${created} fish species (${DEFAULT_FISH_SPECIES.length - created} already existed).`
      : 'Fish species seed skipped — catalog already populated.',
  );
}

async function main() {
  await seedAdmin();
  await seedFishSpecies();
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
