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




// Store project context when clicking a project card
document.addEventListener('DOMContentLoaded', () => {
  const projectLinks = document.querySelectorAll('.project-card a');
  
  projectLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // Find which tab is currently active
      const activeTab = document.querySelector('.tab-note--active');
      if (activeTab) {
        const tabId = activeTab.dataset.tab;
        // Store the active tab in sessionStorage
        sessionStorage.setItem('activeProjectTab', tabId);
        
        // Store scroll position relative to projects section
        const projectsSection = document.getElementById('projects-section');
        if (projectsSection) {
          const sectionTop = projectsSection.offsetTop;
          const scrollPosition = window.scrollY - sectionTop;
          sessionStorage.setItem('projectsScrollPosition', scrollPosition);
        }
      }
    });
  });
  
  // Restore tab and scroll position when returning from a project page
  const urlHash = window.location.hash;
  if (urlHash === '#projects-section') {
    const savedTab = sessionStorage.getItem('activeProjectTab');
    const savedScroll = sessionStorage.getItem('projectsScrollPosition');
    
    if (savedTab) {
      // Find and click the saved tab
      const tabButton = document.querySelector(`[data-tab="${savedTab}"]`);
      if (tabButton && !tabButton.classList.contains('tab-note--active')) {
        tabButton.click();
      }
      
      // Wait for tab content to render, then scroll
      setTimeout(() => {
        const projectsSection = document.getElementById('projects-section');
        if (projectsSection && savedScroll) {
          const targetScroll = projectsSection.offsetTop + parseInt(savedScroll);
          window.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
          });
        } else if (projectsSection) {
          // If no saved scroll, just scroll to section
          projectsSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Clear stored values after use
        sessionStorage.removeItem('activeProjectTab');
        sessionStorage.removeItem('projectsScrollPosition');
      }, 100);
    }
  }
});