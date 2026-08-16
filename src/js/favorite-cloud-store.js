import PocketBase from "pocketbase";

const pocketBaseUrl = "https://pb.kanvana.com";
const favoriteCollectionName = "maphop_favourites";
const userCollectionName = "users";
const deviceIdStorageKey = "maphop-pocketbase-device-id";

function createDeviceId(cryptoApi = globalThis.crypto) {
    if (cryptoApi?.randomUUID) {
        return cryptoApi.randomUUID();
    }

    return "device-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
}

export function getOrCreateDeviceId(storage = globalThis.localStorage, cryptoApi = globalThis.crypto) {
    const existingDeviceId = storage.getItem(deviceIdStorageKey);
    if (existingDeviceId) {
        return existingDeviceId;
    }

    const deviceId = createDeviceId(cryptoApi);
    storage.setItem(deviceIdStorageKey, deviceId);
    return deviceId;
}

export function createPocketBaseFavoriteBody(favorite, deviceId, userId) {
    const body = {
        name: favorite.name,
        user: userId,
        deviceId,
        geom: {
            lon: favorite.longitude,
            lat: favorite.latitude
        },
        deleted: false
    };

    if (!Number.isFinite(favorite.elevationMeters)) {
        return body;
    }

    body.elevation = favorite.elevationMeters;

    if (typeof favorite.elevationSource === "string") {
        body.elevation_source = favorite.elevationSource;
    }

    if (Number.isFinite(favorite.elevationAccuracyMeters)) {
        body.elevation_accuracy = favorite.elevationAccuracyMeters;
    }

    return body;
}

export function createFavoriteCloudStore({
    client = new PocketBase(pocketBaseUrl),
    storage = globalThis.localStorage,
    cryptoApi = globalThis.crypto
} = {}) {
    function getDeviceId() {
        return storage.getItem(deviceIdStorageKey);
    }

    function isAuthenticated() {
        return client.authStore.isValid;
    }

    async function authenticate(email, password) {
        const authData = await client.collection(userCollectionName).authWithPassword(email, password);
        const deviceId = getOrCreateDeviceId(storage, cryptoApi);
        return { authData, deviceId };
    }

    function logout() {
        client.authStore.clear();
    }

    async function saveFavorite(favorite) {
        if (!isAuthenticated()) {
            return { skipped: true };
        }

        const deviceId = getOrCreateDeviceId(storage, cryptoApi);
        const body = createPocketBaseFavoriteBody(favorite, deviceId, client.authStore.record?.id);
        const record = await client.collection(favoriteCollectionName).create(body);
        return { skipped: false, record };
    }

    async function deleteFavorite(pocketBaseId) {
        if (!isAuthenticated() || !pocketBaseId) {
            return { skipped: true };
        }

        await client.collection(favoriteCollectionName).delete(pocketBaseId);
        return { skipped: false };
    }

    async function uploadMissingFavorites(favorites, markUploaded) {
        let uploadedCount = 0;
        let skippedCount = 0;

        for (const favorite of favorites) {
            if (favorite.pocketBaseId) {
                skippedCount += 1;
                continue;
            }

            const result = await saveFavorite(favorite);
            if (result.skipped || !result.record?.id) {
                skippedCount += 1;
                continue;
            }

            await markUploaded(favorite.id, result.record.id);
            uploadedCount += 1;
        }

        return { uploadedCount, skippedCount };
    }

    return {
        authenticate,
        deleteFavorite,
        getDeviceId,
        isAuthenticated,
        logout,
        saveFavorite,
        uploadMissingFavorites
    };
}
