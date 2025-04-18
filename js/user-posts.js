/**
 * User Posts Module
 * จัดการฟังก์ชัน AJAX และการโต้ตอบกับผู้ใช้สำหรับ shortcode แสดงโพสของผู้ใช้
 */
const UserPostsModule = (function($) {
    // ตัวแปรส่วนตัว
    let container;
    let containerSelector;
    let isLoading = false;
    let modalContainer;
    
    // เก็บค่า DOM elements
    const cacheElements = function() {
        return {
            searchInput: container.find('#user-posts-search'),
            postTypeFilter: container.find('#user-posts-type-filter'),
            statusFilter: container.find('#user-posts-status-filter'),
            perPageSelect: container.find('#user-posts-per-page'),
            postsList: container.find('#user-posts-list'),
            paginationContainer: container.find('.user-posts-pagination')
        };
    };
    
    // เริ่มต้น Module
    const init = function(containerId) {
        containerSelector = '#' + containerId;
        container = $(containerSelector);
        
        if (container.length === 0) {
            console.error('ไม่พบ container ของ User Posts');
            return;
        }
        
        // สร้าง Modal container
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
            
            // ผูกเหตุการณ์กับ Modal
            $('.user-posts-modal-close, #user-posts-cancel-delete').on('click', function() {
                closeModal();
            });
            
            // ปิด Modal เมื่อคลิกพื้นหลัง
            modalContainer.on('click', function(e) {
                if (e.target === this) {
                    closeModal();
                }
            });
            
            // ปุ่มยืนยันการลบ
            $('#user-posts-confirm-delete').on('click', function() {
                const postId = modalContainer.data('post-id');
                if (postId) {
                    deletePost(postId);
                }
            });
        } else {
            modalContainer = $('#user-posts-modal');
        }
        
        const elements = cacheElements();
        
        // ผูกเหตุการณ์
        bindEvents(elements);
        
        // โหลดโพสครั้งแรก
        loadPosts(1, elements);
    };
    
    // ผูกเหตุการณ์กับ DOM
    const bindEvents = function(elements) {
        // การเปลี่ยนแปลงของฟิลเตอร์
        elements.searchInput.on('input', debounce(function() {
            loadPosts(1, elements);
        }, 500));
        
        elements.postTypeFilter.on('change', function() {
            loadPosts(1, elements);
        });
        
        elements.statusFilter.on('change', function() {
            loadPosts(1, elements);
        });
        
        elements.perPageSelect.on('change', function() {
            loadPosts(1, elements);
        });
        
        // คลิกที่ pagination
        container.on('click', '.pagination-link', function(e) {
            e.preventDefault();
            if ($(this).hasClass('disabled') || $(this).hasClass('current')) {
                return;
            }
            
            const page = $(this).data('page');
            loadPosts(page, elements);
        });
        
        // คลิกที่ปุ่มเปลี่ยนสถานะ
        container.on('click', '.status-toggle-btn', function(e) {
            e.preventDefault();
            const postId = $(this).data('post-id');
            const currentStatus = $(this).data('current-status');
            const newStatus = currentStatus === 'publish' ? 'pending' : 'publish';
            
            if (confirm(userPostsData.strings.confirm_status_change)) {
                updatePostStatus(postId, newStatus, $(this));
            }
        });
        
        // คลิกที่ปุ่มลบโพส
        container.on('click', '.delete-post-btn', function(e) {
            e.preventDefault();
            const postId = $(this).data('post-id');
            const postTitle = $(this).data('post-title');
            
            // แสดง Modal และเก็บ post ID
            modalContainer.data('post-id', postId);
            
            // แสดงชื่อโพสใน Modal
            $('.user-posts-modal-body p').html('คุณจะไม่สามารถกู้คืนโพส <strong>"' + escapeHTML(postTitle) + '"</strong> นี้ได้อีก คุณต้องการลบหรือไม่?');
            
            // แสดง Modal
            openModal();
        });
    };
    
    // เปิด Modal
    const openModal = function() {
        modalContainer.addClass('show');
        $('body').addClass('user-posts-modal-open');
    };
    
    // ปิด Modal
    const closeModal = function() {
        modalContainer.removeClass('show');
        $('body').removeClass('user-posts-modal-open');
    };
    
    // ลบโพสผ่าน AJAX
    const deletePost = function(postId) {
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
                // แสดงข้อความ Loading ใน Modal
                $('.user-posts-modal-body').html('<p class="text-center"><div class="loading-spinner"></div><br>กำลังลบโพส...</p>');
                $('.user-posts-modal-footer').hide();
            },
            success: function(response) {
                closeModal();
                
                if (response.success) {
                    // แสดง Notification
                    showNotification(response.data.message, 'success');
                    
                    // รีโหลดหน้าปัจจุบัน
                    const elements = cacheElements();
                    const currentPage = $('.pagination-link.current').data('page') || 1;
                    loadPosts(currentPage, elements);
                } else {
                    showNotification(response.data.message, 'error');
                }
            },
            error: function() {
                closeModal();
                showNotification(userPostsData.strings.error, 'error');
            },
            complete: function() {
                // คืนค่า Modal กลับสู่สถานะปกติ
                setTimeout(function() {
                    $('.user-posts-modal-body').html('<p>คุณจะไม่สามารถกู้คืนโพสนี้ได้อีก คุณต้องการลบหรือไม่?</p>');
                    $('.user-posts-modal-footer').show();
                }, 300);
            }
        });
    };
    
    // โหลดโพสผ่าน AJAX
    const loadPosts = function(page, elements) {
        if (isLoading) return;
        
        isLoading = true;
        showLoadingIndicator(elements.postsList);
        
        const data = {
            action: 'user_posts_load',
            nonce: userPostsData.nonce,
            page: page,
            per_page: elements.perPageSelect.val(),
            search: elements.searchInput.val(),
            post_type: elements.postTypeFilter.val(),
            post_status: elements.statusFilter.val()
        };
        
        $.ajax({
            url: userPostsData.ajaxurl,
            type: 'POST',
            data: data,
            success: function(response) {
                if (response.success) {
                    renderPosts(response.data.posts, elements.postsList);
                    renderPagination(response.data, elements.paginationContainer);
                    
                    // เลื่อนขึ้นด้านบนเมื่อเปลี่ยนหน้า
                    if (page > 1) {
                        scrollToTop();
                    }
                } else {
                    showError(elements.postsList, response.data.message);
                }
            },
            error: function() {
                showError(elements.postsList, userPostsData.strings.error);
            },
            complete: function() {
                isLoading = false;
                hideLoadingIndicator();
            }
        });
    };
    
    // เลื่อนขึ้นด้านบน
    const scrollToTop = function() {
        // หาพิกัดของ container
        const offsetTop = container.offset().top;
        
        // ลดระยะจากด้านบนลงมาเล็กน้อยเพื่อความสวยงาม
        const scrollPosition = offsetTop - 50;
        
        // เลื่อนแบบมี animation
        $('html, body').animate({
            scrollTop: scrollPosition < 0 ? 0 : scrollPosition
        }, 500);
    };
    
    // อัพเดทสถานะโพสผ่าน AJAX
    const updatePostStatus = function(postId, newStatus, buttonElement) {
        const row = buttonElement.closest('tr');
        row.addClass('updating');
        
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
            success: function(response) {
                if (response.success) {
                    // อัพเดทปุ่มและเซลล์สถานะ
                    buttonElement.data('current-status', newStatus);
                    const buttonText = newStatus === 'publish' ? 'รออนุมัติ' : 'เผยแพร่';
                    buttonElement.text(buttonText);
                    buttonElement.toggleClass('status-publish status-pending');
                    
                    // อัพเดทเซลล์สถานะ
                    const statusCell = row.find('td.post-status');
                    const statusText = newStatus === 'publish' ? 'เผยแพร่แล้ว' : 'รออนุมัติ';
                    statusCell.text(statusText);
                    statusCell.attr('data-status', newStatus);
                    
                    // แสดงข้อความสำเร็จ
                    showNotification(response.data.message, 'success');
                } else {
                    showNotification(response.data.message, 'error');
                }
            },
            error: function() {
                showNotification(userPostsData.strings.error, 'error');
            },
            complete: function() {
                row.removeClass('updating');
            }
        });
    };
    
    // แสดงโพสในตาราง
    const renderPosts = function(posts, container) {
        container.empty();
        
        if (posts.length === 0) {
            container.html('<tr><td colspan="5" class="no-posts">' + userPostsData.strings.no_posts_found + '</td></tr>');
            return;
        }
        
        posts.forEach(function(post) {
            const row = $('<tr></tr>');
            
            row.append('<td class="post-type">' + escapeHTML(post.type) + '</td>');
            row.append('<td class="post-title">' + escapeHTML(post.title) + '</td>');
            row.append('<td class="post-date">' + escapeHTML(post.date) + '</td>');
            
            // กำหนดข้อความสถานะภาษาไทย
            let statusText = post.status;
            if (post.status === 'publish') {
                statusText = 'เผยแพร่แล้ว';
            } else if (post.status === 'pending') {
                statusText = 'รออนุมัติ';
            } else if (post.status === 'draft') {
                statusText = 'ฉบับร่าง';
            }
            
            row.append('<td class="post-status" data-status="' + post.status + '">' + statusText + '</td>');
            
            // ปุ่มจัดการ
            const actionsCell = $('<td class="post-actions"></td>');
            
            // ปุ่มดู
            actionsCell.append('<a href="' + post.view_link + '" class="action-btn view-btn" target="_blank">ดูข้อมูล</a>');
            
            // ปุ่มลบโพส (เพิ่มใหม่)
            actionsCell.append('<a href="#" class="action-btn delete-post-btn" data-post-id="' + post.id + '" data-post-title="' + escapeHTML(post.title) + '">ลบโพส</a>');
            
            // ปุ่มเปลี่ยนสถานะ (เฉพาะสถานะ publish และ pending)
            if (post.status === 'publish' || post.status === 'pending') {
                const toggleText = post.status === 'publish' ? 'รออนุมัติ' : 'เผยแพร่';
                const toggleClass = post.status === 'publish' ? 'status-publish' : 'status-pending';
                actionsCell.append('<a href="#" class="action-btn status-toggle-btn ' + toggleClass + '" data-post-id="' + post.id + '" data-current-status="' + post.status + '">' + toggleText + '</a>');
            }
            
            row.append(actionsCell);
            container.append(row);
        });
    };
    
    // แสดง Pagination
    const renderPagination = function(data, container) {
        const { total_pages, current_page, total_posts, per_page } = data;
        
        if (total_pages <= 1) {
            container.empty();
            return;
        }
        
        let html = '<div class="user-posts-pagination-links">';
        
        // ปุ่มหน้าแรก
        if (current_page > 1) {
            html += '<a href="#" class="pagination-link first" data-page="1" title="หน้าแรก">&laquo;</a>';
        } else {
            html += '<span class="pagination-link disabled first" title="หน้าแรก">&laquo;</span>';
        }
        
        // ปุ่มก่อนหน้า
        if (current_page > 1) {
            html += '<a href="#" class="pagination-link prev" data-page="' + (current_page - 1) + '" title="ก่อนหน้า">ก่อนหน้า</a>';
        } else {
            html += '<span class="pagination-link disabled prev" title="ก่อนหน้า">ก่อนหน้า</span>';
        }
        
        // แสดงตัวเลขหน้า
        const maxVisiblePages = 5; // จำนวนหน้าที่จะแสดง
        
        let startPage, endPage;
        
        // คำนวณช่วงหน้าที่จะแสดง
        if (total_pages <= maxVisiblePages) {
            // ถ้ามีหน้าน้อยกว่าหรือเท่ากับที่กำหนดให้แสดง แสดงทั้งหมด
            startPage = 1;
            endPage = total_pages;
        } else {
            // คำนวณช่วงให้หน้าปัจจุบันอยู่ตรงกลาง (ถ้าเป็นไปได้)
            const halfVisible = Math.floor(maxVisiblePages / 2);
            
            if (current_page <= halfVisible + 1) {
                // อยู่ใกล้หน้าแรก
                startPage = 1;
                endPage = maxVisiblePages;
            } else if (current_page >= total_pages - halfVisible) {
                // อยู่ใกล้หน้าสุดท้าย
                startPage = total_pages - maxVisiblePages + 1;
                endPage = total_pages;
            } else {
                // อยู่ตรงกลาง
                startPage = current_page - halfVisible;
                endPage = current_page + halfVisible;
            }
        }
        
        // แสดงหน้าแรกและ ellipsis ถ้าจำเป็น
        if (startPage > 1) {
            html += '<a href="#" class="pagination-link" data-page="1">1</a>';
            
            if (startPage > 2) {
                html += '<span class="pagination-ellipsis">&hellip;</span>';
            }
        }
        
        // แสดงหน้าในช่วงที่คำนวณไว้
        for (let i = startPage; i <= endPage; i++) {
            if (i === current_page) {
                html += '<span class="pagination-link current">' + i + '</span>';
            } else {
                html += '<a href="#" class="pagination-link" data-page="' + i + '">' + i + '</a>';
            }
        }
        
        // แสดงหน้าสุดท้ายและ ellipsis ถ้าจำเป็น
        if (endPage < total_pages) {
            if (endPage < total_pages - 1) {
                html += '<span class="pagination-ellipsis">&hellip;</span>';
            }
            
            html += '<a href="#" class="pagination-link" data-page="' + total_pages + '">' + total_pages + '</a>';
        }
        
        // ปุ่มถัดไป
        if (current_page < total_pages) {
            html += '<a href="#" class="pagination-link next" data-page="' + (current_page + 1) + '" title="ถัดไป">ถัดไป</a>';
        } else {
            html += '<span class="pagination-link disabled next" title="ถัดไป">ถัดไป</span>';
        }
        
        // ปุ่มหน้าสุดท้าย
        if (current_page < total_pages) {
            html += '<a href="#" class="pagination-link last" data-page="' + total_pages + '" title="หน้าสุดท้าย">&raquo;</a>';
        } else {
            html += '<span class="pagination-link disabled last" title="หน้าสุดท้าย">&raquo;</span>';
        }
        
        html += '</div>';
        
        // คำนวณข้อมูลสำหรับข้อความข้างล่าง
        const perPage = parseInt(per_page || 10);
        const startItem = (current_page - 1) * perPage + 1;
        const endItem = Math.min(current_page * perPage, total_posts);
        
        html += '<div class="pagination-info">แสดง ' + 
            startItem + ' ถึง ' + 
            endItem + ' จากทั้งหมด ' + 
            total_posts + ' รายการ (หน้า ' + current_page + ' จาก ' + total_pages + ')</div>';
        
        container.html(html);
    };
    
    // แสดง Loading Indicator
    const showLoadingIndicator = function(container) {
        container.html('<tr><td colspan="5" class="loading-row"><div class="loading-spinner"></div></td></tr>');
    };
    
    // ซ่อน Loading Indicator
    const hideLoadingIndicator = function() {
        container.find('.loading-row').remove();
    };
    
    // แสดงข้อความผิดพลาด
    const showError = function(container, message) {
        container.html('<tr><td colspan="5" class="error-row">' + escapeHTML(message) + '</td></tr>');
    };
    
    // แสดงการแจ้งเตือน
    const showNotification = function(message, type) {
        const notification = $('<div class="user-posts-notification ' + type + '">' + escapeHTML(message) + '</div>');
        container.append(notification);
        
        setTimeout(function() {
            notification.addClass('show');
            
            setTimeout(function() {
                notification.removeClass('show');
                setTimeout(function() {
                    notification.remove();
                }, 300);
            }, 3000);
        }, 10);
    };
    
    // Helper: ฟังก์ชั่น Debounce
    const debounce = function(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, wait);
        };
    };
    
    // Helper: ทำตัวอักษรแรกเป็นตัวพิมพ์ใหญ่
    const capitalizeFirstLetter = function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };
    
    // Helper: Escape HTML
    const escapeHTML = function(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };
    
    // API สาธารณะ
    return {
        init: init
    };
})(jQuery);