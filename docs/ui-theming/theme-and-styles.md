## 12. Theme & Global Styles

MUI v4 theming with styled-components. The app currently uses the light theme by default.

## Providers
- Order matters to ensure MUI styles inject first:
  - `StylesProvider` → `MuiThemeProvider` → styled `ThemeProvider` → `CssBaseline`.
  - Ref: `src/components/App/index.jsx:10-34`.

## Theme Factory
- Theme builder returns MUI theme and GlobalStyle:
  - `getTheme(name)` wraps `createMuiTheme` and exports `GlobalStyle`.
  - Ref: `src/themes/index.js:1-5,14-49,51-60`.
- Available themes are registered via `addTheme`.
  - Registered: `light`, `dark`.

## Light/Dark Definitions
- Light extends dark overrides:
  - `src/themes/light.js:1-16`.
- Dark theme base palette:
  - `src/themes/dark.js:1-16`.

## Global Styles
- Global CSS via styled-components affects base layout, fonts, cursors, and some MUI items.
- Notable: `overflow: hidden` on body; disables scroll on root content.
  - Ref: `src/themes/index.js:18-49`.

## Switching Themes
- Default is `getTheme('light')` in `App`.
- To add a toggle:
  - Store setting in Redux or localStorage.
  - Call `getTheme('dark')` when toggled and pass to providers.
  - Ref entry: `src/components/App/index.jsx:26`.

## Typography
- Roboto loaded via `typeface-roboto`.
- Ensure fonts are available for production builds.
