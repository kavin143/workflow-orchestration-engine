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
- A workflow is a named/described record (status `DRAFT` → `ACTIVE` →
  `ARCHIVED`) that owns a **visual node graph** (Start/End/API
  Request/Condition/Delay nodes), built in a drag-and-drop canvas, which can
  actually be **run**: a background worker walks the graph node by node,
  retries failed nodes, moves permanently-failed nodes to a dead-letter
  state, and records a full execution history with logs (see §7).
- A separate **Admin Panel** lets a platform operator (not a tenant) log in
  independently and view/manage user accounts across every tenant.

## 2. Tech stack

| Layer    | Technology |
|----------|------------|
| Backend  | Node.js, Express 5, TypeScript, MongoDB + Mongoose |
| Auth     | JWT (`jose`), Argon2id password hashing (`argon2`) |
| Validation | Zod |
| Frontend | React 19, Vite, TypeScript, React Router 7, Bootstrap 5 |
| Workflow builder canvas | `@xyflow/react` (React Flow) |
| Job queue | A small Mongo-backed queue (`models/job.model.ts`) — no Redis/external broker; a single in-process worker polls it |

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
  engine/         → the execution engine: graph validation (graph.ts), {{template}}
                    resolution, condition evaluation, one handler per node type
                    (engine/handlers/*.handler.ts), and the executor that ties them
                    together (executor.ts)
  workers/        → execution.worker.ts — polls the job queue and calls the executor

frontend/src/
  pages/           → one component per route/screen
  pages/admin/     → admin panel screens
  components/layout/AppShell.tsx → the sidebar shell every tenant page renders inside
  features/auth/   → tenant auth context + token storage
  features/admin/  → admin auth context + token storage (kept separate from tenant auth)
  routes/          → React Router config + protected route guards
  services/api/    → fetch wrappers (apiClient for tenants, adminApiClient for admin)
  types/workflow-definition.ts → shared node/edge types used by the builder
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

## 6. Dashboard and navigation shell

Every tenant page (Dashboard, Workflows, Builder, Executions, Execution
view) renders inside one shared layout, `components/layout/AppShell.tsx` —
a plain sidebar (Dashboard/Workflows/Executions links + Log out) wrapping a
React Router `<Outlet />`. It's wired in once, in `routes/AppRoutes.tsx`,
by nesting those routes inside `<Route element={<AppShell />}>`. This
replaces each page being a standalone centered card.

The **Dashboard** (`pages/DashboardPage.tsx`) shows real data, not mockups:
on load it calls `GET /workflows/summary` and `GET /executions/summary`
and renders stat cards (workflow counts by status; execution counts by
status) plus a 7-day execution bar chart. The chart is a small hand-rolled
inline SVG (`WeeklyChart` in that file) — no charting library dependency,
kept deliberately minimal.

`WorkflowsPage.tsx` previously had its own built-in top navigation bar;
since the shell now provides that, only its `<header>` block was removed —
nothing else on that page changed.

## 7. Workflows and the execution engine (tenant side)

**Workflow CRUD**: create, list (search by name/description, filter by
status, paginated), get by ID, update (blocked once a workflow is
`ARCHIVED`), and archive (soft-delete — archived workflows are read-only and
never hard-deleted).

**Visual builder** (`/workflows/:id/builder`, `@xyflow/react` canvas): add
Start/End/API Request/Condition/Delay nodes, drag to position, connect them,
configure each node's settings in a side panel, then Validate/Save/Run.

**The graph** is stored on the workflow as `definition: { nodes, edges }`
(`backend/src/engine/types.ts`). A Condition node has two outgoing edges
tagged `sourceHandle: "yes" | "no"`. Node config can reference any earlier
node's output with `{{nodeName.path}}` (e.g. an API Request's URL or body,
or a Condition's expression like `{{fetchStatus.status}} == 200`).

**Running a workflow** (`POST /workflows/:id/run`):
1. The current `definition` is validated (`engine/graph.ts` — exactly one
   Start, ≥1 End, every node reachable, no cycles, every Condition has both
   branches) and **snapshotted** onto a new `Execution` document, so later
   edits to the live workflow never affect a run already in progress.
2. A `Job` (`models/job.model.ts`) is queued for the Start node.
3. The in-process worker (`workers/execution.worker.ts`, polling every 1s)
   claims due jobs and hands them to `engine/executor.ts#processJob`, which
   runs the node's handler (`engine/handlers/*.handler.ts`), records the
   result on the execution, and queues the next node(s) via
   `engine/graph.ts#getNextNodeIds` (following the taken Condition branch).
4. **On node failure**: retried up to 3 attempts total with backoff, then
   the node is marked `DEAD_LETTER` and the whole execution `FAILED`. A
   failed execution can be re-run (`POST /executions/:id/rerun`), which
   starts a brand-new execution from the same graph snapshot.
5. A Delay node doesn't block the worker — the executor simply schedules the
   *next* job's `runAt` in the future.

**Watching a run** (`/executions/:id`): the frontend polls
`GET /executions/:id` every 2s while the status is `PENDING`/`RUNNING`,
showing each node's status (`PENDING`/`RUNNING`/`SUCCESS`/`FAILED`/
`RETRYING`/`DEAD_LETTER`) and a flat execution log feed.

**Node types implemented now**: Start, End, API Request (real HTTP via
`fetch`), Condition, Delay. **Deferred** (same handler pattern, not built
yet): Transform, Webhook, Custom Script.

## 8. API reference

### Tenant API (`/api/v1`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | none | Register a new tenant + first user |
| POST | `/auth/login` | none | Log in, returns JWT |
| POST | `/workflows` | tenant JWT | Create a workflow |
| GET | `/workflows` | tenant JWT | List workflows (`?search=&status=&page=&limit=`) |
| GET | `/workflows/summary` | tenant JWT | Dashboard counts by status |
| GET | `/workflows/:id` | tenant JWT | Get a workflow |
| PATCH | `/workflows/:id` | tenant JWT | Update name/description/status |
| DELETE | `/workflows/:id` | tenant JWT | Archive (not delete) a workflow |
| PUT | `/workflows/:id/definition` | tenant JWT | Save the builder's node/edge graph |
| POST | `/workflows/:id/validate` | tenant JWT | Validate a graph without saving it |
| POST | `/workflows/:id/run` | tenant JWT | Run the saved graph → `{ executionId }` |
| GET | `/executions` | tenant JWT | List executions (`?workflowId=&status=&page=&limit=`) |
| GET | `/executions/summary` | tenant JWT | Dashboard counts + 7-day breakdown |
| GET | `/executions/:id` | tenant JWT | Get an execution's node runs + logs |
| POST | `/executions/:id/rerun` | tenant JWT | Re-run from the same graph snapshot |
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

## 9. Done vs. not done yet

**Done:**
- Tenant registration + login
- Tenant-scoped workflow CRUD (list/search/filter/paginate/create/edit/archive)
- Shared sidebar navigation shell + a Dashboard with real stat cards and a
  7-day execution chart
- Visual workflow builder (Start/End/API Request/Condition/Delay), graph
  validation, save/run
- Execution engine: background worker, real HTTP calls, Condition branching,
  `{{template}}` references between nodes, retries with backoff, dead-letter
  handling, execution history with per-node logs, re-run
- Admin panel: separate login, user list/search/filter/paginate, enable/disable, delete

**Not done yet**:
- Transform, Webhook, and Custom Script node types (same handler pattern as
  the existing ones, just not written yet)
- Any cross-tenant execution monitoring on the admin side (today the admin
  panel only manages users, not workflows/executions)
- Any notion of tenant-level admin roles (today, every user in a tenant has
  equal access — "admin" in this codebase refers only to the platform-level
  admin panel described above)
- Email sending (e.g. a welcome email on registration, or a failure alert) —
  deliberately skipped; it would mean picking and wiring an SMTP/cloud
  provider (AWS SES etc.) for no concrete requirement yet, which also
  conflicts with the "local-only, no cloud" scope of this phase

## 10. UI note

The visual design (styling, layout, branding) for tenant-facing pages is
owned by a teammate and intentionally left as-is here. The new admin panel
pages were built with the same plain/basic look as the current
`LoginPage`/`DashboardPage` (not the more polished `WorkflowsPage`) on
purpose, so they're easy to restyle later without fighting existing CSS.
