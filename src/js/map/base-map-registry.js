const bergfexTilesUrl = "https://tiles.bergfex.at/styles/bergfex-osm/512/{z}/{x}/{y}.png";
const thunderforestBaseUrl = "https://api.thunderforest.com/outdoors/{z}/{x}/{y}.png";

function expandSubdomains(urlTemplate) {
    return ["a", "b", "c"].map((subdomain) => urlTemplate.replace("{s}", subdomain));
}

function createThunderforestTilesUrl(apiKey) {
    return `${thunderforestBaseUrl}?apikey=${encodeURIComponent(apiKey)}`;
}

function createRasterStyle(tiles, { tileSize, maxzoom }) {
    return {
        version: 8,
        sources: {
            basemap: {
                type: "raster",
                tiles,
                tileSize,
                maxzoom
            }
        },
        layers: [
            {
                id: "basemap",
                type: "raster",
                source: "basemap",
                paint: {
                    "raster-resampling": "nearest"
                }
            }
        ]
    };
}

export const terrainAttributionTokens = [
    { type: "link", label: "basemap.at", href: "https://basemap.at", prefix: "Hillshade © " },
    { type: "link", label: "Mapterhorn", href: "https://mapterhorn.com", prefix: "Terrain © " }
];

function readThunderforestApiKey() {
    const thunderforestApiKey = import.meta.env.VITE_THUNDERFOREST_API_KEY;

    return typeof thunderforestApiKey === "string" ? thunderforestApiKey.trim() : "";
}

export function createBaseMapConfigs(thunderforestApiKey = readThunderforestApiKey()) {
    const normalizedThunderforestApiKey = thunderforestApiKey.trim();

    return {
        osm: {
            label: "OpenStreetMap",
            attribution: [
                { type: "link", label: "OpenStreetMap contributors", href: "https://www.openstreetmap.org/copyright", prefix: "© " }
            ],
            style: createRasterStyle(["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], {
                tileSize: 256,
                maxzoom: 19
            })
        },
        bergfex: {
            label: "Bergfex OSM",
            attribution: [
                { type: "link", label: "Bergfex", href: "https://www.bergfex.at", prefix: "© " },
                { type: "link", label: "OpenStreetMap contributors", href: "https://www.openstreetmap.org/copyright", prefix: "© " }
            ],
            style: createRasterStyle([bergfexTilesUrl], { tileSize: 512, maxzoom: 20 })
        },
        openfreemap: {
            label: "OpenFreeMap Liberty",
            attribution: [
                { type: "link", label: "OpenFreeMap", href: "https://openfreemap.org", prefix: "© " },
                { type: "link", label: "OpenStreetMap contributors", href: "https://www.openstreetmap.org/copyright", prefix: "© " }
            ],
            style: "https://tiles.openfreemap.org/styles/liberty"
        },
        opentopo: {
            label: "OpenTopoMap",
            attribution: [
                { type: "link", label: "OpenTopoMap", href: "https://opentopomap.org", prefix: "© " },
                { type: "link", label: "OpenStreetMap contributors", href: "https://www.openstreetmap.org/copyright", prefix: "© " }
            ],
            style: createRasterStyle(expandSubdomains("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"), {
                tileSize: 256,
                maxzoom: 17
            })
        },
        ...(normalizedThunderforestApiKey ? {
            outdoors: {
                label: "Outdoors",
                attribution: [
                    { type: "link", label: "Thunderforest", href: "https://www.thunderforest.com", prefix: "Maps © " },
                    {
                        type: "link",
                        label: "OpenStreetMap contributors",
                        href: "https://www.openstreetmap.org/copyright",
                        prefix: "Data © "
                    }
                ],
                style: createRasterStyle([createThunderforestTilesUrl(normalizedThunderforestApiKey)], {
                    tileSize: 256,
                    maxzoom: 22
                })
            }
        } : {}),
        cyclosm: {
            label: "CyclOSM",
            attribution: [
                { type: "link", label: "CyclOSM", href: "https://www.cyclosm.org", prefix: "© " },
                { type: "link", label: "OpenStreetMap contributors", href: "https://www.openstreetmap.org/copyright", prefix: "© " }
            ],
            style: createRasterStyle(expandSubdomains("https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png"), {
                tileSize: 256,
                maxzoom: 20
            })
        },
        esriSatellite: {
            label: "Esri Satellite",
            attribution: [
                { type: "link", label: "Esri", href: "https://www.esri.com", prefix: "© " },
                { type: "text", value: "Maxar, Earthstar Geographics" },
                { type: "link", label: "OpenStreetMap contributors", href: "https://www.openstreetmap.org/copyright", prefix: "© " }
            ],
            style: createRasterStyle([
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.jpg"
            ], {
                tileSize: 256,
                maxzoom: 19
            })
        },
        basemapGrauWmts: {
            label: "basemap.at Grau WMTS",
            attribution: [
                { type: "link", label: "basemap.at", href: "https://basemap.at", prefix: "© " },
                { type: "link", label: "OpenStreetMap contributors", href: "https://www.openstreetmap.org/copyright", prefix: "© " }
            ],
            style: createRasterStyle([
                "https://mapsneu.wien.gv.at/basemap/bmapgrau/normal/google3857/{z}/{y}/{x}.png"
            ], {
                tileSize: 256,
                maxzoom: 20
            })
        }
    };
}

export const baseMapConfigs = createBaseMapConfigs();
