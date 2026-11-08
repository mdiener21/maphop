export function createMenuController({ menuShell, layerMenuButton, menuCloseButton, menuSectionToggleElements }) {
    const content = menuShell.querySelector(".menu-content");
    const backButton = menuShell.querySelector("#menuBackButton");
    const title = menuShell.querySelector("#menuTitle");
    let activeToggle = null;

    function setOpen(isOpen) {
        const focusWasInside = menuShell.contains(document.activeElement);
        if (content) content.hidden = !isOpen;
        menuShell.classList.toggle("is-open", isOpen);
        layerMenuButton.setAttribute("aria-expanded", String(isOpen));
        layerMenuButton.setAttribute("aria-label", isOpen ? "Map controls are open" : "Open map controls");
        if (menuCloseButton) menuCloseButton.hidden = !isOpen;
        if (backButton) backButton.hidden = !isOpen || !activeToggle;
        if (isOpen) (backButton && activeToggle ? backButton : menuCloseButton)?.focus();
        else if (focusWasInside) layerMenuButton.focus();
    }

    function clearActiveSection() {
        activeToggle = null;
        if (backButton) backButton.hidden = true;
        if (title) title.textContent = "Explore the map";
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
            back();
            return;
        }

        menuSectionToggleElements.forEach((otherToggle) => {
            const otherPanel = document.getElementById(otherToggle.getAttribute("aria-controls"));
            if (otherPanel) otherPanel.hidden = otherToggle !== toggleElement;
            otherToggle.setAttribute("aria-expanded", String(otherToggle === toggleElement));
            otherToggle.closest(".menu-group")?.classList.toggle("is-active", otherToggle === toggleElement);
        });
        activeToggle = toggleElement;
        if (title) title.textContent = toggleElement.querySelector(".menu-group-title")?.textContent ?? "Map controls";
        if (backButton) {
            backButton.hidden = false;
            backButton.focus();
        }
        if (content) content.scrollTop = 0;
        menuShell.classList.add("is-detail-open");
        panelElement.hidden = false;
    }

    function back() {
        const previousToggle = activeToggle;
        clearActiveSection();
        previousToggle?.focus();
    }

    backButton?.addEventListener("click", (event) => {
        event.stopPropagation();
        back();
    });

    menuShell.addEventListener("keydown", (event) => {
        if (event.key !== "Escape" || !menuShell.classList.contains("is-open")) return;
        event.preventDefault();
        event.stopPropagation();
        if (activeToggle) back();
        else close();
    });

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
