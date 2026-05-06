document.addEventListener('DOMContentLoaded', () => {
  const svg        = document.getElementById('fox-static-svg');
  const highlightL = document.getElementById('highlight_left');
  const highlightR = document.getElementById('highlight_right');

  if (!svg || !highlightL || !highlightR) return; // bail if SVG isn't inlined
  
  // Grab the actual ellipse elements inside each highlight group
  const ellipseL = highlightL.querySelector('ellipse');
  const ellipseR = highlightR.querySelector('ellipse');

   // ── Head tilt setup ─────────────────────────────────────────────────────────
  const headGroup = document.getElementById('head');
  const faceGroup = document.getElementById('face');

  // Rotation origin: horizontal centre of the head, at its bottom (chin level).
  // Approximate from the SVG viewBox — head spans roughly x:365–740, y:115–480
  const HEAD_PIVOT = { x: 552, y: 480 };
  const MAX_TILT   = 3;   // degrees either side
  const TILT_EASE  = 0.06; // slightly slower than eyes for a natural lag

  let currentTilt = 0;
  let targetTilt  = 0;

function applyHeadTilt(deg) {
  // Move head down proportionally to how much it's tilted
  // Math.abs because it should dip regardless of left/right direction
  const dip = Math.abs(deg) * 0.4; // tweak the multiplier to taste

  const t = `translate(0, ${dip.toFixed(3)}) rotate(${deg.toFixed(3)}, ${HEAD_PIVOT.x}, ${HEAD_PIVOT.y})`;
  if (headGroup) headGroup.setAttribute('transform', t);
  if (faceGroup) faceGroup.setAttribute('transform', t);
}
  // ────────────────────────────────────────────────────────────────────────────


  // ── Ear wiggle setup ──────────────────────────────────────────────────────────
const earLeft  = document.getElementById('ear-left');
const earRight = document.getElementById('ear-right');

// Pivot points: bottom-centre of each ear where it meets the head
const EAR_PIVOT_L = { x: 450, y: 310 };
const EAR_PIVOT_R = { x: 655, y: 310 };

// How far each ear can rotate independently (degrees)
const EAR_MAX_TILT = 4;
const EAR_EASE     = 0.08; // slower = lazier/more organic feeling

let currentEarL = 0, targetEarL = 0;
let currentEarR = 0, targetEarR = 0;

// Random idle wiggle — ears twitch occasionally on their own
const EAR_WIGGLE_CHANCE = 0.003; // per frame — tweak this (0.001 = rare, 0.01 = frequent)
const EAR_WIGGLE_MAX    = 5;     // max degrees of random twitch

let earLWiggling = false;
let earRWiggling = false;
const EAR_WIGGLE_RETURN_DELAY = 400; // ms before snapping back — tweak this

// ─────────────────────────────────────────────────────────────────────────────


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


   // ── Detect whether the tail-wag animation is running ────────────────────────
  // FoxAnimator sets/removes 'is-animating' on .fox-container
  const foxContainer = document.querySelector('.fox-container');

  function isAnimating() {
    return foxContainer && foxContainer.classList.contains('is-animating');
  }
  // ────────────────────────────────────────────────────────────────────────────


  document.addEventListener('mousemove', (e) => {
    if (!window.FoxMotion.enabled) return; 
    const svgCursor = getSVGPoint(e.clientX, e.clientY);

     // ── Head tilt ──────────────────────────────────────────────────────────
    if (isAnimating()) {
      // Tail-wag is playing — smoothly return head to neutral
      targetTilt = 0;
    } else {
      // Map horizontal cursor position across the SVG width to ±MAX_TILT.
      // SVG viewBox width is 1093.09; we use the full width for a gentle range.
      const normalised = (svgCursor.x / 1093.09) * 2 - 1; // -1 (left) → +1 (right)

      // Also fade out tilt when cursor is below the fox's chest (mask area ~y > 500)
      // so the head returns to neutral as the hover-animation zone is approached.
      const verticalFade = svgCursor.y > 420
        ? Math.max(0, 1 - (svgCursor.y - 420) / 80)
        : 1;

      targetTilt = normalised * MAX_TILT * verticalFade;


      // Ears react to cursor — left ear tips toward cursor when it's on the left, etc.
      // They move opposite to each other slightly for a natural asymmetric look
      targetEarL = -normalised * EAR_MAX_TILT * 0.8 * verticalFade;  // left ear tips left when cursor is left
      targetEarR = -normalised * EAR_MAX_TILT * 0.6 * verticalFade; // right follows less strongly


    }
    // ──────────────────────────────────────────────────────────────────────

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

    // When motion is off, drift everything back to centre
    if (!window.FoxMotion.enabled) {
      targetLx = 0; targetLy = 0;
      targetRx = 0; targetRy = 0;
      targetTilt  = 0;
      targetEarL  = 0;
      targetEarR  = 0;
    }

    // Also snap tilt to 0 while the tail animation is running
    if (isAnimating()) targetTilt = 0;

    const ease = 0.1;
    lx += (targetLx - lx) * ease;
    ly += (targetLy - ly) * ease;
    rx += (targetRx - rx) * ease;
    ry += (targetRy - ry) * ease;

    highlightL.setAttribute('transform', `translate(${lx.toFixed(3)}, ${ly.toFixed(3)})`);
    highlightR.setAttribute('transform', `translate(${rx.toFixed(3)}, ${ry.toFixed(3)})`);


    // ── Head tilt lerp ────────────────────────────────────────────────────
    currentTilt += (targetTilt - currentTilt) * TILT_EASE;
    applyHeadTilt(currentTilt);
    // ─────────────────────────────────────────────────────────────────────

    // ── Ear wiggle lerp ───────────────────────────────────────────────────────
    if (!earLWiggling && Math.random() < EAR_WIGGLE_CHANCE) {
      earLWiggling = true;
      const twitch = (Math.random() - 0.5) * 2 * EAR_WIGGLE_MAX;
      targetEarL += twitch;
      setTimeout(() => {
        targetEarL -= twitch; // return to where it came from
        earLWiggling = false;
      }, EAR_WIGGLE_RETURN_DELAY);
    }
    if (!earRWiggling && Math.random() < EAR_WIGGLE_CHANCE) {
      earRWiggling = true;
      const twitch = (Math.random() - 0.5) * 2 * EAR_WIGGLE_MAX;
      targetEarR += twitch;
      setTimeout(() => {
        targetEarR -= twitch;
        earRWiggling = false;
      }, EAR_WIGGLE_RETURN_DELAY);
    }

    currentEarL += (targetEarL - currentEarL) * EAR_EASE;
    currentEarR += (targetEarR - currentEarR) * EAR_EASE;

    if (earLeft)  earLeft.setAttribute('transform',  `rotate(${currentEarL.toFixed(3)}, ${EAR_PIVOT_L.x}, ${EAR_PIVOT_L.y})`);
    if (earRight) earRight.setAttribute('transform', `rotate(${currentEarR.toFixed(3)}, ${EAR_PIVOT_R.x}, ${EAR_PIVOT_R.y})`);
    // ─────────────────────────────────────────────────────────────────────────

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