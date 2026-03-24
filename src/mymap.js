import maplibregl from "maplibre-gl";

const bergfexTilesUrl = "https://tiles.bergfex.at/styles/bergfex-osm/512/{z}/{x}/{y}.png";
const favoriteDbName = "personal-map-db";
const favoriteStoreName = "favoriteLocations";
const trackingIdleTimeoutMs = 15 * 60 * 1000;
const baseStyleLoadTimeoutMs = 12000;
const locationSourceId = "user-location";
const locationAccuracyLayerId = "user-location-accuracy";
const locationHeadingLayerId = "user-location-heading";
const locationPointLayerId = "user-location-point";

const statusElement = document.getElementById("status");
const menuShell = document.getElementById("menuShell");
const layerMenuButton = document.getElementById("layerMenuButton");
const layerMenu = document.getElementById("layerMenu");
const locateButton = document.getElementById("locateButton");
const locationToggleLabel = document.getElementById("locationToggleLabel");
const saveFavoriteButton = document.getElementById("saveFavoriteButton");
const favoritesList = document.getElementById("favoritesList");
const favoritesEmpty = document.getElementById("favoritesEmpty");
const layerOptionElements = Array.from(document.querySelectorAll(".layer-option"));

const baseMapConfigs = {
    bergfex: {
        label: "Bergfex OSM",
        style: {
            version: 8,
            sources: {
                basemap: {
                    type: "raster",
                    tiles: [bergfexTilesUrl],
                    tileSize: 512,
                    maxzoom: 20
                }
            },
            layers: [
                {
                    id: "basemap",
                    type: "raster",
                    source: "basemap",
                    paint: {
                        "raster-resampling": "nearest"
                    }
                }
            ]
        }
    },
    osm: {
        label: "OpenStreetMap",
        style: {
            version: 8,
            sources: {
                basemap: {
                    type: "raster",
                    tiles: expandSubdomains("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"),
                    tileSize: 256,
                    maxzoom: 19
                }
            },
            layers: [
                {
                    id: "basemap",
                    type: "raster",
                    source: "basemap",
                    paint: {
                        "raster-resampling": "nearest"
                    }
                }
            ]
        }
    },
    openfreemap: {
        label: "OpenFreeMap Liberty",
        style: "https://tiles.openfreemap.org/styles/liberty"
    },
    opentopo: {
        label: "OpenTopoMap",
        style: {
            version: 8,
            sources: {
                basemap: {
                    type: "raster",
                    tiles: expandSubdomains("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"),
                    tileSize: 256,
                    maxzoom: 17
                }
            },
            layers: [
                {
                    id: "basemap",
                    type: "raster",
                    source: "basemap",
                    paint: {
                        "raster-resampling": "nearest"
                    }
                }
            ]
        }
    },
    cyclosm: {
        label: "CyclOSM",
        style: {
            version: 8,
            sources: {
                basemap: {
                    type: "raster",
                    tiles: expandSubdomains("https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png"),
                    tileSize: 256,
                    maxzoom: 20
                }
            },
            layers: [
                {
                    id: "basemap",
                    type: "raster",
                    source: "basemap",
                    paint: {
                        "raster-resampling": "nearest"
                    }
                }
            ]
        }
    },
    basemapGrauWmts: {
        label: "basemap.at Grau WMTS",
        style: {
            version: 8,
            sources: {
                basemap: {
                    type: "raster",
                    tiles: ["https://mapsneu.wien.gv.at/basemap/bmapgrau/normal/google3857/{z}/{y}/{x}.png"],
                    tileSize: 256,
                    maxzoom: 20
                }
            },
            layers: [
                {
                    id: "basemap",
                    type: "raster",
                    source: "basemap",
                    paint: {
                        "raster-resampling": "nearest"
                    }
                }
            ]
        }
    }
};

const map = new maplibregl.Map({
    style: baseMapConfigs.bergfex.style,
    center: [14.268, 46.59026],
    zoom: 15,
    container: "map",
    attributionControl: false
});

map.dragRotate.disable();
map.touchZoomRotate.disableRotation();

let watchId = null;
let hasCenteredOnPosition = false;
let previousFix = null;
let activeBaseLayerKey = "bergfex";
let statusTimeoutId = null;
let trackingIdleTimeoutId = null;
let favoritesDbPromise = null;
let currentLocationFeatureCollection = createEmptyLocationFeatureCollection();

function expandSubdomains(urlTemplate) {
    return ["a", "b", "c"].map((subdomain) => urlTemplate.replace("{s}", subdomain));
}

