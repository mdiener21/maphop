const terrainSourceId = "terrain-source";
const hillshadeSourceId = "hillshade-source";
const hillshadeLayerId = "terrain-hillshade";
const terrainTileJsonUrl = "https://tiles.mapterhorn.com/tilejson.json";
const hillshadeTilesUrl = "https://mapsneu.wien.gv.at/basemap/bmapgelaende/grau/google3857/{z}/{y}/{x}.jpeg";

export function createTerrainController({ map, terrainButton, terrainToggleLabel, onStatus, onStateChange }) {
    let active = false;

    function syncButtonState() {
        terrainButton.dataset.state = active ? "active" : "idle";
        terrainToggleLabel.textContent = active ? "On" : "Off";
    }

    function applyTerrain() {
        if (!map.getSource(terrainSourceId)) {
            map.addSource(terrainSourceId, {
                type: "raster-dem",
                url: terrainTileJsonUrl,
                encoding: "terrarium"
            });
        }

        if (!map.getSource(hillshadeSourceId)) {
            map.addSource(hillshadeSourceId, {
                type: "raster",
                tiles: [hillshadeTilesUrl],
                tileSize: 256,
                maxzoom: 18
            });
        }

        if (!map.getLayer(hillshadeLayerId)) {
            map.addLayer({
                id: hillshadeLayerId,
                type: "raster",
                source: hillshadeSourceId,
                paint: { "raster-opacity": 0.4 }
            });
        }

        map.setTerrain({ source: terrainSourceId, exaggeration: 1 });
    }

    function notifyStateChange() {
        if (onStateChange) {
            onStateChange(active);
        }
    }

    function enable() {
        active = true;
        applyTerrain();
        map.easeTo({ pitch: 45, duration: 600 });
        syncButtonState();
        notifyStateChange();
        onStatus("3D Terrain on.");
    }

    function disable() {
        map.setTerrain(null);

        if (map.getLayer(hillshadeLayerId)) {
            map.removeLayer(hillshadeLayerId);
        }
        if (map.getSource(hillshadeSourceId)) {
            map.removeSource(hillshadeSourceId);
        }

        map.easeTo({ pitch: 0, duration: 600 });
        active = false;
        syncButtonState();
        notifyStateChange();
        onStatus("3D Terrain off.");
    }

    function ensureAfterStyleLoad() {
        if (!map.getSource(terrainSourceId)) {
            map.addSource(terrainSourceId, {
                type: "raster-dem",
                url: terrainTileJsonUrl,
                encoding: "terrarium"
            });
        }

        if (active) {
            applyTerrain();
        }
    }

    function toggle() {
        if (active) {
            disable();
            return;
        }

        enable();
    }

    syncButtonState();

    return {
        disable,
        enable,
        ensureAfterStyleLoad,
        get isActive() {
            return active;
        },
        toggle
    };
}