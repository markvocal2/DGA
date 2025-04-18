/**
 * CGROUP Add Taxonomy Term - Frontend JavaScript
 * File: cgroup-add-taxo.js
 */
(function($) {
    'use strict';
    
    $(document).ready(function() {
        const modal = $('#cgroup-modal');
        const addButton = $('#cgroup-add-button');
        const closeButton = $('.cgroup-close');
        const cancelButton = $('.cgroup-cancel');
        const form = $('#cgroup-add-form');
        const nameInput = $('#cgroup-name');
        const slugInput = $('#cgroup-slug');
        const message = $('#cgroup-message');
        
        // Function to get the next term ID and update the slug
        function updateSlug() {
            $.ajax({
                url: cgroup_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'cgroup_get_term_count',
                    nonce: cgroup_ajax.nonce
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
                message.html('กรุณากรอกชื่อกลุ่ม').addClass('cgroup-error').removeClass('cgroup-success cgroup-loading').show();
                return;
            }
            
            // Disable form fields and show loading state
            form.find('input, button').prop('disabled', true);
            message.html('กำลังบันทึกข้อมูล...').removeClass('cgroup-error cgroup-success').addClass('cgroup-loading').show();
            
            // Submit via AJAX
            $.ajax({
                url: cgroup_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'cgroup_add_term',
                    nonce: cgroup_ajax.nonce,
                    term_name: name
                },
                success: function(response) {
                    form.find('input, button').prop('disabled', false);
                    
                    if (response.success) {
                        message.html(response.data.message).removeClass('cgroup-error cgroup-loading').addClass('cgroup-success').show();
                        nameInput.val('');
                        
                        // Close modal after successful submission after 1.5 seconds
                        setTimeout(function() {
                            closeModal();
                        }, 1500);
                    } else {
                        message.html(response.data.message).removeClass('cgroup-success cgroup-loading').addClass('cgroup-error').show();
                    }
                },
                error: function() {
                    form.find('input, button').prop('disabled', false);
                    message.html('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง').removeClass('cgroup-success cgroup-loading').addClass('cgroup-error').show();
                }
            });
        });
    });
})(jQuery);