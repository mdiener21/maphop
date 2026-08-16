import { describe, it, expect, vi } from 'vitest';
import {
    createFavoriteCloudStore,
    createPocketBaseFavoriteBody,
    getOrCreateDeviceId
} from '../../src/js/favorite-cloud-store.js';

function createStorage() {
    const values = new Map();
    return {
        getItem: vi.fn((key) => values.get(key) ?? null),
        setItem: vi.fn((key, value) => values.set(key, value))
    };
}

function createClient({ isValid = false } = {}) {
    const authWithPassword = vi.fn().mockResolvedValue({ token: 'token' });
    const create = vi.fn().mockResolvedValue({ id: 'record-id' });

    return {
        authStore: {
            isValid,
            clear: vi.fn()
        },
        collection: vi.fn((name) => {
            if (name === 'users') {
                return { authWithPassword };
            }

            if (name === 'maphop_favourites') {
                return { create };
            }

            throw new Error(`Unexpected collection ${name}`);
        }),
        authWithPassword,
        create
    };
}

describe('getOrCreateDeviceId', () => {
    it('reuses an existing device ID', () => {
        const storage = createStorage();
        storage.setItem('maphop-pocketbase-device-id', 'device-1');

        expect(getOrCreateDeviceId(storage)).toBe('device-1');
    });

    it('creates and stores a new device ID when absent', () => {
        const storage = createStorage();
        const cryptoApi = { randomUUID: vi.fn(() => 'device-2') };

        expect(getOrCreateDeviceId(storage, cryptoApi)).toBe('device-2');
        expect(storage.setItem).toHaveBeenCalledWith('maphop-pocketbase-device-id', 'device-2');
    });
});

describe('createPocketBaseFavoriteBody', () => {
    it('maps a favorite to the PocketBase schema', () => {
        expect(createPocketBaseFavoriteBody({
            name: 'Home',
            longitude: 14.271117,
            latitude: 46.5953463,
            elevationMeters: 502,
            elevationSource: 'device',
            elevationAccuracyMeters: 12
        }, 'device-1')).toEqual({
            name: 'Home',
            deviceId: 'device-1',
            geom: { lon: 14.271117, lat: 46.5953463 },
            elevation: 502,
            elevation_source: 'device',
            elevation_accuracy: 12,
            deleted: false
        });
    });

    it('omits elevation metadata when no elevation value is available', () => {
        const body = createPocketBaseFavoriteBody({
            name: 'Home',
            longitude: 14.271117,
            latitude: 46.5953463,
            elevationSource: 'device',
            elevationAccuracyMeters: 12
        }, 'device-1');

        expect(body).toEqual({
            name: 'Home',
            deviceId: 'device-1',
            geom: { lon: 14.271117, lat: 46.5953463 },
            deleted: false
        });
    });
});

describe('createFavoriteCloudStore', () => {
    it('authenticates with users collection and registers a local device ID', async () => {
        const storage = createStorage();
        const client = createClient();
        const cloudStore = createFavoriteCloudStore({
            client,
            storage,
            cryptoApi: { randomUUID: () => 'device-1' }
        });

        await cloudStore.authenticate('user@example.com', 'password');

        expect(client.authWithPassword).toHaveBeenCalledWith('user@example.com', 'password');
        expect(cloudStore.getDeviceId()).toBe('device-1');
    });

    it('creates one remote favorite record when authenticated', async () => {
        const storage = createStorage();
        const client = createClient({ isValid: true });
        const cloudStore = createFavoriteCloudStore({
            client,
            storage,
            cryptoApi: { randomUUID: () => 'device-1' }
        });

        await cloudStore.saveFavorite({
            name: 'Home',
            longitude: 14.271117,
            latitude: 46.5953463,
            elevationMeters: 502,
            elevationSource: 'device'
        });

        expect(client.create).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Home',
            deviceId: 'device-1',
            geom: { lon: 14.271117, lat: 46.5953463 },
            elevation: 502,
            elevation_source: 'device',
            deleted: false
        }));
    });

    it('returns the created record and reuses an existing device ID', async () => {
        const storage = createStorage();
        storage.setItem('maphop-pocketbase-device-id', 'device-existing');
        storage.setItem.mockClear();
        const client = createClient({ isValid: true });
        const cloudStore = createFavoriteCloudStore({ client, storage });

        const result = await cloudStore.saveFavorite({
            name: 'Home',
            longitude: 14.271117,
            latitude: 46.5953463
        });

        expect(result).toEqual({ skipped: false, record: { id: 'record-id' } });
        expect(storage.setItem).not.toHaveBeenCalled();
        expect(client.create).toHaveBeenCalledWith(expect.objectContaining({
            deviceId: 'device-existing'
        }));
    });

    it('skips remote create when unauthenticated', async () => {
        const client = createClient({ isValid: false });
        const cloudStore = createFavoriteCloudStore({ client, storage: createStorage() });

        const result = await cloudStore.saveFavorite({ name: 'Home' });

        expect(result).toEqual({ skipped: true });
        expect(client.create).not.toHaveBeenCalled();
    });
});
