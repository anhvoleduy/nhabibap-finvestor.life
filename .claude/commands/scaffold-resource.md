---
description: Scaffold a new NestJS resource (controller, service, module, entity, DTOs)
argument-hint: <resource-name>
---

Generate a new NestJS resource named `$ARGUMENTS` in `apps/api`:

1. Run: `nx g @nx/nest:resource $ARGUMENTS --project=api --no-interactive`
2. Add a TypeORM `@Entity()` class at `apps/api/src/$ARGUMENTS/$ARGUMENTS.entity.ts`
3. Add matching DTOs in `libs/shared-types/src/lib/` so the web app can import them
4. Wire the entity into the module via `TypeOrmModule.forFeature([...])`
5. Generate a migration: `pnpm migration:generate`
6. Show me the diff before running the migration
