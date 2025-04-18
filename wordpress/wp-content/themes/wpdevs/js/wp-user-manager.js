/**
 * wp-user-manager.js
 * สคริปต์จัดการข้อมูลผู้ใช้ WordPress ปรับปรุงใหม่
 */
jQuery(document).ready(function($) {
    // ตัวแปรสำหรับเก็บข้อมูลการแบ่งหน้า
    let currentPage = 1;
    let totalPages = 0;
    let usersPerPage = 20;
    let currentSearch = '';
    let currentRoleFilter = '';
    let isLoading = false;
    
    // DOM Elements
    const userTableBody = $('#user-table-body');
    const prevPageBtn = $('#prev-page');
    const nextPageBtn = $('#next-page');
    const pageNumbers = $('#page-numbers');
    const paginationStart = $('#pagination-start');
    const paginationEnd = $('#pagination-end');
    const paginationTotal = $('#pagination-total');
    const searchInput = $('#user-search-input');
    const roleFilter = $('#role-filter');
    
    // Modal Elements
    const roleEditModal = $('#role-edit-modal');
    const editUserInfo = $('#edit-user-info');
    const editUserId = $('#edit-user-id');
    const roleOptions = $('.role-option');
    const saveRoleEditBtn = $('#save-role-edit');
    const cancelEditBtn = $('#cancel-edit');
    const closeModalBtn = $('.close-modal');
    
    const deleteConfirmModal = $('#delete-confirm-modal');
    const deleteUserInfo = $('#delete-user-info');
    const deleteUserId = $('#delete-user-id');
    const confirmDeleteBtn = $('#confirm-delete');
    const cancelDeleteBtn = $('#cancel-delete');
    
    // เริ่มต้นโหลดข้อมูลผู้ใช้
    initTable();
    
    function initTable() {
        // แสดง animation โหลดข้อมูล
        userTableBody.html(`
            <tr class="loading-row">
                <td colspan="4" class="loading-cell">
                    <div class="loader"></div>
                    <span>กำลังโหลดข้อมูลผู้ใช้...</span>
                </td>
            </tr>
        `);
        
        // โหลดข้อมูลผู้ใช้เริ่มต้น
        loadUsers();
        
        // ตั้งค่า event listeners
        setupEventListeners();
    }
    
    function setupEventListeners() {
        // Event Listeners สำหรับค้นหาและกรอง
        searchInput.on('input', debounce(function() {
            currentSearch = $(this).val();
            currentPage = 1;
            loadUsers();
        }, 500));
        
        roleFilter.on('change', function() {
            currentRoleFilter = $(this).val();
            currentPage = 1;
            loadUsers();
        });
        
        // Event Listeners สำหรับ Pagination
        prevPageBtn.on('click', function() {
            if (!isLoading && currentPage > 1) {
                currentPage--;
                loadUsers();
                
                // เลื่อนขึ้นด้านบนของตาราง
                scrollToTable();
            }
        });
        
        nextPageBtn.on('click', function() {
            if (!isLoading && currentPage < totalPages) {
                currentPage++;
                loadUsers();
                
                // เลื่อนขึ้นด้านบนของตาราง
                scrollToTable();
            }
        });
        
        pageNumbers.on('click', '.page-number', function() {
            if (!isLoading) {
                const pageNum = parseInt($(this).data('page'));
                if (pageNum !== currentPage) {
                    currentPage = pageNum;
                    loadUsers();
                    
                    // เลื่อนขึ้นด้านบนของตาราง
                    scrollToTable();
                }
            }
        });
        
        // Event Listeners สำหรับ Edit Role
        userTableBody.on('click', '.edit-role-btn', function(e) {
            e.preventDefault();
            
            const userId = $(this).data('user-id');
            const username = $(this).data('username');
            const currentRole = $(this).data('current-role');
            
            editUserId.val(userId);
            editUserInfo.text(`กำลังแก้ไขบทบาทของ: ${username}`);
            
            // รีเซ็ตและไฮไลท์ role ปัจจุบัน
            roleOptions.removeClass('selected');
            $(`.role-option[data-role="${currentRole}"]`).addClass('selected');
            
            openModal(roleEditModal);
        });
        
        roleOptions.on('click', function() {
            roleOptions.removeClass('selected');
            $(this).addClass('selected');
        });
        
        saveRoleEditBtn.on('click', function() {
            const userId = editUserId.val();
            const selectedRole = $('.role-option.selected').data('role');
            
            if (!selectedRole) {
                showNotification('กรุณาเลือกบทบาท', 'warning');
                return;
            }
            
            updateUserRole(userId, selectedRole);
        });
        
        // Event Listeners สำหรับ Delete User
        userTableBody.on('click', '.delete-user-btn', function(e) {
            e.preventDefault();
            
            const userId = $(this).data('user-id');
            const username = $(this).data('username');
            
            deleteUserId.val(userId);
            deleteUserInfo.html(`<strong>คำเตือน:</strong> คุณต้องการลบผู้ใช้ "${username}" ใช่หรือไม่?<br>การกระทำนี้ไม่สามารถเรียกคืนได้`);
            
            openModal(deleteConfirmModal);
        });
        
        confirmDeleteBtn.on('click', function() {
            const userId = deleteUserId.val();
            deleteUser(userId);
        });
        
        // Event Listeners สำหรับ Modal
        cancelEditBtn.on('click', function() {
            closeModal(roleEditModal);
        });
        
        cancelDeleteBtn.on('click', function() {
            closeModal(deleteConfirmModal);
        });
        
        closeModalBtn.on('click', function() {
            closeModal($(this).closest('.modal'));
        });
        
        // ปิด Modal เมื่อคลิกพื้นหลัง
        $(window).on('click', function(event) {
            if ($(event.target).hasClass('modal')) {
                closeModal($(event.target));
            }
        });
        
        // ป้องกันการกด Enter ใน search input ส่งฟอร์ม
        $(document).on('keydown', '#user-search-input', function(e) {
            if (e.keyCode === 13) {
                e.preventDefault();
                return false;
            }
        });
    }
    
    function loadUsers() {
        if (isLoading) return;
        
        isLoading = true;
        
        // แสดงสถานะกำลังโหลด
        if (userTableBody.find('.loading-row').length === 0) {
            userTableBody.html(`
                <tr class="loading-row">
                    <td colspan="4" class="loading-cell">
                        <div class="loader"></div>
                        <span>กำลังโหลดข้อมูลผู้ใช้...</span>
                    </td>
                </tr>
            `);
        }
        
        // ปิดใช้งานปุ่ม pagination ขณะโหลด
        prevPageBtn.prop('disabled', true);
        nextPageBtn.prop('disabled', true);
        
        $.ajax({
            url: wpUserManager.ajaxurl,
            type: 'POST',
            data: {
                action: 'get_users_data',
                security: wpUserManager.security,
                page: currentPage,
                per_page: usersPerPage,
                search: currentSearch,
                role: currentRoleFilter
            },
            success: function(response) {
                isLoading = false;
                
                if (response.success) {
                    displayUsers(response.data);
                    updatePagination(response.data);
                } else {
                    userTableBody.html(`
                        <tr>
                            <td colspan="4" class="empty-message">
                                เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง
                            </td>
                        </tr>
                    `);
                }
            },
            error: function(xhr, status, error) {
                isLoading = false;
                console.error('Error loading users:', error);
                
                userTableBody.html(`
                    <tr>
                        <td colspan="4" class="empty-message">
                            เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง
                        </td>
                    </tr>
                `);
            }
        });
    }
    
    function displayUsers(data) {
        const users = data.users;
        
        if (users.length === 0) {
            let emptyMessage = 'ไม่พบข้อมูลผู้ใช้';
            
            if (currentSearch) {
                emptyMessage = `ไม่พบผู้ใช้ที่ตรงกับคำค้นหา "${currentSearch}"`;
            } else if (currentRoleFilter) {
                const roleName = $('#role-filter option:selected').text();
                emptyMessage = `ไม่พบผู้ใช้ในบทบาท "${roleName}"`;
            }
            
            userTableBody.html(`
                <tr>
                    <td colspan="4" class="empty-message">
                        ${emptyMessage}
                    </td>
                </tr>
            `);
            return;
        }
        
        userTableBody.empty();
        
        users.forEach(function(user) {
            const fullName = user.first_name && user.last_name 
                ? `${user.first_name} ${user.last_name}` 
                : (user.first_name || user.last_name || '-');
                
            const roles = user.roles.join(', ') || '-';
            const primaryRole = user.role_keys[0] || '';
            
            // สร้างชื่อย่อสำหรับ avatar
            const initial = user.display_name.charAt(0).toUpperCase();
            
            // HTML สำหรับแต่ละแถว
            userTableBody.append(`
                <tr>
                    <td class="username-cell">
                        <div class="user-info">
                            <div class="avatar">
                                <span class="initial">${initial}</span>
                            </div>
                            <div class="user-details">
                                <span class="username">${user.username}</span>
                                <span class="email">${user.email}</span>
                            </div>
                        </div>
                    </td>
                    <td>${fullName}</td>
                    <td><span class="role-badge">${roles}</span></td>
                    <td class="actions-cell">
                        <button class="edit-role-btn" 
                            data-user-id="${user.id}" 
                            data-username="${user.username}"
                            data-current-role="${primaryRole}">
                            <svg viewBox="0 0 24 24" class="icon">
                                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z"></path>
                            </svg>
                            แก้ไขบทบาท
                        </button>
                        <button class="delete-user-btn" 
                            data-user-id="${user.id}" 
                            data-username="${user.username}">
                            <svg viewBox="0 0 24 24" class="icon">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
                            </svg>
                            ลบผู้ใช้
                        </button>
                    </td>
                </tr>
            `);
        });
        
        // เพิ่ม animation เข้ามาทีละแถว
        userTableBody.find('tr').each(function(index) {
            $(this).css({
                'opacity': '0',
                'transform': 'translateY(10px)'
            });
            
            setTimeout(() => {
                $(this).css({
                    'transition': 'all 0.3s ease',
                    'opacity': '1',
                    'transform': 'translateY(0)'
                });
            }, index * 50);
        });
    }
    
    function updatePagination(data) {
        totalPages = data.total_pages;
        const totalUsers = data.total;
        const start = totalUsers > 0 ? (currentPage - 1) * usersPerPage + 1 : 0;
        const end = Math.min(start + usersPerPage - 1, totalUsers);
        
        // อัพเดตข้อมูลการแบ่งหน้า
        paginationStart.text(totalUsers > 0 ? start : 0);
        paginationEnd.text(end);
        paginationTotal.text(totalUsers);
        
        // อัพเดตปุ่ม prev/next
        prevPageBtn.prop('disabled', currentPage <= 1);
        nextPageBtn.prop('disabled', currentPage >= totalPages);
        
        // สร้างตัวเลือกหน้า
        pageNumbers.empty();
        
        if (totalPages <= 5) {
            // แสดงทุกหน้าถ้ามีน้อยกว่าหรือเท่ากับ 5 หน้า
            for (let i = 1; i <= totalPages; i++) {
                addPageNumber(i);
            }
        } else {
            // แสดงแบบย่อถ้ามีมากกว่า 5 หน้า
            if (currentPage <= 3) {
                // หน้าแรกๆ
                for (let i = 1; i <= 3; i++) {
                    addPageNumber(i);
                }
                addEllipsis();
                addPageNumber(totalPages);
            } else if (currentPage >= totalPages - 2) {
                // หน้าท้ายๆ
                addPageNumber(1);
                addEllipsis();
                for (let i = totalPages - 2; i <= totalPages; i++) {
                    addPageNumber(i);
                }
            } else {
                // หน้ากลางๆ
                addPageNumber(1);
                addEllipsis();
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    addPageNumber(i);
                }
                addEllipsis();
                addPageNumber(totalPages);
            }
        }
        
        // ถ้าไม่มีข้อมูลให้ซ่อนการแบ่งหน้า
        if (totalUsers === 0) {
            $('.pagination-container').addClass('hidden');
        } else {
            $('.pagination-container').removeClass('hidden');
        }
    }
    
    function addPageNumber(pageNum) {
        const isActive = pageNum === currentPage;
        pageNumbers.append(`
            <button class="page-number ${isActive ? 'active' : ''}" data-page="${pageNum}">
                ${pageNum}
            </button>
        `);
    }
    
    function addEllipsis() {
        pageNumbers.append('<span class="page-ellipsis">...</span>');
    }
    
    function updateUserRole(userId, role) {
        // แสดงสถานะกำลังดำเนินการ
        saveRoleEditBtn.html('<span class="loading-text">กำลังบันทึก...</span>');
        saveRoleEditBtn.prop('disabled', true);
        
        $.ajax({
            url: wpUserManager.ajaxurl,
            type: 'POST',
            data: {
                action: 'update_user_role',
                security: wpUserManager.security,
                user_id: userId,
                role: role
            },
            success: function(response) {
                // คืนค่าปุ่มกลับสู่สถานะปกติ
                saveRoleEditBtn.html('บันทึก');
                saveRoleEditBtn.prop('disabled', false);
                
                if (response.success) {
                    showNotification(wpUserManager.messages.updateSuccess, 'success');
                    closeModal(roleEditModal);
                    loadUsers();
                } else {
                    showNotification(response.data || wpUserManager.messages.updateError, 'error');
                }
            },
            error: function(xhr, status, error) {
                // คืนค่าปุ่มกลับสู่สถานะปกติ
                saveRoleEditBtn.html('บันทึก');
                saveRoleEditBtn.prop('disabled', false);
                
                console.error('Update error:', error);
                showNotification(wpUserManager.messages.updateError, 'error');
            }
        });
    }
    
    function deleteUser(userId) {
        // แสดงสถานะกำลังดำเนินการ
        confirmDeleteBtn.html('<span class="loading-text">กำลังลบ...</span>');
        confirmDeleteBtn.prop('disabled', true);
        
        $.ajax({
            url: wpUserManager.ajaxurl,
            type: 'POST',
            data: {
                action: 'delete_wp_user',
                security: wpUserManager.security,
                user_id: userId
            },
            success: function(response) {
                // คืนค่าปุ่มกลับสู่สถานะปกติ
                confirmDeleteBtn.html('ลบผู้ใช้');
                confirmDeleteBtn.prop('disabled', false);
                
                if (response.success) {
                    showNotification(wpUserManager.messages.deleteSuccess, 'success');
                    closeModal(deleteConfirmModal);
                    loadUsers();
                } else {
                    showNotification(response.data || wpUserManager.messages.deleteError, 'error');
                }
            },
            error: function(xhr, status, error) {
                // คืนค่าปุ่มกลับสู่สถานะปกติ
                confirmDeleteBtn.html('ลบผู้ใช้');
                confirmDeleteBtn.prop('disabled', false);
                
                console.error('Delete error:', error);
                showNotification(wpUserManager.messages.deleteError, 'error');
            }
        });
    }
    
    function openModal(modal) {
        modal.fadeIn(300);
        
        // เพิ่ม class ให้กับ body เพื่อป้องกันการเลื่อน
        $('body').addClass('modal-open');
        
        // ปรับตำแหน่ง modal ให้อยู่ตรงกลางเสมอ
        const modalContent = modal.find('.modal-content');
        modalContent.css({
            'top': '50%',
            'left': '50%',
            'transform': 'translate(-50%, -50%)'
        });
    }
    
    function closeModal(modal) {
        modal.fadeOut(200);
        $('body').removeClass('modal-open');
    }
    
    function showNotification(message, type) {
        // ลบ notification เดิม (ถ้ามี)
        $('.notification').remove();
        
        // สร้าง notification ใหม่
        const notification = $(`
            <div class="notification ${type}">
                <span class="notification-message">${message}</span>
                <span class="notification-close">&times;</span>
            </div>
        `);
        
        $('body').append(notification);
        
        // แสดง notification
        setTimeout(() => {
            notification.addClass('show');
        }, 10);
        
        // ซ่อน notification หลังจาก 3 วินาที
        setTimeout(() => {
            notification.removeClass('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
        
        // ปิด notification เมื่อคลิกที่ปุ่มปิด
        notification.find('.notification-close').on('click', function() {
            notification.removeClass('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
    }
    
    function scrollToTable() {
        // เลื่อนไปที่ด้านบนของตาราง
        $('html, body').animate({
            scrollTop: $('.user-table-wrapper').offset().top - 20
        }, 300);
    }
    
    // Utility functions
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, wait);
        };
    }
});