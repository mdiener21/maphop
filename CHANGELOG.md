# Changelog

## [Unreleased]

### Changed
- **Favorite save flow**: adding a favorite now enters a map-selection mode with a centered crosshair so the user can pan and zoom before saving the current center point.
- **Favorite naming UI**: replaced the browser prompt with a compact centered modal shown after location selection, keeping the map interaction and naming steps separate.
- Product spec updated (v1.7): favorites behavior, data flow, component inventory, and user flow now describe the crosshair selection overlay and post-selection naming modal.

## [1.2.0] - 2026-04-03

### Added
- **Favorites GeoJSON export**: export now produces a standard GeoJSON `FeatureCollection` (RFC 7946) downloaded as `maphop-favorites-YYYY-MM-DD.geojson`, loadable directly in QGIS, geojson.io, and other GIS tools.
- **Favorites map overlay**: "Show on Map" toggle in the Favorites section renders all saved favorites as green pin markers on the live map; hovering over a pin shows a popup with the favorite's name; toggle state persists across sessions via `localStorage`.
- **Multi-format import**: favorites import now accepts GeoJSON `FeatureCollection` files (`.geojson` or `.json`) in addition to the legacy `maphop-favorites` envelope and raw JSON arrays. Import also accepts `.geojson` file extension.
- Comprehensive README with user introduction, feature table, how-to-use guide, screenshot placeholder, and developer build/deploy instructions.
- Product spec updated (v1.6): §4.6 updated to reflect GeoJSON export format with import format table; new §4.8 Favorites Map Overlay; §3 Architecture module table and data flow updated; §5 Flow 9 updated, Flow 10 added; §6 component inventory updated; §9 success criteria updated.

### Changed
- Favorites export status toast updated to "Favorites exported as GeoJSON."

### Fixed
- Location accordion section toggle (`locationSectionToggle`) was not wired up in `dom.js` and therefore could not be expanded or collapsed; added it to `menuSectionToggleElements` alongside the Favorites and Maps toggles.

## [1.1.0] - 2026-03-28

### Added
- Last-used base map is persisted to `localStorage` (`maphop-base-layer`) and restored on page reload; falls back to Bergfex OSM if the saved key is missing or invalid.
- Product spec updated (v1.5): §4.2 adds persistence table, updated behavior and acceptance criteria; §8 localStorage note now lists both keys; §9 adds base map persistence success criterion.
- Architecture code map: `doc/architecture/code-map.md` now provides a low-context index of entrypoints, controller ownership, and test locations for faster human and AI navigation.
- Compass button now also appears when the map is tilted (pitch > 0); clicking it resets both bearing and pitch to zero (full 2D north view) in a single animated transition.
- Product spec updated (v1.4): §4.3 notes Location section is a collapsible accordion defaulting to closed; §4.8 menu location updated to Location section; §4.9 Compass expanded to cover pitch visibility and pitch reset; §5 Flow 5 updated; §6 terrain toggle position and section toggle description updated; §9 compass criterion updated.
- Compass button: appears bottom-left when the map is rotated away from north; needle rotates to indicate north direction; tap resets bearing to north with animation. `maxPitch: 85` allows full 3D tilt via right-click drag (desktop) or two-finger gesture (touch).
- Re-center button: appears when the user pans away from their location while tracking is active; tapping it flies the map back to the current position and hides the button. The map no longer auto-follows after a manual pan until re-center is pressed.
- Product spec updated (v1.3): added §4.4 Map Attribution Widget, §4.8 3D Terrain, §4.9 Compass & Map Orientation; updated §4.1 (maxPitch 85, rotation re-enabled), §4.2 (attribution per config), §4.3 (follow mode / re-center button), §2 Tech Stack (PMTiles), §6 Component Inventory, §7 Security (CSP), §9 Success Criteria; added Flows 4–8; Future Considerations updated.
- Map attribution widget: small © button bottom-right opens a panel showing the active base map's attribution with links; updates automatically when switching base maps or toggling terrain; closes on outside click.
- 3D Terrain toggle in the Maps menu section: enables MapLibre native terrain exaggeration (DEM from Mapterhorn via `tiles.mapterhorn.com`, terrarium encoding, PMTiles protocol) with a pre-rendered hillshade overlay from `basemap.at` (`bmapgelaende/grau`), tilts the map to 45° pitch when enabled, and returns to flat view when disabled. Terrain survives base-map style switches.

