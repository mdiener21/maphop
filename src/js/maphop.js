import maplibregl from "maplibre-gl";
import { Protocol as PmtilesProtocol } from "pmtiles";
import { version } from "../../package.json";
import { LocationTracker } from "./location-tracker.js";
import { createAttributionController } from "./map/attribution-controller.js";
import { createBaseLayerController } from "./map/base-layer-controller.js";
import { baseMapConfigs } from "./map/base-map-registry.js";
import { getMapPageDom } from "./map/dom.js";
import { createFavoritesPanel } from "./map/favorites-panel.js";
import { createInstallPromptController } from "./map/install-prompt-controller.js";
import { createMenuController } from "./map/menu-controller.js";
import { registerScopedServiceWorker } from "./map/service-worker.js";
import { createStatusToast } from "./map/status-toast.js";
import { createTerrainController } from "./map/terrain-controller.js";

const defaultBaseLayerKey = "bergfex";
const defaultCenter = [14.268, 46.59026];
const defaultZoom = 15;

const dom = getMapPageDom();

if (dom.appVersionElement) {
    dom.appVersionElement.textContent = `version ${version}`;
}

const pmtilesProtocol = new PmtilesProtocol();
maplibregl.addProtocol("pmtiles", pmtilesProtocol.tile);

const map = new maplibregl.Map({
    style: baseMapConfigs[defaultBaseLayerKey].style,
    center: defaultCenter,
    zoom: defaultZoom,
    container: "map",
    attributionControl: false,
    maxPitch: 85
});

const setStatus = createStatusToast(dom.statusElement);

function setTrackingState(active) {
    dom.locateButton.dataset.state = active ? "active" : "idle";
    dom.locationToggleLabel.textContent = active ? "On" : "Off";

    if (!active) {
        dom.reCenterButton.hidden = true;
    }
}

const tracker = new LocationTracker(map, {
    onStatus: setStatus,
    onTrackingStateChange: setTrackingState
});

const menuController = createMenuController({
    menuShell: dom.menuShell,
    layerMenuButton: dom.layerMenuButton,
    menuSectionToggleElements: dom.menuSectionToggleElements
});

const attributionController = createAttributionController({
    attributionButton: dom.attributionButton,
    attributionPanel: dom.attributionPanel,
    attributionText: dom.attributionText,
    baseMapConfigs
});

function refreshAttribution() {
    attributionController.update(baseLayerController.activeKey, terrainController.isActive);
}

const terrainController = createTerrainController({
    map,
    terrainButton: dom.terrainButton,
    terrainToggleLabel: dom.terrainToggleLabel,
    onStatus: setStatus,
    onStateChange: refreshAttribution
});

const favoritesPanel = createFavoritesPanel({
    map,
    favoritesList: dom.favoritesList,
    favoritesEmpty: dom.favoritesEmpty,
    onStatus: setStatus,
    onMenuClose: () => menuController.setOpen(false)
});

const baseLayerController = createBaseLayerController({
    map,
    baseMapConfigs,
    layerMenuButton: dom.layerMenuButton,
    layerOptionElements: dom.layerOptionElements,
    initialActiveKey: defaultBaseLayerKey,
    onStatus: setStatus,
    onStyleReady: () => {
        terrainController.ensureAfterStyleLoad();
        tracker.ensureOverlayAfterStyleLoad();
    },
    onActiveLayerChanged: refreshAttribution,
    onMenuClose: () => menuController.setOpen(false)
});

const installPromptController = createInstallPromptController({
    installBanner: dom.installBanner,
    installButton: dom.installButton,
    installDismiss: dom.installDismiss,
    iosBanner: dom.iosBanner,
    iosDismiss: dom.iosDismiss
});

dom.terrainButton.addEventListener("click", () => {
    terrainController.toggle();
});

dom.locateButton.addEventListener("click", () => {
    if (tracker.isActive) {
        tracker.clearLocation();
        tracker.stop("Location hidden.");
        return;
    }

    tracker.start();
});

dom.layerMenuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    menuController.toggle();
});

dom.layerMenu.addEventListener("click", (event) => {
    event.stopPropagation();
});

dom.menuSectionToggleElements.forEach((toggleElement) => {
    toggleElement.addEventListener("click", () => {
        const isExpanded = toggleElement.getAttribute("aria-expanded") !== "true";
        menuController.setSectionExpanded(toggleElement, isExpanded);
    });
});

dom.layerOptionElements.forEach((element) => {
    element.addEventListener("click", () => {
        baseLayerController.setBaseLayer(element.dataset.layerKey);
    });
});

dom.saveFavoriteButton.addEventListener("click", () => {
    favoritesPanel.saveCurrentViewAsFavorite();
});

dom.reCenterButton.addEventListener("click", () => {
    tracker.recenterOnLocation();
    dom.reCenterButton.hidden = true;
});

dom.compassButton.addEventListener("click", () => {
    map.easeTo({ bearing: 0, duration: 400 });
});

map.on("rotate", () => {
    const bearing = map.getBearing();
    if (Math.abs(bearing) < 0.5) {
        dom.compassButton.hidden = true;
        return;
    }

    dom.compassButton.hidden = false;
    dom.compassNeedle.style.transform = `rotate(${-bearing}deg)`;
});

map.on("dragstart", () => {
    if (tracker.isActive && tracker.lastLngLat && tracker.following) {
        tracker.following = false;
        dom.reCenterButton.hidden = false;
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

dom.attributionButton.addEventListener("click", (event) => {
    event.stopPropagation();
    attributionController.toggle();
});

document.addEventListener("click", () => {
    menuController.setOpen(false);
    attributionController.setOpen(false);
});

registerScopedServiceWorker();
installPromptController.init();
menuController.initializeSections();

map.on("load", () => {
    terrainController.ensureAfterStyleLoad();
    tracker.ensureOverlayAfterStyleLoad();
    baseLayerController.updateLayerOptionState();
    refreshAttribution();
    favoritesPanel.loadFavorites();
});
