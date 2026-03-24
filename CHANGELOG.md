# Changelog

## [Unreleased]

### Added
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
