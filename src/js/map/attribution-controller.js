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

export function createAttributionController({ attributionButton, attributionPanel, attributionText, baseMapConfigs }) {
    function setOpen(isOpen) {
        attributionPanel.hidden = !isOpen;
        attributionButton.setAttribute("aria-expanded", String(isOpen));
    }

    function toggle() {
        setOpen(attributionPanel.hidden);
    }

    function update(activeBaseLayerKey, terrainActive) {
        const config = baseMapConfigs[activeBaseLayerKey];
        attributionText.replaceChildren();
        appendTokens(attributionText, config.attribution);

        if (terrainActive) {
            attributionText.append(document.createTextNode(" · "));
            appendTokens(attributionText, terrainAttributionTokens);
        }
    }

    return {
        setOpen,
        toggle,
        update
    };
}