/*
 * KIT — shared JS helpers for "Drafted" and "Cut" prototypes.
 * Classic script: paste inline (defines window.KIT). No module system, no deps.
 * See README.md for usage.
 */
(function () {
  'use strict';

  var KIT = {};

  // --- tempo grid (internal only, never shown on the page) ---
  KIT.beat = 500; // ms, 120 BPM
  KIT.t = function (n) { return n * 4 * KIT.beat; };

  // --- clock / loop ---
  KIT.clock = function () { return performance.now(); };

  KIT.loop = function (fn, target) {
    target = target || document.body;
    var running = true, last = null, errored = false, raf;
    var io = new IntersectionObserver(function (entries) {
      running = entries[entries.length - 1].isIntersecting;
      if (running) last = null;
    });
    io.observe(target);
    function frame() {
      raf = requestAnimationFrame(frame);
      if (!running) return;
      var now = KIT.clock();
      if (last == null) last = now;
      // the raw frame time, so 120/144 Hz screens step at their real rate; a non-positive dt
      // (the first frame, or a clock that did not advance) counts as one 60 Hz frame
      var raw = (now - last) / 1000;
      var dt = raw > 0 ? Math.min(Math.max(raw, 0.001), 0.25) : 1 / 60;
      last = now;
      try {
        fn(dt);
      } catch (e) {
        if (!errored) {
          errored = true;
          console.log('[proto] frame-error: ' + e.message);
        }
      }
    }
    raf = requestAnimationFrame(frame);
    return function stop() { cancelAnimationFrame(raf); io.disconnect(); };
  };

  // --- reduced motion (live flag) ---
  var reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  KIT.reduced = reducedQuery.matches;
  reducedQuery.addEventListener('change', function (e) { KIT.reduced = e.matches; });

  // --- spring: tiny integrator, stepped with dt from KIT.loop/KIT.clock ---
  KIT.spring = function (from, to, opts) {
    opts = opts || {};
    var stiffness = opts.stiffness || 170;
    var damping = opts.damping || 26;
    var STEP = 1 / 240;
    return {
      value: from,
      velocity: 0,
      target: to,
      update: function (dt) {
        // fixed 1/240 s substeps keep the explicit integrator stable when frames are slow
        // (KIT.loop allows dt up to 0.25 s); a non-finite state snaps to the target
        for (var left = dt; left > 1e-9; left -= STEP) {
          var h = Math.min(STEP, left);
          var accel = (this.target - this.value) * stiffness - this.velocity * damping;
          this.velocity += accel * h;
          this.value += this.velocity * h;
        }
        if (!isFinite(this.value) || !isFinite(this.velocity)) { this.value = this.target; this.velocity = 0; }
      }
    };
  };

  // --- reveal: readable at rest, animates from a visible state ---
  KIT.reveal = function (el, opts) {
    el.classList.add('kit-reveal');
    if (KIT.reduced) {
      el.classList.add('is-in');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      var entry = entries[entries.length - 1];
      if (entry.isIntersecting) {
        el.classList.add('is-in');
        io.disconnect();
      }
    }, opts);
    io.observe(el);
  };

  // --- debug overlay, active only under #debug ---
  var debugOn = location.hash === '#debug';
  var debugEl = null;
  function ensureDebugEl() {
    if (debugEl) return debugEl;
    debugEl = document.createElement('div');
    debugEl.id = 'kit-debug';
    debugEl.style.cssText =
      'position:fixed;left:0;right:0;bottom:0;max-height:40vh;overflow:auto;' +
      'background:rgba(13,15,18,0.9);color:#F6F7F8;font:12px/1.4 "Martian Mono",monospace;' +
      'padding:8px;z-index:99999;white-space:pre-wrap;';
    document.body.appendChild(debugEl);
    return debugEl;
  }
  KIT.debug = function (line) {
    if (!debugOn) return;
    console.log('[proto] dbg', line);
    ensureDebugEl().textContent += line + '\n';
  };
  if (debugOn) {
    window.addEventListener('error', function (e) { KIT.debug('error: ' + e.message); });
    window.addEventListener('unhandledrejection', function (e) {
      var reason = e.reason && e.reason.message ? e.reason.message : e.reason;
      KIT.debug('unhandledrejection: ' + reason);
    });
  }

  // --- ready: logs exactly once ---
  var readyLogged = false;
  KIT.ready = function () {
    if (readyLogged) return;
    readyLogged = true;
    console.log('[proto] ready');
  };

  // --- drafting cursor: fine pointers only ---
  function initCursor() {
    if (!matchMedia('(pointer: fine)').matches) return;
    document.documentElement.classList.add('kit-cursor-on');
    var el = document.createElement('div');
    el.className = 'kit-cursor';
    el.innerHTML = '<div class="kit-cursor-mark"></div><div class="kit-cursor-coords"></div>';
    document.body.appendChild(el);
    var coordsEl = el.querySelector('.kit-cursor-coords');
    var sx = KIT.spring(0, 0, { stiffness: 320, damping: 28 });
    var sy = KIT.spring(0, 0, { stiffness: 320, damping: 28 });
    var tx = 0, ty = 0;

    window.addEventListener('pointermove', function (e) {
      tx = e.clientX;
      ty = e.clientY;
      sx.target = tx;
      sy.target = ty;
      var over = e.target.closest && e.target.closest('a, input, textarea, select, button, [contenteditable]');
      el.style.visibility = over ? 'hidden' : 'visible';
      coordsEl.textContent = 'x ' + String(Math.round(tx)).padStart(4, '0') +
        ' · y ' + String(Math.round(ty)).padStart(4, '0');
    });

    KIT.loop(function (dt) {
      if (KIT.reduced) {
        sx.value = tx;
        sy.value = ty;
      } else {
        sx.update(dt);
        sy.update(dt);
      }
      el.style.transform = 'translate(' + sx.value + 'px,' + sy.value + 'px)';
    });
  }

  if (document.body) {
    initCursor();
  } else {
    document.addEventListener('DOMContentLoaded', initCursor);
  }

  window.KIT = KIT;
})();
