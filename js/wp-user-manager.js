/**
 * wp-user-manager.js
 * สคริปต์จัดการข้อมูลผู้ใช้ WordPress ปรับปรุงใหม่
 */
jQuery(document).ready(function($) {
    // ตัวแปรสำหรับเก็บข้อมูลการแบ่งหน้า
    let currentPage = 1;
    let totalPages = 0;
    const usersPerPage = 20; // Use const if it doesn't change
    let currentSearch = '';
    let currentRoleFilter = '';
    let isLoading = false;

    // --- Cache DOM Elements ---
    const userTableBody = $('#user-table-body');
    const prevPageBtn = $('#prev-page');
    const nextPageBtn = $('#next-page');
    const pageNumbers = $('#page-numbers');
    const paginationStart = $('#pagination-start');
    const paginationEnd = $('#pagination-end');
    const paginationTotal = $('#pagination-total');
    const searchInput = $('#user-search-input');
    const roleFilter = $('#role-filter');
    const paginationContainer = $('.pagination-container'); // Cache pagination container

    // Modal Elements
    const roleEditModal = $('#role-edit-modal');
    const editUserInfo = $('#edit-user-info');
    const editUserId = $('#edit-user-id');
    const roleOptions = $('.role-option');
    const saveRoleEditBtn = $('#save-role-edit');
    const cancelEditBtn = $('#cancel-edit');
    const closeModalBtn = $('.close-modal'); // Use a more specific selector if possible

    const deleteConfirmModal = $('#delete-confirm-modal');
    const deleteUserInfo = $('#delete-user-info');
    const deleteUserId = $('#delete-user-id');
    const confirmDeleteBtn = $('#confirm-delete');
    const cancelDeleteBtn = $('#cancel-delete');

    // --- Initialization ---
    function initTable() {
        showLoadingState(); // Show initial loading state
        loadUsers();
        setupEventListeners();
    }

    // --- Event Listeners Setup ---
    function setupEventListeners() {
        // Search and Filter
        searchInput.on('input', debounce(() => { // Use arrow function
            currentSearch = searchInput.val();
            currentPage = 1;
            loadUsers();
        }, 500));

        roleFilter.on('change', () => { // Use arrow function
            currentRoleFilter = roleFilter.val();
            currentPage = 1;
            loadUsers();
        });

        // Pagination Buttons
        prevPageBtn.on('click', () => { // Use arrow function
            if (!isLoading && currentPage > 1) {
                currentPage--;
                loadUsers();
                scrollToTable();
            }
        });

        nextPageBtn.on('click', () => { // Use arrow function
            if (!isLoading && currentPage < totalPages) {
                currentPage++;
                loadUsers();
                scrollToTable();
            }
        });

        // Page Number Clicks (Delegated)
        pageNumbers.on('click', '.page-number', function() { // Keep 'function' for $(this)
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
        userTableBody.on('click', '.edit-role-btn', function(e) { // Keep 'function' for $(this)
            e.preventDefault();
            const $button = $(this);
            const userId = $button.data('user-id');
            const username = $button.data('username');
            const currentRole = $button.data('current-role');

            editUserId.val(userId);
            editUserInfo.text(`กำลังแก้ไขบทบาทของ: ${username}`);

            roleOptions.removeClass('selected');
            $(`.role-option[data-role="${currentRole}"]`).addClass('selected');

            openModal(roleEditModal);
        });

        // Role Option Click in Modal
        roleOptions.on('click', function() { // Keep 'function' for $(this)
            roleOptions.removeClass('selected');
            $(this).addClass('selected');
        });

        // Save Role Edit Button Click
        saveRoleEditBtn.on('click', () => { // Use arrow function
            const userId = editUserId.val();
            const selectedRole = $('.role-option.selected').data('role');

            if (!selectedRole) {
                showNotification('กรุณาเลือกบทบาท', 'warning');
                return;
            }
            updateUserRole(userId, selectedRole);
        });

        // Delete User Button Click (Delegated)
        userTableBody.on('click', '.delete-user-btn', function(e) { // Keep 'function' for $(this)
            e.preventDefault();
            const $button = $(this);
            const userId = $button.data('user-id');
            const username = $button.data('username');

            deleteUserId.val(userId);
            // Use text() for plain text, html() if you need bold etc. Ensure username is escaped if needed.
            deleteUserInfo.html(`<strong>คำเตือน:</strong> คุณต้องการลบผู้ใช้ "${username}" ใช่หรือไม่?<br>การกระทำนี้ไม่สามารถเรียกคืนได้`);

            openModal(deleteConfirmModal);
        });

        // Confirm Delete Button Click
        confirmDeleteBtn.on('click', () => { // Use arrow function
            const userId = deleteUserId.val();
            deleteUser(userId);
        });

        // Modal Cancel/Close Buttons
        cancelEditBtn.on('click', () => closeModal(roleEditModal)); // Use arrow function
        cancelDeleteBtn.on('click', () => closeModal(deleteConfirmModal)); // Use arrow function
        closeModalBtn.on('click', function() { // Keep 'function' for $(this)
            closeModal($(this).closest('.modal'));
        });

        // Close Modal on Background Click
        $(window).on('click', (event) => { // Use arrow function
            if ($(event.target).hasClass('modal')) {
                closeModal($(event.target));
            }
        });

        // Prevent Enter key submission in search input
        searchInput.on('keydown', (e) => { // Use arrow function
            if (e.key === 'Enter' || e.keyCode === 13) {
                e.preventDefault();
                // Optionally trigger search immediately on Enter
                // currentSearch = searchInput.val();
                // currentPage = 1;
                // loadUsers();
                return false;
            }
        });
    }

    // --- Loading State ---
    function showLoadingState() {
         userTableBody.html(`
            <tr class="loading-row">
                <td colspan="4" class="loading-cell">
                    <div class="loader"></div>
                    <span>กำลังโหลดข้อมูลผู้ใช้...</span>
                </td>
            </tr>
        `);
         // Disable pagination while loading
        prevPageBtn.prop('disabled', true);
        nextPageBtn.prop('disabled', true);
        pageNumbers.empty(); // Clear old page numbers
        paginationContainer.addClass('hidden'); // Hide pagination info/controls
    }

    // --- Data Loading ---
    function loadUsers() {
        if (isLoading) return;
        isLoading = true;
        showLoadingState(); // Show loading row and disable controls

        $.ajax({
            url: wpUserManager.ajaxurl, // Ensure wpUserManager object is available
            type: 'POST',
            data: {
                action: 'get_users_data',
                security: wpUserManager.security, // Nonce
                page: currentPage,
                per_page: usersPerPage,
                search: currentSearch,
                role: currentRoleFilter
            },
            dataType: 'json', // Expect JSON response
            success: (response) => { // Use arrow function
                if (response && response.success && response.data) {
                    displayUsers(response.data);
                    updatePagination(response.data);
                } else {
                    const message = response?.data?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง';
                    showErrorMessage(message);
                }
            },
            error: (xhr, status, error) => { // Use arrow function
                console.error('Error loading users:', status, error);
                showErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง');
            },
            complete: () => { // Use arrow function
                isLoading = false;
                // Re-enable buttons in updatePagination based on new totalPages
            }
        });
    }

    // --- Display Users ---
    function displayUsers(data) {
        const users = data.users;

        if (!Array.isArray(users) || users.length === 0) {
            handleEmptyResults();
            return;
        }

        userTableBody.empty(); // Clear loading row or previous content

        users.forEach((user, index) => { // Add index for animation delay
            const fullName = (user.first_name || user.last_name)
                ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                : '-';
            const roles = Array.isArray(user.roles) ? user.roles.join(', ') : '-';
            const primaryRole = Array.isArray(user.role_keys) ? (user.role_keys[0] || '') : '';
            const initial = user.display_name ? user.display_name.charAt(0).toUpperCase() : '?';

            // Use template literals for cleaner HTML
            const userRow = $(`
                <tr style="opacity: 0; transform: translateY(10px);">
                    <td class="username-cell">
                        <div class="user-info">
                            <div class="avatar">
                                <span class="initial">${initial}</span>
                            </div>
                            <div class="user-details">
                                <span class="username">${user.username || '-'}</span>
                                <span class="email">${user.email || '-'}</span>
                            </div>
                        </div>
                    </td>
                    <td>${fullName}</td>
                    <td><span class="role-badge">${roles}</span></td>
                    <td class="actions-cell">
                        <button class="edit-role-btn"
                            data-user-id="${user.id}"
                            data-username="${user.username || ''}"
                            data-current-role="${primaryRole}">
                            <svg viewBox="0 0 24 24" class="icon"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z"></path></svg>
                            แก้ไขบทบาท
                        </button>
                        <button class="delete-user-btn"
                            data-user-id="${user.id}"
                            data-username="${user.username || ''}">
                            <svg viewBox="0 0 24 24" class="icon"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                            ลบผู้ใช้
                        </button>
                    </td>
                </tr>
            `);
            userTableBody.append(userRow);

            // Staggered animation using requestAnimationFrame for potentially smoother results
            setTimeout(() => {
                 requestAnimationFrame(() => {
                    userRow.css({
                        'transition': 'opacity 0.3s ease, transform 0.3s ease',
                        'opacity': '1',
                        'transform': 'translateY(0)'
                    });
                 });
            }, index * 50); // Stagger delay
        });
    }

     // --- Handle Empty/Error States ---
    function handleEmptyResults() {
        let emptyMessage = 'ไม่พบข้อมูลผู้ใช้';
        if (currentSearch) {
            emptyMessage = `ไม่พบผู้ใช้ที่ตรงกับคำค้นหา "${currentSearch}"`;
        } else if (currentRoleFilter) {
            const roleName = roleFilter.find('option:selected').text();
            emptyMessage = `ไม่พบผู้ใช้ในบทบาท "${roleName}"`;
        }
        showErrorMessage(emptyMessage);
    }

    function showErrorMessage(message) {
         userTableBody.html(`
            <tr>
                <td colspan="4" class="empty-message">
                    ${message}
                </td>
            </tr>
        `);
         paginationContainer.addClass('hidden'); // Hide pagination on error/empty
    }

    // --- Pagination Logic (Refactored) ---

    /**
     * Generates an array of page numbers and ellipses to display.
     * @param {number} currentPage - The current active page.
     * @param {number} totalPages - Total number of pages.
     * @returns {Array<number|string>} Array containing page numbers and '...' for ellipses.
     */
    function generatePageItems(currentPage, totalPages) {
        const pageItems = [];
        const maxPagesToShow = 5; // Max number of direct page links shown
        const edgePages = 1; // Number of pages to show at the start/end
        const adjacentPages = 1; // Number of pages to show around the current page

        if (totalPages <= maxPagesToShow) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pageItems.push(i);
            }
        } else {
            // Always show first page(s)
            for (let i = 1; i <= edgePages; i++) {
                 pageItems.push(i);
            }

            // Calculate range around current page
            const startRange = Math.max(edgePages + 1, currentPage - adjacentPages);
            const endRange = Math.min(totalPages - edgePages, currentPage + adjacentPages);

            // Ellipsis before middle range?
            if (startRange > edgePages + 1) {
                pageItems.push('...');
            }

            // Middle range pages
            for (let i = startRange; i <= endRange; i++) {
                pageItems.push(i);
            }

            // Ellipsis after middle range?
            if (endRange < totalPages - edgePages) {
                pageItems.push('...');
            }

            // Always show last page(s)
             for (let i = totalPages - edgePages + 1; i <= totalPages; i++) {
                 // Avoid duplicates if range overlaps edge
                 if (pageItems.indexOf(i) === -1) {
                    pageItems.push(i);
                 }
             }
        }
        return pageItems;
    }

    /**
     * Updates the pagination display based on the data received.
     * @param {object} data - Data object containing total_pages, total users.
     */
    function updatePagination(data) {
        totalPages = parseInt(data.total_pages) || 0; // Ensure it's a number
        const totalUsers = parseInt(data.total) || 0;

        // Hide pagination if no users or only one page
        if (totalUsers === 0 || totalPages <= 1) {
            paginationContainer.addClass('hidden');
            return; // Exit early
        }

        paginationContainer.removeClass('hidden'); // Show pagination

        // Calculate displayed item range
        const start = (currentPage - 1) * usersPerPage + 1;
        const end = Math.min(start + usersPerPage - 1, totalUsers);

        // Update pagination info text
        paginationStart.text(start);
        paginationEnd.text(end);
        paginationTotal.text(totalUsers);

        // Update prev/next button states
        prevPageBtn.prop('disabled', currentPage <= 1);
        nextPageBtn.prop('disabled', currentPage >= totalPages);

        // Generate and display page number buttons/ellipses
        pageNumbers.empty(); // Clear previous items
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
        // Use template literal for cleaner HTML
        pageNumbers.append(`
            <button class="page-number ${isActive ? 'active' : ''}" data-page="${pageNum}">
                ${pageNum}
            </button>
        `);
    }

    /**
     * Appends an ellipsis span to the pagination controls.
     */
    function addEllipsis() {
        pageNumbers.append('<span class="page-ellipsis">...</span>');
    }

    // --- User Actions (Update Role, Delete User) ---
    function updateUserRole(userId, role) {
        saveRoleEditBtn.html('<span class="loading-text">กำลังบันทึก...</span>').prop('disabled', true);

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
            success: (response) => { // Use arrow function
                if (response && response.success) {
                    showNotification(wpUserManager.messages?.updateSuccess || 'อัปเดตบทบาทสำเร็จ', 'success');
                    closeModal(roleEditModal);
                    loadUsers(); // Reload table to reflect changes
                } else {
                    showNotification(response?.data?.message || wpUserManager.messages?.updateError || 'เกิดข้อผิดพลาดในการอัปเดต', 'error');
                }
            },
            error: (xhr, status, error) => { // Use arrow function
                console.error('Update role error:', status, error);
                showNotification(wpUserManager.messages?.updateError || 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
            },
            complete: () => { // Use arrow function
                saveRoleEditBtn.html('บันทึก').prop('disabled', false); // Restore button state
            }
        });
    }

    function deleteUser(userId) {
        confirmDeleteBtn.html('<span class="loading-text">กำลังลบ...</span>').prop('disabled', true);

        $.ajax({
            url: wpUserManager.ajaxurl,
            type: 'POST',
            data: {
                action: 'delete_wp_user',
                security: wpUserManager.security,
                user_id: userId
            },
             dataType: 'json',
            success: (response) => { // Use arrow function
                if (response && response.success) {
                    showNotification(wpUserManager.messages?.deleteSuccess || 'ลบผู้ใช้สำเร็จ', 'success');
                    closeModal(deleteConfirmModal);
                    // Adjust current page if the last user on the page was deleted
                    if (userTableBody.find('tr').length === 1 && currentPage > 1) {
                         currentPage--;
                    }
                    loadUsers(); // Reload users
                } else {
                    showNotification(response?.data?.message || wpUserManager.messages?.deleteError || 'เกิดข้อผิดพลาดในการลบ', 'error');
                }
            },
            error: (xhr, status, error) => { // Use arrow function
                console.error('Delete user error:', status, error);
                showNotification(wpUserManager.messages?.deleteError || 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
            },
            complete: () => { // Use arrow function
                 confirmDeleteBtn.html('ลบผู้ใช้').prop('disabled', false); // Restore button state
            }
        });
    }

    // --- Modal Handling ---
    function openModal(modal) {
        modal.fadeIn(300);
        $('body').addClass('modal-open');
        // Centering logic might be better handled with CSS
        // const modalContent = modal.find('.modal-content');
        // modalContent.css({ /* ... centering styles ... */ });
    }

    function closeModal(modal) {
        modal.fadeOut(200, () => { // Add callback to remove class after fade out
            // Only remove body class if no other modals are open
            if ($('.modal:visible').length === 0) {
                $('body').removeClass('modal-open');
            }
        });
    }

    // --- Notifications ---
    function showNotification(message, type = 'info') { // Default type
        $('.notification').remove(); // Remove existing ones first

        const notification = $(`
            <div class="notification ${type}">
                <span class="notification-message">${message}</span>
                <button type="button" class="notification-close">&times;</button>
            </div>
        `);

        $('body').append(notification);

        // Use requestAnimationFrame for smoother animation start
        requestAnimationFrame(() => {
            notification.addClass('show');
        });

        // Auto-hide timer
        const autoHideTimer = setTimeout(() => {
             hideNotification(notification);
        }, 5000); // Increased duration

        // Close button handler
        notification.find('.notification-close').on('click', () => {
            clearTimeout(autoHideTimer); // Prevent auto-hide if closed manually
            hideNotification(notification);
        });
    }

    function hideNotification(notification) {
        notification.removeClass('show');
        // Remove from DOM after transition
        setTimeout(() => {
            notification.remove();
        }, 300); // Match CSS transition duration
    }

    // --- Utilities ---
    function scrollToTable() {
        const tableWrapper = $('.user-table-wrapper');
        if (tableWrapper.length) {
            $('html, body').animate({
                scrollTop: tableWrapper.offset().top - 20 // Adjust offset as needed
            }, 300);
        }
    }

    function debounce(func, wait) {
        let timeout;
        // Use rest parameters and arrow function for modern syntax
        return (...args) => {
            // Use 'this' from the outer scope (where debounce is called) if needed,
            // but typically not necessary for simple debounced functions like search.
            // const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(null, args), wait); // Use apply(null, ...) if context isn't needed
        };
    }

    // --- Initial Load ---
    initTable();

}); // End document ready
