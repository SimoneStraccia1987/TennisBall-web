/* Browser presentation only; gameplay input remains on Godot's canvas. */
(function () {
    'use strict';

    const shell = document.getElementById('game-shell');
    const viewport = document.getElementById('game-viewport');
    const canvas = document.getElementById('canvas');
    const toolbar = document.getElementById('display-toolbar');
    const button = document.getElementById('fullscreen-button');
    const label = document.getElementById('fullscreen-label');
    const help = document.getElementById('display-help');
    const message = document.getElementById('display-message');
    const instructions = document.getElementById('home-screen-instructions');
    const close = document.getElementById('display-help-close');
    const appModes = ['standalone', 'fullscreen', 'minimal-ui'].map(
        (mode) => window.matchMedia('(display-mode: ' + mode + ')'));
    let pending = false;
    let requestTimer;
    let resizeFrame;
    let restoreCanvasFocus = false;

    function fullscreenElement() {
        return document.fullscreenElement || document.webkitFullscreenElement;
    }

    function fullscreenApi() {
        if (typeof shell.requestFullscreen === 'function' && typeof document.exitFullscreen === 'function'
            && document.fullscreenEnabled !== false) {
            return { enter: () => shell.requestFullscreen({ navigationUI: 'hide' }), exit: () => document.exitFullscreen() };
        }
        if (typeof shell.webkitRequestFullscreen === 'function' && typeof document.webkitExitFullscreen === 'function'
            && document.webkitFullscreenEnabled !== false) {
            return { enter: () => shell.webkitRequestFullscreen(), exit: () => document.webkitExitFullscreen() };
        }
        return null;
    }

    function launchedAsApp() {
        return navigator.standalone === true || appModes.some((mode) => mode.matches);
    }

    function updateButton() {
        const active = Boolean(fullscreenElement());
        const supported = Boolean(fullscreenApi());
        // An installed app without game fullscreen already has no browser
        // toolbars. Remove the redundant App mode control and its entire row.
        const hideToolbar = launchedAsApp() && !supported && !active;
        const returnFocusToCanvas = hideToolbar
            && (toolbar.contains(document.activeElement) || help.contains(document.activeElement));
        if (toolbar.hidden !== hideToolbar) {
            toolbar.hidden = hideToolbar;
            scheduleResize();
        }
        if (hideToolbar) {
            if (returnFocusToCanvas) {
                canvas.focus({ preventScroll: true });
            }
            help.hidden = true;
        }
        label.textContent = active ? 'Exit fullscreen' : supported ? 'Fullscreen' : launchedAsApp() ? 'App mode' : 'Home Screen';
        button.title = active ? 'Exit fullscreen' : supported ? 'Enter fullscreen'
            : launchedAsApp() ? 'Home Screen app mode' : 'Play without browser toolbars: Home Screen instructions';
        button.setAttribute('aria-label', button.title);
        button.setAttribute('aria-pressed', String(active));
        button.setAttribute('aria-expanded', String(!help.hidden));
        button.disabled = pending;
    }

    function resizeCanvas() {
        resizeFrame = undefined;
        // VisualViewport follows mobile browser toolbars and the on-screen
        // keyboard. Rotation and fullscreen can change both layout and DPR.
        const visual = window.visualViewport;
        shell.style.setProperty('--viewport-width', (visual ? visual.width : window.innerWidth) + 'px');
        shell.style.setProperty('--viewport-height', (visual ? visual.height : window.innerHeight) + 'px');
        const bounds = viewport.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        const width = Math.max(1, Math.floor(bounds.width * ratio));
        const height = Math.max(1, Math.floor(bounds.height * ratio));
        // Changing these clears the drawing buffer, so only write on resize.
        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;
    }

    function scheduleResize() {
        if (resizeFrame === undefined) resizeFrame = window.requestAnimationFrame(resizeCanvas);
    }

    function showHelp(text, showInstructions) {
        message.textContent = text;
        instructions.hidden = !showInstructions;
        help.hidden = false;
        updateButton();
        scheduleResize();
    }

    function hideHelp() {
        help.hidden = true;
        updateButton();
        scheduleResize();
    }

    function finishRequest() {
        window.clearTimeout(requestTimer);
        pending = false;
        updateButton();
        scheduleResize();
        // Restore keyboard controls after a pointer tap; keyboard users keep
        // focus on the control so they can activate it again.
        if (help.hidden) (restoreCanvasFocus ? canvas : button).focus({ preventScroll: true });
    }

    function requestFailed() {
        finishRequest();
        showHelp(fullscreenElement()
            ? 'Could not exit fullscreen. Tap Exit fullscreen again or use your browser’s exit control.'
            : 'Fullscreen was not allowed. Tap Fullscreen to retry, or launch from the Home Screen.', !fullscreenElement());
    }

    button.addEventListener('click', function (event) {
        event.stopPropagation();
        if (pending) return;
        const api = fullscreenApi();
        if (!api) {
            if (!help.hidden) hideHelp();
            else showHelp(launchedAsApp() ? 'Already running as a Home Screen app. Use your device’s app switcher to leave.'
                : 'Game fullscreen is unavailable in this browser. Launch from the Home Screen to hide browser toolbars.', !launchedAsApp());
            return;
        }

        hideHelp();
        restoreCanvasFocus = event.detail > 0;
        pending = true;
        updateButton();
        try {
            // Call synchronously from the tap, before any await or timer:
            // fullscreen requires transient user activation.
            const result = fullscreenElement() ? api.exit() : api.enter();
            // Legacy WebKit may return void; its change/error events finish
            // the request. Recover if a browser silently ignores the call.
            requestTimer = window.setTimeout(() => {
                if (pending) requestFailed();
            }, 5000);
            if (result && typeof result.then === 'function') result.then(finishRequest, requestFailed);
        } catch (_) {
            requestFailed();
        }
    });

    close.addEventListener('click', function (event) {
        hideHelp();
        (event.detail > 0 ? canvas : button).focus({ preventScroll: true });
    });
    help.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            event.stopPropagation();
            hideHelp();
            button.focus({ preventScroll: true });
        }
    });

    // Scope propagation guards to the HTML controls, never the game surface.
    // Godot also listens for some input on window/document.
    for (const control of [toolbar, help]) {
        for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'keydown', 'keyup']) {
            control.addEventListener(type, (event) => event.stopPropagation());
        }
    }
    for (const type of ['fullscreenchange', 'webkitfullscreenchange']) {
        document.addEventListener(type, function () {
            hideHelp();
            finishRequest();
        });
    }
    for (const type of ['fullscreenerror', 'webkitfullscreenerror']) document.addEventListener(type, requestFailed);
    for (const type of ['resize', 'orientationchange', 'pageshow']) window.addEventListener(type, function () {
        updateButton();
        scheduleResize();
    });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', scheduleResize);
    if (window.screen.orientation && window.screen.orientation.addEventListener) {
        window.screen.orientation.addEventListener('change', scheduleResize);
    }
    if (typeof ResizeObserver === 'function') new ResizeObserver(scheduleResize).observe(viewport);
    for (const mode of appModes) {
        if (mode.addEventListener) mode.addEventListener('change', updateButton);
        else if (mode.addListener) mode.addListener(updateButton);
    }
    updateButton();
    resizeCanvas();
}());
