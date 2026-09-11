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
        await page.locator('#mapsSectionToggle').click();
        await expect(page.locator('[data-layer-key]').first()).toBeVisible();
    });

    test('opens the Routing panel from the map menu', async ({ page }) => {
        await page.goto('/');
        await page.locator('#layerMenuButton').click();
        await page.locator('#routingSectionToggle').click();
        await expect(page.locator('#routingPanel')).toBeVisible();
    });

    test('keeps a long routing list scrollable in a 200px desktop menu', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto('/');
        await page.locator('#layerMenuButton').click();
        await page.locator('#routingSectionToggle').click();
        await page.locator('#routePointsList').evaluate((list) => {
            list.hidden = false;
            list.replaceChildren(...Array.from({ length: 16 }, (_, index) => {
                const point = document.createElement('div');
                point.className = 'routing-point-row';
                point.textContent = `Waypoint ${index + 1}`;
                return point;
            }));
        });

        const layout = await page.locator('#menuShell').evaluate((menu) => {
            const content = menu.querySelector('#layerMenu');
            return {
                width: menu.getBoundingClientRect().width,
                canScroll: content.scrollHeight > content.clientHeight,
                overflowY: getComputedStyle(content).overflowY,
            };
        });

        expect(layout.width).toBe(200);
        expect(layout.canScroll).toBe(true);
        expect(layout.overflowY).toBe('auto');
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
