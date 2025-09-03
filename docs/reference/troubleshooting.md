## 10. Troubleshooting

Quick fixes for common issues in SPEX Frontend. Each item includes code references and commands.

## Build/Run Problems
- Node version mismatch: use Node 16.9.x (via NVM).
  - Where defined: `docs/frontend_handover.md:34`.
  - Fix: `nvm use 16 && yarn install && yarn start`.
- Out-of-memory during build (Webpack 4):
  - Symptom: JavaScript heap out of memory.
  - Fix: `NODE_OPTIONS="--max-old-space-size=4096" yarn build`.
  - Ref: `docs/frontend_handover.md:63`.

## Blank Pages or 404s
- Wrong route pattern (React Router v5):
  - Check definitions: `src/routes/index.jsx:10-14`, `src/routes/PrivateRoutes.jsx:21-62`.
  - Path constants: `src/models/PathNames.js:1-12`.
- Private area redirects to /login:
  - Auth guard: `+components/PrivateRoute`, `src/redux/modules/users/auth.js:9-20`.
  - Verify token in storage and login saga: `src/redux/modules/users/auth.js:39-64`.

## 401/CORS/API Errors
- Base URL missing or wrong:
  - Env var: `REACT_APP_BACKEND_URL_ROOT`.
  - Where loaded: `config/env.js`, `src/middleware/backendClient.js`.
  - Client config + 401 handler: `src/middleware/backendClient.js`, logout wiring in `src/components/App/index.jsx:16-23` and `src/redux/modules/projects/index.js:79-91`.
- CORS in dev: ensure backend allows origin from dev host; verify proxy or API base.

## MUI v4 + styled-components quirks
- Mixed MUI v4/v5 packages warning:
  - Theme API uses `createMuiTheme` (v4): `src/themes/index.js:1`.
  - Providers order matters: `StylesProvider` → `MuiThemeProvider` → styled `ThemeProvider`.
  - Ref: `src/components/App/index.jsx:10-34`.
- Global CSS side effects:
  - GlobalStyle sets `overflow: hidden` on body; affects scrolling.
  - Ref: `src/themes/index.js:14-49`.

## Process Graph/Jobs
- Graph not showing nodes:
  - Ensure process loaded: `processes.actions.fetchProcess` and jobs fetched: `jobs.actions.fetchJobsByProcessId`.
  - Refs: `src/components/Project/Process/index.jsx:402-413,437,739-747,886-908`.
- Start button does nothing:
  - Handler: `onStartProcess` → `jobs.actions.startProcess(processId)`.
  - Saga: `src/redux/modules/jobs/index.js:286-309`.
- Download not working:
  - Action: `jobs.actions.downloadJob`.
  - Saga triggers Blob download: `src/redux/modules/jobs/index.js:520-556`.

## Files Page
- Upload fails with generic error:
  - Error handling maps backend error: `src/redux/modules/files/index.js:101-109`.
  - Check backend accepts multipart `filenames` field.
- Files list empty:
  - Ensure `files.actions.fetchFiles()` is dispatched: `src/components/Files/index.jsx:31-40`.

## OMERO/Vitessce Views
- No thumbnails/details:
  - Thumbnails: `omero.actions.fetchImagesThumbnails` → `src/redux/modules/omero/index.js:164-176`.
  - Details: `omero.actions.fetchImagesDetails` → `src/redux/modules/omero/index.js:180-192`.
- Vitessce blank/no channels:
  - Check varNames load: `tasks.actions.getVarNames` used in `src/components/Project/Results/index.jsx:200-223,306-351`.

## Apple Silicon
- See `readme_Apple.md` for arm64-specific tips.

## Commands
- Dev: `yarn start` (ensure `REACT_APP_BACKEND_URL_ROOT` in `.env.development`).
- Build: `NODE_OPTIONS="--max-old-space-size=4096" yarn build`.
