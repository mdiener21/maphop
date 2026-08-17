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

function createClient({ isValid = false, userId = 'user-1' } = {}) {
    const authWithPassword = vi.fn().mockResolvedValue({ token: 'token' });
    const create = vi.fn().mockResolvedValue({ id: 'record-id' });
    const deleteRecord = vi.fn().mockResolvedValue(true);
    const getFullList = vi.fn().mockResolvedValue([]);

    return {
        authStore: {
            isValid,
            record: { id: userId },
            clear: vi.fn()
        },
        collection: vi.fn((name) => {
            if (name === 'users') {
                return { authWithPassword };
            }

            if (name === 'maphop_favourites') {
                return { create, delete: deleteRecord, getFullList };
            }

            throw new Error(`Unexpected collection ${name}`);
        }),
        authWithPassword,
        create,
        deleteRecord,
        getFullList
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
        }, 'device-1', 'user-1')).toEqual({
            name: 'Home',
            user: 'user-1',
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
        }, 'device-1', 'user-1');

        expect(body).toEqual({
            name: 'Home',
            user: 'user-1',
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
            user: 'user-1',
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
            user: 'user-1',
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

    it('deletes a remote favorite record when authenticated', async () => {
        const client = createClient({ isValid: true });
        const cloudStore = createFavoriteCloudStore({ client, storage: createStorage() });

        await cloudStore.deleteFavorite('record-id');

        expect(client.deleteRecord).toHaveBeenCalledWith('record-id');
    });

    it('uploads local favorites that do not already have a PocketBase id', async () => {
        const client = createClient({ isValid: true });
        client.create
            .mockResolvedValueOnce({ id: 'record-a' })
            .mockResolvedValueOnce({ id: 'record-c' });
        const cloudStore = createFavoriteCloudStore({
            client,
            storage: createStorage(),
            cryptoApi: { randomUUID: () => 'device-1' }
        });
        const markUploaded = vi.fn().mockResolvedValue(undefined);

        const result = await cloudStore.uploadMissingFavorites([
            { id: 1, name: 'A', longitude: 14.1, latitude: 46.1 },
            { id: 2, name: 'B', longitude: 14.2, latitude: 46.2, pocketBaseId: 'existing' },
            { id: 3, name: 'C', longitude: 14.3, latitude: 46.3 }
        ], markUploaded);

        expect(client.create).toHaveBeenCalledTimes(2);
        expect(markUploaded).toHaveBeenCalledWith(1, 'record-a');
        expect(markUploaded).toHaveBeenCalledWith(3, 'record-c');
        expect(result).toEqual({ uploadedCount: 2, skippedCount: 1 });
    });

    it('reads remote favorites and maps them to local favorite records', async () => {
        const client = createClient({ isValid: true });
        client.getFullList.mockResolvedValue([
            {
                id: 'record-a',
                name: 'Remote A',
                geom: { lon: 14.271117, lat: 46.5953463 },
                elevation: 502,
                elevation_source: 'device',
                elevation_accuracy: 12,
                created: '2026-08-16 12:00:00.000Z'
            }
        ]);
        const cloudStore = createFavoriteCloudStore({ client, storage: createStorage() });

        const favorites = await cloudStore.readFavorites();

        expect(client.getFullList).toHaveBeenCalledWith({
            filter: 'deleted = false',
            sort: '-created'
        });
        expect(favorites).toEqual([{
            name: 'Remote A',
            longitude: 14.271117,
            latitude: 46.5953463,
            createdAt: Date.parse('2026-08-16 12:00:00.000Z'),
            pocketBaseId: 'record-a',
            elevationMeters: 502,
            elevationSource: 'device',
            elevationAccuracyMeters: 12
        }]);
    });
});
