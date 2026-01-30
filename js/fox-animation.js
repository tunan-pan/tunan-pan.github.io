
// Fox animation controller
class FoxAnimator {
constructor() {
    this.container = document.querySelector('.fox-container');
    this.hitbox = document.querySelector('.fox-hitbox');
    this.animatedImg = document.querySelector('.fox-animated');
    
    // Animation configuration
    this.frames = [
    'images/fox/Fox_Frame_01.png',
    'images/fox/Fox_Frame_02.png',
    'images/fox/Fox_Frame_03.png',
    'images/fox/Fox_Frame_04.png',
    'images/fox/Fox_Frame_05.png',
    'images/fox/Fox_Frame_06.png',
    'images/fox/Fox_Frame_07.png',
    'images/fox/Fox_Frame_08.png',
    'images/fox/Fox_Frame_09.png',
    'images/fox/Fox_Frame_10.png',
    'images/fox/Fox_Frame_11.png',
    'images/fox/Fox_Frame_12.png',
    'images/fox/Fox_Frame_13.png',
    'images/fox/Fox_Frame_14.png'
    ];
    
    this.currentFrame = 0;
    this.isAnimating = false;
    this.isHovering = false; // NEW: Track hover state
    this.frameRate = 80; // milliseconds per frame (adjust for speed)
    this.animationTimer = null;
    
    this.init();
}

init() {
    // Preload all animation frames
    this.preloadFrames();
    
    // Track when mouse enters
    this.hitbox.addEventListener('mouseenter', () => {
      this.isHovering = true;
      this.startAnimation();
    });
    
    // Track when mouse leaves
    this.hitbox.addEventListener('mouseleave', () => {
      this.isHovering = false;
      // Animation will finish current loop and then stop
    });
    
    // Optional: keyboard accessibility
    this.hitbox.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.isHovering = !this.isHovering;
        if (this.isHovering) {
          this.startAnimation();
        }
      }
    });
  }

preloadFrames() {
    this.frames.forEach(src => {
    const img = new Image();
    img.src = src;
    });
}

startAnimation() {
    // Prevent multiple simultaneous animations
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    this.currentFrame = 0;
    this.container.classList.add('is-animating');
    
    this.playNextFrame();
}

playNextFrame() {
    if (this.currentFrame < this.frames.length) {
    // Update the image source
    this.animatedImg.src = this.frames[this.currentFrame];
    this.currentFrame++;
    
    // Schedule next frame
    this.animationTimer = setTimeout(() => {
        this.playNextFrame();
    }, this.frameRate);
    } else {
    // Animation sequence complete
      if (this.isHovering) {
        // Loop: restart animation if still hovering
        this.currentFrame = 0;
        this.playNextFrame();
      } else {
        // Not hovering: end animation
        this.endAnimation();
      }
    }
  }

endAnimation() {
    this.isAnimating = false;
    this.container.classList.remove('is-animating');
    this.currentFrame = 0;
    
    if (this.animationTimer) {
    clearTimeout(this.animationTimer);
    this.animationTimer = null;
    }
}
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
new FoxAnimator();
});
