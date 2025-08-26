/*!
 * Epic TYPNI Countdown System
 * Handles 10-second countdown -> "NIaje Niaje!" -> Preloader
 * Version: 1.0
 */

class EpicCountdown {
    constructor() {
        this.isHomePage = this.checkHomePage();
        this.countdownDuration = 10; // seconds
        this.currentCount = this.countdownDuration;
        this.countdownContainer = null;
        this.niajeContainer = null;
        this.init();
    }

    checkHomePage() {
        const path = window.location.pathname;
        return path === '/' || path === '/index.html' || path.endsWith('/index.html') || 
               (path === '' && window.location.href.includes('index.html')) ||
               window.location.href.split('/').pop() === '' ||
               window.location.href.split('/').pop() === 'index.html';
    }

    init() {
        // Prevent multiple instances
        if (window.epicCountdownRunning) {
            console.log('Epic countdown already running, skipping');
            return;
        }
        window.epicCountdownRunning = true;
        
        // Only show epic countdown on home page
        if (!this.isHomePage) {
            this.startDirectPreloader();
            return;
        }

        // Clean up any existing countdown elements
        const existingCountdown = document.querySelectorAll('.epic-countdown, .niaje-container, .confetti-container');
        existingCountdown.forEach(el => el.remove());

        // Add countdown active class to body
        document.body.classList.add('countdown-active');
        
        // Create countdown elements
        this.createCountdownHTML();
        this.createNiajeHTML();
        
        // Start the countdown sequence
        this.startCountdown();
    }

    createCountdownHTML() {
        this.countdownContainer = document.createElement('div');
        this.countdownContainer.className = 'epic-countdown';
        this.countdownContainer.innerHTML = `
            <div class="countdown-content">
                <div class="countdown-particles">
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                    <div class="particle"></div>
                </div>
                <h1 class="countdown-number">${this.currentCount}</h1>
            </div>
        `;
        document.body.appendChild(this.countdownContainer);
    }

    createNiajeHTML() {
        // Remove any existing NIaje containers first
        const existingNiaje = document.querySelectorAll('.niaje-container');
        existingNiaje.forEach(container => container.remove());
        
        this.niajeContainer = document.createElement('div');
        this.niajeContainer.className = 'niaje-container';
        this.niajeContainer.id = 'epic-niaje-container'; // Add unique ID
        this.niajeContainer.innerHTML = `
            <div class="niaje-content">
                <div class="niaje-sparkles"></div>
                <h1 class="niaje-text">Niaje, Niaje!</h1>
            </div>
        `;
        document.body.appendChild(this.niajeContainer);
        
        // Add sparkles dynamically
        this.addSparkles();
    }

    addSparkles() {
        const sparklesContainer = this.niajeContainer.querySelector('.niaje-sparkles');
        const sparkleCount = 15;
        
        for (let i = 0; i < sparkleCount; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.style.left = Math.random() * 100 + '%';
            sparkle.style.top = Math.random() * 100 + '%';
            sparkle.style.animationDelay = (Math.random() * 2) + 's';
            sparkle.style.animationDuration = (1.5 + Math.random() * 1) + 's';
            sparklesContainer.appendChild(sparkle);
        }
    }

    startCountdown() {
        const countdownNumber = this.countdownContainer.querySelector('.countdown-number');
        
        const updateCounter = () => {
            if (this.currentCount <= 0) {
                this.showNiaje();
                return;
            }
            
            countdownNumber.textContent = this.currentCount;
            
            // Add pulse animation class
            countdownNumber.style.animation = 'none';
            countdownNumber.offsetHeight; // Trigger reflow
            countdownNumber.style.animation = 'countdownPulse 1s ease-in-out, gradientShift 2s ease-in-out infinite';
            
            this.currentCount--;
            
            setTimeout(updateCounter, 1000);
        };
        
        updateCounter();
    }

    showNiaje() {
        console.log('showNiaje called'); // Debug log
        
        // Hide countdown with fade
        this.countdownContainer.classList.add('fade-out');
        
        // Launch epic confetti immediately
        this.launchConfetti();
        
        // Show NIaje NIaje after short delay
        setTimeout(() => {
            // Hide countdown completely
            this.countdownContainer.style.display = 'none';
            
            console.log('Showing NIaje container'); // Debug log
            
            // Remove countdown-active class so NIaje can show
            document.body.classList.remove('countdown-active');
            document.body.classList.add('niaje-active');
            
            // Force show the NIaje container
            this.niajeContainer.style.display = 'flex';
            this.niajeContainer.style.opacity = '1';
            this.niajeContainer.style.visibility = 'visible';
            this.niajeContainer.classList.add('show');
            
            // Hide NIaje after 4 seconds and start preloader
            setTimeout(() => {
                console.log('Hiding NIaje container'); // Debug log
                this.hideNiaje();
            }, 4000);
            
        }, 500);
    }

