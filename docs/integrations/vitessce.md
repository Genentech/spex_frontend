# 23. Vitessce Integration

Embedding Vitessce to visualize task results with Zarr-backed data.

Where it’s used
- Results page renders `<Vitessce config={...}>` per selected task/tab:
  - `src/components/Project/Results/index.jsx:691-729`

Fetching configs
- Saga `fetchTaskVitessce(id)` calls `/tasks/vitessce/:id`:
  - `src/redux/modules/tasks/index.js:291-299`
- Response is normalized to backend URL root with `replaceURLRootInObject`:
  - `src/redux/modules/tasks/index.js:18-38`
- Selectors to access single/all configs:
  - `src/redux/modules/tasks/index.js:625-641`

Zarr Variables & Clusters
- Load available varNames for a process/task: `getVarNames` saga → `/tasks/zarr_structure/:id`:
  - `src/redux/modules/tasks/index.js:652-672`
- Save selected channels/cluster labels: `saveZarrData` saga:
  - `src/redux/modules/tasks/index.js:674-700`

UI Hooks
- Results page persists selected tabs/channels and re-renders Vitessce grids:
  - `src/components/Project/Results/index.jsx:306-351,493-523,613-729`

Notes
- Ensure `REACT_APP_BACKEND_URL_ROOT` is set correctly so all asset URLs in the Vitessce config resolve after normalization.
- Clear caches or add a `?disableCache=...` suffix when debugging stale Vitessce assets.

