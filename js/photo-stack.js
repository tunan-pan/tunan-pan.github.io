const stack = document.getElementById('photo-stack');

const rotations = [
  'rotate(-3deg)',
  'rotate(4deg)',
  'rotate(-7deg)',
  'rotate(6deg)',
  'rotate(-5deg)',
  'rotate(3deg)',
];

function applyRotations() {
  const cards = stack.querySelectorAll('.about-image');
  cards.forEach((card, i) => {
    card.style.zIndex = i;
  });
}

// Assign a fixed rotation to each card once, permanently
stack.querySelectorAll('.about-image').forEach((card, i) => {
  card.dataset.rotation = rotations[i % rotations.length];
  card.style.transform = card.dataset.rotation;
});

applyRotations();

// ✨ NEW: Periodic jiggle animation
let jiggleInterval;
let isUserInteracting = false;
let hasBeenHovered = false; // NEW: track if user has discovered the interaction

function jiggleStack() {
  console.log('Jiggle triggered!', isUserInteracting);
  if (isUserInteracting || hasBeenHovered) return; // Don't jiggle if already discovered
  
  const cards = stack.querySelectorAll('.about-image');
  
  // Add smooth transition for the jiggle
  cards.forEach(card => {
    card.style.transition = 'transform 0.1s ease-in-out';
  });
  
  // Extract base rotations once
  const baseRotations = Array.from(cards).map(card => {
    const match = card.dataset.rotation.match(/-?\d+/);
    return match ? parseInt(match[0]) : 0;
  });
  
  // Jiggle sequence: left, right, left, right, back to center
  const jiggleSequence = [
    { offset: -2, delay: 0 },
    { offset: 2, delay: 100 },
    { offset: -1, delay: 200 },
    { offset: 1, delay: 300 },
    { offset: 0, delay: 400 }
  ];
  
  jiggleSequence.forEach(({ offset, delay }) => {
    setTimeout(() => {
      if (!isUserInteracting && !hasBeenHovered) {
        cards.forEach((card, i) => {
          card.style.transform = `rotate(${baseRotations[i] + offset}deg)`;
        });
      }
    }, delay);
  });
}

// Trigger jiggle every 8-12 seconds (randomized for natural feel)
function scheduleNextJiggle() {
  if (hasBeenHovered) return; // Stop scheduling if already discovered
  
  const delay = 8000 + Math.random() * 4000;
  jiggleInterval = setTimeout(() => {
    jiggleStack();
    scheduleNextJiggle();
  }, delay);
}

// Start after initial page load delay
setTimeout(() => {
  scheduleNextJiggle();
}, 1000);

let leaveTimeouts = [];

stack.addEventListener('mouseenter', () => {
  hasBeenHovered = true; // Mark as discovered
  isUserInteracting = true;
  clearTimeout(jiggleInterval);
  
  leaveTimeouts.forEach(t => clearTimeout(t));
  leaveTimeouts = [];

  const top = stack.querySelector('.about-image:last-child');
  top.style.zIndex = '';
  top.style.transition = '';
  top.style.transform = '';
});

stack.addEventListener('mouseleave', () => {
  const top = stack.querySelector('.about-image:last-child');

  const computedStyle = window.getComputedStyle(top);
  const currentTransform = computedStyle.transform;
  const transitionDuration = parseFloat(computedStyle.transitionDuration) * 1000;
  
  top.style.transform = currentTransform;
  top.offsetHeight;

  top.style.transition = 'transform 0.5s ease-in-out';
  top.style.transform = top.dataset.rotation;

  leaveTimeouts.push(setTimeout(() => {
    top.style.zIndex = '-1';
  }, 250));

  leaveTimeouts.push(setTimeout(() => {
    top.style.zIndex = '';
    top.style.transition = 'none';
    stack.prepend(top);

    stack.querySelectorAll('.about-image').forEach(card => {
      card.style.transition = 'none';
      card.style.transform = card.dataset.rotation;
    });

    applyRotations();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        stack.querySelectorAll('.about-image').forEach(card => {
          card.style.transition = '';
        });
        
        isUserInteracting = false;
        scheduleNextJiggle(); // Resume jiggle after interaction
      });
    });
  }, 500));
});

let touchStartTime = 0;
const MIN_HOLD_MS = 300;

stack.addEventListener('touchstart', (e) => {
  e.preventDefault();
  hasBeenHovered = true; // Mark as discovered on touch too
  isUserInteracting = true;
  clearTimeout(jiggleInterval);
  
  // rest of touchstart code stays the same...
  
  touchStartTime = Date.now();
  
  leaveTimeouts.forEach(t => clearTimeout(t));
  leaveTimeouts = [];

  const top = stack.querySelector('.about-image:last-child');
  top.style.zIndex = '';
  top.style.transition = '';
  top.style.transform = '';

  stack.classList.add('is-hovered');
}, { passive: false });

stack.addEventListener('touchend', () => {
  const holdDuration = Date.now() - touchStartTime;
  const delay = Math.max(0, MIN_HOLD_MS - holdDuration);

  leaveTimeouts.push(setTimeout(() => {
    stack.classList.remove('is-hovered');

    const top = stack.querySelector('.about-image:last-child');
    const currentTransform = window.getComputedStyle(top).transform;
    top.style.transform = currentTransform;
    top.offsetHeight;

    top.style.transition = 'transform 0.5s ease-in-out';
    top.style.transform = top.dataset.rotation;

    leaveTimeouts.push(setTimeout(() => {
      top.style.zIndex = '-1';
    }, 250));

    leaveTimeouts.push(setTimeout(() => {
      top.style.zIndex = '';
      top.style.transition = 'none';
      stack.prepend(top);

      stack.querySelectorAll('.about-image').forEach(card => {
        card.style.transition = 'none';
        card.style.transform = card.dataset.rotation;
      });

      applyRotations();

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          stack.querySelectorAll('.about-image').forEach(card => {
            card.style.transition = '';
          });
          
          isUserInteracting = false;
          scheduleNextJiggle();
        });
      });
    }, 500));
  }, delay));
});