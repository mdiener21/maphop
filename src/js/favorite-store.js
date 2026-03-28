const favoriteDbName = "personal-map-db";
const favoriteStoreName = "favoriteLocations";

let favoritesDbPromise = null;

function ensureIndexedDbAvailable() {
    if (!("indexedDB" in window)) {
        throw new Error("IndexedDB is not available in this browser.");
    }
}

function getFavoritesDb() {
    ensureIndexedDbAvailable();

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

function sortFavoritesByCreatedAt(favorites) {
    return [...favorites].sort((left, right) => right.createdAt - left.createdAt);
}

function createFavoriteSignature(favorite) {
    return [
        favorite.name.trim().toLowerCase(),
        favorite.longitude.toFixed(6),
        favorite.latitude.toFixed(6)
    ].join("|");
}

export function isFavoritesStorageAvailable() {
    return "indexedDB" in window;
}

export async function readFavorites() {
    const database = await getFavoritesDb();
    const favorites = await new Promise((resolve, reject) => {
        const transaction = database.transaction(favoriteStoreName, "readonly");
        const store = transaction.objectStore(favoriteStoreName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    return sortFavoritesByCreatedAt(favorites);
}

export async function getFavoritesForExport() {
    return (await readFavorites()).map((favorite) => ({
        name: favorite.name,
        longitude: favorite.longitude,
        latitude: favorite.latitude,
        createdAt: favorite.createdAt
    }));
}

export async function saveFavorite(favorite) {
    const database = await getFavoritesDb();
    await new Promise((resolve, reject) => {
        const transaction = database.transaction(favoriteStoreName, "readwrite");
        const store = transaction.objectStore(favoriteStoreName);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);

        store.add({
            name: favorite.name,
            longitude: favorite.longitude,
            latitude: favorite.latitude,
            createdAt: favorite.createdAt ?? Date.now()
        });
    });
}

export async function deleteFavoriteById(id) {
    const database = await getFavoritesDb();
    await new Promise((resolve, reject) => {
        const transaction = database.transaction(favoriteStoreName, "readwrite");
        const store = transaction.objectStore(favoriteStoreName);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);

        store.delete(id);
    });
}

export async function importFavorites(favorites) {
    const existingFavorites = await readFavorites();
    const existingSignatures = new Set(existingFavorites.map((favorite) => createFavoriteSignature(favorite)));
    const uniqueFavorites = [];
    const queuedSignatures = new Set();

    favorites.forEach((favorite) => {
        const signature = createFavoriteSignature(favorite);
        if (existingSignatures.has(signature) || queuedSignatures.has(signature)) {
            return;
        }

        queuedSignatures.add(signature);
        uniqueFavorites.push({
            name: favorite.name,
            longitude: favorite.longitude,
            latitude: favorite.latitude,
            createdAt: favorite.createdAt
        });
    });

    if (uniqueFavorites.length === 0) {
        return {
            importedCount: 0,
            skippedCount: favorites.length
        };
    }

    const database = await getFavoritesDb();
    await new Promise((resolve, reject) => {
        const transaction = database.transaction(favoriteStoreName, "readwrite");
        const store = transaction.objectStore(favoriteStoreName);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);

        uniqueFavorites.forEach((favorite) => {
            store.add(favorite);
        });
    });

    return {
        importedCount: uniqueFavorites.length,
        skippedCount: favorites.length - uniqueFavorites.length
    };
}