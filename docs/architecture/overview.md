# 20. Architecture Overview & Patterns

High-level structure of the SPEX Frontend and the core patterns used across features.

Stack
- React 17, React Router v5, Redux with redux-saga, Material‑UI v4, styled-components.
- Axios client with auth + cancellation wrappers.

Providers & Store
- App providers and theme: `src/components/App/index.jsx:10-36`
- Store + saga middleware: `src/redux/index.js:1-28`
- Root reducers/sagas assembly: `src/redux/modules/index.js:1-20,22-35,37-53`

Module Pattern (slice + sagas + selectors)
- Each feature exports a slice created via `createSlice` with:
  - `reducers`: synchronous reducers and common helpers `startFetching/stopFetching`.
  - `sagas`: generator map keyed by `actions.*` for side effects.
  - `selectors`: memoized selectors via `createSelector`.
- Example (jobs): `src/redux/modules/jobs/index.js:1-36,98-136,240-556`
- Root assembly collects `slice.sagas` and runs them in `rootSaga`.

HTTP Client & Auth
- Backend client factory with auth token + response interceptor:
  - `src/middleware/backendClient.js:1-28,58-120`
  - Base URL from `REACT_APP_BACKEND_URL_ROOT`.
- Unauth handling wired in App: `configureBackendClient(() => logout())`
  - `src/components/App/index.jsx:12-20`

Routing
- Public `/login`; private area wrapped by `PrivateRoute` → `PrivateRoutes` under `Layout`.
- Definitions: `src/routes/index.jsx:1-18`, `src/routes/PrivateRoutes.jsx:1-62`
- Path constants: `src/models/PathNames.js:1-12`

Theming & Global Styles
- Theme factory + GlobalStyle: `src/themes/index.js:1-60`
- Providers order: StylesProvider → MuiThemeProvider → styled ThemeProvider.
- App wiring: `src/components/App/index.jsx:18-36`

Shared UI & Utilities
- Shared components under `src/shared/components/*` (tables, forms, view controls, etc.).
- Utilities: `src/shared/utils/*` (storage, formatters, etc.).

Error/Cancel Strategy
- Begin/end of requests via `startFetching/stopFetching` to toggle `isFetching`.
- Failures normalized by `requestFail` reducers across modules.
- Cancellation tokens wrapped around axios calls: `wrapHttpWithCancellation`.

Notes
- Keep features isolated; export actions/selectors from their slice.
- Prefer selectors in components; avoid reaching into state shape directly.

