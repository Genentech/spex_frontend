# SPEX Frontend — Handover Guide

This document is a living, staged handover for the SPEX frontend. It is written so any developer can continue from the last completed stage and quickly understand what is built and how.

Last updated: 2025-09-03

## Plan and Progress

Legend: [x] Done, [ ] Pending, [~] In Progress

- [x] Stage 1 — Overview & Environment
- [x] Stage 2 — Project Structure
- [~] Stage 3 — UI Navigation Flows
- [ ] Stage 4 — Routing Details
- [ ] Stage 5 — State Management (Redux + Sagas)
- [ ] Stage 6 — API Client & Auth
- [ ] Stage 7 — UI & Theming
- [ ] Stage 8 — Domain Features (Projects, Processes, Files, Results)
- [ ] Stage 9 — Build & Run
- [ ] Stage 10 — Testing
- [ ] Stage 11 — Code Standards
- [ ] Stage 12 — Troubleshooting

How to resume: pick the first unchecked stage, read its section skeleton, fill it with code references and examples, then update the checklist.

---

## Stage 1 — Overview & Environment

Purpose: High-level context and what’s required to run and develop locally.

- App type: Single Page Application built with React 17, Redux (redux-saga), React Router v5.
- UI stack: Material-UI v4 (with some MUI v5 packages present), styled-components, shared UI library.
- Key features: Projects, Processes (pipelines) visualization, Files management, Results viewing.
- HTTP: Axios with auth interceptor and cancellable requests.
- Build tooling: Ejected Create React App (Webpack 4), custom configs in `config/*`, scripts in `scripts/*`.

Environment prerequisites

- Node.js: 16.9.0 recommended (use NVM).
- Package manager: Yarn or npm.
- Required env var: `REACT_APP_BACKEND_URL_ROOT` (backend base URL).

Example `.env.development`

```
REACT_APP_BACKEND_URL_ROOT=http://127.0.0.1/v1/
```

Quick start

```
# install dependencies
yarn install

# run dev server
yarn start

# build production bundle
NODE_OPTIONS="--max-old-space-size=4096" yarn build
```

References

- Entry: `src/index.js:6`
- App providers and theme: `src/components/App/index.jsx:25`
- Store config: `src/redux/index.js:20`
- Router: `src/routes/index.jsx:10`
- Env handling: `config/env.js`

Status: Done

---

## Stage 2 — Project Structure

Purpose: Map top-level folders and describe what lives where.

Top-level layout (selected)

- `README.md`: Basic project usage; Apple Silicon notes in `readme_Apple.md`.
- `scripts/`: Dev/build/test scripts used by CRA (ejected)
  - `scripts/start.js`, `scripts/build.js`, `scripts/test.js`
- `config/`: Webpack and environment configuration
  - `config/webpack.config.js`, `config/webpackDevServer.config.js`
  - `config/webpack.config.alias.js` — import aliases
  - `config/env.js`, `config/paths.js`
- `.env*`: Environment files — must include `REACT_APP_BACKEND_URL_ROOT`
- `public/`: HTML template and static assets
- `src/`: Application source code (see below)

Import aliases

- Declared in `config/webpack.config.alias.js` and `local.js`:
  - `@/` → `src/`
  - `+components/` → `src/shared/components/`
  - `+utils/` → `src/shared/utils/`
  - `+hooks/` → `src/shared/hooks/`

`src/` structure (key areas)

- `src/index.js`: App entry point, mounts `<App />` and manages the service worker.
- `src/components/App/index.jsx`: Providers — Redux `Provider`, `BrowserRouter`, MUI and styled-components theme providers.
- `src/routes/`:
  - `src/routes/index.jsx`: Top-level routes, `/login` and private area via `PrivateRoute`.
  - `src/routes/PrivateRoutes.jsx`: Authenticated routes nested under `Layout`.
- `src/redux/`:
  - `src/redux/index.js`: Store creation, saga middleware setup.
  - `src/redux/reducers.js`: Combines feature reducers.
  - `src/redux/modules/`: Feature slices with reducers, sagas, selectors
    - Examples: `users/auth.js`, `projects/index.js`, `processes/index.js`, `jobs/index.js`, `tasks/index.js`, `files/index.js`, `resources/index.js`
  - `src/redux/utils/`: `createSlice.js`, helpers, cancellation utils.
