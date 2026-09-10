# Maphop PWA — Security Review

**Date:** 2026-09-10
**Scope:** `src/` application code, build/deploy pipeline, dependencies, live deployment at `https://maphop.eu`
**Baseline:** `a47c928` (*fix: harden browser and deployment security*) — this review verifies that commit and closes out the remaining open items.

---

## 1. Summary

| Severity | Count | Status |
|----------|-------|--------|
| High | 1 | Mitigated in repo; **host config still required** |
| Medium | 2 | 1 fixed, 1 needs provider-side key restrictions |
| Low | 3 | 2 fixed, 1 accepted and documented |
| Informational | 2 | 1 fixed, 1 non-blocking |
| Verified good | 8 | — |

The application code itself is in good shape: no `innerHTML` in shipped code, validated imports, opt-in geolocation, a tight `default-src 'none'` CSP, and clean production dependencies. The remaining risk is concentrated in **deployment configuration** — the security headers the project believes it ships are not actually served — and in **secrets that are unavoidably public** in a static client-side build.

---

## 2. Findings

### H-1 — Production security headers are not served (High)

`src/public/_headers` uses Netlify/Cloudflare Pages syntax, but deployment is an `lftp` mirror to Apache-style shared hosting (`.github/workflows/deploy.yml` → `maphop.eu:/public_html/`). The host ignores the file and serves it as a static asset instead.

Verified against the live site:

```
$ curl -sSI https://maphop.eu/
HTTP/2 200
date: ...
content-type: text/html
server: HTTP Server
        # no strict-transport-security
        # no x-content-type-options
        # no x-frame-options
        # no referrer-policy
        # no permissions-policy

$ curl -s -o /dev/null -w "%{http_code}" https://maphop.eu/_headers
200        # the header config is itself publicly readable
```

Impact:

- **Clickjacking** — `X-Frame-Options: DENY` is absent, and `frame-ancestors` cannot be set from a `<meta>` CSP (browsers ignore it there). Every page, including `settings.html` with its PocketBase login form, can be framed by any origin.
- **No HSTS** — `http://maphop.eu` does 301 to HTTPS, but the first request stays strippable.
- **No `nosniff`** — MIME confusion on the FTP-mirrored assets.
- **`Permissions-Policy` unenforced** — geolocation restriction relies on the meta CSP alone.

**Status: partially remediated.** The host runs **nginx**, so no repo-tracked drop-in file (`_headers`, `.htaccess`) can ever apply — nginx reads only its own server config, and the deploy pipeline mirrors files into `public_html/` without touching it. Actions taken:

