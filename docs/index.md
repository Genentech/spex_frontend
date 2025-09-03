# 01. Overview & Environment

SPEX Frontend is a React 17 app using Material‑UI v4, Redux with redux‑saga, and React Router v5. This quick start covers prerequisites and local run.

Prerequisites
- Node.js 16.9.x
- yarn or npm
- Backend URL via `REACT_APP_BACKEND_URL_ROOT`

Quick start
```
yarn install
yarn start
```

Build
```
NODE_OPTIONS="--max-old-space-size=4096" yarn build
```

References
- Entry: `src/index.js`
- App providers: `src/components/App/index.jsx`
- Store: `src/redux/index.js`
- Router: `src/routes/index.jsx`
