document.addEventListener("DOMContentLoaded", () => {

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15
  });

    document.querySelectorAll(".fade-in > *").forEach((el, i) => {
    el.style.setProperty('--i', Math.max(i - 1, 0));
    observer.observe(el);
    });

});