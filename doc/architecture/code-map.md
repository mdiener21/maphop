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
| Routing panel, ORS requests, route overlay/pins, route profile metadata (label, icon, timing method), the chosen route duration (DIN 33466, mountain-bike riding time, or ORS "est.") for panel and sheet, route bounds and Fit route / auto-fit per new route | `src/js/map/routing-controller.js` |
| Route Summary Sheet UI (`#routeSummary`): render, show/hide/× dismiss, expand/collapse by tap/swipe (phones only), point list, Fit route / Edit / Clear button wiring, and live height publishing (`--route-summary-height`) | `src/js/map/route-summary-sheet.js` |
| DIN 33466 hiking-time calculator (pure `estimateHikingDuration`) used by the Route Summary Sheet | `src/js/map/hiking-time.js` |
| Mountain-bike riding-time calculator (pure `estimateRidingDuration`) used by the Route Summary Sheet | `src/js/map/riding-time.js` |
| Map-page DOM element lookup | `src/js/map/dom.js` |
| Status toast behavior | `src/js/map/status-toast.js` |
| Service worker registration gate | `src/js/map/service-worker.js` |
| Geolocation state, follow mode, idle timeout, and overlay drawing | `src/js/location-tracker.js` |
| Favorite elevation selection from device/Open-Meteo data | `src/js/favorite-elevation.js` |
| PocketBase favorite backup and device ID registration | `src/js/favorite-cloud-store.js` |

## Data and Persistence

| Concern | Module |
|--------|--------|
| IndexedDB favorites CRUD | `src/js/favorite-store.js` |
| Favorites JSON export/import validation | `src/js/favorite-transfer.js` |
| Favorite elevation lookup and source-choice rules | `src/js/favorite-elevation.js` |
| PocketBase auth, device ID, and favorite backup payloads | `src/js/favorite-cloud-store.js` |

## Tests

| Concern | Test file |
|--------|-----------|
| Attribution controller | `tests/unit/attribution-controller.test.js` |
| Base layer controller | `tests/unit/base-layer-controller.test.js` |
| Install prompt controller | `tests/unit/install-prompt-controller.test.js` |
| Menu controller | `tests/unit/menu-controller.test.js` |
| Routing controller and Route Summary Sheet (behaviour through `createRoutingController`) | `tests/unit/routing-controller.test.js` |
| Route Summary Sheet module (`destroy()`) | `tests/unit/route-summary-sheet.test.js` |
| Terrain controller | `tests/unit/terrain-controller.test.js` |
| Shared location URL helpers | `tests/unit/share-location.test.js` |
| Favorites store | `tests/unit/favorite-store.test.js` |
| Favorites transfer | `tests/unit/favorite-transfer.test.js` |
| Favorite elevation | `tests/unit/favorite-elevation.test.js` |
| Favorite PocketBase backup | `tests/unit/favorite-cloud-store.test.js` |
| Location tracker | `tests/unit/location-tracker.test.js` |
| Basic browser flows | `tests/e2e/app.spec.js` |

## Rules

- Keep `src/js/maphop.js` thin. New map features should usually become a module under `src/js/map/`.
- Keep provider attribution structured and DOM-rendered. Do not introduce user-controlled HTML injection.
- Update this file whenever map-page ownership moves.
