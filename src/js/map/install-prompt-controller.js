const IOS_SNOOZE_KEY = "ios-hint-snoozed-until";
const SNOOZE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function isIosHintSnoozed() {
    try {
        const until = Number(localStorage.getItem(IOS_SNOOZE_KEY));
        return Number.isFinite(until) && Date.now() < until;
    } catch {
        return false;
    }
}

function snoozeIosHint() {
    try {
        localStorage.setItem(IOS_SNOOZE_KEY, String(Date.now() + SNOOZE_DURATION_MS));
    } catch {
        // localStorage unavailable (private browsing quota etc.) — silently continue
    }
}

export function createInstallPromptController({
    installBanner,
    installButton,
    installDismiss,
    menuInstallButton,
    menuInstallNote,
    iosBanner,
    iosDismiss
}) {
    let deferredInstallPrompt = null;

    async function requestInstall() {
        const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
        if (!deferredInstallPrompt) {
            if (isIos) {
                iosBanner.hidden = false;
                if (menuInstallNote) menuInstallNote.textContent = "In Safari, tap Share then Add to Home Screen to create your shortcut.";
            } else if (menuInstallNote) {
                menuInstallNote.textContent = "Installation is not available yet. Open this page in Chrome and try again shortly.";
            }
            return;
        }

        installBanner.hidden = true;
        await deferredInstallPrompt.prompt();
        deferredInstallPrompt = null;
    }

    function init() {
        const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const isInStandalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            navigator.standalone === true;

        if (isIos && !isInStandalone && !isIosHintSnoozed()) {
            iosBanner.hidden = false;
        }

        iosDismiss?.addEventListener("click", () => {
            iosBanner.hidden = true;
            snoozeIosHint();
        });

        window.addEventListener("beforeinstallprompt", (event) => {
            event.preventDefault();
            deferredInstallPrompt = event;
            installBanner.hidden = false;
            if (menuInstallNote) menuInstallNote.textContent = "Ready to install as a shortcut on your home screen.";
        });

        installButton?.addEventListener("click", requestInstall);
        menuInstallButton?.addEventListener("click", requestInstall);

        installDismiss?.addEventListener("click", () => {
            installBanner.hidden = true;
        });

        window.addEventListener("appinstalled", () => {
            installBanner.hidden = true;
            iosBanner.hidden = true;
            deferredInstallPrompt = null;
        });
    }

    return { init };
}
