// Keeps e2e flows offline and deterministic: every third-party request is
// answered locally or aborted, so tests never hit tile or elevation providers.
const transparentPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64'
);

export const minimalStyle = {
    version: 8,
    sources: {},
    layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#dfe6e0' } }]
};

export const stubbedElevationMeters = 512;

export async function stubThirdPartyNetwork(page, { failOpenFreeMapStyle = false } = {}) {
    await page.route(url => url.protocol === 'https:', async route => {
        const url = new URL(route.request().url());
        if (url.hostname === 'tiles.openfreemap.org') {
            if (failOpenFreeMapStyle) {
                await route.fulfill({ status: 500, body: 'stubbed failure' });
            } else {
                await route.fulfill({ json: minimalStyle });
            }
        } else if (url.hostname === 'api.open-meteo.com') {
            await route.fulfill({ json: { elevation: [stubbedElevationMeters] } });
        } else if (/\.(png|jpe?g)$/i.test(url.pathname) || url.hostname.includes('tile')) {
            await route.fulfill({ contentType: 'image/png', body: transparentPng });
        } else {
            await route.abort();
        }
    });
}

export function readFavorites(page) {
    return page.evaluate(() => new Promise((resolve, reject) => {
        const request = indexedDB.open('personal-map-db');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('favoriteLocations')) {
                db.close();
                resolve([]);
                return;
            }
            const getAll = db.transaction('favoriteLocations').objectStore('favoriteLocations').getAll();
            getAll.onsuccess = () => {
                db.close();
                resolve(getAll.result);
            };
            getAll.onerror = () => reject(getAll.error);
        };
    }));
}

export async function openMenuSection(page, sectionName) {
    await page.getByRole('button', { name: 'Open map controls' }).click();
    await page.getByRole('button', { name: new RegExp(`^${sectionName}`) }).click();
}
