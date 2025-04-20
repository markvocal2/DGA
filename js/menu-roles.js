jQuery(document).ready(($) => {
    // Initialize Select2
    $('.menu-role-select').select2({
        placeholder: "Select roles",
        allowClear: true
    });

    // Handle role selection changes
    $('.menu-role-select').on('change', function() {
        const $select = $(this);
        const $spinner = $select.siblings('.spinner');
        const $message = $select.siblings('.status-message');
        const itemId = $select.data('item-id');
        let selectedRoles = $select.val() || [];
        
        // Handle "All Users" selection
        if (selectedRoles.includes('all')) {
            $select.find('option:not([value="all"])').prop('selected', false);
            selectedRoles = ['all'];
            $select.val(['all']);
            $select.trigger('change.select2');
        } else {
            $select.find('option[value="all"]').prop('selected', false);
        }

        // Show spinner and reset message
        $spinner.addClass('is-active');
        $message
            .html('')
            .removeClass('error-message success-message');
        
        // Send AJAX request
        $.ajax({
            url: menuRolesAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'update_menu_role',
                nonce: menuRolesAjax.nonce,
                item_id: itemId,
                roles: selectedRoles
            },
            success: (response) => {
                if (response.success) {
                    $message
                        .html(response.data.message)
                        .addClass('success-message')
                        .css('color', 'green');
                } else {
                    $message
                        .html(response.data)
                        .addClass('error-message')
                        .css('color', 'red');
                }
            },
            error: () => {
                $message
                    .html('Error updating roles')
                    .addClass('error-message')
                    .css('color', 'red');
            },
            complete: () => {
                $spinner.removeClass('is-active');
                
                // Hide message after 3 seconds
                setTimeout(() => {
                    $message.fadeOut(() => {
                        $message
                            .html('')
                            .show()
                            .removeClass('error-message success-message');
                    });
                }, 3000);
            }
        });
    });
});
