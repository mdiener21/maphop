import maplibregl from "maplibre-gl";

const trackingIdleTimeoutMs = 15 * 60 * 1000;
const locationSourceId = "user-location";
const locationAccuracyLayerId = "user-location-accuracy";
const locationHeadingLayerId = "user-location-heading";
const locationPointLayerId = "user-location-point";

function normalizeHeading(headingDegrees) {
    return (headingDegrees % 360 + 360) % 360;
}

function bearingBetween(previousCoords, currentCoords) {
    const [previousLng, previousLat] = previousCoords;
    const [currentLng, currentLat] = currentCoords;
    const previousLatRad = previousLat * Math.PI / 180;
    const currentLatRad = currentLat * Math.PI / 180;
    const deltaLngRad = (currentLng - previousLng) * Math.PI / 180;
    const y = Math.sin(deltaLngRad) * Math.cos(currentLatRad);
    const x =
        Math.cos(previousLatRad) * Math.sin(currentLatRad) -
        Math.sin(previousLatRad) * Math.cos(currentLatRad) * Math.cos(deltaLngRad);
    return normalizeHeading(Math.atan2(y, x) * 180 / Math.PI);
}

function distanceBetween(previousCoords, currentCoords) {
    const earthRadius = 6371008.8;
    const [previousLng, previousLat] = previousCoords;
    const [currentLng, currentLat] = currentCoords;
    const previousLatRad = previousLat * Math.PI / 180;
    const currentLatRad = currentLat * Math.PI / 180;
    const deltaLatRad = (currentLat - previousLat) * Math.PI / 180;
    const deltaLngRad = (currentLng - previousLng) * Math.PI / 180;

    const a =
        Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
        Math.cos(previousLatRad) * Math.cos(currentLatRad) *
            Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
    return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function destinationPoint(center, bearingDegrees, distanceMeters) {
    const earthRadius = 6371008.8;
    const [lng, lat] = center;
    const lngRad = lng * Math.PI / 180;
    const latRad = lat * Math.PI / 180;
    const bearingRad = bearingDegrees * Math.PI / 180;
    const angularDistance = distanceMeters / earthRadius;

    const destinationLatRad = Math.asin(
        Math.sin(latRad) * Math.cos(angularDistance) +
            Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearingRad)
    );
    const destinationLngRad =
        lngRad +
        Math.atan2(
            Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(latRad),
            Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(destinationLatRad)
        );

    return [
        ((destinationLngRad * 180 / Math.PI + 540) % 360) - 180,
        destinationLatRad * 180 / Math.PI
    ];
}

function createCirclePolygon(center, radiusMeters, steps = 48) {
    const coordinates = [];
    for (let index = 0; index <= steps; index += 1) {
        coordinates.push(destinationPoint(center, index * (360 / steps), radiusMeters));
    }
    return coordinates;
}

function createHeadingConeBands(center, headingDegrees, accuracyMeters) {
    const spreadDegrees = 22;
    const coneLength = Math.max(accuracyMeters * 0.9, 55);
    const arcPoints = 18;
    const numBands = 6;
    const bands = [];

    for (let band = 0; band < numBands; band++) {
        const innerRadius = (band / numBands) * coneLength;
        const outerRadius = ((band + 1) / numBands) * coneLength;
        const coordinates = [];

        if (band === 0) {
            // Innermost band: fan from center point to first arc
            coordinates.push(center);
            for (let i = 0; i <= arcPoints; i++) {
                const ratio = i / arcPoints;
                const bearing = headingDegrees - spreadDegrees + spreadDegrees * 2 * ratio;
                coordinates.push(destinationPoint(center, bearing, outerRadius));
            }
            coordinates.push(center);
        } else {
            // Ring sector: walk inner arc forward, outer arc backward, close
            for (let i = 0; i <= arcPoints; i++) {
                const ratio = i / arcPoints;
                const bearing = headingDegrees - spreadDegrees + spreadDegrees * 2 * ratio;
                coordinates.push(destinationPoint(center, bearing, innerRadius));
            }
            for (let i = arcPoints; i >= 0; i--) {
                const ratio = i / arcPoints;
                const bearing = headingDegrees - spreadDegrees + spreadDegrees * 2 * ratio;
                coordinates.push(destinationPoint(center, bearing, outerRadius));
            }
            coordinates.push(coordinates[0]);
        }

        bands.push({ coordinates, bandIndex: band });
    }

    return bands;
}

function createEmptyLocationFeatureCollection() {
    return { type: "FeatureCollection", features: [] };
}

export class LocationTracker {
    constructor(map, { onStatus, onTrackingStateChange }) {
        this._map = map;
        this._onStatus = onStatus;
        this._onTrackingStateChange = onTrackingStateChange;

        this._watchId = null;
        this._hasCenteredOnPosition = false;
        this._previousFix = null;
        this._trackingIdleTimeoutId = null;
        this._currentFeatureCollection = createEmptyLocationFeatureCollection();
    }

    get isActive() {
        return this._watchId !== null;
    }

    start() {
        if (!("geolocation" in navigator)) {
            this._onStatus("This browser does not support geolocation.");
            return;
        }

        this._hasCenteredOnPosition = false;
        this._onTrackingStateChange(true);
        this._onStatus("Requesting your current position...");
        this._scheduleIdleTimeout();

        this._watchId = navigator.geolocation.watchPosition(
            (position) => this._handlePosition(position),
            (error) => this._handleError(error),
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        );
    }

    stop(message) {
        if (this._watchId !== null) {
            navigator.geolocation.clearWatch(this._watchId);
            this._watchId = null;
        }

        this._clearIdleTimeout();
        this._onTrackingStateChange(false);

        if (message) {
            this._onStatus(message);
        }
    }

