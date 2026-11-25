import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { readFavorites } from './support/network.js';

const seededFavorite = { name: 'Seeded Peak', longitude: 14.3, latitude: 46.6, createdAt: 1712345678901, elevationMeters: 900, elevationSource: 'open-meteo' };

function writeFavorites(page, favorites) {
    return page.evaluate(records => new Promise((resolve, reject) => {
        const request = indexedDB.open('personal-map-db');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction('favoriteLocations', 'readwrite');
            const store = tx.objectStore('favoriteLocations');
            store.clear();
            records.forEach(record => store.add(record));
            tx.oncomplete = () => {
                db.close();
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        };
    }), favorites);
}

async function openSettingsWith(page, favorites) {
    await page.goto('/settings.html');
    // The page opens (and creates) the database on load; wait for that before seeding.
    await expect(page.locator('#favoritesCount')).toHaveText('0');
    await writeFavorites(page, favorites);
    await page.reload();
    await expect(page.locator('#favoritesCount')).toHaveText(String(favorites.length));
}

const status = page => page.locator('#settingsStatus');

test('exported favorites import again without duplicates', async ({ page }, testInfo) => {
    await openSettingsWith(page, [seededFavorite]);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export favorites JSON' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^maphop-favorites-\d{4}-\d{2}-\d{2}\.geojson$/);
    await expect(status(page)).toHaveText('Favorites exported as GeoJSON.');

    const exportPath = testInfo.outputPath(download.suggestedFilename());
    await download.saveAs(exportPath);
    const exported = JSON.parse(await readFile(exportPath, 'utf8'));
    expect(exported).toMatchObject({
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [14.3, 46.6] },
            properties: { name: 'Seeded Peak', elevationMeters: 900 }
        }]
    });

    await page.locator('#importFavoritesInput').setInputFiles(exportPath);
    await expect(status(page)).toHaveText('No new favorites were imported.');
    await expect(page.locator('#favoritesCount')).toHaveText('1');

    await writeFavorites(page, []);
    await page.reload();
    await expect(page.locator('#favoritesCount')).toHaveText('0');

    await page.locator('#importFavoritesInput').setInputFiles(exportPath);
    await expect(status(page)).toHaveText('Imported 1 favorites.');
    await expect(page.locator('#favoritesCount')).toHaveText('1');
    const [restored] = await readFavorites(page);
    expect(restored).toMatchObject({ name: 'Seeded Peak', longitude: 14.3, latitude: 46.6, elevationMeters: 900 });
});

test('export with no favorites tells the user instead of downloading', async ({ page }) => {
    await page.goto('/settings.html');
    await expect(page.locator('#favoritesCount')).toHaveText('0');

    let downloaded = false;
    page.on('download', () => { downloaded = true; });
    await page.getByRole('button', { name: 'Export favorites JSON' }).click();

    await expect(status(page)).toHaveText('No saved favorites to export.');
    expect(downloaded).toBe(false);
});

for (const { label, file, message } of [
    { label: 'not JSON', file: { name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{ nope') }, message: 'Selected file is not valid JSON.' },
    { label: 'not a favorites export', file: { name: 'other.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":"world"}') }, message: 'Selected file is not a valid favorites export.' },
    { label: 'not a JSON file', file: { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('[]') }, message: 'Select a JSON favorites file.' }
]) {
    test(`rejects an import that is ${label}`, async ({ page }) => {
        await openSettingsWith(page, [seededFavorite]);

        await page.locator('#importFavoritesInput').setInputFiles(file);

        await expect(status(page)).toHaveText(message);
        await expect(page.locator('#favoritesCount')).toHaveText('1');
    });
}

// Export writes `.geojson`, but the import picker only offers `.json,application/json`,
// so on some platforms (notably Android) users cannot pick their own export file.
// The import code itself accepts `.geojson`; only the `accept` attribute is missing it.
test.fixme('the import file picker offers .geojson exports', async ({ page }) => {
    await page.goto('/settings.html');
    const accept = await page.locator('#importFavoritesInput').getAttribute('accept');
    expect(accept.split(',')).toEqual(expect.arrayContaining(['.geojson', 'application/geo+json']));
});
