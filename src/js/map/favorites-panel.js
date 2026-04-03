import {
    deleteFavoriteById,
    isFavoritesStorageAvailable,
    readFavorites,
    saveFavorite
} from "../favorite-store.js";

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

    async function deleteFavorite(id, name) {
        if (!isFavoritesStorageAvailable()) {
            onStatus("IndexedDB is not available in this browser.");
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
            deleteButton.className = "favorite-delete";
            deleteButton.setAttribute("aria-label", "Delete " + favorite.name);
            deleteButton.append(createTrashIcon());
            deleteButton.addEventListener("click", async (event) => {
                event.stopPropagation();
                await deleteFavorite(favorite.id, favorite.name);
            });

            row.append(button, deleteButton);
            favoritesList.append(row);
        });
    }

    async function loadFavorites() {
        if (!isFavoritesStorageAvailable()) {
            favoritesEmpty.textContent = "IndexedDB is not available in this browser.";
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
            onStatus("IndexedDB is not available in this browser.");
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

    return {
        loadFavorites,
        startFavoriteSelection
    };
}
