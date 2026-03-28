# Product Specification: Maphop

**Version:** 1.4
**Last Updated:** 2026-03-28
**Author:** Product Management
**Status:** Draft

**Maintenance Rule:** Update this spec whenever `CHANGELOG.md` is updated for shipped behavior, architecture, UX, user flow, or constraint changes.

---

## Table of Contents

| Section | Summary |
|---------|---------|
| [1. Objective](#1-objective) | Vision, problem statement, and target users |
| [2. Tech Stack](#2-tech-stack) | Runtime dependencies, build tools, browser APIs |
| [3. Architecture](#3-architecture) | File structure, data flow, and design principles |
| [4. Features](#4-features) | Detailed feature specifications with acceptance criteria |
| [5. User Flows](#5-user-flows) | End-to-end workflows for core scenarios |
| [6. UI & Design System](#6-ui--design-system) | Visual language, components, and responsive behavior |
| [7. Non-Functional Requirements](#7-non-functional-requirements) | Performance, privacy, accessibility, offline support |
| [8. Boundaries & Constraints](#8-boundaries--constraints) | Always / Ask First / Never guardrails |
| [9. Success Criteria](#9-success-criteria) | Measurable outcomes that define "done" |
| [10. Future Considerations](#10-future-considerations) | Known gaps and potential roadmap items |

---

## 1. Objective

### Vision

Maphop is a **local-first, privacy-first Progressive Web App** that gives users a fast, distraction-free map viewer with personal location bookmarking — no accounts, no tracking, no server-side state.

### Problem Statement

Existing map applications require accounts, collect location data server-side, and bundle features most users never need. Users who want a simple, private way to view maps and save personal locations have no lightweight alternative that works offline and respects their data.

### Target Users

- **Privacy-conscious individuals** who want map functionality without surveillance.
- **Outdoor enthusiasts** (mountain bikers, hikers, cyclists) who need offline-capable maps with multiple tile providers including topographic and cycling layers.
- **Casual navigators** who want to bookmark and return to locations without creating accounts.

### Core Value Propositions

1. **Zero setup** — open the URL, start using the map immediately.
2. **All data stays on-device** — favorites in IndexedDB, no server round-trips.
3. **Works offline** — service worker caches the app shell; cached tiles remain available.
4. **Multiple map styles** — switch between 7 tile providers for different use cases.

---

## 2. Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Map Renderer | MapLibre GL JS | ^5.21.0 | Vector/raster map display, geolocation overlay, terrain exaggeration |
| Terrain Tiles | PMTiles | ^4.3.0 | Protocol handler for Mapterhorn terrain tile archive; registered as `pmtiles://` protocol before map init |
| Build Tool | Vite | ^8.0.2 | Dev server, production bundling, HMR |
| Runtime | Vanilla ES Modules | ES2020+ | No framework — modular browser app |
| Storage | IndexedDB | Browser API | Favorites persistence (`personal-map-db`) |
| Offline | Service Worker | Browser API | App shell caching, offline support |
| Geolocation | Geolocation API | Browser API | Opt-in position tracking |
| Unit Test Runner | Vitest | ^4.1.2 | Fast ES-module unit tests with jsdom environment |
| DOM Environment | jsdom | ^29.0.1 | Browser-like DOM for unit tests |
| IndexedDB Stub | fake-indexeddb | ^6.2.5 | In-memory IndexedDB implementation for unit tests |
| E2E Test Runner | Playwright | ^1.58.2 | Cross-browser end-to-end tests (Firefox) |

### Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm test` | Run all unit tests once |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run test:e2e` | Run Playwright e2e tests (starts dev server automatically) |
| `npm run test:coverage` | Run unit tests with V8 coverage report |

---

## 3. Architecture

### File Structure

```
tests/
├── unit/
│   ├── attribution-controller.test.js Structured attribution rendering and terrain suffix behavior
│   ├── base-layer-controller.test.js Style switching success/failure and rollback behavior
│   ├── favorite-transfer.test.js   Validation logic, file handling, import/export status messages
│   ├── favorite-store.test.js      IndexedDB CRUD, deduplication, sort order, export shape
│   └── location-tracker.test.js    Tracker lifecycle, idle timeout, geolocation error messages
└── e2e/
    └── app.spec.js                 Page titles, DOM structure, menu interaction, navigation

src/
├── index.html              Live map page shell and mobile control menu
├── settings.html           Settings page for favorites backup and future map source controls
├── impressum.html          Legal/privacy page
├── css/
│   ├── app-page.css        Shared layout chrome for secondary pages
│   ├── impressum.css       Legal page styling
│   ├── maphop.css          Live map styling, control menu UI, and install banner
│   └── settings.css        Settings page styling
├── js/
│   ├── favorite-store.js   IndexedDB access for favorites
│   ├── favorite-transfer.js JSON import/export validation and transfer helpers
│   ├── impressum.js        Legal page interactions
│   ├── location-tracker.js Geolocation state, geo-math helpers, and map overlay rendering
│   ├── maphop.js           Thin map-page bootstrap and dependency wiring
│   ├── page-shell.js       Shared page title and version-label wiring
│   ├── settings.js         Settings page behavior
│   └── map/
│       ├── attribution-controller.js  Attribution widget rendering from structured provider metadata
│       ├── base-layer-controller.js   Base-style switching, timeout handling, and fallback restore
│       ├── base-map-registry.js       Source-of-truth base map definitions and provider attribution metadata
│       ├── dom.js                     Centralized map-page DOM lookups
│       ├── favorites-panel.js         Favorites menu rendering, save/delete actions, and navigation
│       ├── install-prompt-controller.js PWA install prompt and iOS hint lifecycle
│       ├── menu-controller.js         Menu open/close and section state
│       └── terrain-controller.js      Terrain and hillshade lifecycle across style reloads
├── public/
│   ├── sw.js               Service worker — network-first cache strategy for app shell
│   └── _headers            Static hosting security headers (Netlify / compatible hosts)
├── images/                 App icons (72–512px, maskable variants)
└── manifest.webmanifest    PWA manifest (standalone display, portrait, scope /)

doc/
├── architecture/
│   └── code-map.md         Human- and AI-oriented module ownership guide for fast code navigation
└── spec/
  └── product-spec.md     Product requirements and constraints
```

### Design Principles

1. **Thin-entry orchestration** — `src/js/maphop.js` bootstraps the page, wires dependencies, and delegates feature behavior to focused controllers under `src/js/map/`.
2. **Small-module simplicity** — map, location, favorites, transfer, attribution, install prompt, and page-shell behavior are split into focused ES modules with no framework or client-side router.
3. **Local-first data** — IndexedDB for persistence, no network dependency for user data.
4. **Progressive enhancement** — the map works without geolocation, without favorites, and without service worker. Each capability layers on independently.
5. **Graceful degradation** — base map switching falls back on timeout; geolocation fails with user-friendly messages; import validation rejects bad files early; offline mode serves cached assets.
6. **Searchable ownership boundaries** — each capability has one obvious module home, and `doc/architecture/code-map.md` provides a low-token navigation index for contributors and AI agents.

### Data Flow

```
User Interaction
    │
    ├─► Map Events ──► MapLibre GL JS ──► Tile Provider (network)
    │
  ├─► Location Toggle ──► Geolocation API ──► LocationTracker ──► GeoJSON Overlay (on-map)
    │
  ├─► Save Favorite / Delete Favorite ──► favorite-store.js ──► IndexedDB (local) ──► Favorites List (DOM)
    │
    └─► Base Map Switch ──► setBaseLayer() ──► Style Load (with 12s timeout + fallback)

Settings Page
  │
  └─► Export / Import Favorites ──► favorite-transfer.js ──► favorite-store.js ──► IndexedDB (local)
```

### Map Page Module Boundaries

| Module | Responsibility |
|--------|----------------|
| `src/js/maphop.js` | Create the MapLibre instance, instantiate controllers, and wire cross-controller events |
| `src/js/map/base-map-registry.js` | Declare base map labels, styles, and structured attribution data |
| `src/js/map/base-layer-controller.js` | Handle style loads, 12-second timeout, active-layer state, and rollback on failure |
| `src/js/map/terrain-controller.js` | Keep DEM and hillshade sources/layers consistent across terrain toggles and style reloads |
| `src/js/map/attribution-controller.js` | Render attribution UI using DOM APIs from structured metadata, not provider HTML strings |
| `src/js/location-tracker.js` | Own geolocation state, follow mode, idle timeout, and location overlay rendering |
| `src/js/map/favorites-panel.js` | Handle favorites menu rendering, prompt/save/delete flows, and map navigation from saved entries |
| `src/js/map/menu-controller.js` | Own menu visibility and section expansion state |
| `src/js/map/install-prompt-controller.js` | Capture install prompt events and iOS standalone hints |
| `src/js/map/dom.js` | Centralize map-page DOM queries for easier auditing and reuse |

### Architecture Indexing Rule

- `doc/architecture/code-map.md` must stay aligned with active entrypoints and controller ownership whenever map-page responsibilities move.
- New map features should be added to a dedicated module under `src/js/map/` unless they are purely geolocation overlay logic (`location-tracker.js`) or cross-page shell logic (`page-shell.js`).
- Provider attribution data must remain structured and render through DOM node creation, never by injecting user- or admin-editable HTML strings.

---

## 4. Features

### 4.1 Map Display

The core map view fills the entire viewport using MapLibre GL JS.

| Property | Value |
|----------|-------|
| Default center | 14.268°E, 46.59026°N (Central Europe) |
| Default zoom | 15 |
| Max pitch | 85° |
| Rotation | Enabled — right-click drag (desktop) or two-finger twist (touch) |
| Pitch | Enabled — right-click drag (desktop) or two-finger vertical gesture (touch) |
| Attribution | Custom widget (no built-in MapLibre control) |
| Native controls | All MapLibre control containers hidden via CSS |

**Acceptance criteria:**
- Map renders immediately on page load with the default base layer (Bergfex OSM).
- Pan and pinch-zoom work on touch and desktop.
- Right-click drag (desktop) and two-finger gestures (touch) tilt and rotate the map.
- Map fills 100% of viewport with no scroll overflow.

### 4.2 Base Map Selection

Seven map providers are available through a radio-button menu:

| Key | Name | Tile Size | Max Zoom | Source |
|-----|------|-----------|----------|--------|
| `bergfex` | Bergfex OSM | 512px | 20 | `tiles.bergfex.at` |
| `osm` | OpenStreetMap | 256px | 19 | `tile.openstreetmap.org` |
| `openfreemap` | OpenFreeMap Liberty | Style JSON | — | `tiles.openfreemap.org` |
| `opentopo` | OpenTopoMap | 256px | 17 | `tile.opentopomap.org` |
| `cyclosm` | CyclOSM | 256px | 20 | `tile-cyclosm.openstreetmap.fr` |
| `esriSatellite` | Esri Satellite | 256px | 19 | `server.arcgisonline.com` |
| `basemapGrauWmts` | basemap.at Grau WMTS | 256px | 20 | `mapsneu.wien.gv.at` |

Each config entry carries structured attribution metadata (provider label plus href pairs) used by the attribution widget (§4.7).

**Behavior:**
- Switching base maps triggers a style load with a **12-second timeout**.
- On failure, the app **reverts to the previous base layer** and shows an error toast.
- After every style load: terrain source is re-added → hillshade layer re-added (if terrain active) → geolocation overlay re-applied (this order ensures the location dot renders above the hillshade).
- The menu button is **disabled during style loading** to prevent rapid switching.
- Attribution panel text updates to reflect the newly active base map.

**Acceptance criteria:**
- Selecting a map option loads the new style within 12 seconds or falls back.
- Location overlay persists across map switches without losing the current GPS fix.
- Active map is visually highlighted in the menu.
- Attribution text matches the active base map after every switch.

### 4.3 Geolocation Tracking

Opt-in location tracking accessed via the **Location section** of the control menu. The Location section is a collapsible accordion (default: **closed**) with the same expand/collapse behavior as the Favorites and Maps sections. It contains the location toggle, the privacy note, and the 3D Terrain toggle (§4.8).

Three visual layers are rendered on a single GeoJSON source (`user-location`):

| Layer | Type | Visual |
|-------|------|--------|
| `user-location-accuracy` | Fill | Semi-transparent green circle showing GPS accuracy radius |
| `user-location-heading` | Fill | 22° cone rendered as a 6-band blue gradient showing direction of travel |
| `user-location-point` | Circle | 10px bright green dot with white border |

**Configuration:**

| Parameter | Value |
|-----------|-------|
| High accuracy | Enabled |
| Maximum age | 5,000 ms |
| Timeout | 15,000 ms |
| Accuracy polygon steps | 48 points |
| Heading cone spread | 22° |
| Idle auto-stop | 15 minutes |

**Behavior:**
- First activation auto-fits map to the accuracy radius with padding.
- After the initial position lock the tracker enters **follow mode**: the map pans to keep the user centered (`easeTo`, 500ms) on every GPS update.
- If the user manually drags the map while tracking is active and a GPS fix exists, **follow mode is suspended** and a **Re-center button** appears (bottom-left).
- While follow mode is suspended, GPS position updates continue but the map does **not** auto-pan.
- Tapping **Re-center** flies the map back to the last known GPS position (500ms `easeTo`), re-enters follow mode, and hides the button.
- Stopping tracking hides the Re-center button and resets follow mode for the next session.
- Heading cone appears only when the device is moving (>0.7 m/s).
- Heading is derived from GPS `heading` property or calculated from successive fixes (minimum 5 m displacement).
- Tracking **automatically stops after 15 minutes** of user inactivity (no pointer, touch, wheel, or keyboard events). A toast notifies the user.
- Tracking stops and the overlay is hidden when the page goes to the background (`visibilitychange`) or is unloaded (`pagehide`).

**Error handling:**
- Permission denied: toast with clear message.
- Position unavailable: toast with fallback guidance.
- Timeout: toast indicating GPS fix could not be obtained.

**Acceptance criteria:**
- Location toggle requires explicit user action; no auto-prompting on load.
- Accuracy circle, heading cone, and point render correctly on the map.
- Idle timeout fires after 15 minutes and cleans up all location state.
- Re-center button appears only after a GPS fix has been received and the user has panned.
- Re-center button is hidden when tracking is off.
- Location data never leaves the device.

### 4.4 Map Attribution Widget

A small `©` button fixed at the bottom-right corner of the map that opens a panel listing the active data sources.

| Property | Value |
|----------|-------|
| Button position | `bottom: 8px; right: 8px` |
| Panel position | Appears above the button |
| Panel max-width | `min(300px, 100vw − 24px)` |
| Attribution rendering | DOM node creation from structured provider metadata; no raw HTML injection |

**Behavior:**
- The panel is **hidden by default**; clicking the `©` button toggles it open/closed.
- Clicking anywhere outside the panel (global `click` handler) closes it.
- Attribution text is rendered from the active base map's structured metadata in `baseMapConfigs`.
- When 3D Terrain is active, the text is appended with `· Hillshade © basemap.at · Terrain © Mapterhorn`.
- Attribution updates automatically on every base map switch and on every terrain toggle.

**Acceptance criteria:**
- `©` button is visible at all times on the map page.
- Panel opens and closes correctly without interfering with other map interactions.
- Text matches the active base map after switching.
- Terrain attribution suffix appears exactly when terrain is on and disappears when it is off.

### 4.5 Favorites (Saved Locations)

Local-only bookmarking system using IndexedDB.

| Property | Value |
|----------|-------|
| Database | `personal-map-db` |
| Object store | `favoriteLocations` |
| Key | Auto-increment |
| Fields | `name`, `longitude`, `latitude`, `createdAt` |

**Behavior:**
- **Save**: captures map center, prompts for a name (default: current date), stores in IndexedDB, shows confirmation toast.
- **List**: sorted newest-first, each entry shows name and coordinates (5 decimal places).
- **Navigate**: clicking a favorite eases the map to saved coordinates (650ms `easeTo` animation) and closes the menu.
- **Delete**: inline trash-icon button removes the entry and refreshes the list.
- **Empty state**: shows "No saved locations yet." when the store is empty.

**Acceptance criteria:**
- Favorites persist across browser sessions and page reloads.
- Saving, navigating, and deleting all produce status toast feedback.
- No network requests are made for any favorites operation.

### 4.6 Settings & Favorites Transfer

A dedicated settings page keeps backup actions and future configuration out of the live map menu.

| Property | Value |
|----------|-------|
| Page | `settings.html` |
| Export format | `maphop-favorites` JSON payload |
| Export version | `1` |
| Max import file size | 64 KB |
| Max imported favorites per file | 250 |
| Max favorite name length | 80 characters |

**Behavior:**
- The settings page shows the current favorites count and confirms operations through a status line.
- Export writes a timestamped `maphop-favorites-YYYY-MM-DD.json` file.
- Import accepts `.json` files only, validates structure and coordinate ranges, and skips duplicate favorites already in IndexedDB.
- Shared page-shell code keeps the page title and visible app version consistent across pages.

**Acceptance criteria:**
- Export produces a valid JSON backup when favorites exist and reports an empty-state message otherwise.
- Import rejects invalid, oversized, or malformed files with user-facing status text.
- Successful imports refresh the visible favorites count and do not duplicate existing saved locations.

### 4.7 Progressive Web App

| Property | Value |
|----------|-------|
| Display mode | Standalone |
| Orientation | Portrait-primary |
| Theme color | `#0d1b20` |
| Start URL | `/` |
| Scope | `/` |
| Icons | 72, 128, 144, 192 (maskable), 512 (maskable) px |

**Service worker:**
- Registers at `/sw.js` with scope `/` in production (HTTPS + secure context only).
- Strategy: **network-first** for same-origin requests; cross-origin tile requests bypass the cache entirely.
- Old cache versions are deleted on `activate`; new SW takes control immediately via `skipWaiting` + `clients.claim`.

**Install prompt:**
- **Android/Chrome**: `beforeinstallprompt` is captured and prevented from firing automatically. A glass-panel install banner is shown at the bottom of the screen with an *Install* button and a *Dismiss* (✕) button.
- **iOS Safari**: A "Tap Share → Add to Home Screen" hint banner is shown when the app is not already in standalone mode. Dismissing snoozes the hint for **7 days** via a `localStorage` timestamp; it reappears automatically after the snooze expires.
- Both banners are hidden after the `appinstalled` event fires.
- Neither banner is shown when the app is already running in standalone mode.

**Acceptance criteria:**
- Lighthouse PWA audit passes core checks (manifest, service worker, HTTPS, icons).
- App launches in standalone mode when installed.
- Install banner appears on first eligible Android/Chrome visit; dismissing it does not permanently suppress it.
- iOS hint appears on first eligible Safari visit and re-appears after 7 days if the user has not installed.

### 4.8 3D Terrain

Toggle in the Maps menu section that enables MapLibre native terrain exaggeration over the active base map.

| Property | Value |
|----------|-------|
| Menu location | Location section panel, below the tile-provider privacy note |
| DEM source ID | `terrain-source` |
| DEM tile provider | Mapterhorn — `https://tiles.mapterhorn.com/tilejson.json` |
| DEM encoding | `terrarium` |
| DEM protocol | PMTiles (`pmtiles://` registered before map init) |
| Terrain exaggeration | `1` (1:1 real elevation) |
| Hillshade source ID | `hillshade-source` |
| Hillshade tile provider | basemap.at — `mapsneu.wien.gv.at/basemap/bmapgelaende/grau/google3857/{z}/{y}/{x}.jpeg` |
| Hillshade tile size | 256px |
| Hillshade max zoom | 18 |
| Hillshade blend opacity | `0.4` |
| Pitch on enable | 45° (600ms `easeTo`) |
| Pitch on disable | 0° (600ms `easeTo`) |

**Behavior:**
- Enabling terrain: adds DEM source → adds hillshade raster source and layer → calls `map.setTerrain()` → animates pitch to 45°.
- Disabling terrain: calls `map.setTerrain(null)` → removes hillshade layer and source → animates pitch to 0°.
- The DEM terrain source is **always kept alive** in the map style (not removed on disable) so it is available for future toggles.
- After every base map style switch, `ensureTerrainAfterStyleLoad()` re-adds the terrain source unconditionally and re-applies the full terrain stack if terrain was active.
- Layer order on style switch: terrain hillshade layer is added **before** the geolocation overlay layers so the location dot always renders on top.
- Attribution panel appends `· Hillshade © basemap.at · Terrain © Mapterhorn` while terrain is active.

**Acceptance criteria:**
- Toggling terrain on renders visible 3D elevation and a hillshade overlay within tile load time.
- Map pitch animates to 45° on enable and 0° on disable.
- Terrain and hillshade survive base map style switches without manual re-toggle.
- Terrain attribution appears in the attribution panel while active and disappears on disable.

### 4.9 Compass & Map Orientation

A floating compass button that indicates when the map has been rotated or tilted away from the default 2D north view and provides a one-tap reset to flat north.

| Property | Value |
|----------|-------|
| Button position | `bottom-left`, stacked above the Re-center button |
| Visibility condition | `Math.abs(bearing) >= 0.5°` **OR** `pitch >= 0.5°` |
| Reset animation | `easeTo({ bearing: 0, pitch: 0 })`, 400ms |

**Behavior:**
- The compass button is **hidden only when both bearing and pitch are within 0.5° of zero** (flat north view).
- When the map is rotated (right-click drag on desktop, two-finger twist on touch) **or tilted** (right-click drag on desktop, two-finger vertical gesture on touch), the button appears.
- The SVG needle **counter-rotates** by `−bearing` degrees so the bright north tip always points to geographic north on screen.
- Tapping the button resets **both bearing and pitch to 0°** in a single 400ms `easeTo` animation, returning to a flat 2D north-up view, and hides the button.
- The button listens to both the MapLibre `rotate` and `pitch` events via a shared `updateCompassButton()` helper.

**Acceptance criteria:**
- Compass button is hidden on load (bearing = 0, pitch = 0).
- Button appears when map is rotated away from north.
- Button appears when map is tilted (pitch > 0), even with no rotation.
- Needle visually points to north at all rotation angles.
- Tapping resets both bearing and pitch to 0° and hides the button.

---

## 5. User Flows

### Flow 1: First Visit

```
Open URL
  → Map loads with Bergfex OSM at default location
  → User pans/zooms to explore
  → (Optional) Opens menu to switch base map
  → (Optional) Enables location tracking
  → (Optional) Saves a favorite
```

### Flow 2: Location Tracking

```
Open menu → Toggle "Show My Location" ON
  → Browser permission prompt appears
  → On grant: GPS fix acquired → map auto-zooms to accuracy
  → User moves → heading cone appears
  → User idle 15 min → auto-stop + toast notification
  → OR: User toggles OFF → tracking stops immediately
```

### Flow 3: Favorite Round-Trip

```
Pan map to point of interest
  → Open menu → "Save Current View"
  → Enter name (or accept default) → Confirm
  → Toast: "Saved: [name]"
  → Later: Open menu → Favorites section
  → Tap saved favorite → map eases to coordinates, menu closes
```

### Flow 4: Re-center After Manual Pan

```
Location tracking is active, GPS fix received
  → User drags map away from current position
  → Re-center button appears (bottom-left)
  → Map stops auto-following GPS updates
  → User taps Re-center
  → Map flies back to last GPS position (500ms easeTo)
  → Follow mode resumes — map tracks GPS again
  → Re-center button disappears
```

### Flow 5: 3D Terrain

```
Open menu → Location section → toggle "3D Terrain" ON
  → Map pitches to 45° (600ms)
  → Hillshade overlay appears on base map
  → Terrain exaggeration active
  → User right-click drags (desktop) or two-finger gestures (touch) to change pitch/rotation
  → Compass button appears if map is rotated
  → Toggle "3D Terrain" OFF → pitch returns to 0°, hillshade removed
```

### Flow 6: Base Map Switch

```
Open menu → Maps section
  → Tap "OpenTopoMap"
  → Menu button disabled during load
  → Style loads → terrain source restored → hillshade re-applied (if active) → location overlay re-applied → toast confirms
  → OR: Style fails within 12s → reverts to previous map → error toast
```

### Flow 7: Compass Reset

```
Map rotated (right-click drag or two-finger twist)
  → Compass button appears bottom-left, needle points to north
  → User taps compass
  → Map rotates back to north (400ms easeTo)
  → Compass button hides
```

### Flow 8: PWA Install

**Android / Chrome:**
```
First visit (HTTPS, not already installed)
  → beforeinstallprompt fires → Install banner appears at bottom
  → User taps "Install" → native install dialog shown
  → User confirms → app installed to home screen, banner hides
  → OR: User taps ✕ → banner hides (reappears on next visit)
```

**iOS Safari:**
```
First visit in Safari (not standalone)
  → "Tap Share → Add to Home Screen" hint appears
  → User taps ✕ → hint hides, 7-day snooze set in localStorage
  → After 7 days → hint appears again
  → User follows hint → adds to home screen manually
  → Next launch from home screen → app opens in standalone mode, no hint shown
```

### Flow 9: Favorites Backup

```
Open Settings
  → Review favorites count
  → Tap "Export favorites JSON" → download starts immediately
  → OR: Tap "Import favorites JSON" → choose file
  → File validates → unique favorites are imported → count refreshes → status confirms result
```

---

## 6. UI & Design System

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

### Visual Treatment

- **Glass panel effect**: `backdrop-filter: blur(18px) saturate(140%)` on the control menu.
- **Shadow**: `0 18px 45px rgba(0, 0, 0, 0.28)` for depth.
- **Safe area insets**: respected via `env(safe-area-inset-*)` for notched devices.

### Component Inventory

| Component | Size / Position | Key Behavior |
|-----------|----------------|-------------|
| Menu button | 48×48px circle, top-right | Hamburger icon, toggles control panel |
| Control panel | 260px (mobile) / 280px (desktop), top-right | Glass panel, max-height transition (180ms) |
| Location toggle | Full-width row | Animated pill with gradient active state |
| Terrain toggle | Full-width row, Location section (below privacy note) | Same animated pill; separated by top border |
| Favorite item | Full-width card | Name + coordinates, inline delete button |
| Layer option | Full-width button | Radio-style selection, accent highlight |
| Section toggle | Full-width header | Chevron rotates 180° on expand; used by Location (default closed), Favorites, and Maps sections |
| Settings card | Responsive grid card | Groups backup actions, roadmap placeholders, and privacy copy |
| Status toast | 280px, bottom-center | Auto-hides after 2.8s, slide-up animation |
| Attribution widget | Bottom-right `(8px, 8px)` | `©` button + collapsible glass panel; closes on outside click |
| Compass button | 36×36px circle, `bottom-left ~70px` | Hidden when bearing ≈ 0°; SVG needle counter-rotates; tap resets to north |
| Re-center button | Pill, `bottom-left 18px` | Hidden unless tracking active and user has panned; tap re-centers + resumes follow |
| Install banner (Android) | max 440px, bottom-center | Glass panel; Install + Dismiss buttons; driven by `beforeinstallprompt` |
| Install hint (iOS) | max 440px, bottom-center | Glass panel; Share instruction + Dismiss; 7-day snooze |

### Responsive Breakpoints

| Breakpoint | Change |
|------------|--------|
| Default | Mobile-first, 260px menu width |
| 700px+ | Menu expands to 280px |

---

## 7. Non-Functional Requirements

### Privacy

- **No accounts or authentication.** The app has zero server-side user state.
- **Geolocation is opt-in.** No prompting on load; user must explicitly toggle.
- **Location data stays on-device.** GPS coordinates are never transmitted to any server.
- **Tile provider caveat disclosed.** The menu displays: *"Remote map providers can infer your nearby area from the tiles your device requests."*
- **No analytics or tracking scripts.**

### Performance

| Metric | Target |
|--------|--------|
| Runtime dependencies | 2 (MapLibre GL JS, PMTiles) |
| Initial JS payload | Small modular bundles split by page |
| Base map switch timeout | 12 seconds max |
| Favorite navigation animation | 650ms |
| Toast display duration | 2.8 seconds |
| Location idle timeout | 15 minutes |

### Security

| Mechanism | Implementation |
|-----------|---------------|
| Content Security Policy | `<meta http-equiv="Content-Security-Policy">` on all three pages. `index.html` allowlists all 7 base map tile providers plus `tiles.mapterhorn.com` (terrain DEM) in `connect-src` and `img-src`; MapLibre blob workers covered by `worker-src blob: child-src blob:`. Secondary pages use a tighter policy with no external origins. |
| Referrer Policy | `<meta name="referrer" content="no-referrer">` on all pages — tile providers receive no `Referer` header. |
| HTTP security headers | `_headers` file (Netlify / compatible hosts): `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Permissions-Policy: geolocation=(self)`, `X-XSS-Protection: 0`. |
| Input validation | Favorites import: 64 KB file size cap, JSON parse guard, coordinate range check, 250-record limit, 80-char name limit, duplicate skipping. |
| DOM safety | User data and provider attribution render through `textContent`, attribute assignment, and explicit element creation; no dynamic `innerHTML` injection. |

### Accessibility

- Semantic HTML with ARIA attributes (`aria-expanded`, `aria-controls`, `aria-checked`, `aria-label`, `aria-live`).
- Touch targets minimum 48x48px.
- Status toast uses `aria-live="polite"` for screen reader announcements.
- Collapsible sections use proper `aria-expanded` state management.

### Testing

The project ships with two test suites sharing a common goal: verify correctness of pure logic in isolation, and confirm the real browser experience works end-to-end.

**Configuration files:**

| File | Purpose |
|------|---------|
| `vitest.config.js` | Unit test config — jsdom environment, resolves from project root (not `src/`) |
| `playwright.config.js` | E2E config — Firefox, `webServer` auto-starts `npm run dev` on port 5173 |

**Unit tests (Vitest + jsdom)** — `npm test`

| File | Count | What is covered |
|------|------:|-----------------|
| `attribution-controller.test.js` | 4 | Structured attribution rendering, terrain suffix handling, and attribution panel open-state updates |
| `base-layer-controller.test.js` | 4 | Style-load success path, load-error rollback, timeout rollback, and active-layer UI state |
| `install-prompt-controller.test.js` | 5 | iOS hint visibility, snooze persistence, Android install prompt capture, dismiss flow, and `appinstalled` cleanup |
| `menu-controller.test.js` | 5 | Menu shell open/close state, toggle behavior, section initialization, and missing-panel no-op handling |
| `favorite-transfer.test.js` | 18 | File type/size validation; JSON payload parsing; coordinate range checks; name length; import result status messages; export empty-state; import-button wiring |
| `favorite-store.test.js` | 13 | `saveFavorite`, `readFavorites`, `deleteFavoriteById`, `importFavorites`, `getFavoritesForExport`; newest-first sort; case-insensitive dedup; within-batch dedup; export field shape |
| `location-tracker.test.js` | 15 | `isActive` initial state; `start()`/`stop()` lifecycle; geolocation API calls; 15-minute idle timeout; `registerActivity()` timer reset; all four geolocation error codes |
| `terrain-controller.test.js` | 5 | Terrain enable/disable lifecycle, style-reload restoration, and toggle-state sync |
| **Total** | **69** | |

Key unit test design decisions:
- `vi.resetModules()` + `new IDBFactory()` per test resets the module-level `favoritesDbPromise` singleton in `favorite-store.js`, giving each test an isolated store.
- `vi.mock('maplibre-gl')` stubs `LngLatBounds` so `location-tracker.js` loads cleanly in jsdom without a WebGL context.
- `vi.useFakeTimers()` drives the 15-minute idle timeout synchronously.
- Replacing `global.navigator` with a plain object (no `geolocation` property) makes `"geolocation" in navigator` return `false` for the unsupported-browser test.
- Controller-level tests use fake map objects and DOM fixtures so map orchestration stays verifiable without a browser-wide integration harness.

**E2E tests (Playwright + Firefox)** — `npm run test:e2e`

| Group | Count | What is covered |
|-------|------:|-----------------|
| Map page | 6 | Title, `#map` attachment, `#layerMenuButton` visibility, `aria-expanded` toggle, layer button presence, all 7 `data-layer-key` values |
| Settings page | 3 | Title, `#exportFavoritesButton`, `#importFavoritesButton` |
| Impressum page | 1 | Title |
| Navigation | 2 | Settings link and Impressum link from the open menu |
| **Total** | **12** | |

Chromium is not used because the `chrome-headless-shell` binary on this WSL2 host is missing `libnspr4.so`. Firefox is installed and fully functional. Switch `projects` in `playwright.config.js` to `Desktop Chrome` when running on a system with Chromium system libs available.

### Offline Support

- Service worker caches app shell for offline launch.
- Previously loaded map tiles remain available from browser cache.
- Favorites are stored locally and accessible offline.
- Geolocation works offline (GPS is device-native).

---

## 8. Boundaries & Constraints

### Always

- All user data (favorites, location) stays on-device.
- Base map switch failures revert to the previous working layer.
- Geolocation tracking stops on background/unload.
- `CHANGELOG.md` and this spec are updated together for shipped product, architecture, UX, and constraint changes.
- PWA deployment assumptions stay aligned across Vite config, manifest, and runtime registration.

### Ask First

- Adding new tile providers (affects privacy, reliability, attribution).
- Changing the deployment path (requires coordinated updates to service worker, manifest, and build config).
- Adding any external network dependency beyond tile providers.

### Never

- Send location data to a server.
- Require user accounts or authentication.
- Add analytics, tracking, or telemetry.
- Auto-prompt for geolocation on page load.
- Store user-generated or location data outside the browser (no cookies, no server sync). Non-sensitive UI state (e.g. the iOS install hint snooze timestamp) may use `localStorage`.

---

## 9. Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Map loads successfully | Default base layer renders within 3 seconds on broadband |
| Base map switching works | All 7 providers load or gracefully fall back |
| Location tracking is functional | Accuracy circle, heading cone, and point render on activation |
| Idle timeout fires | Tracking stops after 15 minutes of inactivity |
| Favorites CRUD complete | Save, list, navigate-to, and delete all work with toast feedback |
| Favorites backup works | Export succeeds for saved data; imports validate input and skip duplicates |
| Offline launch | App shell loads without network after first visit |
| PWA installable | Passes Lighthouse PWA installability checks |
| Privacy preserved | Zero outbound requests except tile fetches; no cookies or analytics |
| Mobile usable | All interactions work on touch devices with safe area support |
| Accessibility baseline | No critical ARIA violations; all interactive elements are keyboard-reachable |
| Re-center works | Button appears on pan-while-tracking; tap re-centers and resumes follow mode |
| 3D Terrain toggles correctly | Terrain exaggeration, hillshade, and 45° pitch activate and deactivate cleanly; survive base map switch |
| Attribution is accurate | © panel shows correct provider credit for every base map; terrain suffix appears/disappears in sync |
| Compass resets orientation | Button appears on rotation or tilt; needle tracks north; tap returns to bearing 0° and pitch 0° |
| Map architecture is navigable | `doc/architecture/code-map.md` is sufficient to locate the owning module for each map-page capability without reading `src/js/maphop.js` in full |
| Unit test suite passes | `npm test` exits 0 with all 69 tests green |
| E2E test suite passes | `npm run test:e2e` exits 0 with all 12 tests green against the dev server |

---

## 10. Future Considerations

These are **not committed work items** — they represent known gaps and potential directions gathered from the current architecture.

- **Route/track recording** — leverage the existing geolocation infrastructure to record and display GPS tracks.
- **Favorite categories/tags** — organize saved locations beyond a flat chronological list.
- **Custom tile provider configuration** — let users add their own tile URLs beyond the built-in 7.
- **Search/geocoding** — address lookup with a privacy-respecting provider (e.g., Nominatim).
- **Distance measurement** — tap-to-measure between two points on the map.
- **Dark/light theme toggle** — the current dark theme is hardcoded; some users may prefer light.
- **Altitude/elevation profile** — surface per-point elevation values from the Mapterhorn DEM for route analysis or tap-to-query elevation.
- **Terrain exaggeration slider** — let users tune the exaggeration factor (currently fixed at 1×) for dramatic or subtle 3D effect.
- **Multi-language support** — UI strings are currently English-only.
