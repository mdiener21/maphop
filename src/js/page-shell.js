import { version } from "../../package.json";

export function initializePageShell(pageTitle) {
    document.title = `${pageTitle} | Maphop`;

    document.querySelectorAll("[data-app-version]").forEach((element) => {
        element.textContent = `version ${version}`;
    });
}