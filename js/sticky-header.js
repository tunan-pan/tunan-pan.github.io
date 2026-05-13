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
  rootMargin: '-60% 0px -20% 0px',
  threshold: 0
};

const setActiveLink = (sectionId) => {
  if (currentSection === sectionId) return; // Prevent unnecessary updates
  currentSection = sectionId;
  
  // Remove 'current' from all links
  navLinks.forEach(link => link.classList.remove('current'));
  
  // Add 'current' to the link matching this section
  const activeLink = document.querySelector(`nav a[href="#${sectionId}"]`);
  if (activeLink) {
    activeLink.classList.add('current');
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
  
  // Determine which section should be active
  if (intersectingSections.size > 0) {
    const sectionArray = Array.from(intersectingSections);
    
    if (scrollingDown) {
      // When scrolling down, use the last intersecting section
      setActiveLink(sectionArray[sectionArray.length - 1]);
    } else {
      // When scrolling up, use the first intersecting section
      setActiveLink(sectionArray[0]);
    }
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