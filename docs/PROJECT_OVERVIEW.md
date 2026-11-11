# Workflow Orchestration Engine — Project Overview

This document explains what the project is, how it's structured, how to run it
locally, and exactly what is done vs. not done yet. **Everything described here
runs locally only — there is no cloud deployment, hosting, or CI/CD setup, and
none is intended at this stage.**

---

## 1. What this project is

A multi-tenant workflow automation platform:

- Organizations ("tenants") register their own workspace and manage their own
  users and workflows.
- Each workflow is currently a simple named/described record with a status
  (`DRAFT` → `ACTIVE` → `ARCHIVED`). The visual builder and execution engine
  shown in the product mockups are **not built yet** (see §6).
- A separate **Admin Panel** lets a platform operator (not a tenant) log in
  independently and view/manage user accounts across every tenant.

## 2. Tech stack

| Layer    | Technology |
|----------|------------|
| Backend  | Node.js, Express 5, TypeScript, MongoDB + Mongoose |
| Auth     | JWT (`jose`), Argon2id password hashing (`argon2`) |
| Validation | Zod |
| Frontend | React 19, Vite, TypeScript, React Router 7, Bootstrap 5 |
| Planned (installed, unused) | `@xyflow/react` (React Flow) for the visual workflow builder |

## 3. Folder structure

```
backend/src/
  routes/        → Express routers (thin, just wiring + validation middleware)
  controllers/    → HTTP request/response glue, no business logic
  services/       → Business logic, calls repositories
  repositories/    → All Mongoose/MongoDB access lives here
  models/         → Mongoose schemas
  validators/      → Zod request schemas
  middleware/      → auth, admin-auth, validation, error handling
  utils/          → jwt, password hashing, logger
  scripts/        → one-off scripts (e.g. seed-admin)
  engine/ workers/ workflow/ → scaffolding for the execution engine (empty, not implemented)

frontend/src/
  pages/           → one component per route/screen
  pages/admin/     → admin panel screens
  features/auth/   → tenant auth context + token storage
  features/admin/  → admin auth context + token storage (kept separate from tenant auth)
  routes/          → React Router config + protected route guards
  services/api/    → fetch wrappers (apiClient for tenants, adminApiClient for admin)
```

Every layer only talks to the layer directly below it
(`routes → controllers → services → repositories → models`). Follow this
pattern for any new feature.

## 4. Local setup

### Prerequisites
- Node.js 20+
- MongoDB running **as a replica set**, not a plain standalone server.

> **Why a replica set?** Tenant registration creates the tenant and its first
> user in a single MongoDB transaction
> (`backend/src/repositories/auth.repository.ts`). MongoDB only supports
> multi-document transactions on a replica set (even a single-node one), so a
> default standalone `mongod` will make registration fail.
>
> Quickest local fix:
> ```
> mongod --replSet rs0 --dbpath <your-db-path>
> # then, once, in a mongo shell connected to it:
> rs.initiate()
> ```

### Backend
```
cd backend
cp .env.example .env     # fill in MONGODB_URI, JWT_SECRET, ADMIN_SEED_* values
npm install
npm run seed:admin       # creates the first platform admin account
npm run dev               # starts the API on http://localhost:5000
```

### Frontend
```
cd frontend
npm install
npm run dev               # starts the Vite dev server (default http://localhost:5173)
```

The frontend reads the API base URL from `VITE_API_BASE_URL` (see
`frontend/.env`), defaulting to `http://localhost:5000/api/v1/`.

## 5. How auth works today

### Tenant side (`/api/v1/auth`, `/api/v1/workflows`)
- `POST /auth/register` — creates a tenant + its first user in one transaction.
- `POST /auth/login` — verifies credentials, checks the user's and tenant's
  status are `ACTIVE`, returns a JWT (1h expiry) with `tenantId` and the user
  ID (`sub`) as claims.
- `requireAuth` middleware (`middleware/auth.middleware.ts`) verifies the
  token and **re-checks user/tenant status in the database on every request**,
  so disabling a user or tenant takes effect immediately, even on tokens
  issued before the change.
- All workflow routes are tenant-scoped: every query filters by the
  `tenantId` taken from the token, never from the request body/params.

