/**
 * CACCESS Add Taxonomy Term - Frontend JavaScript
 * File: caccess-add-taxo.js
 */
(function($) {
    'use strict';
    
    $(document).ready(function() {
        const modal = $('#caccess-modal');
        const addButton = $('#caccess-add-button');
        const closeButton = $('.caccess-close');
        const cancelButton = $('.caccess-cancel');
        const form = $('#caccess-add-form');
        const nameInput = $('#caccess-name');
        const slugInput = $('#caccess-slug');
        const message = $('#caccess-message');
        
        // Function to get the next term ID and update the slug
        function updateSlug() {
            $.ajax({
                url: caccess_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'caccess_get_term_count',
                    nonce: caccess_ajax.nonce
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
                message.html('กรุณากรอกชื่อการเข้าถึง').addClass('caccess-error').removeClass('caccess-success caccess-loading').show();
                return;
            }
            
            // Disable form fields and show loading state
            form.find('input, button').prop('disabled', true);
            message.html('กำลังบันทึกข้อมูล...').removeClass('caccess-error caccess-success').addClass('caccess-loading').show();
            
            // Submit via AJAX
            $.ajax({
                url: caccess_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'caccess_add_term',
                    nonce: caccess_ajax.nonce,
                    term_name: name
                },
                success: function(response) {
                    form.find('input, button').prop('disabled', false);
                    
                    if (response.success) {
                        message.html(response.data.message).removeClass('caccess-error caccess-loading').addClass('caccess-success').show();
                        nameInput.val('');
                        
                        // Close modal after successful submission after 1.5 seconds
                        setTimeout(function() {
                            closeModal();
                        }, 1500);
                    } else {
                        message.html(response.data.message).removeClass('caccess-success caccess-loading').addClass('caccess-error').show();
                    }
                },
                error: function() {
                    form.find('input, button').prop('disabled', false);
                    message.html('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง').removeClass('caccess-success caccess-loading').addClass('caccess-error').show();
                }
            });
        });
    });
})(jQuery);