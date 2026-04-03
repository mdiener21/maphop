# Maphop Code Map

This file is the low-context index for the codebase. Use it to find the right module before reading larger files.

## Entry Points

| Area | Entry file | Purpose |
|------|------------|---------|
| Map page | `src/js/maphop.js` | Thin bootstrap for the live map view |
| Settings page | `src/js/settings.js` | Favorites import/export page wiring |
| Legal page | `src/js/impressum.js` | Legal page interactions |
| Shared shell | `src/js/page-shell.js` | Cross-page title and version label wiring |

## Map Page Ownership

| If you need to change... | Start here |
|--------------------------|------------|
| Base map providers, labels, or attribution metadata | `src/js/map/base-map-registry.js` |
| Base map switching, rollback, or style-load timeout behavior | `src/js/map/base-layer-controller.js` |
| Terrain and hillshade lifecycle | `src/js/map/terrain-controller.js` |
| Attribution widget rendering or open/close state | `src/js/map/attribution-controller.js` |
| Menu open state or expandable sections | `src/js/map/menu-controller.js` |
| Favorites rendering, share/save/delete flows, or map navigation from favorites | `src/js/map/favorites-panel.js` |
| Shared location URL format and deep-link parsing | `src/js/map/share-location.js` |
| PWA install prompt and iOS install hint behavior | `src/js/map/install-prompt-controller.js` |
| Map-page DOM element lookup | `src/js/map/dom.js` |
| Status toast behavior | `src/js/map/status-toast.js` |
| Service worker registration gate | `src/js/map/service-worker.js` |
| Geolocation state, follow mode, idle timeout, and overlay drawing | `src/js/location-tracker.js` |

## Data and Persistence

| Concern | Module |
|--------|--------|
| IndexedDB favorites CRUD | `src/js/favorite-store.js` |
| Favorites JSON export/import validation | `src/js/favorite-transfer.js` |

## Tests

| Concern | Test file |
|--------|-----------|
| Attribution controller | `tests/unit/attribution-controller.test.js` |
| Base layer controller | `tests/unit/base-layer-controller.test.js` |
| Install prompt controller | `tests/unit/install-prompt-controller.test.js` |
| Menu controller | `tests/unit/menu-controller.test.js` |
| Terrain controller | `tests/unit/terrain-controller.test.js` |
| Shared location URL helpers | `tests/unit/share-location.test.js` |
| Favorites store | `tests/unit/favorite-store.test.js` |
| Favorites transfer | `tests/unit/favorite-transfer.test.js` |
| Location tracker | `tests/unit/location-tracker.test.js` |
| Basic browser flows | `tests/e2e/app.spec.js` |

## Rules

- Keep `src/js/maphop.js` thin. New map features should usually become a module under `src/js/map/`.
- Keep provider attribution structured and DOM-rendered. Do not introduce user-controlled HTML injection.
- Update this file whenever map-page ownership moves.
