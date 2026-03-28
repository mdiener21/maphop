const exportFormatName = "maphop-favorites";
const exportFormatVersion = 1;
const maxImportFileSizeBytes = 64 * 1024;
const maxImportFavorites = 250;
const maxFavoriteNameLength = 80;
const jsonMimeTypes = new Set(["application/json", "text/json"]);

function downloadTextFile(filename, text) {
    const blob = new Blob([text], { type: "application/json" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = filename;
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    link.remove();

    window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
    }, 0);
}

function isAcceptedJsonFile(file) {
    const fileType = (file.type || "").toLowerCase();
    const fileName = (file.name || "").toLowerCase();
    return fileName.endsWith(".json") || jsonMimeTypes.has(fileType);
}

function normalizeFavoriteRecord(record) {
    if (!record || typeof record !== "object" || Array.isArray(record)) {
        throw new Error("Favorites import must contain objects.");
    }

    const name = typeof record.name === "string" ? record.name.trim() : "";
    const longitude = Number(record.longitude);
    const latitude = Number(record.latitude);
    const createdAt = Number(record.createdAt);

    if (!name) {
        throw new Error("Each imported favorite needs a name.");
    }

    if (name.length > maxFavoriteNameLength) {
        throw new Error("Favorite names must be 80 characters or less.");
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        throw new Error("Imported favorite longitude is invalid.");
    }

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        throw new Error("Imported favorite latitude is invalid.");
    }

    return {
        name,
        longitude,
        latitude,
        createdAt: Number.isFinite(createdAt) && createdAt > 0 ? Math.trunc(createdAt) : Date.now()
    };
}

function createExportPayload(favorites) {
    return {
        format: exportFormatName,
        version: exportFormatVersion,
        exportedAt: new Date().toISOString(),
        favorites: favorites.map((favorite) => normalizeFavoriteRecord(favorite))
    };
}

function parseImportPayload(text) {
    let payload;

    try {
        payload = JSON.parse(text);
    } catch {
        throw new Error("Selected file is not valid JSON.");
    }

    const favorites = Array.isArray(payload)
        ? payload
        : payload?.format === exportFormatName && Array.isArray(payload.favorites)
            ? payload.favorites
            : null;

    if (!favorites) {
        throw new Error("Selected file is not a valid favorites export.");
    }

    if (favorites.length === 0) {
        throw new Error("Selected file does not contain any favorites.");
    }

    if (favorites.length > maxImportFavorites) {
        throw new Error("Selected file contains too many favorites.");
    }

    return favorites.map((favorite) => normalizeFavoriteRecord(favorite));
}

function createExportFilename() {
    const dayStamp = new Date().toISOString().slice(0, 10);
    return `maphop-favorites-${dayStamp}.json`;
}

async function handleExport(onExportFavorites, setStatus) {
    const favorites = await onExportFavorites();

    if (!Array.isArray(favorites) || favorites.length === 0) {
        setStatus("No saved favorites to export.");
        return;
    }

    const payload = createExportPayload(favorites);
    downloadTextFile(createExportFilename(), JSON.stringify(payload, null, 2));
    setStatus("Favorites exported as JSON.");
}

async function handleImport(file, onImportFavorites, setStatus) {
    if (!file) {
        return;
    }

    if (!isAcceptedJsonFile(file)) {
        throw new Error("Select a JSON favorites file.");
    }

    if (file.size === 0) {
        throw new Error("Selected file is empty.");
    }

    if (file.size > maxImportFileSizeBytes) {
        throw new Error("Selected file is too large. Limit is 64 KB.");
    }

    const importedFavorites = parseImportPayload(await file.text());
    const result = await onImportFavorites(importedFavorites);

    if (result.importedCount === 0) {
        setStatus("No new favorites were imported.");
        return;
    }

    if (result.skippedCount > 0) {
        setStatus(`Imported ${result.importedCount} favorites. Skipped ${result.skippedCount} duplicates.`);
        return;
    }

    setStatus(`Imported ${result.importedCount} favorites.`);
}

export function setupFavoriteTransfer({
    exportButton,
    importButton,
    importInput,
    onExportFavorites,
    onImportFavorites,
    setStatus
}) {
    exportButton?.addEventListener("click", async () => {
        try {
            await handleExport(onExportFavorites, setStatus);
        } catch (error) {
            console.error(error);
            setStatus(error instanceof Error ? error.message : "Unable to export favorites.");
        }
    });

    importButton?.addEventListener("click", () => {
        if (!importInput) {
            return;
        }

        importInput.value = "";
        importInput.click();
    });

    importInput?.addEventListener("change", async () => {
        try {
            await handleImport(importInput.files?.[0], onImportFavorites, setStatus);
        } catch (error) {
            console.error(error);
            setStatus(error instanceof Error ? error.message : "Unable to import favorites.");
        } finally {
            importInput.value = "";
        }
    });
}