- Vitest unit test suite (`npm test`) covering `favorite-transfer.js`, `favorite-store.js`, and `LocationTracker` — 46 tests
- Playwright e2e test suite (`npm run test:e2e`) covering map page, settings page, impressum page, and inter-page navigation — 12 tests using Firefox
- `vitest.config.js` and `playwright.config.js` at project root
- `npm run test:watch` and `npm run test:coverage` scripts
- Product spec updated (v1.2): testing tools added to Tech Stack, `tests/` directory added to Architecture file structure, new Testing subsection in Non-Functional Requirements covering both suites with design rationale, two test-pass criteria added to Success Criteria

### Changed
- Refactored `src/js/maphop.js` into a thin bootstrap and extracted map-page responsibilities into focused controllers under `src/js/map/` for base-layer switching, terrain, attribution, menu state, install prompts, DOM lookup, status toast handling, and favorites UI.
- Base map definitions now live in `src/js/map/base-map-registry.js` as the single source of truth for styles and structured attribution metadata.
- Attribution rendering now uses explicit DOM node creation instead of HTML-string injection, reducing future XSS risk if provider configuration becomes user-editable.
- Unit coverage expanded to 69 tests with controller-level coverage for attribution rendering, base-layer rollback behavior, terrain lifecycle, install prompt handling, and menu state.
- Product spec updated (v1.4) to document the modular map-page architecture, code-map maintenance rule, structured attribution rendering, and updated validated test counts.

## [1.0.2] - 2026-03-28

### Added
- JSON export and import actions for favorites with a dedicated transfer module
- A dedicated settings page for favorites backup and future map source configuration
- Location follow mode: map automatically pans to keep the user centered after the initial position fix
- Heading cone now renders as a 6-band gradient, deep opaque blue at the location dot fading to near-transparent pale blue at the tip
- Service worker (`sw.js`) with network-first cache strategy enabling offline use and satisfying PWA installability requirements
- Android/Chrome install banner driven by `beforeinstallprompt` with Install and Dismiss buttons
- iOS Safari install hint ("Tap Share → Add to Home Screen") with 7-day localStorage snooze so users can install at a later time
- Content Security Policy meta tag on all three pages, explicitly allowlisting each tile provider in `connect-src` and `img-src`
- `Referrer-Policy: no-referrer` on all pages to prevent tile providers seeing the page URL
- `_headers` file for static hosting with `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Permissions-Policy`, and `X-XSS-Protection: 0`

### Changed
- Extracted all geolocation tracking, geo-math helpers, and map overlay management into a dedicated `location-tracker.js` module (`LocationTracker` class)
- Split favorites transfer logic out of the main map module into `favorite-transfer.js`
- Moved favorites import and export controls out of the live map menu and into the settings page
- Shared favorites IndexedDB access through `favorite-store.js` used by both the map page and settings page
- Unified settings and legal pages behind a shared app-style header, footer, and navigation pattern
- Refreshed product spec (`doc/spec/product-spec.md`) to cover new modules, PWA install flows, security model, and follow-mode tracking

### Fixed
- Service worker was registered at the wrong path (`/mymap/sw.js`); corrected to `/sw.js` matching the root deployment base
- Manifest `id` field was `/mymap/` but app scope is `/`; corrected for consistent PWA identity
- `[hidden]` attribute overridden by `display: flex` on install banners; added `[hidden] { display: none !important }` reset
- Hardened favorites import with strict JSON validation, 64 KB file size cap, and duplicate skipping
- Removed plain-text email exposure from the legal page; replaced with reveal-on-click obfuscated display

## [1.0.1] - 2026-03-24

### Added
- Esri Satellite imagery as a new base map option
- Version label in the menu footer, dynamically read from package.json
- Vite build system with dev server, production build, and preview commands
- GitHub Actions workflow for automated FTP deployment via lftp
- `.gitignore` for node_modules, dist, IDE files, and env files
- `CLAUDE.md` for Claude Code guidance
- New maphop app logos in `src/images/` (72, 128, 144, 192, 512px)
- Product specification document in `doc/spec/product-spec.md`

### Changed

- Updated `index.html` favicon and apple-touch-icon to use new maphop logos
- Updated `manifest.webmanifest` icons to reference new logos and include all available sizes
- Updated the mobile menu so Favorites and Maps each scroll within their own section while Location stays fixed
- Added collapsible Favorites and Maps sections in the mobile menu
- Added an Impressum/Datenschutz link to the bottom of the menu and converted `src/impressum.html` into a styled standalone legal page
- Added a `Maphop` title in the menu header that appears to the left of the hamburger button only while the menu is open
- Left-aligned the `Maphop` header title within the open menu
- Updated the Vite build config to emit both the main app page and `src/impressum.html`
