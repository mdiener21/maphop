import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupFavoriteTransfer } from '../../src/js/favorite-transfer.js';

// jsdom doesn't implement these URL methods
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

function makeFile(content, name = 'favorites.json', type = 'application/json') {
    return new File([content], name, { type });
}

function makeElements() {
    const exportButton = document.createElement('button');
    const importButton = document.createElement('button');
    const importInput = document.createElement('input');
    importInput.type = 'file';
    return { exportButton, importButton, importInput };
}

function wireUp(overrides = {}) {
    const { exportButton, importButton, importInput } = makeElements();
    const setStatus = vi.fn();
    const onExportFavorites = vi.fn().mockResolvedValue([]);
    const onImportFavorites = vi.fn().mockResolvedValue({ importedCount: 0, skippedCount: 0 });

    setupFavoriteTransfer({
        exportButton,
        importButton,
        importInput,
        onExportFavorites,
        onImportFavorites,
        setStatus,
        ...overrides,
    });

    return { exportButton, importButton, importInput, setStatus, onExportFavorites, onImportFavorites };
}

async function simulateFileImport(importInput, file) {
    Object.defineProperty(importInput, 'files', { value: [file], configurable: true });
    importInput.dispatchEvent(new Event('change'));
    // flush microtasks
    await new Promise(resolve => setTimeout(resolve, 0));
}

describe('setupFavoriteTransfer — export', () => {
    it('reports no favorites when export list is empty', async () => {
        const { exportButton, setStatus } = wireUp();
        exportButton.click();
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(setStatus).toHaveBeenCalledWith('No saved favorites to export.');
    });

    it('downloads file and reports success when favorites exist', async () => {
        const favorites = [{ name: 'Home', longitude: 13.4, latitude: 48.2, createdAt: 1000 }];
        const appendSpy = vi.spyOn(document.body, 'append').mockImplementation(() => {});
        const { exportButton, setStatus } = wireUp({
            onExportFavorites: vi.fn().mockResolvedValue(favorites),
        });
        exportButton.click();
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(setStatus).toHaveBeenCalledWith('Favorites exported as JSON.');
        appendSpy.mockRestore();
    });
});

describe('setupFavoriteTransfer — import file validation', () => {
    it('rejects a non-JSON file', async () => {
        const { importInput, setStatus } = wireUp();
        await simulateFileImport(importInput, makeFile('hello', 'data.txt', 'text/plain'));
        expect(setStatus).toHaveBeenCalledWith('Select a JSON favorites file.');
    });

    it('accepts a .json file regardless of MIME type', async () => {
        const payload = JSON.stringify({ format: 'maphop-favorites', version: 1, favorites: [
            { name: 'A', longitude: 10, latitude: 47, createdAt: 1 }
        ]});
        const onImportFavorites = vi.fn().mockResolvedValue({ importedCount: 1, skippedCount: 0 });
        const { importInput } = wireUp({ onImportFavorites });
        await simulateFileImport(importInput, makeFile(payload, 'data.json', ''));
        expect(onImportFavorites).toHaveBeenCalled();
    });

    it('rejects an empty file', async () => {
        const { importInput, setStatus } = wireUp();
        await simulateFileImport(importInput, makeFile('', 'favorites.json'));
        expect(setStatus).toHaveBeenCalledWith('Selected file is empty.');
    });

    it('rejects a file over 64 KB', async () => {
        const bigContent = 'x'.repeat(65 * 1024);
        const { importInput, setStatus } = wireUp();
        await simulateFileImport(importInput, makeFile(bigContent, 'favorites.json'));
        expect(setStatus).toHaveBeenCalledWith('Selected file is too large. Limit is 64 KB.');
    });
});

