# Workflow Orchestrator — Multi-Tenant Distributed Workflow & Saga Engine

> **Zaalima Internship Project 1**  
> **Topic:** Multi-Tenant Distributed Workflow & Saga Orchestration Engine  
> **Tech Stack:** React 19 • TypeScript • Vite • Tailwind CSS • Lucide Icons

---

## 📸 9 Complete Web Application Screens Implemented

This web application implements all 9 screens from the architectural design and project roadmap:

| # | Screen Name | Description & Key Features |
|---|---|---|
| **1** | **Login Page** | Multi-tenant auth screen, custom brand gradient banner, organization switcher (`Acme Corp`, `TechCorp`, `FinTech Global`), 1-click quick demo login buttons. |
| **2** | **Dashboard** | 4 primary KPI cards (Total Workflows: 12, Running: 3, Successful: 96, Failed: 8), 7-Day execution grouped bar chart with hover tooltips, 107 total executions donut chart, active tenant indicator. |
| **3** | **Workflow List** | Search workflows, status filter (`All`, `Active`, `Inactive`), table with inline execution trigger (`Run`), builder edit shortcut, and deletion. |
| **4** | **Create Workflow** | Two-column responsive layout with visual benefit checklist on the left, name & description form on the right, and template selector (`Start from scratch`, `Customer Onboarding`, etc.). |
| **5** | **Workflow Builder (Visual DAG)** | Blueprint grid canvas with zoom/pan controls, undo/redo, left node palette (`Start`, `End`, `API Request`, `Condition`, `Transform`, `Webhook`, `Delay`, `Custom Script`), clickable node graph with branching, and right Inspector drawer with Basic/Advanced/Headers tabs. |
| **6** | **Execution View (Live DAG)** | Live running simulation of `Customer Onboarding`. Real-time step status progression (`Completed (1.2s)`, `Completed (0.8s)`, `Running...`, `Waiting...`), animated pulse glows, and streaming timestamped execution logs. |
| **7** | **Execution History** | Audit log table displaying `#1001`, `#1000`, `#999`, `#998`, `#997` with workflow names, status pills, timestamps, duration, and inspect drill-down. |
| **8** | **Failure, Retry & DLQ** | Failure breakdown of `Order Processing (#1000)`. Visual DAG showing `Process Payment` failure, 3 exponential backoff retries, routing to Dead Letter Queue (`Move to DLQ`), backward Saga compensation rollback, and manual DLQ replay button. |
| **9** | **Admin / Monitoring Dashboard** | System-wide monitoring with `Last 7 Days` selector, 4 system metrics (Total Tenants: 8, Total Executions: 1,245, Success Rate: 92%, Failed Executions: 98), multi-bar telemetry chart, and 4-node Worker status cards. |

---

## 🚀 Running the Application

The application is already built and running locally:

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Open in your browser:
http://localhost:5173
```

To create a production build:
```bash
npm run build
```

---

## 🧩 Architectural Highlights & PDF Roadmap Alignment

- **Tenant Isolation**: Every workflow, execution, and log is scoped to the authenticated tenant. Use the top tenant switcher to toggle between `Acme Corp`, `TechCorp Solutions`, `FinTech Global`, and `RetailHub`.
- **Saga Orchestrations**: Implements backward compensation chains if a downstream step fails or gateway timeouts occur.
- **Dead-Letter Queue (DLQ)**: Automatic fallback after 3 exponential backoff retries with manual inspection and replay capabilities.
- **DAG Loop & Cycle Detection**: Built-in validation button in Screen 5 checks for loops, disconnected terminals, and required fields.
- **Quick Screen Navigator**: An interactive top toolbar allows switching directly to any of the 9 screens for testing and demos.
