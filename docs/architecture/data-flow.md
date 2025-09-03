# 21. Data Flow (Projects → Processes → Jobs → Tasks)

This outlines the lifecycle of the core domain entities and how UI, reducers, and sagas interact.

Entities
- Projects → contain Processes; Projects reference OMERO images via `omeroIds` and file_names.
- Processes → pipeline graphs (jobs tree) attached to a Project.
- Jobs → executable steps with `tasks` and params.
- Tasks → results and visualizations (Vitessce / images / metrics).

Fetch & Navigate
- Projects list/detail:
  - Saga: `src/redux/modules/projects/index.js:72-108`
  - UI entry: `src/components/ProjectFiles.js:1-27`
- Processes for a project:
  - Sagas: `src/redux/modules/processes/index.js:144-176,178-206`
  - UI list: `src/components/Project/Processes/index.jsx:1-120,216-247`
- Open process → graph:
  - Jobs by process: `src/redux/modules/jobs/index.js:240-259`
  - Graph creation: `src/components/Project/Process/index.jsx:80-170,842-908`

Create/Link/Update/Delete
- Create process / update / delete:
  - `src/redux/modules/processes/index.js:214-236,236-258,260-279`
- Create job + link into process tree:
  - `src/redux/modules/processes/index.js:282-318`
- Link existing job (createConn):
  - `src/redux/modules/processes/index.js:220-246`
- Update/delete job:
  - `src/redux/modules/processes/index.js:320-358,360-385`

Run/Restart/Refresh
- Start all jobs for a process: `jobs.actions.startProcess(processId)`
  - Saga: `src/redux/modules/jobs/index.js:286-309`
- Refresh jobs + re-fetch process for graph consistency:
  - `src/redux/modules/jobs/index.js:246-259,250-257`
  - UI refresh: `src/components/Project/Process/index.jsx:792-808`

Results & Visualizations
- Results page loads process for visualization + tasks derived data:
  - `src/components/Project/Results/index.jsx:200-223,388-391`
- Vitessce configs per task:
  - Sagas/Selectors: `src/redux/modules/tasks/index.js:291-299,625-641`
- Zarr structure/cluster labels:
  - `src/redux/modules/tasks/index.js:652-700`

Files & OMERO
- Files (project or global): `src/components/Files/index.jsx:1-200`
- OMERO images for a project:
  - Sagas: `src/redux/modules/omero/index.js:164-197`
  - Used in Process forms & Results image overlays.

Notes
- Use selectors for derived/memoized access.
- Keep UI stateless where possible; derive from Redux.

