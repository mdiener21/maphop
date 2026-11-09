import { terrainAttributionTokens } from "./base-map-registry.js";

function createAttributionNode(token) {
    if (token.type === "link") {
        const link = document.createElement("a");
        link.href = token.href;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = `${token.prefix || ""}${token.label}`;
        return link;
    }

    return document.createTextNode(token.value);
}

function appendTokens(container, tokens) {
    tokens.forEach((token, index) => {
        if (index > 0) {
            container.append(document.createTextNode(" · "));
        }

        container.append(createAttributionNode(token));
    });
}

export function createAttributionController({ attributionText, baseMapConfigs }) {
    function update(activeBaseLayerKey, terrainActive, searchPinVisible = false) {
        const config = baseMapConfigs[activeBaseLayerKey];
        attributionText.replaceChildren();
        appendTokens(attributionText, config.attribution);

        if (searchPinVisible) {
            attributionText.append(document.createTextNode(" · "));
            appendTokens(attributionText, [
                { type: "link", label: "openrouteservice", prefix: "Search by ", href: "https://openrouteservice.org/" },
                { type: "link", label: "OpenStreetMap contributors", prefix: "© ", href: "https://www.openstreetmap.org/copyright" }
            ]);
        }

        if (terrainActive) {
            attributionText.append(document.createTextNode(" · "));
            appendTokens(attributionText, terrainAttributionTokens);
        }
    }

    return {
        update
    };
}
