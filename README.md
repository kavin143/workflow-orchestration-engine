# Workflow Orchestration Engine

A multi-tenant workflow automation platform where users can design workflows, execute workflow steps, track progress, retry failed steps, and compensate completed steps when a later step fails.

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Node.js, Express, TypeScript
- **Database:** MongoDB
- **Validation:** Zod
- **Security:** Helmet, CORS, rate limiting
- **Version control:** Git and GitHub

> This README describes the current project setup and the agreed API naming convention. Some features and API routes are planned and may not be implemented yet.

## Project Structure

```text
workflow-orchestration-engine/
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── workflow/
│   │   ├── engine/
│   │   ├── workers/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── package.json
│   └── ...
├── docs/
└── README.md
```

## Requirements

Install these before running the project:

- Node.js (LTS version recommended)
- npm (comes with Node.js)
- Git
- MongoDB, when database features are enabled

Check the installations:

```powershell
node --version
npm --version
git --version
```

## 1. Clone the Repository

```powershell
git clone https://github.com/kavin143/workflow-orchestration-engine.git
cd workflow-orchestration-engine
```

## 2. Install and Run the Backend

Open a terminal:

```powershell
cd backend
npm install
```

Create your local environment file from the example:

```powershell
Copy-Item .env.example .env
```

Open `backend/.env` and set the values required by `backend/src/config/env.ts` (if environment validation is configured). For example:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/workflow_orchestration_engine
```

Use the exact variable names required by the project's current environment configuration. Never commit `.env`.

Run the backend in development mode:

```powershell
npm run dev
```

The backend currently uses port `5000` by default. Keep this terminal running.

In a second backend terminal, these commands can be used to check the code:

```powershell
npm run typecheck
npm run build
```

Run these commands from the `backend` directory.

## 3. Install and Run the Frontend

Open another terminal from the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Vite usually serves the frontend at:

```text
http://localhost:5173
```

Use the exact local URL printed in the terminal if Vite chooses another port.

## 4. API URL and Route Naming Convention

Use this format for backend API routes:

```text
http://localhost:<PORT>/api/v1/<resource>
```

For local development, the API base URL is intended to be:

```text
http://localhost:5000/api/v1
```

Examples of consistent route names:

| Purpose | Method | Example route |
|---|---|---|
| Health check | GET | `/api/v1/health` |
| List workflows | GET | `/api/v1/workflows` |
| Create workflow | POST | `/api/v1/workflows` |
| Get one workflow | GET | `/api/v1/workflows/:workflowId` |
| Update workflow | PATCH | `/api/v1/workflows/:workflowId` |
| Delete workflow | DELETE | `/api/v1/workflows/:workflowId` |
| Start an execution | POST | `/api/v1/workflows/:workflowId/executions` |
| List executions | GET | `/api/v1/executions` |
| Get execution details | GET | `/api/v1/executions/:executionId` |

These are the team's **recommended route conventions**; an example route is not necessarily implemented yet. Check the current `backend/src/routes/` files before using it.

### How to mount the API prefix

When connecting the API router, keep the version prefix in one place. For example, if `src/routes/index.ts` exports an Express router:

```ts
// In backend/src/app.ts
import apiRouter from "./routes/index.js";

app.use("/api/v1", apiRouter);
```

Then define resource routes inside the router without repeating `/api/v1`:

```ts
// Example inside backend/src/routes/index.ts
import { Router } from "express";
import healthRouter from "./health.routes.js";

const router = Router();

router.use("/health", healthRouter);
// Add other resource routers here.

export default router;
```

And define the health endpoint inside `health.routes.ts`:

```ts
import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
  });
});

export default router;
```

With these routers mounted as shown, the health endpoint becomes `GET http://localhost:5000/api/v1/health`. Avoid defining the same route in multiple places.

## 5. Git Workflow for Team Members

The shared branch is `develop`. Each member should work on their own feature branch:

- Team Lead: `feature/team-lead`
- Rajashri: `feature/rajashri-kale`
- Rishika: `feature/rishika-puljalula`
- Rahul: `feature/rahul-karan`
- Ritesh: `feature/ritesh-kumar`

### First-time setup

After cloning the repository:

```powershell
git fetch origin
git switch develop
git pull origin develop
git switch feature/<your-branch-name>
```

Replace `<your-branch-name>` with your assigned branch name. If the branch does not exist locally yet, create a local tracking branch using:

```powershell
git switch --track origin/feature/<your-branch-name>
```

### Before starting daily work

```powershell
git fetch origin
git switch develop
git pull origin develop
git switch feature/<your-branch-name>
git merge develop
```

Resolve any conflicts carefully before continuing. If your team agrees to use rebase instead of merge, follow that shared rule consistently.

### Save and push your work

Check which files changed:

```powershell
git status
```

Stage the intended files:

```powershell
git add .
```

Commit with a clear message:

```powershell
git commit -m "feat: add workflow list endpoint"
```

Push your own branch:

```powershell
git push origin feature/<your-branch-name>
```

Use a meaningful message that describes the real change. Examples:

```text
feat: add workflow validation
fix: handle missing workflow ID
test: cover invalid workflow payloads
docs: update local setup instructions
```

### Create a Pull Request

1. Push your feature branch to GitHub.
2. Open the repository on GitHub.
3. Create a Pull Request with **base: `develop`** and **compare: your feature branch**.
4. Describe the change and the tests you ran.
5. Wait for review and approval before merging.

**Do not push directly to `main` or `develop`.** Do not make empty commits just to show activity. Every daily commit should represent genuine, reviewable work.

## 6. Environment and Secret Safety

- Keep local secrets in `backend/.env`.
- Commit `.env.example` with placeholder values only.
- Never commit passwords, API keys, access tokens, private keys, or real customer data.
- Do not change shared environment variable names without coordinating with the team.
- If a secret is accidentally committed, notify the Team Lead immediately and rotate it.

## 7. Common Commands

| Task | Command | Run from |
|---|---|---|
| Install backend packages | `npm install` | `backend/` |
| Run backend | `npm run dev` | `backend/` |
| Check backend types | `npm run typecheck` | `backend/` |
| Build backend | `npm run build` | `backend/` |
| Install frontend packages | `npm install` | `frontend/` |
| Run frontend | `npm run dev` | `frontend/` |
| Check changed files | `git status` | Any repository folder |
| Create commit | `git commit -m "type: message"` | Any repository folder |
| Push current branch | `git push origin <branch-name>` | Any repository folder |

## 8. Troubleshooting

**Port is already in use**
- Stop the other process using that port, or configure a different port using the project's supported environment setting.

**`npm install` fails**
- Check your Node.js and npm versions.
- Run the command from the correct folder (`backend` or `frontend`).
- Read the first error shown in the terminal before trying changes.

**Git push returns `403`**
- Check that the remote URL points to the correct repository.
- Confirm that GitHub is authenticating with an account that has permission to push.
- `git config user.name` and `git config user.email` set commit identity; they do not by themselves change the authenticated GitHub account.

**Merge conflicts**
- Open each conflicted file, choose the correct combined changes, run the relevant checks, then commit the resolution.

## 9. Team Daily Report

At the end of each workday, share:

```text
Name:
Date / Day:
Task planned:
Work completed:
Commit link:
Pull Request link (if applicable):
Tests run and result:
Blocker / help needed:
Next workday plan:
```

## Development Status

This project is under active development. Routes and features listed as examples in this README should be checked against the current source code before being treated as available.
