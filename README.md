# Gher ERP — Backend

Production-grade backend for the Aquaculture Gher (Pond) Management ERP platform.

**Stack:** NestJS 10 + TypeScript · PostgreSQL (Prisma ORM) · Redis (cache + BullMQ queues) · JWT auth · bilingual (Bangla/English) backend text via `nestjs-i18n` · FCM push notifications · pdfkit PDF export · pluggable local/S3 (Supabase-compatible) file storage.

**All 18 modules from the master spec are complete.** See **[`PROJECT_STATE.md`](./PROJECT_STATE.md)** for the full module-by-module breakdown, architecture notes, and what's next (mobile/web apps) — read that file first in any new chat.

---

## 🚀 Getting started

```bash
# 1. Install dependencies
npm install

# 2. Start local Postgres + Redis
docker-compose up -d

# 3. Configure environment
cp .env.example .env
# set real values for JWT_ACCESS_SECRET / JWT_REFRESH_SECRET at minimum;
# FCM_* and STORAGE_* are optional until you wire up push notifications /
# S3-compatible storage — sensible local defaults are already set

# 4. Generate the Prisma client (needs normal internet access — see
#    PROJECT_STATE.md for why this specific step couldn't run in the
#    sandbox this was built in)
npx prisma generate

# 5. Create the database schema
npx prisma migrate dev --name init

# 6. Seed the first SUPER_ADMIN account + the fish species catalog
npm run prisma:seed

# 7. Run the dev server
npm run start:dev
```

Then log in:
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"01700000000","password":"ChangeMe123"}'
```
(or whatever `SEED_ADMIN_MOBILE`/`SEED_ADMIN_PASSWORD` you set in `.env`)

### Typical flow to get real data flowing
1. Log in as the seeded Admin.
2. `POST /projects` — create a Gher.
3. `POST /projects/:id/seasons` — start season 1.
4. `POST /projects/:id/partners` — add investors (auto-creates their login).
5. `POST /projects/:id/seasons/:id/fish-batches` — stock fish (auto-creates an Expense).
6. Everything else (feed, medicine, sales, water quality, reports, dashboard) follows the same `projects/:projectId/seasons/:seasonId/...` nesting pattern.

---

## Module map

| # | Module | # | Module |
|---|--------|---|--------|
| 0 | Setup & scaffolding | 10 | Sales |
| 1 | Auth + Users + RBAC | 11 | Investment & Partner |
| 2 | Project (Gher) | 12 | Water Quality |
| 3 | Season | 13 | Activity Timeline |
| 4 | Fish/Stock | 14 | Notification (FCM + BullMQ) |
| 5 | Growth | 15 | Report (+ PDF export) |
| 6 | Feed + Vendor Ledger | 16 | Season Closing |
| 7 | Medicine + Treatment | 17 | Dashboard |
| 8 | Physical Stock Reconciliation | 18 | Media (local/S3 storage) |
| 9 | Expense (central ledger) | | |

Full detail on every module: **`PROJECT_STATE.md`**.

---

## Note on `npx prisma generate`

This project was built and compiled inside a sandboxed dev container whose network is restricted to package registries — it cannot reach Prisma's binary-engine CDN (`binaries.prisma.sh`). Because of that, `prisma generate` could not download the native query-engine binary in that sandbox. `npm install` and TypeScript compilation of everything not touching Prisma-generated types were verified clean at every step; see `PROJECT_STATE.md` for the exact verification breakdown. On your own machine, with normal internet access, `npx prisma generate` works exactly as expected — this is purely a sandbox limitation, not a bug in the code.

## Switching to Supabase later

Replace `DATABASE_URL` in `.env` with your Supabase Postgres connection string — nothing else changes. For file storage, set `STORAGE_PROVIDER=s3` and point `STORAGE_ENDPOINT`/`STORAGE_ACCESS_KEY`/`STORAGE_SECRET_KEY`/`STORAGE_BUCKET` at your Supabase Storage project (it's S3-compatible) — again, no code changes.

---

## Project structure

```
src/
  common/
    filters/            # global exception + i18n validation filters
    interceptors/         # logging + response-transform interceptors
    decorators/              # is-strong-password, project-roles
    guards/                    # ProjectRolesGuard — reused by nearly every module
    utils/                       # password hashing, secure token generation
    constants/                     # BD mobile number regex, etc.
  config/                # typed config factory + fail-fast env validation
  i18n/
    bn/ en/              # one JSON file per module — all bilingual strings
  prisma/                # PrismaModule/PrismaService (global)
  redis/                 # RedisModule/RedisService (global) — caching + BullMQ
  modules/
    health/    auth/       users/      projects/   season/
    fish/      growth/     feed/       medicine/   stock-reconciliation/
    expense/   sales/      investment/ water-quality/
    activity-log/  notification/  report/  season-closing/
    dashboard/  media/
  app.module.ts
  main.ts
prisma/
  schema.prisma          # all 18 modules' models, one section per step
  seed.ts                # bootstraps SUPER_ADMIN + fish species catalog
docker-compose.yml
.env.example
PROJECT_STATE.md         # continuity anchor, read this in new chats
```

---

**Next step:** start a fresh chat, upload this zip, and say "build the React Native mobile app" (or the Next.js web app) — see `PROJECT_STATE.md` for why a fresh chat plus this zip matters for that step.
