# 08. Shared Components Reference

Reusable UI primitives under `src/shared/components`. Below are key components with code refs and typical usage.

## Data Display
- `Table`: flexible data table (react-table + MUI)
  - Entry: `src/shared/components/Table/index.jsx:53`
  - Helpers: filters/headers, pagination, selection: `src/shared/components/Table/index.jsx:97-107`, `:113-127`, `:480`, `:649`, `:688-698`
- `Typography`: MUI typography re-export
  - Entry: `src/shared/components/Typography/index.jsx:1-3`
- `NoData`: empty-state placeholder component
  - Entry: `src/shared/components/NoData/index.jsx:1`

## Feedback
- `LoadingOverlay`: overlay spinner for async states
  - Entry: `src/shared/components/LoadingOverlay/index.jsx:24-45`
- `Message`: inline message
  - Entry: `src/shared/components/Message/index.jsx:4-25`
- `Progress`: progress indicators wrapper
  - Entry: `src/shared/components/Progress/index.jsx:1`

## Surfaces & Modals
- `Modal`: styled MUI Modal with header/body/footer exports
  - Entry: `src/shared/components/Modal/index.jsx:10-25`
  - Subcomponents: `Body`, `Header`, `Footer` under `src/shared/components/Modal/components/*`
- `ConfirmModal`: confirm dialog w/ callbacks and customizable text
  - Entry: `src/shared/components/ConfirmModal/index.jsx:129-132` (exports), `:104-127` (propTypes/defaults)
- `Paper`: styled `Paper` wrapper
  - Entry: `src/shared/components/Paper/index.jsx:1`

## Navigation
- `Tabs` and `TabPanel`: MUI Tabs with scroll styling
  - Entry: `src/shared/components/Tabs/index.jsx:38-43`, `:10-31`
- `Link`: link wrapper
  - Entry: `src/shared/components/Link/index.jsx:1`
- `PrivateRoute`: auth-guarded route using auth selector
  - Entry: `src/shared/components/PrivateRoute/index.jsx:7-15`, `:27-33`

## Inputs & Forms
- `Form` toolkit: react-final-form wiring + controls registry
  - Entry: `src/shared/components/Form/index.jsx:56-66`
  - Controls registry (TextField, NumberField, Select*, TransferList, ImagePicker): `src/shared/components/Form/index.jsx:35-54`
  - Helpers: `FormRenderer`, `WhenFieldChanges`, `WhenValueChanges`: `src/shared/components/Form/index.jsx:59-61`
- `Select`: styled MUI Select with `Option`, `Group`
  - Entry: `src/shared/components/Select/index.jsx:17-21`
- Domain selects (jobs, files, enums, grids)
  - Jobs in process: `src/shared/components/SelectJobsInProcess/index.jsx:19-33`, `:113-149`
  - Jobs: `src/shared/components/SelectJobs/index.jsx:17-27`, `:97-133`
  - Files: `src/shared/components/SelectFile/index.jsx:1`
  - Enum: `src/shared/components/SelectEnum/index.jsx:9-16`, `:55-86`
  - Grid: `src/shared/components/SelectGrid/index.jsx:27-36`
- Other inputs
  - `Slider`: styled MUI Slider: `src/shared/components/Slider/index.jsx:4`
  - `Checkbox`, `Button`, `ButtonGroup`: component wrappers: `src/shared/components/Checkbox/index.jsx:1`, `src/shared/components/Button/index.jsx:1`, `src/shared/components/ButtonGroup/index.jsx:4-10`

## Media & Visualization
- `ImageViewer`: image viewer with controls (fullscreen/reset-zoom)
  - Controls: `src/shared/components/ImageViewer/components/FullscreenControl.jsx:16-24`, `:33-44`, `:50`; `src/shared/components/ImageViewer/components/ResetZoomControl.jsx:27-39`, `:55`
- `ImagePicker`: gallery selection widget
  - Entry: `src/shared/components/ImagePicker/index.jsx:26-34`, `:177-202`
- `ThumbnailsViewer`: grid list with thumbnails and titles
  - Entry: `src/shared/components/ThumbnailsViewer/index.jsx:66-73`, `:120`

## Lists & Transfers
- `TransferList`, `SingleTransferList`, `FilesTransferList`
  - Entries: `src/shared/components/TransferList/index.jsx:1`, `src/shared/components/SingleTransferList/index.jsx:1`, `src/shared/components/FilesTransferList/index.jsx:1`
- `List`, `MenuList`
  - Entries: `src/shared/components/List/index.jsx:1`, `src/shared/components/MenuList/index.jsx:1`

## Utilities & Layout
- `ScrollBar` mixin and container
  - Entry: `src/shared/components/ScrollBar/index.jsx:1`
- `BlocksScroll`: horizontal scrolling blocks
  - Entry: `src/shared/components/BlocksScroll/index.jsx:9-17`, `:93-111`
- `Portal`, `Popper`, `Grow`
  - Entries: `src/shared/components/Portal/index.jsx:1`, `src/shared/components/Popper/index.jsx:1`, `src/shared/components/Grow/index.jsx:4`
- `Accordion`, `Paper`
  - Entries: `src/shared/components/Accordion/index.jsx:1`, `src/shared/components/Paper/index.jsx:1`

## Usage Notes
- All components are styled-components + MUI v4 compatible; keep providers as in `src/components/App/index.jsx:27-37`.
- Table: pass `columns` and `data`; enables grouping, filters, selection; see propTypes/defaults for API: `src/shared/components/Table/index.jsx:480`, `:649`, `:688-698`.
- Forms: use `FormRenderer` with controls listed in registry; domain selects integrate with Redux data.

Status: Done
