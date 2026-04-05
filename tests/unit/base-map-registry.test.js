import { describe, expect, it } from "vitest";
import { createBaseMapConfigs } from "../../src/js/map/base-map-registry.js";

describe("createBaseMapConfigs", () => {
    it("omits Thunderforest layers when no API key is provided", () => {
        const baseMapConfigs = createBaseMapConfigs("");

        expect(baseMapConfigs.outdoors).toBeUndefined();
        expect(baseMapConfigs.transport).toBeUndefined();
    });

    it("adds Thunderforest layers when an API key is provided", () => {
        const baseMapConfigs = createBaseMapConfigs("abc 123/+?");

        expect(baseMapConfigs.outdoors).toMatchObject({
            label: "Outdoors",
            attribution: [
                { type: "link", label: "Thunderforest", href: "https://www.thunderforest.com", prefix: "Maps © " },
                {
                    type: "link",
                    label: "OpenStreetMap contributors",
                    href: "https://www.openstreetmap.org/copyright",
                    prefix: "Data © "
                }
            ]
        });
        expect(baseMapConfigs.outdoors.style.sources.basemap.tiles).toEqual([
            "https://api.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=abc%20123%2F%2B%3F"
        ]);
        expect(baseMapConfigs.transport).toMatchObject({
            label: "Transport",
            attribution: [
                { type: "link", label: "Thunderforest", href: "https://www.thunderforest.com", prefix: "Maps © " },
                {
                    type: "link",
                    label: "OpenStreetMap contributors",
                    href: "https://www.openstreetmap.org/copyright",
                    prefix: "Data © "
                }
            ]
        });
        expect(baseMapConfigs.transport.style.sources.basemap.tiles).toEqual([
            "https://api.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=abc%20123%2F%2B%3F"
        ]);
    });
});
