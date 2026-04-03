const latitudeParam = "lat";
const longitudeParam = "lng";
const zoomParam = "z";
const coordinatePrecision = 6;
const zoomPrecision = 2;
const maxMapZoom = 22;

function parseSearchParamNumber(url, key) {
    const value = url.searchParams.get(key);
    return value === null ? Number.NaN : Number(value);
}

function isValidLatitude(latitude) {
    return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90;
}

function isValidLongitude(longitude) {
    return Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

function isValidZoom(zoom) {
    return Number.isFinite(zoom) && zoom >= 0 && zoom <= maxMapZoom;
}

export function buildSharedLocationUrl({ latitude, longitude, zoom }, baseUrl = window.location.href) {
    if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
        throw new Error("Shared location coordinates are invalid.");
    }

    const url = new URL(baseUrl);
    url.searchParams.set(latitudeParam, latitude.toFixed(coordinatePrecision));
    url.searchParams.set(longitudeParam, longitude.toFixed(coordinatePrecision));

    if (isValidZoom(zoom)) {
        url.searchParams.set(zoomParam, zoom.toFixed(zoomPrecision));
    } else {
        url.searchParams.delete(zoomParam);
    }

    return url.toString();
}

export function parseSharedLocationFromUrl(urlInput = window.location.href) {
    const url = new URL(urlInput);
    const latitude = parseSearchParamNumber(url, latitudeParam);
    const longitude = parseSearchParamNumber(url, longitudeParam);
    const zoom = parseSearchParamNumber(url, zoomParam);

    if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
        return null;
    }

    return {
        center: [longitude, latitude],
        zoom: isValidZoom(zoom) ? zoom : null
    };
}
