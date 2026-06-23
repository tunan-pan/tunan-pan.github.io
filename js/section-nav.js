// js/section-nav.js
(function () {
  const nav = document.querySelector(".section-nav");
  if (!nav) return;

  const dots = Array.from(nav.querySelectorAll(".section-nav__dot"));
  const panelItems = Array.from(nav.querySelectorAll(".section-nav__panel-item"));
  if (!dots.length) return;

  const sectionMap = dots
    .map((dot) => ({
      dot,
      panelItem: panelItems.find(
        (item) => item.dataset.panelSection === dot.dataset.section
      ),
      target: document.getElementById(dot.dataset.section),
    }))
    .filter((entry) => entry.target !== null);

  if (!sectionMap.length) return;

  let activeEntry = null;

  function setActive(entry) {
    if (entry === activeEntry) return;
    if (activeEntry) {
      activeEntry.dot.classList.remove("is-active");
      if (activeEntry.panelItem) activeEntry.panelItem.classList.remove("is-active");
    }
    entry.dot.classList.add("is-active");
    if (entry.panelItem) entry.panelItem.classList.add("is-active");
    activeEntry = entry;
  }

  const observer = new IntersectionObserver(
    () => {
      const closest = sectionMap.reduce((best, entry) => {
        const rect = entry.target.getBoundingClientRect();
        if (rect.top > window.innerHeight || rect.bottom < 0) return best;
        if (!best) return entry;
        const bestRect = best.target.getBoundingClientRect();
        return Math.abs(rect.top) < Math.abs(bestRect.top) ? entry : best;
      }, null);
      if (closest) setActive(closest);
    },
    { rootMargin: "-15% 0px -60% 0px", threshold: 0 }
  );

  sectionMap.forEach(({ target }) => observer.observe(target));

  // Click handler on both dots and panel items
  [...dots, ...panelItems].forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const id = el.dataset.section || el.dataset.panelSection;
      const entry = sectionMap.find((s) => s.target.id === id);
      if (entry) {
        entry.target.scrollIntoView({ behavior: "smooth", block: "start" });
        setActive(entry);
      }
    });
  });

  setActive(sectionMap[0]);
})();