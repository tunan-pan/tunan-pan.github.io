const backToTopButton = document.querySelector('.back-to-top');
    
    window.addEventListener('scroll', () => {
      if (window.scrollY > 800) { // pixels scrolled before buttons shows
        backToTopButton.classList.add('show');
      } else {
        backToTopButton.classList.remove('show');
      }
    });
    
    // Smooth scroll to top when clicked
    backToTopButton.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });