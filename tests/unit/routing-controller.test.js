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
    const sources = new Map();
    return {
        on: vi.fn((name, handler) => { handlers[name] = handler; }),
        getSource: vi.fn((id) => sources.get(id)),
        getLayer: vi.fn(() => null),
        addSource: vi.fn((id, definition) => { sources.set(id, { ...source, definition }); }),
        addLayer: vi.fn(),
        handlers,
        source
    };
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

function makeMaplibreMocks() {
    const marker = { setLngLat: vi.fn().mockReturnThis(), addTo: vi.fn().mockReturnThis(), on: vi.fn(), remove: vi.fn() };
    const popups = [];
    const Popup = vi.fn(function Popup() {
        const popup = {
            setLngLat: vi.fn().mockReturnThis(),
            setDOMContent: vi.fn().mockReturnThis(),
            addTo: vi.fn().mockReturnThis(),
            remove: vi.fn()
        };
        popups.push(popup);
        return popup;
    });
    return { marker, popups, maplibregl: { Marker: vi.fn(function Marker() { return marker; }), Popup } };
}


function deferred() {
    let resolve, reject;
    const promise = new Promise((done, fail) => { resolve = done; reject = fail; });
    return { promise, resolve, reject };
}

function routeResponse(distance = 1200) {
    return { features: [{ geometry: { type: "LineString", coordinates: [[1, 2], [3, 4]] }, properties: { summary: { distance, duration: 540 } } }] };
}

function startRouting() {
    const map = makeStyleResetMap();
    const panel = makePanel();
    const { maplibregl, popups } = makeMaplibreMocks();
    const controller = createRoutingController({ map, maplibregl, panel, apiKey: "test", onStatus: vi.fn() });
    controller.open();
    panel.startField.click();
    map.handlers.click({ lngLat: { lng: 1, lat: 2 } });
    panel.destinationField.click();
    map.handlers.click({ lngLat: { lng: 3, lat: 4 } });
    return { map, panel, controller, popups };
}