describe('setupFavoriteTransfer — import payload validation', () => {
    it('rejects invalid JSON', async () => {
        const { importInput, setStatus } = wireUp();
        await simulateFileImport(importInput, makeFile('not json'));
        expect(setStatus).toHaveBeenCalledWith('Selected file is not valid JSON.');
    });

    it('rejects JSON that is not an array or maphop-favorites format', async () => {
        const { importInput, setStatus } = wireUp();
        await simulateFileImport(importInput, makeFile(JSON.stringify({ foo: 'bar' })));
        expect(setStatus).toHaveBeenCalledWith('Selected file is not a valid favorites export.');
    });

    it('rejects an empty favorites array', async () => {
        const { importInput, setStatus } = wireUp();
        const payload = JSON.stringify({ format: 'maphop-favorites', version: 1, favorites: [] });
        await simulateFileImport(importInput, makeFile(payload));
        expect(setStatus).toHaveBeenCalledWith('Selected file does not contain any favorites.');
    });

    it('rejects more than 250 favorites', async () => {
        const { importInput, setStatus } = wireUp();
        const favorites = Array.from({ length: 251 }, (_, i) => ({
            name: `Place ${i}`, longitude: i % 360 - 180, latitude: i % 180 - 90, createdAt: i,
        }));
        await simulateFileImport(importInput, makeFile(JSON.stringify(favorites)));
        expect(setStatus).toHaveBeenCalledWith('Selected file contains too many favorites.');
    });

    it('rejects a favorite with no name', async () => {
        const { importInput, setStatus } = wireUp();
        const payload = JSON.stringify([{ name: '', longitude: 10, latitude: 47 }]);
        await simulateFileImport(importInput, makeFile(payload));
        expect(setStatus).toHaveBeenCalledWith('Each imported favorite needs a name.');
    });

    it('rejects a name longer than 80 characters', async () => {
        const { importInput, setStatus } = wireUp();
        const payload = JSON.stringify([{ name: 'A'.repeat(81), longitude: 10, latitude: 47 }]);
        await simulateFileImport(importInput, makeFile(payload));
        expect(setStatus).toHaveBeenCalledWith('Favorite names must be 80 characters or less.');
    });

    it('rejects an out-of-range longitude', async () => {
        const { importInput, setStatus } = wireUp();
        const payload = JSON.stringify([{ name: 'X', longitude: 200, latitude: 47 }]);
        await simulateFileImport(importInput, makeFile(payload));
        expect(setStatus).toHaveBeenCalledWith('Imported favorite longitude is invalid.');
    });

    it('rejects an out-of-range latitude', async () => {
        const { importInput, setStatus } = wireUp();
        const payload = JSON.stringify([{ name: 'X', longitude: 10, latitude: 100 }]);
        await simulateFileImport(importInput, makeFile(payload));
        expect(setStatus).toHaveBeenCalledWith('Imported favorite latitude is invalid.');
    });
});

describe('setupFavoriteTransfer — import result messages', () => {
    const validPayload = JSON.stringify([{ name: 'Home', longitude: 13.4, latitude: 48.2 }]);

    it('reports no new favorites when all are duplicates', async () => {
        const { importInput, setStatus } = wireUp({
            onImportFavorites: vi.fn().mockResolvedValue({ importedCount: 0, skippedCount: 1 }),
        });
        await simulateFileImport(importInput, makeFile(validPayload));
        expect(setStatus).toHaveBeenCalledWith('No new favorites were imported.');
    });

    it('reports count with skip notice when some were duplicates', async () => {
        const { importInput, setStatus } = wireUp({
            onImportFavorites: vi.fn().mockResolvedValue({ importedCount: 2, skippedCount: 1 }),
        });
        await simulateFileImport(importInput, makeFile(validPayload));
        expect(setStatus).toHaveBeenCalledWith('Imported 2 favorites. Skipped 1 duplicates.');
    });

    it('reports plain count when no duplicates', async () => {
        const { importInput, setStatus } = wireUp({
            onImportFavorites: vi.fn().mockResolvedValue({ importedCount: 3, skippedCount: 0 }),
        });
        await simulateFileImport(importInput, makeFile(validPayload));
        expect(setStatus).toHaveBeenCalledWith('Imported 3 favorites.');
    });
});

describe('setupFavoriteTransfer — import button', () => {
    it('clicking import button triggers the file input', () => {
        const { importButton, importInput } = wireUp();
        const clickSpy = vi.spyOn(importInput, 'click').mockImplementation(() => {});
        importButton.click();
        expect(clickSpy).toHaveBeenCalled();
    });
});
