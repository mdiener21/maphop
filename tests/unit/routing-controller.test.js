import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRoutingController } from "../../src/js/map/routing-controller.js";

function makePanel() {
    document.body.innerHTML = `<section hidden><button></button><button></button><button></button><button></button><select><option value="foot-hiking">Hiking</option><option value="cycling-mountain">Mountain bike</option><option value="foot-walking">Walking</option></select><button></button><button></button><div></div><p hidden></p><p hidden></p><p></p></section>`;
    const [closeButton, currentLocationButton, clearButton, addStopButton, startField, destinationField] = document.querySelectorAll("button");
    const [distance, duration, status] = document.querySelectorAll("p");
    return { root: document.querySelector("section"), closeButton, currentLocationButton, clearButton, addStopButton, profile: document.querySelector("select"), startField, destinationField, pointsList: document.querySelector("div"), distance, duration, status };
}

function makeSummary() {
    const app = document.createElement("div");
    app.innerHTML = `<section hidden>
        <button type="button" class="toggle" aria-expanded="false"></button>
        <div class="header"><span class="profile"></span><strong></strong><span class="duration"></span><button type="button" class="close">×</button></div>
        <p hidden></p>
        <ol></ol>
        <div><button type="button" class="fit">Fit route</button><button type="button" class="edit">Edit</button><button type="button" class="clear">Clear</button></div>
    </section>`;
    document.body.append(app);
    const root = app.querySelector("section");
    Object.defineProperty(root, "offsetHeight", { configurable: true, get: () => 120 });
    const find = (selector) => root.querySelector(selector);
    return {
        root, profile: find(".profile"), distance: find("strong"), duration: find(".duration"), elevation: find("p"),
        closeButton: find(".close"), toggle: find(".toggle"), header: find(".header"), points: find("ol"),
        fitButton: find(".fit"), editButton: find(".edit"), clearButton: find(".clear")
    };
}

function stubDesktop(matches) {
    window.matchMedia = vi.fn((query) => ({ matches: matches && query === "(min-width: 700px)", media: query }));
}

function pointer(type, clientY) {
    const event = new Event(type, { bubbles: true });
    Object.assign(event, { clientX: 0, clientY, pointerId: 1 });
    return event;
}

function swipe(element, deltaY) {
    element.dispatchEvent(pointer("pointerdown", 200));
    element.dispatchEvent(pointer("pointerup", 200 + deltaY));
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

function routeResponse(distance, duration, elevation = {}) {
    return { ok: true, json: async () => ({ features: [{ geometry: { type: "LineString", coordinates: [[1, 2, 500], [3, 4, 620]] }, properties: { summary: { distance, duration }, ...elevation } }] }) };
}

function selectStartAndDestination(panel, map) {
    panel.startField.click();
    map.handlers.click({ lngLat: { lng: 1, lat: 2 } });
    panel.destinationField.click();
    map.handlers.click({ lngLat: { lng: 3, lat: 4 } });
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
        fitBounds: vi.fn(),
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
        fitBounds: vi.fn(),
        handlers,
        resetStyle: () => { sources.clear(); layers.clear(); },
        source: (id) => sources.get(id)
    };
}

function makeMaplibreMocks() {
    const marker = { setLngLat: vi.fn().mockReturnThis(), addTo: vi.fn().mockReturnThis(), on: vi.fn(), remove: vi.fn() };
    return { marker, maplibregl: { Marker: vi.fn(function Marker() { return marker; }) } };
}

