export function createMenuController({ menuShell, layerMenuButton, menuSectionToggleElements }) {
    function setOpen(isOpen) {
        menuShell.classList.toggle("is-open", isOpen);
        layerMenuButton.setAttribute("aria-expanded", String(isOpen));
    }

    function setSectionExpanded(toggleElement, isExpanded) {
        const panelId = toggleElement?.getAttribute("aria-controls");
        if (!panelId) {
            return;
        }

        const panelElement = document.getElementById(panelId);
        if (!panelElement) {
            return;
        }

        toggleElement.setAttribute("aria-expanded", String(isExpanded));
        panelElement.hidden = !isExpanded;
    }

    function toggle() {
        setOpen(!menuShell.classList.contains("is-open"));
    }

    function initializeSections() {
        menuSectionToggleElements.forEach((toggleElement) => {
            const isExpanded = toggleElement.getAttribute("aria-expanded") !== "false";
            setSectionExpanded(toggleElement, isExpanded);
        });
    }

    return {
        initializeSections,
        setOpen,
        setSectionExpanded,
        toggle
    };
}