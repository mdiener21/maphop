import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { baseMapConfigs } from "../../src/js/map/base-map-registry.js";

function readProjectFile(relativePath) {
    return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("OpenStreetMap policy compliance", () => {
    it("uses the canonical OSM tile endpoint without legacy subdomains", () => {
        expect(baseMapConfigs.osm.style.sources.basemap.tiles).toEqual([
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        ]);
    });

    it("falls back to OpenStreetMap as the default base layer", () => {
        const maphopSource = readProjectFile("src/js/maphop.js");

        expect(maphopSource).toContain('const fallbackBaseLayerKey = "osm";');
    });

    it("keeps attribution visible in the page markup", () => {
        const indexHtml = readProjectFile("src/index.html");

        expect(indexHtml).toContain('<div class="attribution-widget" id="attributionWidget">');
        expect(indexHtml).toContain('<p class="attribution-text" id="attributionText"></p>');
        expect(indexHtml).not.toContain('id="attributionButton"');
        expect(indexHtml).not.toContain('id="attributionPanel" hidden');
    });

    it("uses a referrer policy that still sends cross-origin referrers to tile providers", () => {
        const indexHtml = readProjectFile("src/index.html");
        const headersFile = readProjectFile("src/public/_headers");

        expect(indexHtml).toContain('name="referrer" content="strict-origin-when-cross-origin"');
        expect(headersFile).toContain("Referrer-Policy: strict-origin-when-cross-origin");
        expect(indexHtml).not.toContain('name="referrer" content="no-referrer"');
        expect(headersFile).not.toContain("Referrer-Policy: no-referrer");
    });

    it("includes a map menu option for the Thunderforest transport layer", () => {
        const indexHtml = readProjectFile("src/index.html");

        expect(indexHtml).toContain('data-layer-key="transport"');
        expect(indexHtml).toContain("Transport");
    });
});
