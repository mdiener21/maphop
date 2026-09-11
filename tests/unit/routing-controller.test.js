import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRoutingController } from "../../src/js/map/routing-controller.js";

function makePanel() {
    document.body.innerHTML = `<section hidden><button></button><button></button><button></button><button></button><select><option value="foot-hiking">Hiking</option><option value="cycling-mountain">Mountain bike</option><option value="foot-walking">Walking</option></select><button></button><button></button><div></div><p hidden></p><p hidden></p><p></p></section>`;
    const [closeButton, currentLocationButton, clearButton, addStopButton, startField, destinationField] = document.querySelectorAll("button");
    const [distance, duration, status] = document.querySelectorAll("p");
    return { root: document.querySelector("section"), closeButton, currentLocationButton, clearButton, addStopButton, profile: document.querySelector("select"), startField, destinationField, pointsList: document.querySelector("div"), distance, duration, status };
}

function makeMap() {
    const handlers = {};
    const source = { setData: vi.fn() };
    return { on: vi.fn((name, handler) => { handlers[name] = handler; }), getSource: vi.fn(() => source), getLayer: vi.fn(() => null), addSource: vi.fn(), addLayer: vi.fn(), handlers, source };
}

function makeStyleResetMap() {
    const handlers = {};
    const sources = new Map();
    const layers = new Map();
    return {
        on: vi.fn((name, handler) => { handlers[name] = handler; }),
        getSource: vi.fn((id) => sources.get(id)),
        getLayer: vi.fn((id) => layers.get(id)),
        addSource: vi.fn((id, definition) => {
            sources.set(id, { definition, setData: vi.fn() });
        }),
        addLayer: vi.fn((definition) => { layers.set(definition.id, definition); }),
        handlers,
        resetStyle: () => { sources.clear(); layers.clear(); },
        source: (id) => sources.get(id)
    };
}

describe("routing controller", () => {
    beforeEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

    it("opens for endpoint selection without a configured key", () => {
        const onStatus = vi.fn();
        const panel = makePanel();
        const controller = createRoutingController({ map: makeMap(), maplibregl: {}, apiKey: "", panel, onStatus });
        controller.open();
        expect(panel.root.hidden).toBe(false);
        expect(onStatus).toHaveBeenCalledWith("Routing is not configured for this deployment.");
    });

    it("sets start then destination from map clicks and requests the selected profile", async () => {
        const map = makeMap();
        const marker = { setLngLat: vi.fn().mockReturnThis(), addTo: vi.fn().mockReturnThis(), on: vi.fn(), remove: vi.fn() };
        global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ features: [{ geometry: { type: "LineString", coordinates: [[1, 2], [3, 4]] }, properties: { summary: { distance: 1200, duration: 540 } } }] }) });
        const panel = makePanel();
        const controller = createRoutingController({ map, maplibregl: { Marker: vi.fn(function Marker() { return marker; }) }, apiKey: "test", panel, onStatus: vi.fn() });
        controller.open();
        panel.startField.click();
        map.handlers.click({ lngLat: { lng: 1, lat: 2 } });
        panel.destinationField.click();
        map.handlers.click({ lngLat: { lng: 3, lat: 4 } });
        await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
        expect(fetch.mock.calls[0][0]).toBe("https://api.openrouteservice.org/v2/directions/foot-hiking/geojson");
        expect(map.source.setData).toHaveBeenCalled();

        panel.profile.value = "cycling-mountain";
        panel.profile.dispatchEvent(new Event("change"));
        await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
        expect(fetch.mock.calls[1][0]).toBe("https://api.openrouteservice.org/v2/directions/cycling-mountain/geojson");
    });

    it("restores the route overlay when the map style resets while a route request is pending", async () => {
        const map = makeStyleResetMap();
        const panel = makePanel();
        const marker = { setLngLat: vi.fn().mockReturnThis(), addTo: vi.fn().mockReturnThis(), on: vi.fn(), remove: vi.fn() };
        let resolveRoute;
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => new Promise((resolve) => { resolveRoute = resolve; })
        });
        const controller = createRoutingController({ map, maplibregl: { Marker: vi.fn(function Marker() { return marker; }) }, apiKey: "test", panel, onStatus: vi.fn() });

        controller.open();
        panel.startField.click();
        map.handlers.click({ lngLat: { lng: 1, lat: 2 } });
        panel.destinationField.click();
        map.handlers.click({ lngLat: { lng: 3, lat: 4 } });
        await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());

        map.resetStyle();
        resolveRoute({ features: [{ geometry: { type: "LineString", coordinates: [[1, 2], [3, 4]] }, properties: { summary: { distance: 1200, duration: 540 } } }] });

        await vi.waitFor(() => expect(map.source("walking-route").setData).toHaveBeenCalled());
        expect(map.source("walking-route").definition.data.features).toHaveLength(1);
        expect(map.addLayer).toHaveBeenCalledTimes(4);
    });

    it("collapses the menu for selection, reopens it, and adds stops in route order", async () => {
        const map = makeMap();
        const panel = makePanel();
        const marker = { setLngLat: vi.fn().mockReturnThis(), addTo: vi.fn().mockReturnThis(), on: vi.fn(), remove: vi.fn() };
        const onMenuClose = vi.fn();
        const onMenuOpen = vi.fn();
        global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ features: [{ geometry: { type: "LineString", coordinates: [] }, properties: { summary: { distance: 100, duration: 60 } } }] }) });
        const controller = createRoutingController({ map, maplibregl: { Marker: vi.fn(function Marker() { return marker; }) }, apiKey: "test", panel, onMenuClose, onMenuOpen, onStatus: vi.fn() });

        controller.open();
        panel.startField.click();
        expect(onMenuClose).toHaveBeenCalledOnce();
        map.handlers.click({ lngLat: { lng: 1, lat: 2 } });
        expect(onMenuOpen).toHaveBeenCalledOnce();
        panel.destinationField.click();
        map.handlers.click({ lngLat: { lng: 3, lat: 4 } });
        await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
        expect(onMenuOpen).toHaveBeenCalledOnce();
        panel.addStopButton.click();
        map.handlers.click({ lngLat: { lng: 5, lat: 6 } });
        await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
        expect(onMenuOpen).toHaveBeenCalledOnce();

        expect(JSON.parse(fetch.mock.calls[1][1].body).coordinates).toEqual([[1, 2], [5, 6], [3, 4]]);
        expect(panel.pointsList.textContent).toContain("6.00000, 5.00000");

        const transfer = {
            value: "",
            setData(_type, value) { this.value = value; },
            getData() { return this.value; }
        };
        const dragStart = new Event("dragstart", { bubbles: true });
        Object.defineProperty(dragStart, "dataTransfer", { value: transfer });
        panel.pointsList.querySelectorAll(".routing-point-row")[1].dispatchEvent(dragStart);
        const drop = new Event("drop", { bubbles: true });
        Object.defineProperty(drop, "dataTransfer", { value: transfer });
        panel.pointsList.querySelectorAll(".routing-point-row")[2].dispatchEvent(drop);
        await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
        expect(JSON.parse(fetch.mock.calls[2][1].body).coordinates).toEqual([[1, 2], [3, 4], [5, 6]]);

        panel.pointsList.querySelector(".routing-delete-point").click();
        await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(4));
        expect(JSON.parse(fetch.mock.calls[3][1].body).coordinates).toEqual([[1, 2], [5, 6]]);
    });
});
