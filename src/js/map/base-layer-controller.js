const baseStyleLoadTimeoutMs = 12000;

function applyBaseStyle(map, style) {
    return new Promise((resolve, reject) => {
        let settled = false;

        const cleanup = () => {
            window.clearTimeout(timeoutId);
            map.off("style.load", onStyleLoad);
            map.off("error", onError);
        };

        const onStyleLoad = () => {
            if (settled) {
                return;
            }

            settled = true;
            cleanup();
            resolve();
        };

        const onError = (event) => {
            if (settled) {
                return;
            }

            settled = true;
            cleanup();
            reject(event?.error || new Error("Map style failed to load."));
        };

        const timeoutId = window.setTimeout(() => {
            if (settled) {
                return;
            }

            settled = true;
            cleanup();
            reject(new Error("Timed out loading the selected base map."));
        }, baseStyleLoadTimeoutMs);

        map.on("style.load", onStyleLoad);
        map.on("error", onError);
        map.setStyle(style);
    });
}

export function createBaseLayerController({
    map,
    baseMapConfigs,
    layerMenuButton,
    layerOptionElements,
    initialActiveKey,
    onStatus,
    onStyleReady,
    onActiveLayerChanged,
    onMenuClose
}) {
    let activeBaseLayerKey = initialActiveKey;

    function updateLayerOptionState(activeKey = activeBaseLayerKey) {
        layerOptionElements.forEach((element) => {
            const isActive = element.dataset.layerKey === activeKey;
            element.dataset.active = String(isActive);
            element.setAttribute("aria-checked", String(isActive));
        });
    }

    async function setBaseLayer(key) {
        if (!baseMapConfigs[key] || key === activeBaseLayerKey) {
            onMenuClose();
            return;
        }

        const previousBaseLayerKey = activeBaseLayerKey;
        layerMenuButton.disabled = true;

        try {
            await applyBaseStyle(map, baseMapConfigs[key].style);
            onStyleReady();
            activeBaseLayerKey = key;
            updateLayerOptionState(key);
            onActiveLayerChanged(activeBaseLayerKey);
            onMenuClose();
            onStatus("Base map switched to " + baseMapConfigs[key].label + ".");
        } catch (error) {
            try {
                await applyBaseStyle(map, baseMapConfigs[previousBaseLayerKey].style);
                onStyleReady();
            } catch (restoreError) {
                console.error("Unable to restore the previous base map.", restoreError);
            }

            updateLayerOptionState(activeBaseLayerKey);
            onStatus("Unable to load " + baseMapConfigs[key].label + ".");
            console.error(error);
        } finally {
            layerMenuButton.disabled = false;
        }
    }

    return {
        get activeKey() {
            return activeBaseLayerKey;
        },
        setBaseLayer,
        updateLayerOptionState
    };
}