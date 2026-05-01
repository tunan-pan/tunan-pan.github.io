document.addEventListener('DOMContentLoaded', () => {
  const svg        = document.getElementById('fox-static-svg');
  const highlightL = document.getElementById('highlight_left');
  const highlightR = document.getElementById('highlight_right');

  if (!svg || !highlightL || !highlightR) return; // bail if SVG isn't inlined
  
  // Grab the actual ellipse elements inside each highlight group
  const ellipseL = highlightL.querySelector('ellipse');
  const ellipseR = highlightR.querySelector('ellipse');

  // Centre of each eye in the SVG's own coordinate space
  const LEFT_EYE  = { x: 476.88, y: 368 };
  const RIGHT_EYE = { x: 625.48, y: 368 };

  // Asymmetric travel bounds (SVG units).
  // The highlights rest ~7 units left and ~11 units above the eye centres,
  // so we allow more travel right/down than left/up to stay inside the eye.
  const BOUNDS = { left: -4, right: 14, up: -2, down: 12 };

// Original ellipse radii (from the SVG source)
  const BASE_RX = 10.1;
  const BASE_RY = 7.38;
 
  // At maximum right/down offset, shrink to this size and make fully circular
  const MIN_R = 0.1;
 
  // Lerp state for position
  let lx = 0, ly = 0, rx = 0, ry = 0;
  let targetLx = 0, targetLy = 0, targetRx = 0, targetRy = 0;
 
  // Lerp state for radii
  let lrx = BASE_RX, lry = BASE_RY, rrx = BASE_RX, rry = BASE_RY;

  function getSVGPoint(clientX, clientY) {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  function eyeOffset(eyeCenter, cursor) {
    const dx   = cursor.x - eyeCenter.x;
    const dy   = cursor.y - eyeCenter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return { x: 0, y: 0 };

    const scale = Math.min(dist, 200) / 200;
    const ux = (dx / dist) * scale;
    const uy = (dy / dist) * scale;

    return {
      x: ux > 0 ? ux * BOUNDS.right : ux * Math.abs(BOUNDS.left),
      y: uy > 0 ? uy * BOUNDS.down  : uy * Math.abs(BOUNDS.up),
    };
  }


  // Given the current x/y offset, compute target rx and ry for the ellipse.
  // Rightward/downward movement drives the shape toward a small circle.
  function targetRadii(ox, oy) {
    const tx = Math.max(0, ox) / BOUNDS.right;  // 0–1
    const ty = Math.max(0, oy) / BOUNDS.down;   // 0–1
    const t  = Math.max(tx, ty);
 
    return {
      rx: BASE_RX + (MIN_R - BASE_RX) * t,
      ry: BASE_RY + (MIN_R - BASE_RY) * t,
    };
  }



  document.addEventListener('mousemove', (e) => {
    if (!window.FoxMotion.enabled) return; 
    const svgCursor = getSVGPoint(e.clientX, e.clientY);

    // If cursor is below the eyes, drift back to rest position
    if (svgCursor.y > 460) {
      targetLx = 0; targetLy = 0;
      targetRx = 0; targetRy = 0;
      return;
    }

    const ol = eyeOffset(LEFT_EYE,  svgCursor);
    const or = eyeOffset(RIGHT_EYE, svgCursor);
    targetLx = ol.x; targetLy = ol.y;
    targetRx = or.x; targetRy = or.y;
  });

  function animate() {

    // When motion is off, drift eyes back to centre
    if (!window.FoxMotion.enabled) {
      targetLx = 0; targetLy = 0;
      targetRx = 0; targetRy = 0;
    }

    const ease = 0.1;
    lx += (targetLx - lx) * ease;
    ly += (targetLy - ly) * ease;
    rx += (targetRx - rx) * ease;
    ry += (targetRy - ry) * ease;

    highlightL.setAttribute('transform', `translate(${lx.toFixed(3)}, ${ly.toFixed(3)})`);
    highlightR.setAttribute('transform', `translate(${rx.toFixed(3)}, ${ry.toFixed(3)})`);

    requestAnimationFrame(animate);
  }
  animate();


  window.addEventListener('foxmotion', e => {
    if (!e.detail.enabled) {
      // Snap targets to centre immediately
      targetLx = 0; targetLy = 0;
      targetRx = 0; targetRy = 0;
    }
  });


});