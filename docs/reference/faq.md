## 11. Frontend FAQ

Answers to recurring questions with direct code references.

## How do I run locally?
- Install Node 16.9.x, `yarn install`, then `yarn start`.
- Env: set `REACT_APP_BACKEND_URL_ROOT` in `.env.development`.
- Refs: `docs/frontend_handover.md:34-71`, `config/env.js`.

## Where are the routes defined?
- Public `/login`: `src/routes/index.jsx:10-14`.
- Private area: `src/routes/PrivateRoutes.jsx:21-62`.
- Path constants: `src/models/PathNames.js:1-12`.

## How do I deep-link to a Process tab or Results?
- Process tab: `/projects/:projectId/processes/:processId/:tabName`.
- Review tab: `/projects/:projectId/processes/:processId/review/:tabReview`.
- Results: `/projects/:projectId/results`.
- Refs: `docs/api-reference/routing.md`, `src/routes/PrivateRoutes.jsx:49-56`.

## Where is state stored and how are sagas wired?
- Store + saga middleware: `src/redux/index.js`.
- Modules pattern: `src/redux/modules/*` with `createSlice` utility and `sagas` map.
- Root saga: `src/redux/modules/index.js:32-35`.

## How do I start/refresh a pipeline process?
- UI controls in Process view: `src/components/Project/Process/index.jsx:886-908`.
- Start: `onStartProcess` dispatches `jobs.actions.startProcess(processId)` → `src/redux/modules/jobs/index.js:286-309`.
- Refresh jobs: `jobs.actions.fetchJobsByProcessId(processId)` → `src/redux/modules/jobs/index.js:240-259`.

## How do file uploads work?
- UI: `src/components/Files/index.jsx:31-40`.
- Saga: multipart upload in `src/redux/modules/files/index.js:84-116`.

## Where does auth state live and how is logout handled?
- Slice: `src/redux/modules/users/auth.js`.
- Backend client notifies on 401 to logout: `src/components/App/index.jsx:16-23`, `src/middleware/backendClient.js`.

## How to change the theme?
- Themes: `src/themes/light.js`, `src/themes/dark.js`.
- Theme provider wiring: `src/components/App/index.jsx:10-34`, theme factory `src/themes/index.js`.

## Why do some MUI components warn about versions?
- The app uses MUI v4 APIs (`createMuiTheme`) with some v5 packages.
- Keep using `@material-ui/core` components and v4 theme functions.

## Where can I find examples of flows?
- See `docs/examples/example-flows.md` for Projects → Processes → Results and Files flows.
