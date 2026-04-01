// fox-trail.js
// Reveals rainbow pastel colour as you move the mouse over the fox area.
// Uses explicit stroke tracking instead of destination-out, so there's no ghost residue.

document.addEventListener('DOMContentLoaded', () => {

  const foxContainer = document.querySelector('.fox-container');
  if (!foxContainer) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // --- Canvas setup ---
  const canvas = document.createElement('canvas');
  canvas.style.cssText = `
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 3;
  `;
  foxContainer.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  function resize() {
    const rect = foxContainer.getBoundingClientRect();
    canvas.width  = rect.width;
    canvas.height = rect.height;
  }
  resize();
  window.addEventListener('resize', resize);

  // --- Config ---
  const RADIUS       = 28;    // brush size (px)
  const STROKE_LIFE  = 1000;  // how long each stroke lives in ms (lower = fades faster)
  const COLOR_SPEED  = 0.0008;

  // Pastel rainbow, looping back to red for a seamless cycle
  const PASTEL = [
    [255, 180, 180], // red
    [255, 210, 170], // orange
    [255, 245, 170], // yellow
    [180, 240, 185], // green
    [170, 215, 255], // blue
    [190, 180, 255], // indigo
    [230, 180, 255], // violet
    [255, 180, 180], // red again (seamless loop)
  ];

  function getColor(t) {
    const scaled = (t % 1) * (PASTEL.length - 1);
    const i = Math.floor(scaled);
    const f = scaled - i;
    const a = PASTEL[i];
    const b = PASTEL[i + 1];
    return [
      Math.round(a[0] + (b[0] - a[0]) * f),
      Math.round(a[1] + (b[1] - a[1]) * f),
      Math.round(a[2] + (b[2] - a[2]) * f),
    ];
  }

  // --- State ---
  // Each stroke: { x, y, r, g, b, born }
  const strokes = [];
  let mouseX    = -999, mouseY = -999;
  let isInside  = false;
  const startTime = performance.now();

  foxContainer.addEventListener('mouseenter', e => {
    isInside = true;
    const rect = foxContainer.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  foxContainer.addEventListener('mouseleave', () => {
    isInside = false;
    mouseX = -999;
    mouseY = -999;
  });

  window.addEventListener('mousemove', e => {
    if (!isInside) return;
    const rect = foxContainer.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  // --- Render loop ---
  function draw() {
    const now = performance.now();
    const t   = (now - startTime) * COLOR_SPEED;

    // Add a new stroke at mouse position
    if (isInside && mouseX > 0) {
      const [r, g, b] = getColor(t);
      strokes.push({ x: mouseX, y: mouseY, r, g, b, born: now });
    }

    // Evict fully faded strokes
    while (strokes.length && now - strokes[0].born > STROKE_LIFE) {
      strokes.shift();
    }

    // Redraw from scratch each frame — no residue possible
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const s of strokes) {
      const age     = now - s.born;
      const life    = Math.max(0, 1 - age / STROKE_LIFE); // 1 = fresh, 0 = gone
      // Ease out: full opacity quickly, then slow fade
      const opacity = life * life;

      const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, RADIUS);
      grd.addColorStop(0,    `rgba(${s.r}, ${s.g}, ${s.b}, ${0.9  * opacity})`);
      grd.addColorStop(0.45, `rgba(${s.r}, ${s.g}, ${s.b}, ${0.55 * opacity})`);
      grd.addColorStop(0.85, `rgba(${s.r}, ${s.g}, ${s.b}, ${0.08 * opacity})`);
      grd.addColorStop(1,    `rgba(${s.r}, ${s.g}, ${s.b}, 0)`);

      ctx.beginPath();
      ctx.arc(s.x, s.y, RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  draw();
});
