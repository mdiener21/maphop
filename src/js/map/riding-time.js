// Slope-aware mountain-bike moving time: 18 km/h on the flat plus 750 m/h of climbing.
// Descent adds no time. Fitted to one recorded mountain-bike ride analysed in 200 m segments
// (16.5 km, 412 m up, 88 min including slow sections); against that ride's strict moving time
// (82 min) the estimate is about 10% conservative.
const flatMetersPerHour = 18000;
const ascentMetersPerHour = 750;

export function estimateRidingDuration({ distanceMeters, ascentMeters }) {
    const hours = distanceMeters / flatMetersPerHour + ascentMeters / ascentMetersPerHour;
    return hours * 3600;
}
