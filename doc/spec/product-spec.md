# Product Specification: Maphop

**Version:** 1.2
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
| Map Renderer | MapLibre GL JS | ^5.21.0 | Vector/raster map display, geolocation overlay |
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
│   ├── maphop.js           Map page state, base maps, favorites UI, PWA install prompt, SW registration
│   ├── page-shell.js       Shared page title and version-label wiring
│   └── settings.js         Settings page behavior
├── public/
│   ├── sw.js               Service worker — network-first cache strategy for app shell
│   └── _headers            Static hosting security headers (Netlify / compatible hosts)
├── images/                 App icons (72–512px, maskable variants)
└── manifest.webmanifest    PWA manifest (standalone display, portrait, scope /)
```

### Design Principles

1. **Small-module simplicity** — map, location, favorites, transfer, and page-shell behavior are split into focused ES modules with no framework or client-side router.
2. **Local-first data** — IndexedDB for persistence, no network dependency for user data.
3. **Progressive enhancement** — the map works without geolocation, without favorites, and without service worker. Each capability layers on independently.
4. **Graceful degradation** — base map switching falls back on timeout; geolocation fails with user-friendly messages; import validation rejects bad files early; offline mode serves cached assets.

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

---

## 4. Features

### 4.1 Map Display

The core map view fills the entire viewport using MapLibre GL JS.

| Property | Value |
|----------|-------|
| Default center | 14.268°E, 46.59026°N (Central Europe) |
| Default zoom | 15 |
| Rotation | Disabled (drag + touch) |
| Attribution | Custom (no built-in control) |

**Acceptance criteria:**
- Map renders immediately on page load with the default base layer (Bergfex OSM).
- Pan and pinch-zoom work on touch and desktop.
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

**Behavior:**
- Switching base maps triggers a style load with a **12-second timeout**.
- On failure, the app **reverts to the previous base layer** and shows an error toast.
- The geolocation overlay is **re-applied after every base map switch**.
- The menu button is **disabled during style loading** to prevent rapid switching.

**Acceptance criteria:**
- Selecting a map option loads the new style within 12 seconds or falls back.
- Location overlay persists across map switches without losing the current GPS fix.
- Active map is visually highlighted in the menu.

### 4.3 Geolocation Tracking

Opt-in location tracking with three visual layers on a single GeoJSON source (`user-location`):

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
- After the initial position lock the map **continuously pans** to keep the user centered (`easeTo`, 500ms duration) on every GPS update.
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
- Location data never leaves the device.

### 4.4 Favorites (Saved Locations)

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

### 4.5 Settings & Favorites Transfer

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

### 4.6 Progressive Web App

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

### Flow 4: Base Map Switch

```
Open menu → Maps section
  → Tap "OpenTopoMap"
  → Menu button disabled during load
  → Style loads → location overlay re-applied → toast confirms
  → OR: Style fails within 12s → reverts to previous map → error toast
```

### Flow 6: PWA Install

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

### Flow 5: Favorites Backup

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

| Component | Size | Key Behavior |
|-----------|------|-------------|
| Menu button | 48x48px circle | Hamburger icon, toggles control panel |
| Control panel | 260px (mobile) / 280px (desktop) | Glass panel, max-height transition (180ms) |
| Location toggle | Full-width row | Animated pill with gradient active state |
| Favorite item | Full-width card | Name + coordinates, inline delete button |
| Layer option | Full-width button | Radio-style selection, accent highlight |
| Section toggle | Full-width header | Chevron rotates 180° on expand |
| Settings card | Responsive grid card | Groups backup actions, roadmap placeholders, and privacy copy |
| Status toast | 280px, bottom-center | Auto-hides after 2.8s, slide-up animation |
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
| Runtime dependencies | 1 (MapLibre GL JS) |
| Initial JS payload | Small modular bundles split by page |
| Base map switch timeout | 12 seconds max |
| Favorite navigation animation | 650ms |
| Toast display duration | 2.8 seconds |
| Location idle timeout | 15 minutes |

### Security

| Mechanism | Implementation |
|-----------|---------------|
| Content Security Policy | `<meta http-equiv="Content-Security-Policy">` on all three pages. `index.html` allowlists all 7 tile providers in `connect-src` and `img-src`; MapLibre blob workers covered by `worker-src blob: child-src blob:`. Secondary pages use a tighter policy with no external origins. |
| Referrer Policy | `<meta name="referrer" content="no-referrer">` on all pages — tile providers receive no `Referer` header. |
| HTTP security headers | `_headers` file (Netlify / compatible hosts): `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Permissions-Policy: geolocation=(self)`, `X-XSS-Protection: 0`. |
| Input validation | Favorites import: 64 KB file size cap, JSON parse guard, coordinate range check, 250-record limit, 80-char name limit, duplicate skipping. |
| DOM safety | User data rendered exclusively via `textContent`; no `innerHTML` with dynamic content. |

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
| `favorite-transfer.test.js` | 18 | File type/size validation; JSON payload parsing; coordinate range checks; name length; import result status messages; export empty-state; import-button wiring |
| `favorite-store.test.js` | 16 | `saveFavorite`, `readFavorites`, `deleteFavoriteById`, `importFavorites`, `getFavoritesForExport`; newest-first sort; case-insensitive dedup; within-batch dedup; export field shape |
| `location-tracker.test.js` | 12 | `isActive` initial state; `start()`/`stop()` lifecycle; geolocation API calls; 15-minute idle timeout; `registerActivity()` timer reset; all four geolocation error codes |
| **Total** | **46** | |

Key unit test design decisions:
- `vi.resetModules()` + `new IDBFactory()` per test resets the module-level `favoritesDbPromise` singleton in `favorite-store.js`, giving each test an isolated store.
- `vi.mock('maplibre-gl')` stubs `LngLatBounds` so `location-tracker.js` loads cleanly in jsdom without a WebGL context.
- `vi.useFakeTimers()` drives the 15-minute idle timeout synchronously.
- Replacing `global.navigator` with a plain object (no `geolocation` property) makes `"geolocation" in navigator` return `false` for the unsupported-browser test.

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
| Unit test suite passes | `npm test` exits 0 with all 46 tests green |
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
- **Altitude/elevation profile** — integrate elevation data for outdoor use cases.
- **Multi-language support** — UI strings are currently English-only.
