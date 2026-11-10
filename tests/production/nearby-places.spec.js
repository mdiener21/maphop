import { test, expect } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

for (const width of [320, 390, 768, 1024, 1440]) {
    const viewport = { width, height: 844 };
    test(`map clicks inspect nearby places and respect selection modes at ${viewport.width}px`, async ({ page }) => {
        await page.setViewportSize(viewport);
        let searches = 0;
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route(url => url.protocol === 'https:', async route => {
            const url = new URL(route.request().url());
            if (url.pathname === '/geocode/reverse') {
                searches += 1;
                expect(url.searchParams.get('boundary.circle.radius')).toBe('0.1');
                const coordinates = [Number(url.searchParams.get('point.lon')), Number(url.searchParams.get('point.lat'))];
                await route.fulfill({ json: { features: [{
                    type: 'Feature', geometry: { type: 'Point', coordinates },
                    properties: { name: 'Campus café', label: 'Campus café, Welthandelsplatz 1, Wien', distance: 0.037 }
                }] } });
            } else if (url.pathname.startsWith('/v2/directions/')) {
                const { coordinates } = route.request().postDataJSON();
                await route.fulfill({ json: { features: [{
                    type: 'Feature', geometry: { type: 'LineString', coordinates },
                    properties: { summary: { distance: 1200, duration: 600 } }
                }] } });
            } else if (url.hostname === 'tile.openstreetmap.org') {
                await route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64') });
            } else await route.abort();
        });

        await page.goto('/');
        const canvas = page.locator('.maplibregl-canvas');
        await expect(canvas).toBeVisible();
        await canvas.click({ position: { x: viewport.width >= 700 ? 450 : 100, y: 200 } });
        const panel = page.getByRole('region', { name: 'Nearby places' });
        await expect(panel).toContainText('Campus café');
        await expect(panel).toContainText('Welthandelsplatz 1, Wien');
        await expect(panel).toContainText('37 m away');
        await expect(panel).toContainText('openrouteservice');
        const panelBounds = await page.locator('.nearby-places').boundingBox();
        expect(panelBounds.x).toBeGreaterThanOrEqual(0);
        expect(panelBounds.x + panelBounds.width).toBeLessThanOrEqual(viewport.width);
        expect(panelBounds.y + panelBounds.height).toBeGreaterThanOrEqual(viewport.height - 20);
        if (viewport.width >= 700) {
            expect(panelBounds.x).toBe(0);
            expect(panelBounds.y).toBe(0);
            expect(panelBounds.height).toBe(viewport.height);
            expect(panelBounds.width).toBeLessThanOrEqual(360);
            const recenter = await page.locator('#reCenterButton').boundingBox();
            if (recenter) expect(recenter.x).toBeGreaterThan(panelBounds.width);
        } else {
            expect(panelBounds.width).toBe(viewport.width);
            expect(panelBounds.y).toBeGreaterThan(viewport.height / 2);
        }
        await expect(page.locator('.nearby-places-popup')).toHaveCount(0);
        await page.screenshot({ path: `test-results/nearby-places-${viewport.width}.png` });
        await page.locator('.search-location-marker').click();
        expect(searches).toBe(1);
        await canvas.click({ position: { x: viewport.width >= 700 ? 450 : 100, y: 110 } });
        await expect.poll(() => searches).toBe(2);
        await expect(panel).toBeVisible();
        await expect(page.locator('.search-location-marker')).toHaveCount(1);

        await page.getByRole('button', { name: 'Clear nearby places' }).click();
        await expect(panel).toBeHidden();
        await expect(page.locator('.search-location-marker')).toHaveCount(0);
        await expect(canvas).toBeFocused();
        await canvas.click({ position: { x: 100, y: 200 } });
        await expect.poll(() => searches).toBe(3);

        await page.locator('#layerMenuButton').click();
        const menu = page.getByRole('region', { name: 'Map controls' });
        const menuBounds = await menu.boundingBox();
        if (viewport.width >= 700) {
            expect(menuBounds.y).toBe(0);
            expect(menuBounds.height).toBe(viewport.height);
            expect(menuBounds.x + menuBounds.width).toBe(viewport.width);
            expect(menuBounds.x).toBeGreaterThan(panelBounds.width);
            const credits = await page.locator('#attributionWidget').boundingBox();
            expect(credits.x).toBeGreaterThanOrEqual(panelBounds.width);
            expect(credits.x + credits.width).toBeLessThanOrEqual(menuBounds.x);
            const location = await page.locator('#mapLocationToggleButton').boundingBox();
            expect(location.y + location.height).toBeLessThan(credits.y);
        }
        await page.screenshot({ path: `test-results/docked-panels-${viewport.width}.png` });
        await page.getByRole('button', { name: 'Clear search' }).click();
        await expect(panel).toBeHidden();
        await expect(page.locator('.search-location-marker')).toHaveCount(0);
        await page.locator('#routingSectionToggle').click();
        await page.locator('#routeStartButton').click();
        await canvas.click({ position: { x: 100, y: 200 } });
        await expect(page.locator('#routeStartButton')).not.toContainText('Tap to select');
        expect(searches).toBe(3);
        await expect(panel).toBeHidden();
        await page.locator('#routeDestinationButton').click();
        await canvas.click({ position: { x: 260, y: 200 } });
        await expect(page.locator('#routeSummary')).toBeVisible();
        await canvas.click({ position: { x: 70, y: 110 } });
        await expect(panel).toBeVisible();
        await expect(page.locator('#routeSummary')).toBeHidden();
        await page.getByRole('button', { name: 'Close nearby places' }).click();
        await expect(panel).toBeHidden();
        await expect(page.locator('#routeSummary')).toBeVisible();
        await expect(page.locator('#routeSummaryDistance')).toHaveText('1.2 km');
        await page.locator('#layerMenuButton').click();
        await page.locator('#routingSectionToggle').click();
        await page.locator('#closeRoutingButton').click();
        await page.locator('#menuBackButton').click();
        await page.locator('#favoritesSectionToggle').click();
        await page.locator('#saveFavoriteButton').click();
        await expect(page.locator('#favoriteSelectionOverlay')).toBeVisible();
        await canvas.click({ position: { x: 100, y: 150 } });
        expect(searches).toBe(4);
        await expect(panel).toBeHidden();
        await page.locator('#cancelFavoriteSelectionButton').click();
        expect(errors).toEqual([]);
    });
}
