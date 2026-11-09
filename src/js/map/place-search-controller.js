function validCoordinates(coordinates) {
    return Array.isArray(coordinates) && coordinates.length >= 2
        && Number.isFinite(coordinates[0]) && Math.abs(coordinates[0]) <= 180
        && Number.isFinite(coordinates[1]) && Math.abs(coordinates[1]) <= 90;
}

function resultBounds(bbox) {
    if (!Array.isArray(bbox) || bbox.length !== 4) return null;
    const southwest = bbox.slice(0, 2);
    const northeast = bbox.slice(2, 4);
    return validCoordinates(southwest) && validCoordinates(northeast)
        && bbox[0] < bbox[2] && bbox[1] < bbox[3] ? [southwest, northeast] : null;
}

export function createPlaceSearchController({ map, maplibregl, apiKey, form, input, clearButton, status, results, nearby, onMenuClose, onSelect, onClear, canInspectMap = () => true }) {
    let pendingRequest = null;
    let requestVersion = 0;
    let marker = null;

    function invalidateRequest() {
        requestVersion += 1;
        pendingRequest?.abort();
        pendingRequest = null;
        nearby.root.hidden = true;
        nearby.results.replaceChildren();
        nearby.status.textContent = "";
        publishNearbyHeight();
        results.replaceChildren();
        results.removeAttribute("aria-busy");
        status.textContent = "";
        clearButton.hidden = !input.value && !marker;
    }

    function clearSearch() {
        input.value = "";
        marker?.remove();
        marker = null;
        invalidateRequest();
        onClear();
    }

    function selectPlace(feature, name) {
        onMenuClose();
        input.blur();
        marker?.remove();
        marker = new maplibregl.Marker({ color: "#6ff2bd" })
            .setLngLat(feature.geometry.coordinates.slice(0, 2)).addTo(map);
        marker.getElement().classList.add("search-location-marker");
        marker.getElement().setAttribute("aria-label", name);
        marker.getElement().title = name;
        const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 700;
        const bounds = resultBounds(feature.bbox);
        if (bounds) map.fitBounds(bounds, { padding: 48, maxZoom: 16, duration });
        else map.flyTo({ center: feature.geometry.coordinates.slice(0, 2), zoom: 16, duration });
        onSelect();
    }

    function renderResults(features) {
        const places = features.filter(feature => feature?.geometry?.type === "Point"
            && validCoordinates(feature.geometry.coordinates)).slice(0, 5);
        for (const feature of places) {
            const properties = feature.properties ?? {};
            const name = String(properties.name || properties.label || "Unnamed place");
            const label = String(properties.label || [
                [properties.street, properties.housenumber].filter(Boolean).join(" "),
                properties.locality, properties.country
            ].filter(Boolean).join(", "));
            const address = label.startsWith(`${name}, `) ? label.slice(name.length + 2) : label;
            const item = document.createElement("li");
            const button = document.createElement("button");
            button.type = "button";
            button.className = "place-search-result";
            const title = document.createElement("strong");
            title.textContent = name;
            button.append(title);
            if (address && address !== name) {
                const detail = document.createElement("span");
                detail.textContent = address;
                button.append(detail);
            }
            button.addEventListener("click", () => selectPlace(feature, name));
            item.append(button);
            results.append(item);
        }
        status.textContent = places.length ? `${places.length} ${places.length === 1 ? "place" : "places"} found.`
            : "No places found. Try a fuller name.";
    }

    async function requestPlaces(url, render, feedback = status) {
        if (!apiKey) {
            feedback.textContent = "Place search is not configured.";
            return;
        }
        const version = requestVersion;
        const controller = new AbortController();
        pendingRequest = controller;
        const timeout = window.setTimeout(() => controller.abort(), 15000);
        feedback.textContent = "Searching…";
        results.setAttribute("aria-busy", "true");
        try {
            const response = await fetch(url.toString(), {
                headers: { Authorization: apiKey }, signal: controller.signal, cache: "no-store"
            });
            if (!response.ok) throw new Error("Place search failed");
            const data = await response.json();
            if (version !== requestVersion) return;
            if (!Array.isArray(data.features)) throw new Error("Invalid search response");
            render(data.features);
        } catch {
            if (version === requestVersion) feedback.textContent = "Search unavailable. Try again.";
        } finally {
            window.clearTimeout(timeout);
            if (version === requestVersion) {
                pendingRequest = null;
                results.removeAttribute("aria-busy");
            }
        }
    }

    function search(event) {
        event.preventDefault();
        invalidateRequest();
        const query = input.value.trim();
        if (!query) {
            clearSearch();
            return;
        }
        const url = new URL("https://api.openrouteservice.org/geocode/search");
        url.search = new URLSearchParams({ text: query, sources: "openstreetmap", size: "5" });
        requestPlaces(url, renderResults);
    }

    function inspectMap(event) {
        if (event.defaultPrevented || !canInspectMap(event)
            || event.originalEvent?.target?.closest?.(".maplibregl-marker, .maplibregl-popup")) return;
        const coordinates = [event.lngLat.lng, event.lngLat.lat];
        if (!validCoordinates(coordinates)) return;
        clearSearch();
        onMenuClose();
        marker = new maplibregl.Marker({ color: "#6ff2bd" }).setLngLat(coordinates).addTo(map);
        marker.getElement().classList.add("search-location-marker");
        marker.getElement().setAttribute("aria-label", "Nearby places");
        clearButton.hidden = false;
        onSelect();

        nearby.root.hidden = false;
        const feedback = nearby.status;
        const list = nearby.results;
        publishNearbyHeight();

        const url = new URL("https://api.openrouteservice.org/geocode/reverse");
        url.search = new URLSearchParams({
            "point.lon": String(coordinates[0]), "point.lat": String(coordinates[1]),
            "boundary.circle.radius": "0.1", sources: "openstreetmap", layers: "venue,address,street", size: "3"
        });
        requestPlaces(url, features => {
            const places = features.filter(feature => feature?.geometry?.type === "Point"
                && validCoordinates(feature.geometry.coordinates)
                && (!Number.isFinite(feature.properties?.distance)
                    || (feature.properties.distance >= 0 && feature.properties.distance <= 0.1))).slice(0, 3);
            for (const feature of places) {
                const properties = feature.properties ?? {};
                const item = document.createElement("li");
                const name = document.createElement("strong");
                name.textContent = String(properties.name || properties.label || "Unnamed place");
                item.append(name);
                if (properties.label && properties.label !== name.textContent) {
                    const address = document.createElement("span");
                    address.className = "nearby-place-address";
                    address.textContent = String(properties.label).replace(`${name.textContent}, `, "");
                    item.append(address);
                }
                if (Number.isFinite(properties.distance)) {
                    const distance = document.createElement("span");
                    distance.className = "nearby-place-distance";
                    distance.textContent = `${Math.round(properties.distance * 1000)} m away`;
                    item.append(distance);
                }
                list.append(item);
            }
            feedback.textContent = places.length ? `${places.length} ${places.length === 1 ? "place" : "places"} within about 100 m` : "No places found nearby.";
            publishNearbyHeight();
        }, feedback);
    }

    function publishNearbyHeight() {
        nearby.root.parentElement?.style.setProperty("--nearby-places-height", `${nearby.root.hidden ? 0 : nearby.root.offsetHeight}px`);
    }

    function dismissNearby() {
        if (!nearby.root.hidden) clearSearch();
    }

    [nearby.closeButton, nearby.clearButton].forEach(button => {
        button.addEventListener("click", () => {
            clearSearch();
            map.getCanvas?.().focus();
        });
    });
    if (typeof ResizeObserver === "function") new ResizeObserver(publishNearbyHeight).observe(nearby.root);

    input.addEventListener("input", () => {
        if (!input.value.trim()) clearSearch();
        else invalidateRequest();
    });
    clearButton.addEventListener("click", () => {
        clearSearch();
        input.focus();
    });
    form.addEventListener("submit", search);
    map.on("click", inspectMap);
    return { dismissNearby };
}