function createEmptyLocationFeatureCollection() {
    return {
        type: "FeatureCollection",
        features: []
    };
}

function ensureLocationOverlay() {
    if (!map.getSource(locationSourceId)) {
        map.addSource(locationSourceId, {
            type: "geojson",
            data: currentLocationFeatureCollection
        });
    }

    if (!map.getLayer(locationAccuracyLayerId)) {
        map.addLayer({
            id: locationAccuracyLayerId,
            type: "fill",
            source: locationSourceId,
            filter: ["==", ["get", "kind"], "accuracy"],
            paint: {
                "fill-color": "rgba(111, 242, 189, 0.17)",
                "fill-outline-color": "rgba(111, 242, 189, 0.9)"
            }
        });
    }

    if (!map.getLayer(locationHeadingLayerId)) {
        map.addLayer({
            id: locationHeadingLayerId,
            type: "fill",
            source: locationSourceId,
            filter: ["==", ["get", "kind"], "heading"],
            paint: {
                "fill-color": "rgba(72, 125, 255, 0.18)"
            }
        });
    }

    if (!map.getLayer(locationPointLayerId)) {
        map.addLayer({
            id: locationPointLayerId,
            type: "circle",
            source: locationSourceId,
            filter: ["==", ["get", "kind"], "point"],
            paint: {
                "circle-radius": 10,
                "circle-color": "rgba(23, 192, 139, 0.96)",
                "circle-stroke-color": "#ecfffa",
                "circle-stroke-width": 3
            }
        });
    }
}

function syncLocationOverlay() {
    const source = map.getSource(locationSourceId);
    if (source) {
        source.setData(currentLocationFeatureCollection);
    }
}

function setStatus(message) {
    statusElement.textContent = message;
    statusElement.classList.add("is-visible");
    window.clearTimeout(statusTimeoutId);
    statusTimeoutId = window.setTimeout(() => {
        statusElement.classList.remove("is-visible");
    }, 2800);
}

function registerScopedServiceWorker() {
    if (!import.meta.env.PROD || !window.isSecureContext || !("serviceWorker" in navigator)) {
        return;
    }

    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/mymap/sw.js", { scope: "/mymap/" })
            .catch((error) => {
                console.error("Unable to register the /mymap service worker.", error);
            });
    }, { once: true });
}

function setTrackingState(active) {
    locateButton.dataset.state = active ? "active" : "idle";
    locationToggleLabel.textContent = active ? "On" : "Off";
}

function clearTrackingIdleTimeout() {
    window.clearTimeout(trackingIdleTimeoutId);
    trackingIdleTimeoutId = null;
}

function scheduleTrackingIdleTimeout() {
    clearTrackingIdleTimeout();
    if (watchId === null) {
        return;
    }

    trackingIdleTimeoutId = window.setTimeout(() => {
        clearLocation();
        stopTracking("Location tracking stopped after 15 minutes of inactivity.");
    }, trackingIdleTimeoutMs);
}

function registerTrackingActivity() {
    if (watchId !== null) {
        scheduleTrackingIdleTimeout();
    }
}

function setLayerMenuOpen(isOpen) {
    menuShell.classList.toggle("is-open", isOpen);
    layerMenuButton.setAttribute("aria-expanded", String(isOpen));
}

function updateLayerOptionState(activeKey) {
    layerOptionElements.forEach((element) => {
        const isActive = element.dataset.layerKey === activeKey;
        element.dataset.active = String(isActive);
        element.setAttribute("aria-checked", String(isActive));
    });
}

function formatFavoriteCoordinates(longitude, latitude) {
    return latitude.toFixed(5) + ", " + longitude.toFixed(5);
}

