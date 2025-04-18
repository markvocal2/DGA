/**
 * Inactive News List JavaScript
 * จัดการการโหลดข้อมูล, การค้นหา, การเปลี่ยนหน้า, และการอัพเดตสถานะ
 */
(function($) {
    $(document).ready(function() {
        var currentPage = 1;
        var searchQuery = '';
        var totalPages = 1;
        
        // โหลดข้อมูลเมื่อเริ่มต้น
        loadInactiveNews(currentPage, searchQuery);
        
        // การค้นหา
        $('#at-news-search-btn').on('click', function() {
            searchQuery = $('#at-news-search').val().trim();
            currentPage = 1; // รีเซ็ตกลับไปหน้าแรกเมื่อค้นหา
            loadInactiveNews(currentPage, searchQuery);
        });
        
        // ใช้ Enter key ในการค้นหา
        $('#at-news-search').on('keypress', function(e) {
            if (e.which === 13) {
                searchQuery = $(this).val().trim();
                currentPage = 1;
                loadInactiveNews(currentPage, searchQuery);
            }
        });
        
        // จัดการการคลิกปุ่ม Pagination
        $(document).on('click', '.at-pagination-button', function() {
            var page = $(this).data('page');
            
            if (page === 'prev') {
                if (currentPage > 1) {
                    currentPage--;
                }
            } else if (page === 'next') {
                if (currentPage < totalPages) {
                    currentPage++;
                }
            } else {
                currentPage = parseInt(page);
            }
            
            loadInactiveNews(currentPage, searchQuery);
            
            // เลื่อนหน้าจอไปยังส่วนบนของตาราง
            $('html, body').animate({
                scrollTop: $('.at-inactive-news-container').offset().top - 50
            }, 300);
        });
        
        // จัดการการคลิก Toggle Switch ใหม่ในตาราง
        $(document).on('click', '.at-direct-toggle-switch', function() {
            var toggleContainer = $(this);
            var row = toggleContainer.closest('tr');
            var postId = row.data('post-id');
            var currentStatus = toggleContainer.hasClass('active') ? 'active' : 'inactive';
            var newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            
            // แสดงการโหลด
            toggleContainer.addClass('loading');
            
            // ส่ง AJAX request
            $.ajax({
                url: atInactiveNewsList.ajaxurl,
                type: 'POST',
                data: {
                    action: 'at_direct_status_toggle',
                    post_id: postId,
                    status: newStatus,
                    nonce: atInactiveNewsList.nonce
                },
                success: function(response) {
                    toggleContainer.removeClass('loading');
                    
                    if (response.success) {
                        // ถ้าเปลี่ยนเป็น 'active' ให้ซ่อนแถวนั้น
                        if (newStatus === 'active') {
                            row.fadeOut(500, function() {
                                // โหลดข้อมูลใหม่
                                loadInactiveNews(currentPage, searchQuery);
                            });
                            showStatusMessage('อัพเดตสถานะเป็น Active เรียบร้อยแล้ว', 'success');
                        } else {
                            // อัพเดตสถานะ UI เมื่อเปลี่ยนเป็น 'inactive'
                            toggleContainer.removeClass('active inactive').addClass(newStatus);
                            toggleContainer.find('.at-status-text').text(newStatus === 'active' ? 'Active' : 'Inactive');
                            showStatusMessage('อัพเดตสถานะเป็น Inactive เรียบร้อยแล้ว', 'success');
                        }
                    } else {
                        showStatusMessage(response.data.message, 'error');
                    }
                },
                error: function() {
                    toggleContainer.removeClass('loading');
                    showStatusMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง', 'error');
                }
            });
        });
        
        // ฟังก์ชันโหลดข้อมูล
        function loadInactiveNews(page, search) {
            // แสดงการโหลด
            $('#at-news-table-body').html('<tr><td colspan="6" class="at-loading-data">กำลังโหลดข้อมูล...</td></tr>');
            $('#at-news-pagination').html('');
            
            // ส่ง AJAX request
            $.ajax({
                url: atInactiveNewsList.ajaxurl,
                type: 'POST',
                data: {
                    action: 'at_load_inactive_news',
                    page: page,
                    search: search,
                    per_page: atInactiveNewsList.perPage,
                    nonce: atInactiveNewsList.nonce
                },
                success: function(response) {
                    if (response.success) {
                        var data = response.data;
                        totalPages = data.total_pages;
                        
                        // อัพเดตตาราง
                        updateNewsTable(data.news);
                        
                        // อัพเดต Pagination
                        updatePagination(data.current_page, data.total_pages);
                        
                        // ไม่มีข้อมูล
                        if (data.news.length === 0) {
                            $('#at-news-table-body').html('<tr><td colspan="6" class="at-no-data">ไม่พบข้อมูล</td></tr>');
                        }
                        
                        // แสดงข้อความข้อมูลทั้งหมด
                        $('#at-news-status-message').html('แสดง ' + data.news.length + ' รายการ จากทั้งหมด ' + data.total_posts + ' รายการ');
                    } else {
                        // แสดงข้อความผิดพลาด
                        $('#at-news-table-body').html('<tr><td colspan="6" class="at-error-data">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>');
                        showStatusMessage(response.data.message, 'error');
                    }
                },
                error: function() {
                    // แสดงข้อความผิดพลาด
                    $('#at-news-table-body').html('<tr><td colspan="6" class="at-error-data">เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง</td></tr>');
                    showStatusMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
                }
            });
        }
        
        // อัพเดตตาราง
        function updateNewsTable(news) {
            var tableBody = $('#at-news-table-body');
            tableBody.empty();
            
            $.each(news, function(index, item) {
                var row = $('<tr data-post-id="' + item.id + '">');
                
                row.append('<td>' + item.id + '</td>');
                row.append('<td>' + item.date + '</td>');
                row.append('<td class="at-news-title"><a href="' + item.permalink + '" target="_blank">' + item.title + '</a></td>');
                
                // คอลัมน์เลขที่ประกาศ (แทนหมวดหมู่)
                var docNumHtml = '<td class="at-doc-number">';
                if (item.docnum_1 !== '-') {
                    docNumHtml += '<div class="at-doc-number-item"><span class="at-doc-label">มสพร.</span> ' + item.docnum_1 + '</div>';
                }
                if (item.docnum_2 !== '-') {
                    docNumHtml += '<div class="at-doc-number-item"><span class="at-doc-label">มรด.</span> ' + item.docnum_2 + '</div>';
                }
                if (item.docnum_1 === '-' && item.docnum_2 === '-') {
                    docNumHtml += '<div class="at-doc-number-item at-doc-none">ไม่มีเลขที่</div>';
                }
                docNumHtml += '</td>';
                row.append(docNumHtml);
                
                // คอลัมน์สถานะปัจจุบัน
                var statusText = item.status === 'active' ? 'Active' : 'Inactive';
                var statusClass = item.status === 'active' ? 'at-status-active' : 'at-status-inactive';
                row.append('<td class="at-status-column"><span class="at-status-badge ' + statusClass + '">' + statusText + '</span></td>');
                
                // คอลัมน์ Toggle Switch
                var toggleHtml = '<td class="at-action-column">';
                toggleHtml += '<div class="at-direct-toggle-container">';
                toggleHtml += '<div class="at-direct-toggle-switch ' + item.status + '" data-post-id="' + item.id + '">';
                toggleHtml += '<div class="at-direct-toggle-slider"></div>';
                toggleHtml += '<span class="at-status-text">' + statusText + '</span>';
                toggleHtml += '</div>';
                toggleHtml += '</div>';
                toggleHtml += '</td>';
                
                row.append(toggleHtml);
                
                tableBody.append(row);
            });
        }
        
        // อัพเดต Pagination
        function updatePagination(currentPage, totalPages) {
            var pagination = $('#at-news-pagination');
            pagination.empty();
            
            if (totalPages <= 1) {
                return;
            }
            
            // ปุ่มก่อนหน้า
            pagination.append('<button class="at-pagination-button prev" data-page="prev">&laquo; ก่อนหน้า</button>');
            
            // จำนวนปุ่มที่จะแสดง
            var maxButtons = 5;
            var startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
            var endPage = Math.min(totalPages, startPage + maxButtons - 1);
            
            if (endPage - startPage + 1 < maxButtons && startPage > 1) {
                startPage = Math.max(1, endPage - maxButtons + 1);
            }
            
            // ปุ่มหน้าแรก
            if (startPage > 1) {
                pagination.append('<button class="at-pagination-button" data-page="1">1</button>');
                if (startPage > 2) {
                    pagination.append('<span class="at-pagination-ellipsis">...</span>');
                }
            }
            
            // ปุ่มตัวเลข
            for (var i = startPage; i <= endPage; i++) {
                var activeClass = (i === currentPage) ? ' at-pagination-active' : '';
                pagination.append('<button class="at-pagination-button' + activeClass + '" data-page="' + i + '">' + i + '</button>');
            }
            
            // ปุ่มหน้าสุดท้าย
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    pagination.append('<span class="at-pagination-ellipsis">...</span>');
                }
                pagination.append('<button class="at-pagination-button" data-page="' + totalPages + '">' + totalPages + '</button>');
            }
            
            // ปุ่มถัดไป
            pagination.append('<button class="at-pagination-button next" data-page="next">ถัดไป &raquo;</button>');
        }
        
        // ฟังก์ชันแสดงข้อความสถานะ
        function showStatusMessage(message, type) {
            var messageClass = type === 'success' ? 'at-success' : 'at-error';
            var statusBox = $('#at-news-status-message');
            
            statusBox.html('<span class="' + messageClass + '">' + message + '</span>');
            
            // ซ่อนข้อความหลังจาก 3 วินาที
            setTimeout(function() {
                statusBox.html('');
            }, 3000);
        }
    });
})(jQuery);