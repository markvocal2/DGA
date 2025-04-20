jQuery(document).ready(($) => {
    // Global variables
    let currentPage = 1;
    let currentPostType = '';
    let currentSearchTerm = '';
    let searchTimeout = null;

    // ============= Utility Functions =============

    /**
     * แปลงประเภทโพสต์เป็นภาษาไทย
     */
    function getPostTypeThai(type) {
        const types = {
            'egp': 'ข้อมูลจัดซื้อจัดจ้าง',
            'news': 'ข้อมูลทั่วไป',
            'mpeople': 'คู่มือประชาชน',
            'article': 'บทความ',
            'pha': 'ประชาพิจารณ์และกิจกรรม',
            'dgallery': 'ประมวลภาพกิจกรรม',
            'department': 'หน่วยงาน',
            'complaint': 'เรื่องร้องเรียน'
        };
        return types[type] || type;
    }

    /**
     * แสดงข้อความผิดพลาด
     */
    function showError(message) {
        $('.skeleton-loader').hide();
        $('#pending-posts-cards').html(`
            <div class="error-message">
                <p>${message}</p>
                <button class="retry-button">ลองใหม่อีกครั้ง</button>
            </div>
        `).show();
    }

    /**
     * รีเซ็ตตัวกรอง
     */
    function resetFilters() {
        currentPostType = '';
        currentSearchTerm = '';
        $('#post-type-filter').val('');
        $('#title-search').val('');
        currentPage = 1;
        loadPendingPosts(1);
    }

    /**
     * ตรวจสอบกริดว่างเปล่า
     */
    function checkEmptyGrid() {
        if ($('#pending-posts-cards .post-card').length === 0) {
            if (currentPage > 1) {
                currentPage--;
                loadPendingPosts(currentPage);
            } else {
                $('#pending-posts-cards').html('<div class="no-posts-message">ไม่พบรายการที่รอตรวจสอบ</div>');
            }
        }
    }

    // ============= AJAX Handlers =============

    /**
     * โหลดข้อมูลโพสต์
     */
    function loadPendingPosts(page = 1) {
        $('.skeleton-loader').show();
        $('#pending-posts-cards').hide();
        $('.pagination').hide();

        $.ajax({
            url: pendingPostsAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'get_pending_posts',
                nonce: pendingPostsAjax.nonce,
                page: page,
                post_type: currentPostType,
                search: currentSearchTerm
            },
            success: handleLoadPostsSuccess,
            error: handleLoadPostsError
        });
    }

    /**
     * จัดการการตอบกลับสำเร็จของการโหลดโพสต์
     */
    function handleLoadPostsSuccess(response) {
        if (response.success) {
            displayPosts(response.data.posts);
            displayPagination(response.data.pagination);
            $('.skeleton-loader').hide();
            $('#pending-posts-cards').show();
            $('.pagination').show();
        } else {
            showError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        }
    }

    /**
     * จัดการข้อผิดพลาดของการโหลดโพสต์
     */
    function handleLoadPostsError() {
        showError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }

    /**
     * อนุมัติโพสต์
     */
    function approvePost(postId, button) {
        button.prop('disabled', true)
              .text('กำลังดำเนินการ...')
              .addClass('processing');

        $.ajax({
            url: pendingPostsAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'approve_pending_post',
                post_id: postId,
                nonce: pendingPostsAjax.nonce
            },
            success: (response) => handleApproveSuccess(response, button),
            error: () => handleApproveError(button)
        });
    }

    /**
     * จัดการการตอบกลับสำเร็จของการอนุมัติโพสต์
     */
    function handleApproveSuccess(response, button) {
        if (response.success) {
            const postCard = button.closest('.post-card');
            postCard.fadeOut(300, handlePostRemoval);
        } else {
            resetApproveButton(button);
            alert('เกิดข้อผิดพลาด: ' + (response.data || 'ไม่สามารถอนุมัติโพสต์ได้'));
        }
    }

    /**
     * จัดการเมื่อลบโพสต์การ์ดออกจากหน้า
     */
    function handlePostRemoval() {
        $(this).remove();
        checkEmptyGrid();
    }

    /**
     * จัดการข้อผิดพลาดของการอนุมัติโพสต์
     */
    function handleApproveError(button) {
        resetApproveButton(button);
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }

    /**
     * รีเซ็ตปุ่มอนุมัติกลับสู่สถานะปกติ
     */
    function resetApproveButton(button) {
        button.prop('disabled', false)
              .text('ยืนยันตรวจสอบ')
              .removeClass('processing');
    }

    // ============= UI Rendering =============

    /**
     * แสดงข้อมูลโพสต์
     */
    function displayPosts(posts) {
        const container = $('#pending-posts-cards');
        container.empty();

        if (posts && posts.length > 0) {
            posts.forEach((post) => {
                const card = createPostCard(post);
                container.append(card);
            });
        } else {
            container.html('<div class="no-posts-message">ไม่พบรายการที่รอตรวจสอบ</div>');
        }
    }

    /**
     * สร้าง HTML สำหรับการ์ดโพสต์
     */
    function createPostCard(post) {
        return $(`
            <div class="post-card ${post.type}-card">
                <div class="post-card-content">
                    <h3 class="post-title">
                        <a href="${post.link}" target="_blank">${post.title}</a>
                    </h3>
                    <div class="post-meta">
                        <span class="post-type">${getPostTypeThai(post.type)}</span>
                        <span class="post-date">${post.date}</span>
                    </div>
                    <div class="post-author">
                        <span>ผู้เขียน: ${post.author}</span>
                        <span>แก้ไขล่าสุด: ${post.modified_date}</span>
                    </div>
                    <button class="approve-button" data-post-id="${post.ID}">
                        ยืนยันตรวจสอบ
                    </button>
                </div>
            </div>
        `);
    }

    /**
     * แสดง Pagination
     */
    function displayPagination(pagination) {
        const container = $('.pagination');
        container.empty();

        if (pagination.total_pages > 1) {
            const maxVisiblePages = 5;
            let startPage = Math.max(1, pagination.current_page - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(pagination.total_pages, startPage + maxVisiblePages - 1);

            if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }

            const paginationHtml = createPaginationHtml(pagination, startPage, endPage);
            container.append(paginationHtml);
        }
    }

    /**
     * สร้าง HTML สำหรับ pagination
     */
    function createPaginationHtml(pagination, startPage, endPage) {
        const paginationContainer = $('<div class="pagination-container"></div>');
        
        // เพิ่มปุ่มย้อนกลับ
        if (pagination.current_page > 1) {
            appendPrevButton(paginationContainer, pagination.current_page);
        }

        // เพิ่มปุ่มหน้าแรก
        if (startPage > 1) {
            appendFirstPageButton(paginationContainer, startPage);
        }

        // เพิ่มปุ่มหมายเลขหน้า
        appendPageNumberButtons(paginationContainer, startPage, endPage, pagination.current_page);

        // เพิ่มปุ่มหน้าสุดท้าย
        if (endPage < pagination.total_pages) {
            appendLastPageButton(paginationContainer, endPage, pagination.total_pages);
        }

        // เพิ่มปุ่มถัดไป
        if (pagination.current_page < pagination.total_pages) {
            appendNextButton(paginationContainer, pagination.current_page);
        }

        return paginationContainer;
    }

    /**
     * เพิ่มปุ่มย้อนกลับใน pagination
     */
    function appendPrevButton(container, currentPage) {
        container.append(`
            <button class="pagination-button" data-page="${currentPage - 1}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 18l-6-6 6-6"/>
                </svg>
            </button>
        `);
    }

    /**
     * เพิ่มปุ่มหน้าแรกใน pagination
     */
    function appendFirstPageButton(container, startPage) {
        container.append(`
            <button class="pagination-button" data-page="1">1</button>
            ${startPage > 2 ? '<span class="pagination-ellipsis">...</span>' : ''}
        `);
    }

    /**
     * เพิ่มปุ่มหมายเลขหน้าใน pagination
     */
    function appendPageNumberButtons(container, startPage, endPage, currentPage) {
        for (let i = startPage; i <= endPage; i++) {
            container.append(`
                <button class="pagination-button ${i === currentPage ? 'active' : ''}" 
                        data-page="${i}">${i}</button>
            `);
        }
    }

    /**
     * เพิ่มปุ่มหน้าสุดท้ายใน pagination
     */
    function appendLastPageButton(container, endPage, totalPages) {
        container.append(`
            ${endPage < totalPages - 1 ? '<span class="pagination-ellipsis">...</span>' : ''}
            <button class="pagination-button" data-page="${totalPages}">
                ${totalPages}
            </button>
        `);
    }

    /**
     * เพิ่มปุ่มถัดไปใน pagination
     */
    function appendNextButton(container, currentPage) {
        container.append(`
            <button class="pagination-button" data-page="${currentPage + 1}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6"/>
                </svg>
            </button>
        `);
    }

    // ============= Event Handlers =============

    /**
     * จัดการการคลิกที่ปุ่ม pagination
     */
    function handlePaginationClick() {
        const page = $(this).data('page');
        if (page !== currentPage) {
            currentPage = page;
            loadPendingPosts(page);
            $('html, body').animate({
                scrollTop: $('#pending-posts-container').offset().top - 50
            }, 300);
        }
    }

    /**
     * จัดการการคลิกที่ปุ่มอนุมัติ
     */
    function handleApproveClick() {
        const button = $(this);
        const postId = button.data('post-id');
        approvePost(postId, button);
    }

    /**
     * จัดการการคลิกที่ปุ่มลองใหม่
     */
    function handleRetryClick() {
        loadPendingPosts(currentPage);
    }

    /**
     * จัดการการเปลี่ยนแปลงตัวกรองประเภทโพสต์
     */
    function handlePostTypeChange() {
        currentPostType = $(this).val();
        currentPage = 1;
        loadPendingPosts(1);
    }

    /**
     * จัดการการค้นหา
     */
    function handleSearch() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentSearchTerm = $(this).val();
            currentPage = 1;
            loadPendingPosts(1);
        }, 500); // Debounce search
    }

    // ============= Set Up Event Listeners =============

    // กรองตามประเภทโพสต์
    $('#post-type-filter').on('change', handlePostTypeChange);

    // ค้นหาตามชื่อเรื่อง
    $('#title-search').on('input', handleSearch);

    // รีเซ็ตตัวกรอง
    $('.reset-filters').on('click', resetFilters);

    // Event delegation สำหรับปุ่มใน pagination
    $(document).on('click', '.pagination-button', handlePaginationClick);

    // Event delegation สำหรับปุ่มอนุมัติ
    $(document).on('click', '.approve-button', handleApproveClick);

    // Event delegation สำหรับปุ่มลองใหม่
    $(document).on('click', '.retry-button', handleRetryClick);

    // โหลดข้อมูลครั้งแรก
    loadPendingPosts();
});
