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
- `pnpm test` — `nx run-many -t test`
- `pnpm test:affected` — `nx affected -t test`
- `pnpm lint` — `nx run-many -t lint`
- `pnpm migration:generate` / `migration:run`
- `docker compose up -d` — start Postgres

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
