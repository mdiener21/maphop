import { describe, expect, it } from "vitest";
import { estimateRidingDuration } from "../../src/js/map/riding-time.js";

const hours = (value) => value * 3600;

describe("estimateRidingDuration (mountain bike)", () => {
    it("uses 18 km/h on a flat route", () => {
        expect(estimateRidingDuration({ distanceMeters: 18000, ascentMeters: 0 })).toBeCloseTo(hours(1), 6);
    });

    it("adds 750 m/h of climbing on a climb-heavy route", () => {
        // 9 km / 18 = 0.5 h, 1500 m / 750 = 2 h
        expect(estimateRidingDuration({ distanceMeters: 9000, ascentMeters: 1500 })).toBeCloseTo(hours(2.5), 6);
    });

    it("returns zero for a zero-distance route without climbing", () => {
        expect(estimateRidingDuration({ distanceMeters: 0, ascentMeters: 0 })).toBe(0);
    });

    it("adds no time for descent", () => {
        const withoutDescent = estimateRidingDuration({ distanceMeters: 12000, ascentMeters: 300 });
        expect(estimateRidingDuration({ distanceMeters: 12000, ascentMeters: 300, descentMeters: 900 })).toBe(withoutDescent);
    });

    it("reproduces the calibration ride: 16.48 km with 412 m up takes about 88 min", () => {
        const minutes = estimateRidingDuration({ distanceMeters: 16480, ascentMeters: 412 }) / 60;
        expect(Math.abs(minutes - 88)).toBeLessThanOrEqual(2);
    });
});
