// fox-trail.js
// Rainbow pastel glow trail with eased lag, scoped to .fox-container.

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
  const RADIUS  = 28;   // glow size — uniform across the whole trail
  const MAX_PTS = 48;   // more points = longer tail
  const EASE    = 0.08; // how quickly the trail catches the mouse (lower = more lag)

  // Pastel rainbow: red -> orange -> yellow -> green -> blue -> indigo -> violet
  const PASTEL_COLORS = [
    [255, 180, 180], // red
    [255, 210, 170], // orange
    [255, 245, 170], // yellow
    [180, 240, 185], // green
    [170, 215, 255], // blue
    [190, 180, 255], // indigo
    [230, 180, 255], // violet
  ];

  // Interpolate between two adjacent pastel stops
  function getPastelColor(t) {
    const scaled = t * (PASTEL_COLORS.length - 1);
    const i = Math.floor(scaled);
    const f = scaled - i;
    const a = PASTEL_COLORS[Math.min(i,     PASTEL_COLORS.length - 1)];
    const b = PASTEL_COLORS[Math.min(i + 1, PASTEL_COLORS.length - 1)];
    return [
      Math.round(a[0] + (b[0] - a[0]) * f),
      Math.round(a[1] + (b[1] - a[1]) * f),
      Math.round(a[2] + (b[2] - a[2]) * f),
    ];
  }

  // --- State ---
  const points  = [];
  let isInside  = false;
  let mouseX    = 0, mouseY    = 0; // raw mouse target
  let trailX    = 0, trailY    = 0; // eased trail position

  foxContainer.addEventListener('mouseenter', e => {
    isInside = true;
    // Snap trail to cursor on entry so it doesn't slide in from off-screen
    const rect = foxContainer.getBoundingClientRect();
    trailX = e.clientX - rect.left;
    trailY = e.clientY - rect.top;
    mouseX = trailX;
    mouseY = trailY;
  });

  foxContainer.addEventListener('mouseleave', () => {
    isInside = false;
    points.length = 0; // clear trail when mouse leaves
  });

  window.addEventListener('mousemove', e => {
    if (!isInside) return;
    const rect = foxContainer.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  // --- Render loop ---
  function draw() {
    if (isInside) {
      // Ease trail position toward mouse each frame
      trailX += (mouseX - trailX) * EASE;
      trailY += (mouseY - trailY) * EASE;

      points.push({ x: trailX, y: trailY });
      if (points.length > MAX_PTS) points.shift();
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < points.length; i++) {
      // t: 0 = oldest (tail end), 1 = newest (at cursor)
      const t     = i / Math.max(points.length - 1, 1);
      const alpha = t * 0.45; // uniform size, only opacity varies
      const [r, g, b] = getPastelColor(t);

      const grd = ctx.createRadialGradient(
        points[i].x, points[i].y, 0,
        points[i].x, points[i].y, RADIUS
      );
      grd.addColorStop(0,   `rgba(${r}, ${g}, ${b}, ${alpha})`);
      grd.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.5})`);
      grd.addColorStop(1,   `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.beginPath();
      ctx.arc(points[i].x, points[i].y, RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  draw();
});
