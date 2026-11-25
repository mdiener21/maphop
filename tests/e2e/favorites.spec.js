import { test, expect } from '@playwright/test';
import { openMenuSection, readFavorites, stubbedElevationMeters, stubThirdPartyNetwork } from './support/network.js';

test.use({ reducedMotion: 'reduce' });

test.beforeEach(async ({ page }) => {
    await stubThirdPartyNetwork(page);
});

test('adds a favorite at the crosshair, keeps it after reload, and deletes it', async ({ page }) => {
    await page.goto('/');
    await openMenuSection(page, 'Saved places');
    await page.getByRole('button', { name: 'Add favorite' }).click();

    await expect(page.locator('#favoriteSelectionOverlay')).toBeVisible();
    await page.getByRole('button', { name: 'Save This Spot' }).click();

    const dialog = page.getByRole('dialog', { name: 'Name this location' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('textbox', { name: 'Favorite name' }).fill('E2E Spot');
    await dialog.getByRole('button', { name: 'Save Favorite' }).click();

    await expect(page.getByText('Saved E2E Spot.')).toBeVisible();
    await expect(dialog).toBeHidden();

    const [saved] = await readFavorites(page);
    expect(saved).toMatchObject({
        name: 'E2E Spot',
        longitude: 14.268,
        latitude: 46.59026,
        elevationMeters: stubbedElevationMeters,
        elevationSource: 'open-meteo'
    });

    await page.reload();
    await openMenuSection(page, 'Saved places');
    await expect(page.locator('.favorite-item', { hasText: 'E2E Spot' })).toBeVisible();

    await page.getByRole('button', { name: 'Delete E2E Spot' }).click();
    await expect(page.locator('.favorite-item', { hasText: 'E2E Spot' })).toHaveCount(0);
    expect(await readFavorites(page)).toEqual([]);
});

test('cancelling the crosshair or the naming dialog saves nothing', async ({ page }) => {
    await page.goto('/');
    await openMenuSection(page, 'Saved places');
    await page.getByRole('button', { name: 'Add favorite' }).click();
    await page.locator('#favoriteSelectionOverlay').getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('#favoriteSelectionOverlay')).toBeHidden();

    await openMenuSection(page, 'Saved places');
    await page.getByRole('button', { name: 'Add favorite' }).click();
    await page.getByRole('button', { name: 'Save This Spot' }).click();
    const dialog = page.getByRole('dialog', { name: 'Name this location' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    expect(await readFavorites(page)).toEqual([]);
});
