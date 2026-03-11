document.addEventListener("DOMContentLoaded", () => {
  let batchTimer = null;
  let batchIndex = 0;

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Reset batch index if enough time has passed since last trigger
        clearTimeout(batchTimer);
        batchTimer = setTimeout(() => { batchIndex = 0; }, 100);

        entry.target.style.setProperty('--i', batchIndex++);
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0
  });

  document.querySelectorAll(".fade-in > *").forEach(el => {
    observer.observe(el);
  });
});