/**
 * CFORMAT Add Taxonomy Term - Frontend JavaScript
 * File: cformat-add-taxo.js
 */
(function($) {
    'use strict';
    
    $(document).ready(function() {
        const modal = $('#cformat-modal');
        const addButton = $('#cformat-add-button');
        const closeButton = $('.cformat-close');
        const cancelButton = $('.cformat-cancel');
        const form = $('#cformat-add-form');
        const nameInput = $('#cformat-name');
        const slugInput = $('#cformat-slug');
        const message = $('#cformat-message');
        
        // Function to get the next term ID and update the slug
        function updateSlug() {
            $.ajax({
                url: cformat_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'cformat_get_term_count',
                    nonce: cformat_ajax.nonce
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
                message.html('กรุณากรอกรูปแบบ').addClass('cformat-error').removeClass('cformat-success cformat-loading').show();
                return;
            }
            
            // Disable form fields and show loading state
            form.find('input, button').prop('disabled', true);
            message.html('กำลังบันทึกข้อมูล...').removeClass('cformat-error cformat-success').addClass('cformat-loading').show();
            
            // Submit via AJAX
            $.ajax({
                url: cformat_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'cformat_add_term',
                    nonce: cformat_ajax.nonce,
                    term_name: name
                },
                success: function(response) {
                    form.find('input, button').prop('disabled', false);
                    
                    if (response.success) {
                        message.html(response.data.message).removeClass('cformat-error cformat-loading').addClass('cformat-success').show();
                        nameInput.val('');
                        
                        // Close modal after successful submission after 1.5 seconds
                        setTimeout(function() {
                            closeModal();
                        }, 1500);
                    } else {
                        message.html(response.data.message).removeClass('cformat-success cformat-loading').addClass('cformat-error').show();
                    }
                },
                error: function() {
                    form.find('input, button').prop('disabled', false);
                    message.html('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง').removeClass('cformat-success cformat-loading').addClass('cformat-error').show();
                }
            });
        });
    });
})(jQuery);