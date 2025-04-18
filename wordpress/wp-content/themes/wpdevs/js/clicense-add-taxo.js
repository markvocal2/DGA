/**
 * CLICENSE Add Taxonomy Term - Frontend JavaScript
 * File: clicense-add-taxo.js
 */
(function($) {
    'use strict';
    
    $(document).ready(function() {
        const modal = $('#clicense-modal');
        const addButton = $('#clicense-add-button');
        const closeButton = $('.clicense-close');
        const cancelButton = $('.clicense-cancel');
        const form = $('#clicense-add-form');
        const nameInput = $('#clicense-name');
        const slugInput = $('#clicense-slug');
        const message = $('#clicense-message');
        
        // Function to get the next term ID and update the slug
        function updateSlug() {
            $.ajax({
                url: clicense_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'clicense_get_term_count',
                    nonce: clicense_ajax.nonce
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
                message.html('กรุณากรอกชื่อสัญญาอนุญาต').addClass('clicense-error').removeClass('clicense-success clicense-loading').show();
                return;
            }
            
            // Disable form fields and show loading state
            form.find('input, button').prop('disabled', true);
            message.html('กำลังบันทึกข้อมูล...').removeClass('clicense-error clicense-success').addClass('clicense-loading').show();
            
            // Submit via AJAX
            $.ajax({
                url: clicense_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'clicense_add_term',
                    nonce: clicense_ajax.nonce,
                    term_name: name
                },
                success: function(response) {
                    form.find('input, button').prop('disabled', false);
                    
                    if (response.success) {
                        message.html(response.data.message).removeClass('clicense-error clicense-loading').addClass('clicense-success').show();
                        nameInput.val('');
                        
                        // Close modal after successful submission after 1.5 seconds
                        setTimeout(function() {
                            closeModal();
                        }, 1500);
                    } else {
                        message.html(response.data.message).removeClass('clicense-success clicense-loading').addClass('clicense-error').show();
                    }
                },
                error: function() {
                    form.find('input, button').prop('disabled', false);
                    message.html('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง').removeClass('clicense-success clicense-loading').addClass('clicense-error').show();
                }
            });
        });
    });
})(jQuery);