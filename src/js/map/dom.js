export function getMapPageDom() {
    const locationSectionToggle = document.getElementById("locationSectionToggle");
    const favoritesSectionToggle = document.getElementById("favoritesSectionToggle");
    const mapsSectionToggle = document.getElementById("mapsSectionToggle");

    return {
        statusElement: document.getElementById("status"),
        menuShell: document.getElementById("menuShell"),
        layerMenuButton: document.getElementById("layerMenuButton"),
        layerMenu: document.getElementById("layerMenu"),
        locateButton: document.getElementById("locateButton"),
        locationToggleLabel: document.getElementById("locationToggleLabel"),
        saveFavoriteButton: document.getElementById("saveFavoriteButton"),
        favoritesList: document.getElementById("favoritesList"),
        favoritesEmpty: document.getElementById("favoritesEmpty"),
        locationSectionToggle,
        favoritesSectionToggle,
        mapsSectionToggle,
        menuSectionToggleElements: [locationSectionToggle, favoritesSectionToggle, mapsSectionToggle].filter(Boolean),
        appVersionElement: document.getElementById("appVersion"),
        layerOptionElements: Array.from(document.querySelectorAll(".layer-option")),
        installBanner: document.getElementById("installBanner"),
        installButton: document.getElementById("installButton"),
        installDismiss: document.getElementById("installDismiss"),
        iosBanner: document.getElementById("iosBanner"),
        iosDismiss: document.getElementById("iosDismiss"),
        reCenterButton: document.getElementById("reCenterButton"),
        compassButton: document.getElementById("compassButton"),
        compassNeedle: document.getElementById("compassNeedle"),
        terrainButton: document.getElementById("terrainButton"),
        terrainToggleLabel: document.getElementById("terrainToggleLabel"),
        attributionButton: document.getElementById("attributionButton"),
        attributionPanel: document.getElementById("attributionPanel"),
        attributionText: document.getElementById("attributionText")
    };
}