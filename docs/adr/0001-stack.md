# 0001 Stack

Date: 2026-11-25 · Status: accepted

## Decision

TypeScript end to end, following the specification's recommended architecture (§4):

- **Web:** Next.js (App Router, React 19) for public pages, forms, the admin dashboard and the REST/JSON route handlers (§13).
- **Worker:** a separate Node process on pg-boss for everything slow or external: outbox dispatch, emails, Microsoft Graph, WhatsApp, reminders, certificates.
- **Database:** PostgreSQL with Drizzle ORM and SQL migrations.
- **Admin sign-in:** Auth.js with Microsoft Entra ID (teachers never sign in).
- **Microsoft Graph:** the JavaScript client behind one adapter in `packages/integrations`.
- **Certificates:** HTML templates rendered to PDF with Playwright.
- **Tests:** Vitest (unit, and integration on a real PostgreSQL), Playwright end to end.

## Why

The team works in React and Node, and one language across web, worker and tests keeps reviews and onboarding simple. The full comparison with .NET is in the planning repo (document 03, decision D1). The decision gate is the Graph test (T006): we switch only if the JavaScript Graph path proves unreliable.

## Patterns everyone copies

- `adminRoute` for every admin API (role check first).
- `inTransaction` + `recordAudit` + `enqueueOutbox`: the change, its audit entry and its messages commit together.
- `defineJob` + `idempotencyKey`: a retried job never acts twice.
- `loadEnv` for configuration, `createLogger` for logs without personal data.