function renderFavorites(favorites) {
    favoritesList.innerHTML = "";
    favoritesEmpty.hidden = favorites.length > 0;

    favorites.forEach((favorite) => {
        const row = document.createElement("div");
        row.className = "favorite-row";

        const button = document.createElement("button");
        button.type = "button";
        button.className = "favorite-item";

        const title = document.createElement("strong");
        title.textContent = favorite.name;

        const meta = document.createElement("span");
        meta.textContent = formatFavoriteCoordinates(favorite.longitude, favorite.latitude);

        button.appendChild(title);
        button.appendChild(meta);
        button.addEventListener("click", () => {
            map.easeTo({
                center: [favorite.longitude, favorite.latitude],
                duration: 650
            });
            setLayerMenuOpen(false);
            setStatus("Moved to " + favorite.name + ".");
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "favorite-delete";
        deleteButton.setAttribute("aria-label", "Delete " + favorite.name);
        deleteButton.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<path d="M3 6h18"></path>' +
            '<path d="M8 6V4h8v2"></path>' +
            '<path d="M19 6l-1 14H6L5 6"></path>' +
            '<path d="M10 11v6"></path>' +
            '<path d="M14 11v6"></path>' +
            "</svg>";
        deleteButton.addEventListener("click", async (event) => {
            event.stopPropagation();
            await deleteFavorite(favorite.id, favorite.name);
        });

        row.appendChild(button);
        row.appendChild(deleteButton);
        favoritesList.appendChild(row);
    });
}

function getFavoritesDb() {
    if (favoritesDbPromise) {
        return favoritesDbPromise;
    }

    favoritesDbPromise = new Promise((resolve, reject) => {
        const request = window.indexedDB.open(favoriteDbName, 1);

        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(favoriteStoreName)) {
                const store = database.createObjectStore(favoriteStoreName, {
                    keyPath: "id",
                    autoIncrement: true
                });
                store.createIndex("createdAt", "createdAt");
            }
        };

        request.onsuccess = () => {
            const database = request.result;
            database.onclose = () => {
                favoritesDbPromise = null;
            };
            database.onversionchange = () => {
                database.close();
                favoritesDbPromise = null;
            };
            resolve(database);
        };

        request.onerror = () => {
            favoritesDbPromise = null;
            reject(request.error);
        };

        request.onblocked = () => {
            favoritesDbPromise = null;
            reject(new Error("IndexedDB open request was blocked."));
        };
    });

    return favoritesDbPromise;
}

