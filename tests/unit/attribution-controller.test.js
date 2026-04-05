import { beforeEach, describe, expect, it } from "vitest";
import { createAttributionController } from "../../src/js/map/attribution-controller.js";

function makeController(baseMapConfigs) {
    const attributionText = document.createElement("p");

    const controller = createAttributionController({
        attributionText,
        baseMapConfigs
    });

    return { attributionText, controller };
}

const baseMapConfigs = {
    bergfex: {
        attribution: [
            { type: "link", label: "Bergfex", href: "https://example.com/bergfex", prefix: "© " },
            { type: "text", value: "Imagery" },
            { type: "link", label: "OpenStreetMap contributors", href: "https://example.com/osm", prefix: "© " }
        ]
    }
};

beforeEach(() => {
    document.body.replaceChildren();
});

describe("createAttributionController", () => {
    it("renders structured links and text tokens", () => {
        const { attributionText, controller } = makeController(baseMapConfigs);

        controller.update("bergfex", false);

        expect(attributionText.textContent).toContain("© Bergfex · Imagery · © OpenStreetMap contributors");
        expect(attributionText.querySelectorAll("a")).toHaveLength(2);
        expect(attributionText.innerHTML).not.toContain("&lt;a");
    });

    it("appends terrain attribution when terrain is active", () => {
        const { attributionText, controller } = makeController(baseMapConfigs);

        controller.update("bergfex", true);

        expect(attributionText.textContent).toContain("Hillshade © basemap.at");
        expect(attributionText.textContent).toContain("Terrain © Mapterhorn");
    });

    it("replaces the previous attribution when the active layer changes", () => {
        const { attributionText, controller } = makeController({
            bergfex: baseMapConfigs.bergfex,
            osm: {
                attribution: [
                    { type: "link", label: "OpenStreetMap contributors", href: "https://example.com/osm", prefix: "© " }
                ]
            }
        });

        controller.update("bergfex", false);
        controller.update("osm", false);

        expect(attributionText.textContent).toBe("© OpenStreetMap contributors");
        expect(attributionText.querySelectorAll("a")).toHaveLength(1);
    });
});
