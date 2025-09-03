# 25. Extensibility Guide

Guidelines for adding new blocks, visualizations, or integrations while staying consistent with project patterns.

Add a new Job/Block type
- Backend exposes a new script in `jobs` types; frontend maps it via:
  - Fetch job types: `src/redux/modules/jobs/index.js:120-170`
  - `params_meta` becomes form fields in `BlockSettingsForm`: `src/components/Project/Process/components/BlockSettingsForm.jsx:140-193`
- Tips:
  - Use `type: 'enum'|'int'|'string'|'omero'|'file'|'channels'|'dataGrid'` to get the right control.
  - Prefer derived selectors to pass options (files, images, channels).

Add a new visualization
- For Process graph: add a display node type in `nodeTypes` if needed.
- For Results: create a selector and embed a React component (e.g., Vitessce) with normalized config.
- Keep heavy work in sagas; pass clean props to components.

Integrate a new backend endpoint
- Create a feature slice (`createSlice`) with `startFetching/stopFetching` and `requestFail`.
- Add sagas under `sagas: (actions) => ({ [actions.fetchX]: { * saga() {} } })`.
- Export `actions` and `selectors`; register the slice in `rootSlices`.

Leaflet/OMERO patterns
- Extend `OmeroLayer` or add a parallel custom tile layer.
- Keep channel state controlled by React and passed via `options`.
- Use CRS.Simple for pixel mapping and convert ROI to image coords.

Vitessce patterns
- Normalize URLs via `replaceURLRootInObject` so configs are portable.
- Cache configs in Redux (`vt_config`) and re-use by `taskId` selector.

Testing/Diagnostics
- Prefer UI smoke checks by navigating deep links (see routing docs) and verifying selectors return expected shapes.
- Use Troubleshooting section for common issues (auth, CORS, memory, caches).

