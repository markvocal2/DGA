(function($) {
    'use strict';

    $(document).ready(function() {
        initWptaxRelated();
    });

    function initWptaxRelated() {
        initLazyLoading();
        initHoverEffects();
        initAccessibility();
    }

    // Initialize lazy loading for images
    function initLazyLoading() {
        const images = document.querySelectorAll('.wptax-related-thumbnail');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.classList.add('wptax-related-loaded');
                        observer.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        }
    }

    // Initialize hover effects
    function initHoverEffects() {
        $('.wptax-related-item').hover(
            function() {
                $(this).addClass('wptax-related-hover');
            },
            function() {
                $(this).removeClass('wptax-related-hover');
            }
        );
    }

    // Initialize accessibility features
    function initAccessibility() {
        // Add appropriate ARIA labels
        $('.wptax-related-link').each(function() {
            const title = $(this).find('.wptax-related-title').text();
            $(this).attr('aria-label', 'อ่านบทความ: ' + title);
        });

        // Add keyboard navigation
        $('.wptax-related-link').on('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.location.href = $(this).attr('href');
            }
        });
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
        $('.wptax-related-item').css('transition', 'none');
        $('.wptax-related-thumbnail').css('transition', 'none');
    }

})(jQuery);