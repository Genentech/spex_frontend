# 06. State Management (Redux + Sagas)

This reference documents the Redux store wiring, modules pattern (createSlice utils), sagas, and selectors with direct code links.

## Store
- Configure store + Saga middleware: `src/redux/index.js:1`, `src/redux/index.js:5`, `src/redux/index.js:6`, `src/redux/index.js:10`, `src/redux/index.js:38`, `src/redux/index.js:42`
- Root reducer (combined from module reducers): `src/redux/reducers.js:1`, `src/redux/reducers.js:5`
- Root saga (composed from all slice sagas): `src/redux/modules/index.js:27`, `src/redux/modules/index.js:32`
- Registered slices in root tree: `src/redux/modules/index.js:16`

## Modules Pattern
Each feature module is a self-contained slice: actions, reducers, sagas, selectors.
- Projects: `src/redux/modules/projects/index.js:25` (slice), selectors `:163`, actions `:28-69`, sagas `:72`
- Processes: `src/redux/modules/processes/index.js:25` (slice), selectors `:349`, actions `:29-41,42-46,98-107`, sagas `:110`
- Jobs: `src/redux/modules/jobs/index.js:42` (slice), selectors `:399`, actions `:47-127`, sagas `:323,340,357,373`
- Tasks: `src/redux/modules/tasks/index.js:136` (slice), selectors appear after reducers; actions `:140-155` (many), reducers e.g. `:157-220`
- Files: `src/redux/modules/files/index.js:24` (slice), selectors near end; actions `:28-31`, sagas `:71`
- Resources: `src/redux/modules/resources/index.js:37` (slice), selectors `:145`, actions `:41-44`, sagas `:79`
- OMERO: `src/redux/modules/omero/index.js:26` (slice), selectors and sagas implement OMERO data fetching
- Auth (users): `src/redux/modules/users/auth.js:22` (slice), selectors `:75`, sagas `:56`

Notes
- Common initial shape: `isFetching`, `error`, and domain data (e.g., `projects`, `processes`, `jobs`).
- Success reducers call `stopFetching`; request starters use `startFetching`.

## createSlice Utils
Custom wrapper extends RTK’s `createSlice` and wires sagas + cancellation.
- Action wrapper with optional `namespace`: `src/redux/utils/createSlice.js:6-25`, type for cancel with token: `:4`
- Default reducers added: `cancel` and `clear(initialState)`: `src/redux/utils/createSlice.js:187-191`
- Selectors factory injection (`getState` default): `src/redux/utils/createSlice.js:198-208`
- Saga mapping per action with cancellation via `race(take(cancel))`: `src/redux/utils/createSlice.js:219-261`

Fetching helpers
- `startFetching`/`stopFetching` set `isFetching` and maintain `_requests` counter: `src/redux/utils/index.js:9`, `src/redux/utils/index.js:19`
- `fail` helper to set `error`: `src/redux/utils/index.js:43`

## Sagas
Pattern: declare per-action saga in slice factory; utils attach watchers automatically.
- Root composition runs all slice watchers: `src/redux/modules/index.js:27-34`
- Example (Projects): list fetch flow in saga: `src/redux/modules/projects/index.js:72-96`
- Auth login flow: `src/redux/modules/users/auth.js:56-72`
- Jobs downloads with blob handling: `src/redux/modules/jobs/index.js:373-395`
- Processes create/delete with follow-up fetches and cross-module actions: `src/redux/modules/processes/index.js:178-209`, `:212-226`

Cancellation & Namespacing
- Dispatch namespaced actions via `actions.someAction(payload, namespace)`; cancel with `actions.cancel(namespace)`; utils derive `cancelType_namespace`: `src/redux/utils/createSlice.js:4`, `:236-256`

## Selectors
Selectors are generated per slice via factory with provided `getState`.
- Auth: `isAuthenticated` → `src/redux/modules/users/auth.js:81-84`
- Projects: `getProjects`, `getProject(id)` → `src/redux/modules/projects/index.js:169-177`
- Processes: `getProcessesOfProject()`, `getProcess(projectId, processId)` → `src/redux/modules/processes/index.js:360-373`
- Jobs: `getJobs()`, `getJobsByProcessId(processId)`, `getJob(id)` → `src/redux/modules/jobs/index.js:415-437`, `:430-433`
- Files: `files` list + `fileKeys[fileName]` via slice state → `src/redux/modules/files/index.js`
- Resources: `getResources()`, `getResource(id)` → `src/redux/modules/resources/index.js:151-159`

## API Client & Effects
- Backend client (Axios) with baseURL, auth header, 401 auto-logout, and per-request cancellation token: `src/middleware/backendClient.js:1-7`, `:21-41`, `:63-73`, `:88-105`, `:117-137`

## Usage
- Dispatch: `dispatch(projects.actions.fetchProjects())`
- Cancel (namespaced): `dispatch(projects.actions.cancel('projectList'))`
- Select: `useSelector(projects.selectors.getProjects)`

Status: Done
