export function createMenuController({ menuShell, layerMenuButton, menuCloseButton, menuSectionToggleElements }) {
    function setOpen(isOpen) {
        menuShell.classList.toggle("is-open", isOpen);
        layerMenuButton.setAttribute("aria-expanded", String(isOpen));
        layerMenuButton.setAttribute("aria-label", isOpen ? "Map controls are open" : "Open map controls");
        if (menuCloseButton) menuCloseButton.hidden = !isOpen;
    }

    function clearActiveSection() {
        menuShell.classList.remove("is-detail-open");
        menuSectionToggleElements.forEach((toggleElement) => {
            toggleElement.closest(".menu-group")?.classList.remove("is-active");
            toggleElement.removeAttribute("aria-label");
            const panelElement = document.getElementById(toggleElement.getAttribute("aria-controls"));
            if (panelElement) panelElement.hidden = true;
            toggleElement.setAttribute("aria-expanded", "false");
        });
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

        if (!isExpanded) {
            clearActiveSection();
            return;
        }

        menuSectionToggleElements.forEach((otherToggle) => {
            const otherPanel = document.getElementById(otherToggle.getAttribute("aria-controls"));
            otherPanel.hidden = otherToggle !== toggleElement;
            otherToggle.setAttribute("aria-expanded", String(otherToggle === toggleElement));
            otherToggle.closest(".menu-group")?.classList.toggle("is-active", otherToggle === toggleElement);
            if (otherToggle === toggleElement) otherToggle.setAttribute("aria-label", "Back to menu");
            else otherToggle.removeAttribute("aria-label");
        });
        menuShell.classList.add("is-detail-open");
        panelElement.hidden = false;
    }

    function toggle() {
        setOpen(!menuShell.classList.contains("is-open"));
    }

    function initializeSections() {
        clearActiveSection();
    }

    function close() {
        setOpen(false);
        clearActiveSection();
    }

    return {
        close,
        initializeSections,
        setOpen,
        setSectionExpanded,
        toggle
    };
}
