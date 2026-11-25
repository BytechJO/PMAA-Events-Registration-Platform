# PMAA Events Registration Platform

Webinar and workshop registration for teachers, with Microsoft Teams, email, WhatsApp, attendance and PDF certificates. Live target: Thu 17 Dec 2026.

The plan, the specification and the Jira tickets live in the planning repo: https://github.com/BytechJO/docs-planning-webinar-registration-and-live-session-setup-for-teachers
- Spec (source of truth): `org-docs/` there; read the text copy in `org-docs/extracted/`.
- Tickets: `docs/1-plan-and-tickets/PMAA_Webinars_Jira_Tickets.xlsx` (sheets "Start here" and "Pick list"). Each ticket lists its area, PMAA inputs it waits for, the tests to add and its Definition of Done.
- Every screen with its route, API, data and jobs: `docs/3-tech-and-screens/08_*.pdf`; clickable prototype: `run-prototype.cmd` there.

## Stack and layout

TypeScript end to end, pnpm workspace (decision record: `docs/adr/0001-stack.md`).

| Path | What |
|---|---|
| `apps/web` | Next.js (App Router, React 19, Tailwind): public pages, forms, admin dashboard, API route handlers. Next.js 16 differs from older versions: read `apps/web/AGENTS.md` and the docs in `node_modules/next/dist/docs/` before writing Next code. |
| `apps/worker` | Background worker on pg-boss: outbox dispatch, emails, Graph and WhatsApp calls, reminders, certificates |
| `packages/core` | Shared rules: env validation, roles and `requireRole`, errors, idempotency keys, audit entries, logger that hides personal data |
| `packages/db` | PostgreSQL schema (Drizzle), migrations in `packages/db/drizzle`, the transaction + audit + outbox pattern |
| `packages/integrations` | Adapters for outside services (Graph mail and Teams, WhatsApp), each with a fake for tests |

## Commands

```
pnpm install                  # Node 26, pnpm 12
docker compose up -d db       # PostgreSQL with databases pmaa and pmaa_test
pnpm db:migrate               # apply migrations (DATABASE_URL)
pnpm dev                      # web on :3000 and the worker
pnpm check                    # lint + typecheck + all tests; run before every push
pnpm db:generate              # new migration after a schema change (commit the SQL)
pnpm build && pnpm test:e2e   # end-to-end tests (Playwright); PW_CHANNEL=msedge to use Edge locally
```

Tests: `*.test.ts` next to the code (Vitest). Database tests are `*.int.test.ts` and run against `TEST_DATABASE_URL`; they skip locally without it, but CI sets `REQUIRE_DB_TESTS=1`, so they always run there. Browser tests are in `apps/web/e2e`.

## How we work

- Take the lowest open pick order in an area you can work in (the "Pick list" sheet); move the card to **In progress** at once.
- Branch from `dev`, named after the ticket: `T022-registration-api`. One ticket per branch and pull request.
- Start in plan mode: read the ticket (description, Tests to add, Definition of Done, spec refs, mockup screen), propose the change and its tests, then build.
- Every ticket ships its own tests (unit, integration on real PostgreSQL, e2e for screens), so the test count grows with each ticket.
- Push and open a pull request into `dev`: card to **Testing**. CI runs every test and Claude reviews automatically. A red check or a MUST-FIX finding goes back to the author.
- All green: squash-merge into `dev`, card to **Done**. No manual code reviews.
- `dev` → `staging` (Tech Lead promotes daily and before demos; PMAA tests on staging) → `main` (production releases only, tagged). Hotfix: branch from `main`, merge back into `staging` and `dev`. Nobody pushes directly to `dev`, `staging` or `main`.
- A ticket marked red ("BLOCKED until PMAA gives ...") is built against the fakes in `packages/integrations` up to the blocked call.

## Review rules

The automatic Claude review applies these. Breaking one is a MUST-FIX.

1. Every admin route handler is wrapped in `adminRoute([...roles], ...)` (role check on the server; event-scoped roles pass the `eventId`). Never trust the UI to hide what a role cannot do.
2. A change that sends a message writes it with `enqueueOutbox` inside the same `inTransaction` as the change, plus `recordAudit` for admin actions. No provider call (Graph, email, WhatsApp) inside a request.
3. Every job uses `defineJob` with an `idempotencyKey(...)` and re-reads current state before acting. A retried or duplicated job must never send twice.
4. No secrets, tokens, Teams join links or personal data (names, emails, phones) in logs, error responses, public HTML or predictable URLs. Log with `createLogger()`; error bodies come from `errorBody()`.
5. Configuration comes from `loadEnv()`; nothing secret is committed. New variables go into `.env.example` (name only) and `packages/core/src/env.ts`.
6. Times are stored in UTC (`timestamptz`) and shown in the session's time zone.
7. Form input is validated with a zod schema shared by the form and the handler; the server is authoritative.
8. Schema changes come with a generated migration in `packages/db/drizzle`.
9. New or changed code has tests for its logic and for the acceptance scenario it touches (named after it, e.g. `AT-02 duplicate submit`).
10. Settings the spec calls "configurable" are settings, not constants.

## Conventions

- American English in code, comments and docs.
- Plain language, short sentences. No bracket placeholders like `[Manager]` in anything people read.
- Role labels (Dev 1, Tech Lead), not names, in docs and tickets.
- Keep this file current: when a rule changes, change it here, in the same pull request.

## Status

- 2026-11-25: repo created with the skeleton and shared patterns (T005), CI and the automatic Claude review workflows. All checks pass locally (lint, types, 29 unit/integration tests on real PostgreSQL, build, 6 e2e tests). Next: the "Start here" tickets (T010, T020 first).
