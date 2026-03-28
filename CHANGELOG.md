# Changelog

## [Unreleased]

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
