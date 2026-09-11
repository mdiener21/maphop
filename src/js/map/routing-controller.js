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
    let draggedPointIndex = null;

    function coordinates() {
        return start && destination ? [start, ...stops, destination] : [];
    }

    function routePoints() {
        return [start, ...stops, destination].filter(Boolean);
    }

    function setRoutePoints(points) {
        start = points[0] ?? null;
        destination = points.length > 1 ? points.at(-1) : null;
        stops = points.length > 2 ? points.slice(1, -1) : [];
    }

    function markerPoints() {
        const points = routePoints();
        return points.map((coordinate, index) => ({
            coordinate,
            type: index === 0 ? "start" : index === points.length - 1 ? "destination" : "stop",
            index
        }));
    }

    function syncFields() {
        panel.startField.textContent = start ? `1 · ${formatLocation(start)}` : "Tap to select location on map";
        panel.destinationField.textContent = destination
            ? `${stops.length + 2} · ${formatLocation(destination)}`
            : "Tap to select location on map";
        renderPointsList();
        panel.addStopButton.hidden = !start || !destination;
        panel.distance.hidden = !route.features.length;
        panel.duration.hidden = !route.features.length;
    }

    function pointLabel(index, total) {
        if (index === 0) return "Start";
        if (index === total - 1) return "Destination";
        return `Stop ${index}`;
    }

    function reorderPoint(fromIndex, toIndex) {
        if (fromIndex === toIndex) return;
        const points = routePoints();
        const [point] = points.splice(fromIndex, 1);
        points.splice(toIndex, 0, point);
        setRoutePoints(points);
        refreshRoute();
    }

    function renderPointsList() {
        const points = routePoints();
        const clearDragState = () => {
            panel.pointsList.querySelectorAll(".is-dragging, .is-drop-target").forEach((element) => {
                element.classList.remove("is-dragging", "is-drop-target");
            });
        };
        panel.pointsList.replaceChildren(...points.map((point, index) => {
            const row = document.createElement("div");
            row.className = "routing-point-row";
            row.draggable = true;

            const handle = document.createElement("button");
            handle.className = "routing-drag-handle";
            handle.type = "button";
            handle.textContent = "☰";
            handle.setAttribute("aria-label", `Drag ${pointLabel(index, points.length)} to reorder`);
            handle.draggable = true;

            const copy = document.createElement("span");
            copy.className = "routing-point-copy";
            const title = document.createElement("strong");
            title.textContent = `${index + 1} · ${pointLabel(index, points.length)}`;
            const location = document.createElement("span");
            location.textContent = formatLocation(point);
            copy.append(title, location);
            row.append(handle, copy);

            if (index > 0 && index < points.length - 1) {
                const remove = document.createElement("button");
                remove.className = "routing-delete-point";
                remove.type = "button";
                remove.textContent = "×";
                remove.setAttribute("aria-label", `Remove stop ${index}`);
                remove.addEventListener("click", () => {
                    const updatedPoints = routePoints();
                    updatedPoints.splice(index, 1);
                    setRoutePoints(updatedPoints);
                    refreshRoute();
                });
                row.append(remove);
            } else {
                const spacer = document.createElement("span");
                spacer.setAttribute("aria-hidden", "true");
                row.append(spacer);
            }

            const startDrag = (event) => {
                draggedPointIndex = index;
                clearDragState();
                row.classList.add("is-dragging");
                event.dataTransfer?.setData("text/plain", String(index));
            };
            row.addEventListener("dragstart", startDrag);
            handle.addEventListener("dragstart", startDrag);
            row.addEventListener("dragover", (event) => {
                event.preventDefault();
                if (draggedPointIndex !== index) {
                    clearDragState();
                    row.classList.add("is-drop-target");
                }
            });
            row.addEventListener("drop", (event) => {
                event.preventDefault();
                const fromIndex = Number(event.dataTransfer?.getData("text/plain") ?? draggedPointIndex);
                if (Number.isInteger(fromIndex)) reorderPoint(fromIndex, index);
                draggedPointIndex = null;
                clearDragState();
            });
            row.addEventListener("dragend", () => {
                draggedPointIndex = null;
                clearDragState();
            });
            handle.addEventListener("pointerdown", () => {
                draggedPointIndex = index;
                clearDragState();
                row.classList.add("is-dragging");
            });
            handle.addEventListener("pointerup", (event) => {
                const targetRow = document.elementFromPoint(event.clientX, event.clientY)?.closest(".routing-point-row");
                const targetIndex = Number(targetRow?.dataset.pointIndex);
                if (Number.isInteger(draggedPointIndex) && Number.isInteger(targetIndex)) reorderPoint(draggedPointIndex, targetIndex);
                draggedPointIndex = null;
                clearDragState();
            });
            row.dataset.pointIndex = String(index);
            return row;
        }));
        panel.pointsList.hidden = points.length < 2;
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
        if (!route.features.length && !map.getSource(routeSourceId)) return;
        ensureOverlay();
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
                const points = routePoints();
                points[point.index] = movedCoordinate;
                setRoutePoints(points);
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
        const selectedType = selection;
        if (selectedType === "start") start = coordinate;
        else if (selectedType === "destination") destination = coordinate;
        else stops.push(coordinate);
        selection = null;
        refreshRoute();
        // Once a route exists, leave the map visible after placing extra stops.
        // The start-location flow still returns to Routing so the user can choose
        // their destination.
        if (selectedType === "start") onMenuOpen?.();
    }

    function open() {
        active = true;
        panel.root.hidden = false;
        syncRoute();
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

    return { clear, close, ensureAfterStyleLoad: syncRoute, open };
}