async function loadFavorites() {
    if (!("indexedDB" in window)) {
        favoritesEmpty.textContent = "IndexedDB is not available in this browser.";
        return;
    }

    try {
        const database = await getFavoritesDb();
        const favorites = await new Promise((resolve, reject) => {
            const transaction = database.transaction(favoriteStoreName, "readonly");
            const store = transaction.objectStore(favoriteStoreName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        favorites.sort((left, right) => right.createdAt - left.createdAt);
        renderFavorites(favorites);
    } catch (error) {
        favoritesEmpty.hidden = false;
        favoritesEmpty.textContent = "Unable to load saved locations.";
        console.error(error);
    }
}

async function saveCurrentViewAsFavorite() {
    if (!("indexedDB" in window)) {
        setStatus("IndexedDB is not available in this browser.");
        return;
    }

    const center = map.getCenter();
    if (!center) {
        setStatus("Map center is unavailable.");
        return;
    }

    const suggestedName = "Favorite " + new Date().toLocaleDateString();
    const name = window.prompt("Name this saved location:", suggestedName);
    if (name === null) {
        return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
        setStatus("Saved location needs a name.");
        return;
    }

    try {
        const database = await getFavoritesDb();
        await new Promise((resolve, reject) => {
            const transaction = database.transaction(favoriteStoreName, "readwrite");
            const store = transaction.objectStore(favoriteStoreName);

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);

            store.add({
                name: trimmedName,
                longitude: center.lng,
                latitude: center.lat,
                createdAt: Date.now()
            });
        });

        await loadFavorites();
        setStatus("Saved " + trimmedName + ".");
    } catch (error) {
        setStatus("Unable to save favorite location.");
        console.error(error);
    }
}

async function deleteFavorite(id, name) {
    if (!("indexedDB" in window)) {
        setStatus("IndexedDB is not available in this browser.");
        return;
    }

    try {
        const database = await getFavoritesDb();
        await new Promise((resolve, reject) => {
            const transaction = database.transaction(favoriteStoreName, "readwrite");
            const store = transaction.objectStore(favoriteStoreName);

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);

            store.delete(id);
        });

        await loadFavorites();
        setStatus("Deleted " + name + ".");
    } catch (error) {
        setStatus("Unable to delete favorite location.");
        console.error(error);
    }
}

function clearLocation() {
    currentLocationFeatureCollection = createEmptyLocationFeatureCollection();
    previousFix = null;
    syncLocationOverlay();
}

function stopTracking(message) {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

    clearTrackingIdleTimeout();
    setTrackingState(false);

    if (message) {
        setStatus(message);
    }
}

function normalizeHeading(headingDegrees) {
    return (headingDegrees % 360 + 360) % 360;
}

function bearingBetween(previousCoords, currentCoords) {
    const [previousLng, previousLat] = previousCoords;
    const [currentLng, currentLat] = currentCoords;
    const previousLatRad = previousLat * Math.PI / 180;
    const currentLatRad = currentLat * Math.PI / 180;
    const deltaLngRad = (currentLng - previousLng) * Math.PI / 180;
    const y = Math.sin(deltaLngRad) * Math.cos(currentLatRad);
    const x =
        Math.cos(previousLatRad) * Math.sin(currentLatRad) -
        Math.sin(previousLatRad) * Math.cos(currentLatRad) * Math.cos(deltaLngRad);
    return normalizeHeading(Math.atan2(y, x) * 180 / Math.PI);
}

function distanceBetween(previousCoords, currentCoords) {
    const earthRadius = 6371008.8;
    const [previousLng, previousLat] = previousCoords;
    const [currentLng, currentLat] = currentCoords;
    const previousLatRad = previousLat * Math.PI / 180;
    const currentLatRad = currentLat * Math.PI / 180;
    const deltaLatRad = (currentLat - previousLat) * Math.PI / 180;
    const deltaLngRad = (currentLng - previousLng) * Math.PI / 180;

    const a =
        Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
        Math.cos(previousLatRad) * Math.cos(currentLatRad) *
            Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
    return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateHeadingFromFixes(currentCoords) {
    if (!previousFix) {
        return null;
    }

    const distance = distanceBetween(previousFix.lngLat, currentCoords);
    if (distance < 5) {
        return null;
    }

    return bearingBetween(previousFix.lngLat, currentCoords);
}

function destinationPoint(center, bearingDegrees, distanceMeters) {
    const earthRadius = 6371008.8;
    const [lng, lat] = center;
    const lngRad = lng * Math.PI / 180;
    const latRad = lat * Math.PI / 180;
    const bearingRad = bearingDegrees * Math.PI / 180;
    const angularDistance = distanceMeters / earthRadius;

    const destinationLatRad = Math.asin(
        Math.sin(latRad) * Math.cos(angularDistance) +
            Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearingRad)
    );
    const destinationLngRad =
        lngRad +
        Math.atan2(
            Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(latRad),
            Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(destinationLatRad)
        );

    return [
        ((destinationLngRad * 180 / Math.PI + 540) % 360) - 180,
        destinationLatRad * 180 / Math.PI
    ];
}

function createCirclePolygon(center, radiusMeters, steps = 48) {
    const coordinates = [];
    for (let index = 0; index <= steps; index += 1) {
        coordinates.push(destinationPoint(center, index * (360 / steps), radiusMeters));
    }
    return coordinates;
}

function createHeadingCone(center, headingDegrees, accuracyMeters) {
    const spreadDegrees = 22;
    const coneLength = Math.max(accuracyMeters * 0.9, 55);
    const arcPoints = 18;
    const coordinates = [center];

    for (let index = 0; index <= arcPoints; index += 1) {
        const ratio = index / arcPoints;
        const bearing = headingDegrees - spreadDegrees + (spreadDegrees * 2 * ratio);
        coordinates.push(destinationPoint(center, bearing, coneLength));
    }

    coordinates.push(center);
    return coordinates;
}

function fitToAccuracyPolygon(coordinates) {
    const bounds = coordinates.reduce((lngLatBounds, coordinate) => {
        return lngLatBounds.extend(coordinate);
    }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));

    map.fitBounds(bounds, {
        padding: { top: 90, right: 24, bottom: 90, left: 24 },
        duration: 700,
        maxZoom: 17
    });
}

function applyBaseStyle(style) {
    return new Promise((resolve, reject) => {
        let settled = false;

        const cleanup = () => {
            window.clearTimeout(timeoutId);
            map.off("style.load", onStyleLoad);
            map.off("error", onError);
        };

        const onStyleLoad = () => {
            if (settled) {
                return;
            }

            settled = true;
            cleanup();
            resolve();
        };

        const onError = (event) => {
            if (settled) {
                return;
            }

            settled = true;
            cleanup();
            reject(event?.error || new Error("Map style failed to load."));
        };

        const timeoutId = window.setTimeout(() => {
            if (settled) {
                return;
            }

            settled = true;
            cleanup();
            reject(new Error("Timed out loading the selected base map."));
        }, baseStyleLoadTimeoutMs);

        map.on("style.load", onStyleLoad);
        map.on("error", onError);
        map.setStyle(style);
    });
}

