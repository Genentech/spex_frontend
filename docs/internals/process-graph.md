# 24. Process Graph & Block Linking

How the pipeline graph is built, rendered, and mutated when blocks/jobs are added, linked, or updated.

Graph Model
- Processes contain nested `jobs` each with `id`, `status`, `tasks`, and child `jobs`.
- UI graph elements are created from this tree:
  - `createElements`: `src/components/Project/Process/index.jsx:92-146`
  - Layout (dagre): `src/components/Project/Process/index.jsx:148-190`

Rendering & Controls
- React Flow setup and controls (Start/Refresh):
  - `src/components/Project/Process/index.jsx:880-908`
- Selection/click behavior and job detail resolution:
  - `onBlockClick`: `src/components/Project/Process/index.jsx:440-522`
- Add‑next flow (phantom node) when selecting a block to append:
  - `updateElements` + `parentIdForFlow`: `src/components/Project/Process/index.jsx:740-782`

Mutations (Sagas)
- Create process / update / delete:
  - `src/redux/modules/processes/index.js:214-236,236-258,260-279`
- Create job and link under parent/root:
  - `src/redux/modules/processes/index.js:294-318`
- Link an existing job to process path:
  - `src/redux/modules/processes/index.js:282-294`
- Update/delete job and refresh tree:
  - `src/redux/modules/processes/index.js:320-358,360-385`
- Start/refresh job statuses:
  - `src/redux/modules/jobs/index.js:286-309,240-259`

Download & Inspect
- Download job outputs: `src/redux/modules/jobs/index.js:520-556`
- Task inspection/Info modal wiring in Process view.

Notes
- Keep graph read‑only for layout (no drag/connect) to reflect backend state accurately.
- Always refresh jobs and process after mutations to keep UI in sync.

