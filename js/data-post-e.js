/**
 * Data Post E JavaScript
 */
jQuery(document).ready(function($) {
    // ตัวแปร global สำหรับ editor
    let wpEditor;
    
    // เปิด Modal เมื่อคลิกที่ Icon ดินสอ
    $('.data-post-e-icon').on('click', function(e) {
        e.preventDefault();
        const postId = $(this).data('post-id');
        $('#data-post-e-modal-' + postId).fadeIn(300);
        $('body').addClass('modal-open');
        
        // เริ่มต้น WYSIWYG editor
        initWysiwygEditor();
    });
    
    // ฟังก์ชันเริ่มต้น WYSIWYG Editor
    function initWysiwygEditor() {
        // ตรวจสอบว่ามี WordPress Editor (wp.editor) หรือไม่
        if (typeof wp !== 'undefined' && typeof wp.editor !== 'undefined') {
            // ตรวจสอบว่ามี editor อยู่แล้วหรือไม่
            if (wpEditor) {
                // ถ้ามีอยู่แล้ว ไม่ต้องเริ่มต้นใหม่
                return;
            }
            
            // กำหนดค่าเริ่มต้นสำหรับ editor
            const editorSettings = {
                tinymce: {
                    wpautop: true,
                    plugins: 'charmap colorpicker compat3x directionality fullscreen hr image lists media paste tabfocus textcolor wordpress wpautoresize wpdialogs wpeditimage wpemoji wpgallery wplink wptextpattern wpview',
                    toolbar1: 'formatselect,bold,italic,bullist,numlist,blockquote,alignleft,aligncenter,alignright,link,wp_more,spellchecker,fullscreen,wp_adv',
                    toolbar2: 'strikethrough,hr,forecolor,pastetext,removeformat,charmap,outdent,indent,undo,redo,wp_help',
                    height: 300
                },
                quicktags: true,
                mediaButtons: true
            };
            
            // เริ่มต้น editor
            wpEditor = wp.editor.initialize('at_content', editorSettings);
            
            // เก็บค่าเนื้อหาเริ่มต้นไว้สำหรับการเปรียบเทียบ
            const originalContent = $('#at_content').val();
            $('#at_content').data('original-content', originalContent);
        }
    }
    
    // ฟังก์ชันยกเลิก WYSIWYG Editor
    function removeWysiwygEditor() {
        if (typeof wp !== 'undefined' && typeof wp.editor !== 'undefined' && wpEditor) {
            wp.editor.remove('at_content');
            wpEditor = null;
        }
    }
    
    // ปิด Modal เมื่อคลิกที่ปุ่มปิดหรือพื้นที่นอก Modal
    $('.data-post-e-close, .cancel-btn').on('click', function() {
        closeModal();
    });
    
    $(window).on('click', function(e) {
        if ($(e.target).hasClass('data-post-e-modal')) {
            closeModal();
        }
        if ($(e.target).hasClass('notification-modal')) {
            closeNotificationModal();
        }
        if ($(e.target).hasClass('delete-confirm-modal')) {
            closeDeleteConfirmModal();
        }
    });
    
    // ฟังก์ชันปิด Modal
    function closeModal() {
        $('.data-post-e-modal').fadeOut(300);
        $('body').removeClass('modal-open');
        removeWysiwygEditor();
    }
    
    // ฟังก์ชันปิด Notification Modal
    function closeNotificationModal() {
        $('.notification-modal').fadeOut(300);
        location.reload(); // รีโหลดหน้าเพื่อแสดงสถานะใหม่
    }
    
    // ฟังก์ชันปิด Delete Confirm Modal
    function closeDeleteConfirmModal() {
        $('.delete-confirm-modal').fadeOut(300);
    }
    
    // เมื่อคลิกปุ่มยืนยันใน notification modal
    $('.notification-confirm-btn').on('click', function() {
        closeNotificationModal();
    });
    
    // เพิ่ม Row ใหม่ใน Repeater
    $('#add-row-btn').on('click', function() {
        const repeater = $('#at_file_standard_repeater');
        const index = repeater.children('.repeater-row').length;
        const currentDate = getCurrentDate();
        
        const newRow = `
            <div class="repeater-row">
                <div class="repeater-field">
                    <label>ชื่อไฟล์:</label>
                    <input type="text" name="at_file_standard[${index}][at_rp_file_name]" value="">
                </div>
                <div class="repeater-field">
                    <label>วันที่นำเข้า:</label>
                    <input type="text" name="at_file_standard[${index}][at_rp_file_create]" value="${currentDate}">
                </div>
                <div class="repeater-field file-actions">
                    <input type="hidden" name="at_file_standard[${index}][at_rp_file_link]" class="file-link-input" value="">
                    <a href="#" class="download-file-btn" target="_blank" style="display:none;">ดาวน์โหลดไฟล์</a>
                    <button type="button" class="upload-new-file-btn">อัพโหลดไฟล์ใหม่</button>
                    <button type="button" class="link-file-btn">ลิงค์</button>
                    <button type="button" class="remove-row-btn">ลบ</button>
                </div>
                <div class="repeater-field url-field" style="display:none;">
                    <label>URL:</label>
                    <input type="text" name="at_file_standard[${index}][at_rp_file_url]" class="manual-url-input" value="">
                </div>
            </div>
        `;
        
        repeater.append(newRow);
        reindexRepeaterFields();
    });
    
    // ลบ Row ใน Repeater
    $(document).on('click', '.remove-row-btn', function() {
        const repeater = $('#at_file_standard_repeater');
        const rows = repeater.children('.repeater-row');
        
        // ถ้ามีแถวเดียว ให้คงไว้แต่เคลียร์ค่า
        if (rows.length === 1) {
            $(this).closest('.repeater-row').find('input[type="text"]').val('');
            $(this).closest('.repeater-row').find('.file-link-input').val('');
            $(this).closest('.repeater-row').find('.download-file-btn').attr('href', '#').hide();
            $(this).closest('.repeater-row').find('.url-field').hide();
        } else {
            $(this).closest('.repeater-row').remove();
            reindexRepeaterFields();
        }
    });
    
    // จัดการการอัพโหลดไฟล์
    $(document).on('click', '.upload-new-file-btn', function() {
        const button = $(this);
        const row = button.closest('.repeater-row');
        const fileInput = row.find('.file-link-input');
        const downloadBtn = row.find('.download-file-btn');
        const fileNameInput = row.find('input[name*="[at_rp_file_name]"]');
        const manualUrlInput = row.find('.manual-url-input'); // อัพเดต input URL ด้วย
        
        const mediaUploader = wp.media({
            title: 'เลือกหรืออัพโหลดไฟล์',
            button: {
                text: 'เลือกไฟล์นี้'
            },
            multiple: false
        });
        
        mediaUploader.on('select', function() {
            const attachment = mediaUploader.state().get('selection').first().toJSON();
            
            // อัพเดต URL ไฟล์
            fileInput.val(attachment.url);
            downloadBtn.attr('href', attachment.url).show();
            manualUrlInput.val(attachment.url); // อัพเดต input URL ด้วย
            
            // อัพเดตชื่อไฟล์ถ้าว่างอยู่
            if (fileNameInput.val() === '') {
                fileNameInput.val(attachment.filename);
            }
        });
        
        mediaUploader.open();
    });
    
    // เพิ่ม event handler สำหรับปุ่ม "ลิงค์"
    $(document).on('click', '.link-file-btn', function() {
        const row = $(this).closest('.repeater-row');
        const urlField = row.find('.url-field');
        
        // สลับการแสดง/ซ่อน field URL
        if (urlField.is(':visible')) {
            urlField.slideUp(200);
        } else {
            urlField.slideDown(200);
        }
    });
    
    // เพิ่ม event handler สำหรับการอัพเดตค่า URL จาก manual input
    $(document).on('change', '.manual-url-input', function() {
        const row = $(this).closest('.repeater-row');
        const fileLink = row.find('.file-link-input');
        const downloadBtn = row.find('.download-file-btn');
        const url = $(this).val();
        
        // อัพเดต hidden input และปุ่มดาวน์โหลด
        fileLink.val(url);
        if (url) {
            downloadBtn.attr('href', url).show();
        } else {
            downloadBtn.attr('href', '#').hide();
        }
    });
    
    // ฟังก์ชันคลิกปุ่มลบโพส
    $('.delete-post-btn').on('click', function() {
        const postId = $(this).closest('form').find('input[name="post_id"]').val();
        $('#delete-confirm-modal-' + postId).fadeIn(300);
    });
    
    // ยกเลิกการลบโพส
    $('.cancel-delete-btn').on('click', function() {
        closeDeleteConfirmModal();
    });
    
    // ยืนยันการลบโพส
    $('.confirm-delete-btn').on('click', function() {
        const postId = $(this).closest('.delete-confirm-modal').attr('id').replace('delete-confirm-modal-', '');
        
        // ส่งคำขอลบโพสไปยัง AJAX
        $.ajax({
            type: 'POST',
            url: data_post_e_vars.ajax_url,
            data: {
                action: 'data_post_e_delete',
                post_id: postId,
                nonce: data_post_e_vars.nonce
            },
            beforeSend: function() {
                $(this).text('กำลังลบ...').prop('disabled', true);
            },
            success: function(response) {
                if (response.success) {
                    showNotification('ลบโพสเรียบร้อยแล้ว', 'success');
                    
                    // เปลี่ยนหน้าไปยัง URL ที่กำหนดหลังจาก 2 วินาที
                    setTimeout(function() {
                        window.location.href = response.data.redirect;
                    }, 2000);
                } else {
                    closeDeleteConfirmModal();
                    showNotification(response.data.message, 'error');
                }
            },
            error: function() {
                closeDeleteConfirmModal();
                showNotification('เกิดข้อผิดพลาดในการลบโพส', 'error');
            }
        });
    });
    
    // สร้างฟังก์ชันช่วยไฮไลท์ข้อความที่มีการเปลี่ยนแปลง
    function highlightChanges(oldContent, newContent) {
        // ทำการไฮไลท์การเปลี่ยนแปลงแบบง่ายโดยการแทรก span
        // ต้องระวังเรื่อง HTML โดยการทำงานกับ HTML Entities ให้ถูกต้อง
        
        // ถ้าค่าเดิมเป็นค่าว่าง ไม่ต้องไฮไลท์
        if (oldContent === '') {
            return newContent;
        }
        
        // คำนวณความแตกต่างแบบง่าย (สำหรับในกรณีนี้เราจะใช้การเปรียบเทียบทั้งหมด)
        // หากเหมือนกันไม่ต้องไฮไลท์
        if (oldContent === newContent) {
            return newContent;
        }
        
        // ในกรณีที่มีการเปลี่ยนแปลง เราจะไฮไลท์ทั้งหมด
        // ในสถานการณ์จริงควรใช้ diff algorithm ที่ซับซ้อนกว่านี้
        return '<span class="highlight-change">' + newContent + '</span>';
    }
    
    // บันทึกข้อมูลด้วย AJAX
    $('.data-post-e-form').on('submit', function(e) {
        e.preventDefault();
        
        const form = $(this);
        const submitBtn = form.find('.save-post-btn');
        const postId = form.find('input[name="post_id"]').val();
        
        // อัพเดตข้อมูลจาก TinyMCE ไปยัง textarea
        if (typeof tinyMCE !== 'undefined' && tinyMCE.get('at_content')) {
            tinyMCE.get('at_content').save();
        }
        
        // แสดงสถานะกำลังบันทึก
        submitBtn.prop('disabled', true).text('กำลังบันทึก...');
        
        // เก็บข้อมูลเนื้อหาที่แก้ไข
        const contentTextarea = form.find('#at_content');
        const newContent = contentTextarea.val();
        const originalContent = contentTextarea.data('original-content');
        
        // ไฮไลท์การเปลี่ยนแปลงถ้ามีการแก้ไข
        if (originalContent !== newContent) {
            const highlightedContent = highlightChanges(originalContent, newContent);
            contentTextarea.val(highlightedContent);
        }
        
        // เก็บข้อมูลฟอร์ม
        const formData = form.serializeArray();
        formData.push({
            name: 'action',
            value: 'data_post_e_save'
        });
        formData.push({
            name: 'nonce',
            value: data_post_e_vars.nonce
        });
        
        // ส่งข้อมูลไปยัง AJAX
        $.ajax({
            type: 'POST',
            url: data_post_e_vars.ajax_url,
            data: formData,
            success: function(response) {
                if (response.success) {
                    // ปิด Modal แก้ไข
                    closeModal();
                    
                    // แสดง Notification Modal
                    $('#notification-modal-' + postId).fadeIn(300);
                } else {
                    // แสดงข้อความผิดพลาด
                    showNotification(response.data.message, 'error');
                    submitBtn.prop('disabled', false).text('บันทึกข้อมูล');
                }
            },
            error: function() {
                showNotification('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
                submitBtn.prop('disabled', false).text('บันทึกข้อมูล');
            }
        });
    });
    
    // ฟังก์ชันสำหรับจัดลำดับ Repeater
    function reindexRepeaterFields() {
        $('#at_file_standard_repeater .repeater-row').each(function(index) {
            $(this).find('input, select').each(function() {
                const name = $(this).attr('name');
                if (name) {
                    const newName = name.replace(/\[\d+\]/, '[' + index + ']');
                    $(this).attr('name', newName);
                }
            });
        });
    }
    
    // ฟังก์ชันแสดงการแจ้งเตือน
    function showNotification(message, type) {
        const notification = $('<div class="data-post-e-notification ' + type + '">' + message + '</div>');
        $('body').append(notification);
        
        notification.fadeIn(300);
        
        setTimeout(function() {
            notification.fadeOut(300, function() {
                $(this).remove();
            });
        }, 3000);
    }
    
    // ฟังก์ชันรับวันที่ปัจจุบัน
    function getCurrentDate() {
        const date = new Date();
        let day = date.getDate();
        let month = date.getMonth() + 1;
        const year = date.getFullYear();
        
        day = day < 10 ? '0' + day : day;
        month = month < 10 ? '0' + month : month;
        
        return day + '/' + month + '/' + year;
    }
});
