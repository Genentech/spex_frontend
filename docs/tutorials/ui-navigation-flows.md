# 03. UI Navigation Flows

This guide maps the main user journeys to routes and components in the app. It references source files so you can jump between docs and code.

## Public → Private
- Public login: `/login` → `src/routes/index.jsx:11`
- Authenticated area: `PrivateRoute` → `src/routes/index.jsx:13`, wraps `PrivateRoutes` with `Layout` → `src/routes/PrivateRoutes.jsx:21`, `src/components/Layout/index.jsx:1`

## Top-Level Private Routes
- `/` → Project Files overview → `ProjectFiles` → `src/routes/PrivateRoutes.jsx:31`
- `/projects` → same as root (Project Files) → `ProjectFiles` → `src/routes/PrivateRoutes.jsx:37`
- `/files` → Global Files → `src/components/Files/index.jsx`

## Project Area Routes (mounted at `/projects/:projectId`)
All handled by `Project` component: `src/components/Project/index.jsx` with route matching in `src/routes/PrivateRoutes.jsx:45`.

- `/projects/:projectId` → Project landing (tabs context)
- `/projects/:projectId/resources` → Resources tab → `src/components/Project/Resources/index.jsx`
- `/projects/:projectId/pipelines` → Pipelines tab → `src/components/Project/Processes/index.jsx`
- `/projects/:projectId/pipelines/:id` → Pipeline details (selection) → see `SelectJobsInProcess` (`src/shared/components/SelectJobsInProcess/index.jsx`)
- `/projects/:projectId/processes` → Processes list → `src/components/Project/Processes/index.jsx`
- `/projects/:projectId/processes/:processId` → Process view → `src/components/Project/Process/index.jsx`
- `/projects/:projectId/processes/:processId/:tabName` → Process tab subview (dynamic)
- `/projects/:projectId/processes/:processId/review/:tabReview` → Process review sub-tab
- `/projects/:projectId/results` → Results → `src/components/Project/Results/index.jsx`

Path name constants are defined in `src/models/PathNames.js`.

## Navigation Patterns
- Project/process selectors navigate via `history.push(...)` in:
  - `src/components/Layout/index.jsx:93,103,106`
- In-project tab switches push URLs in:
  - `src/components/Project/index.jsx:138` and `src/components/Project/TabComponent/index.jsx:18,32`

## Deep Link Examples
- Open a specific process tab: `/projects/123/processes/456/plot`
- Open process review tab: `/projects/123/processes/456/review/metrics`
- Jump to results: `/projects/123/results`

## Cross-Component Helpers
- Route matching with `matchPath` and location: e.g., `src/components/Project/index.jsx:109,118,120,129,130,131`
- Selection helpers for process/jobs: `src/shared/components/SelectJobsInProcess/index.jsx:28,34,38`

## Auth Sync
- Cross-tab logout is handled by `storage` event → `src/routes/PrivateRoutes.jsx:17-24` (clears session when token removed).

## Next
- Add screenshots and link out to the Routing Reference when ready.
