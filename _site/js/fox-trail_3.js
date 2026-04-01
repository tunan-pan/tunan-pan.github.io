// fox-trail.js
// Reveals rainbow pastel colour as you move the mouse over the fox area.
// Strokes accumulate and fade slowly, like painting with light.

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
    const tmp = document.createElement('canvas');
    tmp.width = canvas.width;
    tmp.height = canvas.height;
    tmp.getContext('2d').drawImage(canvas, 0, 0);
    const rect = foxContainer.getBoundingClientRect();
    canvas.width  = rect.width;
    canvas.height = rect.height;
    ctx.drawImage(tmp, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // --- Config ---
  const RADIUS      = 28;     // brush size (px)
  const FADE_RATE   = 0.025;  // opacity erased per frame — higher = disappears faster, less ghost residue
  const COLOR_SPEED = 0.0008; // how fast colour cycles over time

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
  let mouseX   = -999, mouseY = -999;
  let isInside = false;
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
    const t = (performance.now() - startTime) * COLOR_SPEED;

    // Fade existing strokes using destination-out compositing
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = `rgba(0, 0, 0, ${FADE_RATE})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';

    // Paint glow at current mouse position
    if (isInside && mouseX > 0) {
      const [r, g, b] = getColor(t);

      // Tight falloff: stays opaque in the centre, drops cleanly to zero at the edge
      const grd = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, RADIUS);
      grd.addColorStop(0,    `rgba(${r}, ${g}, ${b}, 0.9)`);
      grd.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, 0.55)`);
      grd.addColorStop(0.9, `rgba(${r}, ${g}, ${b}, 0.15)`);
      grd.addColorStop(1,    `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.beginPath();
      ctx.arc(mouseX, mouseY, RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  draw();
});