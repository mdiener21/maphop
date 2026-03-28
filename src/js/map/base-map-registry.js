const bergfexTilesUrl = "https://tiles.bergfex.at/styles/bergfex-osm/512/{z}/{x}/{y}.png";

function expandSubdomains(urlTemplate) {
    return ["a", "b", "c"].map((subdomain) => urlTemplate.replace("{s}", subdomain));
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

export const baseMapConfigs = {
    bergfex: {
        label: "Bergfex OSM",
        attribution: [
            { type: "link", label: "Bergfex", href: "https://www.bergfex.at", prefix: "© " },
            { type: "link", label: "OpenStreetMap contributors", href: "https://www.openstreetmap.org/copyright", prefix: "© " }
        ],
        style: createRasterStyle([bergfexTilesUrl], { tileSize: 512, maxzoom: 20 })
    },
    osm: {
        label: "OpenStreetMap",
        attribution: [
            { type: "link", label: "OpenStreetMap contributors", href: "https://www.openstreetmap.org/copyright", prefix: "© " }
        ],
        style: createRasterStyle(expandSubdomains("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"), {
            tileSize: 256,
            maxzoom: 19
        })
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