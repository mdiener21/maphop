import {
    deleteFavoriteById,
    isFavoritesStorageAvailable,
    readFavorites,
    saveFavorite
} from "../favorite-store.js";
import { buildSharedLocationUrl } from "./share-location.js";

const MSG_INDEXEDDB_UNAVAILABLE = "IndexedDB is not available in this browser.";

function formatFavoriteCoordinates(longitude, latitude) {
    return latitude.toFixed(5) + ", " + longitude.toFixed(5);
}

function getSuggestedFavoriteName() {
    return "Favorite " + new Date().toLocaleDateString();
}

function createTrashIcon() {
    const namespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(namespace, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");

    [["path", { d: "M3 6h18" }], ["path", { d: "M8 6V4h8v2" }], ["path", { d: "M19 6l-1 14H6L5 6" }], ["path", { d: "M10 11v6" }], ["path", { d: "M14 11v6" }]].forEach(([tagName, attributes]) => {
        const node = document.createElementNS(namespace, tagName);
        Object.entries(attributes).forEach(([name, value]) => {
            node.setAttribute(name, value);
        });
        svg.append(node);
    });

    return svg;
}

function createShareIcon() {
    const namespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(namespace, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");

    [["circle", { cx: "18", cy: "5", r: "3" }], ["circle", { cx: "6", cy: "12", r: "3" }], ["circle", { cx: "18", cy: "19", r: "3" }], ["path", { d: "M8.6 13.5l6.8 4" }], ["path", { d: "M15.4 6.5l-6.8 4" }]].forEach(([tagName, attributes]) => {
        const node = document.createElementNS(namespace, tagName);
        Object.entries(attributes).forEach(([name, value]) => {
            node.setAttribute(name, value);
        });
        svg.append(node);
    });

    return svg;
}

export function createFavoritesPanel({
    map,
    favoritesList,
    favoritesEmpty,
    onStatus,
    onMenuClose,
    overlay,
    selectionOverlay,
    cancelSelectionButton,
    confirmSelectionButton,
    favoriteNameModalBackdrop,
    favoriteNameForm,
    favoriteNameInput,
    cancelFavoriteNameButton
}) {
    let pendingFavoriteCoordinates = null;
    let selectionActive = false;
    let restoreFocusElement = null;

    async function copyTextToClipboard(text) {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return;
        }

        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        textarea.style.pointerEvents = "none";
        document.body.append(textarea);
        textarea.select();

        const copied = document.execCommand("copy");
        textarea.remove();

        if (!copied) {
            throw new Error("Clipboard copy command failed.");
        }
    }

    async function shareFavorite(favorite) {
        const shareUrl = buildSharedLocationUrl({
            latitude: favorite.latitude,
            longitude: favorite.longitude,
            zoom: map.getZoom()
        });

        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Maphop Favorite",
                    text: favorite.name,
                    url: shareUrl
                });
                return;
            } catch (error) {
                if (error?.name === "AbortError") {
                    return;
                }

                console.error(error);
            }
        }

        try {
            await copyTextToClipboard(shareUrl);
            onStatus("Copied share link for " + favorite.name + ".");
        } catch (error) {
            onStatus("Unable to share favorite location.");
            console.error(error);
        }
    }

    async function deleteFavorite(id, name) {
        if (!isFavoritesStorageAvailable()) {
            onStatus(MSG_INDEXEDDB_UNAVAILABLE);
            return;
        }

        try {
            await deleteFavoriteById(id);
            await loadFavorites();
            onStatus("Deleted " + name + ".");
        } catch (error) {
            onStatus("Unable to delete favorite location.");
            console.error(error);
        }
    }

    function setSelectionOverlayVisible(isVisible) {
        if (!selectionOverlay) {
            return;
        }

        selectionOverlay.hidden = !isVisible;
        selectionOverlay.setAttribute("aria-hidden", String(!isVisible));
    }

    function setFavoriteNameModalVisible(isVisible) {
        if (!favoriteNameModalBackdrop) {
            return;
        }

        favoriteNameModalBackdrop.hidden = !isVisible;
    }

    function finishFavoriteFlow() {
        selectionActive = false;
        pendingFavoriteCoordinates = null;
        setSelectionOverlayVisible(false);
        setFavoriteNameModalVisible(false);
        favoriteNameForm?.reset();
        favoriteNameInput?.setCustomValidity("");

        if (restoreFocusElement instanceof HTMLElement) {
            restoreFocusElement.focus();
        }

        restoreFocusElement = null;
    }

    function cancelFavoriteFlow(statusMessage = "Favorite not saved.") {
        finishFavoriteFlow();
        onStatus(statusMessage);
    }

    function openFavoriteNameModal() {
        if (!favoriteNameInput) {
            return;
        }

        setFavoriteNameModalVisible(true);
        favoriteNameInput.value = getSuggestedFavoriteName();
        favoriteNameInput.setSelectionRange(0, favoriteNameInput.value.length);

        window.requestAnimationFrame(() => {
            favoriteNameInput.focus();
            favoriteNameInput.select();
        });
    }

    function renderFavorites(favorites) {
        favoritesList.replaceChildren();
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

            button.append(title, meta);
            button.addEventListener("click", () => {
                map.easeTo({
                    center: [favorite.longitude, favorite.latitude],
                    duration: 650
                });
                onMenuClose();
                onStatus("Moved to " + favorite.name + ".");
            });

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "favorite-action favorite-delete";
            deleteButton.setAttribute("aria-label", "Delete " + favorite.name);
            deleteButton.append(createTrashIcon());
            deleteButton.addEventListener("click", async (event) => {
                event.stopPropagation();
                await deleteFavorite(favorite.id, favorite.name);
            });

            const shareButton = document.createElement("button");
            shareButton.type = "button";
            shareButton.className = "favorite-action favorite-share";
            shareButton.setAttribute("aria-label", "Share " + favorite.name);
            shareButton.append(createShareIcon());
            shareButton.addEventListener("click", async (event) => {
                event.stopPropagation();
                await shareFavorite(favorite);
            });

            const actions = document.createElement("div");
            actions.className = "favorite-actions";
            actions.append(shareButton, deleteButton);

            row.append(button, actions);
            favoritesList.append(row);
        });
    }

    async function loadFavorites() {
        if (!isFavoritesStorageAvailable()) {
            favoritesEmpty.textContent = MSG_INDEXEDDB_UNAVAILABLE;
            return;
        }

        try {
            const favorites = await readFavorites();
            renderFavorites(favorites);
            overlay?.update(favorites);
        } catch (error) {
            favoritesEmpty.hidden = false;
            favoritesEmpty.textContent = "Unable to load saved locations.";
            console.error(error);
        }
    }

    function startFavoriteSelection() {
        if (!isFavoritesStorageAvailable()) {
            onStatus(MSG_INDEXEDDB_UNAVAILABLE);
            return;
        }

        if (selectionActive || !selectionOverlay) {
            return;
        }

        restoreFocusElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        selectionActive = true;
        pendingFavoriteCoordinates = null;
        setSelectionOverlayVisible(true);
        setFavoriteNameModalVisible(false);
        favoriteNameForm?.reset();
        onMenuClose();
        onStatus("Move the map, then save the spot under the crosshair.");
    }

    function confirmFavoriteSelection() {
        if (!selectionActive) {
            return;
        }

        const center = map.getCenter();
        if (!center) {
            onStatus("Map center is unavailable.");
            return;
        }

        pendingFavoriteCoordinates = {
            longitude: center.lng,
            latitude: center.lat
        };
        setSelectionOverlayVisible(false);
        openFavoriteNameModal();
    }

    async function submitFavoriteName(event) {
        event?.preventDefault();

        if (!pendingFavoriteCoordinates || !favoriteNameInput) {
            cancelFavoriteFlow();
            return;
        }

        const trimmedName = favoriteNameInput.value.trim();
        if (!trimmedName) {
            favoriteNameInput.setCustomValidity("Saved location needs a name.");
            favoriteNameInput.reportValidity();
            return;
        }

        favoriteNameInput.setCustomValidity("");

        try {
            await saveFavorite({
                name: trimmedName,
                longitude: pendingFavoriteCoordinates.longitude,
                latitude: pendingFavoriteCoordinates.latitude,
                createdAt: Date.now()
            });

            await loadFavorites();
            finishFavoriteFlow();
            onStatus("Saved " + trimmedName + ".");
        } catch (error) {
            onStatus("Unable to save favorite location.");
            console.error(error);
        }
    }

    cancelSelectionButton?.addEventListener("click", () => {
        cancelFavoriteFlow();
    });

    confirmSelectionButton?.addEventListener("click", () => {
        confirmFavoriteSelection();
    });

    favoriteNameForm?.addEventListener("submit", (event) => {
        submitFavoriteName(event);
    });

    cancelFavoriteNameButton?.addEventListener("click", () => {
        cancelFavoriteFlow();
    });

    favoriteNameInput?.addEventListener("input", () => {
        favoriteNameInput.setCustomValidity("");
    });

    favoriteNameModalBackdrop?.addEventListener("click", (event) => {
        if (event.target === favoriteNameModalBackdrop) {
            cancelFavoriteFlow();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") {
            return;
        }

        if (!favoriteNameModalBackdrop?.hidden) {
            event.preventDefault();
            cancelFavoriteFlow();
            return;
        }

        if (selectionActive) {
            event.preventDefault();
            cancelFavoriteFlow();
        }
    });

    function promptFavoriteNameAt(coordinates) {
        if (!isFavoritesStorageAvailable()) {
            onStatus(MSG_INDEXEDDB_UNAVAILABLE);
            return;
        }

        pendingFavoriteCoordinates = coordinates;
        openFavoriteNameModal();
    }

    return {
        loadFavorites,
        startFavoriteSelection,
        promptFavoriteNameAt
    };
}
