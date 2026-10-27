import { describe, expect, it } from "vitest";
import { estimateHikingDuration } from "../../src/js/map/hiking-time.js";

const hours = (value) => value * 3600;

describe("estimateHikingDuration (DIN 33466)", () => {
    it("uses 4 km/h on a flat route", () => {
        expect(estimateHikingDuration({ distanceMeters: 12000, ascentMeters: 0, descentMeters: 0 })).toBe(hours(3));
    });

    it("adds half the flat time to the climb time on a climb-dominated route", () => {
        // vertical 1200 / 300 = 4 h, flat 4 km / 4 = 1 h → 4 + 0.5
        expect(estimateHikingDuration({ distanceMeters: 4000, ascentMeters: 1200, descentMeters: 0 })).toBe(hours(4.5));
    });

    it("adds half the climb time to the flat time when the distance dominates", () => {
        // flat 16 km / 4 = 4 h, vertical 300 / 300 = 1 h → 4 + 0.5
        expect(estimateHikingDuration({ distanceMeters: 16000, ascentMeters: 300, descentMeters: 0 })).toBe(hours(4.5));
    });

    it("counts descent at 500 m/h alongside ascent at 300 m/h", () => {
        // vertical 600 / 300 + 500 / 500 = 3 h, flat 10 km / 4 = 2.5 h → 3 + 1.25
        expect(estimateHikingDuration({ distanceMeters: 10000, ascentMeters: 600, descentMeters: 500 })).toBe(hours(4.25));
    });

    it("returns zero for a zero-distance route without elevation change", () => {
        expect(estimateHikingDuration({ distanceMeters: 0, ascentMeters: 0, descentMeters: 0 })).toBe(0);
    });

    it("matches the published DIN 33466 worked example: 8 km with 900 m ascent takes 4 h", () => {
        // Source: Bergwelten, "Berg-Know-how: Wie lange geht's noch?"
        // https://www.bergwelten.com/a/berg-know-how-wie-lange-geht-s-noch
        // "Höhenunterschied: 900 m. Wegzeit: 900 m/300 m = 3h · Horizontalentfernung: 8 km.
        //  Wegzeit: 8 km/4 km = 2h · Tatsächliche Gehzeit: 2h x 0,5 = 1 + 3h = 4 h" (DIN 33466).
        expect(estimateHikingDuration({ distanceMeters: 8000, ascentMeters: 900, descentMeters: 0 })).toBe(hours(4));
    });
});
