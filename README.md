# SPEX Frontend

SPEX Frontend is a React 17 application using Material‑UI v4, Redux with redux‑saga, and React Router v5. It provides the web UI for SPEX to manage Projects → Processes → Jobs → Tasks, with integrations for OMERO and Vitessce. For the full guide, API reference, and architecture notes, see the documentation below.

Docs: https://genentech.github.io/spex_frontend/

## Getting Started

Download links:

SSH clone URL: ssh://git@github.com:zverozabr/spex_frontend.git

HTTPS clone URL: https://github.com/zverozabr/spex_frontend.git

in ubuntu 18.04
```
NODE_OPTIONS="--max-old-space-size=4096" yarn build
``` 
[in Apple Silicon](readme_Apple.md)

in windows
```
just install x64 version of nodejs
```

git clone https://github.com/zverozabr/spex_frontend.git .

yarn install
yarn build

```

1. Set required variables REACT_APP_BACKEND_URL_ROOT in environment variable
   .ENV
## examples:
```
REACT_APP_BACKEND_URL_ROOT=http://127.0.0.1/v1/
REACT_APP_BACKEND_URL_ROOT=/api/v1
```
start application
```
yarn start
```
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

## Documentation

- Published docs (GitHub Pages): https://genentech.github.io/spex_frontend/
  - After enabling Pages for the repo, the workflow `.github/workflows/gh-pages.yml` builds and deploys on every push to `main`/`master`.
- Local docs serve (MkDocs Material):
  - Install: `pip install mkdocs-material`
  - Serve: `mkdocs serve -a 0.0.0.0:8000`
  - Build: `mkdocs build`

Key docs:
- Overview & Structure: `docs/index.md`, `docs/getting-started/project-structure.md`
- Tutorials: `docs/tutorials/*`
- API Reference: `docs/api-reference/*`
- Examples: `docs/examples/example-flows.md`
- Reference: `docs/reference/*`
- Theming: `docs/ui-theming/theme-and-styles.md`
- Development: `docs/development/*`

## Prerequisites

What things you need to install the software and how to install them.

```
Examples
```

## Deployment

Add additional notes about how to deploy this on a production system.

## Resources

Add links to external resources for this project, such as CI server, bug tracker, etc.
