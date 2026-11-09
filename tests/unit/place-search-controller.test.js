import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPlaceSearchController } from "../../src/js/map/place-search-controller.js";

const place = (overrides = {}) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [16.408, 48.213] },
    properties: { name: "Wirtschaftsuniversität Wien", label: "Wirtschaftsuniversität Wien, Welthandelsplatz 1, Wien" },
    ...overrides
});

let form, input, clearButton, status, results, nearby, map, markers, close, select, clear, fetchMock;

function setup(apiKey = "test-key", canInspectMap = () => true) {
    createPlaceSearchController({ map, maplibregl: { Marker: class {
        constructor() { this.element = document.createElement("div"); this.remove = vi.fn(); markers.push(this); }
        setLngLat(center) { this.center = center; return this; }
        addTo() { return this; }
        getElement() { return this.element; }
    } }, apiKey, form, input, clearButton, status, results, nearby, canInspectMap, onMenuClose: close, onSelect: select, onClear: clear });
}

function clickMap(lng = 16.408, lat = 48.213, originalEvent = { target: document.body }) {
    const callback = map.on.mock.calls.find(([event]) => event === "click")?.[1];
    callback?.({ lngLat: { lng, lat }, point: { x: 100, y: 100 }, originalEvent });
}

async function submit(query = "WU Wien") {
    input.value = query;
    form.dispatchEvent(new Event("submit", { cancelable: true }));
    await vi.waitFor(() => expect(status.textContent).not.toBe("Searching…"));
}