- `src/middleware/backendClient.js`: Axios client factory with baseURL, 401 handling (logout), and cancel tokens.
- `src/shared/`:
  - `src/shared/components/`: Reusable UI (Table, Modal, Form, ImageViewer, Tabs, Select, Buttons, Typography, etc.).
  - `src/shared/utils/`: `storage` proxy for tokens and multi-tab sync, formatters, misc.
- `src/themes/`: MUI theme setup (`light/dark`) plus global styles with styled-components — `src/themes/index.js`.
- `src/components/` (feature pages and layout):
  - `Layout/`: AppBar, project/process selectors, navigation.
  - `Login/`, `Files/`, `Projects/`, `Project/`, `NotFound404/`.
  - `Project/Process/`: Pipeline graph (react-flow-renderer), forms and blocks.
  - `Project/Results/`: Results pages and tabs.
- `src/models/PathNames.js`: Centralized path names for URLs.

Notes

- There is a mix of MUI v4 and v5 packages. The app uses MUI v4 theme APIs (`createMuiTheme`).
- Shared components rely on MUI and styled-components; keep providers in `App` intact.

Status: Done

---

## Stage 3 — UI Navigation Flows

Purpose: Make UI navigation explicit with steps, order, and components involved.

Global layout

- Root shell: `Layout` wraps all authenticated pages, provides the top `AppBar`, project and process selectors, logout button, and a scrollable body area.
- Providers: Redux store + Router are mounted in `App` and surround `Layout`.

Authentication and access

- Public route: `/login` renders `components/Login`.
- Private area: guarded by `shared/components/PrivateRoute` which checks `auth.selectors.isAuthenticated` and redirects to `/login` if needed.
- Token changes: cross-tab logout via `storage` event handled in `PrivateRoutes.jsx`.

Primary navigation flows

1) Login to Projects
- Start at `/login` → submit credentials.
- On success, auth saga stores token in `storage`, `isAuthenticated` becomes true.
- Navigate to `/` or `/${projects}` which renders the project list screen.
- Components: `Login`, `users/auth` saga, `PrivateRoute`, `PrivateRoutes`, `Layout`, `ProjectFiles` (default).

2) Pick a project
- From the AppBar project selector or the project list, select a project.
- URL becomes `/${projects}/:id`.
- The `Project` component is rendered; its tabs control which sub-view is visible.
- Components: `Layout` (selectors in toolbar), `Projects` or `ProjectFiles` (list), `Project` (container), Redux modules `projects`, `processes`.

3) Project tabs and deep links
- Resources tab: `/${projects}/:id` or `/${projects}/:id/${resources}` shows project resources.
- Processes tab: `/${projects}/:id/${processes}` shows list/graph of pipelines; selecting a specific pipeline yields `/${projects}/:id/${processes}/:processId`.
- Process sub-tabs: `/${projects}/:id/${processes}/:processId/:tabName` or review tabs at `/${projects}/:id/${processes}/:processId/review/:tabReview`.
- Results tab: `/${projects}/:id/${results}` shows results view.
- Components: `Project` (route-aware container), `Project/Process` (graph, forms), `Project/Results`, resource components.

4) Files area (global)
- Navigate to `/${files}` to manage files outside a specific project context.
- Components: `Files` page, shared table, modals.

Route map (path → component)

- `/login` → `components/Login`
- `/`, `/${projects}` → `components/ProjectFiles`
- `/${files}` → `components/Files`
- `/${projects}/:id` → `components/Project`
- `/${projects}/:id/${resources}` → `components/Project`
- `/${projects}/:id/${pipelines}` → `components/Project`
- `/${projects}/:id/${pipelines}/:id` → `components/Project`
- `/${projects}/:id/${processes}` → `components/Project`
- `/${projects}/:id/${processes}/:id` → `components/Project`
- `/${projects}/:id/${processes}/:id/:tabName` → `components/Project`
- `/${projects}/:id/${processes}/:id/review/:tabReview` → `components/Project`
- `/${projects}/:id/${results}` → `components/Project`

Components leveraged per area (high-level)

