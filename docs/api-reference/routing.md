# 05. Routing Map & Deep Links

This reference outlines the frontend routing structure, public vs private routes, and deep-link patterns.

## Public
- `/login` → Login page
  - Defined in `src/routes/index.jsx:11`

## Private Shell
- Wrapper: `PrivateRoute` renders `PrivateRoutes` inside `Layout`.
  - `src/routes/index.jsx:13`, `src/routes/PrivateRoutes.jsx:21`, `src/components/Layout/index.jsx:1`

## Top-Level Private Routes
- `/` → Projects + Files overview → `ProjectFiles`
- `/projects` → Projects + Files overview → `ProjectFiles`
- `/files` → Global Files view
  - Definitions: `src/routes/PrivateRoutes.jsx:31-45`

## Project Routes (under `/projects/:projectId`)
- Base: `/projects/:projectId` → Project context wrapper (`Project`)
- Resources: `/projects/:projectId/resources`
- Pipelines: `/projects/:projectId/pipelines`
- Pipeline (selected): `/projects/:projectId/pipelines/:id`
- Processes: `/projects/:projectId/processes`
- Process (selected): `/projects/:projectId/processes/:processId`
- Process tab: `/projects/:projectId/processes/:processId/:tabName`
- Process review tab: `/projects/:projectId/processes/:processId/review/:tabReview`
- Results: `/projects/:projectId/results`
  - Definitions: `src/routes/PrivateRoutes.jsx:49-57`
  - Consumption: `src/components/Project/index.jsx:99-176`

## Path Constants
- Defined in `src/models/PathNames.js`
  - `projects`, `resources`, `pipelines`, `processes`, `results`, `files`, etc.

## Navigation Helpers
- Header selectors (project/process) push history updates
  - `src/components/Layout/index.jsx:93,103,106`
- Sidebar navigation (Resources, Analysis, Results)
  - `src/components/Project/index.jsx:147-176`

## Deep-Link Examples
- Open project: `/projects/123`
- Open process: `/projects/123/processes/456`
- Open process “plot” tab: `/projects/123/processes/456/plot`
- Open review “metrics”: `/projects/123/processes/456/review/metrics`
- Results view: `/projects/123/results`

## Auth & Session Notes
- Cross-tab logout via Storage event in `PrivateRoutes`
  - `src/routes/PrivateRoutes.jsx:17-24`

