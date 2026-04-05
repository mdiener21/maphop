import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBaseLayerController } from "../../src/js/map/base-layer-controller.js";

function makeMap() {
    const listeners = new Map();

    return {
        on: vi.fn((eventName, handler) => {
            listeners.set(eventName, handler);
        }),
        off: vi.fn((eventName, handler) => {
            if (listeners.get(eventName) === handler) {
                listeners.delete(eventName);
            }
        }),
        setStyle: vi.fn(),
        trigger(eventName, payload) {
            const handler = listeners.get(eventName);
            if (handler) {
                handler(payload);
            }
        }
    };
}

function makeLayerOptionElements() {
    return ["bergfex", "osm", "outdoors"].map((key) => {
        const button = document.createElement("button");
        button.dataset.layerKey = key;
        return button;
    });
}

function makeController(overrides = {}) {
    const map = makeMap();
    const layerMenuButton = document.createElement("button");
    const layerOptionElements = makeLayerOptionElements();
    const onStatus = vi.fn();
    const onStyleReady = vi.fn();
    const onActiveLayerChanged = vi.fn();
    const onMenuClose = vi.fn();
    const baseMapConfigs = {
        bergfex: { label: "Bergfex OSM", style: { id: "bergfex-style" } },
        osm: { label: "OpenStreetMap", style: { id: "osm-style" } }
    };

    const controller = createBaseLayerController({
        map,
        baseMapConfigs,
        layerMenuButton,
        layerOptionElements,
        initialActiveKey: "bergfex",
        onStatus,
        onStyleReady,
        onActiveLayerChanged,
        onMenuClose,
        ...overrides
    });

    return {
        map,
        layerMenuButton,
        layerOptionElements,
        onStatus,
        onStyleReady,
        onActiveLayerChanged,
        onMenuClose,
        baseMapConfigs,
        controller
    };
}

beforeEach(() => {
    vi.useFakeTimers();
});

describe("createBaseLayerController", () => {
    it("hides unavailable layer options during initialization", () => {
        const { layerOptionElements } = makeController();

        expect(layerOptionElements[0].hidden).toBe(false);
        expect(layerOptionElements[1].hidden).toBe(false);
        expect(layerOptionElements[2].hidden).toBe(true);
        expect(layerOptionElements[2].disabled).toBe(true);
    });

    it("closes the menu and skips style changes when selecting the current layer", async () => {
        const { controller, map, onMenuClose } = makeController();

        await controller.setBaseLayer("bergfex");

        expect(map.setStyle).not.toHaveBeenCalled();
        expect(onMenuClose).toHaveBeenCalledOnce();
    });

    it("switches styles successfully and updates the active layer state", async () => {
        const { controller, map, layerOptionElements, onStatus, onStyleReady, onActiveLayerChanged } = makeController();

        const pending = controller.setBaseLayer("osm");
        map.trigger("style.load");
        await pending;

        expect(map.setStyle).toHaveBeenCalledWith({ id: "osm-style" });
        expect(controller.activeKey).toBe("osm");
        expect(layerOptionElements[1].dataset.active).toBe("true");
        expect(layerOptionElements[1].getAttribute("aria-checked")).toBe("true");
        expect(onStyleReady).toHaveBeenCalledOnce();
        expect(onActiveLayerChanged).toHaveBeenCalledWith("osm");
        expect(onStatus).toHaveBeenCalledWith("Base map switched to OpenStreetMap.");
    });

    it("restores the previous style after a load error", async () => {
        const { controller, map, onStatus, onStyleReady, onActiveLayerChanged } = makeController();

        const pending = controller.setBaseLayer("osm");
        map.trigger("error", { error: new Error("boom") });
        await Promise.resolve();
        map.trigger("style.load");
        await pending;

        expect(map.setStyle).toHaveBeenNthCalledWith(1, { id: "osm-style" });
        expect(map.setStyle).toHaveBeenNthCalledWith(2, { id: "bergfex-style" });
        expect(controller.activeKey).toBe("bergfex");
        expect(onStyleReady).toHaveBeenCalledOnce();
        expect(onActiveLayerChanged).not.toHaveBeenCalled();
        expect(onStatus).toHaveBeenCalledWith("Unable to load OpenStreetMap.");
    });

    it("restores the previous style after the style-load timeout expires", async () => {
        const { controller, map, onStatus } = makeController();

        const pending = controller.setBaseLayer("osm");
        vi.advanceTimersByTime(12000);
        await Promise.resolve();
        map.trigger("style.load");
        await pending;

        expect(map.setStyle).toHaveBeenNthCalledWith(1, { id: "osm-style" });
        expect(map.setStyle).toHaveBeenNthCalledWith(2, { id: "bergfex-style" });
        expect(controller.activeKey).toBe("bergfex");
        expect(onStatus).toHaveBeenCalledWith("Unable to load OpenStreetMap.");
    });
});