- Layout: `AppBar`, `Select` (`+components/Select`), `Button`, `Link`, `Typography`, progress indicators; navigation via `useHistory`.
- Project: route matching via `matchPath`, `Tabs` (custom), storage-backed sidebar open state, child sections Results/Processes/Resources.
- Processes: `react-flow-renderer` for pipeline graph, forms via `final-form` + custom `FormRenderer`, job blocks (`JobBlock`) and controls.
- Results: various data views with tables, filters, and detail panels.
- Files: shared `Table`, modals (`Modal`, `ConfirmModal`), transfer lists.

Status: In Progress (next: add visual examples and key component callouts within each sub-section)

References

- Private routes: `src/routes/PrivateRoutes.jsx:20`
- Layout: `src/components/Layout/index.jsx:1`
- Project container: `src/components/Project/index.jsx:1`
- Process graph: `src/components/Project/Process/index.jsx:7`

---

## Stage 4 — Routing Details (skeleton)

Purpose: Explain public vs private routes and URL schema precisely.

To cover

- `src/routes/index.jsx`: `/login` and the private switch via `PrivateRoute`.
- `src/routes/PrivateRoutes.jsx`: All authenticated routes wrapped in `Layout`.
- `src/shared/components/PrivateRoute/index.jsx`: Guard logic based on auth state.
- URL segments from `src/models/PathNames.js`.

Status: Pending

---

## Stage 5 — State Management (skeleton)

Purpose: Describe store wiring, feature module pattern, and saga flows.

To cover

- Store: `src/redux/index.js` — saga middleware, devtools, HMR.
- Root reducer: `src/redux/reducers.js` combines `modules` reducers.
- Modules: `src/redux/modules/*` via custom `createSlice.js` including reducers, sagas(actions), selectors.
- Auth flow: `users/auth.js` login, token storage in `storage`, 401 logout.
- Data flows: `projects`, `processes`, `files`, `resources`, `jobs`, `tasks` sagas calling `backendClient`.

Status: Pending

---

## Stage 6 — API Client & Auth (skeleton)

Purpose: Centralize HTTP behavior and auth concerns.

To cover

- `src/middleware/backendClient.js`: baseURL from `REACT_APP_BACKEND_URL_ROOT`, response interceptors.
- Cancellation pattern with augmented axios methods and `CANCEL` from redux-saga.
- Token storage and multi-tab sync: `src/shared/utils/storage.js`.

Status: Pending

---

## Stage 7 — UI & Theming (skeleton)

Purpose: Document theme, global styles, and shared components.

To cover

- Theme: `src/themes/index.js` (`createMuiTheme`), `light/dark`.
- Providers: `App` wraps MUI + styled-components with `GlobalStyle`.
- Shared components catalog: Table, Modal, Form renderer, Image viewer, Tabs, Select, Buttons, Typography.

Status: Pending

---

## Stage 8 — Domain Features (skeleton)

Purpose: Describe core pages and their responsibilities.

To cover

- `Layout`: navigation, project/process selectors, logout.
- `Projects` / `ProjectFiles`: listing and entry point into a project.
- `Project`: tabs (Resources, Processes, Results), URL handling.
- `Project/Process`: graph (react-flow-renderer), forms, job blocks.
- `Project/Results`: tabbed view and deep links.
- `Files`: file lists, transfers, modals.

Status: Pending

---

## Stage 9 — Build & Run (skeleton)

Purpose: How to develop, build, and configure.

To cover

- Dev server: `yarn start`, proxy, ports.
- Build: `yarn build`, memory flags, output in `build/`.
- Webpack configs in `config/*`, aliases in `config/webpack.config.alias.js`.

Status: Pending

---

## Stage 10 — Testing (skeleton)

Purpose: Test tooling and patterns.

To cover

- Jest + Testing Library setup (CRA defaults), where tests live.
- Running tests: `yarn test`.

Status: Pending

---

## Stage 11 — Code Standards (skeleton)

Purpose: Linting and conventions.

To cover

- ESLint config: `.eslintrc`, plugins used.
- Import aliases and module boundaries.
- Naming and folder conventions for modules and components.

Status: Pending

---

## Stage 12 — Troubleshooting (skeleton)

Purpose: Common issues and fixes.

To cover

- Node version mismatch (use NVM 16.9.0).
- Mixed MUI v4/v5: stick to v4 theme APIs.
- Build OOM: increase memory (`NODE_OPTIONS=--max-old-space-size=4096`).
- 401 responses: interceptor triggers logout; verify `REACT_APP_BACKEND_URL_ROOT` and CORS.

Status: Pending

