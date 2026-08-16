import { describe, it, expect, vi } from 'vitest';
import { fetchOpenMeteoElevation, resolveFavoriteElevation } from '../../src/js/favorite-elevation.js';

describe('resolveFavoriteElevation', () => {
    it('prefers eligible device elevation when Open-Meteo difference is within threshold', async () => {
        const fetchElevation = vi.fn().mockResolvedValue(505);
        const chooseElevation = vi.fn();

        const elevation = await resolveFavoriteElevation({
            latitude: 46.5953463,
            longitude: 14.271117,
            deviceFix: {
                latitude: 46.5953463,
                longitude: 14.271117,
                accuracy: 12,
                altitude: 502,
                altitudeAccuracy: 10
            },
            fetchElevation,
            chooseElevation
        });

        expect(fetchElevation).toHaveBeenCalledWith({
            latitude: 46.5953463,
            longitude: 14.271117
        });
        expect(chooseElevation).not.toHaveBeenCalled();
        expect(elevation).toEqual({
            elevationMeters: 502,
            elevationSource: 'device',
            elevationAccuracyMeters: 10
        });
    });

    it('keeps eligible device elevation when Open-Meteo lookup fails', async () => {
        const elevation = await resolveFavoriteElevation({
            latitude: 46.5953463,
            longitude: 14.271117,
            deviceFix: {
                latitude: 46.5953463,
                longitude: 14.271117,
                accuracy: 12,
                altitude: 502,
                altitudeAccuracy: 10
            },
            fetchElevation: vi.fn().mockRejectedValue(new Error('offline')),
            chooseElevation: vi.fn()
        });

        expect(elevation).toEqual({
            elevationMeters: 502,
            elevationSource: 'device',
            elevationAccuracyMeters: 10
        });
    });

    it('returns null when no elevation source is available', async () => {
        const elevation = await resolveFavoriteElevation({
            latitude: 46.5953463,
            longitude: 14.271117,
            deviceFix: null,
            fetchElevation: vi.fn().mockRejectedValue(new Error('offline')),
            chooseElevation: vi.fn()
        });

        expect(elevation).toBeNull();
    });

    it('asks for a choice when eligible device and Open-Meteo elevations differ beyond threshold', async () => {
        const openMeteoChoice = { elevationMeters: 620, elevationSource: 'open-meteo' };
        const chooseElevation = vi.fn().mockReturnValue(openMeteoChoice);

        const elevation = await resolveFavoriteElevation({
            latitude: 46.5953463,
            longitude: 14.271117,
            deviceFix: {
                latitude: 46.5953463,
                longitude: 14.271117,
                accuracy: 12,
                altitude: 502,
                altitudeAccuracy: 10
            },
            fetchElevation: vi.fn().mockResolvedValue(620),
            chooseElevation
        });

        expect(chooseElevation).toHaveBeenCalledWith({
            deviceElevation: {
                elevationMeters: 502,
                elevationSource: 'device',
                elevationAccuracyMeters: 10
            },
            openMeteoElevation: openMeteoChoice
        });
        expect(elevation).toBe(openMeteoChoice);
    });

    it('uses Open-Meteo when the selected point is outside the latest GPS accuracy radius', async () => {
        const elevation = await resolveFavoriteElevation({
            latitude: 46.5953463,
            longitude: 14.271117,
            deviceFix: {
                latitude: 46.7000000,
                longitude: 14.500000,
                accuracy: 12,
                altitude: 502,
                altitudeAccuracy: 10
            },
            fetchElevation: vi.fn().mockResolvedValue(620),
            chooseElevation: vi.fn()
        });

        expect(elevation).toEqual({
            elevationMeters: 620,
            elevationSource: 'open-meteo'
        });
    });
});

describe('fetchOpenMeteoElevation', () => {
    it('calls Open-Meteo with selected coordinates and returns the first elevation value', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({ elevation: [502] })
        });

        const elevation = await fetchOpenMeteoElevation({
            latitude: 46.5953463,
            longitude: 14.271117,
            fetchImpl
        });

        expect(fetchImpl).toHaveBeenCalledWith(
            'https://api.open-meteo.com/v1/elevation?latitude=46.5953463&longitude=14.271117',
            { method: 'GET' }
        );
        expect(elevation).toBe(502);
    });
});