- Deleted `src/public/_headers` — it never worked and was publicly readable.
- Added `doc/deploy/nginx-security-headers.conf` with the exact directive block to paste into the `server { … }` block for `maphop.eu` (or the hosting panel's custom-headers field): `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'`, `Referrer-Policy`, `Permissions-Policy`.

**Remaining owner action (outside this repo):** apply that block on the nginx host, reload, and re-verify:

```
curl -sSI https://maphop.eu/ | grep -iE 'strict-transport|x-content-type|x-frame|referrer|permissions|content-security'
```

Until that lands, the clickjacking and HSTS exposure above stays open — it is not fixable from application code, because `frame-ancestors` is ignored in a `<meta>` CSP. If the header block cannot be applied, the fallback is a JS frame-buster on `settings.html`; that has not been added, since it is strictly weaker and should not be needed.

### M-1 — Tile and routing API keys are embedded in the public bundle (Medium)

`vite.config.js` inlines `VITE_THUNDERFOREST_API_KEY` and `VITE_OPENROUTESERVICE_API_KEY` via `define`. Both key values were confirmed present in plaintext in `dist/assets/main-*.js`. The OpenRouteService key is additionally sent as an `Authorization` header from the browser (`src/js/map/routing-controller.js:237`).

This is inherent to a static client-only PWA — the keys cannot be hidden without a server-side proxy. The exposure is *quota and billing abuse*, not data disclosure.

**Recommendation (defence in depth, no code change):**

1. Restrict both keys provider-side to the `maphop.eu` origin/referrer and set usage quotas + alerts.
2. Treat them as public credentials: rotate on any suspicion, never reuse them elsewhere.
3. Record the accepted risk in the product spec so it is not mistaken for a leak later.
4. `.env` also carries an unused `OPENROUTE_SERVICE_API_KEY` (no `VITE_` prefix, referenced nowhere). Delete it — a stray unused secret is a rotation liability.
5. The keys must reach the CI build as repository secrets (see M-1a). Storing them there does not change the exposure — the built bundle is public either way — but it does mean the secrets now exist in two places (GitHub Actions and the local `.env`), so rotation has to cover both.

### M-1a — CI built without the API keys, silently disabling routing (Medium, functional)

Found while validating M-1. `.env` is correctly gitignored, and the deploy workflow's `npm run build` step passed **no** `VITE_*` environment variables, so `loadEnv()` in `vite.config.js` resolved nothing and `define` inlined an empty string. The failure is silent: the build succeeds, and `requestRoute()` returns early on `!apiKey` without any user-visible error beyond the routing panel's fallback copy.

Reproduced against production:

```
$ curl -s https://maphop.eu/assets/main-DFoRhSTj.js | grep -o 'apiKey:``'
apiKey:``
# routing panel on maphop.eu reports:
#   "Routing preview is ready. Add an API key to calculate routes."
# zero requests to api.openrouteservice.org
```

The same gap disabled the Thunderforest transport layer. Verified working in a local dev server and a local production build (`POST /v2/directions/foot-walking/geojson` → 200), which confirms the application code is correct and the defect is purely deployment configuration.

**Fixed in the repo:** the build step now receives `VITE_THUNDERFOREST_API_KEY` and `VITE_OPENROUTESERVICE_API_KEY` from repository secrets (`process.env` takes precedence over `.env` files in Vite's `loadEnv`, verified with a probe build). **Owner action:** add both as GitHub repository secrets, or routing stays disabled in production.

### M-1b — FTPS certificate verification was disabled on the deploy path (Medium)

`a47c928` turned on `ssl:verify-certificate true`; the deploy then failed and it was reverted to `false` in `2b42793`. Diagnosing the actual failure:

```
$ openssl s_client -connect maphop.eu:21 -starttls ftp -servername maphop.eu
depth=0 CN = *.your-server.de
issuer= C = US, O = DigiCert Inc, CN = Thawte TLS RSA CA G1
Verify return code: 0 (ok)
```

The certificate is valid and publicly trusted — it simply does not cover `maphop.eu`, so lftp's **hostname** check failed. With verification off, the FTPS session is encrypted but unauthenticated: an active network attacker can present any certificate and capture the deploy credentials or substitute the uploaded site content.

**Fixed in the repo:** the deploy now connects to the hostname the certificate actually covers, supplied as an `FTP_HOST` secret, with `ssl:verify-certificate true` restored. The step fails fast with a clear message if the secret is missing rather than silently falling back. **Owner action:** set `FTP_HOST` to the server's `*.your-server.de` hostname from the hosting panel.

### M-2 — Seven known vulnerabilities in build dependencies (Medium)

```
$ npm audit --omit=dev   →  0 vulnerabilities   (runtime deps clean)
$ npm audit              →  7 vulnerabilities (3 moderate, 4 high)
```

| Package | Severity | Issue |
|---------|----------|-------|
| `vite` 8.0.0–8.0.15 | High | Path traversal in optimized-deps `.map`; `server.fs.deny` bypasses; arbitrary file read via dev-server WebSocket |
| `undici` 7.0.0–7.28.0 | High | TLS validation bypass via SOCKS5, header/cookie injection, cache poisoning |
| `postcss` ≤8.5.22 | High | `sourceMappingURL` path traversal → arbitrary `.map` disclosure |

**Resolved:** `npm audit fix` applied — `npm audit` now reports 0 vulnerabilities. Vite moved 8.0.15 → 8.3.0 inside the existing `^8.0.2` range (lockfile change only); 115/115 unit tests and `npm run build` both still pass.

Nothing here ships to users, but the Vite dev-server issues are exploitable by a malicious page while `npm run dev` is running, and all three land in CI. All are fixed by `npm audit fix`. Several are already open as Dependabot branches on the remote (`vite-8.0.16`, `undici-7.29.0`, `postcss-8.5.25`, `nanoid-3.3.18`, `protocol-buffers-schema-3.6.1`) — merge or close them so the queue does not mask a future real alert.

### L-1 — Product spec understates data flows (Low)

`doc/spec/product-spec.md:516` states **"No analytics or tracking scripts."** All three shipped pages load Umami from `https://analytics.gomogi.com/script.js`. The Impressum discloses this correctly (`src/impressum.html:112`), so the legal page is right and the spec is stale — but the spec is what future changes are reviewed against.

**Recommendation:** correct the Privacy section to state that self-hosted, cookieless Umami analytics is loaded on all pages, matching the Impressum wording.

### L-2 — CSP inconsistency across pages (Low)

`src/impressum.html` omits `form-action 'self'`, which `index.html` and `settings.html` both set. There is no form on the page today, so this is hardening drift rather than an active hole — but it should be uniform. `frame-ancestors` is missing everywhere and can only be fixed by H-1.

### L-3 — PocketBase auth token stored in `localStorage` (Low)

`src/js/favorite-cloud-store.js` uses the PocketBase SDK default `authStore`, which persists the JWT in `localStorage` where any script on the origin can read it. The device ID (`maphop-pocketbase-device-id`) sits alongside it.

This is the standard PocketBase browser pattern and the practical alternative (httpOnly cookie) needs server-side support. Residual risk is low here because the CSP is strict (`default-src 'none'`, no `unsafe-inline` scripts, no third-party script hosts beyond Umami) and the codebase uses no `innerHTML`. **Accept and document**, and keep the server-side controls the spec already requires (exact CORS origins, auth rate limiting, per-user collection rules) verified on the PocketBase instance.

### I-1 — Unbuilt `mapterhorn-index.html` carries weaker patterns (Informational)

`src/mapterhorn-index.html` has no CSP, loads a remote image from `mapterhorn.github.io`, and is the one file using `innerHTML` (line 128). It is **not** a Vite `rollupOptions.input` entry and is confirmed absent from `dist/`, so it never reaches production. It is dead reference code that will eventually be mistaken for shipped code.

**Recommendation:** delete it, or move it next to `temp.js` as explicitly-labelled reference material.

### I-2 — Documentation drift (Informational)

`doc/spec/product-spec.md` cites 111 unit tests across 15 files; the suite is now 115 tests across 16 files (all passing). Line 73 describes `_headers` as "Security headers (Netlify-compatible)" — accurate as written, which is exactly why H-1 went unnoticed.

---

## 3. Verified good

| Area | Result |
|------|--------|
| Runtime dependencies | `npm audit --omit=dev` → 0 vulnerabilities (MapLibre 6.4.1, PMTiles 4.4.0, PocketBase 0.27.3) |
| Secrets in git | `.env` / `.env.local` never committed; no key material anywhere in history; `.gitignore` covers `.env*`, `*.pem`, `*.key`, `*.pfx`, `*.p12`, `secrets/` |
| Deploy transport | FTPS enforced with `ssl:verify-certificate true`, `ftp:ssl-force true`, `ftp:ssl-protect-data yes`; credentials via GitHub secrets, never echoed |
| HTTPS | `http://maphop.eu` → 301 → `https://maphop.eu` |
| CSP baseline | `default-src 'none'` with explicit per-directive allowlists on all three shipped pages; `object-src 'none'`, `base-uri 'self'`; no `unsafe-inline` for scripts; `blob:` removed from `script-src`/`connect-src` in `a47c928` |
| DOM safety | No `innerHTML` / `document.write` / `eval` / `new Function` in shipped code; user data rendered via `textContent` and explicit element creation |
| External links | All `target="_blank"` links carry `rel="noopener"` |
| Service worker | Same-origin GET only; network-first with cache fallback; registration gated on `import.meta.env.PROD` **and** `window.isSecureContext`; old caches purged on activate |
| Import validation | 64 KB cap, JSON parse guard, coordinate range check, 250-record and 80-char limits, duplicate skipping |
| Tests | 115/115 unit tests pass |

---

## 4. Remediation plan

| # | Action | Finding | Status |
|---|--------|---------|--------|
| 1 | Remove dead `_headers`; add `doc/deploy/nginx-security-headers.conf` | H-1 | **Done** |
| 2 | Apply that header block on the nginx host and re-verify with `curl -I` | H-1 | **Open — owner action, off-repo** |
| 3 | `npm audit fix` → 0 vulnerabilities (vite 8.0.15 → 8.3.0, undici and postcss transitives; lockfile only) | M-2 | **Done** |
| 4 | Merge or close the five stale Dependabot branches on the remote | M-2 | **Open — owner action** |
| 5 | Restrict Thunderforest + ORS keys to the `maphop.eu` referrer, set quotas/alerts | M-1 | **Open — provider-side, off-repo** |
| 6 | Drop the unused `OPENROUTE_SERVICE_API_KEY` from `.env` | M-1 | **Open — `.env` is untracked, owner edits locally** |
| 7 | Correct the spec's analytics claim; document the public-key and `localStorage` accepted risks; fix the headers row | L-1, L-3, I-2 | **Done** |
| 8 | Add `form-action 'self'` to `impressum.html` | L-2 | **Done** |
| 9 | Delete or relabel `src/mapterhorn-index.html` | I-1 | **Open — not deployed, non-blocking** |

**Sign-off condition:** item 2 is the only remaining item that changes the live security posture. Everything fixable inside the repository has landed.
