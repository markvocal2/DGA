(function($) {
    'use strict';

    $(document).ready(function() {
        initTdepList2();
    });

    function initTdepList2() {
        initLazyLoading();
        initHoverEffects();
        initAccessibility();
    }

    // Initialize lazy loading for images
    function initLazyLoading() {
        const images = document.querySelectorAll('.tdep-list-2-thumbnail');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.classList.add('tdep-list-2-loaded');
                        observer.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        }
    }

    // Initialize hover effects
    function initHoverEffects() {
        $('.tdep-list-2-item').hover(
            function() {
                $(this).addClass('tdep-list-2-hover');
            },
            function() {
                $(this).removeClass('tdep-list-2-hover');
            }
        );
    }

    // Initialize accessibility features
    function initAccessibility() {
        // Add appropriate ARIA labels
        $('.tdep-list-2-link').each(function() {
            const title = $(this).find('.tdep-list-2-title').text();
            $(this).attr('aria-label', 'อ่านบทความ: ' + title);
        });

        // Add keyboard navigation
        $('.tdep-list-2-link').on('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.location.href = $(this).attr('href');
            }
        });
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
        $('.tdep-list-2-item').css('transition', 'none');
        $('.tdep-list-2-thumbnail').css('transition', 'none');
    }

})(jQuery);