describe("routing controller", () => {
    beforeEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); delete window.matchMedia; });

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

    it("shows the route summary sheet with route type, distance and estimated time after a successful route", async () => {
        const map = makeMap();
        const panel = makePanel();
        const summary = makeSummary();
        const { maplibregl } = makeMaplibreMocks();
        global.fetch = vi.fn().mockResolvedValue(routeResponse(1200, 540));
        const controller = createRoutingController({ map, maplibregl, apiKey: "test", panel, summary, onStatus: vi.fn() });

        controller.open();
        expect(summary.root.hidden).toBe(true);
        selectStartAndDestination(panel, map);

        await vi.waitFor(() => expect(summary.root.hidden).toBe(false));
        expect(summary.profile.textContent).toBe("Hiking");
        expect(summary.distance.textContent).toBe("1.2 km");
        expect(summary.duration.textContent).toBe("9 min est.");
        expect(panel.distance.textContent).toBe("Distance: 1.2 km");
        expect(panel.duration.textContent).toBe("Time: 9 min est.");
        expect(panel.distance.hidden).toBe(false);
    });

    it("requests elevation from ORS and draws the route with 3D coordinates", async () => {
        const map = makeMap();
        const panel = makePanel();
        const { maplibregl } = makeMaplibreMocks();
        global.fetch = vi.fn().mockResolvedValue(routeResponse(1200, 540, { ascent: 120, descent: 0 }));
        const controller = createRoutingController({ map, maplibregl, apiKey: "test", panel, summary: makeSummary(), onStatus: vi.fn() });

        controller.open();
        selectStartAndDestination(panel, map);

        await vi.waitFor(() => expect(map.addSource).toHaveBeenCalled());
        expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ coordinates: [[1, 2], [3, 4]], elevation: true });
        const drawn = map.addSource.mock.calls.at(-1)[1].data.features[0];
        expect(drawn.geometry.coordinates).toEqual([[1, 2, 500], [3, 4, 620]]);
    });

    it("shows the DIN 33466 hiking time and whole-metre ascent/descent for foot profiles", async () => {
        const map = makeMap();
        const panel = makePanel();
        const summary = makeSummary();
        const { maplibregl } = makeMaplibreMocks();
        // 8 km, 900 m up → DIN 33466 = 4 h; ORS would say 2 h.
        global.fetch = vi.fn().mockResolvedValue(routeResponse(8000, 7200, { ascent: 900.4, descent: 12.6 }));
        const controller = createRoutingController({ map, maplibregl, apiKey: "test", panel, summary, onStatus: vi.fn() });

        controller.open();
        selectStartAndDestination(panel, map);

        await vi.waitFor(() => expect(summary.root.hidden).toBe(false));
        expect(summary.duration.textContent).toBe("Hiking time (DIN 33466): 4 h 2 min");
        expect(panel.duration.textContent).toBe("Hiking time (DIN 33466): 4 h 2 min");
        expect(summary.root.dataset.profileIcon).toBe("foot");
        expect(summary.elevation.hidden).toBe(false);
        expect(summary.elevation.textContent).toBe("↑ 900 m / ↓ 13 m");

        panel.profile.value = "foot-walking";
        panel.profile.dispatchEvent(new Event("change"));
        await vi.waitFor(() => expect(summary.profile.textContent).toBe("Walking"));
        expect(summary.duration.textContent).toBe("Hiking time (DIN 33466): 4 h 2 min");
    });

    it("shows the ORS time labelled est. for mountain-bike routes, with ascent/descent", async () => {
        const map = makeMap();
        const panel = makePanel();
        const summary = makeSummary();
        const { maplibregl } = makeMaplibreMocks();
        global.fetch = vi.fn().mockResolvedValue(routeResponse(8000, 3600, { ascent: 900, descent: 900 }));
        const controller = createRoutingController({ map, maplibregl, apiKey: "test", panel, summary, onStatus: vi.fn() });
        panel.profile.value = "cycling-mountain";

        controller.open();
        selectStartAndDestination(panel, map);

        await vi.waitFor(() => expect(summary.root.hidden).toBe(false));
        expect(summary.duration.textContent).toBe("1 h 0 min est.");
        expect(summary.duration.textContent).not.toContain("DIN");
        expect(panel.duration.textContent).toBe("Time: 1 h 0 min est.");
        expect(summary.root.dataset.profileIcon).toBe("bike");
        expect(summary.elevation.textContent).toBe("↑ 900 m / ↓ 900 m");
    });

    it("falls back to the ORS time and hides the ascent/descent row when elevation is missing", async () => {
        const map = makeMap();
        const panel = makePanel();
        const summary = makeSummary();
        const { maplibregl } = makeMaplibreMocks();
        global.fetch = vi.fn()
            .mockResolvedValueOnce(routeResponse(8000, 7200, { ascent: 900, descent: 0 }))
            .mockResolvedValueOnce(routeResponse(8000, 7200, { ascent: 900 }));
        const controller = createRoutingController({ map, maplibregl, apiKey: "test", panel, summary, onStatus: vi.fn() });

        controller.open();
        selectStartAndDestination(panel, map);
        await vi.waitFor(() => expect(summary.elevation.hidden).toBe(false));

        panel.profile.value = "foot-walking";
        panel.profile.dispatchEvent(new Event("change"));
        await vi.waitFor(() => expect(summary.duration.textContent).toBe("2 h 0 min est."));
        expect(summary.elevation.hidden).toBe(true);
    });

    it("hides the sheet while a recalculation is in flight, updates it on success and hides it on failure", async () => {
        const map = makeMap();
        const panel = makePanel();
        const summary = makeSummary();
        const { maplibregl } = makeMaplibreMocks();
        let resolveSecond;
        global.fetch = vi.fn()
            .mockResolvedValueOnce(routeResponse(1200, 540))
            .mockReturnValueOnce(new Promise((resolve) => { resolveSecond = resolve; }))
            .mockResolvedValueOnce({ ok: false, json: async () => ({}) });
        const controller = createRoutingController({ map, maplibregl, apiKey: "test", panel, summary, onStatus: vi.fn() });

        controller.open();
        selectStartAndDestination(panel, map);
        await vi.waitFor(() => expect(summary.root.hidden).toBe(false));

        panel.profile.value = "cycling-mountain";
        panel.profile.dispatchEvent(new Event("change"));
        expect(summary.root.hidden).toBe(true);
        resolveSecond(routeResponse(5000, 3600));
        await vi.waitFor(() => expect(summary.root.hidden).toBe(false));
        expect(summary.profile.textContent).toBe("Mountain bike");
        expect(summary.distance.textContent).toBe("5.0 km");
        expect(summary.duration.textContent).toBe("1 h 0 min est.");

        panel.profile.value = "foot-walking";
        panel.profile.dispatchEvent(new Event("change"));
        await vi.waitFor(() => expect(panel.status.textContent).toBe("Could not calculate a route. Please try again."));
        expect(summary.root.hidden).toBe(true);
    });

    it("dismisses the sheet with × but keeps the route, and shows it again on reopen or the next route", async () => {
        const map = makeMap();
        const panel = makePanel();
        const summary = makeSummary();
        const { maplibregl } = makeMaplibreMocks();
        global.fetch = vi.fn().mockImplementation(async () => routeResponse(1200, 540));
        const controller = createRoutingController({ map, maplibregl, apiKey: "test", panel, summary, onStatus: vi.fn() });

        controller.open();
        selectStartAndDestination(panel, map);
        await vi.waitFor(() => expect(summary.root.hidden).toBe(false));
        const setDataCalls = map.source.setData.mock.calls.length;

        summary.closeButton.click();
        expect(summary.root.hidden).toBe(true);
        expect(map.source.setData).toHaveBeenCalledTimes(setDataCalls);
        expect(panel.distance.hidden).toBe(false);

        controller.open();
        expect(summary.root.hidden).toBe(false);

        summary.closeButton.click();
        panel.profile.value = "foot-walking";
        panel.profile.dispatchEvent(new Event("change"));
        await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
        await vi.waitFor(() => expect(summary.root.hidden).toBe(false));
        expect(summary.profile.textContent).toBe("Walking");
    });

    it("hides the sheet on Clear and when the Routing panel is closed", async () => {
        const map = makeMap();
        const panel = makePanel();
        const summary = makeSummary();
        const { maplibregl } = makeMaplibreMocks();
        global.fetch = vi.fn().mockImplementation(async () => routeResponse(1200, 540));
        const controller = createRoutingController({ map, maplibregl, apiKey: "test", panel, summary, onStatus: vi.fn() });

        controller.open();
        selectStartAndDestination(panel, map);
        await vi.waitFor(() => expect(summary.root.hidden).toBe(false));
        panel.clearButton.click();
        expect(summary.root.hidden).toBe(true);
        controller.open();
        expect(summary.root.hidden).toBe(true);

        selectStartAndDestination(panel, map);
        await vi.waitFor(() => expect(summary.root.hidden).toBe(false));
        panel.closeButton.click();
        expect(summary.root.hidden).toBe(true);
    });

    describe("expandable sheet", () => {
        async function showRoute() {
            const map = makeMap();
            const panel = makePanel();
            const summary = makeSummary();
            const { maplibregl } = makeMaplibreMocks();
            global.fetch = vi.fn().mockImplementation(async () => routeResponse(1200, 540));
            const controller = createRoutingController({ map, maplibregl, apiKey: "test", panel, summary, onStatus: vi.fn() });
            controller.open();
            selectStartAndDestination(panel, map);
            await vi.waitFor(() => expect(summary.root.hidden).toBe(false));
            return { map, panel, summary, controller };
        }

        const expanded = (summary) => summary.toggle.getAttribute("aria-expanded");

        it("toggles aria-expanded when the handle or the header row is tapped", async () => {
            const { summary } = await showRoute();
            expect(expanded(summary)).toBe("false");
            expect(summary.root.classList.contains("is-expanded")).toBe(false);

            summary.toggle.click();
            expect(expanded(summary)).toBe("true");
            expect(summary.root.classList.contains("is-expanded")).toBe(true);

            summary.header.click();
            expect(expanded(summary)).toBe("false");
            expect(summary.root.classList.contains("is-expanded")).toBe(false);
        });

        it("ignores header taps and swipes on desktop, where the card is always expanded", async () => {
            stubDesktop(true);
            const { summary } = await showRoute();

            summary.header.click();
            summary.toggle.click();
            swipe(summary.header, -60);

            expect(expanded(summary)).toBe("false");
            expect(summary.root.classList.contains("is-expanded")).toBe(false);
        });

        it("expands on a swipe up and collapses on a swipe down past the 30px threshold", async () => {
            const { summary } = await showRoute();

            swipe(summary.header, -10);
            expect(expanded(summary)).toBe("true"); // short movement is still a tap

            swipe(summary.header, -45);
            expect(expanded(summary)).toBe("true"); // swipe up keeps it expanded, no tap toggle

            swipe(summary.toggle, 45);
            expect(expanded(summary)).toBe("false");

            swipe(summary.toggle, 45);
            expect(expanded(summary)).toBe("false");

            swipe(summary.header, -60);
            expect(expanded(summary)).toBe("true");
        });

        it("does not toggle when × is pressed, and resets to collapsed for each new route", async () => {
            const { summary, panel } = await showRoute();
            summary.toggle.click();
            expect(expanded(summary)).toBe("true");

            panel.profile.value = "foot-walking";
            panel.profile.dispatchEvent(new Event("change"));
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
            await vi.waitFor(() => expect(summary.root.hidden).toBe(false));
            expect(expanded(summary)).toBe("false");

            summary.closeButton.click();
            expect(expanded(summary)).toBe("false");
            expect(summary.root.hidden).toBe(true);
        });

        it("lists the ordered route points colour-coded like the pins and updates after a reorder or removed stop", async () => {
            const { summary, panel, map } = await showRoute();
            const listed = () => [...summary.points.children].map((item) => [item.dataset.pointType, item.textContent]);
            expect(listed()).toEqual([
                ["start", "Start2.00000, 1.00000"],
                ["destination", "Destination4.00000, 3.00000"]
            ]);

            panel.addStopButton.click();
            map.handlers.click({ lngLat: { lng: 5, lat: 6 } });
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
            await vi.waitFor(() => expect(summary.root.hidden).toBe(false));
            expect(listed()).toEqual([
                ["start", "Start2.00000, 1.00000"],
                ["stop", "Stop 16.00000, 5.00000"],
                ["destination", "Destination4.00000, 3.00000"]
            ]);

            const transfer = { value: "", setData(_type, value) { this.value = value; }, getData() { return this.value; } };
            const dragStart = new Event("dragstart", { bubbles: true });
            Object.defineProperty(dragStart, "dataTransfer", { value: transfer });
            panel.pointsList.querySelectorAll(".routing-point-row")[1].dispatchEvent(dragStart);
            const drop = new Event("drop", { bubbles: true });
            Object.defineProperty(drop, "dataTransfer", { value: transfer });
            panel.pointsList.querySelectorAll(".routing-point-row")[2].dispatchEvent(drop);
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
            await vi.waitFor(() => expect(summary.root.hidden).toBe(false));
            expect(listed()).toEqual([
                ["start", "Start2.00000, 1.00000"],
                ["stop", "Stop 14.00000, 3.00000"],
                ["destination", "Destination6.00000, 5.00000"]
            ]);

            panel.pointsList.querySelector(".routing-delete-point").click();
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(4));
            await vi.waitFor(() => expect(summary.root.hidden).toBe(false));
            expect(listed()).toEqual([
                ["start", "Start2.00000, 1.00000"],
                ["destination", "Destination6.00000, 5.00000"]
            ]);
        });
    });

    describe("summary actions", () => {
        async function showRoute({ onMenuOpen = vi.fn(), map = makeMap() } = {}) {
            const panel = makePanel();
            const summary = makeSummary();
            const { maplibregl, marker } = makeMaplibreMocks();
            global.fetch = vi.fn().mockImplementation(async () => routeResponse(1200, 540));
            const controller = createRoutingController({ map, maplibregl, apiKey: "test", panel, summary, onMenuOpen, onStatus: vi.fn() });
            controller.open();
            selectStartAndDestination(panel, map);
            await vi.waitFor(() => expect(summary.root.hidden).toBe(false));
            return { map, panel, summary, controller, marker, onMenuOpen };
        }

        it("Fit route fits the map to the route bounds with the sheet height as bottom padding", async () => {
            const { map, summary } = await showRoute();
            map.fitBounds.mockClear();

            summary.fitButton.click();

            expect(map.fitBounds).toHaveBeenCalledTimes(1);
            const [bounds, options] = map.fitBounds.mock.calls[0];
            expect(bounds).toEqual([[1, 2], [3, 4]]);
            expect(options.padding.bottom).toBeGreaterThan(120);
            expect(options.padding.top).toBeLessThan(options.padding.bottom);
            expect(options.padding.left).toBe(options.padding.top);
            expect(options.padding.right).toBe(options.padding.top);
        });

        it("Fit route uses only the fixed margin as bottom padding on desktop, where the card is at the side", async () => {
            stubDesktop(true);
            const { map, summary } = await showRoute();
            map.fitBounds.mockClear();

            summary.fitButton.click();

            expect(map.fitBounds.mock.calls[0][1].padding).toEqual({ top: 40, right: 40, bottom: 40, left: 40 });
        });

        it("fits very long routes without overflowing the call stack", async () => {
            const map = makeMap();
            const panel = makePanel();
            const { maplibregl } = makeMaplibreMocks();
            const coordinates = Array.from({ length: 300000 }, (_, index) => [10 + index / 1e6, 47 - index / 1e6]);
            global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ features: [{ geometry: { type: "LineString", coordinates }, properties: { summary: { distance: 1, duration: 1 } } }] }) });
            const controller = createRoutingController({ map, maplibregl, apiKey: "test", panel, summary: makeSummary(), onStatus: vi.fn() });

            controller.open();
            selectStartAndDestination(panel, map);

            await vi.waitFor(() => expect(map.fitBounds).toHaveBeenCalledTimes(1));
            const [[west, south], [east, north]] = map.fitBounds.mock.calls[0][0];
            expect(west).toBe(10);
            expect(north).toBe(47);
            expect(east).toBeCloseTo(10.299999);
            expect(south).toBeCloseTo(46.700001);
        });

        it("auto-fits once per newly calculated route, not when the route re-renders after a style change", async () => {
            const map = makeStyleResetMap();
            const { controller, marker } = await showRoute({ map });
            expect(map.fitBounds).toHaveBeenCalledTimes(1);
            expect(map.fitBounds.mock.calls[0][1].padding.bottom).toBeGreaterThan(120);

            map.resetStyle();
            controller.ensureAfterStyleLoad();
            controller.open();
            expect(map.fitBounds).toHaveBeenCalledTimes(1);

            // Dragging a pin recalculates the route, which fits again.
            const dragEnd = marker.on.mock.calls.find(([name]) => name === "dragend")[1];
            marker.getLngLat = () => ({ lng: 5, lat: 6 });
            dragEnd();
            await vi.waitFor(() => expect(map.fitBounds).toHaveBeenCalledTimes(2));
        });

        it("Edit opens the menu on the Routing section and keeps the route", async () => {
            const { summary, onMenuOpen, map } = await showRoute();
            onMenuOpen.mockClear();
            map.source.setData.mockClear();

            summary.editButton.click();

            expect(onMenuOpen).toHaveBeenCalledTimes(1);
            expect(summary.root.hidden).toBe(false);
            expect(map.source.setData).not.toHaveBeenCalled();
        });

        it("Clear removes the route, the pins and the sheet", async () => {
            const { map, summary, panel, marker } = await showRoute();
            marker.remove.mockClear();

            summary.clearButton.click();

            expect(summary.root.hidden).toBe(true);
            expect(marker.remove).toHaveBeenCalled();
            expect(map.source.setData).toHaveBeenLastCalledWith({ type: "FeatureCollection", features: [] });
            expect(panel.startField.textContent).toBe("Tap to select location on map");
        });

        it("renders Fit route, Edit and Clear as focusable buttons with accessible names on the map page", () => {
            document.documentElement.innerHTML = readFileSync(resolve(process.cwd(), "src/index.html"), "utf8");
            const actions = document.getElementById("routeSummaryActions");
            const buttons = [...actions.querySelectorAll("button")];

            expect(actions.hidden).toBe(false);
            expect(buttons.map((button) => button.id)).toEqual(["routeSummaryFitButton", "routeSummaryEditButton", "routeSummaryClearButton"]);
            buttons.forEach((button) => {
                expect(button.type).toBe("button");
                expect(button.tabIndex).toBe(0);
                expect(button.getAttribute("aria-label")).toContain(button.textContent.trim());
            });
        });
    });
});
