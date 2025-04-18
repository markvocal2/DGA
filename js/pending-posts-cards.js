jQuery(document).ready(function($) {
    let currentPage = 1;
    let currentPostType = '';
    let currentSearchTerm = '';
    let searchTimeout = null;

    // ฟังก์ชันแปลงประเภทโพสต์เป็นภาษาไทย
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

    // โหลดข้อมูลโพสต์
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
            success: function(response) {
                if (response.success) {
                    displayPosts(response.data.posts);
                    displayPagination(response.data.pagination);
                    $('.skeleton-loader').hide();
                    $('#pending-posts-cards').show();
                    $('.pagination').show();
                } else {
                    showError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
                }
            },
            error: function() {
                showError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
            }
        });
    }

    // Filter handlers
    $('#post-type-filter').on('change', function() {
        currentPostType = $(this).val();
        currentPage = 1;
        loadPendingPosts(1);
    });

    $('#title-search').on('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentSearchTerm = $(this).val();
            currentPage = 1;
            loadPendingPosts(1);
        }, 500); // Debounce search
    });

    // แสดงข้อมูลโพสต์
    function displayPosts(posts) {
        const container = $('#pending-posts-cards');
        container.empty();

        if (posts && posts.length > 0) {
            posts.forEach(function(post) {
                const card = $(`
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
                container.append(card);
            });
        } else {
            container.html('<div class="no-posts-message">ไม่พบรายการที่รอตรวจสอบ</div>');
        }
    }

    // ฟังก์ชัน Reset Filters
    function resetFilters() {
        currentPostType = '';
        currentSearchTerm = '';
        $('#post-type-filter').val('');
        $('#title-search').val('');
        currentPage = 1;
        loadPendingPosts(1);
    }

    // Event handler สำหรับปุ่ม Reset
    $('.reset-filters').on('click', function() {
        resetFilters();
    });

    // แสดง Pagination
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

            const paginationHtml = $('<div class="pagination-container"></div>');

            // ปุ่มย้อนกลับ
            if (pagination.current_page > 1) {
                paginationHtml.append(`
                    <button class="pagination-button" data-page="${pagination.current_page - 1}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M15 18l-6-6 6-6"/>
                        </svg>
                    </button>
                `);
            }

            // หน้าแรก
            if (startPage > 1) {
                paginationHtml.append(`
                    <button class="pagination-button" data-page="1">1</button>
                    ${startPage > 2 ? '<span class="pagination-ellipsis">...</span>' : ''}
                `);
            }

            // หมายเลขหน้า
            for (let i = startPage; i <= endPage; i++) {
                paginationHtml.append(`
                    <button class="pagination-button ${i === pagination.current_page ? 'active' : ''}" 
                            data-page="${i}">${i}</button>
                `);
            }

            // หน้าสุดท้าย
            if (endPage < pagination.total_pages) {
                paginationHtml.append(`
                    ${endPage < pagination.total_pages - 1 ? '<span class="pagination-ellipsis">...</span>' : ''}
                    <button class="pagination-button" data-page="${pagination.total_pages}">
                        ${pagination.total_pages}
                    </button>
                `);
            }

            // ปุ่มถัดไป
            if (pagination.current_page < pagination.total_pages) {
                paginationHtml.append(`
                    <button class="pagination-button" data-page="${pagination.current_page + 1}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 18l6-6-6-6"/>
                        </svg>
                    </button>
                `);
            }

            container.append(paginationHtml);
        }
    }

    // แสดงข้อความผิดพลาด
    function showError(message) {
        $('.skeleton-loader').hide();
        $('#pending-posts-cards').html(`
            <div class="error-message">
                <p>${message}</p>
                <button class="retry-button">ลองใหม่อีกครั้ง</button>
            </div>
        `).show();
    }

    // อนุมัติโพสต์
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
            success: function(response) {
                if (response.success) {
                    button.closest('.post-card').fadeOut(300, function() {
                        $(this).remove();
                        checkEmptyGrid();
                    });
                } else {
                    button.prop('disabled', false)
                          .text('ยืนยันตรวจสอบ')
                          .removeClass('processing');
                    alert('เกิดข้อผิดพลาด: ' + (response.data || 'ไม่สามารถอนุมัติโพสต์ได้'));
                }
            },
            error: function() {
                button.prop('disabled', false)
                      .text('ยืนยันตรวจสอบ')
                      .removeClass('processing');
                alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
            }
        });
    }

    // ตรวจสอบกริดว่างเปล่า
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

    // Event Handlers
    $(document).on('click', '.pagination-button', function() {
        const page = $(this).data('page');
        if (page !== currentPage) {
            currentPage = page;
            loadPendingPosts(page);
            $('html, body').animate({
                scrollTop: $('#pending-posts-container').offset().top - 50
            }, 300);
        }
    });

    $(document).on('click', '.approve-button', function() {
        const button = $(this);
        const postId = button.data('post-id');
        approvePost(postId, button);
    });

    $(document).on('click', '.retry-button', function() {
        loadPendingPosts(currentPage);
    });

    // โหลดข้อมูลครั้งแรก
    loadPendingPosts();
});