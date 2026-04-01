// fox-trail.js
// Soft glow trail that follows the mouse inside the fox container area.
// Scoped to .fox-container so it doesn't run on the rest of the page.

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

  // --- Trail state ---
  const points   = [];
  const MAX_PTS  = 28;   // how many glow circles we keep
  const MAX_AGE  = 40;   // frames before a point fades out
  const RADIUS   = 22;   // max glow radius (px)

  let isInside = false;

  foxContainer.addEventListener('mouseenter', () => { isInside = true; });
  foxContainer.addEventListener('mouseleave', () => { isInside = false; });

  window.addEventListener('mousemove', e => {
    if (!isInside) return;

    const rect = foxContainer.getBoundingClientRect();
    points.push({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      age: 0
    });

    if (points.length > MAX_PTS) points.shift();
  });

  // --- Render loop ---
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < points.length; i++) {
      points[i].age++;

      // t: 0 = oldest visible point, 1 = newest
      const t     = i / Math.max(points.length - 1, 1);
      const alpha = t * 0.35;          // newest is most opaque
      const r     = 4 + (RADIUS - 4) * t; // newest is largest

      const grd = ctx.createRadialGradient(
        points[i].x, points[i].y, 0,
        points[i].x, points[i].y, r
      );
      // White core → light purple mid → transparent purple edge
      // Matches your --color-lightpurple (#E1D7FF) and --color-purple (#7C1D9E)
      grd.addColorStop(0,   `rgba(255, 255, 255, ${alpha})`);
      grd.addColorStop(0.4, `rgba(210, 180, 255, ${alpha * 0.7})`);
      grd.addColorStop(1,   `rgba(124, 29, 158, 0)`);

      ctx.beginPath();
      ctx.arc(points[i].x, points[i].y, r, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }

    // Evict old points
    while (points.length && points[0].age > MAX_AGE) {
      points.shift();
    }

    requestAnimationFrame(draw);
  }

  draw();
});
