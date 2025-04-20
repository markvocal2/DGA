(function($) {
    'use strict';

    // --- Helper Functions ---

    /**
     * Handles the loading and fallback logic for a card image.
     * @param {jQuery} $image - The jQuery object for the image element.
     */
    function handleImageLoading($image) {
        const bgUrl = $image.css('background-image');

        if (bgUrl && bgUrl !== 'none') {
            const url = bgUrl.replace(/url\(['"]?(.*?)['"]?\)/i, '$1');

            $image.addClass('tdep-tem-loading');

            const img = new Image();

            // Image loaded successfully
            img.onload = function() {
                $image.removeClass('tdep-tem-loading').addClass('tdep-tem-loaded');
                // Add fade-in animation slightly delayed
                setTimeout(() => {
                    $image.addClass('tdep-tem-fade-in');
                }, 50); // 50ms delay for smoother transition
            };

            // Image failed to load
            img.onerror = function() {
                console.warn('Failed to load image:', url, 'Falling back to default.'); // Add a console warning
                // Load default image on error
                $image.css('background-image', 'url("/images/default-department.jpg")'); // Ensure this path is correct
                $image.removeClass('tdep-tem-loading').addClass('tdep-tem-loaded tdep-tem-fade-in');
            };

            img.src = url;
        } else {
             // Handle cases where background-image is not set or 'none'
             console.warn('Card image background URL not found or set to "none". Applying default.');
             $image.css('background-image', 'url("/images/default-department.jpg")');
             $image.addClass('tdep-tem-loaded tdep-tem-fade-in'); // Apply loaded/fade-in classes
        }
    }

    /**
     * Applies hover styles to a card.
     * @param {jQuery} card - The jQuery object for the card element.
     */
    function applyCardHoverStyles(card) {
        const overlay = card.find('.tdep-tem-card-overlay');
        const title = card.find('.tdep-tem-card-title');
        const readMore = card.find('.tdep-tem-read-more');

        overlay.css({
            'opacity': '0.9',
            'background': 'linear-gradient(to bottom, rgba(255, 107, 53, 0.3), rgba(255, 107, 53, 0.9))' // Example hover gradient
        });
        title.addClass('tdep-tem-title-hover');
        readMore.addClass('tdep-tem-read-more-hover');
    }

    /**
     * Removes hover styles from a card.
     * @param {jQuery} card - The jQuery object for the card element.
     */
    function removeCardHoverStyles(card) {
        const overlay = card.find('.tdep-tem-card-overlay');
        const title = card.find('.tdep-tem-card-title');
        const readMore = card.find('.tdep-tem-read-more');

        overlay.css({
            'opacity': '0.7', // Default opacity
            'background': 'linear-gradient(to bottom, rgba(26, 71, 137, 0.2), rgba(26, 71, 137, 0.8))' // Default gradient
        });
        title.removeClass('tdep-tem-title-hover');
        readMore.removeClass('tdep-tem-read-more-hover');
    }

    /**
     * Handles keydown events on card links for accessibility.
     * @param {Event} e - The keydown event object.
     * @param {jQuery} $link - The jQuery object for the link element.
     */
    function handleCardLinkKeyDown(e, $link) {
        const card = $link.closest('.tdep-tem-card');

        switch (e.key) {
            case 'Enter':
            case ' ': // Space bar
                e.preventDefault(); // Prevent default space bar scroll
                window.location.href = $link.attr('href');
                break;
            case 'Tab':
                // Remove hover effect when tabbing *out* of the last focusable element within the card
                // This logic might need adjustment depending on the exact structure and desired behavior
                if (!e.shiftKey && $link.is(':last-child')) { // Simple check, might need refinement
                    removeCardHoverStyles(card);
                }
                break;
        }
    }

    /**
     * Performs the search/filtering logic based on the input term.
     * @param {string} searchTerm - The search term entered by the user.
     */
    function performSearchFilter(searchTerm) {
        $('.tdep-tem-card').each(function() {
            const card = $(this);
            // Combine searchable text content for efficiency
            const cardText = (
                card.find('.tdep-tem-card-title').text() + ' ' +
                card.find('.tdep-tem-card-excerpt').text() + ' ' +
                card.find('.tdep-tem-category-tag').text() // Assumes tags are within the card
            ).toLowerCase();

            // Use indexOf for potentially faster checks than includes in older browsers
            if (cardText.indexOf(searchTerm) > -1) {
                 // Use show/hide for potentially better performance than fadeIn/fadeOut with many items
                card.show();
            } else {
                card.hide();
            }
        });
        // Optional: Add a message if no results found
        if ($('.tdep-tem-card:visible').length === 0) {
             // Ensure you have an element with class 'tdep-tem-no-results' or similar
             $('.tdep-tem-no-results').show();
        } else {
             $('.tdep-tem-no-results').hide();
        }
    }

     /**
      * Loads more posts via AJAX for infinite scroll.
      * @param {number} currentPage - The current page number.
      * @param {jQuery} container - The container to append new posts to.
      * @param {Function} onComplete - Callback function when loading is complete (success or fail).
      * @returns {number} The next page number if successful, otherwise the current page number.
      */
     function loadMorePosts(currentPage, container, onComplete) {
        const nextPage = currentPage + 1;
        let success = false; // Flag to track success

        $.ajax({
            url: window.location.href, // Consider making this more robust if URL structure changes
            data: { paged: nextPage },
            type: 'GET',
            dataType: 'html', // Expecting HTML fragment
            success: function(response) {
                // Check if the response is valid HTML before processing
                try {
                    const $html = $(response);
                    const $newPosts = $html.find('.tdep-tem-card'); // Find cards within the response

                    if ($newPosts.length) {
                        // Append new posts and re-initialize card features
                        container.append($newPosts);
                        initTdepTemCards(); // Re-run card initialization for new items
                        success = true; // Mark as successful
                    } else {
                        // No more posts found, maybe disable further scrolling
                        console.log('Infinite scroll: No more posts found.');
                        $(window).off('scroll.infiniteScroll'); // Turn off scroll listener
                    }
                } catch (e) {
                    console.error('Infinite scroll: Error parsing AJAX response.', e);
                     $(window).off('scroll.infiniteScroll'); // Turn off scroll listener on error
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('Infinite scroll AJAX error:', textStatus, errorThrown);
                 $(window).off('scroll.infiniteScroll'); // Turn off scroll listener on error
            },
            complete: function() {
                // Call the completion callback, passing the success status
                onComplete(success);
            }
        });

        // Return the potential next page number (only relevant if successful)
        return success ? nextPage : currentPage;
     }


    // --- Initialization Functions ---

    /**
     * Initializes card behaviors (image loading, hover, keyboard nav).
     */
    function initTdepTemCards() {
        const cards = $('.tdep-tem-card');

        // Initialize image loading for each card image
        cards.find('.tdep-tem-card-image').each(function() {
            handleImageLoading($(this));
        });

        // Initialize hover effects for each card
        cards.each(function() {
            const card = $(this);
            card.hover(
                () => applyCardHoverStyles(card),
                () => removeCardHoverStyles(card)
            );
        });

        // Initialize keyboard navigation and focus/blur handlers for card links
        $('.tdep-tem-card-link') // Target links more specifically if needed
            .off('keydown.cardNav focus.cardNav blur.cardNav') // Prevent duplicate bindings
            .on('keydown.cardNav', function(e) {
                handleCardLinkKeyDown(e, $(this));
            })
            .on('focus.cardNav', function() {
                // Apply hover styles on focus for accessibility
                applyCardHoverStyles($(this).closest('.tdep-tem-card'));
            })
            .on('blur.cardNav', function() {
                // Remove hover styles on blur
                removeCardHoverStyles($(this).closest('.tdep-tem-card'));
            });
    }

    /**
     * Initializes infinite scroll functionality.
     */
    function initTdepTemInfiniteScroll() {
        // Check if pagination or a specific marker exists to enable infinite scroll
        if (!$('.tdep-tem-pagination').length && !$('#load-more-trigger').length) { // Example: Check for pagination or a trigger element
             console.log("Infinite scroll trigger not found. Skipping initialization.");
             return;
        }

        let loading = false;
        let page = 1; // Assume starting on page 1
        const container = $('.tdep-tem-grid'); // Ensure this selector is correct
        const loadMoreThreshold = 300; // Pixels from bottom to trigger loading

        // Use namespaced event for easier removal
        $(window).off('scroll.infiniteScroll').on('scroll.infiniteScroll', function() {
            // Prevent multiple simultaneous loads and check if container exists
            if (loading || !container.length) return;

            // Check if user scrolled near the bottom
            const scrollPosition = $(window).scrollTop() + $(window).height();
            const documentHeight = $(document).height();

            if (documentHeight - scrollPosition < loadMoreThreshold) {
                loading = true;
                // Add a visual loading indicator (optional)
                $('.tdep-tem-loading-indicator').show(); // Ensure this element exists

                // Call loadMorePosts and handle completion
                page = loadMorePosts(page, container, function(success) {
                     loading = false; // Reset loading flag regardless of success
                     $('.tdep-tem-loading-indicator').hide(); // Hide indicator
                     if (!success) {
                         // Optionally display a message or handle the failure case
                         console.log("Failed to load more posts or no more posts available.");
                     }
                });
            }
        });
    }

    /**
     * Initializes search input and filtering functionality.
     */
    function initTdepTemSearchFilter() {
        // Check if the container exists before adding search
        const container = $('.tdep-tem-container');
        if (!container.length) {
            console.warn("Search filter container '.tdep-tem-container' not found.");
            return;
        }

        // Check if search input already exists
        let searchInput = container.find('.tdep-tem-search');
        if (!searchInput.length) {
            searchInput = $('<input>', {
                type: 'search', // Use type="search" for better semantics and potential browser UI
                class: 'tdep-tem-search',
                placeholder: 'ค้นหาบทความ...' // Search posts... (Thai)
            });
            // Prepend the search input to the container
            container.prepend(searchInput);
             // Add placeholder for no results message (initially hidden)
             container.append('<div class="tdep-tem-no-results" style="display: none;">ไม่พบบทความที่ตรงกัน</div>');
        }


        let searchTimeout;
        // Use 'input' event for immediate feedback, keyup is also an option
        searchInput.off('input.searchFilter').on('input.searchFilter', function() {
            clearTimeout(searchTimeout);
            const searchTerm = $(this).val().toLowerCase().trim(); // Trim whitespace

            // Debounce the search function call
            searchTimeout = setTimeout(() => {
                performSearchFilter(searchTerm);
            }, 300); // 300ms delay
        });
    }

    /**
     * Utility function for CSS animations (example - kept original structure).
     * Consider using jQuery's animate or CSS transitions for simpler cases.
     * @param {jQuery} element - The element to animate.
     * @param {string} animation - The animation class suffix (e.g., 'fade-in').
     * @param {Function} [callback] - Optional callback after animation ends.
     */
    function animateTdepTemCSS(element, animation, callback) {
        const animationName = `tdep-tem-${animation}`; // Assumes CSS classes like .tdep-tem-fade-in
        const node = element[0]; // Get the DOM node

        // Ensure node exists
        if (!node) return;

        // Function to handle the end of the animation
        function handleAnimationEnd(event) {
            // Prevent event bubbling from interfering
            if (event.target === node) {
                event.stopPropagation();
                node.classList.remove(animationName); // Clean up class
                node.removeEventListener('animationend', handleAnimationEnd); // Remove listener
                if (callback && typeof callback === 'function') {
                    callback(); // Execute the callback
                }
            }
        }

        // Add listener before adding class
        node.addEventListener('animationend', handleAnimationEnd);
        node.classList.add(animationName); // Add class to trigger animation
    }


    // --- Main Initialization ---
    $(document).ready(function() {
        initTdepTemCards();
        initTdepTemInfiniteScroll();
        initTdepTemSearchFilter();
        // Example usage of the animation utility (if needed)
        // animateTdepTemCSS($('.some-element'), 'slide-up', () => console.log('Animation complete!'));
    });

})(jQuery);
