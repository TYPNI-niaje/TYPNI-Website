/*!
 * Performance Monitor for TYPNI Website
 * Tracks loading times and provides insights
 */

(function() {
    'use strict';
    
    // Performance tracking
    const perfData = {
        startTime: performance.now(),
        domContentLoaded: null,
        windowLoaded: null,
        preloaderHidden: null,
        firstContentfulPaint: null
    };
    
    // Track DOM content loaded
    document.addEventListener('DOMContentLoaded', function() {
        perfData.domContentLoaded = performance.now() - perfData.startTime;
        console.log(`🚀 DOM Content Loaded: ${perfData.domContentLoaded.toFixed(2)}ms`);
    });
    
    // Track window loaded
    window.addEventListener('load', function() {
        perfData.windowLoaded = performance.now() - perfData.startTime;
        console.log(`✅ Window Loaded: ${perfData.windowLoaded.toFixed(2)}ms`);
        
        // Try to get paint timing
        try {
            const paintEntries = performance.getEntriesByType('paint');
            const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
            if (fcp) {
                perfData.firstContentfulPaint = fcp.startTime;
                console.log(`🎨 First Contentful Paint: ${fcp.startTime.toFixed(2)}ms`);
            }
        } catch (e) {
            // Paint timing not supported
        }
        
        // Summary after everything loads
        setTimeout(() => {
            console.log('\n📊 TYPNI Website Performance Summary:');
            console.log(`   DOM Ready: ${perfData.domContentLoaded.toFixed(2)}ms`);
            console.log(`   Full Load: ${perfData.windowLoaded.toFixed(2)}ms`);
            if (perfData.firstContentfulPaint) {
                console.log(`   First Paint: ${perfData.firstContentfulPaint.toFixed(2)}ms`);
            }
            
            // Performance grade
            let grade = 'A+';
            if (perfData.windowLoaded > 3000) grade = 'C';
            else if (perfData.windowLoaded > 2000) grade = 'B';
            else if (perfData.windowLoaded > 1000) grade = 'A';
            
            console.log(`   Performance Grade: ${grade} ⚡`);
        }, 100);
    });
    
    // Track preloader hiding
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.classList.contains('content-ready') && !perfData.preloaderHidden) {
                    perfData.preloaderHidden = performance.now() - perfData.startTime;
                    console.log(`🎯 Content Visible: ${perfData.preloaderHidden.toFixed(2)}ms`);
                }
            }
        });
    });
    
    // Start observing body class changes
    if (document.body) {
        observer.observe(document.body, { attributes: true });
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            observer.observe(document.body, { attributes: true });
        });
    }
    
})();
