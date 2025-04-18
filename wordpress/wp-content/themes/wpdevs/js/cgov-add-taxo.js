/**
 * CGOV Add Taxonomy Term - Frontend JavaScript
 * File: cgov-add-taxo.js
 */
(function($) {
    'use strict';
    
    $(document).ready(function() {
        const modal = $('#cgov-modal');
        const addButton = $('#cgov-add-button');
        const closeButton = $('.cgov-close');
        const cancelButton = $('.cgov-cancel');
        const form = $('#cgov-add-form');
        const nameInput = $('#cgov-name');
        const slugInput = $('#cgov-slug');
        const message = $('#cgov-message');
        
        // Function to get the next term ID and update the slug
        function updateSlug() {
            $.ajax({
                url: cgov_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'cgov_get_term_count',
                    nonce: cgov_ajax.nonce
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
                message.html('กรุณากรอกชื่อหมวดหมู่ตามธรรมาภิบาลข้อมูล').addClass('cgov-error').removeClass('cgov-success cgov-loading').show();
                return;
            }
            
            // Disable form fields and show loading state
            form.find('input, button').prop('disabled', true);
            message.html('กำลังบันทึกข้อมูล...').removeClass('cgov-error cgov-success').addClass('cgov-loading').show();
            
            // Submit via AJAX
            $.ajax({
                url: cgov_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'cgov_add_term',
                    nonce: cgov_ajax.nonce,
                    term_name: name
                },
                success: function(response) {
                    form.find('input, button').prop('disabled', false);
                    
                    if (response.success) {
                        message.html(response.data.message).removeClass('cgov-error cgov-loading').addClass('cgov-success').show();
                        nameInput.val('');
                        
                        // Close modal after successful submission after 1.5 seconds
                        setTimeout(function() {
                            closeModal();
                        }, 1500);
                    } else {
                        message.html(response.data.message).removeClass('cgov-success cgov-loading').addClass('cgov-error').show();
                    }
                },
                error: function() {
                    form.find('input, button').prop('disabled', false);
                    message.html('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง').removeClass('cgov-success cgov-loading').addClass('cgov-error').show();
                }
            });
        });
    });
})(jQuery);