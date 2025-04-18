jQuery(document).ready(function($) {
    console.log('EGP File Download JS loaded');
    
    // ============= ส่วนของการจัดการตาราง =============
    
    // เพิ่มช่องค้นหาถ้ามีรายการเอกสารมากกว่า 5 รายการ
    $('.egp-file-container').each(function() {
        var container = $(this);
        if (container.find('.egp-file-table tbody tr').not('.egp-no-files-row').length > 5) {
            var searchBox = $('<div class="egp-search-container"><div class="egp-search-wrapper"><input type="text" class="egp-search-input" placeholder="ค้นหาเอกสาร..."><span class="egp-search-icon dashicons dashicons-search"></span></div></div>');
            container.find('.egp-file-header').after(searchBox);
            
            // ฟังก์ชันค้นหา
            container.find('.egp-search-input').on('keyup', function() {
                var value = $(this).val().toLowerCase();
                container.find('.egp-file-table tbody tr').not('.egp-no-files-row').filter(function() {
                    $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
                });
                
                // แสดงข้อความเมื่อไม่พบข้อมูล
                var visibleRows = container.find('.egp-file-table tbody tr:visible').not('.egp-no-files-row, .egp-no-search-results').length;
                if (visibleRows === 0) {
                    if (container.find('.egp-no-search-results').length === 0) {
                        var colSpan = container.find('.egp-file-table thead th').length;
                        container.find('.egp-file-table tbody').append('<tr class="egp-no-search-results"><td colspan="' + colSpan + '"><div class="egp-empty-search"><span class="dashicons dashicons-search"></span><p>ไม่พบเอกสารที่ค้นหา</p></div></td></tr>');
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
        var $this = $(this);
        var tab = $this.data('tab');
        var $tabContainer = $this.closest('.egp-upload-tabs');
        
        // เปลี่ยน active tab
        $tabContainer.find('.egp-tab-btn').removeClass('active');
        $this.addClass('active');
        
        // เปลี่ยน active content
        $tabContainer.find('.egp-tab-content').removeClass('active');
        $tabContainer.find('.egp-tab-content[data-tab="' + tab + '"]').addClass('active');
        
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
        var fileName = '';
        var $fileNameDisplay = $(this).closest('.egp-file-drop-area').siblings('.egp-file-name-display');
        
        if (this.files && this.files.length > 0) {
            fileName = this.files[0].name;
            
            // แสดงชื่อไฟล์และไอคอนตามประเภทไฟล์
            var fileExt = fileName.split('.').pop().toLowerCase();
            var iconClass = getFileIconClass(fileExt);
            
            $fileNameDisplay.html('<div class="egp-selected-file"><span class="dashicons ' + iconClass + '"></span><span class="egp-file-name-text">' + fileName + '</span></div>');
            
            // ตั้งชื่อไฟล์อัตโนมัติถ้ายังไม่ได้กรอก
            var form = $(this).closest('form');
            var nameField = form.find('input[name="file_name"]');
            if (!nameField.val()) {
                // ใช้ชื่อไฟล์โดยไม่มีนามสกุล
                var fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
                nameField.val(fileNameWithoutExt);
            }
        } else {
            $fileNameDisplay.empty();
        }
    });
    
    // ลากไฟล์มาวาง
    $('.egp-file-drop-area').each(function() {
        var $dropArea = $(this);
        var $input = $dropArea.find('.egp-file-input');
        var $fileNameDisplay = $dropArea.siblings('.egp-file-name-display');
        
        $dropArea.on('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).addClass('dragging');
        });
        
        $dropArea.on('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).removeClass('dragging');
        });
        
        $dropArea.on('drop', function(e) {
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
        var container = $(this).closest('.egp-file-container');
        var uniqueId = container.attr('id');
        
        // ค้นหา modal ที่มี ID ที่ถูกต้อง
        var modal = $('#egp-file-modal-' + uniqueId.split('-').pop());
        
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
        var container = $(this).closest('.egp-file-container');
        var uniqueId = container.attr('id');
        
        // ค้นหา modal ที่มี ID ที่ถูกต้อง
        var modal = $('#egp-file-modal-' + uniqueId.split('-').pop());
        
        var fileIndex = $(this).data('index');
        var fileName = $(this).data('name');
        var fileDate = $(this).data('date');
        var fileUrl = $(this).data('url');
        
        // กรอกข้อมูลเดิมลงในฟอร์ม
        modal.find('input[name="file_index"]').val(fileIndex);
        modal.find('input[name="file_name"]').val(fileName);
        modal.find('input[name="file_date"]').val(fileDate);
        modal.find('input[name="file_url"]').val(fileUrl);
        
        // เปลี่ยนไปใช้ tab media และกำหนดค่า URL
        modal.find('.egp-tab-btn[data-tab="media"]').click();
        
        // แสดงตัวอย่างไฟล์
        var filePreview = modal.find('.egp-file-preview');
        filePreview.empty();
        
        if (isImageFile(fileUrl)) {
            filePreview.html('<img src="' + fileUrl + '" alt="' + fileName + '">');
        } else {
            var fileExt = fileUrl.split('.').pop().toLowerCase();
            filePreview.html('<div class="egp-file-icon-preview"><span class="dashicons ' + getFileIconClass(fileExt) + '"></span><span class="egp-file-ext">' + fileExt + '</span></div>');
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
        var button = $(this);
        var modal = button.closest('.egp-modal');
        var form = modal.find('form');
        var filePreview = modal.find('.egp-file-preview');
        
        // เปิด Media Library
        var mediaUploader = wp.media({
            title: 'เลือกไฟล์',
            button: {
                text: 'เลือกไฟล์นี้'
            },
            multiple: false
        });
        
        // เมื่อเลือกไฟล์แล้ว
        mediaUploader.on('select', function() {
            var attachment = mediaUploader.state().get('selection').first().toJSON();
            form.find('input[name="file_url"]').val(attachment.url);
            
            // ตั้งชื่อไฟล์อัตโนมัติถ้ายังไม่ได้กรอก
            var fileName = form.find('input[name="file_name"]').val();
            if (!fileName) {
                form.find('input[name="file_name"]').val(attachment.title);
            }
            
            // แสดงตัวอย่างไฟล์
            filePreview.empty();
            
            if (isImageFile(attachment.url)) {
                filePreview.html('<img src="' + attachment.url + '" alt="' + attachment.title + '">');
            } else {
                var fileExt = attachment.url.split('.').pop().toLowerCase();
                filePreview.html('<div class="egp-file-icon-preview"><span class="dashicons ' + getFileIconClass(fileExt) + '"></span><span class="egp-file-ext">' + fileExt + '</span></div>');
            }
        });
        
        mediaUploader.open();
    });
    
    // บันทึกไฟล์
    $(document).on('submit', '.egp-file-form', function(e) {
        e.preventDefault();
        
        var form = $(this);
        var formId = form.attr('id');
        var uniqueId = formId.split('-').pop();
        var container = $('.egp-file-container[id$="' + uniqueId + '"]');
        var modal = form.closest('.egp-modal');
        var submitBtn = form.find('.egp-save-btn');
        var uploadType = form.find('input[name="upload_type"]').val();
        var debugInfo = modal.find('.egp-debug-info');
        
        // ตรวจสอบความถูกต้องของข้อมูล
        if (uploadType === 'direct') {
            var fileInput = form.find('input[name="file_upload"]');
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
        var formData = new FormData(form[0]);
        
        // ส่งข้อมูลไปยัง AJAX
        $.ajax({
            url: egp_ajax.ajax_url,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                console.log('AJAX Response:', response);
                
                // แสดงข้อมูล debug (เฉพาะเมื่อมีปัญหา)
                if (!response.success) {
                    debugInfo.html('<pre style="font-size: 12px; color: #f00;">' + JSON.stringify(response.debug, null, 2) + '</pre>').show();
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
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('AJAX Error:', textStatus, errorThrown);
                
                // แสดงข้อมูล debug
                debugInfo.html('<pre style="font-size: 12px; color: #f00;">' + textStatus + ': ' + errorThrown + '</pre>').show();
                
                // แสดงข้อความผิดพลาด
                showNotification(container, 'error', 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
            },
            complete: function() {
                // คืนค่าปุ่ม
                submitBtn.prop('disabled', false).text('บันทึก');
            }
        });
    });
    
    // ลบไฟล์
    $('.egp-file-container').on('click', '.egp-delete-file-btn', function() {
        var button = $(this);
        var container = button.closest('.egp-file-container');
        var fileIndex = button.data('index');
        var postId = container.data('post-id');
        
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
            success: function(response) {
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
            error: function(jqXHR, textStatus, errorThrown) {
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
    function resetFileForm(modal) {
        var form = modal.find('form');
        
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
    }
    
    // ฟังก์ชันตรวจสอบว่าเป็นไฟล์รูปภาพหรือไม่
    function isImageFile(url) {
        if (!url) return false;
        var ext = url.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'svg'].indexOf(ext) !== -1;
    }
    
    // ฟังก์ชันรับ class ของไอคอนตามประเภทไฟล์
    function getFileIconClass(fileExt) {
        var iconClass = 'dashicons-media-default';
        
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
    }
    
    // ฟังก์ชันอัปเดตตาราง
    function updateFileTable(container, files) {
        var tbody = container.find('.egp-file-table tbody');
        var canEdit = container.find('.egp-file-manage').length > 0;
        var colSpan = canEdit ? 4 : 3;
        
        // ล้างข้อมูลเดิม
        tbody.empty();
        
        // แสดงข้อมูลใหม่
        if (files && files.length > 0) {
            $.each(files, function(index, file) {
                if (file.egp_rp_name && file.egp_rp_date && file.egp_rp_link) {
                    // เข้ารหัส URL
                    var encodedUrl = btoa(file.egp_rp_link);
                    var downloadUrl = '?egp_download=' + encodedUrl;
                    
                    // สร้างแถวใหม่
                    var newRow = $('<tr data-index="' + index + '">');
                    
                    // สร้างเซลล์ชื่อไฟล์
                    var nameCell = $('<td class="egp-file-name">');
                    var fileExt = file.egp_rp_link.split('.').pop().toLowerCase();
                    var iconClass = getFileIconClass(fileExt);
                    nameCell.append('<span class="egp-file-icon"><span class="dashicons ' + iconClass + '"></span></span>');
                    nameCell.append(file.egp_rp_name);
                    newRow.append(nameCell);
                    
                    // สร้างเซลล์วันที่
                    newRow.append('<td class="egp-file-date">' + file.egp_rp_date + '</td>');
                    
                    // สร้างเซลล์ปุ่มดาวน์โหลด
                    var actionCell = $('<td class="egp-file-action">');
                    actionCell.append('<a href="' + downloadUrl + '" class="egp-download-button"><span class="dashicons dashicons-download"></span><span class="egp-btn-text">ดาวน์โหลด</span></a>');
                    newRow.append(actionCell);
                    
                    // สร้างเซลล์จัดการ (ถ้ามีสิทธิ์)
                    if (canEdit) {
                        var manageCell = $('<td class="egp-file-manage">');
                        manageCell.append('<button type="button" class="egp-edit-file-btn" data-index="' + index + '" data-name="' + file.egp_rp_name + '" data-date="' + file.egp_rp_date + '" data-url="' + file.egp_rp_link + '"><span class="dashicons dashicons-edit"></span></button>');
                        manageCell.append('<button type="button" class="egp-delete-file-btn" data-index="' + index + '"><span class="dashicons dashicons-trash"></span></button>');
                        newRow.append(manageCell);
                    }
                    
                    // เพิ่มแถวใหม่ลงในตาราง
                    tbody.append(newRow);
                }
            });
        } else {
            // แสดงข้อความว่าไม่มีข้อมูล
            tbody.append('<tr class="egp-no-files-row"><td colspan="' + colSpan + '" class="egp-no-files"><div class="egp-empty-state"><span class="dashicons dashicons-media-document"></span><p>ไม่พบไฟล์เอกสาร</p></div></td></tr>');
        }
        
        // หาก container มีช่องค้นหา ให้ตรวจสอบว่าควรแสดงหรือไม่
        var searchBox = container.find('.egp-search-container');
        if (searchBox.length > 0) {
            if (files && files.length > 5) {
                searchBox.show();
            } else {
                searchBox.hide();
            }
        } else if (files && files.length > 5) {
            // หากยังไม่มีช่องค้นหา แต่มีข้อมูลมากกว่า 5 รายการ ให้เพิ่มช่องค้นหา
            var newSearchBox = $('<div class="egp-search-container"><div class="egp-search-wrapper"><input type="text" class="egp-search-input" placeholder="ค้นหาเอกสาร..."><span class="egp-search-icon dashicons dashicons-search"></span></div></div>');
            container.find('.egp-file-header').after(newSearchBox);
        }
    }
    
    // ฟังก์ชันแสดงข้อความแจ้งเตือน
    function showNotification(container, type, message) {
        // ลบข้อความเดิม
        container.find('.egp-notification').remove();
        
        // สร้างข้อความใหม่
        var notification = $('<div class="egp-notification egp-' + type + '"><span class="egp-notification-icon dashicons dashicons-' + (type === 'success' ? 'yes' : 'warning') + '"></span><span class="egp-notification-message">' + message + '</span></div>');
        
        // แสดงข้อความ
        container.prepend(notification);
        
        // ซ่อนข้อความหลังจาก 3 วินาที
        setTimeout(function() {
            notification.fadeOut(300, function() {
                $(this).remove();
            });
        }, 3000);
    }
});