// Let all continuations of controlled request/location completions finish.
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("routing controller", () => {
    beforeEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

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
        const { maplibregl } = makeMaplibreMocks();
        global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ features: [{ geometry: { type: "LineString", coordinates: [[1, 2], [3, 4]] }, properties: { summary: { distance: 1200, duration: 540 } } }] }) });
        const panel = makePanel();
        const controller = createRoutingController({ map, maplibregl, apiKey: "test", panel, onStatus: vi.fn() });
        controller.open();
        panel.startField.click();
        map.handlers.click({ lngLat: { lng: 1, lat: 2 } });
        panel.destinationField.click();
        map.handlers.click({ lngLat: { lng: 3, lat: 4 } });
        await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
        expect(fetch.mock.calls[0][0]).toBe("https://api.openrouteservice.org/v2/directions/foot-hiking/geojson");
        await vi.waitFor(() => expect(map.addSource).toHaveBeenCalledWith("walking-route", expect.objectContaining({
            data: expect.objectContaining({ features: [expect.any(Object)] })
        })));
        expect(map.source.setData).toHaveBeenCalled();

        panel.profile.value = "cycling-mountain";
        panel.profile.dispatchEvent(new Event("change"));
        await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
        expect(fetch.mock.calls[1][0]).toBe("https://api.openrouteservice.org/v2/directions/cycling-mountain/geojson");
    });

    it("restores the route overlay when the map style resets while a route request is pending", async () => {
        const map = makeStyleResetMap();
        const panel = makePanel();
        const { maplibregl } = makeMaplibreMocks();
        let resolveRoute;
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => new Promise((resolve) => { resolveRoute = resolve; })
        });
        const controller = createRoutingController({ map, maplibregl, apiKey: "test", panel, onStatus: vi.fn() });

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
        expect(map.addLayer).toHaveBeenCalledTimes(2);
    });

    it("collapses the menu for selection, reopens it, and adds stops in route order", async () => {
        const map = makeMap();
        const panel = makePanel();
        const { maplibregl } = makeMaplibreMocks();
        const onMenuClose = vi.fn();
        const onMenuOpen = vi.fn();
        global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ features: [{ geometry: { type: "LineString", coordinates: [] }, properties: { summary: { distance: 100, duration: 60 } } }] }) });
        const controller = createRoutingController({ map, maplibregl, apiKey: "test", panel, onMenuClose, onMenuOpen, onStatus: vi.fn() });

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

    it("shows a route summary popup and clears it on recalculation and clear", async () => {
        const map = makeMap();
        const panel = makePanel();
        const { popups, maplibregl } = makeMaplibreMocks();
        global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ features: [{ geometry: { type: "LineString", coordinates: [[1, 2], [2, 3], [3, 4]] }, properties: { summary: { distance: 1200, duration: 540 } } }] }) });
        const controller = createRoutingController({ map, maplibregl, apiKey: "test", panel, onStatus: vi.fn() });

        controller.open();
        panel.startField.click();
        map.handlers.click({ lngLat: { lng: 1, lat: 2 } });
        panel.destinationField.click();
        map.handlers.click({ lngLat: { lng: 3, lat: 4 } });
        await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
        await vi.waitFor(() => expect(maplibregl.Popup).toHaveBeenCalledOnce());
        expect(popups[0].setLngLat).toHaveBeenCalledWith([3, 4]);
        expect(popups[0].setDOMContent.mock.calls[0][0].textContent).toContain("Route summary");
        expect(popups[0].setDOMContent.mock.calls[0][0].textContent).toContain("Distance: 1.2 km");
        expect(popups[0].setDOMContent.mock.calls[0][0].textContent).toContain("Time: 9 min");
        expect(popups[0].setDOMContent.mock.calls[0][0].textContent).toContain("Stops: 0");

        panel.addStopButton.click();
        map.handlers.click({ lngLat: { lng: 5, lat: 6 } });
        expect(popups[0].remove).toHaveBeenCalledTimes(1);
        await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
        await vi.waitFor(() => expect(maplibregl.Popup).toHaveBeenCalledTimes(2));
        expect(popups[1].setDOMContent.mock.calls[0][0].textContent).toContain("Stops: 1");

        panel.clearButton.click();
        expect(popups[1].remove).toHaveBeenCalledTimes(1);
    });

    it.each(["success", "failure"])("ignores stale decoding %s after a newer route succeeds", async (outcome) => {
        const oldBody = deferred();
        const json = vi.fn(() => oldBody.promise);
        vi.stubGlobal("fetch", vi.fn()
            .mockResolvedValueOnce({ ok: true, json })
            .mockResolvedValueOnce({ ok: true, json: async () => routeResponse(2400) }));
        const { map, panel, popups } = startRouting();
        await vi.waitFor(() => expect(json).toHaveBeenCalledOnce());
        panel.destinationField.click();
        map.handlers.click({ lngLat: { lng: 7, lat: 8 } });
        await vi.waitFor(() => expect(panel.distance.textContent).toBe("Distance: 2.4 km"));
        expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
        const accepted = map.source("walking-route").setData.mock.calls.at(-1)[0];
        const popup = popups.at(-1);
        if (outcome === "success") oldBody.resolve(routeResponse(9000));
        else oldBody.reject(new Error("late decoding failure"));
        await settle();
        expect(panel.distance.textContent).toBe("Distance: 2.4 km");
        expect(panel.status.textContent).toBe("");
        expect(map.source("walking-route").setData.mock.calls.at(-1)[0]).toBe(accepted);
        expect(popups).toHaveLength(1);
        expect(popup.remove).not.toHaveBeenCalled();
        expect(popup.setLngLat).toHaveBeenCalledWith([7, 8]);
    });

    it.each(["clear", "close"])("suppresses pending success and failure after %s and reopening", async (action) => {
        for (const outcome of ["success", "failure"]) {
            const pending = deferred();
            vi.stubGlobal("fetch", vi.fn(() => pending.promise));
            const { map, panel, controller, popups } = startRouting();
            controller[action]();
            controller.open();
            if (outcome === "success") pending.resolve({ ok: true, json: async () => routeResponse() });
            else pending.reject(new Error("late network failure"));
            await settle();
            expect(map.source("walking-route")).toBeUndefined();
            expect(popups).toHaveLength(0);
            expect(panel.status.textContent).toBe("");
            expect(panel.distance.hidden).toBe(true);
        }
    });

    it("clears the previous route on profile change and retains points when recalculation fails", async () => {
        const pending = deferred();
        vi.stubGlobal("fetch", vi.fn()
            .mockResolvedValueOnce({ ok: true, json: async () => routeResponse() })
            .mockImplementationOnce(() => pending.promise));
        const { map, panel, popups } = startRouting();
        await vi.waitFor(() => expect(popups).toHaveLength(1));
        panel.profile.value = "foot-walking";
        panel.profile.dispatchEvent(new Event("change"));
        expect(map.source("walking-route").setData.mock.calls.at(-1)[0].features).toEqual([]);
        expect(panel.distance.hidden).toBe(true);
        expect(panel.duration.hidden).toBe(true);
        expect(popups[0].remove).toHaveBeenCalledOnce();
        pending.reject(new Error("offline"));
        await settle();
        expect(panel.status.textContent).toContain("Could not calculate");
        expect(panel.startField.textContent).toContain("2.00000, 1.00000");
        expect(panel.destinationField.textContent).toContain("4.00000, 3.00000");
    });

    it.each(["clear", "close", "points", "profile", "lookup"])("ignores location completions superseded by %s", async (action) => {
        const callbacks = [];
        vi.stubGlobal("navigator", {
            onLine: true,
            geolocation: { getCurrentPosition: (success, failure) => callbacks.push({ success, failure }) }
        });
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => routeResponse() }));
        const { map, panel, controller } = startRouting();
        await settle();
        panel.currentLocationButton.click();
        if (action === "clear" || action === "close") {
            controller[action]();
            controller.open();
        } else if (action === "points") {
            panel.startField.click();
            map.handlers.click({ lngLat: { lng: 9, lat: 10 } });
        } else if (action === "profile") {
            panel.profile.value = "foot-walking";
            panel.profile.dispatchEvent(new Event("change"));
        } else {
            panel.currentLocationButton.click();
        }
        await settle();
        const before = { start: panel.startField.textContent, status: panel.status.textContent, calls: fetch.mock.calls.length };
        callbacks[0].success({ coords: { longitude: 50, latitude: 60 } });
        callbacks[0].failure();
        await settle();
        expect(panel.startField.textContent).toBe(before.start);
        expect(panel.status.textContent).toBe(before.status);
        expect(fetch).toHaveBeenCalledTimes(before.calls);
        if (action === "lookup") {
            callbacks[1].success({ coords: { longitude: 11, latitude: 12 } });
            await settle();
            expect(panel.startField.textContent).toContain("12.00000, 11.00000");
        }
    });

    it("restores accepted geometry after style reload without another calculation", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => routeResponse() }));
        const { map, controller } = startRouting();
        await vi.waitFor(() => expect(map.source("walking-route")).toBeDefined());
        const accepted = map.source("walking-route").definition.data;
        map.resetStyle();
        controller.ensureAfterStyleLoad();
        expect(map.source("walking-route").definition.data).toBe(accepted);
        expect(fetch).toHaveBeenCalledOnce();
    });

});
