jQuery(document).ready(($) => {
    console.log('EGP File Download JS loaded');
    
    // ============= ส่วนของการจัดการตาราง =============
    
    // เพิ่มช่องค้นหาถ้ามีรายการเอกสารมากกว่า 5 รายการ
    $('.egp-file-container').each(function() {
        const container = $(this);
        if (container.find('.egp-file-table tbody tr').not('.egp-no-files-row').length > 5) {
            const searchBox = $(`
                <div class="egp-search-container">
                    <div class="egp-search-wrapper">
                        <input type="text" class="egp-search-input" placeholder="ค้นหาเอกสาร...">
                        <span class="egp-search-icon dashicons dashicons-search"></span>
                    </div>
                </div>
            `);
            container.find('.egp-file-header').after(searchBox);
            
            // ฟังก์ชันค้นหา
            container.find('.egp-search-input').on('keyup', function() {
                const value = $(this).val().toLowerCase();
                container.find('.egp-file-table tbody tr').not('.egp-no-files-row').filter(function() {
                    $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
                });
                
                // แสดงข้อความเมื่อไม่พบข้อมูล
                const visibleRows = container.find('.egp-file-table tbody tr:visible').not('.egp-no-files-row, .egp-no-search-results').length;
                if (visibleRows === 0) {
                    if (container.find('.egp-no-search-results').length === 0) {
                        const colSpan = container.find('.egp-file-table thead th').length;
                        container.find('.egp-file-table tbody').append(`
                            <tr class="egp-no-search-results">
                                <td colspan="${colSpan}">
                                    <div class="egp-empty-search">
                                        <span class="dashicons dashicons-search"></span>
                                        <p>ไม่พบเอกสารที่ค้นหา</p>
                                    </div>
                                </td>
                            </tr>
                        `);
                    }
                    container.find('.egp-no-search-results').show();
                } else {
                    container.find('.egp-no-search-results').hide();
                }
            });
        }
    });
    
    // ============= ส่วนของการจัดการ Upload Tabs =============
    
    // เปลี่ยน Tab
    $(document).on('click', '.egp-tab-btn', function() {
        const $this = $(this);
        const tab = $this.data('tab');
        const $tabContainer = $this.closest('.egp-upload-tabs');
        
        // เปลี่ยน active tab
        $tabContainer.find('.egp-tab-btn').removeClass('active');
        $this.addClass('active');
        
        // เปลี่ยน active content
        $tabContainer.find('.egp-tab-content').removeClass('active');
        $tabContainer.find(`.egp-tab-content[data-tab="${tab}"]`).addClass('active');
        
        // อัพเดตค่า upload_type
        $tabContainer.closest('form').find('input[name="upload_type"]').val(tab === 'upload' ? 'direct' : 'media');
        
        // ถ้าเปลี่ยนไปที่ tab upload ให้ตั้งค่า required ของ file_upload
        if (tab === 'upload') {
            $tabContainer.find('input[name="file_upload"]').prop('required', true);
            $tabContainer.closest('form').find('input[name="file_url"]').val('');
        } else {
            $tabContainer.find('input[name="file_upload"]').prop('required', false);
        }
    });
    
    // การทำงานของปุ่ม Browse
    $(document).on('click', '.egp-browse-btn', function() {
        $(this).siblings('.egp-file-input').click();
    });
    
    // แสดงชื่อไฟล์เมื่อเลือกไฟล์
    $(document).on('change', '.egp-file-input', function() {
        let fileName = '';
        const $fileNameDisplay = $(this).closest('.egp-file-drop-area').siblings('.egp-file-name-display');
        
        if (this.files && this.files.length > 0) {
            fileName = this.files[0].name;
            
            // แสดงชื่อไฟล์และไอคอนตามประเภทไฟล์
            const fileExt = fileName.split('.').pop().toLowerCase();
            const iconClass = getFileIconClass(fileExt);
            
            $fileNameDisplay.html(`
                <div class="egp-selected-file">
                    <span class="dashicons ${iconClass}"></span>
                    <span class="egp-file-name-text">${fileName}</span>
                </div>
            `);
            
            // ตั้งชื่อไฟล์อัตโนมัติถ้ายังไม่ได้กรอก
            const form = $(this).closest('form');
            const nameField = form.find('input[name="file_name"]');
            if (!nameField.val()) {
                // ใช้ชื่อไฟล์โดยไม่มีนามสกุล
                const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
                nameField.val(fileNameWithoutExt);
            }
        } else {
            $fileNameDisplay.empty();
        }
    });
    
    // ลากไฟล์มาวาง
    $('.egp-file-drop-area').each(function() {
        const $dropArea = $(this);
        const $input = $dropArea.find('.egp-file-input');
        const $fileNameDisplay = $dropArea.siblings('.egp-file-name-display');
        
        $dropArea.on('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            $(this).addClass('dragging');
        });
        
        $dropArea.on('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            $(this).removeClass('dragging');
        });
        
        $dropArea.on('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            $(this).removeClass('dragging');
            
            if (e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files.length) {
                $input[0].files = e.originalEvent.dataTransfer.files;
                $input.trigger('change');
            }
        });
    });
    
    // ============= ส่วนของการจัดการ Modal =============
    
    // เปิด Modal เมื่อคลิกปุ่มเพิ่มไฟล์
    $('.egp-file-container').on('click', '.egp-add-file-btn', function() {
        const container = $(this).closest('.egp-file-container');
        const uniqueId = container.attr('id');
        
        // ค้นหา modal ที่มี ID ที่ถูกต้อง
        const modal = $(`#egp-file-modal-${uniqueId.split('-').pop()}`);
        
        // รีเซ็ตฟอร์ม
        resetFileForm(modal);
        
        // เปลี่ยนชื่อ Modal
        modal.find('.egp-modal-title').text('เพิ่มไฟล์เอกสาร');
        
        // เปิด Modal
        modal.addClass('open');
        $('body').addClass('egp-modal-open');
    });
    
    // เปิด Modal เมื่อคลิกปุ่มแก้ไขไฟล์
    $('.egp-file-container').on('click', '.egp-edit-file-btn', function() {
        const container = $(this).closest('.egp-file-container');
        const uniqueId = container.attr('id');
        
        // ค้นหา modal ที่มี ID ที่ถูกต้อง
        const modal = $(`#egp-file-modal-${uniqueId.split('-').pop()}`);
        
        const fileIndex = $(this).data('index');
        const fileName = $(this).data('name');
        const fileDate = $(this).data('date');
        const fileUrl = $(this).data('url');
        
        // กรอกข้อมูลเดิมลงในฟอร์ม
        modal.find('input[name="file_index"]').val(fileIndex);
        modal.find('input[name="file_name"]').val(fileName);
        modal.find('input[name="file_date"]').val(fileDate);
        modal.find('input[name="file_url"]').val(fileUrl);
        
        // เปลี่ยนไปใช้ tab media และกำหนดค่า URL
        modal.find('.egp-tab-btn[data-tab="media"]').click();
        
        // แสดงตัวอย่างไฟล์
        const filePreview = modal.find('.egp-file-preview');
        filePreview.empty();
        
        if (isImageFile(fileUrl)) {
            filePreview.html(`<img src="${fileUrl}" alt="${fileName}">`);
        } else {
            const fileExt = fileUrl.split('.').pop().toLowerCase();
            filePreview.html(`
                <div class="egp-file-icon-preview">
                    <span class="dashicons ${getFileIconClass(fileExt)}"></span>
                    <span class="egp-file-ext">${fileExt}</span>
                </div>
            `);
        }
        
        // เปลี่ยนชื่อ Modal
        modal.find('.egp-modal-title').text('แก้ไขไฟล์เอกสาร');
        
        // เปิด Modal
        modal.addClass('open');
        $('body').addClass('egp-modal-open');
    });
    
    // ปิด Modal
    $(document).on('click', '.egp-modal-close, .egp-cancel-btn, .egp-modal-overlay', function(e) {
        if (e.target === this || !$(this).hasClass('egp-modal-overlay')) {
            $(this).closest('.egp-modal').removeClass('open');
            $('body').removeClass('egp-modal-open');
        }
    });
    
    // เลือกไฟล์จาก Media Library
    $(document).on('click', '.egp-select-media-btn', function() {
        const button = $(this);
        const modal = button.closest('.egp-modal');
        const form = modal.find('form');
        const filePreview = modal.find('.egp-file-preview');
        
        // เปิด Media Library
        const mediaUploader = wp.media({
            title: 'เลือกไฟล์',
            button: {
                text: 'เลือกไฟล์นี้'
            },
            multiple: false
        });
        
        // เมื่อเลือกไฟล์แล้ว
        mediaUploader.on('select', () => {
            const attachment = mediaUploader.state().get('selection').first().toJSON();
            form.find('input[name="file_url"]').val(attachment.url);
            
            // ตั้งชื่อไฟล์อัตโนมัติถ้ายังไม่ได้กรอก
            const fileName = form.find('input[name="file_name"]').val();
            if (!fileName) {
                form.find('input[name="file_name"]').val(attachment.title);
            }
            
            // แสดงตัวอย่างไฟล์
            filePreview.empty();
            
            if (isImageFile(attachment.url)) {
                filePreview.html(`<img src="${attachment.url}" alt="${attachment.title}">`);
            } else {
                const fileExt = attachment.url.split('.').pop().toLowerCase();
                filePreview.html(`
                    <div class="egp-file-icon-preview">
                        <span class="dashicons ${getFileIconClass(fileExt)}"></span>
                        <span class="egp-file-ext">${fileExt}</span>
                    </div>
                `);
            }
        });
        
        mediaUploader.open();
    });
    
    // บันทึกไฟล์
    $(document).on('submit', '.egp-file-form', function(e) {
        e.preventDefault();
        
        const form = $(this);
        const formId = form.attr('id');
        const uniqueId = formId.split('-').pop();
        const container = $(`.egp-file-container[id$="${uniqueId}"]`);
        const modal = form.closest('.egp-modal');
        const submitBtn = form.find('.egp-save-btn');
        const uploadType = form.find('input[name="upload_type"]').val();
        const debugInfo = modal.find('.egp-debug-info');
        
        // ตรวจสอบความถูกต้องของข้อมูล
        if (uploadType === 'direct') {
            const fileInput = form.find('input[name="file_upload"]');
            if (fileInput.prop('required') && fileInput[0].files.length === 0) {
                alert('กรุณาเลือกไฟล์');
                return false;
            }
        } else {
            if (!form.find('input[name="file_url"]').val()) {
                alert('กรุณาเลือกไฟล์จาก Media Library');
                return false;
            }
        }
        
        // เปลี่ยนข้อความปุ่มและปิดการใช้งาน
        submitBtn.prop('disabled', true).text('กำลังบันทึก...');
        
        // สร้าง FormData สำหรับส่งข้อมูลรวมถึงไฟล์
        const formData = new FormData(form[0]);
        
        // ส่งข้อมูลไปยัง AJAX
        $.ajax({
            url: egp_ajax.ajax_url,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: (response) => {
                console.log('AJAX Response:', response);
                
                // แสดงข้อมูล debug (เฉพาะเมื่อมีปัญหา)
                if (!response.success) {
                    debugInfo.html(`<pre style="font-size: 12px; color: #f00;">${JSON.stringify(response.debug, null, 2)}</pre>`).show();
                } else {
                    debugInfo.hide();
                }
                
                if (response.success) {
                    // อัปเดตตาราง
                    updateFileTable(container, response.files);
                    
                    // แสดงข้อความสำเร็จ
                    showNotification(container, 'success', 'บันทึกข้อมูลเรียบร้อยแล้ว');
                    
                    // ปิด Modal
                    modal.removeClass('open');
                    $('body').removeClass('egp-modal-open');
                } else {
                    // แสดงข้อความผิดพลาด
                    showNotification(container, 'error', response.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
                }
            },
            error: (jqXHR, textStatus, errorThrown) => {
                console.error('AJAX Error:', textStatus, errorThrown);
                
                // แสดงข้อมูล debug
                debugInfo.html(`<pre style="font-size: 12px; color: #f00;">${textStatus}: ${errorThrown}</pre>`).show();
                
                // แสดงข้อความผิดพลาด
                showNotification(container, 'error', 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
            },
            complete: () => {
                // คืนค่าปุ่ม
                submitBtn.prop('disabled', false).text('บันทึก');
            }
        });
    });
    
    // ลบไฟล์
    $('.egp-file-container').on('click', '.egp-delete-file-btn', function() {
        const button = $(this);
        const container = button.closest('.egp-file-container');
        const fileIndex = button.data('index');
        const postId = container.data('post-id');
        
        // ถามยืนยันก่อนลบ
        if (!confirm('คุณต้องการลบไฟล์นี้ใช่หรือไม่?')) {
            return;
        }
        
        // เปลี่ยนสถานะปุ่ม
        button.prop('disabled', true);
        
        // ส่งข้อมูลไปยัง AJAX
        $.ajax({
            url: egp_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'egp_delete_file',
                nonce: egp_ajax.nonce,
                post_id: postId,
                file_index: fileIndex
            },
            success: (response) => {
                console.log('Delete Response:', response);
                
                if (response.success) {
                    // อัปเดตตาราง
                    updateFileTable(container, response.files);
                    
                    // แสดงข้อความสำเร็จ
                    showNotification(container, 'success', 'ลบข้อมูลเรียบร้อยแล้ว');
                } else {
                    // แสดงข้อความผิดพลาด
                    showNotification(container, 'error', response.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
                    
                    // คืนค่าปุ่ม
                    button.prop('disabled', false);
                }
            },
            error: (jqXHR, textStatus, errorThrown) => {
                console.error('Delete Error:', textStatus, errorThrown);
                
                // แสดงข้อความผิดพลาด
                showNotification(container, 'error', 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
                
                // คืนค่าปุ่ม
                button.prop('disabled', false);
            }
        });
    });
    
    // ============= ฟังก์ชันช่วยเหลือ =============
    
    // ฟังก์ชันรีเซ็ตฟอร์ม
    const resetFileForm = (modal) => {
        const form = modal.find('form');
        
        // ตรวจสอบว่าพบฟอร์มหรือไม่
        if (form.length > 0) {
            // ใช้ jQuery trigger reset แทนการเรียก .reset() โดยตรง
            form.trigger('reset');
            
            // รีเซ็ตค่าที่ต้องการกำหนดเอง
            form.find('input[name="file_index"]').val('-1');
            form.find('input[name="file_date"]').val(egp_ajax.current_date);
            form.find('input[name="file_url"]').val('');
            form.find('input[name="upload_type"]').val('direct');
            
            // ล้างข้อมูลแสดงผล
            modal.find('.egp-file-preview').empty();
            modal.find('.egp-file-name-display').empty();
            modal.find('.egp-debug-info').empty().hide();
            
            // เปลี่ยนไปที่ tab อัพโหลดโดยตรง
            modal.find('.egp-tab-btn[data-tab="upload"]').click();
        } else {
            console.error('Form not found in modal');
        }
    };
    
    // ฟังก์ชันตรวจสอบว่าเป็นไฟล์รูปภาพหรือไม่
    const isImageFile = (url) => {
        if (!url) return false;
        const ext = url.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'svg'].indexOf(ext) !== -1;
    };
    
    // ฟังก์ชันรับ class ของไอคอนตามประเภทไฟล์
    const getFileIconClass = (fileExt) => {
        let iconClass = 'dashicons-media-default';
        
        switch (fileExt) {
            case 'pdf':
                iconClass = 'dashicons-pdf';
                break;
            case 'doc':
            case 'docx':
                iconClass = 'dashicons-media-document';
                break;
            case 'xls':
            case 'xlsx':
                iconClass = 'dashicons-spreadsheet';
                break;
            case 'ppt':
            case 'pptx':
                iconClass = 'dashicons-slides';
                break;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'svg':
                iconClass = 'dashicons-format-image';
                break;
            case 'zip':
            case 'rar':
            case '7z':
                iconClass = 'dashicons-archive';
                break;
        }
        
        return iconClass;
    };
    
    // ฟังก์ชันอัปเดตตาราง
    const updateFileTable = (container, files) => {
        const tbody = container.find('.egp-file-table tbody');
        const canEdit = container.find('.egp-file-manage').length > 0;
        const colSpan = canEdit ? 4 : 3;
        
        // ล้างข้อมูลเดิม
        tbody.empty();
        
        // แสดงข้อมูลใหม่
        if (files && files.length > 0) {
            files.forEach((file, index) => {
                if (file.egp_rp_name && file.egp_rp_date && file.egp_rp_link) {
                    // เข้ารหัส URL
                    const encodedUrl = btoa(file.egp_rp_link);
                    const downloadUrl = `?egp_download=${encodedUrl}`;
                    
                    // สร้างแถวใหม่
                    const newRow = $(`<tr data-index="${index}">`);
                    
                    // สร้างเซลล์ชื่อไฟล์
                    const nameCell = $('<td class="egp-file-name">');
                    const fileExt = file.egp_rp_link.split('.').pop().toLowerCase();
                    const iconClass = getFileIconClass(fileExt);
                    nameCell.append(`<span class="egp-file-icon"><span class="dashicons ${iconClass}"></span></span>`);
                    nameCell.append(file.egp_rp_name);
                    newRow.append(nameCell);
                    
                    // สร้างเซลล์วันที่
                    newRow.append(`<td class="egp-file-date">${file.egp_rp_date}</td>`);
                    
                    // สร้างเซลล์ปุ่มดาวน์โหลด
                    const actionCell = $('<td class="egp-file-action">');
                    actionCell.append(`
                        <a href="${downloadUrl}" class="egp-download-button">
                            <span class="dashicons dashicons-download"></span>
                            <span class="egp-btn-text">ดาวน์โหลด</span>
                        </a>
                    `);
                    newRow.append(actionCell);
                    
                    // สร้างเซลล์จัดการ (ถ้ามีสิทธิ์)
                    if (canEdit) {
                        const manageCell = $('<td class="egp-file-manage">');
                        manageCell.append(`
                            <button type="button" class="egp-edit-file-btn" 
                                data-index="${index}" 
                                data-name="${file.egp_rp_name}" 
                                data-date="${file.egp_rp_date}" 
                                data-url="${file.egp_rp_link}">
                                <span class="dashicons dashicons-edit"></span>
                            </button>
                        `);
                        manageCell.append(`
                            <button type="button" class="egp-delete-file-btn" 
                                data-index="${index}">
                                <span class="dashicons dashicons-trash"></span>
                            </button>
                        `);
                        newRow.append(manageCell);
                    }
                    
                    // เพิ่มแถวใหม่ลงในตาราง
                    tbody.append(newRow);
                }
            });
        } else {
            // แสดงข้อความว่าไม่มีข้อมูล
            tbody.append(`
                <tr class="egp-no-files-row">
                    <td colspan="${colSpan}" class="egp-no-files">
                        <div class="egp-empty-state">
                            <span class="dashicons dashicons-media-document"></span>
                            <p>ไม่พบไฟล์เอกสาร</p>
                        </div>
                    </td>
                </tr>
            `);
        }
        
        // หาก container มีช่องค้นหา ให้ตรวจสอบว่าควรแสดงหรือไม่
        const searchBox = container.find('.egp-search-container');
        if (searchBox.length > 0) {
            if (files && files.length > 5) {
                searchBox.show();
            } else {
                searchBox.hide();
            }
        } else if (files && files.length > 5) {
            // หากยังไม่มีช่องค้นหา แต่มีข้อมูลมากกว่า 5 รายการ ให้เพิ่มช่องค้นหา
            const newSearchBox = $(`
                <div class="egp-search-container">
                    <div class="egp-search-wrapper">
                        <input type="text" class="egp-search-input" placeholder="ค้นหาเอกสาร...">
                        <span class="egp-search-icon dashicons dashicons-search"></span>
                    </div>
                </div>
            `);
            container.find('.egp-file-header').after(newSearchBox);
        }
    };
    
    // ฟังก์ชันแสดงข้อความแจ้งเตือน
    const showNotification = (container, type, message) => {
        // ลบข้อความเดิม
        container.find('.egp-notification').remove();
        
        // สร้างข้อความใหม่
        const icon = type === 'success' ? 'yes' : 'warning';
        const notification = $(`
            <div class="egp-notification egp-${type}">
                <span class="egp-notification-icon dashicons dashicons-${icon}"></span>
                <span class="egp-notification-message">${message}</span>
            </div>
        `);
        
        // แสดงข้อความ
        container.prepend(notification);
        
        // ซ่อนข้อความหลังจาก 3 วินาที
        setTimeout(() => {
            notification.fadeOut(300, function() {
                $(this).remove();
            });
        }, 3000);
    };
});
