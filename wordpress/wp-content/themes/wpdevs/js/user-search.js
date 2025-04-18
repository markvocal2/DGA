// /js/user-search.js
jQuery(document).ready(function($) {
    let searchTimeout;
    const searchInput = $('#user-search-input');
    const searchResults = $('#search-results');
    const modal = $('#role-modal');
    const closeBtn = $('.close');
    const saveBtn = $('#save-role');
    
    // ฟังก์ชันค้นหา Users
    searchInput.on('input', function() {
        clearTimeout(searchTimeout);
        const term = $(this).val();
        
        if (term.length < 2) {
            searchResults.empty().hide();
            return;
        }
        
        searchTimeout = setTimeout(function() {
            searchResults.html('<div class="loading">กำลังค้นหา...</div>').show();
            
            $.ajax({
                url: userSearchAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'search_users',
                    security: userSearchAjax.security,
                    term: term
                },
                success: function(response) {
                    if (response.success && response.data.length > 0) {
                        searchResults.empty();
                        response.data.forEach(function(user) {
                            searchResults.append(`
                                <div class="search-item" data-user-id="${user.id}">
                                    <strong>${user.name}</strong><br>
                                    <small>${user.email}</small>
                                </div>
                            `);
                        });
                    } else {
                        searchResults.html('<div class="loading">ไม่พบผู้ใช้</div>');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Search error:', error);
                    searchResults.html('<div class="loading">เกิดข้อผิดพลาดในการค้นหา</div>');
                }
            });
        }, 500);
    });
    
    // เมื่อคลิกเลือก User
    searchResults.on('click', '.search-item', function() {
        const userId = $(this).data('user-id');
        $('#selected-user-id').val(userId);
        searchResults.hide();
        searchInput.val($(this).find('strong').text());
        
        // ดึงข้อมูล Role ปัจจุบันของ User
        $.ajax({
            url: userSearchAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'get_user_role',
                security: userSearchAjax.security,
                user_id: userId
            },
            success: function(response) {
                if (response.success) {
                    // Reset และ highlight role ปัจจุบัน
                    $('.role-option').removeClass('selected current-role');
                    $(`.role-option[data-role="${response.data}"]`).addClass('selected current-role');
                }
                modal.show();
            },
            error: function(xhr, status, error) {
                console.error('Error getting user role:', error);
                modal.show();
            }
        });
    });
    
    // เลือก Role
    $('.role-option').on('click', function() {
        $('.role-option').removeClass('selected');
        $(this).addClass('selected');
    });
    
    // ปุ่มบันทึก
    $('#save-role').on('click', function() {
        const userId = $('#selected-user-id').val();
        const selectedRole = $('.role-option.selected').data('role');
        
        if (!selectedRole) {
            alert('กรุณาเลือกแผนก');
            return;
        }
        
        $.ajax({
            url: userSearchAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'update_user_role',
                security: userSearchAjax.security,
                user_id: userId,
                role: selectedRole
            },
            success: function(response) {
                if (response.success) {
                    alert('อัพเดตแผนกเรียบร้อยแล้ว');
                    modal.hide();
                    searchInput.val('');
                } else {
                    alert(response.data || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
                }
            },
            error: function(xhr, status, error) {
                console.error('Update error:', error);
                alert('เกิดข้อผิดพลาดในการอัพเดต กรุณาลองใหม่อีกครั้ง');
            }
        });
    });
    
    // ปิด Modal
    closeBtn.on('click', function() {
        modal.hide();
    });
    
    $(window).on('click', function(event) {
        if ($(event.target).is(modal)) {
            modal.hide();
        }
    });

    // แสดง/ซ่อน Modal
    function toggleModal(show = true) {
        if (show) {
            modal.css('display', 'block');
        } else {
            modal.css('display', 'none');
        }
    }

    modal.hide = function() {
        toggleModal(false);
    };

    modal.show = function() {
        toggleModal(true);
    };
});