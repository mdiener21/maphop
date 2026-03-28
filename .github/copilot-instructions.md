# Project Guidelines

## Code Style
- This is a small browser-first JavaScript app centered on [src/js/maphop.js](../src/js/maphop.js) with supporting modules under [src/js](../src/js).
- Follow the existing style in [src/js/maphop.js](../src/js/maphop.js): ES modules, `const` by default, camelCase names, small helper functions, and 4-space indentation.
- Keep DOM element lookups near the top of each module and wire event listeners near the bottom, matching [src/js/maphop.js](../src/js/maphop.js) and [src/js/settings.js](../src/js/settings.js).
- Keep page structure in [src/index.html](../src/index.html), [src/settings.html](../src/settings.html), and [src/impressum.html](../src/impressum.html) semantic and minimal; styling lives in [src/css](../src/css) with CSS custom properties in `:root` where appropriate.

## Architecture
- The app is a small multi-page PWA: [src/index.html](../src/index.html) is the live map view, [src/settings.html](../src/settings.html) handles backup-oriented settings, and [src/impressum.html](../src/impressum.html) handles legal content.
- `baseMapConfigs` in [src/js/maphop.js](../src/js/maphop.js) is the source of truth for selectable base maps. Add new map sources there and keep button `data-layer-key` values in [src/index.html](../src/index.html) aligned.
- Location display is implemented as a GeoJSON source plus three layers (`accuracy`, `heading`, `point`) in [src/js/location-tracker.js](../src/js/location-tracker.js); preserve that overlay model when changing geolocation behavior.
- Favorites are stored locally in IndexedDB (`personal-map-db` / `favoriteLocations`) in [src/js/favorite-store.js](../src/js/favorite-store.js). Keep favorites local-first and avoid adding server dependencies.
- Shared cross-page shell behavior such as version labeling lives in [src/js/page-shell.js](../src/js/page-shell.js).
- The current deployment base path is `/`, reflected in [vite.config.js](../vite.config.js) and [src/manifest.webmanifest](../src/manifest.webmanifest). Update those references together if the deployment path changes.

## Build and Test
- Use `npm run dev` for local development, `npm run build` for production output, and `npm run preview` to preview the built app.
- There is no automated test runner checked in today; validate changes with `npm run build` unless the user asks for more.

## Project Conventions
- Preserve the local-first, privacy-first intent stated in [README.md](../README.md): geolocation is optional, favorites stay in IndexedDB, and status copy should stay user-facing and concise.
- Keep the production path assumptions consistent across [vite.config.js](../vite.config.js), [src/manifest.webmanifest](../src/manifest.webmanifest), and any service worker registration code.
- When changing map switching, preserve the fallback behavior in `setBaseLayer()` so failed styles revert to the previous base layer.
- Update [doc/spec/product-spec.md](../doc/spec/product-spec.md) whenever product behavior, architecture, user flows, or constraints change, and keep it aligned with [CHANGELOG.md](../CHANGELOG.md).
- [src/js/tiles.json](../src/js/tiles.json) looks like a reference catalog of tile providers, not the active runtime config; the live app currently uses `baseMapConfigs` instead.
- [src/js/temp.js](../src/js/temp.js) appears to be legacy/imported reference code rather than part of the current app flow; avoid editing it unless the task explicitly targets that file.

## Integration Points
- External map rendering uses `maplibre-gl` from [src/js/maphop.js](../src/js/maphop.js) and its bundled stylesheet via [src/css/maphop.css](../src/css/maphop.css).
- Remote integrations are limited to third-party tile/style endpoints in `baseMapConfigs`; changes there can affect privacy, reliability, and attribution requirements.
- Browser APIs in active use: Geolocation, IndexedDB, Service Worker registration, and visibility/page lifecycle events.

## Security
- Treat geolocation as sensitive: keep permission requests explicit and preserve the privacy warning shown in [src/index.html](../src/index.html).
- Keep favorites and current-location handling on-device unless the user explicitly asks for sync or backend features.
- Only register the service worker in secure production contexts, consistent with `registerScopedServiceWorker()` in [src/js/maphop.js](../src/js/maphop.js).
