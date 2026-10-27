// DIN 33466 walking time: 4 km/h horizontally, 300 m/h up, 500 m/h down.
// The larger of the horizontal and vertical times counts fully, the smaller one half.
const flatMetersPerHour = 4000;
const ascentMetersPerHour = 300;
const descentMetersPerHour = 500;

export function estimateHikingDuration({ distanceMeters, ascentMeters, descentMeters }) {
    const flatHours = distanceMeters / flatMetersPerHour;
    const verticalHours = ascentMeters / ascentMetersPerHour + descentMeters / descentMetersPerHour;
    const hours = Math.max(flatHours, verticalHours) + Math.min(flatHours, verticalHours) / 2;
    return hours * 3600;
}
