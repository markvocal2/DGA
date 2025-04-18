/**
 * CDATA Add Taxonomy Term - Frontend JavaScript
 * File: cdata-add-taxo.js
 */
(function($) {
    'use strict';
    
    $(document).ready(function() {
        const modal = $('#cdata-modal');
        const addButton = $('#cdata-add-button');
        const closeButton = $('.cdata-close');
        const cancelButton = $('.cdata-cancel');
        const form = $('#cdata-add-form');
        const nameInput = $('#cdata-name');
        const slugInput = $('#cdata-slug');
        const message = $('#cdata-message');
        
        // Function to get the next term ID and update the slug
        function updateSlug() {
            $.ajax({
                url: cdata_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'cdata_get_term_count',
                    nonce: cdata_ajax.nonce
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
                message.html('กรุณากรอกชื่อชุดข้อมูล').addClass('cdata-error').removeClass('cdata-success cdata-loading').show();
                return;
            }
            
            // Disable form fields and show loading state
            form.find('input, button').prop('disabled', true);
            message.html('กำลังบันทึกข้อมูล...').removeClass('cdata-error cdata-success').addClass('cdata-loading').show();
            
            // Submit via AJAX
            $.ajax({
                url: cdata_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'cdata_add_term',
                    nonce: cdata_ajax.nonce,
                    term_name: name
                },
                success: function(response) {
                    form.find('input, button').prop('disabled', false);
                    
                    if (response.success) {
                        message.html(response.data.message).removeClass('cdata-error cdata-loading').addClass('cdata-success').show();
                        nameInput.val('');
                        
                        // Close modal after successful submission after 1.5 seconds
                        setTimeout(function() {
                            closeModal();
                        }, 1500);
                    } else {
                        message.html(response.data.message).removeClass('cdata-success cdata-loading').addClass('cdata-error').show();
                    }
                },
                error: function() {
                    form.find('input, button').prop('disabled', false);
                    message.html('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง').removeClass('cdata-success cdata-loading').addClass('cdata-error').show();
                }
            });
        });
    });
})(jQuery);