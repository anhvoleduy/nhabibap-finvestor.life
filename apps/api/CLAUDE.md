# NestJS app

- New resource: `nx g @nx/nest:resource <name> --project=api`.
- Validation via global ValidationPipe (whitelist + transform).
- Entities: `*.entity.ts`, colocated with the module.
- Never use `synchronize: true`. Generate a migration:
  `pnpm migration:generate`
- All controllers must have `@ApiTags` + `@ApiOperation` for Swagger.

## Config & env

- All env vars via `ConfigModule.forRoot({ isGlobal: true })` + `ConfigService`.
- Never access `process.env` directly in services/controllers.
- Document every var in `.env.example`.

## Error handling

- Global exception filter for consistent `{ statusCode, message, timestamp }` shape.
- Domain errors: throw NestJS built-in exceptions (`NotFoundException`, `BadRequestException`, etc.).
- Never swallow errors silently.

## Swagger

- All endpoints: `@ApiResponse({ type: ResponseDto })` with explicit response DTO.
- Use `@ApiProperty()` on every DTO field (required + optional).

## Guards & interceptors

- Auth: JWT guard applied globally, whitelisted with `@Public()` decorator.
- Logging: request/response interceptor at app level.
- Transform: response interceptor wraps payload in `{ data }` envelope if needed.

## Testing (required after every change)

Root `CLAUDE.md` has full policy. API-specific rules:

### Unit specs (`*.spec.ts` colocated)

- Every controller, service, guard, interceptor, pipe ships with `.spec.ts`.
- Use `Test.createTestingModule({...}).compile()`. Mock the repository with `getRepositoryToken(Entity)` + jest mock.
- Don't hit real Postgres in unit tests — that's e2e territory.
- DTO validation: assert on `validate(dto)` from `class-validator` directly.
- Run: `nx test api`.

### E2E (`apps/api-e2e`, Jest + supertest)

- Add e2e spec for every new endpoint or change in request/response shape.
- Update spec when DTO, status code, or auth requirement changes.
- Use real Nest app via `Test.createTestingModule(...).compile()` + `app.init()`; hit it with `supertest(app.getHttpServer())`.
- Postgres must be up: `docker compose up -d` first. Tests own their setup/teardown — no leaked rows.
- Run: `nx e2e api-e2e`.

### Migration changes

- New migration → add e2e that exercises the affected entity end-to-end.
- Run `pnpm migration:run` against a clean DB before e2e to verify.

### Before "done"

- `nx test api` passes.
- `nx e2e api-e2e` passes (or note explicitly why skipped — e.g. no Postgres).
- `nx lint api` clean.
- Touched a shared DTO? Also rerun `nx test web`.
