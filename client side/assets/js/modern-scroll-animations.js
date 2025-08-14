/*!
 * Modern Scroll Animations for TYPNI Website
 * Enhanced scroll-triggered animations using Intersection Observer API
 * Version: 1.0
 */

(function() {
    'use strict';

    // Configuration
    const config = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
        animationDuration: 800,
        staggerDelay: 100
    };

    // Animation classes and styles
    const animations = {
        fadeInUp: {
            initial: {
                opacity: 0,
                transform: 'translateY(60px)'
            },
            animate: {
                opacity: 1,
                transform: 'translateY(0)'
            }
        },
        fadeInLeft: {
            initial: {
                opacity: 0,
                transform: 'translateX(-60px)'
            },
            animate: {
                opacity: 1,
                transform: 'translateX(0)'
            }
        },
        fadeInRight: {
            initial: {
                opacity: 0,
                transform: 'translateX(60px)'
            },
            animate: {
                opacity: 1,
                transform: 'translateX(0)'
            }
        },
        scaleIn: {
            initial: {
                opacity: 0,
                transform: 'scale(0.8)'
            },
            animate: {
                opacity: 1,
                transform: 'scale(1)'
            }
        },
        slideInFromBottom: {
            initial: {
                opacity: 0,
                transform: 'translateY(80px) rotateX(15deg)'
            },
            animate: {
                opacity: 1,
                transform: 'translateY(0) rotateX(0)'
            }
        },
        rotateInLeft: {
            initial: {
                opacity: 0,
                transform: 'rotate(-10deg) scale(0.9)'
            },
            animate: {
                opacity: 1,
                transform: 'rotate(0) scale(1)'
            }
        },
        bounceIn: {
            initial: {
                opacity: 0,
                transform: 'scale(0.3)'
            },
            animate: {
                opacity: 1,
                transform: 'scale(1)'
            }
        }
    };

    // Create CSS for animations
    function createAnimationCSS() {
        const style = document.createElement('style');
        style.textContent = `
            /* Modern Scroll Animation Base Styles */
            .scroll-animate {
                transition: all ${config.animationDuration}ms cubic-bezier(0.165, 0.84, 0.44, 1);
                will-change: transform, opacity;
            }

            .scroll-animate.bounce-animate {
                transition: all ${config.animationDuration}ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }

            /* Hero section enhanced animations */
            .hero-enhanced .content h4 {
                animation-delay: 0.3s;
            }
            
            .hero-enhanced .content h1 {
                animation-delay: 0.6s;
            }
            
            .hero-enhanced .content .btn:first-of-type {
                animation-delay: 0.9s;
            }
            
            .hero-enhanced .content .btn:last-of-type {
                animation-delay: 1.1s;
            }

            /* Parallax effect for sections */
            .parallax-section {
                transform: translateZ(0);
                backface-visibility: hidden;
            }

            /* Card hover effects */
            .modern-card {
                transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                transform: translateY(0);
            }

            .modern-card:hover {
                transform: translateY(-10px);
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }

            /* Stagger animation delays */
            .stagger-1 { animation-delay: 0.1s; }
            .stagger-2 { animation-delay: 0.2s; }
            .stagger-3 { animation-delay: 0.3s; }
            .stagger-4 { animation-delay: 0.4s; }
            .stagger-5 { animation-delay: 0.5s; }
            .stagger-6 { animation-delay: 0.6s; }

            /* Counter animation */
            .counter-animate {
                font-variant-numeric: tabular-nums;
            }

            /* Image reveal animations */
            .image-reveal {
                overflow: hidden;
                position: relative;
            }

            .image-reveal::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(45deg, #4D1AA3, #390099);
                transform: translateX(-100%);
                transition: transform 1s cubic-bezier(0.77, 0, 0.175, 1);
            }

            .image-reveal.revealed::after {
                transform: translateX(100%);
            }

            /* Text reveal animation - removed to fix heading display issues */

            /* Progress bar animations */
            .progress-animate {
                position: relative;
                overflow: hidden;
            }

            .progress-animate::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                animation: shimmer 2s infinite;
            }

            @keyframes shimmer {
                0% { left: -100%; }
                100% { left: 100%; }
            }

            /* Floating animations */
            .float-animation {
                animation: float 6s ease-in-out infinite;
            }

            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-20px); }
            }

            /* Pulse glow effect */
            .pulse-glow {
                position: relative;
            }

            .pulse-glow::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                background: radial-gradient(circle, rgba(77, 26, 163, 0.3) 0%, transparent 70%);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                animation: pulse-glow 2s infinite;
            }

            @keyframes pulse-glow {
                0% {
                    width: 0;
                    height: 0;
                    opacity: 1;
                }
                100% {
                    width: 100px;
                    height: 100px;
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Apply initial animation state
    function applyInitialState(element, animationType) {
        const animation = animations[animationType];
        if (animation) {
            Object.assign(element.style, animation.initial);
        }
    }

    // Animate element
    function animateElement(element, animationType, delay = 0) {
        const animation = animations[animationType];
        if (!animation) return;

        setTimeout(() => {
            element.style.transition = `all ${config.animationDuration}ms cubic-bezier(0.165, 0.84, 0.44, 1)`;
            Object.assign(element.style, animation.animate);
        }, delay);
    }

    // Create intersection observer
    function createObserver() {
        return new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const animationType = element.dataset.scrollAnimate;
                    const delay = parseInt(element.dataset.delay) || 0;
                    
                    element.classList.add('scroll-animate');
                    animateElement(element, animationType, delay);
                    
                    // Special handling for different element types
                    if (element.classList.contains('image-reveal')) {
                        setTimeout(() => element.classList.add('revealed'), delay);
                    }
                    
                    // Text reveal functionality removed
                    
                    // Unobserve after animation
                    setTimeout(() => {
                        observer.unobserve(element);
                    }, config.animationDuration + delay);
                }
            });
        }, {
            threshold: config.threshold,
            rootMargin: config.rootMargin
        });
    }

    // Add stagger delays to child elements
    function addStaggerDelays(container, baseDelay = 0) {
        const children = container.children;
        Array.from(children).forEach((child, index) => {
            const delay = baseDelay + (index * config.staggerDelay);
            child.dataset.delay = delay;
            child.classList.add(`stagger-${Math.min(index + 1, 6)}`);
        });
    }

    // Counter animation
    function animateCounter(element) {
        const target = parseInt(element.dataset.target) || 0;
        const duration = parseInt(element.dataset.duration) || 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current).toLocaleString();
        }, 16);
    }

    // Parallax scrolling effect
    function initParallax() {
        const parallaxElements = document.querySelectorAll('.parallax-element');
        
        if (parallaxElements.length === 0) return;

        function updateParallax() {
            const scrollTop = window.pageYOffset;
            
            parallaxElements.forEach(element => {
                const speed = parseFloat(element.dataset.speed) || 0.5;
                const yPos = -(scrollTop * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
        }

        // Throttled scroll handler
        let ticking = false;
        function handleScroll() {
            if (!ticking) {
                requestAnimationFrame(() => {
                    updateParallax();
                    ticking = false;
                });
                ticking = true;
            }
        }

        window.addEventListener('scroll', handleScroll);
    }

    // Initialize modern scroll animations
    function init() {
        // Create animation CSS
        createAnimationCSS();

        // Create observer
        const observer = createObserver();

        // Select all elements with scroll animations
        const animatedElements = document.querySelectorAll('[data-scroll-animate]');

        // Apply initial states and observe elements
        animatedElements.forEach(element => {
            const animationType = element.dataset.scrollAnimate;
            applyInitialState(element, animationType);
            observer.observe(element);
        });

        // Initialize parallax
        initParallax();

        // Add modern card effects (excluding footer items)
        const cards = document.querySelectorAll('.popular-causes-items .item, .what-we-do-grid .box, .event-carousel .item, .blog-items .item');
        cards.forEach(card => {
            card.classList.add('modern-card');
        });

        // Handle counter animations
        const counters = document.querySelectorAll('[data-counter]');
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => {
            counterObserver.observe(counter);
        });

        // Store observer globally for cleanup
        window.modernScrollObserver = observer;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose API for manual triggering
    window.ModernScrollAnimations = {
        init,
        animateElement,
        addStaggerDelays,
        config
    };

})();
