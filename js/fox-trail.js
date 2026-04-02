// fox-trail.js
// Rainbow pastel paint-reveal effect scoped to .fox-container.
// Requires fox-motion.js to be loaded first.

document.addEventListener('DOMContentLoaded', () => {

  const foxContainer = document.querySelector('.fox-container');
  if (!foxContainer) return;

  // If motion is off at load time, don't even set up the canvas
  if (!window.FoxMotion.enabled) return;

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
    canvas.width = rect.width;
    canvas.height = rect.height;
  }
  resize();
  window.addEventListener('resize', resize);

  // --- Config ---
  const RADIUS = 12;
  const STROKE_LIFE = 1200;
  const COLOR_SPEED = 0.0008;

  const PASTEL = [
    [255, 180, 180],
    [255, 210, 170],
    [255, 245, 170],
    [180, 240, 185],
    [170, 215, 255],
    [190, 180, 255],
    [230, 180, 255],
    [255, 180, 180],
  ];

  function getColor(t) {
    const scaled = (t % 1) * (PASTEL.length - 1);
    const i = Math.floor(scaled);
    const f = scaled - i;
    const a = PASTEL[i], b = PASTEL[i + 1];
    return [
      Math.round(a[0] + (b[0] - a[0]) * f),
      Math.round(a[1] + (b[1] - a[1]) * f),
      Math.round(a[2] + (b[2] - a[2]) * f),
    ];
  }

  // --- State ---
  const strokes = [];
  let mouseX = -999, mouseY = -999;
  let isInside = false;
  const startTime = performance.now();
  let lastStrokeX = null;
  let lastStrokeY = null;

  foxContainer.addEventListener('mouseenter', e => {
    isInside = true;
    const rect = foxContainer.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  foxContainer.addEventListener('mouseleave', () => {
    isInside = false;
    mouseX = -999; mouseY = -999;
    lastStrokeX = null; lastStrokeY = null;
  });

  window.addEventListener('mousemove', e => {
    if (!isInside) return;
    const rect = foxContainer.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  // Hide/show canvas when global motion toggle changes
  window.addEventListener('foxmotion', e => {
    canvas.style.display = e.detail.enabled ? '' : 'none';
    if (!e.detail.enabled) {
      // Clear any existing strokes
      strokes.length = 0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  });

  // --- Render loop ---
  function draw() {
    const now = performance.now();
    const t = (now - startTime) * COLOR_SPEED;

    if (isInside && mouseX > 0 && window.FoxMotion.enabled) {
      const [r, g, b] = getColor(t);
      const dx = mouseX - (lastStrokeX ?? mouseX);
      const dy = mouseY - (lastStrokeY ?? mouseY);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const step = RADIUS * 0.2; // fill in a point every 60% of radius,  reduce that multiplier for even denser fill
      const steps = Math.max(1, Math.ceil(dist / step));
      for (let i = 0; i < steps; i++) {
        const px = (lastStrokeX ?? mouseX) + (dx * i / steps);
        const py = (lastStrokeY ?? mouseY) + (dy * i / steps);
        strokes.push({ x: px, y: py, r, g, b, born: now });
      }
      lastStrokeX = mouseX;
      lastStrokeY = mouseY;
    }

    while (strokes.length && now - strokes[0].born > STROKE_LIFE) {
      strokes.shift();
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (window.FoxMotion.enabled) {
      for (const s of strokes) {
        const age = now - s.born;
        const life = Math.max(0, 1 - age / STROKE_LIFE);
        const opacity = life * life;

        const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, RADIUS);
        grd.addColorStop(0, `rgba(${s.r}, ${s.g}, ${s.b}, ${(0.9 * opacity).toFixed(3)})`);
        grd.addColorStop(0.45, `rgba(${s.r}, ${s.g}, ${s.b}, ${(0.55 * opacity).toFixed(3)})`);
        grd.addColorStop(0.85, `rgba(${s.r}, ${s.g}, ${s.b}, ${(0.08 * opacity).toFixed(3)})`);
        grd.addColorStop(1, `rgba(${s.r}, ${s.g}, ${s.b}, 0)`);

        ctx.beginPath();
        ctx.arc(s.x, s.y, RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }
    }

    requestAnimationFrame(draw);
  }

  draw();
});
