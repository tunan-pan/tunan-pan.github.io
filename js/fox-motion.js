// fox-motion.js
// Global motion preference shared across all fox scripts.
// Load this BEFORE fox-weather.js, fox-trail.js, and fox-animation.js.
//
// Any script can read:   window.FoxMotion.enabled
// Any script can listen: window.addEventListener('foxmotion', e => e.detail.enabled)

(function () {

  const STORAGE_KEY = 'fox-motion-enabled';

  // Honour prefers-reduced-motion as the default if no preference saved yet
  const systemDefault = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saved = sessionStorage.getItem(STORAGE_KEY);
  let _enabled = saved !== null ? saved === 'true' : systemDefault;

  window.FoxMotion = {
    get enabled() { return _enabled; },

    set(val) {
      _enabled = !!val;
      sessionStorage.setItem(STORAGE_KEY, _enabled);
      window.dispatchEvent(new CustomEvent('foxmotion', { detail: { enabled: _enabled } }));
    },
  };

})();
