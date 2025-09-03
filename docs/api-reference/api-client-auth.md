# 07. API Client & Auth

Axios client configuration, auth flow, token storage, and request cancellation.

## API Client
- Base URL from env: `src/middleware/backendClient.js:63-73`
- 401 auto-logout handler via `configureBackendClient(cb)`: `src/middleware/backendClient.js:91-99`; configured in `src/components/App/index.jsx:17-19`
- Auth header injection from storage: `src/middleware/backendClient.js:112-120`
- Interceptor maps backend errors and triggers logout: `src/middleware/backendClient.js:21-41`, `:125`
- Per-request cancellation wired to redux-saga `CANCEL`: `src/middleware/backendClient.js:1-3`, `:75-87`, `:106-137`

HTTP methods (with cancellation)
- Wrapped: `request/get/delete/head/options/put/post/patch` → see: `src/middleware/backendClient.js:106-137`

Usage
- Create instance in slices: `api = backendClient()` e.g. `src/redux/modules/projects/index.js:18-21`
- Cancel pending request from saga by dispatching `CANCEL`: automatically supported via axios cancel tokens.

## Auth Module
- Slice: `src/redux/modules/users/auth.js:22-54`
- Login saga (POST `/users/login`): `src/redux/modules/users/auth.js:56-72`
- Persist token in storage and set `isAuthenticated`: `src/redux/modules/users/auth.js:38-45`
- Selectors: `isAuthenticated`, `isFetching`: `src/redux/modules/users/auth.js:75-84`

Logout Triggers
- Manual: dispatch `auth.actions.logout()` (e.g., header action) `src/components/Layout/index.jsx:114`
- Auto on 401: configured in `App` via `configureBackendClient` → `src/components/App/index.jsx:17-19`
- Cross-tab: `PrivateRoutes` listens for token removal: `src/routes/PrivateRoutes.jsx:18-23`

## Token Storage
- Proxy over `localStorage/sessionStorage` with cross-tab sync: `src/shared/utils/storage.js:68-82`, `:84-100`, `:102-141`, `:171-179`, `:193-195`
- Access via `storage.access_token` (getter caches for 60s): `src/shared/utils/storage.js:84-100`, `:112-114`
- Clearing creds on login start/logout: `src/redux/modules/users/auth.js:29-36`

## Integration Points
- Provider wiring (Redux + Router + Theme): `src/components/App/index.jsx:25-39`
- Guarded routes check auth selector: `src/shared/components/PrivateRoute/index.jsx:9`
- Root saga/reducer assembly: `src/redux/modules/index.js:16-24`, `src/redux/modules/index.js:27-34`, `src/redux/reducers.js:5-7`

## Examples
- Login: `dispatch(auth.actions.login({ username, password }))` → token saved on success
- Auto-logout: backend responds 401 → interceptor calls configured callback → dispatches `logout`
- Using API client in a saga: `api = backendClient(); const { data } = yield call(api.get, url)`

Status: Done
