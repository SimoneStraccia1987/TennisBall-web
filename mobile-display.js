/* Invisible viewport plumbing only. Godot owns presentation and input. */
(function () {
    'use strict';

    const shell = document.getElementById('game-shell');
    const viewport = document.getElementById('game-viewport');
    const canvas = document.getElementById('canvas');
    let resizeFrame;
    let dprQuery;

    // Register before the asynchronous engine download. Safari's Home Screen
    // view must know this surface owns gestures from the first touch, rather
    // than starting a browser scroll/zoom that cancels Godot's drag stream.
    // Do not stop propagation: the engine needs the original TouchEvent and
    // its identifiers, including simultaneous fingers and cancellation.
    for (const type of ['touchstart', 'touchmove', 'touchend', 'gesturestart', 'gesturechange']) {
        canvas.addEventListener(type, (event) => {
            if (event.cancelable) event.preventDefault();
        }, { capture: true, passive: false });
    }

    function resizeCanvas() {
        resizeFrame = undefined;
        // Follow browser toolbar/keyboard changes without reserving DOM UI or
        // safe-area margins. OS chrome remains outside the available viewport.
        const visual = window.visualViewport;
        shell.style.setProperty('--viewport-width', (visual ? visual.width : window.innerWidth) + 'px');
        shell.style.setProperty('--viewport-height', (visual ? visual.height : window.innerHeight) + 'px');
        const bounds = viewport.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        const width = Math.max(1, Math.floor(bounds.width * ratio));
        const height = Math.max(1, Math.floor(bounds.height * ratio));
        // Writing an unchanged backing size would clear the drawing buffer.
        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;
    }

    function scheduleResize() {
        if (resizeFrame === undefined) resizeFrame = window.requestAnimationFrame(resizeCanvas);
    }

    function watchPixelRatio() {
        if (dprQuery) dprQuery.removeEventListener('change', pixelRatioChanged);
        dprQuery = window.matchMedia('(resolution: ' + (window.devicePixelRatio || 1) + 'dppx)');
        dprQuery.addEventListener('change', pixelRatioChanged);
    }

    function pixelRatioChanged() {
        watchPixelRatio();
        scheduleResize();
    }

    for (const type of ['resize', 'orientationchange', 'pageshow']) window.addEventListener(type, scheduleResize);
    for (const type of ['fullscreenchange', 'webkitfullscreenchange']) document.addEventListener(type, scheduleResize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', scheduleResize);
    if (window.screen.orientation && window.screen.orientation.addEventListener) {
        window.screen.orientation.addEventListener('change', scheduleResize);
    }
    if (typeof ResizeObserver === 'function') new ResizeObserver(scheduleResize).observe(viewport);
    // Restore keyboard focus without consuming the gameplay pointer.
    canvas.addEventListener('pointerdown', () => canvas.focus({ preventScroll: true }));
    watchPixelRatio();
    resizeCanvas();
}());
