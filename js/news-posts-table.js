/**
 * News Posts Table JavaScript
 * 
 * จัดการ Modal Dialog และ AJAX request สำหรับจัดการข่าวในหมวดหมู่ต่างๆ
 * อัพเดตเพื่อสนับสนุนการออกแบบ UX/UI ใหม่
 */

(function($) {
    'use strict';
    
    $(document).ready(function() {
        // Setup event handlers
        setupEventHandlers();
        
        // Initialize multiple select
        initializeMultipleSelect();
    });
    
    /**
     * Setup event handlers
     */
    function setupEventHandlers() {
        // Edit category button click
        $(document).on('click', '.edit-category-btn', function() {
            const postId = $(this).data('post-id');
            const currentTerms = $(this).data('current-terms') ? $(this).data('current-terms').toString().split(',') : [];
            openEditCategoryModal(postId, currentTerms);
        });
        
        // Delete post button click
        $(document).on('click', '.delete-post-btn', function() {
            const postId = $(this).data('post-id');
            const postTitle = $(this).data('post-title') || 'โพสต์นี้';
            openDeleteModal(postId, postTitle);
        });
        
        // Close modal when clicking the "X" button
        $(document).on('click', '.news-modal-close', function() {
            closeModals();
        });
        
        // Close modal when clicking the "Cancel" button
        $(document).on('click', '.cancel-modal', function() {
            closeModals();
        });
        
        // Close modal when clicking outside of it
        $(window).on('click', function(event) {
            if ($(event.target).hasClass('news-modal')) {
                closeModals();
            }
        });
        
        // Close modals when ESC key is pressed
        $(document).on('keydown', function(e) {
            if (e.key === 'Escape' && $('.news-modal:visible').length > 0) {
                closeModals();
            }
        });
        
        // Update category form submission
        $('#update-category-form').on('submit', function(e) {
            e.preventDefault();
            updateCategory();
        });
        
        // Delete post confirmation
        $(document).on('click', '.confirm-delete-btn', function() {
            deletePost();
        });
        
        // Term filter change autosubmit
        $('#term-filter').on('change', function() {
            if ($(this).closest('form').hasClass('auto-submit')) {
                $(this).closest('form').submit();
            }
        });
        
        // Add tooltips
        addButtonTooltips();
        
        // Add ripple effect
        addRippleEffect();
    }
    
    /**
     * Initialize multiple select for category editing
     */
    function initializeMultipleSelect() {
        // Ensure multiple attribute is set
        $('#new-category').attr('multiple', 'multiple');
    }
    
    /**
     * Add tooltip functionality to buttons
     */
    function addButtonTooltips() {
        $('.edit-category-btn, .delete-post-btn').hover(
            function() {
                const tooltip = $(this).data('tooltip');
                if (tooltip) {
                    const $tooltip = $('<div class="button-tooltip"></div>').text(tooltip);
                    $('body').append($tooltip);
                    
                    const buttonOffset = $(this).offset();
                    const buttonWidth = $(this).outerWidth();
                    const tooltipWidth = $tooltip.outerWidth();
                    
                    $tooltip.css({
                        top: buttonOffset.top - 35,
                        left: buttonOffset.left + (buttonWidth / 2) - (tooltipWidth / 2)
                    });
                    
                    $(this).data('tooltip-element', $tooltip);
                }
            },
            function() {
                const $tooltip = $(this).data('tooltip-element');
                if ($tooltip) {
                    $tooltip.remove();
                    $(this).removeData('tooltip-element');
                }
            }
        );
    }
    
    /**
     * Add ripple effect to buttons
     */
    function addRippleEffect() {
        $('.edit-category-btn, .delete-post-btn, .filter-button, .update-category-submit, .confirm-delete-btn, .cancel-modal').on('click', function(e) {
            const button = $(this);
            
            // Create ripple element
            const $ripple = $('<span class="ripple"></span>');
            button.append($ripple);
            
            // Set position
            const posX = e.pageX - button.offset().left;
            const posY = e.pageY - button.offset().top;
            
            $ripple.css({
                width: button.width() * 2,
                height: button.width() * 2,
                top: posY - (button.width()),
                left: posX - (button.width())
            }).addClass('animate');
            
            // Remove after animation
            setTimeout(function() {
                $ripple.remove();
            }, 500);
        });
    }
    
    /**
     * Open the edit category modal
     */
    function openEditCategoryModal(postId, currentTerms) {
        // Set the post ID
        $('#edit-post-id').val(postId);
        
        // Clear previous selections
        $('#new-category option:selected').prop('selected', false);
        
        // Set current term selections
        if (currentTerms && currentTerms.length) {
            currentTerms.forEach(function(termId) {
                if (termId) {
                    $('#new-category option[value="' + termId + '"]').prop('selected', true);
                }
            });
        }
        
        // Show modal with animation
        $('#edit-category-modal').fadeIn(300);
        
        // Focus on the select element
        setTimeout(function() {
            $('#new-category').focus();
        }, 300);
    }
    
    /**
     * Open the delete confirmation modal
     */
    function openDeleteModal(postId, postTitle) {
        // Set the post ID
        $('#delete-post-id').val(postId);
        
        // Set the post title in the confirmation message
        $('#delete-post-title').text(postTitle);
        
        // Show modal with animation
        $('#delete-post-modal').fadeIn(300);
    }
    
    /**
     * Close all modals
     */
    function closeModals() {
        $('.news-modal').fadeOut(200);
    }
    
    /**
     * Update post category via AJAX
     */
    function updateCategory() {
        const postId = $('#edit-post-id').val();
        const newTermIds = $('#new-category').val() || [];
        
        // Show loading state
        const $submitButton = $('.update-category-submit');
        const originalText = $submitButton.text();
        $submitButton.prop('disabled', true).text(news_posts_table_vars.processing_message);
        
        // Make AJAX request
        $.ajax({
            url: news_posts_table_vars.ajax_url,
            type: 'POST',
            data: {
                action: 'update_news_category',
                nonce: news_posts_table_vars.nonce,
                post_id: postId,
                new_term_ids: newTermIds
            },
            success: function(response) {
                if (response.success) {
                    // Update UI
                    $(`#post-row-${postId} .col-category`).text(response.data.term_names);
                    
                    // Update data attribute for future edits
                    if (newTermIds && newTermIds.length) {
                        $(`#post-row-${postId} .edit-category-btn`).attr('data-current-terms', newTermIds.join(','));
                    } else {
                        $(`#post-row-${postId} .edit-category-btn`).attr('data-current-terms', '');
                    }
                    
                    // Show success notification
                    showNotification(response.data.message || news_posts_table_vars.update_success_message, 'success');
                    
                    // Close modal
                    closeModals();
                    
                    // Trigger custom event
                    $(document).trigger('post-updated', [postId, newTermIds]);
                    
                    // Refresh statistics if on the same page
                    if (typeof window.loadStatistics === 'function') {
                        window.loadStatistics();
                    }
                } else {
                    // Show error notification
                    showNotification(response.data.message || news_posts_table_vars.error_message, 'error');
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX Error:', error);
                showNotification(news_posts_table_vars.error_message, 'error');
            },
            complete: function() {
                // Reset button state
                $submitButton.prop('disabled', false).text(originalText);
            }
        });
    }
    
    /**
     * Delete post via AJAX
     */
    function deletePost() {
        const postId = $('#delete-post-id').val();
        
        // Show loading state
        const $deleteButton = $('.confirm-delete-btn');
        const originalText = $deleteButton.text();
        $deleteButton.prop('disabled', true).text(news_posts_table_vars.processing_message);
        
        // Make AJAX request
        $.ajax({
            url: news_posts_table_vars.ajax_url,
            type: 'POST',
            data: {
                action: 'delete_news_post',
                nonce: news_posts_table_vars.nonce,
                post_id: postId
            },
            success: function(response) {
                if (response.success) {
                    // Remove row from table with animation
                    $(`#post-row-${postId}`).fadeOut(300, function() {
                        $(this).remove();
                        
                        // Check if table is empty
                        if ($('.news-posts-table tbody tr').length === 0) {
                            $('.news-posts-table-container').html('<div class="news-posts-no-results">ไม่พบโพสต์ที่ตรงกับเงื่อนไข</div>');
                        }
                    });
                    
                    // Show success notification
                    showNotification(response.data.message || news_posts_table_vars.delete_success_message, 'success');
                    
                    // Close modal
                    closeModals();
                    
                    // Trigger custom event
                    $(document).trigger('post-deleted', [postId]);
                    
                    // Refresh statistics if on the same page
                    if (typeof window.loadStatistics === 'function') {
                        window.loadStatistics();
                    }
                } else {
                    // Show error notification
                    showNotification(response.data.message || news_posts_table_vars.error_message, 'error');
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX Error:', error);
                showNotification(news_posts_table_vars.error_message, 'error');
            },
            complete: function() {
                // Reset button state
                $deleteButton.prop('disabled', false).text(originalText);
            }
        });
    }
    
    /**
     * Show notification
     */
    function showNotification(message, type) {
        const $notification = $('#news-notification');
        const $message = $notification.find('.news-notification-message');
        
        // Set message and type
        $message.text(message);
        $notification.removeClass('success error').addClass(type);
        
        // Show notification
        $notification.addClass('show');
        
        // Hide after 3 seconds
        setTimeout(function() {
            $notification.removeClass('show');
            
            // Remove completely after fade out
            setTimeout(function() {
                $notification.removeClass(type);
            }, 300);
        }, 3000);
    }
    
    // Expose functions for external use
    window.newsPostsTable = {
        refreshTable: function() {
            location.reload();
        },
        showNotification: showNotification
    };
    
})(jQuery);