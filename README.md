# PMAA Events Registration Platform

Preview the fixture-backed public webinar at
`/webinars/creating-engaging-digital-content` with the web dev server.
To preview it with a production build, set `PMAA_PUBLIC_EVENT_FIXTURE=1`
when starting the built app. The fixture is disabled by default in production.
Session registration links target the form being built in WBR-32.

Webinar and workshop registration for teachers: public event pages and forms, Microsoft Teams webinars with personal join links, email and WhatsApp messages, attendance, PDF certificates and an admin dashboard.

Plan, specification, screens and Jira tickets: [planning repo](https://github.com/BytechJO/docs-planning-webinar-registration-and-live-session-setup-for-teachers). New to the project? Read its `00_Claude_Team_Guide.pdf`, then the "Start here" sheet in the tickets workbook.

## Get started

You need Node.js 26, pnpm 12 and Docker (for PostgreSQL).

```bash
pnpm install
cp .env.example .env          # Windows: copy .env.example .env
docker compose up -d db       # PostgreSQL with databases pmaa and pmaa_test
pnpm db:migrate
pnpm dev                      # web on http://localhost:3000 and the worker
```

Before every push: `pnpm check` (lint, types and all tests). Database tests need `TEST_DATABASE_URL` from `.env`.

## Layout

| Path | What |
|---|---|
| `apps/web` | Next.js app: public pages, forms, admin dashboard, API route handlers |
| `apps/worker` | Background jobs on pg-boss: messages, Teams, reminders, certificates |
| `packages/core` | Shared rules: env, roles, errors, idempotency keys, audit, logging |
| `packages/db` | PostgreSQL schema (Drizzle), migrations, transaction + outbox pattern |
| `packages/integrations` | Adapters for Microsoft Graph, email and WhatsApp, with fakes for tests |
| `docs/adr` | Decision records |

## How we work

Ticket → branch from `dev` (`T022-registration-api`) → pull request into `dev` → CI and the automatic Claude review → merge when green. `dev` is promoted to `staging` (PMAA tests there) and `staging` to `main` (production). Full rules, including the review rules: [CLAUDE.md](CLAUDE.md). Codex and other agents read [AGENTS.md](AGENTS.md), which points to the same rules.
