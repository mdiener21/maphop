# Maphop rules

## Structure and patterns

- Local-first map PWA: vanilla JavaScript ES modules, MapLibre GL JS, PMTiles, optional PocketBase backup; Vite builds `src/` into `dist/`. Use pnpm (lockfile committed); CI uses Node 24.
- Before changing an area, use `doc/architecture/code-map.md` to find its owner, then read the relevant source and tests. Update the index when ownership moves.
- `src/js/maphop.js` is the map bootstrap. Put map features in `src/js/map/`; centralize map-page DOM lookups in `map/dom.js`. Settings and legal pages have separate HTML/JS entry points; `page-shell.js` shares title/version wiring.
- Follow `create*Controller({ map, ...deps })` factories with injected dependencies and small helpers. Example: `src/js/map/base-layer-controller.js`, tested through its public interface in `tests/unit/base-layer-controller.test.js` using a fake map.
- Use `const` by default, camelCase, explicit `.js` import extensions, and 4-space indentation in application JS. Keep DOM lookups near the top and listener wiring near the bottom.
- Favorites persistence is in `favorite-store.js`; import/export validation in `favorite-transfer.js`; elevation selection in `favorite-elevation.js`; optional remote backup in `favorite-cloud-store.js`.

## Commands and verification

- Install: `pnpm install`. Develop: `pnpm dev`. Build: `pnpm build`. Preview: `pnpm preview`.
- Before calling a change done, run `pnpm test` and `pnpm build`.
- Unit tests: Vitest + jsdom in `tests/unit/**/*.test.js`; focused run: `pnpm vitest run tests/unit/base-layer-controller.test.js`. Coverage: `pnpm test:coverage`. IndexedDB tests use `fake-indexeddb`.
- Browser flows (`tests/e2e/`, `playwright.config.js`): `pnpm test:e2e` runs every spec in **both Firefox and Chromium** against the Vite dev server on port 5173, which it starts automatically (or reuses if one is running).
  - One browser: `pnpm test:e2e --project=firefox` or `pnpm test:e2e --project=chromium`.
  - One file: `pnpm exec playwright test tests/e2e/favorites.spec.js --project=firefox`. Debug with `--headed` or `--ui`.
  - Browsers: after installing or upgrading `@playwright/test`, run `pnpm exec playwright install firefox chromium`. A "browserType.launch: Executable doesn't exist" error means this step was skipped. On WSL2/Linux, Chromium also needs `pnpm exec playwright install-deps chromium` (otherwise `libnspr4.so` is missing); use `--project=firefox` if you cannot install system packages.
  - Workers are capped at 2 because MapLibre renders with software WebGL in headless browsers; more parallel pages time out. Don't raise it to speed things up.
  - Specs stub all third-party HTTPS (tiles, OpenFreeMap style, Open-Meteo) via `tests/e2e/support/network.js`; keep new specs offline the same way. The map instance isn't exposed, so assert through the DOM, `localStorage` and IndexedDB.
- Build/worker/route rendering: `pnpm test:e2e:production` (`tests/production/`, `playwright.production.config.js`) uses **Chromium only** against a **local production build** on port 4174, blocks service workers, and supplies a fake routing key. Its isolated build goes to `.playwright/production-dist`, not deployable `dist/`.
- Test observable controller behavior with fake maps and injected dependencies; use existing tests as patterns. No lint or type-check script is configured.

## Gotchas and boundaries

- Style changes discard custom sources/layers. Restore terrain, location, favorites, and routes through the style-ready hooks in `maphop.js`; preserve base-layer timeout and rollback behavior.
- `baseMapConfigs` in `map/base-map-registry.js` owns provider definitions. Add a matching `data-layer-key` button in `src/index.html` for a new provider. Keep attribution structured and DOM-rendered; use safe text rendering for user data.
- Preserve MapLibre's explicit bundled worker URL (`?worker&url` in `maphop.js`): the default sibling worker URL is absent from the production build.
- IndexedDB `personal-map-db` / `favoriteLocations` is the local source of truth. Keep cloud backup opt-in and authenticated, with sign-in on Settings. Geolocation is opt-in; keep location data on-device apart from explicitly requested external features.
- Routing sends points to OpenRouteService; elevation lookup can contact Open-Meteo; tile providers receive map requests. Preserve provider attribution and privacy disclosures when changing integrations.
- Service worker registration is production-only in a secure context. `src/public/sw.js` caches same-origin app assets; cross-origin tiles bypass it. Preserve that provider-cache policy.
- Vite's base is `./`, but manifest scope/start URL and service worker registration use `/`. Coordinate all three for deployment-path changes. Only index, settings, and impressum are build inputs; `src/mapterhorn-index.html` is an experiment.
- `VITE_THUNDERFOREST_API_KEY` and `VITE_OPENROUTESERVICE_API_KEY` are public client keys inlined at build time. A build can succeed with empty keys and broken provider features. Keep `.env` files and secret credentials out of commits/client code; use referrer restrictions for public keys.
- Ask before adding runtime dependencies.

## Workflow and deeper context

- Before feature or behavior changes, propose the relevant update to `doc/spec/product-spec.md` and obtain user approval; keep the spec aligned with shipped behavior.
- After every change, add an entry under `CHANGELOG.md` → `[Unreleased]` using Added / Changed / Fixed / Removed.
- For issue work, use GitHub Issues on `mdiener21/maphop` via `gh`: specs are parent issues, tickets are native sub-issues with blocked-by links; agent-ready tickets use `ready-for-agent` plus `enhancement` or `bug`.
- For releases, read `doc/releasing.md`. Pushing to `main` triggers automatic versioning and deployment; follow the release workflow rather than manually bumping versions.
