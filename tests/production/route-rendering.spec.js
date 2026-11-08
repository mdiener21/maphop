import { test, expect } from '@playwright/test';

test('production build paints the route red with a white outline', async ({ page }) => {
    // Keep the real WebGL renderer and worker, but retain pixels for inspection.
    await page.addInitScript(() => {
        const getContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, options) {
            return getContext.call(this, type, type.startsWith('webgl')
                ? { ...options, preserveDrawingBuffer: true }
                : options);
        };
    });
    // Isolate rendering from tile providers, analytics, and the routing service.
    await page.route(url => url.protocol === 'https:', async route => {
        const url = new URL(route.request().url());
        if (url.hostname === 'api.openrouteservice.org') {
            const { coordinates } = route.request().postDataJSON();
            await route.fulfill({ json: {
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates },
                    properties: { summary: { distance: 1200, duration: 600 } },
                }],
            } });
        } else if (url.hostname === 'tile.openstreetmap.org') {
            await route.fulfill({
                contentType: 'image/png',
                body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
            });
        } else {
            await route.abort();
        }
    });

    await page.goto('/');
    await page.locator('#layerMenuButton').click();
    await page.locator('#routingSectionToggle').click();
    await page.locator('#routeStartButton').click();
    await page.locator('#map').click({ position: { x: 400, y: 360 } });
    await page.locator('#routeDestinationButton').click();
    await page.locator('#map').click({ position: { x: 900, y: 360 } });
    await expect(page.locator('#routeDistance')).toHaveText('Distance: 1.2 km');

    // Sample the canvas between the endpoint markers: red center, white casing,
    // and the dark tile outside the casing. DOM markers cannot satisfy this.
    await expect.poll(() => page.locator('.maplibregl-canvas').evaluate(canvas => {
        const copy = document.createElement('canvas');
        copy.width = canvas.width;
        copy.height = canvas.height;
        const context = copy.getContext('2d');
        context.drawImage(canvas, 0, 0);
        const pixel = y => Array.from(context.getImageData(650, y, 1, 1).data);
        const red = ([r, g, b, a]) => Math.abs(r - 220) < 3 && Math.abs(g - 48) < 3 && Math.abs(b - 48) < 3 && a === 255;
        const white = ([r, g, b, a]) => r > 230 && g > 230 && b > 230 && a === 255;
        return red(pixel(360)) && white(pixel(356)) && white(pixel(364))
            && !white(pixel(352)) && !white(pixel(368));
    }), { message: 'the map canvas should contain the red route and its white outline' }).toBe(true);
});
