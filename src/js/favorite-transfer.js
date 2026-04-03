const exportFormatName = "maphop-favorites";
const maxImportFileSizeBytes = 64 * 1024;
const maxImportFavorites = 250;
const maxFavoriteNameLength = 80;
const jsonMimeTypes = new Set(["application/json", "text/json", "application/geo+json"]);

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
    return fileName.endsWith(".json") || fileName.endsWith(".geojson") || jsonMimeTypes.has(fileType);
}

function normalizeFavoriteRecord(record) {
    if (!record || typeof record !== "object" || Array.isArray(record)) {
        throw new Error("Favorites import must contain objects.");
    }

    // Support GeoJSON Feature format: { type: "Feature", geometry: { coordinates: [lng, lat] }, properties: { name, createdAt } }
    const isGeoJsonFeature = record.type === "Feature" &&
        record.geometry?.type === "Point" &&
        Array.isArray(record.geometry?.coordinates);

    const name = typeof (isGeoJsonFeature ? record.properties?.name : record.name) === "string"
        ? (isGeoJsonFeature ? record.properties.name : record.name).trim()
        : "";
    const longitude = isGeoJsonFeature ? Number(record.geometry.coordinates[0]) : Number(record.longitude);
    const latitude = isGeoJsonFeature ? Number(record.geometry.coordinates[1]) : Number(record.latitude);
    const createdAt = Number(isGeoJsonFeature ? record.properties?.createdAt : record.createdAt);

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
        type: "FeatureCollection",
        features: favorites.map((favorite) => ({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [favorite.longitude, favorite.latitude]
            },
            properties: {
                name: favorite.name,
                createdAt: favorite.createdAt
            }
        }))
    };
}

function parseImportPayload(text) {
    let payload;

    try {
        payload = JSON.parse(text);
    } catch {
        throw new Error("Selected file is not valid JSON.");
    }

    let favorites = null;

    if (Array.isArray(payload)) {
        favorites = payload;
    } else if (payload?.type === "FeatureCollection" && Array.isArray(payload.features)) {
        favorites = payload.features;
    } else if (payload?.format === exportFormatName && Array.isArray(payload.favorites)) {
        favorites = payload.favorites;
    }

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
    return `maphop-favorites-${dayStamp}.geojson`;
}

async function handleExport(onExportFavorites, setStatus) {
    const favorites = await onExportFavorites();

    if (!Array.isArray(favorites) || favorites.length === 0) {
        setStatus("No saved favorites to export.");
        return;
    }

    const payload = createExportPayload(favorites);
    downloadTextFile(createExportFilename(), JSON.stringify(payload, null, 2));
    setStatus("Favorites exported as GeoJSON.");
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