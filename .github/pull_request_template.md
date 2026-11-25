## Ticket

T0xx: <!-- ticket title -->

## What changed

-

## Tests added

<!-- From the ticket's "Tests to add": unit, integration (real PostgreSQL), e2e. -->
-

## Checklist

- [ ] Branch from `dev`, named after the ticket (`T022-registration-api`); this PR targets `dev`
- [ ] Admin routes use `adminRoute` (role check on the server)
- [ ] Writes that send messages use `inTransaction` + `enqueueOutbox`; no provider call inside a request
- [ ] Jobs use `defineJob` with an idempotency key and re-check state first
- [ ] No secrets, tokens, join links or personal data in code, logs or responses
- [ ] New code has tests; `pnpm check` passes locally