    clearLocation() {
        this._currentFeatureCollection = createEmptyLocationFeatureCollection();
        this._previousFix = null;
        this._syncOverlay();
    }

    registerActivity() {
        if (this._watchId !== null) {
            this._scheduleIdleTimeout();
        }
    }

    _ensureOverlay() {
        const map = this._map;

        if (!map.getSource(locationSourceId)) {
            map.addSource(locationSourceId, {
                type: "geojson",
                data: this._currentFeatureCollection
            });
        }

        if (!map.getLayer(locationAccuracyLayerId)) {
            map.addLayer({
                id: locationAccuracyLayerId,
                type: "fill",
                source: locationSourceId,
                filter: ["==", ["get", "kind"], "accuracy"],
                paint: {
                    "fill-color": "rgba(111, 242, 189, 0.17)",
                    "fill-outline-color": "rgba(111, 242, 189, 0.9)"
                }
            });
        }

        if (!map.getLayer(locationHeadingLayerId)) {
            map.addLayer({
                id: locationHeadingLayerId,
                type: "fill",
                source: locationSourceId,
                filter: ["==", ["get", "kind"], "heading"],
                paint: {
                    "fill-color": [
                        "match", ["get", "bandIndex"],
                        0, "rgba(55, 105, 255, 0.72)",
                        1, "rgba(72, 125, 255, 0.55)",
                        2, "rgba(95, 150, 255, 0.38)",
                        3, "rgba(125, 175, 255, 0.24)",
                        4, "rgba(160, 200, 255, 0.13)",
                        /* band 5 and fallback */ "rgba(200, 225, 255, 0.05)"
                    ]
                }
            });
        }

        if (!map.getLayer(locationPointLayerId)) {
            map.addLayer({
                id: locationPointLayerId,
                type: "circle",
                source: locationSourceId,
                filter: ["==", ["get", "kind"], "point"],
                paint: {
                    "circle-radius": 10,
                    "circle-color": "rgba(23, 192, 139, 0.96)",
                    "circle-stroke-color": "#ecfffa",
                    "circle-stroke-width": 3
                }
            });
        }
    }

    _syncOverlay() {
        const source = this._map.getSource(locationSourceId);
        if (source) {
            source.setData(this._currentFeatureCollection);
        }
    }

    _scheduleIdleTimeout() {
        this._clearIdleTimeout();
        this._trackingIdleTimeoutId = window.setTimeout(() => {
            this.clearLocation();
            this.stop("Location tracking stopped after 15 minutes of inactivity.");
        }, trackingIdleTimeoutMs);
    }

    _clearIdleTimeout() {
        window.clearTimeout(this._trackingIdleTimeoutId);
        this._trackingIdleTimeoutId = null;
    }

    _calculateHeadingFromFixes(currentCoords) {
        if (!this._previousFix) {
            return null;
        }

        const distance = distanceBetween(this._previousFix.lngLat, currentCoords);
        if (distance < 5) {
            return null;
        }

        return bearingBetween(this._previousFix.lngLat, currentCoords);
    }

    _handlePosition(position) {
        const lngLat = [position.coords.longitude, position.coords.latitude];
        const accuracy = Math.max(position.coords.accuracy || 0, 8);
        const reportedHeading = Number.isFinite(position.coords.heading)
            ? normalizeHeading(position.coords.heading)
            : null;
        const derivedHeading = this._calculateHeadingFromFixes(lngLat);
        const speed = Number.isFinite(position.coords.speed) ? position.coords.speed : null;
        const heading = reportedHeading ?? derivedHeading;
        const isMoving = (speed !== null && speed > 0.7) || derivedHeading !== null;
        const accuracyPolygon = createCirclePolygon(lngLat, accuracy);

        const features = [
            {
                type: "Feature",
                properties: { kind: "accuracy" },
                geometry: { type: "Polygon", coordinates: [accuracyPolygon] }
            },
            {
                type: "Feature",
                properties: { kind: "point" },
                geometry: { type: "Point", coordinates: lngLat }
            }
        ];

        if (heading !== null && isMoving) {
            for (const { coordinates, bandIndex } of createHeadingConeBands(lngLat, heading, accuracy)) {
                features.push({
                    type: "Feature",
                    properties: { kind: "heading", bandIndex },
                    geometry: { type: "Polygon", coordinates: [coordinates] }
                });
            }
        }

        this._currentFeatureCollection = { type: "FeatureCollection", features };
        this._syncOverlay();

        if (!this._hasCenteredOnPosition) {
            const bounds = accuracyPolygon.reduce((lngLatBounds, coordinate) => {
                return lngLatBounds.extend(coordinate);
            }, new maplibregl.LngLatBounds(accuracyPolygon[0], accuracyPolygon[0]));

            this._map.fitBounds(bounds, {
                padding: { top: 90, right: 24, bottom: 90, left: 24 },
                duration: 700,
                maxZoom: 17
            });

            this._hasCenteredOnPosition = true;
            this._onStatus("Location shown on map.");
        } else {
            this._map.easeTo({ center: lngLat, duration: 500 });
        }

        this._previousFix = { lngLat, timestamp: position.timestamp };
    }

    _handleError(error) {
        this.clearLocation();

        const messageByCode = {
            1: "Location access was denied. Enable permission in your browser settings and try again.",
            2: "Your position is currently unavailable. Move to an area with better GPS or network reception.",
            3: "The location request timed out. Try again when the device has a stronger signal."
        };

        this.stop(messageByCode[error.code] || "Unable to determine your location.");
    }

    ensureOverlayAfterStyleLoad() {
        this._ensureOverlay();
        this._syncOverlay();
    }
}
