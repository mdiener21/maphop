import { version } from "../../package.json";
import { setupFavoriteTransfer } from "./favorite-transfer.js";
import {
    getFavoritesForExport,
    importFavorites,
    isFavoritesStorageAvailable,
    readFavorites
} from "./favorite-store.js";

const exportFavoritesButton = document.getElementById("exportFavoritesButton");
const importFavoritesButton = document.getElementById("importFavoritesButton");
const importFavoritesInput = document.getElementById("importFavoritesInput");
const favoritesCountElement = document.getElementById("favoritesCount");
const settingsStatusElement = document.getElementById("settingsStatus");

function setStatus(message) {
    settingsStatusElement.textContent = message;
}

async function refreshFavoritesCount() {
    if (!isFavoritesStorageAvailable()) {
        favoritesCountElement.textContent = "Unavailable";
        setStatus("IndexedDB is not available in this browser.");
        return;
    }

    try {
        const favorites = await readFavorites();
        favoritesCountElement.textContent = String(favorites.length);
    } catch (error) {
        favoritesCountElement.textContent = "Error";
        setStatus("Unable to load favorites summary.");
        console.error(error);
    }
}

document.title = `Settings | Maphop ${version}`;

setupFavoriteTransfer({
    exportButton: exportFavoritesButton,
    importButton: importFavoritesButton,
    importInput: importFavoritesInput,
    onExportFavorites: getFavoritesForExport,
    onImportFavorites: async (favorites) => {
        const result = await importFavorites(favorites);
        await refreshFavoritesCount();
        return result;
    },
    setStatus
});

refreshFavoritesCount();