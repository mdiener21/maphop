# Changelog

## [Unreleased]

### Added
- JSON export and import actions for favorites with a dedicated transfer module
- A dedicated settings page for favorites backup and future map source configuration
- Location follow mode: map automatically pans to keep the user centered after the initial position fix
- Heading cone now renders as a 6-band gradient, deep opaque blue at the location dot fading to near-transparent pale blue at the tip

### Changed
- Reviewed and refreshed the product spec to match the current modular architecture, settings page, and seven built-in map providers
- Added repository guidance that `doc/spec/product-spec.md` must be updated alongside `CHANGELOG.md` for shipped product and architecture changes
- Extracted all geolocation tracking, geo-math helpers, and map overlay management into a dedicated `location-tracker.js` module (`LocationTracker` class) to improve readability and modularity

### Changed
- Split favorites transfer logic out of the main map module to keep the app architecture smaller and easier to maintain
- Moved favorites import and export controls out of the live map menu and into the new settings page
- Shared favorites IndexedDB access through a dedicated storage module used by both the map page and settings page
- Unified settings and legal pages behind a shared app-style header, footer, navigation pattern, and shared version display

### Fixed
- Hardened favorites import with strict JSON validation, a 64 KB file size cap, and duplicate skipping during IndexedDB import
- Removed plain-text email exposure from the legal page and switched contact addresses to a reveal-on-click pattern
- Changed the legal-page email reveal to show an obfuscated code-style contact string instead of the exact address

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
