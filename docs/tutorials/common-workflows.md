# 04. Common Workflows

End-to-end walkthroughs for creating a project, launching analysis (pipeline), and reviewing results. Each step includes route patterns and code references.

## 1) Create a Project
- Go to `/` or `/projects` → Projects panel is visible alongside Files.
- Click “Add Project”, fill Name and Description, submit.
- Creates via `projectsActions.createProject` → `src/components/Projects/index.jsx:38-45,62-73`
- Open project by clicking its Name link → navigates to `/projects/:projectId`.

Refs:
- Projects panel → `src/components/ProjectFiles.js:6-14`
- Create/Update/Delete flows → `src/redux/modules/projects/index.js:25-84`

## 2) Upload Files (optional)
- On the same page, use the file picker to upload data.
- Upload triggers `filesActions.uploadFile(file)`; Files list shows project-related files when inside a project route.

Refs:
- Files UI → `src/components/Files/index.jsx:1`
- Upload/Delete/Check actions → `src/components/Files/index.jsx:31-40,43-61,97-127`

## 3) Open Analysis (Pipelines/Processes)
- Navigate to the project: `/projects/:projectId`.
- Click sidebar “Analysis” to go to `/projects/:projectId/processes`.
- Select a process from the header selector to navigate to `/projects/:projectId/processes/:processId`.

Refs:
- Sidebar nav → `src/components/Project/index.jsx:147-176`
- Header selectors drive `history.push(...)` → `src/components/Layout/index.jsx:93,103,106`
- Route mapping for processes → `src/routes/PrivateRoutes.jsx:49-57`

## 4) Configure And Start Pipeline
- In the Process view, the graph renders jobs. Configure block settings as needed.
- Click “Start ▶” to enqueue/trigger execution for the current process.
- This dispatches `jobsActions.startProcess(processId)` which updates jobs and refreshes the pipeline.

Refs:
- Start button handler → `src/components/Project/Process/index.jsx:739-747,892-905`
- Saga for start → `src/redux/modules/jobs/index.js:262-287`

Deep links:
- Base: `/projects/:projectId/processes/:processId`
- With tab: `/projects/:projectId/processes/:processId/:tabName`
- Review tab: `/projects/:projectId/processes/:processId/review/:tabReview`

## 5) Review Results
- From sidebar, click “Results” → `/projects/:projectId/results`.
- The Results view shows pipeline graph and allows exploring outputs, including Vitessce visualization for supported tasks.
- Task selection and variable channels load via tasks selectors/actions.

Refs:
- Results route mapping → `src/routes/PrivateRoutes.jsx:56`
- Results component → `src/components/Project/Results/index.jsx:1`
- Vitessce/task loading hooks → `src/components/Project/Results/index.jsx:86-121,149-170`

## 6) Download Outputs (when available)
- Some jobs expose downloads (e.g., AnnData). Downloads are handled via `jobsActions.downloadJob`.

Refs:
- Download saga → `src/redux/modules/jobs/index.js:382-416`

## Notes & Tips
- Path names constants → `src/models/PathNames.js`
- Cross-tab auth logout → `src/routes/PrivateRoutes.jsx:17-24`
- Use “Refresh” on the Process view if job statuses lag.

