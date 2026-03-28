import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTerrainController } from "../../src/js/map/terrain-controller.js";

function makeMap() {
    const sources = new Map();
    const layers = new Map();

    return {
        addLayer: vi.fn((layer) => {
            layers.set(layer.id, layer);
        }),
        addSource: vi.fn((id, source) => {
            sources.set(id, source);
        }),
        easeTo: vi.fn(),
        getLayer: vi.fn((id) => layers.get(id) ?? null),
        getSource: vi.fn((id) => sources.get(id) ?? null),
        removeLayer: vi.fn((id) => {
            layers.delete(id);
        }),
        removeSource: vi.fn((id) => {
            sources.delete(id);
        }),
        setTerrain: vi.fn()
    };
}

function makeController() {
    const map = makeMap();
    const terrainButton = document.createElement("button");
    const terrainToggleLabel = document.createElement("span");
    const onStatus = vi.fn();
    const onStateChange = vi.fn();

    const controller = createTerrainController({
        map,
        terrainButton,
        terrainToggleLabel,
        onStatus,
        onStateChange
    });

    return { controller, map, onStatus, onStateChange, terrainButton, terrainToggleLabel };
}

beforeEach(() => {
    document.body.replaceChildren();
});

describe("createTerrainController", () => {
    it("initializes the toggle button in the off state", () => {
        const { controller, terrainButton, terrainToggleLabel } = makeController();

        expect(controller.isActive).toBe(false);
        expect(terrainButton.dataset.state).toBe("idle");
        expect(terrainToggleLabel.textContent).toBe("Off");
    });

    it("enable adds terrain sources, hillshade, and updates state", () => {
        const { controller, map, onStatus, onStateChange, terrainButton, terrainToggleLabel } = makeController();

        controller.enable();

        expect(controller.isActive).toBe(true);
        expect(map.addSource).toHaveBeenCalledTimes(2);
        expect(map.addLayer).toHaveBeenCalledOnce();
        expect(map.setTerrain).toHaveBeenCalledWith({ source: "terrain-source", exaggeration: 1 });
        expect(map.easeTo).toHaveBeenCalledWith({ pitch: 45, duration: 600 });
        expect(terrainButton.dataset.state).toBe("active");
        expect(terrainToggleLabel.textContent).toBe("On");
        expect(onStateChange).toHaveBeenCalledWith(true);
        expect(onStatus).toHaveBeenCalledWith("3D Terrain on.");
    });

    it("disable removes hillshade, clears terrain, and updates state", () => {
        const { controller, map, onStatus, onStateChange, terrainButton, terrainToggleLabel } = makeController();

        controller.enable();
        controller.disable();

        expect(controller.isActive).toBe(false);
        expect(map.setTerrain).toHaveBeenLastCalledWith(null);
        expect(map.removeLayer).toHaveBeenCalledWith("terrain-hillshade");
        expect(map.removeSource).toHaveBeenCalledWith("hillshade-source");
        expect(map.easeTo).toHaveBeenLastCalledWith({ pitch: 0, duration: 600 });
        expect(terrainButton.dataset.state).toBe("idle");
        expect(terrainToggleLabel.textContent).toBe("Off");
        expect(onStateChange).toHaveBeenLastCalledWith(false);
        expect(onStatus).toHaveBeenLastCalledWith("3D Terrain off.");
    });

    it("ensureAfterStyleLoad restores the terrain source even when inactive", () => {
        const { controller, map } = makeController();

        controller.ensureAfterStyleLoad();

        expect(map.addSource).toHaveBeenCalledWith("terrain-source", {
            type: "raster-dem",
            url: "https://tiles.mapterhorn.com/tilejson.json",
            encoding: "terrarium"
        });
        expect(map.setTerrain).not.toHaveBeenCalled();
    });

    it("ensureAfterStyleLoad re-applies full terrain when active", () => {
        const { controller, map } = makeController();

        controller.enable();
        map.addSource.mockClear();
        map.addLayer.mockClear();
        map.setTerrain.mockClear();
        map.removeLayer("terrain-hillshade");
        map.removeSource("hillshade-source");
        map.removeSource("terrain-source");

        controller.ensureAfterStyleLoad();

        expect(map.addSource).toHaveBeenCalledTimes(2);
        expect(map.addLayer).toHaveBeenCalledOnce();
        expect(map.setTerrain).toHaveBeenCalledWith({ source: "terrain-source", exaggeration: 1 });
    });
});