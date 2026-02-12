const hoverTarget = document.getElementById('hoverTarget');
        
        // Array of emojis to cycle through in order
        const emojis = ['❤️', '🧡', '💛', '💚', '💙', '🩵', '💜', '🩷'];
        
        let particleInterval;
        let currentIndex = 0; // Track current position in emoji array

        function createParticle(x, y) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Get emoji in order and increment index
            particle.textContent = emojis[currentIndex];
            currentIndex = (currentIndex + 1) % emojis.length; // Loop back to start
            
            // Position at cursor with slight random offset
            particle.style.left = (x + (Math.random() - 0.5) * 20) + 'px';
            particle.style.top = y + 'px';
            
            document.body.appendChild(particle);
            
            // Remove particle after animation completes
            setTimeout(() => {
                particle.remove();
            }, 2000);
        }

        let mouseX = 0;
        let mouseY = 0;

        hoverTarget.addEventListener('mouseenter', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            // Create particles continuously while hovering
            particleInterval = setInterval(() => {
                createParticle(mouseX, mouseY);
            }, 200);
        });

        hoverTarget.addEventListener('mousemove', (e) => {
            // Update the current mouse position
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        hoverTarget.addEventListener('mouseleave', () => {
            // Stop creating particles when mouse leaves
            clearInterval(particleInterval);
        });