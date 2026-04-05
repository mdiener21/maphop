# Product Spec: Maphop

**v1.9 · 2026-04-03 · Status: Active**

Local-first, privacy-first PWA map viewer. No accounts, no server-side state, all user data on-device.

**Rule:** Update this spec and `CHANGELOG.md` together whenever shipped behavior, architecture, UX, or constraints change.

---

## Quick Index

[Tech Stack](#tech-stack) · [Architecture](#architecture) · [Features](#features) · [User Flows](#user-flows) · [UI & Design](#ui--design-system) · [Non-Functional](#non-functional-requirements) · [Constraints](#constraints) · [Success Criteria](#success-criteria) · [Future](#future-considerations)

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Map renderer | MapLibre GL JS ^5.21.0 | Vector/raster display, geolocation overlay, terrain |
| Terrain protocol | PMTiles ^4.3.0 | `pmtiles://` protocol registered before map init |
| Build | Vite ^8.0.2 | Dev server, bundling, HMR |
| Runtime | Vanilla ES Modules ES2020+ | No framework |
| Storage | IndexedDB (`personal-map-db`) | Favorites persistence |
| Offline | Service Worker | App shell caching |
| Geolocation | Geolocation API | Opt-in position tracking |
| Unit tests | Vitest ^4.1.2 + jsdom ^29.0.1 + fake-indexeddb ^6.2.5 | 74 tests |
| E2E tests | Playwright ^1.58.2 (Firefox) | 12 tests |

---

## Architecture

### File Structure

```
src/
├── index.html              Map page shell and control menu
├── settings.html           Favorites backup and future config
├── impressum.html          Legal/privacy page
├── css/
│   ├── maphop.css          Live map styles and control menu
│   ├── app-page.css        Shared secondary page chrome
│   ├── settings.css
│   └── impressum.css
├── js/
│   ├── maphop.js           Map page bootstrap and dependency wiring
│   ├── location-tracker.js Geolocation state, geo-math, overlay rendering
│   ├── favorite-store.js   IndexedDB CRUD for favorites
│   ├── favorite-transfer.js JSON import/export validation
│   ├── settings.js         Settings page behavior
│   ├── page-shell.js       Shared page title and version wiring
│   ├── impressum.js
│   └── map/
│       ├── base-map-registry.js    Source-of-truth base map definitions and attribution metadata
│       ├── base-layer-controller.js Style switching, 12s timeout, rollback
│       ├── terrain-controller.js   DEM/hillshade lifecycle across style reloads
│       ├── attribution-controller.js Attribution widget from structured metadata
│       ├── favorites-panel.js      Favorites menu, crosshair flow, naming modal, share/save/delete
│       ├── favorites-overlay.js    GeoJSON pin layer, hover popup, toggle persistence
│       ├── share-location.js       Share URL builder and query-param parser
│       ├── menu-controller.js      Menu open/close and section state
│       ├── install-prompt-controller.js PWA install prompt and iOS hint
│       ├── dom.js                  Centralized map-page DOM lookups
│       └── service-worker.js       SW registration
├── public/
│   ├── sw.js               Service worker (network-first, scope /)
│   └── _headers            Security headers (Netlify-compatible)
├── images/                 App icons 72–512px (maskable variants)
└── manifest.webmanifest    PWA manifest (standalone, portrait, scope /)

tests/
├── unit/                   Vitest + jsdom (74 tests across 9 files)
└── e2e/app.spec.js         Playwright Firefox (12 tests)

doc/
├── architecture/code-map.md  Module ownership quick-navigation guide
└── spec/product-spec.md      This file
```

### Design Principles

1. **Thin orchestration** — `maphop.js` bootstraps and wires; behavior lives in focused controllers under `src/js/map/`.
2. **Small modules** — each capability has one obvious module home.
3. **Local-first** — IndexedDB for persistence, no network dependency for user data.
4. **Progressive enhancement** — map works without geolocation, favorites, or service worker; each layers on independently.
5. **Graceful degradation** — base map switches fall back on timeout; imports validate early; offline serves cache.
6. **Structured attribution** — provider metadata renders via DOM creation, never `innerHTML`.

### Module Boundaries

| Module | Responsibility |
|--------|----------------|
| `maphop.js` | Create MapLibre instance, instantiate controllers, wire cross-controller events |
| `base-map-registry.js` | Base map labels, style URLs, structured attribution data |
| `base-layer-controller.js` | Style loads, 12s timeout, active-layer state, rollback on failure |
| `terrain-controller.js` | DEM and hillshade sources/layers across terrain toggles and style reloads |
| `attribution-controller.js` | Render attribution from structured metadata; DOM node creation only |
| `location-tracker.js` | Geolocation state, follow mode, idle timeout, location overlay rendering |
| `favorites-panel.js` | Favorites list, crosshair selection, naming modal, share/save/delete, map navigation |
| `favorites-overlay.js` | GeoJSON source/layer, pin image, hover popup, toggle state, style-reload restore |
| `menu-controller.js` | Menu visibility and section expansion state |
| `share-location.js` | Build share URLs; parse incoming `lat`/`lng`/`z` query params |
| `install-prompt-controller.js` | `beforeinstallprompt` capture; iOS standalone hint with 7-day snooze |
| `dom.js` | Centralized map-page DOM queries |

**Rule:** New map features → dedicated module under `src/js/map/`. Pure geolocation overlay logic → `location-tracker.js`. Cross-page shell logic → `page-shell.js`. Keep `doc/architecture/code-map.md` aligned when module responsibilities move.

---

## Features

### 4.1 Map Display

| Property | Value |
|----------|-------|
| Default center | 14.268°E, 46.59026°N |
| Default zoom | 15 |
| Max pitch | 85° |
| Rotation / pitch | Right-click drag (desktop); two-finger gestures (touch) |
| Attribution | Custom widget; built-in MapLibre control hidden |

- Map renders immediately on load with the default base layer (Bergfex OSM).
- Fills 100% of viewport; pan and pinch-zoom work on touch and desktop.

### 4.2 Base Map Selection

Seven providers selectable from the radio-button Maps menu:

| Key | Name | Tile Size | Max Zoom |
|-----|------|-----------|----------|
| `bergfex` | Bergfex OSM | 512px | 20 |
| `osm` | OpenStreetMap | 256px | 19 |
| `openfreemap` | OpenFreeMap Liberty | Style JSON | — |
| `opentopo` | OpenTopoMap | 256px | 17 |
| `cyclosm` | CyclOSM | 256px | 20 |
| `esriSatellite` | Esri Satellite | 256px | 19 |
| `basemapGrauWmts` | basemap.at Grau WMTS | 256px | 20 |

**Persistence:** `localStorage` key `maphop-base-layer`; saved on successful style load; restored on page load (no second load needed); fallback `bergfex`.

- Switching triggers a 12-second style-load timeout; failure reverts to the previous layer and shows an error toast.
- Menu button disabled during style loading.
- After every style load: terrain source re-added → hillshade re-applied (if active) → geolocation overlay re-applied (this order keeps location dot above hillshade).
- Attribution panel updates on every switch.
- If `localStorage` is unavailable, falls back to Bergfex OSM silently.

### 4.3 Geolocation Tracking

Opt-in via the **Location section** (accordion, default closed) in the control menu.

**GeoJSON source** `user-location` with three layers:

| Layer ID | Type | Visual |
|----------|------|--------|
| `user-location-accuracy` | Fill | Semi-transparent green accuracy radius circle |
| `user-location-heading` | Fill | 22° cone, 6-band blue gradient, direction of travel |
| `user-location-point` | Circle | 10px bright green dot, white border |

**Config:** high accuracy; max age 5,000 ms; timeout 15,000 ms; 48-point accuracy polygon; 22° heading cone; 15-minute idle auto-stop.

- First fix auto-fits map to accuracy radius.
- Enter **follow mode**: map pans to user on every GPS update (`easeTo` 500ms).
- Manual drag while tracking → follow suspends, **Re-center button** appears (bottom-left); GPS continues but map doesn't auto-pan.
- Tapping Re-center → flies to last GPS fix, resumes follow, hides button.
- Heading cone appears only when moving (>0.7 m/s); derived from GPS `heading` or successive fixes (min 5 m).
- Auto-stop after 15 minutes of inactivity (no pointer/touch/wheel/key events); toast notification.
- Tracking stops and overlay hides on `visibilitychange` (hidden) or `pagehide`.
- Errors: permission denied / unavailable / timeout each produce a specific toast message.

### 4.4 Map Attribution Widget

`©` button fixed `bottom: 8px; right: 8px`; toggles a glass panel above it (max-width `min(300px, 100vw − 24px)`).

- Hidden by default; global `click` closes it.
- Renders from structured metadata in `baseMapConfigs` via DOM node creation; no HTML injection.
- Appends `· Hillshade © basemap.at · Terrain © Mapterhorn` while terrain is active.
- Updates on every base map switch and terrain toggle.

### 4.5 Favorites (Saved Locations)

| Property | Value |
|----------|-------|
| Database | `personal-map-db` |
| Object store | `favoriteLocations` |
| Key | Auto-increment |
| Fields | `name`, `longitude`, `latitude`, `createdAt` |
| Coordinate display | 5 decimal places |
| Sort order | Newest-first |

- **Add**: "Add Favorite" closes menu, enters crosshair selection mode over the live map. User pans/zooms; map center under crosshair is the target. "Save This Spot" captures center and opens naming modal (default name = current date). Confirm stores to IndexedDB; toast confirms. Cancel / `Escape` / backdrop click aborts.
- **Navigate**: tapping a favorite eases to coordinates (650ms `easeTo`) and closes menu.
- **Delete**: inline trash icon removes entry and refreshes list.
- **Share**: share button generates a deep link; native share sheet when available, otherwise copies to clipboard.
- **Shared location receiver**: opening Maphop with valid `lat`+`lng` params centers the map, places a pin, and shows the shared location banner (§4.9).
- **Overlay**: "Show on Map" toggle displays favorites as pin markers on the live map (§4.8).
- No network requests for any favorites operation.

### 4.6 Settings & Favorites Transfer

| Property | Value |
|----------|-------|
| Page | `settings.html` |
| Export format | GeoJSON `FeatureCollection` (RFC 7946) |
| Export filename | `maphop-favorites-YYYY-MM-DD.geojson` |
| Max import file size | 64 KB |
| Max imported favorites | 250 |
| Max favorite name length | 80 characters |

**Export shape:**
```json
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [longitude, latitude] },
    "properties": { "name": "My Place", "createdAt": 1712345678901 }
  }]
}
```

**Import formats accepted:**

| Format | Detection |
|--------|-----------|
| GeoJSON `FeatureCollection` | `payload.type === "FeatureCollection"` |
| Legacy `maphop-favorites` envelope | `payload.format === "maphop-favorites"` |
| Raw JSON array | Top-level array of objects |

- Export: timestamped `.geojson`, valid GeoJSON, loadable in QGIS / geojson.io.
- Import: validates structure and coordinate ranges; skips duplicates already in IndexedDB; rejects invalid/oversized/malformed files with user-facing status.
- Settings page shows current favorites count and refreshes after import.

### 4.7 Progressive Web App

| Property | Value |
|----------|-------|
| Display mode | Standalone |
| Orientation | Portrait-primary |
| Theme color | `#0d1b20` |
| Start URL / Scope | `/` |
| Icons | 72, 128, 144, 192 (maskable), 512 (maskable) px |

**Service worker:** registers at `/sw.js`, scope `/`, production only (HTTPS). Strategy: network-first for same-origin; cross-origin tile requests bypass cache. Old caches deleted on `activate`; `skipWaiting` + `clients.claim` takes control immediately.

**Install prompts:**
- **Android/Chrome**: `beforeinstallprompt` captured; glass-panel install banner (bottom) with Install + Dismiss.
- **iOS Safari**: "Tap Share → Add to Home Screen" hint; dismissing snoozes 7 days via `localStorage` key `ios-hint-snoozed-until`; reappears after snooze expires.
- Both banners hide on `appinstalled` or when already in standalone mode.

### 4.8 Favorites Map Overlay

| Property | Value |
|----------|-------|
| Source ID | `favorites-overlay` |
| Layer ID | `favorites-overlay-pins` |
| Layer type | `symbol` |
| Image ID | `favorites-pin` |
| Pin SVG | Teardrop, `#6ff2bd` fill, dark stroke, 31×42 px (30% larger than 24×32 viewBox) |
| Icon size | `0.7` |
| Icon anchor | `bottom` |
| Persistence | `localStorage` key `maphop-favorites-overlay` (`"1"` = visible) |
| Hover | `maplibregl.Popup` at `bottom` showing favorite name |

- Toggle button in Favorites section; `data-state` flips `"active"` / `"idle"`.
- GeoJSON source updated (`setData`) on every save, delete, or load.
- `ensureAfterStyleLoad()` re-registers pin image and re-adds source/layer after every base map switch, restoring previous visibility.
- Cursor changes to `pointer` on pin hover; popup removed on `mouseleave`.

### 4.9 Shared Location Receiver

Trigger: valid `lat` + `lng` query params on page load (optional `z` for zoom).

| Property | Value |
|----------|-------|
| Pin marker | `maplibregl.Marker`, same pin SVG, anchor `bottom` |
| Banner | Fixed top-center; `top: max(1.25rem, safe-area-inset-top + 1rem)`; z-index 300; glass panel; max-width 440px |
| Banner contents | Pin icon · descriptive text · "Add to Favorites" button · Dismiss (✕) |

- Map centers on shared coordinates on load.
- "Add to Favorites" → dismisses banner/pin, opens naming modal at shared coordinates via `favoritesPanel.promptFavoriteNameAt()` (bypasses crosshair step).
- ✕ → removes pin and banner; map stays centered.
- No banner or pin on normal (non-shared) page loads.

### 4.10 3D Terrain

Toggle in the Location section, below the tile-provider privacy note.

| Property | Value |
|----------|-------|
| DEM source ID | `terrain-source` |
| DEM provider | Mapterhorn — `https://tiles.mapterhorn.com/tilejson.json` |
| DEM encoding | `terrarium` (PMTiles) |
| Exaggeration | `1` |
| Hillshade source ID | `hillshade-source` |
| Hillshade provider | basemap.at — `mapsneu.wien.gv.at/basemap/bmapgelaende/grau/google3857/{z}/{y}/{x}.jpeg` |
| Hillshade tile size / max zoom | 256px / 18 |
| Hillshade opacity | `0.4` |
| Pitch on enable | 45° (600ms `easeTo`) |
| Pitch on disable | 0° (600ms `easeTo`) |

- Enable: adds DEM source → adds hillshade source/layer → `map.setTerrain()` → pitch 45°.
- Disable: `map.setTerrain(null)` → removes hillshade layer/source → pitch 0°.
- DEM source **always kept alive** (not removed on disable).
- After every style switch: `ensureTerrainAfterStyleLoad()` re-adds DEM source unconditionally; re-applies full terrain stack if active. Hillshade layer added **before** geolocation layers so location dot renders on top.
- Attribution appends `· Hillshade © basemap.at · Terrain © Mapterhorn` while active.

### 4.11 Compass & Orientation Reset

| Property | Value |
|----------|-------|
| Position | Bottom-left, stacked above Re-center button |
| Visibility | `Math.abs(bearing) >= 0.5°` **OR** `pitch >= 0.5°` |
| Reset | `easeTo({ bearing: 0, pitch: 0 })` 400ms |

- SVG needle counter-rotates by `−bearing` so north tip always points geographic north.
- Listens to both MapLibre `rotate` and `pitch` events via shared `updateCompassButton()`.
- Resets **both** bearing and pitch in one animation, then hides.

---

## User Flows

### Flow 1: First Visit
```
Open URL → map loads (Bergfex OSM, default location)
  → (optional) switch base map → (optional) enable location → (optional) add favorite
```

### Flow 2: Location Tracking
```
Menu → "Show My Location" ON → browser permission prompt
  → GPS fix → map auto-zooms to accuracy → heading cone when moving
  → 15 min idle → auto-stop + toast
  → OR toggle OFF → stops immediately
```

### Flow 3: Add Favorite
```
Pan to POI → menu → "Add Favorite"
  → menu closes, crosshair appears
  → pan/zoom until target is under crosshair
  → "Save This Spot" → naming modal → confirm
  → toast: "Saved [name]."
  → later: menu → Favorites → tap entry → map eases there, menu closes
```

### Flow 4: Re-center After Pan
```
Tracking active + GPS fix → user drags map
  → Re-center button appears, follow suspends
  → tap Re-center → flies to last GPS position (500ms) → follow resumes → button hides
```

### Flow 5: 3D Terrain
```
Menu → Location section → "3D Terrain" ON
  → map pitches 45° (600ms), hillshade appears
  → right-click drag / two-finger gesture → rotates/tilts → compass button appears
  → "3D Terrain" OFF → pitch 0°, hillshade removed
```

### Flow 6: Base Map Switch
```
Menu → Maps section → tap provider
  → menu button disabled during load
  → success: terrain/overlay restored → toast confirms
  → OR timeout (12s): reverts to previous map → error toast
```

### Flow 7: Compass Reset
```
Map rotated → compass button appears, needle points north
  → tap → bearing + pitch reset to 0° (400ms) → button hides
```

### Flow 8: PWA Install
**Android:** `beforeinstallprompt` → install banner → tap Install → native dialog → installed.
**iOS:** hint banner appears in Safari → tap ✕ → 7-day snooze → reappears → follow instructions → standalone mode.

### Flow 9: Favorites Backup
```
Settings → review count → "Export favorites JSON" → file downloads immediately
  → OR "Import favorites JSON" → pick file → validates → imports unique → count refreshes
```

### Flow 10: View Favorites on Map
```
Menu → Favorites → "Show on Map" toggle ON → pins appear on map
  → hover pin → popup shows name → move away → popup closes
  → toggle OFF → pins disappear (state persists across reloads)
```

### Flow 11: Share Favorite
**Sender:** Favorites → share button → native share sheet OR URL copied to clipboard.
**Receiver:** open shared link → map centers on coordinates → pin marker + banner appear → "Add to Favorites" → naming modal → save; OR ✕ → dismiss.

---

## UI & Design System

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#0d1b20` | Body background |
| `--panel` | `rgba(11, 18, 21, 0.78)` | Menu panel background |
| `--panel-border` | `rgba(227, 237, 233, 0.16)` | Panel borders |
| `--text` | `#edf4ef` | Primary text |
| `--text-muted` | `rgba(237, 244, 239, 0.68)` | Secondary text, coordinates |
| `--accent` | `#6ff2bd` | Buttons, active states, highlights |
| `--accent-strong` | `#17c08b` | Stronger accent variant |

Glass effect: `backdrop-filter: blur(18px) saturate(140%)`. Shadow: `0 18px 45px rgba(0,0,0,0.28)`. Safe area insets via `env(safe-area-inset-*)`.

### Component Inventory

| Component | Size / Position | Key Behavior |
|-----------|----------------|-------------|
| Menu button | 48×48px circle, top-right | Hamburger, toggles control panel |
| Control panel | 260px mobile / 280px desktop, top-right | Glass panel, max-height transition 180ms |
| Location toggle | Full-width row | Animated pill, gradient active state |
| Terrain toggle | Full-width row, Location section (below privacy note) | Animated pill; top border separator |
| Favorite selection overlay | Full-map overlay | Centered crosshair + bottom action card; map remains interactive |
| Favorite naming modal | Centered dialog | Text input + cancel/save |
| Favorite item | Full-width card | Name + coordinates; inline share + delete |
| Favorite share button | 38×38px icon | Native share or clipboard copy |
| Show on Map toggle | Full-width row, Favorites section | Animated pill; `data-state`; persists to localStorage |
| Favorites pin | Map symbol layer | Green teardrop SVG; popup on hover |
| Layer option | Full-width button | Radio-style, accent highlight |
| Section toggle | Full-width header | Chevron rotates 180° on expand; Location (default closed), Favorites, Maps |
| Status toast | 280px, bottom-center | Auto-hides 2.8s, slide-up animation; `aria-live="polite"` |
| Attribution widget | Bottom-right (8px, 8px) | `©` button + collapsible glass panel; outside click closes |
| Compass button | 36×36px circle, bottom-left ~70px | Hidden at bearing≈0 + pitch≈0; needle counter-rotates; tap resets |
| Re-center button | Pill, bottom-left 18px | Hidden unless tracking active and user has panned |
| Shared location banner | max 440px, top-center | Glass panel; pin icon + text + Add to Favorites + Dismiss |
| Install banner (Android) | max 440px, bottom-center | Glass panel; Install + Dismiss; `beforeinstallprompt` |
| Install hint (iOS) | max 440px, bottom-center | Glass panel; Share instruction + Dismiss; 7-day snooze |

**Breakpoints:** Default mobile-first (260px menu); 700px+ → 280px menu.

---

## Non-Functional Requirements

### Privacy
- No accounts or server-side user state.
- Geolocation opt-in; never transmitted to any server.
- Menu displays: *"Remote map providers can infer your nearby area from the tiles your device requests."*
- No analytics or tracking scripts.

### Performance

| Metric | Target |
|--------|--------|
| Runtime dependencies | 2 (MapLibre GL JS, PMTiles) |
| Base map switch timeout | 12 seconds max |
| Favorite navigation animation | 650ms |
| Toast display duration | 2.8 seconds |
| Location idle timeout | 15 minutes |

### Security

| Mechanism | Implementation |
|-----------|---------------|
| Content Security Policy | `<meta>` on all pages; `index.html` allowlists all 7 tile providers + `tiles.mapterhorn.com` in `connect-src`/`img-src`; MapLibre blob workers via `worker-src blob: child-src blob:`. Secondary pages use tighter policy. |
| Referrer Policy | `no-referrer` on all pages — tile providers receive no `Referer` header. |
| HTTP security headers | `_headers`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Permissions-Policy: geolocation=(self)`, `X-XSS-Protection: 0`. |
| Input validation | Import: 64 KB cap, JSON parse guard, coordinate range check, 250-record limit, 80-char name limit, duplicate skipping. |
| DOM safety | User data renders via `textContent`, attribute assignment, explicit element creation; no `innerHTML`. |

### Accessibility
- Semantic HTML with `aria-expanded`, `aria-controls`, `aria-checked`, `aria-label`, `aria-live`.
- Touch targets minimum 48×48px.
- Status toast uses `aria-live="polite"`.

### Testing
- **Unit (Vitest + jsdom):** 74 tests across 9 files covering all pure-logic modules. Key decisions: `vi.resetModules()` + `new IDBFactory()` isolates IndexedDB per test; `vi.useFakeTimers()` drives the 15-minute idle timeout; `vi.mock('maplibre-gl')` stubs LngLatBounds for jsdom.
- **E2E (Playwright + Firefox):** 12 tests covering page titles, DOM structure, menu interaction, and navigation. Chromium excluded (missing `libnspr4.so` on this WSL2 host).

### Offline Support
- Service worker caches app shell for offline launch.
- Previously loaded tiles remain in browser cache.
- Favorites and geolocation work fully offline.

---

## Constraints

### Always
- All user data stays on-device.
- Base map switch failures revert to the previous working layer.
- Geolocation tracking stops on background/unload.
- `CHANGELOG.md` and this spec updated together for shipped changes.
- PWA deployment assumptions aligned across Vite config, manifest, and SW registration.

### Ask First
- Adding new tile providers (affects privacy, reliability, attribution).
- Changing the deployment path (requires Vite config + manifest + SW updates together).
- Adding any external network dependency beyond tile providers.

### Never
- Send location data to a server.
- Require user accounts or authentication.
- Add analytics, tracking, or telemetry.
- Auto-prompt for geolocation on page load.
- Store user data outside the browser. Non-sensitive UI state may use `localStorage` (current keys: `ios-hint-snoozed-until`, `maphop-base-layer`, `maphop-favorites-overlay`).

---

## Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Map loads | Default base layer renders within 3s on broadband |
| Base map switching | All 7 providers load or gracefully fall back |
| Base map preference persists | Last-used restored on reload; falls back to Bergfex OSM when storage unavailable |
| Location tracking | Accuracy circle, heading cone, and point render on activation |
| Idle timeout | Tracking stops after 15 minutes of inactivity |
| Favorites CRUD | Save, list, navigate-to, and delete all work with toast feedback |
| Favorites sharing | Share produces a deep link opening Maphop at saved coordinates |
| Shared location receiver | Pin + banner on shared link load; "Add to Favorites" saves; dismiss removes pin/banner |
| Favorites backup | Export produces valid GeoJSON; import accepts all 3 formats; duplicates skipped |
| Favorites overlay | Pins toggle on/off; hover shows name popup; survives style switch; state persists |
| Offline launch | App shell loads without network after first visit |
| PWA installable | Passes Lighthouse PWA installability checks |
| Privacy preserved | Zero outbound requests except tile fetches; no cookies or analytics |
| Mobile usable | All interactions work on touch with safe area support |
| Accessibility baseline | No critical ARIA violations; all interactive elements keyboard-reachable |
| Re-center | Button appears on pan-while-tracking; tap re-centers and resumes follow |
| 3D Terrain | Terrain, hillshade, and 45° pitch activate/deactivate cleanly; survive style switch |
| Attribution | © panel shows correct provider credit; terrain suffix syncs with terrain state |
| Compass | Appears on rotation or tilt; needle tracks north; tap resets bearing + pitch to 0° |
| Architecture navigable | `doc/architecture/code-map.md` sufficient to locate owning module without reading `maphop.js` |
| Unit tests pass | `npm test` exits 0, all 74 tests green |
| E2E tests pass | `npm run test:e2e` exits 0, all 12 tests green |

---

## Future Considerations

Not committed work items — known gaps and potential directions:

- **Route/track recording** — leverage existing geolocation infrastructure for GPS tracks.
- **Favorite categories/tags** — organize beyond a flat chronological list.
- **Custom tile provider configuration** — user-defined tile URLs beyond the built-in 7.
- **Search/geocoding** — address lookup (e.g., Nominatim).
- **Distance measurement** — tap-to-measure between two points.
- **Dark/light theme toggle** — current dark theme is hardcoded.
- **Altitude/elevation profile** — surface per-point elevation from Mapterhorn DEM.
- **Terrain exaggeration slider** — tune exaggeration factor (currently fixed at 1×).
- **Multi-language support** — UI is currently English-only.
