// Project tabs functionality
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.tab-note');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;

      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('tab-note--active'));
      contents.forEach(c => c.classList.remove('tab-content--active'));

      // Add active class to clicked tab and corresponding content
      tab.classList.add('tab-note--active');
      const targetContent = document.querySelector(`[data-content="${targetTab}"]`);
      if (targetContent) {
        targetContent.classList.add('tab-content--active');
      }
    });
  });
});