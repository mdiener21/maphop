# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Maphop is a local-first, privacy-first PWA map viewer built with Vite. Source files live in `src/`.

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — preview the production build

## Architecture

The app is now split across page entrypoints and small support modules under `src/`:

- **`index.html`** — live map shell with the control menu, map container, and status toast.
- **`settings.html`** — settings page for favorites backup and future map-source configuration.
- **`impressum.html`** — legal/privacy page.
- **`js/maphop.js`** — main map page logic: map initialization, base map switching, favorites UI, service worker registration.
- **`js/location-tracker.js`** — geolocation tracking, geo-math helpers, and overlay rendering.
- **`js/favorite-store.js`** — IndexedDB access for favorites.
- **`js/favorite-transfer.js`** — import/export validation and transfer helpers.
- **`js/page-shell.js`** — shared page title and version-label wiring.

Supporting files:
- `js/tiles.json` — reference catalog of tile providers, **not used at runtime**. The live app uses `baseMapConfigs` in `js/maphop.js`.
- `js/temp.js` — legacy/imported reference code, not part of the app flow. Avoid editing unless explicitly asked.
- `manifest.webmanifest` — PWA manifest scoped to `/`.

## Workflow

- **Always update `CHANGELOG.md`** after making changes. Add entries under `[Unreleased]` using Keep a Changelog categories (Added, Changed, Fixed, Removed).
- **Update `doc/spec/product-spec.md` whenever shipped behavior, architecture, user flows, or constraints change.** Keep the product spec and changelog in sync for those changes.

## Key Conventions

- **Code style**: ES modules, `const` by default, camelCase, 4-space indentation, small helper functions.
- **DOM lookups** go near the top of each module; event listeners are wired near the bottom.
- **`baseMapConfigs`** in `js/maphop.js` is the source of truth for selectable base maps. When adding a map source, also add a matching `data-layer-key` button in `index.html`.
- **Location overlay** uses a single GeoJSON source (`user-location`) with three layers: `accuracy` (fill), `heading` (fill), `point` (circle). Preserve this model when modifying geolocation.
- **Favorites** are stored in IndexedDB (`personal-map-db` / `favoriteLocations`). Keep everything local — no server dependencies.
- **Deployment path** is currently `/` in Vite config and the manifest. Update those references together if that changes.
- **`setBaseLayer()` fallback**: on style load failure, it reverts to the previous base layer. Preserve this behavior.
- **Privacy**: geolocation is opt-in; location data stays on-device. The privacy note in the menu about tile providers inferring location should be preserved.

## External Dependencies

- **MapLibre GL JS** (`maplibre-gl`) — imported as an ES module in `js/maphop.js`, stylesheet imported in `css/maphop.css`.
- **Tile providers** — third-party endpoints configured in `baseMapConfigs`. Changes affect privacy, reliability, and attribution.
- **Browser APIs**: Geolocation, IndexedDB, Service Worker, Page Visibility/Lifecycle.