beforeEach(() => {
    document.body.innerHTML = '<form><input><button type="button" id="clear" hidden>Clear search</button><button>Search</button></form><p role="status"></p><ul></ul>';
    form = document.querySelector("form"); input = document.querySelector("input");
    clearButton = document.getElementById("clear");
    status = document.querySelector("p"); results = document.querySelector("ul");
    const root = document.createElement("section");
    root.className = "nearby-places"; root.hidden = true;
    root.innerHTML = '<h2>Nearby places</h2><p role="status"></p><ul></ul><button>Close nearby places</button><button>Clear nearby places</button>';
    document.body.append(root);
    nearby = { root, status: root.querySelector("p"), results: root.querySelector("ul"), closeButton: root.querySelectorAll("button")[0], clearButton: root.querySelectorAll("button")[1] };
    map = { flyTo: vi.fn(), fitBounds: vi.fn(), on: vi.fn() }; markers = []; close = vi.fn(); select = vi.fn(); clear = vi.fn();
    fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ features: [place()] }) });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("menu place search", () => {
    it.each(["maplibregl-marker", "maplibregl-popup"])("preserves clicks on %s", className => {
        const target = document.createElement("div"); target.className = className;
        setup(); clickMap(16.408, 48.213, { target });
        expect(fetchMock).not.toHaveBeenCalled(); expect(nearby.root.hidden).toBe(true);
    });

    it("keeps lookup errors inside the bottom panel", async () => {
        fetchMock.mockResolvedValueOnce({ ok: false });
        setup(); clickMap();
        await vi.waitFor(() => expect(nearby.status.textContent).toBe("Search unavailable. Try again."));
        expect(nearby.root.hidden).toBe(false); expect(status.textContent).toBe("");
        expect(nearby.results.children).toHaveLength(0);
    });

    it("closing the nearby bottom panel removes its pin and cancels the lookup", () => {
        fetchMock.mockReturnValueOnce(new Promise(() => {}));
        setup(); clickMap();
        nearby.closeButton.click();
        expect(nearby.root.hidden).toBe(true);
        expect(markers[0].remove).toHaveBeenCalledOnce();
        expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
        expect(clearButton.hidden).toBe(true);
    });

    it("keeps the latest map lookup when earlier results arrive afterwards", async () => {
        let resolve;
        fetchMock.mockReturnValueOnce(new Promise(r => { resolve = r; }));
        setup(); clickMap(); clickMap(16.409, 48.214);
        await vi.waitFor(() => expect(document.querySelector(".nearby-places")?.textContent).toContain("Wirtschaftsuniversität"));
        resolve({ ok: true, json: async () => ({ features: [place({ properties: { name: "Old café" } })] }) });
        await new Promise(r => setTimeout(r, 0));
        expect(document.querySelectorAll(".nearby-places")).toHaveLength(1);
        expect(document.querySelector(".nearby-places").textContent).not.toContain("Old café");
        expect(markers[0].remove).toHaveBeenCalledOnce(); expect(markers[1].center).toEqual([16.409, 48.214]);
    });

    it("clears a pending map lookup and ignores its late response", async () => {
        let resolve;
        fetchMock.mockReturnValueOnce(new Promise(r => { resolve = r; }));
        setup(); clickMap();
        expect(document.querySelector(".nearby-places").textContent).toContain("Searching…");
        clearButton.click();
        expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
        expect(nearby.root.hidden).toBe(true);
        expect(markers[0].remove).toHaveBeenCalledOnce();
        resolve({ ok: true, json: async () => ({ features: [place()] }) });
        await new Promise(r => setTimeout(r, 0));
        expect(nearby.root.hidden).toBe(true);
        expect(results.children).toHaveLength(0); expect(status.textContent).toBe("");
    });

    it("does not present an out-of-radius match as a nearby place", async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ features: [place({
            properties: { name: "Distant café", distance: 0.5 }
        })] }) });
        setup(); clickMap();
        await vi.waitFor(() => expect(document.querySelector(".nearby-places")?.textContent).toContain("No places found nearby."));
        expect(document.querySelector(".nearby-places").textContent).not.toContain("Distant café");
    });

    it("leaves clicks used by selection modes and existing markers alone", () => {
        setup("test-key", () => false); clickMap();
        expect(fetchMock).not.toHaveBeenCalled(); expect(markers).toHaveLength(0);
        expect(nearby.root.hidden).toBe(true);
    });

    it("looks up nearby OSM places at a map click without changing the view", async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ features: [place({ properties: {
            name: "Campus café", label: "Campus café, Welthandelsplatz 1, Wien", distance: 0.037
        } })] }) });
        setup(); clickMap();
        expect(nearby.root.hidden).toBe(false);
        await vi.waitFor(() => expect(document.body.textContent).toContain("Campus café"));
        const url = new URL(fetchMock.mock.calls[0][0]);
        expect(url.pathname).toBe("/geocode/reverse");
        expect(url.searchParams.get("point.lon")).toBe("16.408");
        expect(url.searchParams.get("point.lat")).toBe("48.213");
        expect(url.searchParams.get("boundary.circle.radius")).toBe("0.1");
        expect(url.searchParams.get("sources")).toBe("openstreetmap");
        expect(url.searchParams.get("size")).toBe("3");
        expect(document.body.textContent).toContain("Nearby places");
        expect(document.body.textContent).toContain("37 m away");
        expect(markers[0].center).toEqual([16.408, 48.213]);
        expect(clearButton.hidden).toBe(false);
        expect(map.flyTo).not.toHaveBeenCalled(); expect(map.fitBounds).not.toHaveBeenCalled();
    });

    it("clears the query, results, and pin without moving the map", async () => {
        setup(); expect(clearButton.hidden).toBe(true);
        await submit(); results.querySelector("button").click();
        expect(clearButton.hidden).toBe(false);
        clearButton.click();
        expect(input.value).toBe(""); expect(results.children).toHaveLength(0);
        expect(status.textContent).toBe(""); expect(markers[0].remove).toHaveBeenCalledOnce();
        expect(clear).toHaveBeenCalledOnce(); expect(clearButton.hidden).toBe(true);
        expect(document.activeElement).toBe(input); expect(map.flyTo).toHaveBeenCalledOnce();
    });

    it("removes the pin when the user deletes the whole query", async () => {
        setup(); await submit(); results.querySelector("button").click();
        input.value = ""; input.dispatchEvent(new Event("input"));
        expect(markers[0].remove).toHaveBeenCalledOnce(); expect(clear).toHaveBeenCalledOnce();
        expect(results.children).toHaveLength(0); expect(clearButton.hidden).toBe(true);
    });

    it("cancels a pending search and ignores its response after clearing", async () => {
        let resolve;
        fetchMock.mockReturnValueOnce(new Promise(r => { resolve = r; }));
        setup(); input.value = "WU Wien"; form.dispatchEvent(new Event("submit", { cancelable: true }));
        const signal = fetchMock.mock.calls[0][1].signal;
        clearButton.click(); expect(signal.aborted).toBe(true);
        resolve({ ok: true, json: async () => ({ features: [place()] }) });
        await new Promise(r => setTimeout(r, 0));
        expect(status.textContent).toBe(""); expect(results.children).toHaveLength(0);
        expect(input.value).toBe(""); expect(markers).toHaveLength(0);
    });

    it("searches only on submission, requests five OSM matches, and shows name and address", async () => {
        setup(); input.value = "WU Wien"; input.dispatchEvent(new Event("input"));
        expect(fetchMock).not.toHaveBeenCalled();
        await submit();
        const [url, options] = fetchMock.mock.calls[0];
        expect(new URL(url).searchParams.get("text")).toBe("WU Wien");
        expect(new URL(url).searchParams.get("sources")).toBe("openstreetmap");
        expect(new URL(url).searchParams.get("size")).toBe("5");
        expect(options.headers.Authorization).toBe("test-key");
        expect(results.textContent).toContain("Welthandelsplatz 1, Wien");
    });

    it("selects a place, replaces the pin, closes the menu, and retains results", async () => {
        setup(); await submit(); input.focus();
        results.querySelector("button").click();
        expect(map.flyTo).toHaveBeenCalledWith(expect.objectContaining({ center: [16.408, 48.213], zoom: 16 }));
        expect(close).toHaveBeenCalled(); expect(select).toHaveBeenCalled();
        expect(document.activeElement).not.toBe(input);
        results.querySelector("button").click();
        expect(markers[0].remove).toHaveBeenCalled();
        expect(input.value).toBe("WU Wien"); expect(results.children).toHaveLength(1);
    });

    it("fits valid result bounds and respects reduced motion", async () => {
        vi.stubGlobal("matchMedia", () => ({ matches: true }));
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ features: [place({ bbox: [16.4, 48.2, 16.42, 48.22] })] }) });
        setup(); await submit(); results.querySelector("button").click();
        expect(map.fitBounds).toHaveBeenCalledWith([[16.4, 48.2], [16.42, 48.22]], expect.objectContaining({ duration: 0, maxZoom: 16 }));
    });

    it("renders provider names as text and skips invalid coordinates", async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => ({ features: [place({ properties: { name: '<img src=x onerror="alert(1)">' } }), place({ geometry: { type: "Point", coordinates: [999, 48] } })] }) });
        setup(); await submit();
        expect(results.children).toHaveLength(1); expect(results.querySelector("img")).toBeNull();
        expect(results.textContent).toContain("<img");
    });

    it("does not request blank queries or a missing key", async () => {
        setup(""); await submit(" "); expect(fetchMock).not.toHaveBeenCalled();
        await submit(); expect(status.textContent).toContain("not configured"); expect(fetchMock).not.toHaveBeenCalled();
    });

    it("shows an empty state and permits retry after failure", async () => {
        setup(); fetchMock.mockResolvedValueOnce({ ok: false });
        await submit(); expect(status.textContent).toBe("Search unavailable. Try again.");
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ features: [] }) });
        await submit(); expect(status.textContent).toBe("No places found. Try a fuller name.");
        await submit(); expect(results.children).toHaveLength(1);
    });

    it("times out a stalled search and lets the user retry", async () => {
        vi.useFakeTimers();
        fetchMock.mockImplementationOnce((url, { signal }) => new Promise((resolve, reject) => {
            signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        }));
        setup(); input.value = "WU Wien";
        form.dispatchEvent(new Event("submit", { cancelable: true }));
        expect(status.textContent).toBe("Searching…");
        await vi.advanceTimersByTimeAsync(15000);
        expect(status.textContent).toBe("Search unavailable. Try again.");
        expect(results.hasAttribute("aria-busy")).toBe(false);
    });

    it("reports malformed responses and ignores invalid bounds when selecting", async () => {
        setup(); fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
        await submit(); expect(status.textContent).toBe("Search unavailable. Try again.");
        fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ features: [place({ bbox: [16, 48, 16, 48] })] }) });
        await submit(); results.querySelector("button").click();
        expect(map.flyTo).toHaveBeenCalled(); expect(map.fitBounds).not.toHaveBeenCalled();
    });

    it("discards a delayed response when the query changes", async () => {
        let resolve;
        fetchMock.mockReturnValueOnce(new Promise(r => { resolve = r; }));
        setup(); input.value = "old"; form.dispatchEvent(new Event("submit", { cancelable: true }));
        input.value = "new"; input.dispatchEvent(new Event("input"));
        await submit("new");
        resolve({ ok: true, json: async () => ({ features: [place({ properties: { name: "Old result" } })] }) });
        await new Promise(r => setTimeout(r, 0));
        expect(results.textContent).not.toContain("Old result");
        expect(results.textContent).toContain("Wirtschaftsuniversität");
    });
});
