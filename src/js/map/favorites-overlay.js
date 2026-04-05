import maplibregl from "maplibre-gl";

const sourceId = "favorites-overlay";
const layerId = "favorites-overlay-pins";
const imageId = "favorites-pin";
const storageKey = "maphop-favorites-overlay";

function buildGeoJson(favorites) {
    return {
        type: "FeatureCollection",
        features: favorites.map((favorite) => ({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [favorite.longitude, favorite.latitude]
            },
            properties: {
                name: favorite.name
            }
        }))
    };
}

export function createPinImageData() {
    // 31×42 SVG pin (30% larger than the base 24×32): teardrop shape with accent fill
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="31" height="42" viewBox="0 0 24 32">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20S24 21 24 12C24 5.373 18.627 0 12 0z"
              fill="#6ff2bd" stroke="#0d1b20" stroke-width="1.5"/>
        <circle cx="12" cy="12" r="4" fill="#0d1b20"/>
    </svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    return URL.createObjectURL(blob);
}

export function createFavoritesOverlay(map) {
    let currentPopup = null;
    let currentFavorites = [];
    let visible = localStorage.getItem(storageKey) === "1";

    function isReady() {
        return map.getSource(sourceId) !== undefined;
    }

    function addPinImageAndLayer() {
        const url = createPinImageData();
        const img = new Image(31, 42);
        img.onload = () => {
            URL.revokeObjectURL(url);
            if (map.hasImage(imageId)) {
                map.removeImage(imageId);
            }
            map.addImage(imageId, img);

            if (!map.getSource(sourceId)) {
                map.addSource(sourceId, {
                    type: "geojson",
                    data: buildGeoJson(currentFavorites)
                });
            }

            if (!map.getLayer(layerId)) {
                map.addLayer({
                    id: layerId,
                    type: "symbol",
                    source: sourceId,
                    layout: {
                        "icon-image": imageId,
                        "icon-size": 0.7,
                        "icon-anchor": "bottom",
                        "icon-allow-overlap": true
                    }
                });

                map.on("mouseenter", layerId, onMouseEnter);
                map.on("mouseleave", layerId, onMouseLeave);
            }

            map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
            map.setLayoutProperty(layerId, "icon-offset", [0, 30]);
        };
        img.src = url;
    }

    function onMouseEnter(event) {
        map.getCanvas().style.cursor = "pointer";
        const feature = event.features?.[0];
        if (!feature) {
            return;
        }

        currentPopup?.remove();
        currentPopup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
            anchor: "bottom",
            offset: [0, -25],
            className: "favorites-overlay-popup"
        })
            .setLngLat(feature.geometry.coordinates)
            .setText(feature.properties.name)
            .addTo(map);
    }

    function onMouseLeave() {
        map.getCanvas().style.cursor = "";
        currentPopup?.remove();
        currentPopup = null;
    }

    function ensureAfterStyleLoad() {
        addPinImageAndLayer();
    }

    function update(favorites) {
        currentFavorites = favorites;
        if (!isReady()) {
            return;
        }

        map.getSource(sourceId).setData(buildGeoJson(favorites));
    }

    function toggle(buttonElement, labelElement) {
        visible = !visible;
        localStorage.setItem(storageKey, visible ? "1" : "0");

        if (buttonElement) {
            buttonElement.dataset.state = visible ? "active" : "idle";
        }

        if (labelElement) {
            labelElement.textContent = visible ? "On" : "Off";
        }

        if (!isReady()) {
            return;
        }

        map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
    }

    function initToggleButton(buttonElement, labelElement) {
        if (!buttonElement) {
            return;
        }

        buttonElement.dataset.state = visible ? "active" : "idle";
        if (labelElement) {
            labelElement.textContent = visible ? "On" : "Off";
        }

        buttonElement.addEventListener("click", (event) => {
            event.stopPropagation();
            toggle(buttonElement, labelElement);
        });
    }

    return {
        ensureAfterStyleLoad,
        update,
        initToggleButton
    };
}
