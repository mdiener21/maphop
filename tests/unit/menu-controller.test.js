import { beforeEach, describe, expect, it } from "vitest";
import { createMenuController } from "../../src/js/map/menu-controller.js";

function makeSectionToggle(id, expanded = "true") {
    const toggle = document.createElement("button");
    toggle.setAttribute("aria-controls", `${id}-panel`);
    toggle.setAttribute("aria-expanded", expanded);

    const panel = document.createElement("div");
    panel.id = `${id}-panel`;

    document.body.append(toggle, panel);

    return { toggle, panel };
}

function makeController() {
    const menuShell = document.createElement("section");
    const layerMenuButton = document.createElement("button");
    const first = makeSectionToggle("favorites", "true");
    const second = makeSectionToggle("maps", "false");

    const controller = createMenuController({
        menuShell,
        layerMenuButton,
        menuSectionToggleElements: [first.toggle, second.toggle]
    });

    return { controller, menuShell, layerMenuButton, first, second };
}

beforeEach(() => {
    document.body.replaceChildren();
});

describe("createMenuController", () => {
    it("setOpen syncs the shell class and button aria state", () => {
        const { controller, menuShell, layerMenuButton } = makeController();

        controller.setOpen(true);
        expect(menuShell.classList.contains("is-open")).toBe(true);
        expect(layerMenuButton.getAttribute("aria-expanded")).toBe("true");

        controller.setOpen(false);
        expect(menuShell.classList.contains("is-open")).toBe(false);
        expect(layerMenuButton.getAttribute("aria-expanded")).toBe("false");
    });

    it("toggle flips the current menu state", () => {
        const { controller, menuShell, layerMenuButton } = makeController();

        controller.toggle();
        expect(menuShell.classList.contains("is-open")).toBe(true);
        expect(layerMenuButton.getAttribute("aria-expanded")).toBe("true");

        controller.toggle();
        expect(menuShell.classList.contains("is-open")).toBe(false);
        expect(layerMenuButton.getAttribute("aria-expanded")).toBe("false");
    });

    it("initializeSections starts with every full-screen category closed", () => {
        const { controller, first, second } = makeController();

        controller.initializeSections();

        expect(first.panel.hidden).toBe(true);
        expect(second.panel.hidden).toBe(true);
    });

    it("setSectionExpanded updates the toggle and panel state", () => {
        const { controller, menuShell, first, second } = makeController();

        controller.setSectionExpanded(second.toggle, true);

        expect(second.toggle.getAttribute("aria-expanded")).toBe("true");
        expect(second.panel.hidden).toBe(false);
        expect(first.panel.hidden).toBe(true);
        expect(menuShell.classList.contains("is-detail-open")).toBe(true);
    });

    it("hides closed controls and restores focus through back and Escape navigation", () => {
        document.body.innerHTML = `
            <section id="shell">
                <button id="opener"></button>
                <button id="menuBackButton" hidden>All controls</button>
                <h1 id="menuTitle">Explore the map</h1>
                <button id="close" hidden>Close</button>
                <div class="menu-content" hidden>
                    <div class="menu-group">
                        <button id="maps" aria-controls="maps-panel"><span class="menu-group-title">Map style</span></button>
                        <div id="maps-panel"></div>
                    </div>
                </div>
            </section>`;
        const shell = document.getElementById("shell");
        const opener = document.getElementById("opener");
        const maps = document.getElementById("maps");
        const content = shell.querySelector(".menu-content");
        const controller = createMenuController({
            menuShell: shell, layerMenuButton: opener,
            menuCloseButton: document.getElementById("close"), menuSectionToggleElements: [maps]
        });
        controller.initializeSections();
        opener.focus();
        controller.setOpen(true);
        expect(content.hidden).toBe(false);
        controller.setSectionExpanded(maps, true);
        expect(document.getElementById("menuTitle").textContent).toBe("Map style");
        expect(document.activeElement.id).toBe("menuBackButton");
        shell.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        expect(document.activeElement).toBe(maps);
        expect(shell.classList.contains("is-open")).toBe(true);
        shell.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        expect(content.hidden).toBe(true);
        expect(document.activeElement).toBe(opener);
    });

    it("returns safely when the toggle is missing or the panel cannot be found", () => {
        const { controller } = makeController();
        const orphanToggle = document.createElement("button");
        orphanToggle.setAttribute("aria-controls", "missing-panel");

        expect(() => controller.setSectionExpanded(null, true)).not.toThrow();
        expect(() => controller.setSectionExpanded(orphanToggle, true)).not.toThrow();
    });
});
