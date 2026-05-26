# Angular app

- Standalone components only. Routes use `loadComponent`.
- State: prefer signals; use NgRx Signal Store for cross-feature state.
- Use `HttpClient` with `inject()`. Base URL is `/api` (proxied in dev).
- Styling: SCSS, BEM-ish naming. Angular Material is available.
- New component: `nx g @nx/angular:component` (don't hand-roll the files).

## Signal APIs (Angular 21)

- Component I/O: use `input()`, `output()`, `model()`. Never `@Input()` / `@Output()`.
- Derived writable state: `linkedSignal()`. Read-only derived: `computed()`.
- Async data: `resource()` or `httpResource()` instead of manual subscribe + signal.
- Bridge RxJS → signals with `toSignal()`. Avoid storing observables in component state.
- `effect()` is last resort — prefer `computed()` or `linkedSignal()` for derived state.

## Templates

- Control flow: `@if`, `@for`, `@switch`. Never `*ngIf` / `*ngFor` / `*ngSwitch`.
- Lazy sections: `@defer` with appropriate `@placeholder` / `@loading` / `@error`.
- Local vars: `@let` for intermediate template expressions.

## Routing

- Enable `withComponentInputBinding()` in app config so route params bind via `input()`.
- Lazy-load feature routes with `loadChildren` + barrel `routes.ts` per feature.

## Testing (required after every change)

Root `CLAUDE.md` has full policy. Web-specific rules:

### Unit specs (`*.spec.ts` colocated)

- Every new component, service, store, pipe, directive ships with `.spec.ts`.
- Standalone components: import the component directly in `TestBed.configureTestingModule({ imports: [Cmp] })`. No `declarations`.
- Signals: assert on `signal()` value via `cmp.mySignal()`; trigger CD with `fixture.detectChanges()`.
- `httpResource` / `resource`: stub `HttpClient` via `provideHttpClientTesting()` and flush with `HttpTestingController`.
- MatDialog: spy on `MatDialog.prototype.open`, not via `{ provide: MatDialog }`. See memory `feedback_angular_testing_dialog`.
- Routing inputs: pass via `ComponentRef.setInput('name', value)`.
- Run: `nx test web` or `nx test web --watch` while iterating.

### E2E (`apps/web-e2e`, Playwright)

- Add e2e spec for any new route, form submission, auth flow, or critical user journey.
- Update existing spec when changing selectors, copy, or flow steps.
- Use semantic locators (`getByRole`, `getByLabel`); avoid CSS class selectors that churn.
- Run: `nx e2e web-e2e` (api must be up — `pnpm dev` or compose).

### Before "done"

- `nx test web` passes.
- `nx e2e web-e2e` passes (or note explicitly why skipped).
- `nx lint web` clean.
