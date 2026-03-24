# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Maphop is a local-first, privacy-first PWA map viewer built with Vite. Source files live in `src/`.

## Commands

- `npm run dev` — start Vite dev server (serves at `/mymap/`)
- `npm run build` — production build to `dist/`
- `npm run preview` — preview the production build

## Architecture

The entire app lives in three files under `src/`:

- **`index.html`** — app shell with semantic markup for the map container, control menu (location toggle, favorites, base map selector), and status toast.
- **`mymap.js`** — single ES module that owns all state and behavior: map initialization (MapLibre GL JS), base map switching, geolocation tracking, favorites CRUD via IndexedDB, service worker registration, and event wiring.
- **`mymap.css`** — mobile-first glass-panel UI using CSS custom properties defined in `:root`. Imports `maplibre-gl` stylesheet.

Supporting files:
- `tiles.json` — reference catalog of tile providers, **not used at runtime**. The live app uses `baseMapConfigs` in `mymap.js`.
- `temp.js` — legacy/imported reference code, not part of the app flow. Avoid editing unless explicitly asked.
- `manifest.webmanifest` — PWA manifest scoped to `/mymap/`.

## Key Conventions

- **Code style**: ES modules, `const` by default, camelCase, 4-space indentation, small helper functions.
- **DOM lookups** go near the top of `mymap.js`; event listeners are wired near the bottom.
- **`baseMapConfigs`** in `mymap.js` is the source of truth for selectable base maps. When adding a map source, also add a matching `data-layer-key` button in `index.html`.
- **Location overlay** uses a single GeoJSON source (`user-location`) with three layers: `accuracy` (fill), `heading` (fill), `point` (circle). Preserve this model when modifying geolocation.
- **Favorites** are stored in IndexedDB (`personal-map-db` / `favoriteLocations`). Keep everything local — no server dependencies.
- **Deployment path** is hard-coded as `/mymap/` in service worker registration and manifest. Update all references together when changing this.
- **`setBaseLayer()` fallback**: on style load failure, it reverts to the previous base layer. Preserve this behavior.
- **Privacy**: geolocation is opt-in; location data stays on-device. The privacy note in the menu about tile providers inferring location should be preserved.

## External Dependencies

- **MapLibre GL JS** (`maplibre-gl`) — imported as an ES module in `mymap.js`, stylesheet imported in `mymap.css`.
- **Tile providers** — third-party endpoints configured in `baseMapConfigs`. Changes affect privacy, reliability, and attribution.
- **Browser APIs**: Geolocation, IndexedDB, Service Worker, Page Visibility/Lifecycle.
