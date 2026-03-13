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


let leaveTimeouts = [];

stack.addEventListener('mouseenter', () => {
  leaveTimeouts.forEach(t => clearTimeout(t));
  leaveTimeouts = [];

  const top = stack.querySelector('.about-image:last-child');
  top.style.zIndex = '';
  top.style.transition = '';
  top.style.transform = ''; // clear frozen transform so CSS hover takes over
});

stack.addEventListener('mouseleave', () => {
  const top = stack.querySelector('.about-image:last-child');

  // Check how far through the transition we are by comparing current vs final transform
  const computedStyle = window.getComputedStyle(top);
  const currentTransform = computedStyle.transform;
  const transitionDuration = parseFloat(computedStyle.transitionDuration) * 1000;
  
  // Freeze card at current position so CSS :hover removal doesn't snap it
  top.style.transform = currentTransform;

  // Force a reflow so the frozen transform is applied
  top.offsetHeight;

  // Now transition back to rest from wherever it currently is
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
      });
    });
  }, 500));
});




let touchStartTime = 0;
const MIN_HOLD_MS = 300; // minimum time to show some animation

stack.addEventListener('touchstart', (e) => {
  e.preventDefault();
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

  // Wait long enough that some animation is always visible before reversing
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
        });
      });
    }, 500));
  }, delay));
});