function copyPageURL(button) {
  const url = "https://tunan.art/a11y-toolkit";
  const tooltip = button.querySelector(".tooltip");
  const status = document.getElementById("copy-status");

  navigator.clipboard.writeText(url).then(() => {
    tooltip.textContent = tooltip.dataset.copied;
    tooltip.style.opacity = "1"; // force visible even without hover, so mouse-clickers see it too

    if (status) status.textContent = "Link copied to clipboard";

    setTimeout(() => {
      tooltip.textContent = tooltip.dataset.default;
      tooltip.style.opacity = ""; // hand control back to CSS hover/focus rules
    }, 1500);
  }).catch(err => {
    console.error("Copy failed:", err);
  });
}