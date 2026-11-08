// Route Summary Sheet (#routeSummary): renders a calculated route, handles
// show/hide/dismiss, expand/collapse by tap or swipe (phones only), the point
// list, the Fit route / Edit / Clear actions, and publishes its live height.
// Route state, ORS requests and the duration choice stay in routing-controller.

const swipeThresholdPx = 30;
// A swipe also fires a click; ignore clicks this soon after one so it isn't read as a tap.
const swipeClickSuppressMs = 400;
const desktopMediaQuery = "(min-width: 700px)";

function createDesktopCheck() {
    if (typeof window.matchMedia !== "function") return () => false;
    const query = window.matchMedia(desktopMediaQuery);
    return () => query.matches;
}

function createPointItem({ type, label, location }) {
    const item = document.createElement("li");
    item.className = `route-summary-point route-summary-point-${type}`;
    item.dataset.pointType = type;
    const labelElement = document.createElement("span");
    labelElement.className = "route-summary-point-label";
    labelElement.textContent = label;
    const locationElement = document.createElement("span");
    locationElement.className = "route-summary-point-location";
    locationElement.textContent = location;
    item.append(labelElement, locationElement);
    return item;
}

/**
 * @param {object} options
 * @param {object} options.summary  Required sheet elements: root, profile, distance, duration,
 *   elevation, closeButton, toggle, header, points, fitButton, editButton, clearButton.
 * @param {() => void} [options.onFit]
 * @param {() => void} [options.onEdit]
 * @param {() => void} [options.onClear]
 */
export function createRouteSummarySheet({ summary, onFit = () => {}, onEdit = () => {}, onClear = () => {} }) {
    const isDesktop = createDesktopCheck();
    let swipeStartY = null;
    let lastSwipeAt = 0;
    let resizeObserver = null;

    function setExpanded(expanded) {
        summary.root.classList.toggle("is-expanded", expanded);
        summary.toggle.setAttribute("aria-expanded", String(expanded));
        summary.toggle.setAttribute("aria-label", expanded ? "Hide route details" : "Show route details");
    }

    function render({ profileLabel, icon, distance, duration, elevation, points }) {
        summary.root.dataset.profileIcon = icon;
        summary.profile.textContent = profileLabel;
        summary.distance.textContent = distance;
        summary.duration.textContent = duration;
        summary.elevation.textContent = elevation ?? "";
        summary.elevation.hidden = !elevation;
        summary.points.replaceChildren(...points.map(createPointItem));
    }

    /** Renders the route and shows the sheet; `collapsed` resets it for a new route. */
    function show(view, { collapsed = false } = {}) {
        render(view);
        if (collapsed) setExpanded(false);
        summary.root.hidden = false;
    }

    function hide() {
        summary.root.hidden = true;
    }

    // Publishes the sheet's live height as --route-summary-height (CSS lifts the
    // bottom map controls and install banner by it) and returns it.
    function publishHeight() {
        const height = summary.root.offsetHeight;
        summary.root.parentElement?.style.setProperty("--route-summary-height", `${height}px`);
        return height;
    }

    /** Height the sheet covers at the bottom of the map: 0 on desktop, where the card sits at the side. */
    function bottomInset() {
        const height = publishHeight();
        return isDesktop() ? 0 : height;
    }

    // Buttons inside the header (×) keep their own action.
    function isOtherButton(target) {
        const button = target.closest?.("button");
        return Boolean(button) && button !== summary.toggle;
    }

    // On desktop the toggle is hidden and the card is always expanded.
    function ignoresGesture(target) {
        return isDesktop() || isOtherButton(target);
    }

    function toggleExpanded(event) {
        if (Date.now() - lastSwipeAt < swipeClickSuppressMs || ignoresGesture(event.target)) return;
        setExpanded(summary.toggle.getAttribute("aria-expanded") !== "true");
    }

    function startSwipe(event) {
        if (ignoresGesture(event.target)) return;
        swipeStartY = event.clientY;
        lastSwipeAt = 0;
        // Keep receiving pointerup when the finger leaves the sheet mid-swipe.
        event.currentTarget.setPointerCapture?.(event.pointerId);
    }

    function endSwipe(event) {
        if (swipeStartY === null) return;
        const deltaY = event.clientY - swipeStartY;
        swipeStartY = null;
        if (Math.abs(deltaY) < swipeThresholdPx) return;
        lastSwipeAt = Date.now();
        setExpanded(deltaY < 0);
    }

    function cancelSwipe() {
        swipeStartY = null;
    }

    function destroy() {
        resizeObserver?.disconnect();
        resizeObserver = null;
    }

    summary.closeButton.addEventListener("click", hide);
    summary.fitButton.addEventListener("click", () => onFit());
    summary.editButton.addEventListener("click", () => onEdit());
    summary.clearButton.addEventListener("click", () => onClear());
    [summary.toggle, summary.header].forEach((element) => {
        element.addEventListener("click", toggleExpanded);
        element.addEventListener("pointerdown", startSwipe);
        element.addEventListener("pointerup", endSwipe);
        element.addEventListener("pointercancel", cancelSwipe);
    });
    if (typeof ResizeObserver === "function") {
        resizeObserver = new ResizeObserver(publishHeight);
        resizeObserver.observe(summary.root);
    }

    return { bottomInset, destroy, hide, show };
}
