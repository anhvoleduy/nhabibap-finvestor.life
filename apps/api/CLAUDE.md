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
