import { test, expect } from '@playwright/test';
import { openMenuSection, stubThirdPartyNetwork } from './support/network.js';

test.use({ reducedMotion: 'reduce' });

const baseMapRadio = (page, label) => page.getByRole('radio', { name: new RegExp(`^${label}`) });
const storedBaseLayer = page => page.evaluate(() => localStorage.getItem('maphop-base-layer'));

test('a first visit uses OpenFreeMap Liberty', async ({ page }) => {
    await stubThirdPartyNetwork(page);
    await page.goto('/');
    await openMenuSection(page, 'Map style');

    await expect(baseMapRadio(page, 'OpenFreeMap Liberty')).toBeChecked();
});

test('the chosen base map is restored after a reload', async ({ page }) => {
    await stubThirdPartyNetwork(page);
    await page.goto('/');
    await openMenuSection(page, 'Map style');
    await baseMapRadio(page, 'OpenTopoMap').click();

    await expect.poll(() => storedBaseLayer(page)).toBe('opentopo');

    await page.reload();
    await openMenuSection(page, 'Map style');
    await expect(baseMapRadio(page, 'OpenTopoMap')).toBeChecked();
    await expect(baseMapRadio(page, 'OpenFreeMap Liberty')).not.toBeChecked();
});

test('a base map whose style fails to load reverts to the previous one', async ({ page }) => {
    await stubThirdPartyNetwork(page, { failOpenFreeMapStyle: true });
    await page.addInitScript(() => localStorage.setItem('maphop-base-layer', 'osm'));
    await page.goto('/');
    await openMenuSection(page, 'Map style');
    await expect(baseMapRadio(page, 'OpenStreetMap')).toBeChecked();

    await baseMapRadio(page, 'OpenFreeMap Liberty').click();

    await expect(page.getByText('Unable to load OpenFreeMap Liberty.')).toBeVisible();
    await expect(baseMapRadio(page, 'OpenStreetMap')).toBeChecked();
    await expect(baseMapRadio(page, 'OpenFreeMap Liberty')).not.toBeChecked();
    expect(await storedBaseLayer(page)).toBe('osm');
});
