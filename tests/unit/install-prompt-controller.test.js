import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInstallPromptController } from "../../src/js/map/install-prompt-controller.js";

function makeController() {
    const installBanner = document.createElement("div");
    const installButton = document.createElement("button");
    const installDismiss = document.createElement("button");
    const iosBanner = document.createElement("div");
    const iosDismiss = document.createElement("button");

    installBanner.hidden = true;
    iosBanner.hidden = true;

    const controller = createInstallPromptController({
        installBanner,
        installButton,
        installDismiss,
        iosBanner,
        iosDismiss
    });

    return { controller, installBanner, installButton, installDismiss, iosBanner, iosDismiss };
}

function dispatchWindowEvent(event) {
    window.dispatchEvent(event);
}

beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    Object.defineProperty(window.navigator, "userAgent", {
        value: "Mozilla/5.0 (X11; Linux x86_64)",
        configurable: true
    });
    Object.defineProperty(window.navigator, "standalone", {
        value: false,
        configurable: true
    });
    document.body.replaceChildren();
});

describe("createInstallPromptController", () => {
    it("shows the iOS hint when running on iOS outside standalone mode", () => {
        Object.defineProperty(window.navigator, "userAgent", {
            value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
            configurable: true
        });

        const { controller, iosBanner } = makeController();
        controller.init();

        expect(iosBanner.hidden).toBe(false);
    });

    it("dismissing the iOS hint hides it and stores a snooze timestamp", () => {
        Object.defineProperty(window.navigator, "userAgent", {
            value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
            configurable: true
        });

        const { controller, iosBanner, iosDismiss } = makeController();
        controller.init();
        iosDismiss.click();

        expect(iosBanner.hidden).toBe(true);
        expect(Number(localStorage.getItem("ios-hint-snoozed-until"))).toBeGreaterThan(Date.now());
    });

    it("shows the install banner when beforeinstallprompt fires and prompts on install", async () => {
        const { controller, installBanner, installButton } = makeController();
        controller.init();

        const event = new Event("beforeinstallprompt");
        event.preventDefault = vi.fn();
        event.prompt = vi.fn().mockResolvedValue(undefined);

        dispatchWindowEvent(event);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(installBanner.hidden).toBe(false);

        installButton.click();
        await Promise.resolve();

        expect(event.prompt).toHaveBeenCalledOnce();
        expect(installBanner.hidden).toBe(true);
    });

    it("dismisses the install banner without prompting", () => {
        const { controller, installBanner, installDismiss } = makeController();
        controller.init();

        const event = new Event("beforeinstallprompt");
        event.preventDefault = vi.fn();
        event.prompt = vi.fn();

        dispatchWindowEvent(event);
        installDismiss.click();

        expect(installBanner.hidden).toBe(true);
        expect(event.prompt).not.toHaveBeenCalled();
    });

    it("hides both banners when appinstalled fires", () => {
        Object.defineProperty(window.navigator, "userAgent", {
            value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
            configurable: true
        });

        const { controller, installBanner, iosBanner } = makeController();
        controller.init();

        const event = new Event("beforeinstallprompt");
        event.preventDefault = vi.fn();
        event.prompt = vi.fn();
        dispatchWindowEvent(event);

        expect(installBanner.hidden).toBe(false);
        expect(iosBanner.hidden).toBe(false);

        dispatchWindowEvent(new Event("appinstalled"));

        expect(installBanner.hidden).toBe(true);
        expect(iosBanner.hidden).toBe(true);
    });
});