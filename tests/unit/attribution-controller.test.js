import { beforeEach, describe, expect, it } from "vitest";
import { createAttributionController } from "../../src/js/map/attribution-controller.js";

function makeController(baseMapConfigs) {
    const attributionButton = document.createElement("button");
    const attributionPanel = document.createElement("div");
    const attributionText = document.createElement("p");

    attributionPanel.hidden = true;
    attributionButton.setAttribute("aria-expanded", "false");

    const controller = createAttributionController({
        attributionButton,
        attributionPanel,
        attributionText,
        baseMapConfigs
    });

    return { attributionButton, attributionPanel, attributionText, controller };
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

    it("setOpen syncs panel visibility and aria-expanded", () => {
        const { attributionButton, attributionPanel, controller } = makeController(baseMapConfigs);

        controller.setOpen(true);
        expect(attributionPanel.hidden).toBe(false);
        expect(attributionButton.getAttribute("aria-expanded")).toBe("true");

        controller.setOpen(false);
        expect(attributionPanel.hidden).toBe(true);
        expect(attributionButton.getAttribute("aria-expanded")).toBe("false");
    });

    it("toggle flips the current open state", () => {
        const { attributionButton, attributionPanel, controller } = makeController(baseMapConfigs);

        controller.toggle();
        expect(attributionPanel.hidden).toBe(false);
        expect(attributionButton.getAttribute("aria-expanded")).toBe("true");

        controller.toggle();
        expect(attributionPanel.hidden).toBe(true);
        expect(attributionButton.getAttribute("aria-expanded")).toBe("false");
    });
});