import { afterEach, describe, expect, it, vi } from "vitest";
import { createRouteSummarySheet } from "../../src/js/map/route-summary-sheet.js";

function makeSummary() {
    const root = document.createElement("section");
    root.hidden = true;
    root.innerHTML = `<button class="toggle"></button><div class="header"><span class="profile"></span><strong></strong><span class="duration"></span><button class="close"></button></div><p hidden></p><ol></ol><button class="fit"></button><button class="edit"></button><button class="clear"></button>`;
    document.body.append(root);
    const find = (selector) => root.querySelector(selector);
    return {
        root, profile: find(".profile"), distance: find("strong"), duration: find(".duration"), elevation: find("p"),
        closeButton: find(".close"), toggle: find(".toggle"), header: find(".header"), points: find("ol"),
        fitButton: find(".fit"), editButton: find(".edit"), clearButton: find(".clear")
    };
}

describe("route summary sheet", () => {
    afterEach(() => { vi.unstubAllGlobals(); document.body.replaceChildren(); });

    it("stops observing its size after destroy()", () => {
        const observer = { observe: vi.fn(), disconnect: vi.fn() };
        vi.stubGlobal("ResizeObserver", vi.fn(function ResizeObserver() { return observer; }));
        const summary = makeSummary();

        const sheet = createRouteSummarySheet({ summary });
        expect(observer.observe).toHaveBeenCalledWith(summary.root);

        sheet.destroy();
        expect(observer.disconnect).toHaveBeenCalledOnce();
    });
});
