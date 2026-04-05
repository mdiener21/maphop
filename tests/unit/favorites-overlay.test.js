import { beforeEach, describe, expect, it, vi } from "vitest";

const { popupInstances, PopupMock } = vi.hoisted(() => {
    const popupInstances = [];
    const PopupMock = vi.fn(function PopupMock(options) {
        this.options = options;
        this.remove = vi.fn();
        this.setLngLat = vi.fn(() => this);
        this.setText = vi.fn(() => this);
        this.addTo = vi.fn(() => this);
        popupInstances.push(this);
    });

    return { popupInstances, PopupMock };
});

vi.mock("maplibre-gl", () => ({
    default: {
        Popup: PopupMock
    }
}));

import { createFavoritesOverlay } from "../../src/js/map/favorites-overlay.js";

class MockImage {
    set src(value) {
        this._src = value;
        this.onload?.();
    }
}

function makeMap() {
    const layerListeners = new Map();
    const sources = new Map();
    let layerAdded = false;
    const canvas = { style: { cursor: "" } };

    return {
        hasImage: vi.fn(() => false),
        removeImage: vi.fn(),
        addImage: vi.fn(),
        addSource: vi.fn((id, source) => {
            sources.set(id, {
                ...source,
                setData: vi.fn()
            });
        }),
        getSource: vi.fn((id) => sources.get(id)),
        getLayer: vi.fn((id) => (layerAdded && id === "favorites-overlay-pins" ? { id } : undefined)),
        addLayer: vi.fn(() => {
            layerAdded = true;
        }),
        setLayoutProperty: vi.fn(),
        on: vi.fn((eventName, layerId, handler) => {
            if (typeof handler === "function") {
                layerListeners.set(`${eventName}:${layerId}`, handler);
            }
        }),
        getCanvas: vi.fn(() => canvas),
        triggerLayer(eventName, layerId, payload) {
            layerListeners.get(`${eventName}:${layerId}`)?.(payload);
        }
    };
}

beforeEach(() => {
    popupInstances.length = 0;
    PopupMock.mockClear();
    vi.stubGlobal("Image", MockImage);
    vi.stubGlobal("URL", {
        createObjectURL: vi.fn(() => "blob:mock-url"),
        revokeObjectURL: vi.fn()
    });
    localStorage.clear();
});

describe("createFavoritesOverlay", () => {
    it("creates the favorite popup with scoped styling and an upward offset", () => {
        const map = makeMap();
        const overlay = createFavoritesOverlay(map);

        overlay.ensureAfterStyleLoad();
        map.triggerLayer("mouseenter", "favorites-overlay-pins", {
            features: [{
                geometry: { coordinates: [16.37, 48.21] },
                properties: { name: "Vienna" }
            }]
        });

        expect(PopupMock).toHaveBeenCalledOnce();
        expect(PopupMock).toHaveBeenCalledWith({
            closeButton: false,
            closeOnClick: false,
            anchor: "bottom",
            offset: [0, -25],
            className: "favorites-overlay-popup"
        });
        expect(popupInstances[0].setLngLat).toHaveBeenCalledWith([16.37, 48.21]);
        expect(popupInstances[0].setText).toHaveBeenCalledWith("Vienna");
        expect(popupInstances[0].addTo).toHaveBeenCalledWith(map);
    });
});
