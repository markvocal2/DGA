/**
 * CTAG Add Taxonomy Term - Frontend JavaScript
 * File: ctag-add-taxo.js
 */
(function($) {
    'use strict';
    
    $(document).ready(function() {
        const modal = $('#ctag-modal');
        const addButton = $('#ctag-add-button');
        const closeButton = $('.ctag-close');
        const cancelButton = $('.ctag-cancel');
        const form = $('#ctag-add-form');
        const nameInput = $('#ctag-name');
        const slugInput = $('#ctag-slug');
        const message = $('#ctag-message');
        
        // Function to get the next term ID and update the slug
        function updateSlug() {
            $.ajax({
                url: ctag_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'ctag_get_term_count',
                    nonce: ctag_ajax.nonce
                },
                success: function(response) {
                    if (response.success) {
                        const nextId = response.data.next_id;
                        slugInput.val(nextId);
                    }
                }
            });
        }
        
        // Open modal when Add button is clicked
        addButton.on('click', function() {
            modal.fadeIn(300);
            updateSlug(); // Get the next ID
            nameInput.focus();
        });
        
        // Close modal functions
        function closeModal() {
            modal.fadeOut(300);
            form[0].reset();
            message.html('').hide();
        }
        
        closeButton.on('click', closeModal);
        cancelButton.on('click', closeModal);
        
        // Close when clicking outside the modal
        $(window).on('click', function(e) {
            if ($(e.target).is(modal)) {
                closeModal();
            }
        });
        
        // Handle form submission
        form.on('submit', function(e) {
            e.preventDefault();
            
            const name = nameInput.val().trim();
            
            if (!name) {
                message.html('กรุณากรอกชื่อแท็ค').addClass('ctag-error').removeClass('ctag-success ctag-loading').show();
                return;
            }
            
            // Disable form fields and show loading state
            form.find('input, button').prop('disabled', true);
            message.html('กำลังบันทึกข้อมูล...').removeClass('ctag-error ctag-success').addClass('ctag-loading').show();
            
            // Submit via AJAX
            $.ajax({
                url: ctag_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'ctag_add_term',
                    nonce: ctag_ajax.nonce,
                    term_name: name
                },
                success: function(response) {
                    form.find('input, button').prop('disabled', false);
                    
                    if (response.success) {
                        message.html(response.data.message).removeClass('ctag-error ctag-loading').addClass('ctag-success').show();
                        nameInput.val('');
                        
                        // Close modal after successful submission after 1.5 seconds
                        setTimeout(function() {
                            closeModal();
                        }, 1500);
                    } else {
                        message.html(response.data.message).removeClass('ctag-success ctag-loading').addClass('ctag-error').show();
                    }
                },
                error: function() {
                    form.find('input, button').prop('disabled', false);
                    message.html('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง').removeClass('ctag-success ctag-loading').addClass('ctag-error').show();
                }
            });
        });
    });
})(jQuery);