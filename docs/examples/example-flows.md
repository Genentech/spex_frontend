# 09. Example Flows with Code Links

Concrete, code-linked walkthroughs for common journeys. Routes reflect `PathNames` and `PrivateRoutes`, with pointers to components and sagas that handle each step.

## A) Projects → Processes → Results

1) Open Projects
- Route: `/` or `/projects` → `ProjectFiles`.
- Definitions: `src/routes/PrivateRoutes.jsx:31`, `src/routes/PrivateRoutes.jsx:39`, `src/components/ProjectFiles.js:1`.

2) Enter Project
- Route: `/projects/:projectId` → `Project` container with sidebar (Resources, Analysis, Results).
- Definitions: `src/routes/PrivateRoutes.jsx:48`, `src/components/Project/index.jsx:1`.
- Path constants: `src/models/PathNames.js:1`.

3) Go to Processes (Analysis)
- Route: `/projects/:projectId/processes` → `components/Project/Processes` (list + CRUD).
- Definitions: `src/routes/PrivateRoutes.jsx:52`, `src/components/Project/Processes/index.jsx:1`.
- Fetch list: `processes.actions.fetchProcesses(projectId)` → `src/components/Project/Processes/index.jsx:220`, saga `src/redux/modules/processes/index.js:144`.
- Create/Update/Delete: `src/components/Project/Processes/index.jsx:88-122,172-207`, sagas `src/redux/modules/processes/index.js:214,236,257`.

4) Open a Process
- Route: `/projects/:projectId/processes/:processId` (tabs and review supported).
- Definitions: `src/routes/PrivateRoutes.jsx:53-55`, `src/components/Project/index.jsx:112-140`.
- Process graph view: `src/components/Project/Process/index.jsx:1`.
- Load process + jobs: `jobs.actions.fetchJobsByProcessId(processId)` → `src/components/Project/Process/index.jsx:437,793`, saga `src/redux/modules/jobs/index.js:262`.

5) Configure Blocks and Start
- Select block: click node in React Flow → `onBlockClick` sets `selectedBlock`.
  - Handler: `src/components/Project/Process/index.jsx:450-522`.
- Configure and submit:
  - New link or job: `processes.actions.createConn` / `processes.actions.createJob`.
  - Existing job update: `processes.actions.updateJob`.
  - Handlers: `src/components/Project/Process/index.jsx:393-413`.
  - Sagas (create/update/link): `src/redux/modules/processes/index.js:282,304,210`.
- Start process execution:
  - UI Control: `Start ▶` control button → `onStartProcess`.
  - UI: `src/components/Project/Process/index.jsx:886-896,728-740`.
  - Saga: `jobs.actions.startProcess(processId)` → `src/redux/modules/jobs/index.js:286`.

6) Review Results
- Route: `/projects/:projectId/results` or process review tabs `/projects/:projectId/processes/:processId/review/:tab`.
- Definitions: `src/routes/PrivateRoutes.jsx:56`, `src/components/Project/index.jsx:169-176`.
- Results UI (Vitessce, tabs, tables): `src/components/Project/Results/index.jsx:1`.
- Load process for visualization: `processes.actions.fetchProcessesForVis` → `src/components/Project/Results/index.jsx:214-221`, saga `src/redux/modules/processes/index.js:186`.
- Variable names, clusters, and panel data: `tasks.actions.getVarNames`, `tasks.actions.checkTaskData`, `tasks.actions.deleteTaskData`, `tasks.actions.saveZarrData` used in `src/components/Project/Results/index.jsx:306-351,493-523`.
- Open review tab in new window: `src/components/Project/Results/index.jsx:516-523`.

7) Download Outputs
- From Process view, download job output (e.g., AnnData): `jobs.actions.downloadJob({ jobId, fileName })`.
- UI: `src/components/Project/Process/index.jsx:512-523`.
- Saga: `src/redux/modules/jobs/index.js:520-556`.

OMERO Integration (images/thumbnails)
- Fetch thumbnails/details (Project/Process and Results):
  - `omero.actions.fetchImagesThumbnails(ids)` → `src/redux/modules/omero/index.js:164-176`.
  - `omero.actions.fetchImagesDetails(ids)` → `src/redux/modules/omero/index.js:180-192`.
  - Usage in Process: `src/components/Project/Process/index.jsx:232-260,268-294`.
  - Usage in Results: `src/components/Project/Results/index.jsx:46-75,200-223`.

## B) Files Management (Global or In-Project)

1) Navigate to Files
- Global: `/files` → `components/Files`.
- In project context (filtered to project files) when under `/projects/:projectId/*`.
- Definitions: `src/routes/PrivateRoutes.jsx:43`, component `src/components/Files/index.jsx:1`.

2) Upload
- UI: file picker triggers `files.actions.uploadFile(file)`.
- Handler: `src/components/Files/index.jsx:31-40`.
- Saga: `src/redux/modules/files/index.js:84-116`.

3) Check File
- UI: “Check” button → `files.actions.checkFile(file)`.
- Handler: `src/components/Files/index.jsx:117-124`.
- Saga: `src/redux/modules/files/index.js:64-82`.

4) Delete
- UI: “Delete” button opens confirm modal; submit dispatches `files.actions.deleteFile(file)`.
- Handlers: `src/components/Files/index.jsx:43-61,179-189`.
- Saga: `src/redux/modules/files/index.js:118-147`.

## Route Reference
- Router entry: `src/routes/index.jsx:10-14`.
- Private routes: `src/routes/PrivateRoutes.jsx:21-62`.
- Path constants: `src/models/PathNames.js:1-12`.

Notes
- Cross-tab logout via Storage event: `src/routes/PrivateRoutes.jsx:17-24`.
- Sidebar navigation (Resources, Analysis, Results): `src/components/Project/index.jsx:147-176`.

