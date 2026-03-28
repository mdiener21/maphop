import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('maplibre-gl', () => {
    class LngLatBounds {
        constructor() {}
        extend() { return this; }
    }
    return { default: { LngLatBounds } };
});

import { LocationTracker } from '../../src/js/location-tracker.js';

function makeMap() {
    const source = { setData: vi.fn() };
    return {
        getSource: vi.fn(() => source),
        addSource: vi.fn(),
        getLayer: vi.fn(() => null),
        addLayer: vi.fn(),
        fitBounds: vi.fn(),
        easeTo: vi.fn(),
        _source: source,
    };
}

function makeCallbacks() {
    return {
        onStatus: vi.fn(),
        onTrackingStateChange: vi.fn(),
    };
}

beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(global.navigator, 'geolocation', {
        value: {
            watchPosition: vi.fn(() => 42),
            clearWatch: vi.fn(),
        },
        configurable: true,
    });
});

afterEach(() => {
    vi.useRealTimers();
});

describe('LocationTracker — initial state', () => {
    it('isActive is false before start()', () => {
        const tracker = new LocationTracker(makeMap(), makeCallbacks());
        expect(tracker.isActive).toBe(false);
    });
});

describe('LocationTracker — start()', () => {
    it('sets isActive to true', () => {
        const tracker = new LocationTracker(makeMap(), makeCallbacks());
        tracker.start();
        expect(tracker.isActive).toBe(true);
    });

    it('fires onTrackingStateChange(true)', () => {
        const cbs = makeCallbacks();
        new LocationTracker(makeMap(), cbs).start();
        expect(cbs.onTrackingStateChange).toHaveBeenCalledWith(true);
    });

    it('calls navigator.geolocation.watchPosition', () => {
        new LocationTracker(makeMap(), makeCallbacks()).start();
        expect(navigator.geolocation.watchPosition).toHaveBeenCalledOnce();
    });

    it('reports unsupported when geolocation is absent', () => {
        // Replace navigator entirely so "geolocation" in navigator is false
        const original = global.navigator;
        Object.defineProperty(global, 'navigator', { value: {}, configurable: true });
        try {
            const cbs = makeCallbacks();
            new LocationTracker(makeMap(), cbs).start();
            expect(cbs.onStatus).toHaveBeenCalledWith(
                'This browser does not support geolocation.'
            );
        } finally {
            Object.defineProperty(global, 'navigator', { value: original, configurable: true });
        }
    });
});

describe('LocationTracker — stop()', () => {
    it('sets isActive to false', () => {
        const tracker = new LocationTracker(makeMap(), makeCallbacks());
        tracker.start();
        tracker.stop();
        expect(tracker.isActive).toBe(false);
    });

    it('fires onTrackingStateChange(false)', () => {
        const cbs = makeCallbacks();
        const tracker = new LocationTracker(makeMap(), cbs);
        tracker.start();
        cbs.onTrackingStateChange.mockClear();
        tracker.stop('Done.');
        expect(cbs.onTrackingStateChange).toHaveBeenCalledWith(false);
    });

    it('passes an optional message to onStatus', () => {
        const cbs = makeCallbacks();
        const tracker = new LocationTracker(makeMap(), cbs);
        tracker.start();
        tracker.stop('Stopped.');
        expect(cbs.onStatus).toHaveBeenCalledWith('Stopped.');
    });

    it('calls geolocation.clearWatch', () => {
        const tracker = new LocationTracker(makeMap(), makeCallbacks());
        tracker.start();
        tracker.stop();
        expect(navigator.geolocation.clearWatch).toHaveBeenCalledWith(42);
    });
});

describe('LocationTracker — idle timeout', () => {
    it('stops tracking after 15 minutes of inactivity', () => {
        const cbs = makeCallbacks();
        const tracker = new LocationTracker(makeMap(), cbs);
        tracker.start();
        vi.advanceTimersByTime(15 * 60 * 1000);
        expect(tracker.isActive).toBe(false);
        expect(cbs.onStatus).toHaveBeenCalledWith(
            'Location tracking stopped after 15 minutes of inactivity.'
        );
    });

    it('registerActivity resets the idle timer', () => {
        const tracker = new LocationTracker(makeMap(), makeCallbacks());
        tracker.start();
        vi.advanceTimersByTime(14 * 60 * 1000);
        tracker.registerActivity();
        vi.advanceTimersByTime(14 * 60 * 1000);
        expect(tracker.isActive).toBe(true); // timer was reset, not yet expired
    });
});

describe('LocationTracker — error handling', () => {
    it('shows permission-denied message for error code 1', () => {
        const cbs = makeCallbacks();
        const tracker = new LocationTracker(makeMap(), cbs);
        tracker.start();
        const errorHandler = navigator.geolocation.watchPosition.mock.calls[0][1];
        errorHandler({ code: 1 });
        expect(cbs.onStatus).toHaveBeenCalledWith(
            'Location access was denied. Enable permission in your browser settings and try again.'
        );
    });

    it('shows position-unavailable message for error code 2', () => {
        const cbs = makeCallbacks();
        const tracker = new LocationTracker(makeMap(), cbs);
        tracker.start();
        const errorHandler = navigator.geolocation.watchPosition.mock.calls[0][1];
        errorHandler({ code: 2 });
        expect(cbs.onStatus).toHaveBeenCalledWith(
            'Your position is currently unavailable. Move to an area with better GPS or network reception.'
        );
    });

    it('shows timeout message for error code 3', () => {
        const cbs = makeCallbacks();
        const tracker = new LocationTracker(makeMap(), cbs);
        tracker.start();
        const errorHandler = navigator.geolocation.watchPosition.mock.calls[0][1];
        errorHandler({ code: 3 });
        expect(cbs.onStatus).toHaveBeenCalledWith(
            'The location request timed out. Try again when the device has a stronger signal.'
        );
    });

    it('shows a generic message for unknown error codes', () => {
        const cbs = makeCallbacks();
        const tracker = new LocationTracker(makeMap(), cbs);
        tracker.start();
        const errorHandler = navigator.geolocation.watchPosition.mock.calls[0][1];
        errorHandler({ code: 99 });
        expect(cbs.onStatus).toHaveBeenCalledWith('Unable to determine your location.');
    });
});
