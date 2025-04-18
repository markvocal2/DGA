/**
 * CKAN List JavaScript
 * ckan-list.js
 */

(function($) {
    'use strict';
    
    // Variables for search functionality
    let searchTimeout;
    let currentSearchTerm = '';
    
    // Initialize when document is ready
    $(document).ready(function() {
        // Show skeleton loader initially
        setTimeout(function() {
            $('#ckan-list-skeleton').hide();
            $('#ckan-list-content').fadeIn(300);
        }, 800);
        
        // Initialize view toggle
        initViewToggle();
        
        // Initialize sorting
        initSorting();
        
        // Initialize search
        initSearch();
        
        // Initialize click counter
        initClickCounter();
    });
    
    /**
     * Initialize view toggle between grid and list
     */
    function initViewToggle() {
        $('#ckan-list-grid-view').on('click', function() {
            // Update buttons
            $(this).addClass('active');
            $('#ckan-list-list-view').removeClass('active');
            
            // Update content layout
            $('#ckan-list-content').removeClass('ckan-list-list').addClass('ckan-list-grid');
            $('#ckan-list-skeleton').removeClass('ckan-list-list').addClass('ckan-list-grid');
            
            // Save preference in localStorage
            localStorage.setItem('ckan_list_view', 'grid');
        });
        
        $('#ckan-list-list-view').on('click', function() {
            // Update buttons
            $(this).addClass('active');
            $('#ckan-list-grid-view').removeClass('active');
            
            // Update content layout
            $('#ckan-list-content').removeClass('ckan-list-grid').addClass('ckan-list-list');
            $('#ckan-list-skeleton').removeClass('ckan-list-grid').addClass('ckan-list-list');
            
            // Save preference in localStorage
            localStorage.setItem('ckan_list_view', 'list');
        });
        
        // Load saved preference
        const savedView = localStorage.getItem('ckan_list_view');
        if (savedView === 'list') {
            $('#ckan-list-list-view').trigger('click');
        }
    }
    
    /**
     * Initialize sorting functionality
     */
    function initSorting() {
        $('#ckan-list-sort-select').on('change', function() {
            const sortValue = $(this).val();
            let url = new URL(window.location.href);
            
            // Parse the sort value
            const [orderby, order] = sortValue.split('-');
            
            // Update URL parameters
            url.searchParams.set('orderby', orderby);
            url.searchParams.set('order', order.toUpperCase());
            
            // Reset to page 1 when sorting
            url.searchParams.delete('paged');
            
            // Navigate to the sorted page
            window.location.href = url.toString();
        });
    }
    
    /**
     * Initialize search functionality with autocomplete
     */
    function initSearch() {
        const searchInput = $('#ckan-list-search-input');
        const searchResults = $('#ckan-list-search-results');
        
        // Handle input changes with debounce
        searchInput.on('input', function() {
            const searchTerm = $(this).val().trim();
            
            // Clear previous timeout
            clearTimeout(searchTimeout);
            
            // Don't search if input is empty or unchanged
            if (searchTerm === '' || searchTerm === currentSearchTerm) {
                searchResults.hide();
                return;
            }
            
            // Set a timeout for the search to reduce AJAX calls
            searchTimeout = setTimeout(function() {
                performSearch(searchTerm);
            }, 400);
        });
        
        // Handle search button click
        $('#ckan-list-search-button').on('click', function(e) {
            e.preventDefault();
            const searchTerm = searchInput.val().trim();
            
            if (searchTerm !== '') {
                performSearch(searchTerm, true);
            }
        });
        
        // Handle search input keypress
        searchInput.on('keypress', function(e) {
            if (e.which === 13) { // Enter key
                e.preventDefault();
                const searchTerm = $(this).val().trim();
                
                if (searchTerm !== '') {
                    performSearch(searchTerm, true);
                }
            }
        });
        
        // Hide search results when clicking outside
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.ckan-list-search').length) {
                searchResults.hide();
            }
        });
    }
    
    /**
     * Perform AJAX search request
     * @param {string} searchTerm - The search term
     * @param {boolean} replaceContent - Whether to replace content with results
     */
    function performSearch(searchTerm, replaceContent = false) {
        currentSearchTerm = searchTerm;
        
        $.ajax({
            url: ckan_list_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_list_search',
                nonce: ckan_list_ajax.nonce,
                search_term: searchTerm
            },
            beforeSend: function() {
                if (replaceContent) {
                    // Show skeleton loader
                    $('#ckan-list-content').hide();
                    $('#ckan-list-skeleton').show();
                } else {
                    // Show loading state in dropdown
                    searchResults.html('<div class="ckan-list-search-loading">กำลังค้นหา...</div>').show();
                }
            },
            success: function(response) {
                if (response.success) {
                    const posts = response.data.posts;
                    
                    if (replaceContent) {
                        // Replace main content with search results
                        updateMainContent(posts);
                    } else {
                        // Update autocomplete dropdown
                        updateSearchResults(posts);
                    }
                } else {
                    console.error('Search failed:', response.data.message);
                }
            },
            error: function() {
                console.error('AJAX request failed');
            }
        });
    }
    
    /**
     * Update autocomplete search results dropdown
     * @param {Array} posts - Array of post objects
     */
    function updateSearchResults(posts) {
        const searchResults = $('#ckan-list-search-results');
        
        if (posts.length === 0) {
            searchResults.html('<div class="ckan-list-search-no-results">ไม่พบผลลัพธ์</div>');
            return;
        }
        
        let html = '';
        posts.slice(0, 5).forEach(function(post) {
            html += `
                <div class="ckan-list-search-result-item" data-post-id="${post.id}">
                    <div class="ckan-list-search-result-title">${post.title}</div>
                </div>
            `;
        });
        
        if (posts.length > 5) {
            html += `<div class="ckan-list-search-more">แสดงผลทั้งหมด ${posts.length} รายการ</div>`;
        }
        
        searchResults.html(html).show();
        
        // Handle clicking on a search result
        $('.ckan-list-search-result-item').on('click', function() {
            const postId = $(this).data('post-id');
            const post = posts.find(p => p.id === postId);
            
            if (post) {
                window.location.href = post.permalink;
            }
        });
        
        // Handle "show all results" click
        $('.ckan-list-search-more').on('click', function() {
            performSearch(currentSearchTerm, true);
            searchResults.hide();
        });
    }
    
    /**
     * Update main content with search results
     * @param {Array} posts - Array of post objects
     */
    function updateMainContent(posts) {
        const contentContainer = $('#ckan-list-content');
        
        if (posts.length === 0) {
            contentContainer.html('<div class="ckan-list-no-results"><p>ไม่พบชุดข้อมูลที่ค้นหา</p></div>');
            $('#ckan-list-skeleton').hide();
            contentContainer.show();
            return;
        }
        
        let html = '';
        
        posts.forEach(function(post) {
            html += `
                <div class="ckan-list-item" data-post-id="${post.id}">
                    <div class="ckan-list-item-header">
                        <h3 class="ckan-list-item-title">
                            <a href="${post.permalink}" data-post-id="${post.id}" class="ckan-list-item-link">
                                ${post.title}
                            </a>
                        </h3>
                        <div class="ckan-list-item-views">
                            <span class="ckan-list-item-total-views" title="จำนวนการเข้าชมทั้งหมด">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                ${post.total_views}
                            </span>
                            <span class="ckan-list-item-recent-views" title="จำนวนการเข้าชมล่าสุด">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                ${post.recent_views}
                            </span>
                        </div>
                    </div>
                    
                    <div class="ckan-list-item-taxonomies">
            `;
            
            // Add first row taxonomies
            post.taxonomy_row1.forEach(function(tax) {
                html += `<span class="ckan-list-taxonomy-tag tag-${tax.taxonomy}">${tax.term}</span>`;
            });
            
            html += `
                    </div>
                    
                    <div class="ckan-list-item-excerpt">
                        ${post.excerpt}
                    </div>
                    
                    <div class="ckan-list-item-taxonomies-row3">
            `;
            
            // Add third row taxonomies
            post.taxonomy_row3.forEach(function(tax) {
                html += `<span class="ckan-list-taxonomy-tag tag-${tax.taxonomy}">${tax.term}</span>`;
            });
            
            html += `
                    </div>
                    
                    <div class="ckan-list-item-footer">
                        <div class="ckan-list-item-org">
            `;
            
            // Add fourth row taxonomies
            post.taxonomy_row4.forEach(function(tax) {
                html += `<span class="ckan-list-taxonomy-tag tag-${tax.taxonomy}">${tax.term}</span>`;
            });
            
            html += `
                        </div>
                        <div class="ckan-list-item-date">
                            ${post.creation_date}
                        </div>
                    </div>
                </div>
            `;
        });
        
        contentContainer.html(html);
        $('#ckan-list-skeleton').hide();
        contentContainer.show();
        
        // Reinitialize click counter for the new content
        initClickCounter();
    }
    
    /**
     * Initialize click counter for post views
     */
    function initClickCounter() {
        $('.ckan-list-item-link').on('click', function(e) {
            const postId = $(this).data('post-id');
            const viewCounters = $(this).closest('.ckan-list-item').find('.ckan-list-item-views');
            const totalViewsElement = viewCounters.find('.ckan-list-item-total-views');
            const recentViewsElement = viewCounters.find('.ckan-list-item-recent-views');
            
            // Send AJAX request to update view count
            $.ajax({
                url: ckan_list_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'ckan_list_count_view',
                    nonce: ckan_list_ajax.nonce,
                    post_id: postId
                },
                success: function(response) {
                    if (response.success) {
                        // Update view counters
                        totalViewsElement.html(`
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            ${response.data.total_views}
                        `);
                        
                        recentViewsElement.html(`
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            ${response.data.recent_views}
                        `);
                    }
                }
            });
        });
    }
    
})(jQuery);