// Save as custom-ajax-search.js in your child theme's js folder
jQuery(document).ready(function($) {
    let searchTimeout;
    const searchInput = $('#search_query');
    const searchType = $('#search_type');
    const resultsContainer = $('.search-results-content');
    const searchResults = $('.search-results');
    const skeletonLoader = $('.search-skeleton');
    const searchContainer = $('.custom-search-container');
    
    // Function to show skeleton loader
    function showSkeletonLoader() {
        skeletonLoader.removeClass('hidden');
        resultsContainer.empty();
    }
    
    // Function to hide skeleton loader
    function hideSkeletonLoader() {
        skeletonLoader.addClass('hidden');
    }
    
    // Function to hide results
    function hideResults() {
        searchResults.addClass('hidden');
        resultsContainer.empty();
    }
    
    // Function to perform search
    function performSearch() {
        const query = searchInput.val();
        const type = searchType.val();
        
        if (query.length < 2) {
            hideResults();
            return;
        }
        
        showSkeletonLoader();
        searchResults.removeClass('hidden');
        
        $.ajax({
            url: customAjaxSearch.ajaxurl,
            type: 'POST',
            data: {
                action: 'custom_ajax_search',
                nonce: customAjaxSearch.nonce,
                search_query: query,
                search_type: type
            },
            success: function(response) {
                hideSkeletonLoader();
                if (response.success && response.data.length > 0) {
                    const results = response.data.map(item => `
                        <a href="${item.permalink}" class="search-result-item">
                            <div class="result-thumbnail">
                                <img src="${item.thumbnail}" alt="" width="40" height="40">
                            </div>
                            <div class="result-content">
                                <h3 class="result-title">${item.title}</h3>
                                <div class="result-date">${item.date}</div>
                            </div>
                        </a>
                    `).join('');
                    
                    resultsContainer.html(results);
                } else {
                    resultsContainer.html('<div class="no-results">ไม่พบผลการค้นหา</div>');
                }
            },
            error: function() {
                hideSkeletonLoader();
                resultsContainer.html('<div class="search-error">เกิดข้อผิดพลาดในการค้นหา</div>');
            }
        });
    }
    
    // Handle input changes with debouncing
    searchInput.on('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(performSearch, 300);
    });
    
    // Handle search type changes
    searchType.on('change', function() {
        if (searchInput.val().length >= 2) {
            performSearch();
        }
    });
    
    // Handle click outside
    $(document).on('click', function(e) {
        if (!searchContainer.has(e.target).length && !searchContainer.is(e.target)) {
            hideResults();
        }
    });

    // Handle mouseout from search container
    searchContainer.on('mouseleave', function() {
        if (!searchInput.is(':focus') && !searchType.is(':focus')) {
            hideResults();
        }
    });

    // Keep results visible when input or select is focused
    searchInput.on('focus', function() {
        if (searchInput.val().length >= 2) {
            searchResults.removeClass('hidden');
        }
    });

    searchType.on('focus', function() {
        if (searchInput.val().length >= 2) {
            searchResults.removeClass('hidden');
        }
    });
});