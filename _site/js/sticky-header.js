const header = document.querySelector('.site-header');
    let isScrolled = false;
    let ticking = false;
    
    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          const scrollY = window.scrollY;
          
          if (scrollY > 60 && !isScrolled) {
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