    launchConfetti() {
        console.log('Launching confetti!'); // Debug log
        
        // Remove any existing confetti first
        const existingConfetti = document.querySelectorAll('.confetti-container');
        existingConfetti.forEach(container => container.remove());
        
        // Create confetti container
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        confettiContainer.id = 'epic-confetti-container'; // Add unique ID
        confettiContainer.style.zIndex = '9999999'; // Higher than NIaje
        document.body.appendChild(confettiContainer);
        
        const shapes = ['square', 'circle', 'rectangle']; // Removed triangle for simplicity
        const colors = ['#390099', '#4D1AA3', '#FF0054', '#FFDE21', '#9D4EDD', '#F72585'];
        
        // Adjust confetti count based on screen size for performance
        const isMobile = window.innerWidth <= 768;
        const confettiCount = isMobile ? 100 : 200; // Reduce on mobile for performance
        
        console.log(`Creating ${confettiCount} confetti pieces`);
        
        // Launch confetti in waves
        for (let wave = 0; wave < 4; wave++) {
            setTimeout(() => {
                for (let i = 0; i < confettiCount / 4; i++) {
                    const confetti = document.createElement('div');
                    const shape = shapes[Math.floor(Math.random() * shapes.length)];
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    
                    confetti.className = `confetti-piece ${shape}`;
                    confetti.style.backgroundColor = color;
                    
                    // Random horizontal position
                    confetti.style.left = Math.random() * 100 + '%';
                    confetti.style.top = '-50px'; // Start above viewport
                    
                    // Random animation duration for variety
                    const duration = 3 + Math.random() * 4;
                    confetti.style.animationDuration = duration + 's';
                    
                    // Random delay for more natural effect
                    confetti.style.animationDelay = Math.random() * 0.3 + 's';
                    
                    // Random size variation (adjust for mobile)
                    const baseSize = isMobile ? 8 : 10;
                    const size = baseSize + Math.random() * (isMobile ? 8 : 12);
                    confetti.style.width = size + 'px';
                    confetti.style.height = size + 'px';
                    
                    // Add some horizontal drift
                    const drift = -50 + Math.random() * 100;
                    confetti.style.setProperty('--drift', drift + 'px');
                    
                    confettiContainer.appendChild(confetti);
                    
                    // Remove confetti piece after animation
                    setTimeout(() => {
                        if (confetti.parentNode) {
                            confetti.parentNode.removeChild(confetti);
                        }
                    }, (duration + 2) * 1000);
                }
            }, wave * 150);
        }
        
        // Remove confetti container after all animations
        setTimeout(() => {
            if (confettiContainer.parentNode) {
                confettiContainer.parentNode.removeChild(confettiContainer);
            }
        }, 10000);
    }

    hideNiaje() {
        if (!this.niajeContainer) return;
        
        console.log('Starting hideNiaje animation'); // Debug log
        this.niajeContainer.classList.add('hide');
        
        setTimeout(() => {
            console.log('Removing NIaje container'); // Debug log
            
            // Remove the container completely
            if (this.niajeContainer && this.niajeContainer.parentNode) {
                this.niajeContainer.parentNode.removeChild(this.niajeContainer);
            }
            
            // Also remove any other NIaje containers that might exist
            const allNiaje = document.querySelectorAll('.niaje-container');
            allNiaje.forEach(container => {
                if (container.parentNode) {
                    container.parentNode.removeChild(container);
                }
            });
            
            // Clean up body classes
            document.body.classList.remove('countdown-active');
            document.body.classList.remove('niaje-active');
            
            // Start preloader
            this.startPreloader();
            
            // Reset the running flag
            window.epicCountdownRunning = false;
        }, 600);
    }

    startPreloader() {
        // Initialize the existing modern preloader
        if (window.ModernPreloader) {
            window.ModernPreloader.init();
        } else {
            // Fallback to manual preloader start
            this.startManualPreloader();
        }
    }

    startManualPreloader() {
        // Create preloader if it doesn't exist
        let preloader = document.querySelector('.modern-preloader');
        
        if (!preloader) {
            preloader = document.createElement('div');
            preloader.className = 'modern-preloader';
            preloader.innerHTML = `
                <div class="preloader-content">
                    <img src="assets/img/logo.png" alt="TYPNI" class="preloader-logo">
                </div>
            `;
            document.body.appendChild(preloader);
        }

        // Hide preloader after content loads
        this.waitForContent(() => {
            preloader.classList.add('loaded');
            document.body.classList.add('content-ready');
            
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 600);
        });
    }

    startDirectPreloader() {
        // For non-home pages, start preloader directly
        document.body.classList.remove('countdown-active');
        
        if (window.ModernPreloader) {
            window.ModernPreloader.init();
        } else {
            this.startManualPreloader();
        }
    }

    waitForContent(callback) {
        let imagesLoaded = 0;
        const images = document.querySelectorAll('img');
        const totalImages = images.length;
        
        if (totalImages === 0) {
            setTimeout(callback, 1000); // Minimum loading time
            return;
        }
        
        const imageLoadHandler = () => {
            imagesLoaded++;
            if (imagesLoaded >= totalImages) {
                setTimeout(callback, 500); // Small delay for smooth transition
            }
        };
        
        images.forEach(img => {
            if (img.complete) {
                imageLoadHandler();
            } else {
                img.addEventListener('load', imageLoadHandler);
                img.addEventListener('error', imageLoadHandler); // Count failed loads too
            }
        });
        
        // Maximum loading time fallback
        setTimeout(() => {
            if (imagesLoaded < totalImages) {
                callback();
            }
        }, 5000);
    }
}

// Performance optimized initialization
(function() {
    'use strict';
    
    // Early execution to prevent flash of unstyled content
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCountdown);
    } else {
        initCountdown();
    }
    
    function initCountdown() {
        // Small delay to ensure CSS is loaded
        requestAnimationFrame(() => {
            new EpicCountdown();
        });
    }
    
    // Prevent right-click during countdown (optional security)
    document.addEventListener('contextmenu', function(e) {
        if (document.body.classList.contains('countdown-active')) {
            e.preventDefault();
        }
    });
    
    // Prevent F12, Ctrl+Shift+I during countdown (optional)
    document.addEventListener('keydown', function(e) {
        if (document.body.classList.contains('countdown-active')) {
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.shiftKey && e.key === 'C') ||
                (e.ctrlKey && e.key === 'u')) {
                e.preventDefault();
            }
        }
    });
})();

// Export for potential external use
window.EpicCountdown = EpicCountdown;