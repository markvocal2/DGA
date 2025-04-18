/**
 * Standard Loop Post - AJAX functionality
 * Handles filtering, sorting, and view toggling for posts
 */
(function($) {
    'use strict';
    
    // Store current filter state
    let filterState = {
        search: '',
        year: '',
        customField: '',
        taxonomyTerm: '', // เพิ่มตัวแปรสำหรับเก็บค่า Term ที่เลือก
        sort: 'newest',
        view: 'table', // เปลี่ยนค่าเริ่มต้นเป็น table
        paged: 1
    };
    
    // Initialize on document ready
    $(document).ready(function() {
        // Initialize event handlers for each looppost container
        $('.std-looppost-container').each(function() {
            initLoopPost($(this));
            
            // โหลดข้อมูลเริ่มต้นทันที
            loadPosts($(this));
        });
    });
    
    /**
     * Initialize a loop post container
     * @param {Object} $container - jQuery object of the container
     */
    function initLoopPost($container) {
        // Load posts on custom event
        $container.on('std_looppost_load', function() {
            loadPosts($container);
        });
        
        // Search input handling (with debounce)
        let searchTimer = null;
        $container.find('.std-looppost-search-input').on('input', function() {
            const $this = $(this);
            
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function() {
                filterState.search = $this.val();
                filterState.paged = 1; // Reset to first page on new search
                loadPosts($container);
            }, 500); // Debounce for 500ms
        });
        
        // Year filter
        $container.find('.std-looppost-year-select').on('change', function() {
            filterState.year = $(this).val();
            filterState.paged = 1;
            loadPosts($container);
        });
        
        // Taxonomy filter (เพิ่มใหม่)
        $container.find('.std-looppost-taxonomy-select').on('change', function() {
            const termSlug = $(this).val();
            filterState.taxonomyTerm = termSlug; // เก็บค่า term slug ที่เลือก
            filterState.paged = 1;
            loadPosts($container);
        });
        
        // Custom field filters (ยังเหลือไว้สำหรับ backward compatibility)
        $container.find('.std-looppost-filter-badge').on('click', function() {
            const $badge = $(this);
            const filterValue = $badge.data('filter');
            
            // Toggle active state
            if ($badge.hasClass('active')) {
                $badge.removeClass('active');
                filterState.customField = ''; // Clear filter
            } else {
                // Remove active class from all badges
                $container.find('.std-looppost-filter-badge').removeClass('active');
                
                // Add active class to clicked badge
                $badge.addClass('active');
                filterState.customField = filterValue;
            }
            
            filterState.paged = 1;
            loadPosts($container);
        });
        
        // Reset filters
        $container.find('.std-looppost-filter-reset').on('click', function() {
            // Reset filter badges
            $container.find('.std-looppost-filter-badge').removeClass('active');
            
            // Reset year select
            $container.find('.std-looppost-year-select').val('');
            
            // Reset taxonomy select (เพิ่มใหม่)
            $container.find('.std-looppost-taxonomy-select').val('');
            
            // Reset search input
            $container.find('.std-looppost-search-input').val('');
            
            // Reset filter state
            filterState.search = '';
            filterState.year = '';
            filterState.customField = '';
            filterState.taxonomyTerm = ''; // เพิ่มใหม่
            filterState.paged = 1;
            
            loadPosts($container);
        });
        
        // Sort select
        $container.find('.std-looppost-sort-select').on('change', function() {
            filterState.sort = $(this).val();
            loadPosts($container);
        });
        
        // View toggle - เหลือแค่ Card และ Table เท่านั้น
        $container.find('.std-looppost-view-btn').on('click', function() {
            const $btn = $(this);
            const view = $btn.data('view');
            
            // Don't do anything if this view is already active
            if ($btn.hasClass('active')) {
                return;
            }
            
            // Update active button
            $container.find('.std-looppost-view-btn').removeClass('active');
            $btn.addClass('active');
            
            // Update view
            const $postsContainer = $container.find('.std-looppost-posts-container');
            $postsContainer.removeClass('card-view table-view').addClass(view + '-view');
            filterState.view = view;
            
            // Handle table header visibility
            if (view === 'table') {
                if ($container.find('.std-looppost-table-header').length === 0) {
                    $postsContainer.before(
                        '<div class="std-looppost-table-header">' +
                        '<div>เลขที่</div>' +
                        '<div>ชื่อมาตรฐาน</div>' +
                        '<div>วัตถุประสงค์</div>' +
                        '</div>'
                    );
                } else {
                    $container.find('.std-looppost-table-header').show();
                }
            } else {
                $container.find('.std-looppost-table-header').hide();
            }
            
            // Reload posts for the new view
            loadPosts($container);
        });
        
        // Load more button
        $container.find('.std-looppost-load-more').on('click', function() {
            filterState.paged++;
            loadPosts($container, true); // Append = true
        });
        
        // Pagination
        $container.on('click', '.std-looppost-page-number', function(e) {
            e.preventDefault();
            
            const page = $(this).data('page');
            if (page) {
                filterState.paged = page;
                loadPosts($container);
                
                // Scroll to top of container
                $('html, body').animate({
                    scrollTop: $container.offset().top - 50
                }, 500);
            }
        });
        
        // Table row hover effect
        $container.on('mouseenter', '.std-looppost-table-row', function() {
            $(this).addClass('hover');
        }).on('mouseleave', '.std-looppost-table-row', function() {
            $(this).removeClass('hover');
        });
        
        // Table row click handler
        $container.on('click', '.std-looppost-table-row', function(e) {
            // Check if clicking a link inside the row
            if ($(e.target).closest('a').length === 0) {
                const postUrl = $(this).find('.std-looppost-table-link').attr('href');
                window.location.href = postUrl;
            }
        });
        
        // Keyboard navigation for table rows
        $container.on('keydown', '.std-looppost-table-row', function(e) {
            // Enter key
            if (e.keyCode === 13) {
                const postUrl = $(this).find('.std-looppost-table-link').attr('href');
                window.location.href = postUrl;
            }
        });
        
        // Add table header if in table view and it doesn't exist
        if (filterState.view === 'table' && $container.find('.std-looppost-table-header').length === 0) {
            $container.find('.std-looppost-posts-container').before(
                '<div class="std-looppost-table-header">' +
                '<div>เลขที่</div>' +
                '<div>ชื่อมาตรฐาน</div>' +
                '<div>วัตถุประสงค์</div>' +
                '</div>'
            );
        }
    }
    
    /**
     * Load posts via AJAX
     * @param {Object} $container - jQuery object of the container
     * @param {boolean} append - Whether to append new posts or replace existing ones
     */
    function loadPosts($container, append = false) {
        const $postsContainer = $container.find('.std-looppost-posts-container');
        const $skeleton = $container.find('.std-looppost-skeleton');
        const $pagination = $container.find('.std-looppost-pagination');
        const postsPerPage = $container.data('posts-per-page') || 15;
        
        // Add loading class to container
        $postsContainer.addClass('loading');
        
        // Show skeleton loader if not appending
        if (!append) {
            if (filterState.view === 'table') {
                $postsContainer.find('.std-looppost-table-row').hide();
            } else {
                $postsContainer.find('.std-looppost-item').hide();
            }
            $skeleton.show();
        } else {
            // Show loading indicator
            $pagination.addClass('std-looppost-loading');
        }
        
        // Prepare AJAX data
        const data = {
            action: 'std_looppost_load',
            nonce: stdLoopPost.nonce,
            search: filterState.search,
            year: filterState.year,
            custom_field: filterState.customField,
            taxonomy_term: filterState.taxonomyTerm, // เพิ่มค่า taxonomy_term
            sort: filterState.sort,
            view: filterState.view,
            paged: filterState.paged,
            posts_per_page: postsPerPage
        };
        
        // Send AJAX request
        $.ajax({
            url: stdLoopPost.ajaxurl,
            type: 'POST',
            data: data,
            success: function(response) {
                if (response.success && response.data) {
                    // Hide skeleton
                    $skeleton.hide();
                    $pagination.removeClass('std-looppost-loading');
                    $postsContainer.removeClass('loading');
                    
                    // Update posts content
                    if (append) {
                        // Append new posts
                        $postsContainer.append(response.data.html);
                        
                        // Add animation class to new rows
                        if (filterState.view === 'table') {
                            $postsContainer.find('.std-looppost-table-row').last().addClass('new');
                        } else {
                            $postsContainer.find('.std-looppost-item').last().addClass('new');
                        }
                    } else {
                        // Replace all posts
                        $postsContainer.empty().append(response.data.html);
                    }
                    
                    // Update pagination
                    if (response.data.pagination) {
                        $pagination.find('.std-looppost-page-numbers').html(response.data.pagination);
                        
                        // Show/hide load more button
                        if (filterState.paged >= response.data.max_pages) {
                            $pagination.find('.std-looppost-load-more').hide();
                        } else {
                            $pagination.find('.std-looppost-load-more').show();
                        }
                    }
                    
                    // Set class for doc-number-cell to support styling
                    if (filterState.view === 'table') {
                        $postsContainer.find('.std-looppost-table-row').each(function() {
                            const $row = $(this);
                            if ($row.find('.doc-number.mrdh').length > 0) {
                                $row.find('.doc-number-cell').addClass('mrdh');
                            } else if ($row.find('.doc-number.msprr').length > 0) {
                                $row.find('.doc-number-cell').addClass('msprr');
                            }
                        });
                    }
                    
                    // Add current view class
                    $postsContainer.removeClass('card-view table-view').addClass(filterState.view + '-view');
                    
                    // Add table header if needed
                    if (filterState.view === 'table') {
                        if ($container.find('.std-looppost-table-header').length === 0) {
                            $postsContainer.before(
                                '<div class="std-looppost-table-header">' +
                                '<div>เลขที่</div>' +
                                '<div>ชื่อมาตรฐาน</div>' +
                                '<div>วัตถุประสงค์</div>' +
                                '</div>'
                            );
                        } else {
                            $container.find('.std-looppost-table-header').show();
                        }
                    } else {
                        $container.find('.std-looppost-table-header').hide();
                    }
                    
                    
                    // Handle no results
                    if (response.data.found_posts === 0) {
                        $pagination.hide();
                    } else {
                        $pagination.show();
                    }
                    
                    // Make table rows keyboard focusable
                    if (filterState.view === 'table') {
                        $postsContainer.find('.std-looppost-table-row').attr('tabindex', '0');
                    }
                } else {
                    console.error('Error loading posts', response);
                    $skeleton.hide();
                    $pagination.removeClass('std-looppost-loading');
                    $postsContainer.removeClass('loading');
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX error:', error);
                
                // Hide skeleton and show error message
                $skeleton.hide();
                $pagination.removeClass('std-looppost-loading');
                $postsContainer.removeClass('loading');
                $postsContainer.html('<div class="std-looppost-error">เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง</div>');
            }
        });
    }
    
    // เพิ่มส่วนนี้เพื่อให้เรียกใช้ได้จากภายนอก
    window.stdLoopPostLoad = function($container) {
        if ($container) {
            loadPosts($container);
        } else {
            $('.std-looppost-container').each(function() {
                loadPosts($(this));
            });
        }
    };
    
    // Export filter state for external use
    window.stdLoopPostFilterState = filterState;
    
    // Add method to change view programmatically
    window.stdLoopPostSetView = function(view) {
        if (view !== 'card' && view !== 'table') {
            console.warn('Invalid view type. Use "card" or "table".');
            return;
        }
        
        $('.std-looppost-container').each(function() {
            const $container = $(this);
            const $viewBtn = $container.find('.std-looppost-view-btn[data-view="' + view + '"]');
            
            if ($viewBtn.length && !$viewBtn.hasClass('active')) {
                $viewBtn.trigger('click');
            }
        });
    };
    
    // Add method to filter by taxonomy term programmatically
    window.stdLoopPostFilterByTaxonomy = function(termSlug) {
        $('.std-looppost-container').each(function() {
            const $container = $(this);
            const $taxonomySelect = $container.find('.std-looppost-taxonomy-select');
            
            if ($taxonomySelect.length) {
                $taxonomySelect.val(termSlug).trigger('change');
            }
        });
    };
    
})(jQuery);