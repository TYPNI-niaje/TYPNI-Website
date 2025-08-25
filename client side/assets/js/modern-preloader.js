/*!
 * Modern Preloader System for TYPNI Website
 * Handles different loading experiences for home vs other pages
 * Version: 1.0
 */

(function() {
    'use strict';

    // Configuration - Optimized for speed
    const config = {
        homePageDelay: 2000,      // Reduced logo animation time
        otherPageDelay: 400,      // Faster simple loader
        contentFadeDelay: 150     // Quicker content animation
    };

    // Check if this is the home page
    function isHomePage() {
        const path = window.location.pathname;
        return path === '/' || path === '/index.html' || path.endsWith('/index.html') || path === '';
    }

    // Create modern preloader for home page
    function createHomePreloader() {
        const preloader = document.createElement('div');
        preloader.className = 'modern-preloader';
        preloader.id = 'modern-preloader';
        
        preloader.innerHTML = `
            <div class="preloader-content">
                <img src="assets/img/TYPNI-11.jpg" alt="TYPNI Logo" class="preloader-logo">
            </div>
        `;
        
        document.body.appendChild(preloader);
        return preloader;
    }

    // Create simple loader for other pages
    function createSimpleLoader() {
        const loader = document.createElement('div');
        loader.className = 'simple-page-loader';
        loader.id = 'simple-page-loader';
        
        document.body.appendChild(loader);
        return loader;
    }

    // Hide preloader with animation
    function hidePreloader(element, callback) {
        if (!element) return;
        
        element.classList.add('loaded');
        
        setTimeout(() => {
            // Remove preloader element
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            
            // Show content by removing body class and adding ready class
            document.body.classList.remove('preloader-active');
            document.body.classList.add('content-ready');
            
            if (callback) callback();
        }, 800);
    }

    // Add content fade-in animation
    function animateContentIn() {
        // Add fade-in class to main content areas
        const contentSelectors = [
            '.banner-area',
            '.breadcrumb-area', 
            '.default-padding',
            'main',
            '.container'
        ];
        
        contentSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach((el, index) => {
                if (el && !el.classList.contains('content-fade-in')) {
                    el.style.animationDelay = `${index * 0.1}s`;
                    el.classList.add('content-fade-in');
                }
            });
        });
    }

    // Initialize preloader system
    function initPreloader() {
        // Check if countdown is active (home page only)
        if (isHomePage() && document.body.classList.contains('countdown-active')) {
            // Don't initialize preloader yet, countdown will call us
            return;
        }
        
        // Add body class to hide content
        document.body.classList.add('preloader-active');
        
        // Remove old preloader
        const oldPreloader = document.querySelector('.se-pre-con');
        if (oldPreloader) {
            oldPreloader.style.display = 'none';
        }

        let preloader;
        let delay;

        if (isHomePage()) {
            // Home page: Extended logo preloader
            preloader = createHomePreloader();
            delay = config.homePageDelay;
            
        } else {
            // Other pages: Simple fast loader
            preloader = createSimpleLoader();
            delay = config.otherPageDelay;
        }

        // Hide preloader after delay
        setTimeout(() => {
            hidePreloader(preloader, () => {
                // Animate content in
                setTimeout(animateContentIn, config.contentFadeDelay);
            });
        }, delay);

        // Ensure preloader is hidden if page loads quickly
        window.addEventListener('load', () => {
            setTimeout(() => {
                if (preloader && !preloader.classList.contains('loaded')) {
                    hidePreloader(preloader, animateContentIn);
                }
            }, Math.min(delay, 1000));
        });
    }

    // Page transition handling for SPA-like experience
    function handlePageTransitions() {
        // Add smooth transitions to navigation links
        const links = document.querySelectorAll('a[href]:not([href^="#"]):not([href^="mailto:"]):not([href^="tel:"]):not([target="_blank"])');
        
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                // Only handle internal links
                if (href && !href.startsWith('http') && !href.startsWith('//') && !href.includes('javascript:')) {
                    e.preventDefault();
                    
                    // Create simple transition loader
                    const transitionLoader = createSimpleLoader();
                    
                    // Navigate after short delay
                    setTimeout(() => {
                        window.location.href = href;
                    }, 200);
                }
            });
        });
    }

    // Hide content immediately - CRITICAL for preventing flash
    function hideContentImmediately() {
        if (document.body) {
            document.body.classList.add('preloader-active');
        } else {
            // If body doesn't exist yet, add style tag to hide content
            const style = document.createElement('style');
            style.textContent = `
                body { visibility: hidden !important; opacity: 0 !important; }
                .modern-preloader, .simple-page-loader, .scroll-indicator { 
                    visibility: visible !important; 
                    opacity: 1 !important; 
                }
            `;
            document.head.appendChild(style);
            
            // Add class when body is available
            const checkBody = setInterval(() => {
                if (document.body) {
                    document.body.classList.add('preloader-active');
                    document.head.removeChild(style);
                    clearInterval(checkBody);
                }
            }, 1);
        }
    }
    
    // Call immediately to hide content - CRITICAL timing
    hideContentImmediately();

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initPreloader();
            setTimeout(handlePageTransitions, 1000);
        });
    } else {
        initPreloader();
        setTimeout(handlePageTransitions, 1000);
    }

    // Handle page visibility changes (for PWA-like behavior)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            // Page became visible, ensure smooth experience
            const existingPreloader = document.querySelector('.modern-preloader, .simple-page-loader');
            if (existingPreloader) {
                setTimeout(() => {
                    hidePreloader(existingPreloader, animateContentIn);
                }, 500);
            }
        }
    });

    // Expose API for manual control
    window.ModernPreloader = {
        hide: function() {
            const preloader = document.querySelector('.modern-preloader, .simple-page-loader');
            if (preloader) {
                hidePreloader(preloader, animateContentIn);
            }
        },
        show: function() {
            initPreloader();
        },
        init: function() {
            initPreloader();
        },
        isHome: isHomePage
    };

})();
