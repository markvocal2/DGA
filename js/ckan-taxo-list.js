/**
 * CKAN Taxonomy List JavaScript
 * ckan-taxo-list.js
 */

(function($) {
    'use strict';
    
    // Store currently active term selections for each taxonomy container
    const activeTerms = {};
    
    // Initialize when document is ready
    $(document).ready(function() {
        // Initialize all taxonomy containers
        $('.ckan-taxo-container').each(function() {
            const containerId = $(this).attr('id');
            const taxonomy = $(this).data('taxonomy');
            
            // Show skeleton initially
            setTimeout(function() {
                $('#' + containerId + ' .ckan-taxo-skeleton').hide();
                $('#' + containerId + ' .ckan-taxo-content').fadeIn(300);
            }, 800);
            
            // Initialize term click handlers
            initTermClicks(containerId);
            
            // Check URL for initial term filter
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('term_id') && urlParams.has('taxonomy') && urlParams.get('taxonomy') === taxonomy) {
                const termId = parseInt(urlParams.get('term_id'));
                if (termId > 0) {
                    // Set initial active term
                    setTimeout(function() {
                        $('#' + containerId + ' .ckan-taxo-item[data-term-id="' + termId + '"]').trigger('click');
                    }, 1000);
                }
            }
        });
    });
    
    /**
     * Initialize click handlers for taxonomy terms
     * @param {string} containerId - The ID of the taxonomy container
     */
    function initTermClicks(containerId) {
        $('#' + containerId + ' .ckan-taxo-item').on('click', function() {
            const container = $('#' + containerId);
            const taxonomy = container.data('taxonomy');
            const termId = $(this).data('term-id');
            
            // Update active state
            container.find('.ckan-taxo-item').removeClass('active');
            $(this).addClass('active');
            
            // Store active term
            activeTerms[containerId] = termId;
            
            // Update URL without page reload
            const url = new URL(window.location.href);
            if (termId === 0) {
                url.searchParams.delete('term_id');
                url.searchParams.delete('taxonomy');
            } else {
                url.searchParams.set('term_id', termId);
                url.searchParams.set('taxonomy', taxonomy);
            }
            window.history.pushState({}, '', url);
            
            // Filter ckan_list content via AJAX
            filterCkanList(taxonomy, termId);
        });
    }
    
    /**
     * Filter ckan_list content via AJAX
     * @param {string} taxonomy - The taxonomy slug
     * @param {number} termId - The term ID to filter by
     */
    function filterCkanList(taxonomy, termId) {
        // Show loading state on ckan-list
        const listContent = $('#ckan-list-content');
        const listSkeleton = $('#ckan-list-skeleton');
        
        if (listContent.length && listSkeleton.length) {
            listContent.hide();
            listSkeleton.show();
            
            // Send AJAX request
            $.ajax({
                url: ckan_taxo_list_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'ckan_taxo_filter',
                    nonce: ckan_taxo_list_ajax.nonce,
                    taxonomy: taxonomy,
                    term_id: termId
                },
                success: function(response) {
                    if (response.success) {
                        updateCkanList(response.data);
                    } else {
                        console.error('Filter failed:', response.data.message);
                        listSkeleton.hide();
                        listContent.show();
                    }
                },
                error: function() {
                    console.error('AJAX request failed');
                    listSkeleton.hide();
                    listContent.show();
                }
            });
        }
    }
    
    /**
     * Update ckan_list content with filtered results
     * @param {Object} data - The filtered data from AJAX response
     */
    function updateCkanList(data) {
        const contentContainer = $('#ckan-list-content');
        const skeletonContainer = $('#ckan-list-skeleton');
        const paginationContainer = $('.ckan-list-pagination');
        
        // If no ckan_list on page, exit early
        if (!contentContainer.length) {
            return;
        }
        
        if (data.posts.length === 0) {
            contentContainer.html(`
                <div class="ckan-list-no-results">
                    <p>ไม่พบข้อมูลใน "${data.term_name || 'ทั้งหมด'}"</p>
                </div>
            `);
            if (paginationContainer.length) {
                paginationContainer.hide();
            }
        } else {
            let html = '';
            
            data.posts.forEach(function(post) {
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
            
            // Update pagination if needed
            if (paginationContainer.length && data.max_pages > 1) {
                updatePagination(paginationContainer, data);
                paginationContainer.show();
            } else if (paginationContainer.length) {
                paginationContainer.hide();
            }
        }
        
        skeletonContainer.hide();
        contentContainer.fadeIn(300);
        
        // Re-initialize click handlers for the new content
        initClickHandlers();
    }
    
    /**
     * Update pagination links with filtered term
     * @param {jQuery} paginationContainer - The pagination container
     * @param {Object} data - The filtered data
     */
    function updatePagination(paginationContainer, data) {
        const currentPage = 1; // Always first page on filter
        const maxPages = data.max_pages;
        
        let paginationHtml = '';
        
        // Previous page link (disabled for first page)
        if (currentPage > 1) {
            paginationHtml += `<a href="#" class="ckan-list-pagination-prev" data-page="${currentPage - 1}">&laquo; หน้าก่อนหน้า</a>`;
        } else {
            paginationHtml += `<span class="ckan-list-pagination-prev disabled">&laquo; หน้าก่อนหน้า</span>`;
        }
        
        // Page number links
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(maxPages, currentPage + 2);
        
        if (startPage > 1) {
            paginationHtml += `<a href="#" class="ckan-list-pagination-number" data-page="1">1</a>`;
            if (startPage > 2) {
                paginationHtml += `<span class="ckan-list-pagination-dots">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            if (i === currentPage) {
                paginationHtml += `<span class="ckan-list-pagination-current">${i}</span>`;
            } else {
                paginationHtml += `<a href="#" class="ckan-list-pagination-number" data-page="${i}">${i}</a>`;
            }
        }
        
        if (endPage < maxPages) {
            if (endPage < maxPages - 1) {
                paginationHtml += `<span class="ckan-list-pagination-dots">...</span>`;
            }
            paginationHtml += `<a href="#" class="ckan-list-pagination-number" data-page="${maxPages}">${maxPages}</a>`;
        }
        
        // Next page link
        if (currentPage < maxPages) {
            paginationHtml += `<a href="#" class="ckan-list-pagination-next" data-page="${currentPage + 1}">หน้าถัดไป &raquo;</a>`;
        } else {
            paginationHtml += `<span class="ckan-list-pagination-next disabled">หน้าถัดไป &raquo;</span>`;
        }
        
        paginationContainer.html(paginationHtml);
        
        // Add click handlers for pagination
        paginationContainer.find('a').on('click', function(e) {
            e.preventDefault();
            const page = $(this).data('page');
            
            // Handle pagination click with active term filter
            // This would need to be implemented to work with the ckan_list pagination system
        });
    }
    
    /**
     * Re-initialize click handlers for post items
     */
    function initClickHandlers() {
        // Re-initialize view counters
        $('.ckan-list-item-link').on('click', function() {
            const postId = $(this).data('post-id');
            
            // Check if ckan_list_ajax is available (from ckan-list.js)
            if (typeof ckan_list_ajax !== 'undefined') {
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
                            const item = $('.ckan-list-item[data-post-id="' + postId + '"]');
                            item.find('.ckan-list-item-total-views').html(`
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                ${response.data.total_views}
                            `);
                            
                            item.find('.ckan-list-item-recent-views').html(`
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                ${response.data.recent_views}
                            `);
                        }
                    }
                });
            }
        });
    }
    
})(jQuery);