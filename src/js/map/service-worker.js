export function registerScopedServiceWorker() {
    if (!import.meta.env.PROD || !window.isSecureContext || !("serviceWorker" in navigator)) {
        return;
    }

    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/sw.js", { scope: "/" })
            .catch((error) => {
                console.error("Unable to register service worker.", error);
            });
    }, { once: true });
}