function updateLocation(position) {
    const lngLat = [position.coords.longitude, position.coords.latitude];
    const accuracy = Math.max(position.coords.accuracy || 0, 8);
    const reportedHeading = Number.isFinite(position.coords.heading)
        ? normalizeHeading(position.coords.heading)
        : null;
    const derivedHeading = calculateHeadingFromFixes(lngLat);
    const speed = Number.isFinite(position.coords.speed) ? position.coords.speed : null;
    const heading = reportedHeading ?? derivedHeading;
    const isMoving = (speed !== null && speed > 0.7) || derivedHeading !== null;
    const accuracyPolygon = createCirclePolygon(lngLat, accuracy);

    const features = [
        {
            type: "Feature",
            properties: { kind: "accuracy" },
            geometry: {
                type: "Polygon",
                coordinates: [accuracyPolygon]
            }
        },
        {
            type: "Feature",
            properties: { kind: "point" },
            geometry: {
                type: "Point",
                coordinates: lngLat
            }
        }
    ];

    if (heading !== null && isMoving) {
        features.push({
            type: "Feature",
            properties: { kind: "heading" },
            geometry: {
                type: "Polygon",
                coordinates: [createHeadingCone(lngLat, heading, accuracy)]
            }
        });
    }

    currentLocationFeatureCollection = {
        type: "FeatureCollection",
        features
    };
    syncLocationOverlay();

    if (!hasCenteredOnPosition) {
        fitToAccuracyPolygon(accuracyPolygon);
        hasCenteredOnPosition = true;
        setStatus("Location shown on map.");
    }

    previousFix = {
        lngLat,
        timestamp: position.timestamp
    };
}

function handleLocationError(error) {
    clearLocation();

    const messageByCode = {
        1: "Location access was denied. Enable permission in your browser settings and try again.",
        2: "Your position is currently unavailable. Move to an area with better GPS or network reception.",
        3: "The location request timed out. Try again when the device has a stronger signal."
    };

    stopTracking(messageByCode[error.code] || "Unable to determine your location.");
}

async function setBaseLayer(key) {
    if (!baseMapConfigs[key] || key === activeBaseLayerKey) {
        setLayerMenuOpen(false);
        return;
    }

    const previousBaseLayerKey = activeBaseLayerKey;
    layerMenuButton.disabled = true;

    try {
        await applyBaseStyle(baseMapConfigs[key].style);
        ensureLocationOverlay();
        syncLocationOverlay();
        activeBaseLayerKey = key;
        updateLayerOptionState(key);
        setLayerMenuOpen(false);
        setStatus("Base map switched to " + baseMapConfigs[key].label + ".");
    } catch (error) {
        try {
            await applyBaseStyle(baseMapConfigs[previousBaseLayerKey].style);
            ensureLocationOverlay();
            syncLocationOverlay();
        } catch (restoreError) {
            console.error("Unable to restore the previous base map.", restoreError);
        }

        updateLayerOptionState(activeBaseLayerKey);
        setStatus("Unable to load " + baseMapConfigs[key].label + ".");
        console.error(error);
    } finally {
        layerMenuButton.disabled = false;
    }
}

locateButton.addEventListener("click", () => {
    if (!("geolocation" in navigator)) {
        setStatus("This browser does not support geolocation.");
        return;
    }

    if (watchId !== null) {
        clearLocation();
        stopTracking("Location hidden.");
        return;
    }

    hasCenteredOnPosition = false;
    setTrackingState(true);
    setStatus("Requesting your current position...");
    scheduleTrackingIdleTimeout();

    watchId = navigator.geolocation.watchPosition(updateLocation, handleLocationError, {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000
    });
});

layerMenuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    setLayerMenuOpen(!menuShell.classList.contains("is-open"));
});

layerMenu.addEventListener("click", (event) => {
    event.stopPropagation();
});

layerOptionElements.forEach((element) => {
    element.addEventListener("click", () => {
        setBaseLayer(element.dataset.layerKey);
    });
});

saveFavoriteButton.addEventListener("click", () => {
    saveCurrentViewAsFavorite();
});

["pointerdown", "touchstart", "wheel", "keydown"].forEach((eventName) => {
    document.addEventListener(eventName, registerTrackingActivity, { passive: true });
});

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && watchId !== null) {
        clearLocation();
        stopTracking();
    }
});

window.addEventListener("pagehide", () => {
    if (watchId !== null) {
        clearLocation();
        stopTracking();
    }
});

document.addEventListener("click", () => {
    setLayerMenuOpen(false);
});

registerScopedServiceWorker();

map.on("load", () => {
    ensureLocationOverlay();
    updateLayerOptionState(activeBaseLayerKey);
    loadFavorites();
});
