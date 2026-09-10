const routeSourceId = "walking-route";
const routeOutlineLayerId = "walking-route-outline";
const routeLineLayerId = "walking-route-line";

function emptyRoute() {
    return { type: "FeatureCollection", features: [] };
}

function formatDistance(meters) {
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

function formatDuration(seconds) {
    const minutes = Math.round(seconds / 60);
    return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

function formatLocation([longitude, latitude]) {
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

function createPin(number, type) {
    const pin = document.createElement("div");
    pin.className = `route-pin route-pin-${type}`;
    pin.setAttribute("aria-label", `Route stop ${number}. Drag to move.`);
    const label = document.createElement("span");
    label.textContent = String(number);
    pin.append(label);
    return pin;
}

export function createRoutingController({ map, maplibregl, apiKey, panel, onMenuClose, onMenuOpen, onStatus }) {
    let start = null;
    let destination = null;
    let stops = [];
    let markers = [];
    let route = emptyRoute();
    let requestController = null;
    let active = false;
    let selection = null;

    function coordinates() {
        return start && destination ? [start, ...stops, destination] : [];
    }

    function markerPoints() {
        return [
            ...(start ? [{ type: "start", coordinate: start }] : []),
            ...stops.map((coordinate, index) => ({ type: "stop", coordinate, index })),
            ...(destination ? [{ type: "destination", coordinate: destination }] : [])
        ];
    }

    function syncFields() {
        panel.startField.textContent = start ? `1 · ${formatLocation(start)}` : "Tap to select location on map";
        panel.destinationField.textContent = destination
            ? `${stops.length + 2} · ${formatLocation(destination)}`
            : "Tap to select location on map";
        panel.stopsList.replaceChildren(...stops.map((stop, index) => {
            const item = document.createElement("p");
            item.className = "routing-stop";
            item.textContent = `${index + 2} · ${formatLocation(stop)}`;
            return item;
        }));
        panel.stopsList.hidden = stops.length === 0;
        panel.addStopButton.hidden = !start || !destination;
        panel.distance.hidden = !route.features.length;
        panel.duration.hidden = !route.features.length;
    }

    function ensureOverlay() {
        if (!map.getSource(routeSourceId)) map.addSource(routeSourceId, { type: "geojson", data: route });
        if (!map.getLayer(routeOutlineLayerId)) {
            map.addLayer({ id: routeOutlineLayerId, type: "line", source: routeSourceId,
                paint: { "line-color": "#ffffff", "line-width": 10, "line-opacity": 0.96 } });
        }
        if (!map.getLayer(routeLineLayerId)) {
            map.addLayer({ id: routeLineLayerId, type: "line", source: routeSourceId,
                paint: { "line-color": "#dc3030", "line-width": 6, "line-opacity": 1 } });
        }
    }

    function syncRoute() {
        map.getSource(routeSourceId)?.setData(route);
    }

    function syncMarkers() {
        markers.forEach((marker) => marker.remove());
        markers = markerPoints().map((point, index) => {
            const marker = new maplibregl.Marker({ element: createPin(index + 1, point.type), anchor: "bottom", draggable: true })
                .setLngLat(point.coordinate)
                .addTo(map);
            marker.on("dragend", () => {
                const moved = marker.getLngLat();
                const movedCoordinate = [moved.lng, moved.lat];
                if (point.type === "start") start = movedCoordinate;
                else if (point.type === "destination") destination = movedCoordinate;
                else stops[point.index] = movedCoordinate;
                refreshRoute();
            });
            return marker;
        });
    }

    function resetRoute() {
        requestController?.abort();
        requestController = null;
        route = emptyRoute();
        syncRoute();
        syncFields();
    }

    async function requestRoute() {
        if (!start || !destination || !apiKey) return;
        if (!navigator.onLine) {
            panel.status.textContent = "Routing needs an internet connection.";
            return;
        }
        requestController?.abort();
        requestController = new AbortController();
        panel.status.textContent = "Finding route…";
        try {
            const response = await fetch(`https://api.openrouteservice.org/v2/directions/${panel.profile.value}/geojson`, {
                method: "POST",
                headers: { Authorization: apiKey, "Content-Type": "application/json" },
                body: JSON.stringify({ coordinates: coordinates() }),
                signal: requestController.signal
            });
            if (!response.ok) throw new Error("route request failed");
            const feature = (await response.json()).features?.[0];
            if (!feature?.geometry || !active) throw new Error("route unavailable");
            route = { type: "FeatureCollection", features: [feature] };
            syncRoute();
            panel.distance.textContent = `Distance: ${formatDistance(feature.properties.summary.distance)}`;
            panel.duration.textContent = `Time: ${formatDuration(feature.properties.summary.duration)}`;
            panel.status.textContent = "";
            syncFields();
        } catch (error) {
            if (error.name !== "AbortError") panel.status.textContent = "Could not calculate a route. Please try again.";
        }
    }

    function refreshRoute() {
        resetRoute();
        syncMarkers();
        requestRoute();
    }

    function beginSelection(type) {
        if (type === "destination" && !start) {
            panel.status.textContent = "Select a start location first.";
            return;
        }
        selection = type;
        panel.status.textContent = "Tap a location on the map.";
        onMenuClose?.();
    }

    function onMapClick(event) {
        if (!active || !selection) return;
        const coordinate = [event.lngLat.lng, event.lngLat.lat];
        if (selection === "start") start = coordinate;
        else if (selection === "destination") destination = coordinate;
        else stops.push(coordinate);
        selection = null;
        refreshRoute();
        onMenuOpen?.();
    }

    function open() {
        active = true;
        panel.root.hidden = false;
        ensureOverlay();
        syncFields();
        if (!navigator.onLine) {
            panel.status.textContent = "Routing needs an internet connection.";
            onStatus("Routing needs an internet connection.");
        } else if (!apiKey) {
            panel.status.textContent = "Routing preview is ready. Add an API key to calculate routes.";
            onStatus("Routing is not configured for this deployment.");
        }
    }

    function clear() {
        start = null;
        destination = null;
        stops = [];
        selection = null;
        markers.forEach((marker) => marker.remove());
        markers = [];
        resetRoute();
    }

    function close() {
        active = false;
        clear();
        panel.root.hidden = true;
    }

    function useCurrentLocation() {
        if (!("geolocation" in navigator)) {
            panel.status.textContent = "This browser does not support location access.";
            return;
        }
        panel.status.textContent = "Requesting your current location…";
        navigator.geolocation.getCurrentPosition(
            (position) => {
                start = [position.coords.longitude, position.coords.latitude];
                refreshRoute();
                panel.status.textContent = "Now select a destination.";
            },
            () => { panel.status.textContent = "Location access was denied or unavailable."; },
            { enableHighAccuracy: true, maximumAge: 15000, timeout: 15000 }
        );
    }

    map.on("click", onMapClick);
    panel.profile.addEventListener("change", requestRoute);
    panel.startField.addEventListener("click", () => beginSelection("start"));
    panel.destinationField.addEventListener("click", () => beginSelection("destination"));
    panel.addStopButton.addEventListener("click", () => beginSelection("stop"));
    panel.currentLocationButton.addEventListener("click", useCurrentLocation);
    panel.clearButton.addEventListener("click", clear);
    panel.closeButton.addEventListener("click", close);

    return { clear, close, ensureAfterStyleLoad: () => { ensureOverlay(); syncRoute(); }, open };
}
