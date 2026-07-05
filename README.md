# Gher ERP — Backend

Production-grade backend for the Aquaculture Gher (Pond) Management ERP platform.

**Stack:** NestJS 10 + TypeScript · PostgreSQL (Prisma ORM) · Redis (cache + future BullMQ queues) · JWT auth · bilingual (Bangla/English) backend text via `nestjs-i18n`.

This backend is being built **module by module with your approval between each one**. See **[`PROJECT_STATE.md`](./PROJECT_STATE.md) for exactly what's done and what's next** — read that file first in any new chat.

---

## ✅ Delivered so far

- **Step 0 — Project Setup & Scaffolding**: security middleware, env validation, Prisma/Redis modules, bilingual i18n system, consistent API envelope, health check, `docker-compose.yml`
- **Step 1 — Auth + Users + RBAC**: mobile+password login, JWT access/refresh rotation with reuse detection, platform-level RBAC guard, Admin-only user management, bilingual validation messages, first-admin seed script

Full details, exact endpoints, and verification results: see `PROJECT_STATE.md`.

## 🗺️ Full module roadmap (built one at a time, each with your sign-off)

1. ~~Auth + Users + RBAC~~ ✅
2. **Project (Gher) module** — project CRUD, GPS pin + boundary polygon, land info, lease info, media gallery references, `ProjectMember` (project-scoped RBAC)
3. **Season module** — yearly cycles, one active season per project, read-only lock on close
4. **Fish/Stock module** — DB-driven species, stocking batches, age calculation
5. **Growth module** — per-species/per-batch weight checks, growth trend time series
6. **Feed module + Vendor Ledger** — multi-entry daily purchases, due/advance tracking, usage, remaining stock
7. **Medicine module + Treatment records** — cash-only auto-expense, follow-up reminders
8. **Physical Stock Reconciliation** — checkpoint-based consumption back-calculation (feed + medicine)
9. **Expense module** — central ledger, category-wise + timeline-wise views, source traceability
10. **Sales module** — species/qty/amount/date + same-day cost → net sales
11. **Investment & Partner module** — auto investor account creation, share % validation, mid-season withdrawals, investor ledger
12. **Water Quality module** — PH/temp/oxygen/ammonia/salinity trend graphs
13. **Activity Timeline** — auto-logged, attributed, project-wide feed
14. **Notification module** — FCM push, Redis-backed reminder queue (BullMQ)
15. **Report module** — daily/monthly/yearly reports, PDF export
16. **Season Closing** — profit/loss calc, share distribution net of withdrawals, read-only lock
17. **Dashboard module** — cached aggregates for mobile + web
18. **Media module** — Supabase Storage / S3-compatible upload handling

---

## 🚀 Getting started on your machine

```bash
# 1. Install dependencies
npm install

# 2. Start local Postgres + Redis
docker-compose up -d

# 3. Configure environment
cp .env.example .env
# edit .env if you changed any docker-compose credentials/ports, and set
# JWT_ACCESS_SECRET / JWT_REFRESH_SECRET to real random values

# 4. Generate the Prisma client (downloads the query-engine binary —
#    needs normal internet access, see note below)
npx prisma generate

# 5. Create the migration
npx prisma migrate dev --name add_auth_users

# 6. Seed the first SUPER_ADMIN account (see prisma/seed.ts)
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

### ⚠️ Note on `npx prisma generate`
This project was built and compiled inside a sandboxed dev container whose network is restricted to package registries (npm, GitHub, etc.) — it cannot reach Prisma's binary-engine CDN (`binaries.prisma.sh`). Because of that, **`prisma generate` could not download the native query-engine binary in that sandbox**. `npm install` and TypeScript compilation of everything not touching Prisma-generated types were verified with zero errors; see `PROJECT_STATE.md` for the exact verification breakdown on this delivery. On your own machine, with normal internet access, `npx prisma generate` will work exactly as expected — this is purely a sandbox limitation, not a bug in the code.

### Switching to Supabase later
Just replace `DATABASE_URL` in `.env` with your Supabase Postgres connection string — nothing else changes.

---

## 📁 Project structure

```
src/
  common/
    filters/            # global exception + i18n validation filters
    interceptors/        # logging + response-transform interceptors
    decorators/            # is-strong-password (shared across modules)
    guards/                  # (project-scoped guards land with ProjectMember)
    utils/                     # password hashing, secure token generation
    constants/                   # BD mobile number regex, etc.
  config/
    app.config.ts       # typed config factory
    env.validation.ts   # class-validator env schema (fail-fast on boot)
  i18n/
    bn/ en/              # common.json + auth.json bilingual strings
    i18n.config.ts
  prisma/
    prisma.module.ts
    prisma.service.ts
  redis/
    redis.module.ts
    redis.service.ts
  modules/
    health/              # GET /health
    auth/                 # login, refresh, logout, change/forgot/reset password
    users/                 # admin user management + language preference
    # projects/, season/, fish/, growth/, feed/, vendor-ledger/, medicine/,
    # treatment/, expense/, sales/, investment/, partner/, water-quality/,
    # notification/, report/, dashboard/, media/  ← added one at a time
  app.module.ts
  main.ts
prisma/
  schema.prisma
  seed.ts
docker-compose.yml
.env.example
PROJECT_STATE.md         # ← continuity anchor, read this in new chats
```

---

**Next step:** tell me to proceed and I'll build the **Project (Gher) module** next — or name a different module to start with instead.

