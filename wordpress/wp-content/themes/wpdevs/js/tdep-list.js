(function($) {
    'use strict';

    // Main initialization
    $(document).ready(function() {
        initTdepList();
    });

    function initTdepList() {
        // Initialize components
        initSkeletonLoading();
        initPagination();
        initLinkBehavior();
        initEntryAnimations();
        initTermTagHover();
    }

    // Initialize skeleton loading functionality
    function initSkeletonLoading() {
        const skeletonTemplate = document.getElementById('tdep-list-skeleton');
        if (!skeletonTemplate) return;

        // Show loading state when navigating away
        $(window).on('beforeunload', function() {
            showLoadingState();
        });
    }

    // Show loading state with skeletons
    function showLoadingState() {
        const container = $('.tdep-list-wrapper');
        const skeletonTemplate = document.getElementById('tdep-list-skeleton');
        
        if (!container.length || !skeletonTemplate) return;

        // Store current scroll position
        window.localStorage.setItem('tdep_list_scroll', $(window).scrollTop());

        // Clear current content
        container.empty();
        
        // Add multiple skeleton items
        for (let i = 0; i < 5; i++) {
            const skeleton = document.importNode(skeletonTemplate.content, true);
            container.append(skeleton);
        }

        // Add loading class to container
        container.addClass('tdep-list-loading');
    }

    // Initialize pagination handling
    function initPagination() {
        $('.tdep-list-pagination a').on('click', function(e) {
            // Don't handle if it's a new tab/window click
            if (e.ctrlKey || e.shiftKey || e.metaKey || e.which === 2) {
                return;
            }
            
            e.preventDefault();
            const href = $(this).attr('href');
            
            // Show loading state
            showLoadingState();
            
            // Navigate to new page
            window.location.href = href;
        });
    }

    // Initialize link behavior
    function initLinkBehavior() {
        $('.tdep-list-link').on('click', function(e) {
            // Don't handle if it's a new tab/window click
            if (e.ctrlKey || e.shiftKey || e.metaKey || e.which === 2) {
                return;
            }

            showLoadingState();
        });

        // Handle keyboard navigation
        $('.tdep-list-link').on('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showLoadingState();
                window.location.href = $(this).attr('href');
            }
        });
    }

    // Initialize entry animations
    function initEntryAnimations() {
        const listItems = $('.tdep-list-item:not(.tdep-list-skeleton)');
        
        listItems.each(function(index) {
            const item = $(this);
            
            // Set initial state
            item.css({
                'opacity': '0',
                'transform': 'translateY(20px)'
            });
            
            // Trigger animation with delay based on position
            setTimeout(function() {
                item.css({
                    'opacity': '1',
                    'transform': 'translateY(0)',
                    'transition': 'all 0.3s ease'
                });
            }, index * 100);
        });
    }

    // Initialize term tag hover effects
    function initTermTagHover() {
        $('.tdep-list-term-tag').hover(
            function() {
                $(this).addClass('tdep-list-term-tag-hover');
            },
            function() {
                $(this).removeClass('tdep-list-term-tag-hover');
            }
        );
    }

    // Restore scroll position if coming back
    $(window).on('load', function() {
        const savedScroll = window.localStorage.getItem('tdep_list_scroll');
        if (savedScroll) {
            $(window).scrollTop(savedScroll);
            window.localStorage.removeItem('tdep_list_scroll');
        }
    });

    // Handle reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
        $('.tdep-list-item').css('transition', 'none');
    }

    // Handle loading errors
    function handleLoadingError() {
        const container = $('.tdep-list-wrapper');
        container.removeClass('tdep-list-loading');
        container.html('<div class="tdep-list-error">เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง</div>');
    }

    // Utility function for smooth animations
    function animateCSS(element, animation) {
        return new Promise((resolve) => {
            const node = element[0];
            node.classList.add(`tdep-list-${animation}`);

            function handleAnimationEnd(event) {
                event.stopPropagation();
                node.classList.remove(`tdep-list-${animation}`);
                resolve('Animation ended');
            }

            node.addEventListener('animationend', handleAnimationEnd, { once: true });
        });
    }

    // Add resize handler for responsive behavior
    let resizeTimer;
    $(window).on('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            adjustLayoutForScreenSize();
        }, 250);
    });

    // Adjust layout based on screen size
    function adjustLayoutForScreenSize() {
        const container = $('.tdep-list-container');
        if (window.innerWidth < 768) {
            container.addClass('tdep-list-mobile');
        } else {
            container.removeClass('tdep-list-mobile');
        }
    }

    // Initialize on load
    adjustLayoutForScreenSize();

})(jQuery);