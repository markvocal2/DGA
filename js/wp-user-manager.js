/**
 * wp-user-manager.js
 * สคริปต์จัดการข้อมูลผู้ใช้ WordPress ปรับปรุงใหม่
 * Version: 1.0.2 (Refactored - Addressed SonarQube L650)
 */
jQuery(document).ready(function($) {
    'use strict';

    // --- State Variables ---
    let currentPage = 1;
    let totalPages = 0;
    const usersPerPage = 20; // Number of users per page
    let currentSearch = '';
    let currentRoleFilter = '';
    let isLoading = false; // Prevent concurrent AJAX calls

    // --- Cache DOM Elements ---
    const $userTableBody = $('#user-table-body');
    const $prevPageBtn = $('#prev-page');
    const $nextPageBtn = $('#next-page');
    const $pageNumbers = $('#page-numbers');
    const $paginationStart = $('#pagination-start');
    const $paginationEnd = $('#pagination-end');
    const $paginationTotal = $('#pagination-total');
    const $searchInput = $('#user-search-input');
    const $roleFilter = $('#role-filter');
    const $paginationContainer = $('.pagination-container');
    const $tableWrapper = $('.user-table-wrapper'); // For scrolling

    // Modal Elements
    const $roleEditModal = $('#role-edit-modal');
    const $editUserInfo = $('#edit-user-info');
    const $editUserId = $('#edit-user-id');
    const $roleOptions = $('.role-option'); // Assuming these are within the edit modal
    const $saveRoleEditBtn = $('#save-role-edit');
    const $cancelEditBtn = $('#cancel-edit'); // Specific cancel button for edit modal

    const $deleteConfirmModal = $('#delete-confirm-modal');
    const $deleteUserInfo = $('#delete-user-info');
    const $deleteUserId = $('#delete-user-id');
    const $confirmDeleteBtn = $('#confirm-delete');
    const $cancelDeleteBtn = $('#cancel-delete'); // Specific cancel button for delete modal

    const $closeModalBtns = $('.modal .close-modal'); // General close buttons in any modal

    // --- Configuration Check ---
    if (typeof wpUserManager === 'undefined' || !wpUserManager.ajaxurl || !wpUserManager.security || !wpUserManager.messages) {
        console.error('WP User Manager: Configuration object (wpUserManager) is missing or incomplete. Functionality may be limited.');
        // Display error to user if table body exists
        if ($userTableBody.length) {
            showErrorMessage('เกิดข้อผิดพลาดในการโหลดการตั้งค่า');
        }
        return; // Stop initialization
    }

    // --- Initialization ---
    function initTable() {
        showLoadingState(); // Show initial loading state
        loadUsers();
        setupEventListeners();
    }

    // --- Event Listeners Setup ---
    function setupEventListeners() {
        // Search (Debounced)
        $searchInput.on('input', debounce(() => {
            const searchTerm = $searchInput.val().trim();
            if (currentSearch !== searchTerm) { // Only trigger if search term changed
                currentSearch = searchTerm;
                currentPage = 1;
                loadUsers();
            }
        }, 500));

        // Prevent form submission on Enter in search
        $searchInput.on('keydown', (e) => {
            if (e.key === 'Enter' || e.keyCode === 13) {
                e.preventDefault();
                // Optionally trigger immediate search here if desired
            }
        });

        // Role Filter
        $roleFilter.on('change', () => {
            const selectedRole = $roleFilter.val();
            if (currentRoleFilter !== selectedRole) {
                currentRoleFilter = selectedRole;
                currentPage = 1;
                loadUsers();
            }
        });

        // Pagination Buttons
        $prevPageBtn.on('click', () => {
            if (!isLoading && currentPage > 1) {
                currentPage--;
                loadUsers();
                scrollToTable();
            }
        });

        $nextPageBtn.on('click', () => {
            if (!isLoading && currentPage < totalPages) {
                currentPage++;
                loadUsers();
                scrollToTable();
            }
        });

        // Page Number Clicks (Delegated)
        $pageNumbers.on('click', '.page-number', function() { // Needs 'function' for $(this)
            if (!isLoading) {
                const pageNum = parseInt($(this).data('page'));
                if (pageNum !== currentPage) {
                    currentPage = pageNum;
                    loadUsers();
                    scrollToTable();
                }
            }
        });

        // Edit Role Button Click (Delegated)
        $userTableBody.on('click', '.edit-role-btn', function(e) { // Needs 'function' for $(this)
            e.preventDefault();
            const $button = $(this);
            const userId = $button.data('user-id');
            const username = $button.data('username') || 'ผู้ใช้'; // Fallback username
            const currentRole = $button.data('current-role');

            if (!userId) {
                console.error('Edit Role Error: Missing user ID.');
                showNotification('เกิดข้อผิดพลาด: ไม่พบ ID ผู้ใช้', 'error');
                return;
            }

            $editUserId.val(userId);
            $editUserInfo.text(`กำลังแก้ไขบทบาทของ: ${username}`);

            // Reset and select current role in modal
            $roleOptions.removeClass('selected');
            $(`.role-option[data-role="${currentRole}"]`).addClass('selected');

            openModal($roleEditModal);
        });

        // Role Option Click in Modal (Delegated from modal body for reliability)
        $roleEditModal.on('click', '.role-option', function() { // Needs 'function' for $(this)
             // Ensure only one option is selected visually
             $roleEditModal.find('.role-option').removeClass('selected');
             $(this).addClass('selected');
        });


        // Save Role Edit Button Click
        $saveRoleEditBtn.on('click', () => {
            const userId = $editUserId.val();
            const selectedRole = $roleEditModal.find('.role-option.selected').data('role'); // Find within modal

            if (!selectedRole) {
                showNotification('กรุณาเลือกบทบาท', 'warning');
                return;
            }
            updateUserRole(userId, selectedRole);
        });

        // Delete User Button Click (Delegated)
        $userTableBody.on('click', '.delete-user-btn', function(e) { // Needs 'function' for $(this)
            e.preventDefault();
            const $button = $(this);
            const userId = $button.data('user-id');
            const username = $button.data('username') || 'ผู้ใช้นี้'; // Fallback username

             if (!userId) {
                 console.error('Delete User Error: Missing user ID.');
                 showNotification('เกิดข้อผิดพลาด: ไม่พบ ID ผู้ใช้', 'error');
                 return;
             }

            $deleteUserId.val(userId);
            // Use text() for safety, construct HTML carefully if needed
            $deleteUserInfo.html(`<strong>คำเตือน:</strong> คุณต้องการลบผู้ใช้ "${username}" ใช่หรือไม่?<br>การกระทำนี้ไม่สามารถเรียกคืนได้`);

            openModal($deleteConfirmModal);
        });

        // Confirm Delete Button Click
        $confirmDeleteBtn.on('click', () => {
            const userId = $deleteUserId.val();
            if (userId) {
                 deleteUser(userId);
            } else {
                 console.error("Delete confirmation error: User ID missing.");
            }
        });

        // Modal Cancel/Close Buttons
        $cancelEditBtn.on('click', () => closeModal($roleEditModal));
        $cancelDeleteBtn.on('click', () => closeModal($deleteConfirmModal));
        $closeModalBtns.on('click', function() { // Needs 'function' for $(this)
            closeModal($(this).closest('.modal'));
        });

        // Close Modal on Background Click
        $('.modal').on('click', function(event) { // Attach directly to modal elements
             if (event.target === this) { // Check if the click is directly on the modal background
                  closeModal($(this));
             }
        });
    }

    // --- Loading State ---
    function showLoadingState() {
        $userTableBody.html(`
            <tr class="loading-row">
                <td colspan="4" class="loading-cell">
                    <div class="loader"></div>
                    <span>กำลังโหลดข้อมูลผู้ใช้...</span>
                </td>
            </tr>
        `);
        // Disable pagination while loading
        $prevPageBtn.prop('disabled', true);
        $nextPageBtn.prop('disabled', true);
        $pageNumbers.empty(); // Clear old page numbers
        $paginationContainer.addClass('hidden'); // Hide pagination info/controls
    }

    // --- Data Loading ---
    function loadUsers() {
        if (isLoading) return;
        isLoading = true;
        showLoadingState(); // Show loading row and disable controls

        $.ajax({
            url: wpUserManager.ajaxurl,
            type: 'POST',
            data: {
                action: 'get_users_data',
                security: wpUserManager.security, // Nonce
                page: currentPage,
                per_page: usersPerPage,
                search: currentSearch,
                role: currentRoleFilter
            },
            dataType: 'json',
            success: (response) => {
                if (response && response.success && response.data) {
                    displayUsers(response.data);
                    updatePagination(response.data);
                } else {
                    const message = response?.data?.message || wpUserManager.messages?.loadError || 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
                    showErrorMessage(message);
                }
            },
            error: (xhr, status, error) => {
                console.error('Error loading users:', status, error);
                showErrorMessage(wpUserManager.messages?.ajaxError || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
            },
            complete: () => {
                isLoading = false;
                // Pagination buttons are re-enabled/disabled within updatePagination
            }
        });
    }

    // --- Display Users (Refactored for Nesting) ---

    /**
     * Animates a user row appearing in the table.
     * @param {jQuery} userRowElement - The jQuery object for the table row (<tr>).
     * @param {number} delay - The delay in milliseconds before starting the animation.
     */
    function animateUserRowIn(userRowElement, delay) {
        setTimeout(() => {
            // Use rAF for smoother animation start after the delay
            requestAnimationFrame(() => {
                userRowElement.css({
                    'transition': 'opacity 0.3s ease, transform 0.3s ease',
                    'opacity': '1',
                    'transform': 'translateY(0)'
                });
            });
        }, delay);
    }

    /**
     * Displays the fetched users in the table.
     * @param {object} data - The data object containing users and pagination info.
     */
    function displayUsers(data) {
        const users = data.users;

        if (!Array.isArray(users) || users.length === 0) {
            handleEmptyResults();
            return;
        }

        $userTableBody.empty(); // Clear loading row or previous content
        const fragment = document.createDocumentFragment(); // Use fragment for performance

        users.forEach((user, index) => {
            // Basic data validation/defaults
            const userId = user.id || 'N/A';
            const username = user.username || '-';
            const email = user.email || '-';
            const firstName = user.first_name || '';
            const lastName = user.last_name || '';
            const displayName = user.display_name || username; // Fallback to username
            const fullName = `${firstName} ${lastName}`.trim() || '-';
            const roles = Array.isArray(user.roles) ? user.roles.join(', ') : '-';
            const primaryRoleKey = Array.isArray(user.role_keys) ? (user.role_keys[0] || '') : '';
            const initial = displayName.charAt(0).toUpperCase() || '?';

            // Create row HTML
            const userRowHtml = `
                <tr style="opacity: 0; transform: translateY(10px);">
                    <td class="username-cell">
                        <div class="user-info">
                            <div class="avatar"><span class="initial">${initial}</span></div>
                            <div class="user-details">
                                <span class="username">${username}</span>
                                <span class="email">${email}</span>
                            </div>
                        </div>
                    </td>
                    <td>${fullName}</td>
                    <td><span class="role-badge">${roles}</span></td>
                    <td class="actions-cell">
                        <button class="edit-role-btn" data-user-id="${userId}" data-username="${username}" data-current-role="${primaryRoleKey}" title="แก้ไขบทบาท">
                            <svg viewBox="0 0 24 24" class="icon"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z"></path></svg>
                            แก้ไขบทบาท
                        </button>
                        <button class="delete-user-btn" data-user-id="${userId}" data-username="${username}" title="ลบผู้ใช้">
                            <svg viewBox="0 0 24 24" class="icon"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                            ลบผู้ใช้
                        </button>
                    </td>
                </tr>
            `;
            const $userRow = $(userRowHtml);
            $(fragment).append($userRow); // Append jQuery object to fragment

            // Call the extracted animation function
            animateUserRowIn($userRow, index * 50);
        });

        $userTableBody.append(fragment); // Append all rows at once
    }


    // --- Handle Empty/Error States ---
    function handleEmptyResults() {
        let emptyMessage = wpUserManager.messages?.noUsers || 'ไม่พบข้อมูลผู้ใช้';
        if (currentSearch) {
            emptyMessage = `ไม่พบผู้ใช้ที่ตรงกับคำค้นหา "${currentSearch}"`;
        } else if (currentRoleFilter) {
            const roleName = $roleFilter.find('option:selected').text();
            emptyMessage = `ไม่พบผู้ใช้ในบทบาท "${roleName}"`;
        }
        showErrorMessage(emptyMessage);
    }

    function showErrorMessage(message) {
        $userTableBody.html(`
            <tr>
                <td colspan="4" class="empty-message">
                    ${message}
                </td>
            </tr>
        `);
        $paginationContainer.addClass('hidden'); // Hide pagination on error/empty
    }

    // --- Pagination Logic (Refactored for Complexity) ---

    /**
     * Generates the sequence of page numbers and ellipses for complex pagination.
     * @param {number} currentPage - The current active page.
     * @param {number} totalPages - Total number of pages.
     * @param {number} edgePages - Number of pages to show at the start/end (e.g., 1).
     * @param {number} adjacentPages - Number of pages to show around the current page (e.g., 1 -> shows current +/- 1).
     * @returns {Array<number|string>} Array containing page numbers and '...' for ellipses.
     */
    function generateComplexPageItems(currentPage, totalPages, edgePages, adjacentPages) {
        const pageItems = [];
        const addedPages = new Set(); // Keep track of added page numbers

        // Helper to add a page number if not already added
        const addPage = (pageNum) => {
            if (pageNum >= 1 && pageNum <= totalPages && !addedPages.has(pageNum)) {
                pageItems.push(pageNum);
                addedPages.add(pageNum);
            }
        };

        // Add first edge pages
        for (let i = 1; i <= edgePages; i++) {
            addPage(i);
        }

        // Calculate range for middle pages
        const startRange = Math.max(edgePages + 1, currentPage - adjacentPages);
        const endRange = Math.min(totalPages - edgePages, currentPage + adjacentPages);

        // Ellipsis before middle range?
        if (startRange > edgePages + 1) {
            pageItems.push('...');
        }

        // Add middle range pages
        for (let i = startRange; i <= endRange; i++) {
            addPage(i);
        }

        // Ellipsis after middle range?
        // Check if the last page in the middle range is less than the first page of the end edge range minus 1
        if (endRange < totalPages - edgePages) {
            pageItems.push('...');
        }

        // Add last edge pages
        for (let i = totalPages - edgePages + 1; i <= totalPages; i++) {
            addPage(i);
        }

        return pageItems;
    }


    /**
     * Generates an array of page numbers and ellipses to display in pagination.
     * @param {number} currentPage - The current active page.
     * @param {number} totalPages - Total number of pages.
     * @returns {Array<number|string>} Array containing page numbers and '...' for ellipses.
     */
    function generatePageItems(currentPage, totalPages) {
        const maxPagesToShow = 7; // Example: 1 ... 4 5 6 ... 10 (includes ellipses)
        const edgePages = 1;      // Show first 1 and last 1
        const adjacentPages = 1;  // Show 1 page before and 1 page after current (total 3 in middle)

        // If total pages are few, show all
        if (totalPages <= maxPagesToShow) {
            const allPages = [];
            for (let i = 1; i <= totalPages; i++) {
                allPages.push(i);
            }
            return allPages;
        } else {
            // Use the helper for complex cases
            return generateComplexPageItems(currentPage, totalPages, edgePages, adjacentPages);
        }
    }


    /**
     * Updates the pagination display based on the data received.
     * @param {object} data - Data object containing total_pages, total users.
     */
    function updatePagination(data) {
        totalPages = parseInt(data.total_pages) || 0;
        const totalUsers = parseInt(data.total) || 0;

        if (totalUsers === 0 || totalPages <= 1) {
            $paginationContainer.addClass('hidden');
            return;
        }

        $paginationContainer.removeClass('hidden');

        const start = Math.min((currentPage - 1) * usersPerPage + 1, totalUsers); // Ensure start doesn't exceed total
        const end = Math.min(start + usersPerPage - 1, totalUsers);

        $paginationStart.text(start);
        $paginationEnd.text(end);
        $paginationTotal.text(totalUsers);

        $prevPageBtn.prop('disabled', currentPage <= 1);
        $nextPageBtn.prop('disabled', currentPage >= totalPages);

        $pageNumbers.empty();
        const pageItems = generatePageItems(currentPage, totalPages);

        pageItems.forEach(item => {
            if (typeof item === 'number') {
                addPageNumber(item);
            } else if (item === '...') {
                addEllipsis();
            }
        });
    }

    /**
     * Appends a page number button to the pagination controls.
     * @param {number} pageNum - The page number.
     */
    function addPageNumber(pageNum) {
        const isActive = pageNum === currentPage;
        $pageNumbers.append(`
            <button class="page-number ${isActive ? 'active' : ''}" data-page="${pageNum}" ${isActive ? 'aria-current="page"' : ''}>
                ${pageNum}
            </button>
        `);
    }

    /**
     * Appends an ellipsis span to the pagination controls.
     */
    function addEllipsis() {
        $pageNumbers.append('<span class="page-ellipsis" aria-hidden="true">...</span>');
    }

    // --- User Actions (Update Role, Delete User) ---
    function updateUserRole(userId, role) {
        // Prevent action if already loading
        if (isLoading) return;
        isLoading = true;
        $saveRoleEditBtn.html('<span class="loading-text">กำลังบันทึก...</span>').prop('disabled', true);

        $.ajax({
            url: wpUserManager.ajaxurl,
            type: 'POST',
            data: {
                action: 'update_user_role',
                security: wpUserManager.security,
                user_id: userId,
                role: role
            },
            dataType: 'json',
            success: (response) => {
                if (response && response.success) {
                    showNotification(wpUserManager.messages?.updateSuccess || 'อัปเดตบทบาทสำเร็จ', 'success');
                    closeModal($roleEditModal);
                    loadUsers(); // Reload table to reflect changes
                } else {
                    showNotification(response?.data?.message || wpUserManager.messages?.updateError || 'เกิดข้อผิดพลาดในการอัปเดต', 'error');
                }
            },
            error: (xhr, status, error) => {
                console.error('Update role error:', status, error);
                showNotification(wpUserManager.messages?.ajaxError || 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
            },
            complete: () => {
                isLoading = false;
                $saveRoleEditBtn.html('บันทึก').prop('disabled', false); // Restore button state
            }
        });
    }

    function deleteUser(userId) {
         // Prevent action if already loading
        if (isLoading) return;
        isLoading = true;
        $confirmDeleteBtn.html('<span class="loading-text">กำลังลบ...</span>').prop('disabled', true);

        $.ajax({
            url: wpUserManager.ajaxurl,
            type: 'POST',
            data: {
                action: 'delete_wp_user',
                security: wpUserManager.security,
                user_id: userId
            },
            dataType: 'json',
            success: (response) => {
                if (response && response.success) {
                    showNotification(wpUserManager.messages?.deleteSuccess || 'ลบผู้ใช้สำเร็จ', 'success');
                    closeModal($deleteConfirmModal);
                    // Adjust current page if the last user on the page was deleted
                    if ($userTableBody.find('tr').length === 1 && currentPage > 1) {
                         currentPage--;
                    }
                    loadUsers(); // Reload users
                } else {
                    showNotification(response?.data?.message || wpUserManager.messages?.deleteError || 'เกิดข้อผิดพลาดในการลบ', 'error');
                }
            },
            error: (xhr, status, error) => {
                console.error('Delete user error:', status, error);
                showNotification(wpUserManager.messages?.ajaxError || 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
            },
            complete: () => {
                 isLoading = false; // Reset loading state
                 $confirmDeleteBtn.html('ลบผู้ใช้').prop('disabled', false); // Restore button state
            }
        });
    }

    // --- Modal Handling ---
    function openModal(modal) {
        modal.fadeIn(200); // Faster fade-in
        $('body').addClass('modal-open');
    }

    function closeModal(modal) {
        modal.fadeOut(200, () => { // Faster fade-out
            if ($('.modal:visible').length === 0) {
                $('body').removeClass('modal-open');
            }
        });
    }

    // --- Notifications (Refactored for Nesting) ---

    /**
     * Hides and removes the notification element after its fade-out transition.
     * @param {jQuery} notification - The notification element.
     */
    function removeNotificationAfterFade(notification) {
           // Remove from DOM after transition
           setTimeout(() => {
                notification.remove();
           }, 300); // Match CSS transition duration
    }

    /**
     * Schedules the removal of a notification.
     * @param {jQuery} notification - The notification element.
     * @param {number} [duration=5000] - How long the notification stays visible (ms).
     */
    function scheduleNotificationRemoval(notification, duration = 5000) {
           const autoHideTimer = setTimeout(() => {
                notification.removeClass('show');
                removeNotificationAfterFade(notification);
           }, duration);

           // Store timer data to allow cancellation on manual close
           notification.data('autoHideTimer', autoHideTimer);
    }

    /**
     * Displays a short-lived notification message (toast).
     * @param {string} message - The message to display.
     * @param {string} [type='info'] - The type ('info', 'success', 'warning', 'error').
     */
    function showNotification(message, type = 'info') {
        $('.notification').remove(); // Remove existing ones first

        const notification = $(`
            <div class="notification ${type}">
                <span class="notification-message">${message}</span>
                <button type="button" class="notification-close" aria-label="Close">&times;</button>
            </div>
        `);

        $('body').append(notification);

        // Use requestAnimationFrame for smoother animation start
        requestAnimationFrame(() => {
             // Force reflow before adding class by reading offsetHeight.
             // Assign to an unused variable to satisfy SonarQube/linters ("expression expected").
             const _unused = notification[0].offsetHeight; // Force reflow (Side effect is the goal)

             // Now add the class to trigger the transition
             notification.addClass('show');
        });

        // Schedule auto-hide
        scheduleNotificationRemoval(notification);

        // Close button handler
        notification.find('.notification-close').on('click', () => {
            clearTimeout(notification.data('autoHideTimer')); // Cancel auto-hide
            notification.removeClass('show');
            removeNotificationAfterFade(notification);
        });
    }


    // --- Utilities ---
    function scrollToTable() {
        if ($tableWrapper.length) {
            $('html, body').animate({
                scrollTop: $tableWrapper.offset().top - 20 // Adjust offset as needed
            }, 300);
        }
    }

    function debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(null, args), wait);
        };
    }

    // --- Initial Load ---
    if ($userTableBody.length) { // Only initialize if the table body exists
        initTable();
    } else {
        console.warn('WP User Manager: Table body #user-table-body not found. Initialization skipped.');
    }

}); // End document ready
