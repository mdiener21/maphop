import maplibregl from "maplibre-gl";
import { Protocol as PmtilesProtocol } from "pmtiles";
import { version } from "../../package.json";
import {
    deleteFavoriteById,
    isFavoritesStorageAvailable,
    readFavorites,
    saveFavorite
} from "./favorite-store.js";
import { LocationTracker } from "./location-tracker.js";

const bergfexTilesUrl = "https://tiles.bergfex.at/styles/bergfex-osm/512/{z}/{x}/{y}.png";
const baseStyleLoadTimeoutMs = 12000;

const statusElement = document.getElementById("status");
const menuShell = document.getElementById("menuShell");
const layerMenuButton = document.getElementById("layerMenuButton");
const layerMenu = document.getElementById("layerMenu");
const locateButton = document.getElementById("locateButton");
const locationToggleLabel = document.getElementById("locationToggleLabel");
const saveFavoriteButton = document.getElementById("saveFavoriteButton");
const favoritesList = document.getElementById("favoritesList");
const favoritesEmpty = document.getElementById("favoritesEmpty");
const favoritesSectionToggle = document.getElementById("favoritesSectionToggle");
const mapsSectionToggle = document.getElementById("mapsSectionToggle");
const appVersionElement = document.getElementById("appVersion");
const layerOptionElements = Array.from(document.querySelectorAll(".layer-option"));
const menuSectionToggleElements = [favoritesSectionToggle, mapsSectionToggle].filter(Boolean);
const installBanner = document.getElementById("installBanner");
const installButton = document.getElementById("installButton");
const installDismiss = document.getElementById("installDismiss");
const iosBanner = document.getElementById("iosBanner");
const iosDismiss = document.getElementById("iosDismiss");
const reCenterButton = document.getElementById("reCenterButton");
const compassButton = document.getElementById("compassButton");
const compassNeedle = document.getElementById("compassNeedle");
const terrainButton = document.getElementById("terrainButton");
const terrainToggleLabel = document.getElementById("terrainToggleLabel");
const attributionButton = document.getElementById("attributionButton");
const attributionPanel = document.getElementById("attributionPanel");
const attributionText = document.getElementById("attributionText");

appVersionElement.textContent = `version ${version}`;

