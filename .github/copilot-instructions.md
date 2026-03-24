# Project Guidelines

## Code Style
- This is a small browser-first JavaScript app with a single main module in [src/mymap.js](src/mymap.js).
- Follow the existing style in [src/mymap.js](src/mymap.js): ES modules, `const` by default, camelCase names, small helper functions, and 4-space indentation.
- Keep DOM element lookups near the top of the module and wire event listeners near the bottom, matching [src/mymap.js](src/mymap.js).
- Keep UI structure in [src/index.html](src/index.html) semantic and minimal; styling lives in [src/mymap.css](src/mymap.css) with CSS custom properties in `:root`.

## Architecture
- The app is a single-page PWA map viewer: [src/index.html](src/index.html) provides the shell, [src/mymap.css](src/mymap.css) provides the mobile-first glass-panel UI, and [src/mymap.js](src/mymap.js) owns map state, storage, and browser integrations.
- `baseMapConfigs` in [src/mymap.js](src/mymap.js) is the source of truth for selectable base maps. Add new map sources there and keep button `data-layer-key` values in [src/index.html](src/index.html) aligned.
- Location display is implemented as a GeoJSON source plus three layers (`accuracy`, `heading`, `point`) in [src/mymap.js](src/mymap.js); preserve that overlay model when changing geolocation behavior.
- Favorites are stored locally in IndexedDB (`personal-map-db` / `favoriteLocations`) in [src/mymap.js](src/mymap.js). Keep favorites local-first and avoid adding server dependencies.
- `registerScopedServiceWorker()` in [src/mymap.js](src/mymap.js) assumes deployment under `/mymap/`; the same base path is hard-coded in [src/manifest.webmanifest](src/manifest.webmanifest).

## Build and Test
- No `package.json`, lockfile, Vite config, or test runner is checked in. Do not assume `npm run build` or `npm test` exists.
- No reproducible install/build/test commands are discoverable from the current workspace files.
- Treat this repository as static frontend source unless the user adds tooling or gives a local run command.

## Project Conventions
- Preserve the local-first, privacy-first intent stated in [README.md](README.md): geolocation is optional, favorites stay in IndexedDB, and status copy should stay user-facing and concise.
- Keep the production path assumptions consistent: `/mymap/` appears in service worker registration and manifest fields, so update all related references together.
- When changing map switching, preserve the fallback behavior in `setBaseLayer()` so failed styles revert to the previous base layer.
- `src/tiles.json` looks like a reference catalog of tile providers, not the active runtime config; the live app currently uses `baseMapConfigs` instead.
- `src/temp.js` appears to be legacy/imported reference code rather than part of the current app flow; avoid editing it unless the task explicitly targets that file.

## Integration Points
- External map rendering uses `maplibre-gl` from [src/mymap.js](src/mymap.js) and its bundled stylesheet via [src/mymap.css](src/mymap.css).
- Remote integrations are limited to third-party tile/style endpoints in `baseMapConfigs`; changes there can affect privacy, reliability, and attribution requirements.
- Browser APIs in active use: Geolocation, IndexedDB, Service Worker registration, and visibility/page lifecycle events.

## Security
- Treat geolocation as sensitive: keep permission requests explicit and preserve the privacy warning shown in [src/index.html](src/index.html).
- Keep favorites and current-location handling on-device unless the user explicitly asks for sync or backend features.
- Only register the service worker in secure production contexts, consistent with `registerScopedServiceWorker()` in [src/mymap.js](src/mymap.js).
