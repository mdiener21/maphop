const earthRadiusMeters = 6371008.8;
const minimumDeviceEligibilityMeters = 30;
const minimumDifferenceThresholdMeters = 30;

function hasFiniteNumber(value) {
    return Number.isFinite(value);
}

function distanceBetweenMeters(left, right) {
    const leftLatRad = left.latitude * Math.PI / 180;
    const rightLatRad = right.latitude * Math.PI / 180;
    const deltaLatRad = (right.latitude - left.latitude) * Math.PI / 180;
    const deltaLngRad = (right.longitude - left.longitude) * Math.PI / 180;

    const a =
        Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
        Math.cos(leftLatRad) * Math.cos(rightLatRad) *
            Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);

    return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getEligibleDeviceElevation({ latitude, longitude, deviceFix }) {
    if (!deviceFix || !hasFiniteNumber(deviceFix.altitude)) {
        return null;
    }

    const accuracy = hasFiniteNumber(deviceFix.accuracy) ? Math.max(deviceFix.accuracy, minimumDeviceEligibilityMeters) : minimumDeviceEligibilityMeters;
    const selectedPoint = { latitude, longitude };
    const devicePoint = { latitude: deviceFix.latitude, longitude: deviceFix.longitude };

    if (!hasFiniteNumber(devicePoint.latitude) || !hasFiniteNumber(devicePoint.longitude)) {
        return null;
    }

    if (distanceBetweenMeters(selectedPoint, devicePoint) > accuracy) {
        return null;
    }

    return {
        elevationMeters: deviceFix.altitude,
        elevationSource: "device",
        elevationAccuracyMeters: hasFiniteNumber(deviceFix.altitudeAccuracy) ? deviceFix.altitudeAccuracy : undefined
    };
}

function hasLargeDifference(deviceElevation, openMeteoElevation) {
    const threshold = Math.max(minimumDifferenceThresholdMeters, deviceElevation.elevationAccuracyMeters ?? 0);
    return Math.abs(deviceElevation.elevationMeters - openMeteoElevation) > threshold;
}

export async function fetchOpenMeteoElevation({ latitude, longitude, fetchImpl = fetch }) {
    const url = new URL("https://api.open-meteo.com/v1/elevation");
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));

    const response = await fetchImpl(url.toString(), { method: "GET" });
    if (!response.ok) {
        return null;
    }

    const payload = await response.json();
    const elevation = Array.isArray(payload?.elevation) ? Number(payload.elevation[0]) : null;
    return hasFiniteNumber(elevation) ? elevation : null;
}

export async function resolveFavoriteElevation({
    latitude,
    longitude,
    deviceFix,
    fetchElevation,
    chooseElevation
}) {
    const deviceElevation = getEligibleDeviceElevation({ latitude, longitude, deviceFix });
    let openMeteoElevation = null;

    try {
        openMeteoElevation = await fetchElevation({ latitude, longitude });
    } catch {
        openMeteoElevation = null;
    }

    if (deviceElevation && hasFiniteNumber(openMeteoElevation)) {
        if (hasLargeDifference(deviceElevation, openMeteoElevation) && chooseElevation) {
            return chooseElevation({
                deviceElevation,
                openMeteoElevation: {
                    elevationMeters: openMeteoElevation,
                    elevationSource: "open-meteo"
                }
            });
        }

        return deviceElevation;
    }

    if (deviceElevation) {
        return deviceElevation;
    }

    if (hasFiniteNumber(openMeteoElevation)) {
        return {
            elevationMeters: openMeteoElevation,
            elevationSource: "open-meteo"
        };
    }

    return null;
}
