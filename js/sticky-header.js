const header = document.querySelector('.site-header');
let isScrolled = false;
let ticking = false;

window.addEventListener('scroll', function () {
  if (!ticking) {
    window.requestAnimationFrame(function () {
      const scrollY = window.scrollY;

      if (scrollY > 80 && !isScrolled) {
        header.classList.add('scrolled');
        isScrolled = true;
      } else if (scrollY < 40 && isScrolled) {
        header.classList.remove('scrolled');
        isScrolled = false;
      }

      ticking = false;
    });
    ticking = true;
  }

});



// Highlight nav links based on which section is visible
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav a[href^="#"]');

let lastScrollY = window.scrollY;
let currentSection = null;

// Default options for most sections
const defaultObserverOptions = {
  root: null,
  rootMargin: '-20% 0px -70% 0px',
  threshold: 0
};

// Special options for shorter sections (like about/contact at bottom)
const bottomSectionOptions = {
  root: null,
  rootMargin: '-20% 0px -20% 0px',
  threshold: 0
};

const setActiveLink = (sectionId) => {
  if (currentSection === sectionId) return;
  currentSection = sectionId;
  
  // Remove 'current' from all links
  navLinks.forEach(link => link.classList.remove('current'));
  
  // Add 'current' to the link matching this section
  if (sectionId) {
    const activeLink = document.querySelector(`nav a[href="#${sectionId}"]`);
    if (activeLink) {
      activeLink.classList.add('current');
    }
  }
};

// Track which sections are currently intersecting
const intersectingSections = new Set();

const handleIntersection = (entries) => {
  const scrollingDown = window.scrollY > lastScrollY;
  lastScrollY = window.scrollY;
  
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      intersectingSections.add(entry.target.id);
    } else {
      intersectingSections.delete(entry.target.id);
    }
  });
  
  // If no sections are intersecting (scrolled above everything), clear active
  if (intersectingSections.size === 0) {
    setActiveLink(null);
    return;
  }
  
  // Determine which section should be active
  const sectionArray = Array.from(intersectingSections);
  
  if (scrollingDown) {
    // When scrolling down, use the last intersecting section
    setActiveLink(sectionArray[sectionArray.length - 1]);
  } else {
    // When scrolling up, use the first intersecting section
    setActiveLink(sectionArray[0]);
  }
};

// Create observers
const defaultObserver = new IntersectionObserver(handleIntersection, defaultObserverOptions);
const bottomObserver = new IntersectionObserver(handleIntersection, bottomSectionOptions);

// Observe sections with appropriate observer
sections.forEach(section => {
  if (section.id === 'about-section' || section.id === 'contact-section') {
    bottomObserver.observe(section);
  } else {
    defaultObserver.observe(section);
  }
});


// Update your nav links to handle cross-page anchors
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    
    // If it's an anchor link
    if (href.startsWith('#')) {
      // Check if we're on the home page
      if (window.location.pathname !== '/') {
        // We're on a different page - navigate to home with anchor
        window.location.href = '/' + href;
        e.preventDefault();
      }
      // Otherwise let the smooth scroll happen naturally
    }
  });
});









// Enable manual scroll restoration
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

document.addEventListener('DOMContentLoaded', () => {
  
  // Store tab state in history when switching tabs
  const tabs = document.querySelectorAll('.tab-note');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      
      // Store current state in history
      const currentUrl = new URL(window.location);
      currentUrl.searchParams.set('tab', targetTab);
      history.replaceState({ tab: targetTab }, '', currentUrl);
    });
  });
  
  // Store project context when clicking a project card
  const projectLinks = document.querySelectorAll('.project-card a');
  
  projectLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const activeTab = document.querySelector('.tab-note--active');
      if (activeTab) {
        const tabId = activeTab.dataset.tab;
        const scrollY = window.scrollY;
        
        // Store in history state AND sessionStorage as backup
        history.replaceState(
          { tab: tabId, scrollY: scrollY }, 
          '', 
          window.location.href
        );
        sessionStorage.setItem('activeProjectTab', tabId);
        sessionStorage.setItem('projectsScrollY', scrollY);
      }
    });
  });
  
  // Restore state on page load (handles both back button and direct navigation)
  const restoreState = () => {
    // Try history state first (for back button)
    let savedTab = history.state?.tab;
    let savedScroll = history.state?.scrollY;
    
    // Fall back to sessionStorage (for "back to projects" link)
    if (!savedTab) {
      savedTab = sessionStorage.getItem('activeProjectTab');
      savedScroll = sessionStorage.getItem('projectsScrollY');
    }
    
    // Also check URL params
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) savedTab = tabParam;
    
    const urlHash = window.location.hash;
    if ((urlHash === '#projects-section' || tabParam) && savedTab) {
      // Restore tab
      const tabButton = document.querySelector(`[data-tab="${savedTab}"]`);
      if (tabButton && !tabButton.classList.contains('tab-note--active')) {
        tabButton.click();
      }
      
      // Restore scroll position
      setTimeout(() => {
        if (savedScroll) {
          window.scrollTo({
            top: parseInt(savedScroll),
            behavior: 'instant' // Use 'instant' for back button, feels more natural
          });
        } else {
          document.getElementById('projects-section')?.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Clear sessionStorage after use
        sessionStorage.removeItem('activeProjectTab');
        sessionStorage.removeItem('projectsScrollY');
      }, 100);
    }
  };
  
  // Run on initial page load
  restoreState();
  
  // Listen for popstate (back/forward button)
  window.addEventListener('popstate', (event) => {
    if (event.state) {
      restoreState();
    }
  });
});