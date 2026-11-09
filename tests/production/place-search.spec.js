import { test, expect } from '@playwright/test';

for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
    test(`menu place search selects and retains a result at ${viewport.width}px`, async ({ page }) => {
        await page.setViewportSize(viewport);
        let searches = 0;
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.route(url => url.protocol === 'https:', async route => {
            const url = new URL(route.request().url());
            if (url.pathname === '/geocode/search') {
                searches += 1;
                expect(url.searchParams.get('text')).toBe('WU Wien');
                expect(url.searchParams.get('sources')).toBe('openstreetmap');
                expect(route.request().headers().authorization).toBe('route-rendering-test');
                await route.fulfill({ json: { features: [{
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [16.408, 48.213] },
                    properties: { name: 'Wirtschaftsuniversität Wien', label: 'Wirtschaftsuniversität Wien, Welthandelsplatz 1, Wien' }
                }] } });
            } else if (url.hostname === 'tile.openstreetmap.org') {
                await route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64') });
            } else await route.abort();
        });

        await page.goto('/');
        const input = page.getByRole('searchbox', { name: 'Search places' });
        await expect(input).toBeHidden();
        await page.locator('#layerMenuButton').click();
        await expect(input).toBeVisible();
        await expect(input).not.toBeFocused();
        await expect(input).toHaveJSProperty('clientHeight', 44);
        await input.fill('WU Wien');
        expect(searches).toBe(0);
        await input.press('Enter');
        const result = page.getByRole('button', { name: 'Wirtschaftsuniversität Wien Welthandelsplatz 1, Wien' });
        await expect(result).toBeVisible();
        await page.screenshot({ path: `test-results/place-search-${viewport.width}.png` });
        await input.press('Tab');
        await expect(page.getByRole('button', { name: 'Clear search' })).toBeFocused();
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await expect(result).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(input).toBeHidden();
        await expect(page.locator('#layerMenuButton')).toBeFocused();
        const pin = page.locator('.search-location-marker');
        await expect(pin).toBeVisible();
        await expect(pin).toHaveAttribute('title', 'Wirtschaftsuniversität Wien');
        await expect(page.locator('#attributionText')).toContainText('Search by openrouteservice');

        await page.locator('#layerMenuButton').click();
        await expect(input).toHaveValue('WU Wien');
        await expect(result).toBeVisible();
        await result.click();
        await expect(pin).toHaveCount(1);
        await page.locator('#layerMenuButton').click();
        await page.locator('#locationSectionToggle').click();
        await expect(input).toBeHidden();
        await page.locator('#menuBackButton').click();
        await expect(input).toBeVisible();
        await page.getByRole('button', { name: 'Clear search' }).click();
        await expect(input).toHaveValue('');
        await expect(input).toBeFocused();
        await expect(pin).toHaveCount(0);
        await expect(result).toHaveCount(0);
        await expect(page.locator('#placeSearchStatus')).toBeEmpty();
        await expect(page.locator('#attributionText')).not.toContainText('Search by openrouteservice');
        await expect(page.getByRole('button', { name: 'Clear search' })).toBeHidden();
        expect(searches).toBe(1);
        expect(errors).toEqual([]);
    });
}
