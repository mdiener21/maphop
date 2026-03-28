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

    it("initializeSections applies the saved expanded state to panels", () => {
        const { controller, first, second } = makeController();

        controller.initializeSections();

        expect(first.panel.hidden).toBe(false);
        expect(second.panel.hidden).toBe(true);
    });

    it("setSectionExpanded updates the toggle and panel state", () => {
        const { controller, second } = makeController();

        controller.setSectionExpanded(second.toggle, true);

        expect(second.toggle.getAttribute("aria-expanded")).toBe("true");
        expect(second.panel.hidden).toBe(false);
    });

    it("returns safely when the toggle is missing or the panel cannot be found", () => {
        const { controller } = makeController();
        const orphanToggle = document.createElement("button");
        orphanToggle.setAttribute("aria-controls", "missing-panel");

        expect(() => controller.setSectionExpanded(null, true)).not.toThrow();
        expect(() => controller.setSectionExpanded(orphanToggle, true)).not.toThrow();
    });
});