import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath) {
    return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("Settings login security", () => {
    it("restricts Settings form submissions to this origin", () => {
        const settingsHtml = readProjectFile("src/settings.html");

        expect(settingsHtml).toContain("form-action 'self'");
    });

    it("clears the PocketBase password and disables auth controls during login", () => {
        const settingsJs = readProjectFile("src/js/settings.js");

        expect(settingsJs).toContain("setPocketBaseAuthBusy(true)");
        expect(settingsJs).toContain("setPocketBaseAuthBusy(false)");
        expect(settingsJs).toContain('pocketBasePasswordInput.value = ""');
        expect(settingsJs).toContain("} catch {");
        expect(settingsJs).toContain("PocketBase authentication failed.");
    });
});
