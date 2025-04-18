/**
 * JavaScript สำหรับ CSV/Excel Post Importer
 * 
 * ใช้สำหรับจัดการการทำงานของ AJAX และอินเตอร์เฟซผู้ใช้
 */

(function($) {
    'use strict';
    
    $(document).ready(function() {
        // สร้าง Progress Bar
        $('#import-progress-bar').progressbar({ value: 0 });
        
        // จัดการเปลี่ยนแปลงของไฟล์อินพุต
        $('#import-file').on('change', function() {
            var fileName = $(this).val().split('\\').pop();
            if (fileName) {
                $('.file-upload-info').text('ไฟล์ที่เลือก: ' + fileName);
                $('.file-upload-container').addClass('has-file');
            } else {
                $('.file-upload-info').text('รองรับไฟล์ CSV และ Excel (.xlsx, .xls)');
                $('.file-upload-container').removeClass('has-file');
            }
        });
        
        // จัดการปุ่มดาวน์โหลดแม่แบบ
        $('#download-csv-template').on('click', function(e) {
            e.preventDefault();
            downloadTemplate('csv');
        });
        
        $('#download-excel-template').on('click', function(e) {
            e.preventDefault();
            downloadTemplate('excel');
        });
        
        function downloadTemplate(type) {
            window.location.href = csvImporterVars.ajax_url + '?action=download_template&type=' + type + '&nonce=' + csvImporterVars.nonce;
        }
        
        // จัดการการส่งฟอร์ม
        $('#submit-import').on('click', function(e) {
            e.preventDefault();
            
            // ตรวจสอบฟอร์ม
            var fileInput = $('#import-file');
            var postTypes = $('input[name="post_types[]"]:checked');
            var fileExtension = fileInput.val().split('.').pop().toLowerCase();
            
            if (fileInput.val() === '') {
                showNotification('กรุณาเลือกไฟล์ที่ต้องการนำเข้า', 'error');
                return;
            }
            
            if (postTypes.length === 0) {
                showNotification('กรุณาเลือกประเภทโพสอย่างน้อย 1 ประเภท', 'error');
                return;
            }
            
            // แสดงส่วนแสดงความคืบหน้า
            $('.import-progress-section').fadeIn();
            $('.importer-form-section').fadeOut();
            
            // รีเซ็ตตัวนับ
            $('#processed-count').text('0');
            $('#success-count').text('0');
            $('#error-count').text('0');
            $('#import-progress-bar').progressbar('value', 0);
            
            // สร้าง FormData object
            var formData = new FormData();
            formData.append('action', 'process_import_file');
            formData.append('nonce', csvImporterVars.nonce);
            formData.append('import_file', fileInput[0].files[0]);
            
            // เพิ่มประเภทโพสที่เลือก
            postTypes.each(function() {
                formData.append('post_types[]', $(this).val());
            });
            
            // ส่งคำขอ AJAX
            $.ajax({
                url: csvImporterVars.ajax_url,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                xhr: function() {
                    var xhr = new window.XMLHttpRequest();
                    xhr.upload.addEventListener('progress', function(evt) {
                        if (evt.lengthComputable) {
                            var percentComplete = evt.loaded / evt.total * 100;
                            $('#import-progress-bar').progressbar('value', percentComplete);
                        }
                    }, false);
                    return xhr;
                },
                success: function(response) {
                    if (response.success) {
                        $('#total-count').text(response.data.imported_count);
                        $('#processed-count').text(response.data.imported_count);
                        $('#success-count').text(response.data.imported_count);
                        $('#total-success-count').text(response.data.imported_count);
                        
                        // แสดงผลลัพธ์
                        setTimeout(function() {
                            $('.import-progress-section').fadeOut(function() {
                                $('.import-results-section').fadeIn();
                                
                                // โหลดหน้าแรกของผลลัพธ์
                                loadImportedPosts(1);
                                
                                showNotification('นำเข้าข้อมูลสำเร็จ ' + response.data.imported_count + ' รายการ', 'success');
                            });
                        }, 1000);
                    } else {
                        showNotification('เกิดข้อผิดพลาด: ' + response.data.message, 'error');
                        $('.import-progress-section').fadeOut(function() {
                            $('.importer-form-section').fadeIn();
                        });
                    }
                },
                error: function(xhr, status, error) {
                    showNotification('เกิดข้อผิดพลาดในการส่งข้อมูล: ' + error, 'error');
                    $('.import-progress-section').fadeOut(function() {
                        $('.importer-form-section').fadeIn();
                    });
                }
            });
        });
        
        // ฟังก์ชันโหลดโพสที่นำเข้า
        function loadImportedPosts(page) {
            $.ajax({
                url: csvImporterVars.ajax_url,
                type: 'POST',
                data: {
                    action: 'get_imported_posts',
                    nonce: csvImporterVars.nonce,
                    page: page
                },
                beforeSend: function() {
                    $('#results-table-body').html('<tr><td colspan="5" class="loading-data">กำลังโหลดข้อมูล...</td></tr>');
                },
                success: function(response) {
                    if (response.success) {
                        // สร้างตาราง
                        var tableHtml = '';
                        
                        if (response.data.posts.length === 0) {
                            tableHtml = '<tr><td colspan="5" class="no-data">ไม่พบข้อมูล</td></tr>';
                        } else {
                            $.each(response.data.posts, function(index, post) {
                                tableHtml += '<tr>';
                                tableHtml += '<td>' + post.id + '</td>';
                                tableHtml += '<td>' + post.title + '</td>';
                                tableHtml += '<td>' + post.post_type + '</td>';
                                tableHtml += '<td>' + post.date + '</td>';
                                tableHtml += '<td><a href="' + post.link + '" target="_blank" class="view-post-btn">ดูโพส</a></td>';
                                tableHtml += '</tr>';
                            });
                        }
                        
                        $('#results-table-body').html(tableHtml);
                        
                        // อัปเดตการแบ่งหน้า
                        $('#pagination').html(response.data.pagination);
                        
                        // เพิ่มอีเวนต์คลิกให้กับลิงก์แบ่งหน้า
                        $('.page-num, .page-nav').on('click', function(e) {
                            e.preventDefault();
                            var pageNum = $(this).data('page');
                            loadImportedPosts(pageNum);
                            
                            // เลื่อนไปยังด้านบนของตาราง
                            $('html, body').animate({
                                scrollTop: $('.results-table-container').offset().top - 50
                            }, 300);
                        });
                    } else {
                        showNotification('เกิดข้อผิดพลาด: ' + response.data.message, 'error');
                    }
                },
                error: function(xhr, status, error) {
                    showNotification('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + error, 'error');
                }
            });
        }
        
        // ฟังก์ชันแสดงการแจ้งเตือน
        function showNotification(message, type) {
            // ตรวจสอบว่ามีการแจ้งเตือนอยู่แล้วหรือไม่
            if ($('.importer-notification').length) {
                $('.importer-notification').remove();
            }
            
            // สร้างการแจ้งเตือน
            var notification = $('<div class="importer-notification ' + type + '">' + 
                                '<span class="message">' + message + '</span>' +
                                '<span class="close-notification">&times;</span>' +
                                '</div>');
            
            // เพิ่มการแจ้งเตือนลงใน DOM
            $('.csv-excel-importer-container').prepend(notification);
            
            // แสดงการแจ้งเตือน
            setTimeout(function() {
                notification.addClass('show');
            }, 10);
            
            // ซ่อนการแจ้งเตือนหลังจาก 5 วินาที
            setTimeout(function() {
                notification.removeClass('show');
                setTimeout(function() {
                    notification.remove();
                }, 300);
            }, 5000);
            
            // จัดการปุ่มปิด
            $('.close-notification').on('click', function() {
                $(this).parent().removeClass('show');
                setTimeout(function() {
                    notification.remove();
                }, 300);
            });
        }
    });
})(jQuery);