const baseMapConfigs = {
    bergfex: {
        label: "Bergfex OSM",
        attribution: '&copy; <a href="https://www.bergfex.at" target="_blank" rel="noopener">Bergfex</a> &middot; &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
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
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
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
        attribution: '&copy; <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &middot; &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
        style: "https://tiles.openfreemap.org/styles/liberty"
    },
    opentopo: {
        label: "OpenTopoMap",
        attribution: '&copy; <a href="https://opentopomap.org" target="_blank" rel="noopener">OpenTopoMap</a> &middot; &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
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
        attribution: '&copy; <a href="https://www.cyclosm.org" target="_blank" rel="noopener">CyclOSM</a> &middot; &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
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
    esriSatellite: {
        label: "Esri Satellite",
        attribution: '&copy; <a href="https://www.esri.com" target="_blank" rel="noopener">Esri</a>, Maxar, Earthstar Geographics &middot; &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
        style: {
            version: 8,
            sources: {
                basemap: {
                    type: "raster",
                    tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.jpg"],
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
    basemapGrauWmts: {
        label: "basemap.at Grau WMTS",
        attribution: '&copy; <a href="https://basemap.at" target="_blank" rel="noopener">basemap.at</a> &middot; &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
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

const pmtilesProtocol = new PmtilesProtocol();
maplibregl.addProtocol("pmtiles", pmtilesProtocol.tile);

const map = new maplibregl.Map({
    style: baseMapConfigs.bergfex.style,
    center: [14.268, 46.59026],
    zoom: 15,
    container: "map",
    attributionControl: false,
    maxPitch: 85
});

let activeBaseLayerKey = "bergfex";
let statusTimeoutId = null;
let deferredInstallPrompt = null;
let terrainActive = false;

const terrainSourceId = "terrain-source";
const hillshadeSourceId = "hillshade-source";
const hillshadeLayerId = "terrain-hillshade";
const terrainTileJsonUrl = "https://tiles.mapterhorn.com/tilejson.json";
const hillshadeTilesUrl = "https://mapsneu.wien.gv.at/basemap/bmapgelaende/grau/google3857/{z}/{y}/{x}.jpeg";

const tracker = new LocationTracker(map, {
    onStatus: setStatus,
    onTrackingStateChange: setTrackingState
});

function expandSubdomains(urlTemplate) {
    return ["a", "b", "c"].map((subdomain) => urlTemplate.replace("{s}", subdomain));
}

function setStatus(message) {
    statusElement.textContent = message;
    statusElement.classList.add("is-visible");
    window.clearTimeout(statusTimeoutId);
    statusTimeoutId = window.setTimeout(() => {
        statusElement.classList.remove("is-visible");
    }, 2800);
}

function registerServiceWorker() {
    if (!import.meta.env.PROD || !window.isSecureContext || !("serviceWorker" in navigator)) {
        return;
    }

    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/sw.js", { scope: "/" })
            .catch((error) => {
                console.error("Unable to register service worker.", error);
            });
    }, { once: true });
}

const IOS_SNOOZE_KEY = "ios-hint-snoozed-until";
const SNOOZE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isIosHintSnoozed() {
    try {
        const until = Number(localStorage.getItem(IOS_SNOOZE_KEY));
        return Number.isFinite(until) && Date.now() < until;
    } catch {
        return false;
    }
}

function snoozeIosHint() {
    try {
        localStorage.setItem(IOS_SNOOZE_KEY, String(Date.now() + SNOOZE_DURATION_MS));
    } catch {
        // localStorage unavailable (private browsing quota etc.) — silently continue
    }
}

function initInstallPrompt() {
    // iOS Safari: no beforeinstallprompt — detect and show a manual hint instead
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        navigator.standalone === true;

    if (isIos && !isInStandalone && !isIosHintSnoozed()) {
        iosBanner.hidden = false;
    }

    iosDismiss?.addEventListener("click", () => {
        iosBanner.hidden = true;
        snoozeIosHint();
    });
}

function setTrackingState(active) {
    locateButton.dataset.state = active ? "active" : "idle";
    locationToggleLabel.textContent = active ? "On" : "Off";
    if (!active) {
        reCenterButton.hidden = true;
    }
}

function setTerrainState(active) {
    terrainButton.dataset.state = active ? "active" : "idle";
    terrainToggleLabel.textContent = active ? "On" : "Off";
}

function updateAttribution() {
    let html = baseMapConfigs[activeBaseLayerKey].attribution;
    if (terrainActive) {
        html += ' &middot; Hillshade &copy; <a href="https://basemap.at" target="_blank" rel="noopener">basemap.at</a> &middot; Terrain &copy; <a href="https://mapterhorn.com" target="_blank" rel="noopener">Mapterhorn</a>';
    }
    attributionText.innerHTML = html;
}

function setAttributionOpen(isOpen) {
    attributionPanel.hidden = !isOpen;
    attributionButton.setAttribute("aria-expanded", String(isOpen));
}

function applyTerrain() {
    if (!map.getSource(terrainSourceId)) {
        map.addSource(terrainSourceId, {
            type: "raster-dem",
            url: terrainTileJsonUrl,
            encoding: "terrarium"
        });
    }

    if (!map.getSource(hillshadeSourceId)) {
        map.addSource(hillshadeSourceId, {
            type: "raster",
            tiles: [hillshadeTilesUrl],
            tileSize: 256,
            maxzoom: 18
        });
    }

    if (!map.getLayer(hillshadeLayerId)) {
        map.addLayer({
            id: hillshadeLayerId,
            type: "raster",
            source: hillshadeSourceId,
            paint: { "raster-opacity": 0.4 }
        });
    }

    map.setTerrain({ source: terrainSourceId, exaggeration: 1 });
}

function enableTerrain() {
    terrainActive = true;
    applyTerrain();
    map.easeTo({ pitch: 45, duration: 600 });
    setTerrainState(true);
    updateAttribution();
    setStatus("3D Terrain on.");
}

function disableTerrain() {
    map.setTerrain(null);

    if (map.getLayer(hillshadeLayerId)) {
        map.removeLayer(hillshadeLayerId);
    }
    if (map.getSource(hillshadeSourceId)) {
        map.removeSource(hillshadeSourceId);
    }
    // terrain source stays — TerrainControl needs it to remain in the style

    map.easeTo({ pitch: 0, duration: 600 });
    terrainActive = false;
    setTerrainState(false);
    updateAttribution();
    setStatus("3D Terrain off.");
}

function ensureTerrainAfterStyleLoad() {
    // Always restore terrain source so TerrainControl can function
    if (!map.getSource(terrainSourceId)) {
        map.addSource(terrainSourceId, {
            type: "raster-dem",
            url: terrainTileJsonUrl,
            encoding: "terrarium"
        });
    }
    if (terrainActive) {
        applyTerrain();
    }
}

function setLayerMenuOpen(isOpen) {
    menuShell.classList.toggle("is-open", isOpen);
    layerMenuButton.setAttribute("aria-expanded", String(isOpen));
}

function setMenuSectionExpanded(toggleElement, isExpanded) {
    const panelId = toggleElement?.getAttribute("aria-controls");
    if (!panelId) {
        return;
    }

    const panelElement = document.getElementById(panelId);
    if (!panelElement) {
        return;
    }

    toggleElement.setAttribute("aria-expanded", String(isExpanded));
    panelElement.hidden = !isExpanded;
}

function initializeMenuSections() {
    menuSectionToggleElements.forEach((toggleElement) => {
        const isExpanded = toggleElement.getAttribute("aria-expanded") !== "false";
        setMenuSectionExpanded(toggleElement, isExpanded);
    });
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

async function loadFavorites() {
    if (!isFavoritesStorageAvailable()) {
        favoritesEmpty.textContent = "IndexedDB is not available in this browser.";
        return;
    }

    try {
        renderFavorites(await readFavorites());
    } catch (error) {
        favoritesEmpty.hidden = false;
        favoritesEmpty.textContent = "Unable to load saved locations.";
        console.error(error);
    }
}

async function saveCurrentViewAsFavorite() {
    if (!isFavoritesStorageAvailable()) {
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
        await saveFavorite({
            name: trimmedName,
            longitude: center.lng,
            latitude: center.lat,
            createdAt: Date.now()
        });

        await loadFavorites();
        setStatus("Saved " + trimmedName + ".");
    } catch (error) {
        setStatus("Unable to save favorite location.");
        console.error(error);
    }
}

async function deleteFavorite(id, name) {
    if (!isFavoritesStorageAvailable()) {
        setStatus("IndexedDB is not available in this browser.");
        return;
    }

    try {
        await deleteFavoriteById(id);

        await loadFavorites();
        setStatus("Deleted " + name + ".");
    } catch (error) {
        setStatus("Unable to delete favorite location.");
        console.error(error);
    }
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

async function setBaseLayer(key) {
    if (!baseMapConfigs[key] || key === activeBaseLayerKey) {
        setLayerMenuOpen(false);
        return;
    }

    const previousBaseLayerKey = activeBaseLayerKey;
    layerMenuButton.disabled = true;

    try {
        await applyBaseStyle(baseMapConfigs[key].style);
        ensureTerrainAfterStyleLoad();
        tracker.ensureOverlayAfterStyleLoad();
        activeBaseLayerKey = key;
        updateLayerOptionState(key);
        updateAttribution();
        setLayerMenuOpen(false);
        setStatus("Base map switched to " + baseMapConfigs[key].label + ".");
    } catch (error) {
        try {
            await applyBaseStyle(baseMapConfigs[previousBaseLayerKey].style);
            ensureTerrainAfterStyleLoad();
            tracker.ensureOverlayAfterStyleLoad();
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

terrainButton.addEventListener("click", () => {
    if (terrainActive) {
        disableTerrain();
    } else {
        enableTerrain();
    }
});

locateButton.addEventListener("click", () => {
    if (tracker.isActive) {
        tracker.clearLocation();
        tracker.stop("Location hidden.");
        return;
    }

    tracker.start();
});

layerMenuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    setLayerMenuOpen(!menuShell.classList.contains("is-open"));
});

layerMenu.addEventListener("click", (event) => {
    event.stopPropagation();
});

menuSectionToggleElements.forEach((toggleElement) => {
    toggleElement.addEventListener("click", () => {
        const isExpanded = toggleElement.getAttribute("aria-expanded") !== "true";
        setMenuSectionExpanded(toggleElement, isExpanded);
    });
});

layerOptionElements.forEach((element) => {
    element.addEventListener("click", () => {
        setBaseLayer(element.dataset.layerKey);
    });
});

saveFavoriteButton.addEventListener("click", () => {
    saveCurrentViewAsFavorite();
});

reCenterButton.addEventListener("click", () => {
    tracker.recenterOnLocation();
    reCenterButton.hidden = true;
});

compassButton.addEventListener("click", () => {
    map.easeTo({ bearing: 0, duration: 400 });
});

map.on("rotate", () => {
    const bearing = map.getBearing();
    if (Math.abs(bearing) < 0.5) {
        compassButton.hidden = true;
    } else {
        compassButton.hidden = false;
        compassNeedle.style.transform = `rotate(${-bearing}deg)`;
    }
});

map.on("dragstart", () => {
    if (tracker.isActive && tracker.lastLngLat && tracker.following) {
        tracker.following = false;
        reCenterButton.hidden = false;
    }
});

["pointerdown", "touchstart", "wheel", "keydown"].forEach((eventName) => {
    document.addEventListener(eventName, () => tracker.registerActivity(), { passive: true });
});

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && tracker.isActive) {
        tracker.clearLocation();
        tracker.stop();
    }
});

window.addEventListener("pagehide", () => {
    if (tracker.isActive) {
        tracker.clearLocation();
        tracker.stop();
    }
});

attributionButton.addEventListener("click", (event) => {
    event.stopPropagation();
    setAttributionOpen(attributionPanel.hidden);
});

document.addEventListener("click", () => {
    setLayerMenuOpen(false);
    setAttributionOpen(false);
});

// Android/Chrome: capture the install prompt and show the banner
window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installBanner.hidden = false;
});

installButton?.addEventListener("click", async () => {
    if (!deferredInstallPrompt) {
        return;
    }
    installBanner.hidden = true;
    await deferredInstallPrompt.prompt();
    deferredInstallPrompt = null;
});

installDismiss?.addEventListener("click", () => {
    installBanner.hidden = true;
});

window.addEventListener("appinstalled", () => {
    installBanner.hidden = true;
    iosBanner.hidden = true;
    deferredInstallPrompt = null;
});

registerServiceWorker();
initInstallPrompt();
initializeMenuSections();

map.on("load", () => {
    ensureTerrainAfterStyleLoad();
    tracker.ensureOverlayAfterStyleLoad();
    updateLayerOptionState(activeBaseLayerKey);
    updateAttribution();
    loadFavorites();
});
