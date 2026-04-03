import {
    deleteFavoriteById,
    isFavoritesStorageAvailable,
    readFavorites,
    saveFavorite
} from "../favorite-store.js";

function formatFavoriteCoordinates(longitude, latitude) {
    return latitude.toFixed(5) + ", " + longitude.toFixed(5);
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

export function createFavoritesPanel({ map, favoritesList, favoritesEmpty, onStatus, onMenuClose, overlay }) {
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

    async function saveCurrentViewAsFavorite() {
        if (!isFavoritesStorageAvailable()) {
            onStatus("IndexedDB is not available in this browser.");
            return;
        }

        const center = map.getCenter();
        if (!center) {
            onStatus("Map center is unavailable.");
            return;
        }

        const suggestedName = "Favorite " + new Date().toLocaleDateString();
        const name = window.prompt("Name this saved location:", suggestedName);
        if (name === null) {
            return;
        }

        const trimmedName = name.trim();
        if (!trimmedName) {
            onStatus("Saved location needs a name.");
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
            onStatus("Saved " + trimmedName + ".");
        } catch (error) {
            onStatus("Unable to save favorite location.");
            console.error(error);
        }
    }

    return {
        loadFavorites,
        saveCurrentViewAsFavorite
    };
}