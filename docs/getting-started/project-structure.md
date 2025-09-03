# 02. Project Structure & Aliases

Layout
- `config/`: Webpack/env config and aliases
- `scripts/`: CRA ejected build/start scripts
- `public/`: HTML template and static assets
- `src/`: application source

Key source folders
- `src/components/`: feature pages and layout (`App`, `Layout`, `Login`, `Project`, `Files`)
- `src/routes/`: router setup (`index.jsx`, `PrivateRoutes.jsx`)
- `src/redux/`: store, modules (slices + sagas), utils
- `src/shared/`: shared components and utilities
- `src/themes/`: MUI themes and global styles
- `src/models/PathNames.js`: central path constants

Aliases
- Declared in `config/webpack.config.alias.js` and `local.js`:
  - `@/` → `src/`
  - `+components/` → `src/shared/components/`
  - `+utils/` → `src/shared/utils/`
  - `+hooks/` → `src/shared/hooks/`

Entrypoints
- App mount and providers: `src/components/App/index.jsx`
- Router: `src/routes/index.jsx`
- Store: `src/redux/index.js`
