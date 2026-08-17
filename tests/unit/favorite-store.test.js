import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';

// Each test gets a fresh module instance (resetting the module-level db promise)
// and a fresh IDB store.
let store;

beforeEach(async () => {
    vi.resetModules();
    global.indexedDB = new IDBFactory();
    store = await import('../../src/js/favorite-store.js');
});

const sample = (overrides = {}) => ({
    name: 'Test Place',
    longitude: 13.4050,
    latitude: 48.2093,
    createdAt: 1_700_000_000_000,
    ...overrides,
});

describe('isFavoritesStorageAvailable', () => {
    it('returns true when indexedDB is present', () => {
        expect(store.isFavoritesStorageAvailable()).toBe(true);
    });
});

describe('readFavorites', () => {
    it('returns an empty array when no favorites have been saved', async () => {
        expect(await store.readFavorites()).toEqual([]);
    });
});

describe('saveFavorite', () => {
    it('persists a favorite that can be read back', async () => {
        await store.saveFavorite(sample());
        const favorites = await store.readFavorites();
        expect(favorites).toHaveLength(1);
        expect(favorites[0]).toMatchObject({ name: 'Test Place', longitude: 13.4050, latitude: 48.2093 });
    });

    it('persists optional elevation metadata', async () => {
        await store.saveFavorite(sample({
            elevationMeters: 502,
            elevationSource: 'device',
            elevationAccuracyMeters: 12
        }));
        const favorites = await store.readFavorites();
        expect(favorites[0]).toMatchObject({
            elevationMeters: 502,
            elevationSource: 'device',
            elevationAccuracyMeters: 12
        });
    });

    it('persists optional PocketBase record id', async () => {
        await store.saveFavorite(sample({ pocketBaseId: 'pb-record-1' }));
        const favorites = await store.readFavorites();
        expect(favorites[0]).toMatchObject({ pocketBaseId: 'pb-record-1' });
    });

    it('assigns an auto-increment id to each saved favorite', async () => {
        await store.saveFavorite(sample({ name: 'A' }));
        await store.saveFavorite(sample({ name: 'B' }));
        const favorites = await store.readFavorites();
        expect(favorites[0].id).toBeDefined();
        expect(favorites[1].id).toBeDefined();
        expect(favorites[0].id).not.toBe(favorites[1].id);
    });

    it('returns favorites sorted newest-first by createdAt', async () => {
        await store.saveFavorite(sample({ name: 'Old', createdAt: 1000 }));
        await store.saveFavorite(sample({ name: 'New', createdAt: 2000 }));
        const favorites = await store.readFavorites();
        expect(favorites[0].name).toBe('New');
        expect(favorites[1].name).toBe('Old');
    });
});

describe('deleteFavoriteById', () => {
    it('removes the matching favorite', async () => {
        await store.saveFavorite(sample());
        const [saved] = await store.readFavorites();
        await store.deleteFavoriteById(saved.id);
        expect(await store.readFavorites()).toHaveLength(0);
    });

    it('does not affect other favorites', async () => {
        await store.saveFavorite(sample({ name: 'Keep', createdAt: 2000 }));
        await store.saveFavorite(sample({ name: 'Delete', createdAt: 1000 }));
        const favorites = await store.readFavorites();
        const toDelete = favorites.find(f => f.name === 'Delete');
        await store.deleteFavoriteById(toDelete.id);
        const remaining = await store.readFavorites();
        expect(remaining).toHaveLength(1);
        expect(remaining[0].name).toBe('Keep');
    });
});

describe('updateFavoritePocketBaseId', () => {
    it('stores a PocketBase record id for an existing favorite', async () => {
        await store.saveFavorite(sample());
        const [favorite] = await store.readFavorites();

        await store.updateFavoritePocketBaseId(favorite.id, 'pb-record-1');

        const [updatedFavorite] = await store.readFavorites();
        expect(updatedFavorite).toMatchObject({ pocketBaseId: 'pb-record-1' });
    });
});

describe('replaceFavorites', () => {
    it('replaces all local favorites with the provided snapshot', async () => {
        await store.saveFavorite(sample({ name: 'Local only' }));

        await store.replaceFavorites([
            sample({ name: 'Remote A', pocketBaseId: 'pb-a', createdAt: 3000 }),
            sample({ name: 'Remote B', pocketBaseId: 'pb-b', createdAt: 2000 })
        ]);

        const favorites = await store.readFavorites();
        expect(favorites).toHaveLength(2);
        expect(favorites.map((favorite) => favorite.name)).toEqual(['Remote A', 'Remote B']);
        expect(favorites.map((favorite) => favorite.pocketBaseId)).toEqual(['pb-a', 'pb-b']);
    });
});

describe('importFavorites', () => {
    it('imports all favorites when the store is empty', async () => {
        const result = await store.importFavorites([
            sample({ name: 'A' }),
            sample({ name: 'B', longitude: 14 }),
        ]);
        expect(result).toEqual({ importedCount: 2, skippedCount: 0 });
        expect(await store.readFavorites()).toHaveLength(2);
    });

    it('skips duplicates based on name + coordinates signature', async () => {
        await store.saveFavorite(sample({ name: 'Existing' }));
        const result = await store.importFavorites([sample({ name: 'Existing' })]);
        expect(result).toEqual({ importedCount: 0, skippedCount: 1 });
        expect(await store.readFavorites()).toHaveLength(1);
    });

    it('skips within-batch duplicates as well', async () => {
        const result = await store.importFavorites([
            sample({ name: 'Dup' }),
            sample({ name: 'Dup' }),
        ]);
        expect(result).toEqual({ importedCount: 1, skippedCount: 1 });
    });

    it('signature is case-insensitive on name', async () => {
        await store.saveFavorite(sample({ name: 'home' }));
        const result = await store.importFavorites([sample({ name: 'HOME' })]);
        expect(result.importedCount).toBe(0);
    });

    it('imports non-duplicate entries and skips duplicates', async () => {
        await store.saveFavorite(sample({ name: 'Old' }));
        const result = await store.importFavorites([
            sample({ name: 'Old' }),
            sample({ name: 'New', longitude: 15.0 }),
        ]);
        expect(result).toEqual({ importedCount: 1, skippedCount: 1 });
    });

    it('imports optional elevation metadata', async () => {
        await store.importFavorites([
            sample({
                elevationMeters: 502,
                elevationSource: 'open-meteo',
                elevationAccuracyMeters: 12
            })
        ]);
        const favorites = await store.readFavorites();
        expect(favorites[0]).toMatchObject({
            elevationMeters: 502,
            elevationSource: 'open-meteo',
            elevationAccuracyMeters: 12
        });
    });
});

describe('getFavoritesForExport', () => {
    it('returns only the exportable fields', async () => {
        await store.saveFavorite(sample());
        const exported = await store.getFavoritesForExport();
        expect(exported).toHaveLength(1);
        const keys = Object.keys(exported[0]);
        expect(keys).toEqual(expect.arrayContaining(['name', 'longitude', 'latitude', 'createdAt']));
        expect(keys).not.toContain('id');
    });

    it('includes optional elevation metadata', async () => {
        await store.saveFavorite(sample({
            elevationMeters: 502,
            elevationSource: 'device',
            elevationAccuracyMeters: 12
        }));
        const exported = await store.getFavoritesForExport();
        expect(exported[0]).toMatchObject({
            elevationMeters: 502,
            elevationSource: 'device',
            elevationAccuracyMeters: 12
        });
    });
});
