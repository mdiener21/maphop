import { setupFavoriteTransfer } from "./favorite-transfer.js";
import { createFavoriteCloudStore } from "./favorite-cloud-store.js";
import {
    getFavoritesForExport,
    importFavorites,
    isFavoritesStorageAvailable,
    readFavorites,
    updateFavoritePocketBaseId
} from "./favorite-store.js";
import { initializePageShell } from "./page-shell.js";

const exportFavoritesButton = document.getElementById("exportFavoritesButton");
const importFavoritesButton = document.getElementById("importFavoritesButton");
const importFavoritesInput = document.getElementById("importFavoritesInput");
const favoritesCountElement = document.getElementById("favoritesCount");
const settingsStatusElement = document.getElementById("settingsStatus");
const pocketBaseAuthForm = document.getElementById("pocketBaseAuthForm");
const pocketBaseEmailInput = document.getElementById("pocketBaseEmailInput");
const pocketBasePasswordInput = document.getElementById("pocketBasePasswordInput");
const pocketBaseAuthButton = document.getElementById("pocketBaseAuthButton");
const pocketBaseLogoutButton = document.getElementById("pocketBaseLogoutButton");
const pocketBaseAuthState = document.getElementById("pocketBaseAuthState");
const pocketBaseDeviceId = document.getElementById("pocketBaseDeviceId");

const favoriteCloudStore = createFavoriteCloudStore();

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

function refreshPocketBaseState() {
    pocketBaseAuthState.textContent = favoriteCloudStore.isAuthenticated() ? "Signed in" : "Signed out";
    pocketBaseDeviceId.textContent = favoriteCloudStore.getDeviceId() ?? "Not registered";
}

function setPocketBaseAuthBusy(isBusy) {
    pocketBaseEmailInput.disabled = isBusy;
    pocketBasePasswordInput.disabled = isBusy;
    pocketBaseAuthButton.disabled = isBusy;
    pocketBaseLogoutButton.disabled = isBusy;
}

async function authenticatePocketBase(event) {
    event.preventDefault();

    const email = pocketBaseEmailInput.value.trim();
    const password = pocketBasePasswordInput.value;

    if (!email || !password) {
        setStatus("Enter PocketBase email and password.");
        return;
    }

    setPocketBaseAuthBusy(true);

    try {
        const { deviceId } = await favoriteCloudStore.authenticate(email, password);
        const favorites = await readFavorites();
        const syncResult = await favoriteCloudStore.uploadMissingFavorites(favorites, updateFavoritePocketBaseId);
        refreshPocketBaseState();
        setStatus(
            "PocketBase authenticated. Device registered: " + deviceId +
            `. Uploaded ${syncResult.uploadedCount} local favorites.`
        );
    } catch {
        refreshPocketBaseState();
        setStatus("PocketBase authentication failed.");
    } finally {
        pocketBasePasswordInput.value = "";
        setPocketBaseAuthBusy(false);
    }
}

function logoutPocketBase() {
    favoriteCloudStore.logout();
    refreshPocketBaseState();
    setStatus("PocketBase logged out.");
}

initializePageShell("Settings");

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

pocketBaseAuthForm?.addEventListener("submit", authenticatePocketBase);
pocketBaseLogoutButton?.addEventListener("click", logoutPocketBase);

refreshFavoritesCount();
refreshPocketBaseState();
