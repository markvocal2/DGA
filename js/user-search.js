// /js/user-search.js
jQuery(document).ready(function($) {
    // Use let for variables that might be reassigned
    let searchTimeout;

    // Use const for variables assigned once
    const searchInput = $('#user-search-input');
    const searchResults = $('#search-results');
    const modal = $('#role-modal');
    const closeBtn = $('.close'); // Assuming this is the close button inside the modal
    const saveBtn = $('#save-role');
    const selectedUserIdInput = $('#selected-user-id'); // Cache this selector

    // --- Helper Functions ---

    /**
     * Toggles the visibility of the modal using CSS display property.
     * @param {boolean} show - True to show, false to hide.
     */
    const toggleModal = (show = true) => {
        // Use jQuery's show/hide or toggle for consistency, or manage classes
        if (show) {
            modal.css('display', 'block'); // Or modal.show(); or modal.addClass('is-visible');
        } else {
            modal.css('display', 'none'); // Or modal.hide(); or modal.removeClass('is-visible');
        }
    };

    /**
     * Performs the user search via AJAX.
     * @param {string} term - The search term.
     */
    const performSearch = (term) => {
        searchResults.html('<div class="loading">กำลังค้นหา...</div>').show(); // Show loading indicator

        $.ajax({
            url: userSearchAjax.ajaxurl, // Ensure userSearchAjax is defined via wp_localize_script
            type: 'POST',
            data: {
                action: 'search_users',
                security: userSearchAjax.security, // AJAX nonce
                term: term
            },
            dataType: 'json', // Expect JSON response
            success: (response) => { // Use arrow function for callback
                if (response && response.success && response.data && response.data.length > 0) {
                    searchResults.empty(); // Clear previous results or loading indicator
                    response.data.forEach((user) => { // Use arrow function for loop callback
                        // Use template literals for cleaner HTML string construction
                        // Ensure user properties (id, name, email) exist
                        const userId = user.id || '';
                        const userName = user.name || 'N/A';
                        const userEmail = user.email || 'N/A';

                        searchResults.append(`
                            <div class="search-item" data-user-id="${userId}">
                                <strong>${userName}</strong><br>
                                <small>${userEmail}</small>
                            </div>
                        `);
                    });
                } else {
                    // Handle no results or error response from server
                    const message = response?.data?.message || userSearchAjax.strings?.no_users_found || 'ไม่พบผู้ใช้';
                    searchResults.html(`<div class="no-results">${message}</div>`);
                }
            },
            error: (xhr, status, error) => { // Use arrow function for callback
                console.error('Search AJAX error:', status, error);
                const message = userSearchAjax.strings?.search_error || 'เกิดข้อผิดพลาดในการค้นหา';
                searchResults.html(`<div class="error">${message}</div>`);
            }
        });
    };

    /**
     * Fetches the current role for a given user ID and updates the modal.
     * @param {string|number} userId - The ID of the user.
     */
    const fetchUserRoleAndShowModal = (userId) => {
        // Add a loading state to the modal if needed
        // modal.find('.modal-content').addClass('loading'); // Example

        $.ajax({
            url: userSearchAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'get_user_role',
                security: userSearchAjax.security,
                user_id: userId
            },
            dataType: 'json',
            success: (response) => {
                if (response && response.success && response.data) {
                    // Reset roles and highlight the current one
                    $('.role-option').removeClass('selected current-role'); // Clear previous selections
                    // Use attribute selector safely
                    $(`.role-option[data-role="${response.data}"]`).addClass('selected current-role');
                } else {
                     console.warn('Could not get user role:', response?.data?.message);
                     // Optionally show a message if role fetch fails but still show modal
                     $('.role-option').removeClass('selected current-role'); // Ensure no role is pre-selected
                }
                toggleModal(true); // Show the modal
            },
            error: (xhr, status, error) => {
                console.error('Error getting user role:', status, error);
                // Show modal even on error, but maybe indicate the role couldn't be loaded
                 $('.role-option').removeClass('selected current-role');
                 // Optionally add an error message to the modal body
                toggleModal(true);
            },
            // complete: () => {
            //     modal.find('.modal-content').removeClass('loading'); // Remove loading state
            // }
        });
    };

    /**
     * Updates the user's role via AJAX.
     * @param {string|number} userId - The ID of the user.
     * @param {string} selectedRole - The role to assign.
     */
    const updateUserRole = (userId, selectedRole) => {
        // Add loading state to save button maybe?
        saveBtn.prop('disabled', true).text('กำลังบันทึก...'); // Example loading state

        $.ajax({
            url: userSearchAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'update_user_role',
                security: userSearchAjax.security,
                user_id: userId,
                role: selectedRole
            },
            dataType: 'json',
            success: (response) => {
                if (response && response.success) {
                    alert(userSearchAjax.strings?.update_success || 'อัพเดตแผนกเรียบร้อยแล้ว');
                    toggleModal(false); // Hide modal on success
                    searchInput.val(''); // Clear search input
                    selectedUserIdInput.val(''); // Clear selected user ID
                    searchResults.empty().hide(); // Clear results
                } else {
                    // Show specific error from backend if available
                    alert(response?.data?.message || userSearchAjax.strings?.update_error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
                }
            },
            error: (xhr, status, error) => {
                console.error('Update role AJAX error:', status, error);
                alert(userSearchAjax.strings?.update_error || 'เกิดข้อผิดพลาดในการอัพเดต กรุณาลองใหม่อีกครั้ง');
            },
            complete: () => {
                 saveBtn.prop('disabled', false).text('บันทึก'); // Restore button state
            }
        });
    };


    // --- Event Handlers ---

    // User search input handler (ฟังก์ชันค้นหา Users)
    searchInput.on('input', function() { // Keep 'function' if using $(this) extensively, otherwise arrow is fine
        clearTimeout(searchTimeout);
        const term = $(this).val().trim(); // Trim whitespace

        if (term.length < 2) { // Minimum characters to trigger search
            searchResults.empty().hide();
            return;
        }

        // Debounce the search function call
        searchTimeout = setTimeout(() => {
            performSearch(term);
        }, 500); // 500ms delay
    });

    // Click handler for search result items (เมื่อคลิกเลือก User)
    // Use delegated event handling on the static container
    searchResults.on('click', '.search-item', function() { // Keep 'function' to use $(this) easily
        const $item = $(this);
        const userId = $item.data('user-id');
        const userName = $item.find('strong').text(); // Get name from clicked item

        if (!userId) return; // Don't proceed if user ID is missing

        selectedUserIdInput.val(userId); // Store selected user ID
        searchResults.hide(); // Hide results dropdown
        searchInput.val(userName); // Set input field to the selected user's name

        // Fetch role and show modal
        fetchUserRoleAndShowModal(userId);
    });

    // Click handler for role options (เลือก Role)
    // Use delegated event handling if roles are added dynamically, otherwise direct is fine
    modal.on('click', '.role-option', function() { // Keep 'function' for $(this)
        $('.role-option').removeClass('selected'); // Deselect others
        $(this).addClass('selected'); // Select clicked one
    });

    // Click handler for the save button (ปุ่มบันทึก)
    saveBtn.on('click', function() { // Keep 'function' for $(this) or direct reference saveBtn
        const userId = selectedUserIdInput.val();
        const selectedRoleOption = $('.role-option.selected'); // Find the selected role div/button
        const selectedRole = selectedRoleOption.data('role');

        if (!userId) {
             alert(userSearchAjax.strings?.no_user_selected || 'ข้อผิดพลาด: ไม่ได้เลือกผู้ใช้');
             return;
        }
        if (!selectedRole) {
            alert(userSearchAjax.strings?.no_role_selected || 'กรุณาเลือกแผนก');
            return;
        }

        updateUserRole(userId, selectedRole);
    });

    // Click handler for the modal close button (ปิด Modal)
    closeBtn.on('click', function() { // Keep 'function' or use direct reference closeBtn
        toggleModal(false);
    });

    // Click handler to close modal when clicking outside the content
    $(window).on('click', function(event) { // Keep 'function' for event.target
        // Check if the click target is the modal background itself
        if ($(event.target).is(modal)) {
            toggleModal(false);
        }
    });

    // Hide search results if clicked outside search input/results
    $(document).on('click', function(event) {
         if (!$(event.target).closest('#user-search-input, #search-results').length) {
             searchResults.hide();
         }
    });

    // Optional: Override jQuery's hide/show for the modal (kept from original, but consider using classes)
    // modal.hide = function() { // This overrides the standard jQuery method, might be confusing
    //     toggleModal(false);
    // };
    // modal.show = function() {
    //     toggleModal(true);
    // };

});
