# Project: Nhabibap My Portfolio

Nx monorepo: Angular 21 (web) + NestJS 11 (api) + PostgreSQL 17 (TypeORM).
pnpm workspaces, ESLint + Prettier, Playwright for e2e.

## Repo layout

- `apps/web` — Angular app, port 4200
- `apps/api` — NestJS app, port 3000, prefix `/api`
- `libs/shared-types` — DTOs/interfaces shared across web + api
  Import as `@my-app/shared-types`

## Commands

- `pnpm dev` — runs web + api in parallel
- `nx run-many -t test` — all unit tests
- `nx affected -t test` — unit tests for changed projects
- `nx run-many -t e2e` / `nx affected -t e2e` — e2e (api-e2e Jest + web-e2e Playwright).
  **Prefix with `NODE_ENV=test`** (or use `pnpm e2e`, `pnpm e2e:api`, `pnpm e2e:web`) — the api server
  reads real `BREVO_API_KEY` from `.env` otherwise and sends real emails via Brevo during tests.
  `EmailService` no-ops when `NODE_ENV=test`.
- `nx run-many -t lint` — lint all
- `pnpm migration:generate` / `migration:run`
- `docker compose up -d` — start Postgres

## Testing policy (MANDATORY after code changes)

Every code change ships with passing tests. No skipping for "trivial" edits.

1. **New code** — add unit specs same commit. New API endpoint or new user-facing flow also needs e2e spec (`apps/api-e2e` or `apps/web-e2e`).
2. **Changed code** — update affected unit + e2e specs. Behavior change = test change (no blind re-snapshot).
3. **Bug fix** — add regression test that fails before fix, passes after.
4. **Before reporting task done**:
   - `nx affected -t test` — must pass.
   - `nx affected -t e2e` if touched controllers, routes, UI flows, or `libs/shared-types`.
   - `nx affected -t lint` — must pass.
   - Skipped any step (e.g. no Postgres for e2e)? Say so explicitly in final summary.
5. **Never** delete or `.skip` failing test to make CI green. Fix code or fix test on purpose.
6. **`libs/shared-types` change** → re-run both `web` and `api` test suites; contract drift breaks both sides.
7. Use the `test-affected` skill to run unit + lint on affected projects.

## Conventions

- Use signals + standalone components in Angular. No NgModules.
- Use zoneless change detection (already configured).
- All API DTOs live in `libs/shared-types` and are imported by both apps.
- NestJS: one folder per resource (controller, service, module, entity, dto).
- TypeORM `synchronize` MUST stay false. Schema changes go through migrations.
- Never commit `.env`. Use `.env.example` to document required vars.

## When generating code

- Run `nx g` generators when scaffolding new apps/libs/components.
- After editing TS files, ensure they pass `nx lint`.
- Prefer `inject()` over constructor DI in Angular.
- Prefer `class-validator` decorators on DTOs in NestJS.

## What NOT to do

- Don't add new dependencies without checking they aren't already there.
- Don't bypass the proxy — Angular calls `/api/*`, never `http://localhost:3000`.
- Don't write SQL strings in services. Use the repository / query builder.
