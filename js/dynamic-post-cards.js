(function($) {
    'use strict';

    // --- Utility Functions ---

    function showLoading() {
        if ($('.loading-overlay').length === 0) {
            $('<div class="loading-overlay"><div class="loading-spinner"></div></div>').appendTo('body');
        }
        $('.loading-overlay').addClass('show');
    }

    function hideLoading() {
        $('.loading-overlay').removeClass('show');
    }

    function showToast(message) {
        $('.document-table-toast').remove(); // Remove old toast if exists
        const toast = $('<div>')
            .addClass('document-table-toast')
            .text(message)
            .appendTo('body');

        setTimeout(function() {
            toast.addClass('show');
        }, 100); // Short delay for transition

        setTimeout(function() {
            toast.removeClass('show');
            setTimeout(function() {
                toast.remove();
            }, 300); // Remove after fade out
        }, 3000); // Display duration
    }

    // --- Core Functions ---

    /**
     * Sets up jQuery UI Autocomplete for the search input.
     */
    function setupAutocomplete(container, state, loadPostsCallback) {
        const searchInput = container.find('.autocomplete-search');
        if (!searchInput.length || typeof $.ui === 'undefined' || typeof $.ui.autocomplete === 'undefined') {
            console.warn('Autocomplete input not found or jQuery UI Autocomplete not loaded.');
            return;
        }

        // Ensure dynamic_post_cards_params is available
        if (typeof dynamic_post_cards_params === 'undefined' || !dynamic_post_cards_params.ajax_url || !dynamic_post_cards_params.nonce) {
            console.error('dynamic_post_cards_params is not defined or incomplete.');
            return;
        }


        searchInput.autocomplete({
            source: function(request, response) {
                $.ajax({
                    url: dynamic_post_cards_params.ajax_url,
                    dataType: "json",
                    data: {
                        action: 'dynamic_post_cards_autocomplete',
                        nonce: dynamic_post_cards_params.nonce,
                        term: request.term,
                        post_type: state.postType
                    },
                    success: function(data) {
                        response(data || []); // Ensure response is always an array
                    },
                    error: function() {
                        response([]); // Return empty array on error
                    }
                });
            },
            minLength: 2,
            select: function(event, ui) {
                // 1. Prevent the default action (like setting the value AND closing the menu)
                event.preventDefault();

                // 2. Guard clause: Handle cases where the selected item is invalid
                if (!ui.item) {
                    console.warn('Autocomplete select: ui.item is missing.');
                    // Returning false here is acceptable for an early exit/failure condition.
                    return false;
                }

                // 3. Manually set the input field's value
                $(this).val(ui.item.value);

                // 4. Determine the actual search term based on item type
                if (ui.item.type === 'custom_field' && ui.item.id) {
                    state.selectedPostId = ui.item.id;
                    // Use the specific ID for searching when a custom field item is selected
                    state.search = ui.item.id.toString();
                } else {
                    state.selectedPostId = null;
                    // Use the displayed value for searching otherwise
                    state.search = ui.item.value;
                }

                // 5. Clear any active badge filter when a search term is selected
                state.filterField = '';
                container.find('.filter-badge').removeClass('active');

                // 6. Reset pagination to the first page
                state.paged = 1;

                // 7. Trigger the loading of posts with the new search term/state
                loadPostsCallback();

                // 8. No 'return false;' here. The function implicitly returns undefined.
                //    preventDefault() was called at the beginning. stopPropagation()
                //    is usually not strictly necessary here and was the only remaining
                //    effect of the original 'return false;'.
            },
            position: { // Adjust dropdown position
                my: "left top+5",
                at: "left bottom",
                collision: "flip"
            },
            appendTo: container // Append dropdown to the container
        }).autocomplete("instance")._renderItem = function(ul, item) {
            // Custom rendering for autocomplete items
            let itemClass = "ui-menu-item-wrapper";
            let itemContent = item.label || item.value; // Fallback to value if label is missing

            // Add badge styling if it's a custom field result
            if (item.type === 'custom_field') {
                const badgeClass = item.meta_key === 'at_docnum_1' ? 'orange-badge-mini' : (item.meta_key === 'at_docnum_2' ? 'gold-badge-mini' : '');
                if (badgeClass) {
                    itemClass += " has-badge " + badgeClass;
                    // Optionally add data-badge attribute if CSS uses it
                    // return $("<li>").append(`<div class='${itemClass}' data-badge='${item.meta_key === 'at_docnum_1' ? 'มสพร.' : 'มรด.'}'>${itemContent}</div>`).appendTo(ul);
                }
            }

            return $("<li>")
                .append("<div class='" + itemClass + "'>" + itemContent + "</div>")
                .appendTo(ul);
        };

         // Add custom class to the dropdown when it opens
        searchInput.on('autocompleteopen', function() {
             // Use instance().menu.element to target the specific dropdown
             $(this).autocomplete("instance").menu.element.addClass('dynamic-post-cards-autocomplete');
        });
    }

    /**
     * Sets up the toggle button for mobile filters.
     */
    function setupMobileFilterToggle(container) {
        const controls = container.find('.dynamic-post-cards-controls');
        const filterControls = container.find('.filter-controls');
        if (!controls.length || !filterControls.length) return;

        const toggleButtonId = container.attr('id') + '-mobile-toggle';
        // Check if button already exists
        if ($('#' + toggleButtonId).length > 0) {
            return;
        }

        const toggleButton = $('<button id="' + toggleButtonId + '" class="mobile-filter-toggle"><span class="dashicons dashicons-admin-generic"></span></button>');
        controls.prepend(toggleButton); // Add button to the controls area

        toggleButton.on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            filterControls.toggleClass('active'); // Toggle visibility class
        });

        // Close menu when clicking outside
        $(document).on('click', function(event) {
            const $target = $(event.target);
            // Check if the click is outside the filter controls AND outside the toggle button
            if (!$target.closest(filterControls).length && !$target.is(toggleButton) && !$target.closest(toggleButton).length) {
                 if (filterControls.hasClass('active')) {
                     filterControls.removeClass('active');
                 }
            }
        });
    }

    /**
     * Sets up various event listeners for controls.
     */
    function setupEventListeners(container, state, contentContainer, noResultsMessage, loadMoreBtn, loadPostsCallback, renderPostsCallback) {
        // View mode toggle
        container.find('.view-mode-btn').on('click', function() {
            const $this = $(this);
            if ($this.hasClass('active')) return; // Do nothing if already active

            const viewMode = $this.hasClass('card-view-btn') ? 'card' : 'list';
            container.find('.view-mode-btn').removeClass('active');
            $this.addClass('active');
            contentContainer.removeClass('card-view list-view').addClass(viewMode + '-view');
            state.view = viewMode;
            // Re-render existing posts with the new view (if posts exist)
            renderPostsCallback(state.currentPosts || [], false); // false = not appending
        });

        // Sorting select
        container.find('.sorting-select').on('change', function() {
            const sortValue = $(this).val();
            const [sortBy, sortOrder] = sortValue.split('-');
            if (state.orderby !== sortBy || state.order !== sortOrder.toUpperCase()) {
                state.orderby = sortBy;
                state.order = sortOrder.toUpperCase();
                state.paged = 1;
                loadPostsCallback();
            }
        });

        // Filter badges
        container.find('.filter-badge').on('click', function() {
            const $this = $(this);
            const field = $this.data('field');

            if ($this.hasClass('active')) { // Clicked active badge - deactivate
                state.filterField = '';
                $this.removeClass('active');
            } else { // Clicked inactive badge - activate
                state.filterField = field;
                container.find('.filter-badge').removeClass('active'); // Deactivate others
                $this.addClass('active');
                // Clear search if activating a filter
                if (state.search !== '') {
                    state.search = '';
                    state.selectedPostId = null;
                    container.find('.search-input').val('');
                }
            }
            state.paged = 1;
            loadPostsCallback();
        });

        // Search input with debounce
        let searchTimer = null;
        container.find('.search-input').on('input', function() {
            const searchTerm = $(this).val().trim();

            // Clear selectedPostId on manual input
            if (state.selectedPostId !== null) {
                 state.selectedPostId = null;
            }

            // Clear badge filter if searching
            if (searchTerm !== '' && state.filterField !== '') {
                state.filterField = '';
                container.find('.filter-badge').removeClass('active');
            }

            clearTimeout(searchTimer); // Clear previous timer
            searchTimer = setTimeout(() => {
                if (state.search !== searchTerm) { // Only search if term changed
                    state.search = searchTerm;
                    state.paged = 1;
                    loadPostsCallback();
                }
            }, 500); // 500ms debounce
        });

         // Prevent form submission on Enter key in search input
         container.find('.search-input').on('keypress', function(e) {
            if (e.which === 13) { // 13 is the Enter key code
                e.preventDefault();
                // Optionally trigger search immediately on Enter
                // clearTimeout(searchTimer);
                // if (state.search !== $(this).val().trim()) {
                //     state.search = $(this).val().trim();
                //     state.paged = 1;
                //     loadPostsCallback();
                // }
            }
        });


        // Year filter select
        container.find('.year-filter-select').on('change', function() {
            const yearValue = $(this).val();
            if (state.year !== yearValue) {
                state.year = yearValue;
                state.paged = 1;
                loadPostsCallback();
            }
        });

        // Load more button
        loadMoreBtn.on('click', function() {
            if (state.paged < state.maxPages && !state.isLoading) {
                state.paged++;
                loadPostsCallback(true); // true = append mode
            }
        });
    }

    /**
     * Renders posts into the content container.
     */
    function renderPosts(posts, contentContainer, noResultsMessage, state, append = false) {
        if (!append) {
            contentContainer.empty(); // Clear container if not appending
        }

        if (!Array.isArray(posts) || posts.length === 0) {
            if (!append) { // Only show "no results" if it's the initial load or filter change
                noResultsMessage.show();
            }
            // If appending and no more posts, the load more button should already be hidden
            return;
        }

        noResultsMessage.hide(); // Hide "no results" because we have posts

        const fragment = document.createDocumentFragment(); // Use fragment for better performance

        posts.forEach(post => {
            // Basic sanitization/validation
            const title = post.title || 'Untitled';
            const permalink = post.permalink || '#';
            const featuredImage = post.featured_image || dynamic_post_cards_params.placeholder_image || 'https://placehold.co/300x200/e0e0e0/757575?text=No+Image';
            const date = post.date || '';
            const visitorCount = post.visitor_count || '';
            const excerpt = post.excerpt || '';
            const docNum1 = post.at_docnum_1 || '';
            const docNum2 = post.at_docnum_2 || '';

            let postHtml = '';
            // Use placeholder for missing images or on error
            const imgAttributes = `src="${featuredImage}" alt="${title}" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='${dynamic_post_cards_params.placeholder_image || 'https://placehold.co/300x200/e0e0e0/757575?text=Error'}';"`;

            // Determine badge HTML
            let badgeHtml = '';
            if (docNum2) {
                badgeHtml = `<div class="doc-badge gold-badge" title="เลขที่ มรด. ${docNum2}">เลขที่ มรด. ${docNum2}</div>`;
            } else if (docNum1) {
                badgeHtml = `<div class="doc-badge orange-badge" title="เลขที่ มสพร. ${docNum1}">เลขที่ มสพร. ${docNum1}</div>`;
            }

            // Generate HTML based on view mode
            if (state.view === 'card') {
                postHtml = `
                    <div class="card-item">
                        <a href="${permalink}" class="card-image-link" title="${title}">
                            <img ${imgAttributes} class="card-image">
                            ${badgeHtml}
                        </a>
                        <div class="card-content">
                             <div class="card-meta">
                                <span class="post-date">${date}</span>
                                ${visitorCount ? `<span class="visitor-count">${visitorCount}</span>` : ''}
                            </div>
                            <h3 class="card-title" title="${title}">
                                <a href="${permalink}">${title}</a>
                            </h3>
                            <div class="card-excerpt">${excerpt}</div>
                            <div class="card-footer">
                                <a href="${permalink}" class="read-more-btn">อ่านต่อ</a>
                            </div>
                        </div>
                    </div>`;
            } else { // List view
                postHtml = `
                    <div class="list-item">
                        <a href="${permalink}" class="list-image-link" title="${title}">
                            <img ${imgAttributes} class="list-image">
                            ${badgeHtml}
                        </a>
                        <div class="list-content">
                            <h3 class="list-title" title="${title}">
                                <a href="${permalink}">${title}</a>
                            </h3>
                            <div class="list-meta">
                                <span class="post-date">${date}</span>
                                 ${visitorCount ? `<span class="visitor-count">${visitorCount}</span>` : ''}
                            </div>
                            <div class="list-excerpt">${excerpt}</div>
                            <div class="list-footer">
                                <a href="${permalink}" class="read-more-btn">อ่านต่อ</a>
                            </div>
                        </div>
                    </div>`;
            }
            // Use jQuery to parse the HTML string and append to the fragment
             $(fragment).append(postHtml);
        });

        contentContainer.append(fragment); // Append the fragment to the DOM

        // Optional: Scroll to new posts if appending
        // if (append && posts.length > 0) {
        //     const firstNewPost = contentContainer.children().last().prevAll().slice(posts.length - 1).first();
        //     if (firstNewPost.length) {
        //         $('html, body').animate({
        //             scrollTop: firstNewPost.offset().top - 30 // Adjust offset as needed
        //         }, 500);
        //     }
        // }
    }


    /**
     * Performs the AJAX request to fetch posts. Returns a Promise.
     */
     function fetchPosts(state) {
         // Ensure dynamic_post_cards_params is available
        if (typeof dynamic_post_cards_params === 'undefined' || !dynamic_post_cards_params.ajax_url || !dynamic_post_cards_params.nonce) {
            console.error('dynamic_post_cards_params is not defined or incomplete for fetchPosts.');
            return Promise.reject('AJAX configuration missing.'); // Return a rejected promise
        }

        return new Promise((resolve, reject) => {
            $.ajax({
                url: dynamic_post_cards_params.ajax_url,
                type: 'POST',
                data: {
                    action: 'dynamic_post_cards_load_posts',
                    nonce: dynamic_post_cards_params.nonce,
                    post_type: state.postType,
                    posts_per_page: state.postsPerPage,
                    paged: state.paged,
                    category: state.category,
                    orderby: state.orderby,
                    order: state.order,
                    search: state.search,
                    year: state.year,
                    filter_field: state.filterField,
                    // Include selectedPostId if you want server to prioritize it
                    // selected_post_id: state.selectedPostId
                },
                dataType: 'json', // Expect JSON response
                success: function(response) {
                    if (response && response.success) {
                        // Ensure posts is an array, default to empty array if missing
                        response.posts = Array.isArray(response.posts) ? response.posts : [];
                        resolve(response);
                    } else {
                        // Reject with a specific error message if available
                        reject(response ? response.data || 'Server indicated failure.' : 'Empty or invalid success response.');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('AJAX error details:', status, error, xhr);
                    reject(`AJAX Error: ${status} - ${error || 'Request failed'}`); // Reject with error details
                }
            });
        });
    }

    /**
     * Handles the successful response from fetchPosts.
     */
     function handleLoadPostsSuccess(response, state, append, contentContainer, noResultsMessage, loadMoreBtn, renderPostsCallback) {
        state.currentPosts = append
            ? (state.currentPosts || []).concat(response.posts)
            : response.posts;
        state.maxPages = response.max_pages || 1; // Default to 1 if missing

        renderPostsCallback(response.posts, append); // Render the newly fetched posts

        // Update UI based on results
        if (state.currentPosts.length === 0 && !append) {
            noResultsMessage.show();
        } else {
            noResultsMessage.hide();
        }

        // Update Load More button state
        if (state.paged < state.maxPages) {
            loadMoreBtn.text('โหลดเพิ่มเติม').show().prop('disabled', false);
        } else {
            loadMoreBtn.hide();
        }
    }

    /**
     * Handles errors from fetchPosts (AJAX error or success:false).
     */
    function handleLoadPostsError(error, state, append, contentContainer, noResultsMessage, loadMoreBtn) {
        console.error('Error loading posts:', error);
        // Show "no results" only if it's not an append operation and the container is empty
        if (!append && (!state.currentPosts || state.currentPosts.length === 0)) {
             contentContainer.empty(); // Clear potentially existing skeletons
             noResultsMessage.text('เกิดข้อผิดพลาดในการโหลดข้อมูล').show(); // Show specific error message
        }
        loadMoreBtn.hide(); // Hide load more on error
    }


    /**
     * Creates the loadPosts function with closure over its dependencies.
     * This is the function that will be called to trigger loading/reloading.
     */
    function createLoadPostsFunction(state, contentContainer, loadingContainer, noResultsMessage, loadMoreBtn, renderPostsCallback) {
        // This is the actual function that gets called by event handlers etc.
        return function(append = false) {
            if (state.isLoading) return; // Prevent concurrent requests

            state.isLoading = true;
            noResultsMessage.hide(); // Hide message initially

            // Update UI to show loading state
            if (!append) {
                contentContainer.empty(); // Clear previous results
                loadingContainer.show(); // Show skeleton loader
                loadMoreBtn.hide(); // Hide load more during initial load/filter
            } else {
                loadMoreBtn.text('กำลังโหลด...').prop('disabled', true); // Update load more button text/state
            }

            // Perform the fetch operation using the extracted function
            fetchPosts(state)
                .then(response => {
                    // Call the success handler
                    handleLoadPostsSuccess(response, state, append, contentContainer, noResultsMessage, loadMoreBtn, renderPostsCallback);
                })
                .catch(error => {
                    // Call the error handler
                    handleLoadPostsError(error, state, append, contentContainer, noResultsMessage, loadMoreBtn);
                })
                .finally(() => {
                    // Always executes after promise settles (success or error)
                    state.isLoading = false;
                    loadingContainer.hide(); // Hide skeleton loader
                    // Ensure Load More button text is reset if it's still visible
                    if (state.paged < state.maxPages) {
                         loadMoreBtn.text('โหลดเพิ่มเติม').prop('disabled', false);
                    } else {
                         loadMoreBtn.hide(); // Ensure it's hidden if on last page
                    }
                });
        };
    }


    /**
     * Initializes the dynamic post cards functionality for a given container.
     */
    function initPostCards(container) {
        const contentContainer = container.find('.dynamic-post-cards-content');
        const loadingContainer = container.find('.dynamic-post-cards-loading'); // Assume skeleton/loading indicator container
        const loadMoreBtn = container.find('.load-more-btn');
        const noResultsMessage = container.find('.no-results-message');

        // Basic validation for essential elements
        if (!contentContainer.length || !loadMoreBtn.length || !noResultsMessage.length) {
             console.error('Initialization failed: Essential elements missing in container:', container.attr('id'));
             return;
        }


        // Initial state based on data attributes and defaults
        const state = {
            postType: container.data('post-type') || 'post',
            postsPerPage: container.data('posts-per-page') || 10,
            category: container.data('category') || '',
            orderby: 'date',
            order: 'DESC',
            paged: 1,
            maxPages: 1,
            view: container.data('view') || 'card', // Default view
            isLoading: false,
            search: '',
            year: container.find('.year-filter-select').val() || '', // Initial year from select
            searchTimer: null, // For debounce
            selectedPostId: null, // Store ID from autocomplete selection
            filterField: '', // Store active badge filter field
            currentPosts: [] // Store currently displayed posts
        };

        // Set initial view class
        contentContainer.addClass(state.view + '-view');
        container.find(`.${state.view}-view-btn`).addClass('active');


        // Create the renderPosts callback specific to this container
        const renderPostsCallback = function(posts, append = false) {
            renderPosts(posts, contentContainer, noResultsMessage, state, append);
        };

        // Create the loadPosts function specific to this container
        const loadPosts = createLoadPostsFunction(
            state,
            contentContainer,
            loadingContainer,
            noResultsMessage,
            loadMoreBtn,
            renderPostsCallback // Pass the specific render function
        );

        // Setup UI components and event listeners
        setupAutocomplete(container, state, loadPosts); // Pass the loadPosts function
        setupMobileFilterToggle(container);
        setupEventListeners(
            container,
            state,
            contentContainer,
            noResultsMessage,
            loadMoreBtn,
            loadPosts, // Pass the loadPosts function
            renderPostsCallback // Pass the specific render function
        );

        // Initial load of posts
        loadPosts();
    }

    // --- Document Ready ---
    // Initialize for each container found on the page
    $('.dynamic-post-cards-container').each(function() {
        const container = $(this);
        // Ensure initialization happens only once per container if needed
        if (!container.data('dpc-initialized')) {
             initPostCards(container);
             container.data('dpc-initialized', true);
        }
    });

})(jQuery);
