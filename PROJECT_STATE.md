# Gher ERP — Project State

> Read this first in any new chat. Upload this whole zip along with it so
> Claude can extend the real files instead of reconstructing them from memory.

**Last updated:** Step 1 (Auth + Users + RBAC) delivered.

---

## ✅ Done

### Step 0 — Project Setup & Scaffolding
NestJS skeleton, security middleware (Helmet/CORS/throttling), env validation
(fail-fast at boot), global Prisma + Redis modules, bilingual (Bangla
default/English toggle) i18n system, consistent success/error response
envelope, `/health` endpoint, `docker-compose.yml` for local Postgres+Redis.

### Step 1 — Auth + Users + RBAC
- **Prisma models:** `User`, `RefreshToken`, `PasswordResetToken`, enums
  `PlatformRole` (`SUPER_ADMIN` | `USER`), `Language` (`bn` | `en`)
- **Login:** mobile number + password (`POST /auth/login`)
- **JWT:** access (15m) + refresh (30d) token pair, two separate secrets,
  refresh tokens hashed (SHA-256) in DB, never stored raw
- **Refresh rotation with reuse detection:** each refresh token works once;
  reusing an already-rotated token revokes every session for that user
  (theft mitigation)
- **Endpoints:** `/auth/login`, `/auth/refresh`, `/auth/logout`,
  `/auth/logout-all`, `/auth/change-password`, `/auth/forgot-password`,
  `/auth/reset-password`, `/auth/me`
- **Global `JwtAuthGuard`** — every route requires a valid Bearer token
  unless marked `@Public()` (health, login, refresh, forgot/reset-password)
- **Platform-level RBAC:** `@Roles(PlatformRole.SUPER_ADMIN)` +
  `PlatformRolesGuard` — project-scoped Editor/Investor roles come next,
  via `ProjectMember`, in the Project module
- **Users module (Admin-only):** create/list/get/update platform users;
  `createUser()` in `UsersService` is written to be reused as-is by the
  future Investment module for investor auto-account creation (same
  default-password + forced-first-login-change behaviour)
- **Bilingual validation messages** for every auth/user DTO (`src/i18n/bn|en/auth.json`)
- **Seed script** (`prisma/seed.ts`) bootstraps the first `SUPER_ADMIN` from
  env vars — breaks the chicken-and-egg problem of needing an admin to
  create the first admin

**Verification performed:** `npm install` clean. `npx tsc --noEmit` — **0
errors on everything except Prisma-generated types**, which can't regenerate
in this sandbox (see note below); all 16 errors seen traced to that one root
cause and confirmed to be nothing else. One real bug (found via tsc) was
fixed (`parseExpiryMs` possibly-undefined unit). `nest build` **not**
re-verified end-to-end this round for the same reason — do this on your
machine per the Getting Started steps below; it's expected to pass cleanly
once `npx prisma generate` succeeds there.

---

## ⚠️ Known sandbox limitation (not a code bug)

This dev container's network is restricted to package registries and can't
reach `binaries.prisma.sh`, so `npx prisma generate` cannot download the
native query-engine binary here. That means, starting from this module
onward, **I can't run a fully green `nest build` inside this sandbox** —
only `npx tsc --noEmit` gets us most of the way, and even that shows
"missing Prisma type" errors that will disappear the instant `prisma
generate` succeeds on a machine with normal internet access.

**What you should do after unzipping:**
```bash
npm install
npx prisma generate
npx prisma migrate dev --name add_auth_users
npm run build   # should now be 0 errors
```
If `npm run build` shows anything **other than** errors already listed above
as fixed, tell me and I'll patch it immediately — but based on manual review
against the exact schema, none are expected.

---

## 🔜 Next module

**Project (Gher) module** — project CRUD, GPS pin + boundary polygon, land
area (শতক/একর/বিঘা), lease info, land-owner info, media gallery references,
`ProjectMember` (role × project_id — this is where Editor/Investor
project-scoped RBAC actually gets enforced).

Say "continue" / "next module" (or name a different one) to proceed.

---

## 📌 Confirmed decisions so far
- Fresh backend, superseding the earlier 13-module version
- Plain PostgreSQL for now (not Supabase) — swap `DATABASE_URL` later, zero code changes
- One module at a time, delivered as a working zip, awaiting approval before the next
- bcryptjs (not native `bcrypt`) — avoids native-binary problems entirely
