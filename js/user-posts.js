/**
 * User Posts Module
 * Manages AJAX functions and user interactions for the user posts shortcode.
 * (จัดการฟังก์ชัน AJAX และการโต้ตอบกับผู้ใช้สำหรับ shortcode แสดงโพสของผู้ใช้)
 */
const UserPostsModule = (function($) {
    // Private variables (ตัวแปรส่วนตัว)
    let container;
    let containerSelector;
    let isLoading = false;
    let modalContainer;

    // Cache DOM elements (เก็บค่า DOM elements)
    const cacheElements = function() {
        // Ensure container is valid before finding elements
        if (!container || container.length === 0) {
            console.error('User Posts container not initialized or found during cacheElements.');
            return {}; // Return empty object or handle error appropriately
        }
        return {
            searchInput: container.find('#user-posts-search'),
            postTypeFilter: container.find('#user-posts-type-filter'),
            statusFilter: container.find('#user-posts-status-filter'),
            perPageSelect: container.find('#user-posts-per-page'),
            postsList: container.find('#user-posts-list'),
            paginationContainer: container.find('.user-posts-pagination')
        };
    };

    // Initialize Module (เริ่มต้น Module)
    const init = function(containerId) {
        containerSelector = '#' + containerId;
        container = $(containerSelector);

        if (container.length === 0) {
            console.error('User Posts container not found:', containerSelector);
            return;
        }

        // Create Modal container if it doesn't exist
        // (สร้าง Modal container ถ้ายังไม่มี)
        if ($('#user-posts-modal').length === 0) {
            $('body').append(`
                <div id="user-posts-modal" class="user-posts-modal">
                    <div class="user-posts-modal-content">
                        <div class="user-posts-modal-header">
                            <h3>ยืนยันการลบโพส</h3>
                            <span class="user-posts-modal-close">&times;</span>
                        </div>
                        <div class="user-posts-modal-body">
                            <p>คุณจะไม่สามารถกู้คืนโพสนี้ได้อีก คุณต้องการลบหรือไม่?</p>
                        </div>
                        <div class="user-posts-modal-footer">
                            <button id="user-posts-confirm-delete" class="btn-confirm-delete">ใช่...ฉันต้องการลบ</button>
                            <button id="user-posts-cancel-delete" class="btn-cancel-delete">ไม่...ฉันยังไม่ต้องการลบ</button>
                        </div>
                    </div>
                </div>
            `);
            modalContainer = $('#user-posts-modal');

            // Bind events to Modal elements
            // (ผูกเหตุการณ์กับ Modal)
            modalContainer.find('.user-posts-modal-close, #user-posts-cancel-delete').on('click', function() {
                closeModal();
            });

            // Close Modal on background click
            // (ปิด Modal เมื่อคลิกพื้นหลัง)
            modalContainer.on('click', function(e) {
                if (e.target === this) {
                    closeModal();
                }
            });

            // Confirm delete button
            // (ปุ่มยืนยันการลบ)
            modalContainer.find('#user-posts-confirm-delete').on('click', function() {
                const postId = modalContainer.data('post-id');
                if (postId) {
                    deletePost(postId);
                }
            });
        } else {
            modalContainer = $('#user-posts-modal');
        }

        const elements = cacheElements();
        // Check if elements were cached successfully
        if (Object.keys(elements).length === 0) {
             console.error('Failed to cache elements. Aborting initialization.');
             return;
        }

        // Bind events (ผูกเหตุการณ์)
        bindEvents(elements);

        // Load initial posts (โหลดโพสครั้งแรก)
        loadPosts(1, elements);
    };

    // Bind events to DOM (ผูกเหตุการณ์กับ DOM)
    const bindEvents = function(elements) {
        // Ensure elements exist before binding
        if (!elements || !elements.searchInput) {
             console.error("Required elements not found for binding events.");
             return;
        }

        // Filter changes (การเปลี่ยนแปลงของฟิลเตอร์)
        elements.searchInput.on('input', debounce(function() {
            loadPosts(1, elements);
        }, 500));

        elements.postTypeFilter?.on('change', function() { // Optional chaining for safety
            loadPosts(1, elements);
        });

        elements.statusFilter?.on('change', function() {
            loadPosts(1, elements);
        });

        elements.perPageSelect?.on('change', function() {
            loadPosts(1, elements);
        });

        // Pagination click (คลิกที่ pagination)
        // Use delegated event binding on the container
        container.off('click.pagination').on('click.pagination', '.pagination-link', function(e) {
            e.preventDefault();
            const $this = $(this);
            if ($this.hasClass('disabled') || $this.hasClass('current')) {
                return;
            }
            const page = $this.data('page');
            if (page) { // Ensure page number exists
                 loadPosts(page, elements);
            }
        });

        // Status toggle button click (คลิกที่ปุ่มเปลี่ยนสถานะ)
        container.off('click.statusToggle').on('click.statusToggle', '.status-toggle-btn', function(e) {
            e.preventDefault();
            const $this = $(this);
            const postId = $this.data('post-id');
            const currentStatus = $this.data('current-status');
            const newStatus = currentStatus === 'publish' ? 'pending' : 'publish';

            // Use localized string if available, otherwise default confirm
            const confirmMessage = userPostsData?.strings?.confirm_status_change || 'Are you sure you want to change the status?';
            if (confirm(confirmMessage)) {
                updatePostStatus(postId, newStatus, $this);
            }
        });

        // Delete post button click (คลิกที่ปุ่มลบโพส)
        container.off('click.deletePost').on('click.deletePost', '.delete-post-btn', function(e) {
            e.preventDefault();
            const $this = $(this);
            const postId = $this.data('post-id');
            const postTitle = $this.data('post-title') || 'this post'; // Fallback title

            // Show Modal and store post ID
            modalContainer.data('post-id', postId);

            // Update Modal body text (use localized string if possible)
            const confirmDeleteMsg = userPostsData?.strings?.confirm_delete_message || 'You cannot recover <strong>"{title}"</strong>. Do you want to delete it?';
            $('.user-posts-modal-body p').html(
                 confirmDeleteMsg.replace('{title}', escapeHTML(postTitle))
            );

            // Show Modal
            openModal();
        });
    };

    // Open Modal (เปิด Modal)
    const openModal = function() {
        if (modalContainer) {
             modalContainer.addClass('show');
             $('body').addClass('user-posts-modal-open');
        }
    };

    // Close Modal (ปิด Modal)
    const closeModal = function() {
         if (modalContainer) {
            modalContainer.removeClass('show');
            $('body').removeClass('user-posts-modal-open');
            // Reset modal state after closing animation (optional)
            setTimeout(() => {
                modalContainer.data('post-id', null); // Clear stored post ID
                const defaultMsg = userPostsData?.strings?.default_delete_prompt || 'You cannot recover this post. Do you want to delete it?';
                $('.user-posts-modal-body p').html(defaultMsg);
                $('.user-posts-modal-footer').show();
            }, 300); // Match CSS transition duration if any
         }
    };

    // Delete post via AJAX (ลบโพสผ่าน AJAX)
    const deletePost = function(postId) {
        // Ensure nonce and ajaxurl are available
        if (!userPostsData?.nonce || !userPostsData?.ajaxurl) {
            console.error('Missing nonce or ajaxurl for deletePost.');
            showNotification(userPostsData?.strings?.error || 'An error occurred.', 'error');
            closeModal(); // Close modal even on configuration error
            return;
        }

        const data = {
            action: 'user_posts_delete',
            nonce: userPostsData.nonce,
            post_id: postId
        };

        $.ajax({
            url: userPostsData.ajaxurl,
            type: 'POST',
            data: data,
            beforeSend: function() {
                // Show Loading message in Modal
                // (แสดงข้อความ Loading ใน Modal)
                $('.user-posts-modal-body').html('<p class="text-center"><span class="loading-spinner"></span><br>กำลังลบโพส...</p>');
                $('.user-posts-modal-footer').hide();
            },
            success: function(response) {
                closeModal(); // Close modal first

                if (response && response.success) {
                    showNotification(response.data?.message || 'Post deleted successfully.', 'success');
                    // Reload current page posts
                    const elements = cacheElements();
                    const currentPage = parseInt($('.pagination-link.current').data('page')) || 1;
                    loadPosts(currentPage, elements);
                } else {
                    showNotification(response?.data?.message || userPostsData?.strings?.error || 'Failed to delete post.', 'error');
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error("AJAX Error deleting post:", textStatus, errorThrown);
                closeModal();
                showNotification(userPostsData?.strings?.error || 'An error occurred while deleting.', 'error');
            },
            // complete: function() {
            //     // Resetting modal is now handled in closeModal
            // }
        });
    };

    // Load posts via AJAX (โหลดโพสผ่าน AJAX)
    const loadPosts = function(page, elements) {
        if (isLoading) return;
        if (!elements || !elements.postsList) {
             console.error("Posts list element not found for loading posts.");
             return; // Don't proceed if essential elements are missing
        }
         // Ensure nonce and ajaxurl are available
        if (!userPostsData?.nonce || !userPostsData?.ajaxurl) {
            console.error('Missing nonce or ajaxurl for loadPosts.');
            showError(elements.postsList, userPostsData?.strings?.error || 'Configuration error.');
            return;
        }


        isLoading = true;
        showLoadingIndicator(elements.postsList);

        const data = {
            action: 'user_posts_load',
            nonce: userPostsData.nonce,
            page: page,
            per_page: elements.perPageSelect?.val() || 10, // Default per page
            search: elements.searchInput?.val() || '',
            post_type: elements.postTypeFilter?.val() || '',
            post_status: elements.statusFilter?.val() || ''
        };

        $.ajax({
            url: userPostsData.ajaxurl,
            type: 'POST', // Changed to POST as per original code, ensure backend expects POST
            data: data,
            dataType: 'json', // Expect JSON response
            success: function(response) {
                if (response && response.success && response.data) {
                    renderPosts(response.data.posts || [], elements.postsList); // Handle case where posts might be missing
                    renderPagination(response.data, elements.paginationContainer);

                    // Scroll to top on page change (เลื่อนขึ้นด้านบนเมื่อเปลี่ยนหน้า)
                    if (page > 1) {
                        scrollToTop();
                    }
                } else {
                    // Handle error response from server
                    showError(elements.postsList, response?.data?.message || userPostsData?.strings?.error || 'Failed to load posts.');
                    elements.paginationContainer?.empty(); // Clear pagination on error
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error("AJAX Error loading posts:", textStatus, errorThrown);
                showError(elements.postsList, userPostsData?.strings?.error || 'An error occurred while loading posts.');
                 elements.paginationContainer?.empty(); // Clear pagination on error
            },
            complete: function() {
                isLoading = false;
                hideLoadingIndicator(elements.postsList); // Pass container to hide indicator within
            }
        });
    };

    // Scroll to top (เลื่อนขึ้นด้านบน)
    const scrollToTop = function() {
        if (!container || container.length === 0) return; // Ensure container exists

        const offsetTop = container.offset().top;
        // Adjust scroll position slightly above the container
        const scrollPosition = Math.max(0, offsetTop - 60); // Ensure not negative

        $('html, body').animate({
            scrollTop: scrollPosition
        }, 500); // Animation duration
    };

    // Update post status via AJAX (อัพเดทสถานะโพสผ่าน AJAX)
    const updatePostStatus = function(postId, newStatus, buttonElement) {
        const row = buttonElement.closest('tr');
        if (!row.length) return; // Exit if row not found

        row.addClass('updating'); // Visual feedback

         // Ensure nonce and ajaxurl are available
        if (!userPostsData?.nonce || !userPostsData?.ajaxurl) {
            console.error('Missing nonce or ajaxurl for updatePostStatus.');
            showNotification(userPostsData?.strings?.error || 'Configuration error.', 'error');
            row.removeClass('updating');
            return;
        }

        const data = {
            action: 'user_posts_update_status',
            nonce: userPostsData.nonce,
            post_id: postId,
            status: newStatus
        };

        $.ajax({
            url: userPostsData.ajaxurl,
            type: 'POST',
            data: data,
            dataType: 'json', // Expect JSON
            success: function(response) {
                if (response && response.success) {
                    // Update button state and text
                    buttonElement.data('current-status', newStatus);
                    const buttonText = newStatus === 'publish' ? (userPostsData?.strings?.set_pending || 'Set Pending') : (userPostsData?.strings?.set_publish || 'Set Publish');
                    buttonElement.text(buttonText);
                    buttonElement.removeClass('status-publish status-pending').addClass('status-' + newStatus);

                    // Update status cell text and data attribute
                    const statusCell = row.find('td.post-status');
                    const statusText = getStatusText(newStatus); // Use helper for status text
                    statusCell.text(statusText);
                    statusCell.attr('data-status', newStatus); // Keep data attribute consistent

                    showNotification(response.data?.message || 'Status updated.', 'success');
                } else {
                    showNotification(response?.data?.message || userPostsData?.strings?.error || 'Failed to update status.', 'error');
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                 console.error("AJAX Error updating status:", textStatus, errorThrown);
                showNotification(userPostsData?.strings?.error || 'An error occurred.', 'error');
            },
            complete: function() {
                row.removeClass('updating');
            }
        });
    };

    // Get localized status text (Helper function)
    // (ฟังก์ชันช่วยแปลข้อความสถานะ)
    const getStatusText = function(status) {
         // Use localized strings if available, otherwise defaults
         switch(status) {
             case 'publish': return userPostsData?.strings?.status_publish || 'Published';
             case 'pending': return userPostsData?.strings?.status_pending || 'Pending';
             case 'draft':   return userPostsData?.strings?.status_draft || 'Draft';
             default:        return capitalizeFirstLetter(status); // Fallback
         }
    };

    // Render posts in table (แสดงโพสในตาราง)
    const renderPosts = function(posts, listContainer) {
         if (!listContainer || listContainer.length === 0) return; // Ensure container exists

        listContainer.empty(); // Clear previous posts

        if (!posts || posts.length === 0) {
            const colspan = container.find('thead th').length || 5; // Get number of columns dynamically
            listContainer.html(`<tr><td colspan="${colspan}" class="no-posts">${userPostsData?.strings?.no_posts_found || 'No posts found.'}</td></tr>`);
            return;
        }

        posts.forEach(function(post) {
            const row = $('<tr></tr>').attr('data-post-id', post.id); // Add post ID to row

            row.append(`<td class="post-type">${escapeHTML(post.type || 'N/A')}</td>`);
            row.append(`<td class="post-title">${escapeHTML(post.title || 'No Title')}</td>`);
            row.append(`<td class="post-date">${escapeHTML(post.date || 'N/A')}</td>`);

            const statusText = getStatusText(post.status); // Use helper
            row.append(`<td class="post-status" data-status="${post.status}">${statusText}</td>`);

            // Action Buttons Cell (เซลล์ปุ่มจัดการ)
            const actionsCell = $('<td class="post-actions"></td>');

            // View Button (ปุ่มดู) - Check if link exists
            if (post.view_link) {
                 actionsCell.append(`<a href="${post.view_link}" class="action-btn view-btn" target="_blank" title="${userPostsData?.strings?.view_post || 'View Post'}">ดูข้อมูล</a>`);
            }

            // Delete Button (ปุ่มลบโพส)
            actionsCell.append(`<a href="#" class="action-btn delete-post-btn" data-post-id="${post.id}" data-post-title="${escapeHTML(post.title || '')}" title="${userPostsData?.strings?.delete_post || 'Delete Post'}">ลบโพส</a>`);

            // Status Toggle Button (ปุ่มเปลี่ยนสถานะ)
            if (post.status === 'publish' || post.status === 'pending') {
                const toggleText = post.status === 'publish' ? (userPostsData?.strings?.set_pending || 'Set Pending') : (userPostsData?.strings?.set_publish || 'Set Publish');
                const toggleClass = `status-${post.status}`;
                const toggleTitle = post.status === 'publish' ? (userPostsData?.strings?.title_set_pending || 'Set status to Pending') : (userPostsData?.strings?.title_set_publish || 'Set status to Publish');
                actionsCell.append(`<a href="#" class="action-btn status-toggle-btn ${toggleClass}" data-post-id="${post.id}" data-current-status="${post.status}" title="${toggleTitle}">${toggleText}</a>`);
            }

            row.append(actionsCell);
            listContainer.append(row);
        });
    };


    // --- Refactored Pagination Rendering ---

    /**
     * Generates HTML for a single pagination button (First, Prev, Next, Last).
     * @param {object} options - Button options.
     * @param {string} options.type - 'first', 'prev', 'next', 'last'.
     * @param {number} options.currentPage - The current active page.
     * @param {number} options.totalPages - Total number of pages.
     * @param {string} options.text - Button display text.
     * @param {string} options.title - Button title attribute.
     * @param {string} options.symbol - Button symbol (e.g., '&laquo;').
     * @returns {string} HTML string for the button.
     */
    const generatePaginationNavButton = function(options) {
        const { type, currentPage, totalPages, text, title, symbol } = options;
        let isDisabled = false;
        let targetPage = 1;

        switch (type) {
            case 'first':
                isDisabled = currentPage <= 1;
                targetPage = 1;
                break;
            case 'prev':
                isDisabled = currentPage <= 1;
                targetPage = currentPage - 1;
                break;
            case 'next':
                isDisabled = currentPage >= totalPages;
                targetPage = currentPage + 1;
                break;
            case 'last':
                isDisabled = currentPage >= totalPages;
                targetPage = totalPages;
                break;
        }

        const content = symbol || text; // Use symbol if provided, otherwise text
        const titleAttr = title ? `title="${escapeHTML(title)}"` : '';

        if (isDisabled) {
            return `<span class="pagination-link disabled ${type}" ${titleAttr}>${content}</span>`;
        } else {
            return `<a href="#" class="pagination-link ${type}" data-page="${targetPage}" ${titleAttr}>${content}</a>`;
        }
    };

    /**
     * Calculates the start and end page numbers for the visible page links.
     * @param {number} currentPage - The current active page.
     * @param {number} totalPages - Total number of pages.
     * @param {number} maxVisiblePages - Maximum number of page links to show.
     * @returns {object} Object containing { startPage, endPage }.
     */
    const calculatePageRange = function(currentPage, totalPages, maxVisiblePages) {
        let startPage, endPage;
        const halfVisible = Math.floor(maxVisiblePages / 2);

        if (totalPages <= maxVisiblePages) {
            startPage = 1;
            endPage = totalPages;
        } else if (currentPage <= halfVisible + 1) {
            startPage = 1;
            endPage = maxVisiblePages;
        } else if (currentPage >= totalPages - halfVisible) {
            startPage = totalPages - maxVisiblePages + 1;
            endPage = totalPages;
        } else {
            startPage = currentPage - halfVisible;
            endPage = currentPage + halfVisible;
        }
        return { startPage, endPage };
    };

    /**
     * Generates HTML for a numeric page link or the current page indicator.
     * @param {number} pageNum - The page number to generate the link for.
     * @param {number} currentPage - The current active page.
     * @returns {string} HTML string for the page link/indicator.
     */
    const generatePageLink = function(pageNum, currentPage) {
        if (pageNum === currentPage) {
            return `<span class="pagination-link current">${pageNum}</span>`;
        } else {
            return `<a href="#" class="pagination-link" data-page="${pageNum}">${pageNum}</a>`;
        }
    };

    /**
     * Generates HTML for the pagination ellipsis.
     * @returns {string} HTML string for the ellipsis.
     */
    const generateEllipsis = function() {
        return '<span class="pagination-ellipsis">&hellip;</span>';
    };

    /**
     * Renders the pagination controls.
     * @param {object} data - Pagination data from the server.
     * @param {jQuery} paginationContainer - The jQuery element to render into.
     */
    const renderPagination = function(data, paginationContainer) {
        if (!paginationContainer || paginationContainer.length === 0) return; // Ensure container exists

        const { total_pages, current_page, total_posts, per_page } = data;
        const currentPage = parseInt(current_page) || 1; // Ensure current_page is a number
        const totalPages = parseInt(total_pages) || 0; // Ensure total_pages is a number

        // Hide pagination if only one page or no pages
        if (totalPages <= 1) {
            paginationContainer.empty();
            return;
        }

        const htmlParts = ['<div class="user-posts-pagination-links">'];
        const maxVisiblePages = 5; // Configurable: max number links shown

        // --- Navigation Buttons ---
        htmlParts.push(generatePaginationNavButton({ type: 'first', currentPage, totalPages, symbol: '&laquo;', title: userPostsData?.strings?.first_page || 'First Page' }));
        htmlParts.push(generatePaginationNavButton({ type: 'prev', currentPage, totalPages, text: userPostsData?.strings?.previous_page || 'Previous', title: userPostsData?.strings?.previous_page || 'Previous Page' }));

        // --- Page Number Links ---
        const { startPage, endPage } = calculatePageRange(currentPage, totalPages, maxVisiblePages);

        // Add page 1 and ellipsis if needed
        if (startPage > 1) {
            htmlParts.push(generatePageLink(1, currentPage));
            if (startPage > 2) {
                htmlParts.push(generateEllipsis());
            }
        }

        // Add links for the calculated range
        for (let i = startPage; i <= endPage; i++) {
            htmlParts.push(generatePageLink(i, currentPage));
        }

        // Add ellipsis and last page if needed
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                htmlParts.push(generateEllipsis());
            }
            htmlParts.push(generatePageLink(totalPages, currentPage));
        }

        // --- Navigation Buttons ---
        htmlParts.push(generatePaginationNavButton({ type: 'next', currentPage, totalPages, text: userPostsData?.strings?.next_page || 'Next', title: userPostsData?.strings?.next_page || 'Next Page' }));
        htmlParts.push(generatePaginationNavButton({ type: 'last', currentPage, totalPages, symbol: '&raquo;', title: userPostsData?.strings?.last_page || 'Last Page' }));

        htmlParts.push('</div>'); // Close user-posts-pagination-links

        // --- Pagination Info Text ---
        const perPageNum = parseInt(per_page) || 10;
        const totalPostsNum = parseInt(total_posts) || 0;
        const startItem = totalPostsNum === 0 ? 0 : (currentPage - 1) * perPageNum + 1;
        const endItem = Math.min(currentPage * perPageNum, totalPostsNum);

        // Use localized string format if available
        const infoFormat = userPostsData?.strings?.pagination_info || 'Showing {start}-{end} of {total} items (Page {current} of {pages})';
        const infoText = infoFormat
            .replace('{start}', startItem)
            .replace('{end}', endItem)
            .replace('{total}', totalPostsNum)
            .replace('{current}', currentPage)
            .replace('{pages}', totalPages);

        htmlParts.push(`<div class="pagination-info">${infoText}</div>`);

        // Update the container HTML
        paginationContainer.html(htmlParts.join(''));
    };

    // --- End Refactored Pagination ---


    // Show Loading Indicator (แสดง Loading Indicator)
    const showLoadingIndicator = function(listContainer) {
         if (!listContainer || listContainer.length === 0) return;
         const colspan = container.find('thead th').length || 5; // Dynamic colspan
        // Show loading indicator within the table body
        listContainer.html(`<tr><td colspan="${colspan}" class="loading-row"><div class="loading-spinner"></div> Loading...</td></tr>`);
    };

    // Hide Loading Indicator (ซ่อน Loading Indicator)
    const hideLoadingIndicator = function(listContainer) {
         if (!listContainer || listContainer.length === 0) return;
        // Remove the specific loading row
        listContainer.find('.loading-row').remove();
    };

    // Show error message (แสดงข้อความผิดพลาด)
    const showError = function(listContainer, message) {
         if (!listContainer || listContainer.length === 0) return;
         const colspan = container.find('thead th').length || 5; // Dynamic colspan
        listContainer.html(`<tr><td colspan="${colspan}" class="error-row">${escapeHTML(message)}</td></tr>`);
    };

    // Show notification message (แสดงการแจ้งเตือน)
    const showNotification = function(message, type = 'info') { // Default type to 'info'
        // Ensure container exists to append notification
        if (!container || container.length === 0) {
             alert(`${type}: ${message}`); // Fallback to alert if container not found
             return;
        }
        // Remove existing notifications of the same type quickly to avoid stacking
        container.find(`.user-posts-notification.${type}`).remove();

        const notification = $(`<div class="user-posts-notification ${type}">${escapeHTML(message)}</div>`);
        // Prepend notification inside the main container for better visibility
        container.prepend(notification);

        // Animate the notification
        // Use requestAnimationFrame for smoother browser rendering
        requestAnimationFrame(() => {
            notification.addClass('show');
        });

        // Auto-remove after a delay
        setTimeout(() => {
            notification.removeClass('show');
            // Remove from DOM after fade out transition
            setTimeout(() => {
                notification.remove();
            }, 500); // Should match CSS transition duration
        }, 4000); // Notification visible duration
    };

    // Helper: Debounce function (ฟังก์ชั่น Debounce)
    const debounce = function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const context = this;
            const later = function() {
                timeout = null;
                func.apply(context, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // Helper: Capitalize first letter (ทำตัวอักษรแรกเป็นตัวพิมพ์ใหญ่)
    const capitalizeFirstLetter = function(string) {
        if (typeof string !== 'string' || string.length === 0) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    // Helper: Escape HTML characters (Escape HTML)
    const escapeHTML = function(str) {
        if (typeof str !== 'string') return ''; // Return empty string if not a string
        // Use a temporary element to leverage browser's escaping
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
        /* // Manual replacement (alternative)
        return str
             .replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;')
             .replace(/"/g, '&quot;')
             .replace(/'/g, '&#039;');
        */
    };

    // Public API (API สาธารณะ)
    return {
        init: init
        // Expose other methods if needed for external use
        // reload: () => loadPosts(1, cacheElements())
    };
})(jQuery);
