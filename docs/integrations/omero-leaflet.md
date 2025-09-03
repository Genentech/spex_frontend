# 22. OMERO + Leaflet Integration

How OMERO imagery is integrated with Leaflet for interactive visualization and ROI selection.

Endpoints & Data
- Thumbnails: `/omero/webclient/get_thumbnails/?id=...` → `src/redux/modules/omero/index.js:164-176`
- Image details (meta/size/channels): `/omero/iviewer/image_data/:id` → `src/redux/modules/omero/index.js:180-214`
- OMERO web URL: `/omero/omero_web` → `src/redux/modules/omero/index.js:196-216`
- Tile render API (used by Leaflet layer): `/omero/webgateway/render_image_region/{id}/...`

Leaflet Composition
- Viewer: `src/shared/components/ImageViewer/index.jsx:1-120,200-270,286-352`
- Custom tile layer `L.TileLayer.Omero`:
  - Creation and options (channels, maxZoom, tile sizing): `src/shared/components/ImageViewer/components/OmeroLayer.jsx:1-92,102-164`
  - URL templating with `c=` for channel states: `src/shared/components/ImageViewer/components/OmeroLayer.jsx:126-135`
  - Tile region math and quality: `src/shared/components/ImageViewer/components/OmeroLayer.jsx:137-171`
  - Fit/set bounds, min/max zoom handling: `src/shared/components/ImageViewer/components/OmeroLayer.jsx:173-218,220-260`
  - React binding with `useMap` + debounce update: `src/shared/components/ImageViewer/components/OmeroLayer.jsx:262-326`

Channels & Windows
- Channels UI + ranges with `Slider` and checkboxes: `src/shared/components/ImageViewer/index.jsx:62-111,322-363`
- Channels string passed to tile layer: `1|start:end$COLOR` (negative index disables) → composed in `OmeroLayer`.

ROI/Selection & Overlays
- Rectangle selection with `react-leaflet-draw` (`EditControl`): `src/shared/components/ImageViewer/index.jsx:308-347,360-384`
- Region conversion from latLng → image coords using CRS.Simple: `src/shared/components/ImageViewer/index.jsx:84-120`
- Centroids overlay (per-channel metrics) with scaled radii: `src/shared/components/ImageViewer/index.jsx:200-236`

Usage Across App
- Process block forms (select images/channels): `src/components/Project/Process/components/BlockSettingsForm.jsx:35-61,165-232,234-272`
- Results viewer (thumbnails/details prefetch): `src/components/Project/Process/index.jsx:232-260,268-294`

Notes
- CRS.Simple allows pixel-perfect mapping between image and map coordinates.
- Keep channel state the single source of truth (React state → `OmeroLayer` options).

