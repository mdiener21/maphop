import { describe, expect, it } from "vitest";
import { buildSharedLocationUrl, parseSharedLocationFromUrl } from "../../src/js/map/share-location.js";

describe("share-location", () => {
    it("builds a share URL with rounded coordinates and zoom", () => {
        const url = buildSharedLocationUrl(
            {
                latitude: 46.5902612,
                longitude: 14.2680049,
                zoom: 15.126
            },
            "https://maphop.app/?foo=bar"
        );

        expect(url).toBe("https://maphop.app/?foo=bar&lat=46.590261&lng=14.268005&z=15.13");
    });

    it("parses shared coordinates and zoom from a URL", () => {
        const sharedLocation = parseSharedLocationFromUrl("https://maphop.app/?lat=46.590261&lng=14.268005&z=15.13");

        expect(sharedLocation).toEqual({
            center: [14.268005, 46.590261],
            zoom: 15.13
        });
    });

    it("returns null when shared coordinates are invalid", () => {
        expect(parseSharedLocationFromUrl("https://maphop.app/?lat=200&lng=14.268005")).toBeNull();
        expect(parseSharedLocationFromUrl("https://maphop.app/?lat=46.590261&lng=999")).toBeNull();
    });

    it("returns null when shared coordinates are missing", () => {
        expect(parseSharedLocationFromUrl("https://maphop.app/")).toBeNull();
        expect(parseSharedLocationFromUrl("https://maphop.app/?lat=46.590261")).toBeNull();
    });

    it("ignores invalid zoom values and keeps the shared center", () => {
        const sharedLocation = parseSharedLocationFromUrl("https://maphop.app/?lat=46.590261&lng=14.268005&z=200");

        expect(sharedLocation).toEqual({
            center: [14.268005, 46.590261],
            zoom: null
        });
    });
});
