import { test, expect } from '@playwright/test';
import { readFavorites, stubThirdPartyNetwork } from './support/network.js';

test.use({ reducedMotion: 'reduce' });

test.beforeEach(async ({ page }) => {
    await stubThirdPartyNetwork(page);
});

const banner = page => page.locator('#sharedLocationBanner');
const sharedPin = page => page.locator('.maplibregl-marker');

test('a shared link pins the location and can be saved as a favorite', async ({ page }) => {
    await page.goto('/?lat=48.2&lng=16.37&z=13');

    await expect(banner(page)).toBeVisible();
    await expect(banner(page)).toContainText('Shared location pinned on map.');
    await expect(sharedPin(page)).toHaveCount(1);

    await banner(page).getByRole('button', { name: 'Add to Favorites' }).click();
    await expect(banner(page)).toBeHidden();
    await expect(sharedPin(page)).toHaveCount(0);

    const dialog = page.getByRole('dialog', { name: 'Name this location' });
    await dialog.getByRole('textbox', { name: 'Favorite name' }).fill('Shared Vienna');
    await dialog.getByRole('button', { name: 'Save Favorite' }).click();
    await expect(page.getByText('Saved Shared Vienna.')).toBeVisible();

    const [saved] = await readFavorites(page);
    expect(saved).toMatchObject({ name: 'Shared Vienna', latitude: 48.2, longitude: 16.37 });
});

test('dismissing a shared link removes the banner and pin', async ({ page }) => {
    await page.goto('/?lat=48.2&lng=16.37');
    await expect(banner(page)).toBeVisible();

    await page.getByRole('button', { name: 'Dismiss shared location' }).click();

    await expect(banner(page)).toBeHidden();
    await expect(sharedPin(page)).toHaveCount(0);
    expect(await readFavorites(page)).toEqual([]);
});

for (const search of ['', '?lat=999&lng=16.37', '?lat=abc&lng=def', '?lat=48.2']) {
    test(`no shared banner for "${search || 'no params'}"`, async ({ page }) => {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));

        await page.goto(`/${search}`);
        await expect(page.locator('.maplibregl-canvas')).toBeVisible();

        await expect(banner(page)).toBeHidden();
        await expect(sharedPin(page)).toHaveCount(0);
        expect(errors).toEqual([]);
    });
}
