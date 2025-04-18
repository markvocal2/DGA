/**
 * CORG Add Taxonomy Term - Frontend JavaScript
 * File: corg-add-taxo.js
 */
(function($) {
    'use strict';
    
    $(document).ready(function() {
        const modal = $('#corg-modal');
        const addButton = $('#corg-add-button');
        const closeButton = $('.corg-close');
        const cancelButton = $('.corg-cancel');
        const form = $('#corg-add-form');
        const nameInput = $('#corg-name');
        const slugInput = $('#corg-slug');
        const message = $('#corg-message');
        
        // Function to get the next term ID and update the slug
        function updateSlug() {
            $.ajax({
                url: corg_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'corg_get_term_count',
                    nonce: corg_ajax.nonce
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
                message.html('กรุณากรอกชื่อองค์กร').addClass('corg-error').removeClass('corg-success corg-loading').show();
                return;
            }
            
            // Disable form fields and show loading state
            form.find('input, button').prop('disabled', true);
            message.html('กำลังบันทึกข้อมูล...').removeClass('corg-error corg-success').addClass('corg-loading').show();
            
            // Submit via AJAX
            $.ajax({
                url: corg_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'corg_add_term',
                    nonce: corg_ajax.nonce,
                    term_name: name
                },
                success: function(response) {
                    form.find('input, button').prop('disabled', false);
                    
                    if (response.success) {
                        message.html(response.data.message).removeClass('corg-error corg-loading').addClass('corg-success').show();
                        nameInput.val('');
                        
                        // Close modal after successful submission after 1.5 seconds
                        setTimeout(function() {
                            closeModal();
                        }, 1500);
                    } else {
                        message.html(response.data.message).removeClass('corg-success corg-loading').addClass('corg-error').show();
                    }
                },
                error: function() {
                    form.find('input, button').prop('disabled', false);
                    message.html('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง').removeClass('corg-success corg-loading').addClass('corg-error').show();
                }
            });
        });
    });
})(jQuery);