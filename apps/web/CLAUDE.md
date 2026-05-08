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
