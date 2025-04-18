(function($) {
    'use strict';

    // Main initialization
    $(document).ready(function() {
        initTdepTemCards();
        initTdepTemInfiniteScroll();
        initTdepTemSearchFilter();
    });

    function initTdepTemCards() {
        const cards = $('.tdep-tem-card');
        
        // Enhanced image loading with fallback
        $('.tdep-tem-card-image').each(function() {
            const $image = $(this);
            const bgUrl = $image.css('background-image');
            
            if (bgUrl !== 'none') {
                const url = bgUrl.replace(/url\(['"]?(.*?)['"]?\)/i, '$1');
                
                $image.addClass('tdep-tem-loading');
                
                const img = new Image();
                img.onload = function() {
                    $image.removeClass('tdep-tem-loading');
                    $image.addClass('tdep-tem-loaded');
                    // Add fade-in animation
                    setTimeout(() => {
                        $image.addClass('tdep-tem-fade-in');
                    }, 50);
                };
                img.onerror = function() {
                    // Load default image on error
                    $image.css('background-image', 'url("/images/default-department.jpg")');
                    $image.removeClass('tdep-tem-loading');
                    $image.addClass('tdep-tem-loaded tdep-tem-fade-in');
                };
                img.src = url;
            }
        });

        // Enhanced hover effects
        cards.each(function() {
            const card = $(this);
            const overlay = card.find('.tdep-tem-card-overlay');
            const title = card.find('.tdep-tem-card-title');
            const readMore = card.find('.tdep-tem-read-more');

            card.hover(
                function() {
                    overlay.css({
                        'opacity': '0.9',
                        'background': 'linear-gradient(to bottom, rgba(255, 107, 53, 0.3), rgba(255, 107, 53, 0.9))'
                    });
                    title.addClass('tdep-tem-title-hover');
                    readMore.addClass('tdep-tem-read-more-hover');
                },
                function() {
                    overlay.css({
                        'opacity': '0.7',
                        'background': 'linear-gradient(to bottom, rgba(26, 71, 137, 0.2), rgba(26, 71, 137, 0.8))'
                    });
                    title.removeClass('tdep-tem-title-hover');
                    readMore.removeClass('tdep-tem-read-more-hover');
                }
            );
        });

        // Improved keyboard navigation
        $('.tdep-tem-card-link').on('keydown', function(e) {
            const card = $(this).closest('.tdep-tem-card');
            
            switch(e.key) {
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    window.location.href = $(this).attr('href');
                    break;
                case 'Tab':
                    // Remove hover effect when tabbing out
                    if (!e.shiftKey && $(this).is(':last-child')) {
                        card.trigger('mouseleave');
                    }
                    break;
            }
        }).on('focus', function() {
            $(this).closest('.tdep-tem-card').trigger('mouseenter');
        }).on('blur', function() {
            $(this).closest('.tdep-tem-card').trigger('mouseleave');
        });
    }

    // Infinite scroll implementation
    function initTdepTemInfiniteScroll() {
        if (!$('.tdep-tem-pagination').length) return;

        let loading = false;
        let page = 1;
        const container = $('.tdep-tem-grid');
        const loadMoreThreshold = 200;

        $(window).scroll(function() {
            if (loading) return;

            if ($(window).scrollTop() + $(window).height() > $(document).height() - loadMoreThreshold) {
                loading = true;
                loadMorePosts();
            }
        });

        function loadMorePosts() {
            const nextPage = page + 1;
            $.ajax({
                url: window.location.href,
                data: { paged: nextPage },
                type: 'GET',
                success: function(response) {
                    const $newPosts = $(response).find('.tdep-tem-card');
                    if ($newPosts.length) {
                        container.append($newPosts);
                        page = nextPage;
                        initTdepTemCards(); // Reinitialize for new cards
                        loading = false;
                    }
                }
            });
        }
    }

    // Search and filter functionality
    function initTdepTemSearchFilter() {
        const searchInput = $('<input>', {
            type: 'text',
            class: 'tdep-tem-search',
            placeholder: 'ค้นหาบทความ...'
        });

        $('.tdep-tem-container').prepend(searchInput);

        let searchTimeout;
        searchInput.on('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchTerm = $(this).val().toLowerCase();
                
                $('.tdep-tem-card').each(function() {
                    const card = $(this);
                    const title = card.find('.tdep-tem-card-title').text().toLowerCase();
                    const excerpt = card.find('.tdep-tem-card-excerpt').text().toLowerCase();
                    const categories = card.find('.tdep-tem-category-tag').text().toLowerCase();
                    
                    if (title.includes(searchTerm) || 
                        excerpt.includes(searchTerm) || 
                        categories.includes(searchTerm)) {
                        card.fadeIn();
                    } else {
                        card.fadeOut();
                    }
                });
            }, 300);
        });
    }

    // Utility function for smooth animations
    function animateTdepTemCSS(element, animation, callback) {
        const animationName = `tdep-tem-${animation}`;
        const node = element[0];

        node.classList.add(animationName);

        function handleAnimationEnd(event) {
            event.stopPropagation();
            node.classList.remove(animationName);
            callback && callback();
        }

        node.addEventListener('animationend', handleAnimationEnd, {once: true});
    }

})(jQuery);