### Admin side (`/api/v1/admin`) — new
The admin panel is **architecturally independent** of tenant auth:

- A separate `Admin` collection (`models/admin.model.ts`) — admins are not
  tenants or tenant users.
- A separate JWT claim shape: admin tokens carry `role: "ADMIN"` and no
  `tenantId`; tenant tokens carry `tenantId` and no `role`. This means an
  admin token is automatically rejected by `requireAuth` (no `tenantId`
  claim) and a tenant token is automatically rejected by `requireAdminAuth`
  (no `role: "ADMIN"` claim) — neither can be used in place of the other.
- Separate middleware (`middleware/admin-auth.middleware.ts`), separate
  routes (`routes/admin.routes.ts`), separate frontend login page, auth
  context, token storage key, and protected-route guard
  (`features/admin/`, `pages/admin/`, `routes/AdminProtectedRoute.tsx`).

There is no public admin registration. The first (and any further) admin
account is created with the seed script:

```
cd backend
npm run seed:admin
```

It reads `ADMIN_SEED_NAME`, `ADMIN_SEED_EMAIL`, and `ADMIN_SEED_PASSWORD`
from `.env`, and does nothing if an admin with that email already exists.

**What the admin can do:** log in at `/admin/login`, then on `/admin/users`:
search/filter/paginate every user account across every tenant, see which
tenant each user belongs to, enable or disable accounts, and permanently
delete accounts. Disabling/deleting takes effect immediately for that user's
existing sessions, because `requireAuth` re-checks status on every request.

## 6. Workflow CRUD (tenant side)

Fully working end-to-end: create, list (search by name/description, filter
by status, paginated), get by ID, update (blocked once a workflow is
`ARCHIVED`), and archive (soft-delete — archived workflows are read-only and
never hard-deleted).

## 7. API reference

### Tenant API (`/api/v1`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | none | Register a new tenant + first user |
| POST | `/auth/login` | none | Log in, returns JWT |
| POST | `/workflows` | tenant JWT | Create a workflow |
| GET | `/workflows` | tenant JWT | List workflows (`?search=&status=&page=&limit=`) |
| GET | `/workflows/:id` | tenant JWT | Get a workflow |
| PATCH | `/workflows/:id` | tenant JWT | Update name/description/status |
| DELETE | `/workflows/:id` | tenant JWT | Archive (not delete) a workflow |
| GET | `/health` | none | Health check |

### Admin API (`/api/v1/admin`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/admin/auth/login` | none | Admin log in, returns JWT |
| GET | `/admin/users` | admin JWT | List users across all tenants (`?search=&status=&page=&limit=`) |
| GET | `/admin/users/:id` | admin JWT | Get a single user |
| PATCH | `/admin/users/:id/status` | admin JWT | Set status to `ACTIVE` or `DISABLED` |
| DELETE | `/admin/users/:id` | admin JWT | Permanently delete a user |

All responses follow `{ success: boolean, data?: ..., message?: string, error?: { code, message } }`.

## 8. Done vs. not done yet

**Done:**
- Tenant registration + login
- Tenant-scoped workflow CRUD (list/search/filter/paginate/create/edit/archive)
- Admin panel: separate login, user list/search/filter/paginate, enable/disable, delete

**Not done yet** (scaffolding exists but is empty: `backend/src/engine/`,
`backend/src/workers/`, `backend/src/workflow/`, `models/execution.model.ts`):
- The actual workflow execution engine (running a workflow's steps, retries,
  dead-letter queue, execution logs)
- The visual drag-and-drop workflow builder (`@xyflow/react` is installed as
  a dependency but not used anywhere yet)
- Executions list/history/monitoring pages (the `ExecutionsPage` is currently
  a placeholder)
- Any notion of tenant-level admin roles (today, every user in a tenant has
  equal access — "admin" in this codebase refers only to the platform-level
  admin panel described above)

## 9. UI note

The visual design (styling, layout, branding) for tenant-facing pages is
owned by a teammate and intentionally left as-is here. The new admin panel
pages were built with the same plain/basic look as the current
`LoginPage`/`DashboardPage` (not the more polished `WorkflowsPage`) on
purpose, so they're easy to restyle later without fighting existing CSS.
