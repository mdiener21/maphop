# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Maphop is a local-first, privacy-first PWA map viewer (MapLibre GL JS, built with Vite, vanilla ES modules, no framework). Vite `root` is `src/`; the build goes to `dist/`.

## Commands

- `npm run dev`: Vite dev server
- `npm run build`: production build to `dist/` (pages: `index.html`, `settings.html`, `impressum.html`)
- `npm run preview`: preview the production build
- `npm test`: Vitest unit tests (jsdom, `tests/unit/**/*.test.js`)
- `npx vitest run tests/unit/<name>.test.js`: run a single test file
- `npm run test:coverage`: unit tests with v8 coverage
- `npm run test:e2e`: Playwright browser flows (`tests/e2e/`)
- `npm run test:e2e:production`: Playwright against production (`tests/production/`, `playwright.production.config.js`)

Before calling a change done, run `npm test` and `npm run build`.

## Architecture

**`doc/architecture/code-map.md` is the module ownership index.** Read it first to find the right file, and update it whenever ownership moves.

- `src/index.html` + `src/js/maphop.js`: the map page. `maphop.js` is a **thin bootstrap**: it wires controllers together. New map features go into a new module under `src/js/map/`, not into `maphop.js`.
- `src/js/map/*`: map-page controllers built as `create*Controller({ map, maplibregl, ...deps })` factories with injected dependencies. This makes them unit-testable with fake maps. Examples: `base-map-registry.js`, `base-layer-controller.js`, `routing-controller.js`, `favorites-panel.js`, `menu-controller.js`, `terrain-controller.js`. DOM lookups for the map page are centralised in `map/dom.js`.
- `src/js/location-tracker.js`: geolocation, follow mode, and the location overlay.
- `src/js/favorite-store.js` (IndexedDB), `favorite-transfer.js` (JSON import/export), `favorite-elevation.js` (device / Open-Meteo elevation), `favorite-cloud-store.js` (optional PocketBase backup).
- `src/settings.html` + `settings.js`: favorites backup/import/export and PocketBase sign-in.
- `src/impressum.html` + `impressum.js`: the legal/privacy page. `page-shell.js` handles the shared title and version label.
- `src/public/sw.js`: the service worker. `src/mapterhorn-index.html` is a standalone experiment and is not a build input.

## Workflow

- **Spec first:** before implementing a feature or behaviour change, write the proposed update to `doc/spec/product-spec.md` and get the user's approval. Keep the spec in sync with shipped behaviour, architecture, user flows and constraints.
- **Always update `CHANGELOG.md`** under `[Unreleased]` (Keep a Changelog: Added / Changed / Fixed / Removed) after every change, without being asked.
- **Issue tracker:** GitHub Issues on `mdiener21/maphop` via `gh`. Specs become a parent issue, and tickets are sub-issues with native "blocked by" links. Label agent-ready work `ready-for-agent` (plus `enhancement` / `bug`).
- Releases follow `doc/releasing.md`.

## Key Conventions

- **Code style:** ES modules, `const` by default, camelCase, 4-space indentation, small helper functions. DOM lookups go near the top of a module; event listeners are wired near the bottom.
- **Tests:** unit-test controllers through their public factory interface with fakes (see `tests/unit/routing-controller.test.js`, `base-layer-controller.test.js`). Test observable behaviour, not internals. Pure helpers get their own focused tests.
- **Base maps:** `baseMapConfigs` in `src/js/map/base-map-registry.js` is the source of truth. When you add a source, also add a matching `data-layer-key` button in `src/index.html`, and keep provider attribution structured and DOM-rendered (never inject user-controlled HTML).
- **`setBaseLayer()` fallback** (`base-layer-controller.js`): if a style fails to load, it reverts to the previous base layer. Preserve this behaviour.
- **Style reloads drop custom sources and layers:** overlays (location, routes, favorites, terrain) must re-add themselves after a style change via their `ensureAfterStyleLoad`-style hooks.
- **Location overlay:** one GeoJSON source `user-location` with three layers (`user-location-accuracy` fill, `user-location-heading` fill, `user-location-point` circle). Preserve this model.
- **Routing:** OpenRouteService directions (`foot-hiking`, `cycling-mountain`, `foot-walking`) in `routing-controller.js`. The route is drawn as GeoJSON source `walking-route` with outline and line layers; pins are draggable MapLibre markers.
- **Favorites:** IndexedDB `personal-map-db` / `favoriteLocations` is the local source of truth. PocketBase sync is opt-in and only runs after the user signs in on the Settings page.
- **Deployment paths:** Vite uses `base: "./"`; the manifest uses `start_url` / `scope` `/`. If the deployment path changes, update them together, along with service worker registration.

## Privacy and Security

- Geolocation is opt-in, and location data stays on the device. Keep the menu's privacy note about tile providers being able to infer location.
- Routing sends route points to OpenRouteService and tile requests go to third-party providers. Treat changes to providers or endpoints as privacy-, reliability- and attribution-relevant.
- `VITE_THUNDERFOREST_API_KEY` and `VITE_OPENROUTESERVICE_API_KEY` are read from `.env` and inlined into the client bundle. They are public, referrer-restricted keys. Never commit `.env` or add secret credentials to client code.
- No new runtime dependencies without asking. Current ones: `maplibre-gl`, `pmtiles`, `pocketbase`.
