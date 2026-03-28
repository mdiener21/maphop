export function createStatusToast(statusElement) {
    let statusTimeoutId = null;

    return function setStatus(message) {
        statusElement.textContent = message;
        statusElement.classList.add("is-visible");
        window.clearTimeout(statusTimeoutId);
        statusTimeoutId = window.setTimeout(() => {
            statusElement.classList.remove("is-visible");
        }, 2800);
    };
}