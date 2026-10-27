// Slope-aware mountain-bike moving time: 18 km/h on the flat plus 750 m/h of climbing.
// Descent adds no time. Calibrated on a recorded ride (17 km, ~430-490 m up, 82 min moving).
const flatMetersPerHour = 18000;
const ascentMetersPerHour = 750;

export function estimateRidingDuration({ distanceMeters, ascentMeters }) {
    const hours = distanceMeters / flatMetersPerHour + ascentMeters / ascentMetersPerHour;
    return hours * 3600;
}
