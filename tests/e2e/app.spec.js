import { test, expect } from '@playwright/test';

test.describe('Map page', () => {
    test('loads with the correct title', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle('Maphop Map');
    });

    test('renders the map container', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#map')).toBeAttached();
    });

    test('renders the menu toggle button', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#layerMenuButton')).toBeVisible();
    });

    test('opens the control menu when the toggle is clicked', async ({ page }) => {
        await page.goto('/');
        const toggle = page.locator('#layerMenuButton');
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });

    test('shows base map layer buttons', async ({ page }) => {
        await page.goto('/');
        await page.locator('#layerMenuButton').click();
        await expect(page.locator('[data-layer-key]').first()).toBeVisible();
    });

    test('has all expected base map layers', async ({ page }) => {
        await page.goto('/');
        await page.locator('#layerMenuButton').click();
        const layerKeys = await page.locator('[data-layer-key]').evaluateAll(
            els => els.map(el => el.dataset.layerKey)
        );
        expect(layerKeys).toContain('bergfex');
        expect(layerKeys).toContain('osm');
        expect(layerKeys).toContain('esriSatellite');
    });
});

test.describe('Settings page', () => {
    test('loads with the correct title', async ({ page }) => {
        await page.goto('/settings.html');
        await expect(page).toHaveTitle('Settings | Maphop');
    });

    test('shows the export button', async ({ page }) => {
        await page.goto('/settings.html');
        await expect(page.locator('#exportFavoritesButton')).toBeVisible();
    });

    test('shows the import button', async ({ page }) => {
        await page.goto('/settings.html');
        await expect(page.locator('#importFavoritesButton')).toBeVisible();
    });
});

test.describe('Impressum page', () => {
    test('loads with the correct title', async ({ page }) => {
        await page.goto('/impressum.html');
        await expect(page).toHaveTitle('Legal | Maphop');
    });
});

test.describe('Navigation', () => {
    test('settings link in menu navigates to settings page', async ({ page }) => {
        await page.goto('/');
        await page.locator('#layerMenuButton').click();
        await page.locator('a[href*="settings"]').first().click();
        await expect(page).toHaveURL(/settings/);
    });

    test('impressum link in menu navigates to impressum page', async ({ page }) => {
        await page.goto('/');
        await page.locator('#layerMenuButton').click();
        await page.locator('a[href*="impressum"]').first().click();
        await expect(page).toHaveURL(/impressum/);
    });
});
