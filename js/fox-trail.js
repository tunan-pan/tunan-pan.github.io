// fox-trail.js

document.addEventListener('DOMContentLoaded', () => {

  const foxContainer = document.querySelector('.fox-container');
  if (!foxContainer) return;

  if (!window.FoxMotion || !window.FoxMotion.enabled) return;

  // --- Config ---
  const GLYPHS = ['+', '*', '#', ':', '-', '+'];
  const GRID_SIZE = 12;
  const TRAIL_RADIUS = 48;
  const FADE_DURATION = 300;

  // Soft rainbow gradient (pastel colors)
  const GRADIENT_COLORS = [
    [255, 180, 180], // soft pink
    [255, 210, 170], // peach
    [255, 245, 170], // soft yellow
    [180, 240, 185], // mint green
    [170, 215, 255], // sky blue
    [190, 180, 255], // lavender
    [230, 180, 255], // light purple
  ];

  // Get color from gradient based on position (0-1)
  function getGradientColor(t) {
    const scaledT = t * (GRADIENT_COLORS.length - 1);
    const i = Math.floor(scaledT);
    const localT = scaledT - i;

    const c1 = GRADIENT_COLORS[i];
    const c2 = GRADIENT_COLORS[Math.min(i + 1, GRADIENT_COLORS.length - 1)];

    return [
      Math.round(c1[0] + (c2[0] - c1[0]) * localT),
      Math.round(c1[1] + (c2[1] - c1[1]) * localT),
      Math.round(c1[2] + (c2[2] - c1[2]) * localT),
    ];
  }

  // --- Grid ---
  let grid = [];
  let cols = 0;
  let rows = 0;

  // --- Canvas ---
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

  let W = 0, H = 0;

  function initGrid() {
    cols = Math.ceil(W / GRID_SIZE) + 1;
    rows = Math.ceil(H / GRID_SIZE) + 1;
    grid = [];

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        grid.push({
          x: x * GRID_SIZE,
          y: y * GRID_SIZE,
          char: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
          revealed: 0,
          opacity: 0, // Store the current opacity for this glyph
          colorT: 0, // Store the gradient position (0-1) for this glyph
        });
      }
    }
  }

  function resize() {
    const rect = foxContainer.getBoundingClientRect();
    W = canvas.width = rect.width;
    H = canvas.height = rect.height;
    initGrid();
  }

  resize();
  window.addEventListener('resize', resize);

  // --- Mouse + lag ---
  let mouseX = -999, mouseY = -999;
  let lagX = -999, lagY = -999;

  let lastMoveTime = 0;
  let isInside = false;

  const trail = [];
  const MAX_TRAIL_POINTS = 14;

  foxContainer.addEventListener('mouseenter', () => {
    isInside = true;
  });

  foxContainer.addEventListener('mouseleave', () => {
    isInside = false;
    trail.length = 0;
  });

  window.addEventListener('mousemove', e => {
    if (!isInside) return;

    const rect = foxContainer.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    lastMoveTime = performance.now();
  });

  // --- Reveal ---
  function revealGlyphs(now) {
    if (!isInside || !window.FoxMotion?.enabled) return;

    const timeSinceMove = now - lastMoveTime;
    const isMoving = timeSinceMove < 80;

    // lag
    lagX += (mouseX - lagX) * 0.2;
    lagY += (mouseY - lagY) * 0.2;

    if (isMoving) {
      trail.unshift({ x: lagX, y: lagY });
      if (trail.length > MAX_TRAIL_POINTS) trail.pop();
    }

    if (trail.length === 0) return;

    for (let i = 0; i < trail.length; i++) {
      const point = trail[i];

      // Trail position (0 = head, 1 = tail)
      const trailT = i / trail.length;
      
      // Exponential taper for tail - makes it shrink faster at the end
      const trailStrength = Math.pow(1 - trailT, 1.5);
      
      // Reduce radius at tail (makes the visible area smaller at the end)
      const effectiveRadius = TRAIL_RADIUS * (0.3 + trailStrength * 0.7);

      for (const glyph of grid) {
        const dx = glyph.x - point.x;
        const dy = glyph.y - point.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < effectiveRadius) {
          // Distance from center (0 = center, 1 = edge)
          const distT = dist / effectiveRadius;
          
          // Soft radial falloff - fades at edges
          const radialStrength = Math.pow(1 - distT, 2);
          
          // Combine trail position and radial falloff
          const strength = trailStrength * radialStrength;

          // Randomize character occasionally
          if (
            isMoving &&
            Math.random() < 0.1 * strength &&
            (glyph.revealed === 0 || Math.random() < 0.3)
          ) {
            glyph.char = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }

          // Store gradient position (0 = head/pink, 1 = tail/purple)
          glyph.colorT = trailT;

          // Store the maximum opacity for this glyph
          if (strength > glyph.opacity) {
            glyph.opacity = strength;
          }

          glyph.revealed = now - (1 - strength) * 200;
        }
      }
    }

    // decay trail when idle
    if (!isMoving) {
      trail.length = Math.max(0, trail.length - 1);
    }
  }

  // --- Draw ---
  function drawGlyphs(now) {
    ctx.clearRect(0, 0, W, H);
    if (!window.FoxMotion?.enabled) return;

    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const timeSinceMove = now - lastMoveTime;
    const idleFadeBoost = timeSinceMove > 80 ? 3 : 1;

    for (const glyph of grid) {
      if (glyph.revealed === 0) continue;

      const age = (now - glyph.revealed) * idleFadeBoost;

      let baseOpacity;
      if (age < FADE_DURATION) {
        baseOpacity = 1;
      } else {
        const fadeProgress = (age - FADE_DURATION) / 400;
        baseOpacity = Math.max(0, 1 - fadeProgress);

        if (baseOpacity <= 0) {
          glyph.revealed = 0;
          glyph.opacity = 0;
          continue;
        }
      }

      // Combine base opacity with stored strength (from trail position and radial falloff)
      
      // Boost the center - glyphs with high strength are fully opaque
      const finalOpacity = Math.min(1, baseOpacity * glyph.opacity * 1.3);
      
      // Get color from gradient based on stored position
      const [r, g, b] = getGradientColor(glyph.colorT);
 
      ctx.shadowBlur = 16 * glyph.opacity;
      ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${Math.min(1, finalOpacity * 1.2)})`;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${finalOpacity})`;
 
      ctx.fillText(glyph.char, glyph.x, glyph.y);
 
      ctx.shadowBlur = 0;
      
      // Decay stored opacity over time
      glyph.opacity *= 0.95;
    }
  }

  function animate() {
    const now = performance.now();

    revealGlyphs(now);
    drawGlyphs(now);

    requestAnimationFrame(animate);
  }

  animate();
});