// /js/file-repository.js
jQuery(document).ready(function($) {
    // Media uploader
    var mediaUploader;
    var canManage = fileRepositoryAjax.canManage === "1" || fileRepositoryAjax.canManage === true;
    var currentPostId = $('#add-file').data('post-id');
    
    // Load files on page load
    loadFileData();
    
    // Add file button click handler - แสดง Modal แทนที่จะเปิด Media Uploader โดยตรง
    $('#add-file').on('click', function(e) {
        e.preventDefault();
        
        if (!canManage) {
            showToast('ไม่มีสิทธิ์ในการจัดการเอกสาร');
            return;
        }
        
        // เคลียร์ฟอร์มและโหลดข้อมูลเดิม
        $('.file-repeater-list').empty();
        loadExistingRepeaterData();
        
        // แสดง Modal
        $('#file-modal').addClass('show');
    });
    
    // ปิด Modal
    $('.file-modal-close, .btn-cancel').on('click', function() {
        $('#file-modal').removeClass('show');
    });
    
    // เพิ่ม Row ใหม่
    $('.btn-add-row').on('click', function(e) {
        e.preventDefault(); // ป้องกันการ submit form
        addRepeaterRow();
    });
    
    // ลบ Row (Event Delegation)
    $(document).on('click', '.btn-remove-row', function(e) {
        e.preventDefault(); // ป้องกันการ submit form
        $(this).closest('.repeater-item').remove();
        updateItemNumbers();
    });
    
    // เลือกไฟล์ (Event Delegation)
    $(document).on('click', '.btn-file-upload', function(e) {
        e.preventDefault(); // ป้องกันการ submit form
        
        var fileUploadBtn = $(this);
        var fileField = fileUploadBtn.siblings('.file-link');
        var nameField = fileUploadBtn.closest('.repeater-item').find('.file-name');
        
        // สร้าง Media Uploader ใหม่ทุกครั้ง
        var tempMediaUploader = wp.media({
            title: 'เลือกเอกสาร',
            button: {
                text: 'เลือกเอกสาร'
            },
            multiple: false
        });
        
        tempMediaUploader.on('select', function() {
            var attachment = tempMediaUploader.state().get('selection').first().toJSON();
            fileField.val(attachment.url);
            
            // อัพเดตชื่อไฟล์ถ้ายังว่างอยู่
            if (nameField.val() === '') {
                nameField.val(attachment.filename);
            }
        });
        
        tempMediaUploader.open();
    });
    
    // บันทึกฟอร์ม
    $('#file-form').on('submit', function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            showToast('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }
        
        saveRepeaterData();
    });
    
    // โหลดข้อมูล Repeater เดิมจาก customfield
    function loadExistingRepeaterData() {
        showLoading();
        
        $.ajax({
            url: fileRepositoryAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'get_existing_files_data',
                nonce: fileRepositoryAjax.nonce,
                post_id: currentPostId
            },
            success: function(response) {
                if (response.success) {
                    // เคลียร์ข้อมูลเดิมก่อน
                    $('.file-repeater-list').empty();
                    
                    if (response.data.length > 0) {
                        // สร้าง Row สำหรับแต่ละเอกสารที่มีอยู่
                        $.each(response.data, function(index, item) {
                            addRepeaterRowWithData(item);
                        });
                    } else {
                        // ถ้าไม่มีข้อมูลเดิม ให้เพิ่ม Row เปล่า 1 อัน
                        addRepeaterRow();
                    }
                    
                    hideLoading();
                } else {
                    showToast('เกิดข้อผิดพลาดในการโหลดข้อมูลเอกสาร');
                    addRepeaterRow(); // เพิ่ม Row เปล่า 1 อัน
                    hideLoading();
                }
            },
            error: function() {
                console.error('Error loading existing repeater data');
                showToast('เกิดข้อผิดพลาดในการโหลดข้อมูลเอกสาร');
                addRepeaterRow(); // เพิ่ม Row เปล่า 1 อัน
                hideLoading();
            }
        });
    }
    
    // เพิ่ม Row ใหม่
    function addRepeaterRow() {
        var template = document.getElementById('repeater-item-template').innerHTML;
        var newItem = $(template);
        
        // อัพเดตลำดับของ row ใหม่
        var itemCount = $('.repeater-item').length + 1;
        newItem.find('.item-number').text(itemCount);
        
        // อัพเดตวันที่ด้วยวันที่ปัจจุบัน (พ.ศ.)
        var today = new Date();
        var day = String(today.getDate()).padStart(2, '0');
        var month = String(today.getMonth() + 1).padStart(2, '0');
        var year = today.getFullYear() + 543; // แปลงเป็น พ.ศ.
        var thaiDate = day + '/' + month + '/' + year;
        newItem.find('.file-date').val(thaiDate);
        
        $('.file-repeater-list').append(newItem);
    }
    
    // เพิ่ม Row พร้อมข้อมูล
    function addRepeaterRowWithData(data) {
        var template = document.getElementById('repeater-item-template').innerHTML;
        var newItem = $(template);
        
        // อัพเดตลำดับของ row ใหม่
        var itemCount = $('.repeater-item').length + 1;
        newItem.find('.item-number').text(itemCount);
        
        // ใส่ข้อมูลเข้าไปในฟอร์ม
        newItem.find('.file-name').val(data.name);
        newItem.find('.file-date').val(data.date);
        newItem.find('.file-link').val(data.link);
        
        $('.file-repeater-list').append(newItem);
    }
    
    // อัพเดตลำดับของ items
    function updateItemNumbers() {
        $('.repeater-item').each(function(index) {
            $(this).find('.item-number').text(index + 1);
        });
    }
    
    // ตรวจสอบความถูกต้องของฟอร์ม
    function validateForm() {
        var isValid = true;
        
        $('.file-name, .file-link').each(function() {
            if ($(this).val() === '') {
                isValid = false;
                $(this).addClass('error');
            } else {
                $(this).removeClass('error');
            }
        });
        
        return isValid;
    }
    
    // บันทึกข้อมูล Repeater
    function saveRepeaterData() {
        showLoading();
        
        var filesData = [];
        
        $('.repeater-item').each(function() {
            var item = $(this);
            
            filesData.push({
                name: item.find('.file-name').val(),
                date: item.find('.file-date').val(),
                link: item.find('.file-link').val()
            });
        });
        
        $.ajax({
            url: fileRepositoryAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'save_file_repository',
                nonce: fileRepositoryAjax.nonce,
                post_id: currentPostId,
                files_data: filesData
            },
            success: function(response) {
                if (response.success) {
                    showToast('บันทึกข้อมูลสำเร็จ');
                    $('#file-modal').removeClass('show');
                    
                    // รีโหลดหน้าเว็บ
                    setTimeout(function() {
                        location.reload();
                    }, 1000);
                } else {
                    showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
                    hideLoading();
                }
            },
            error: function() {
                console.error('Error saving repeater data');
                showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
                hideLoading();
            }
        });
    }
    
    // โหลดข้อมูลเอกสารจาก Repeater field
    function loadFileData() {
        showSkeletonLoader();
        
        $.ajax({
            url: fileRepositoryAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'get_files_repository_data',
                nonce: fileRepositoryAjax.nonce,
                post_id: currentPostId
            },
            success: function(response) {
                if (response.success) {
                    renderFiles(response.data);
                } else {
                    showToast('เกิดข้อผิดพลาดในการโหลดเอกสาร');
                }
            },
            error: function() {
                console.error('Error loading files');
                showToast('เกิดข้อผิดพลาดในการโหลดเอกสาร');
                hideSkeletonLoader();
            }
        });
    }
    
    // Render files in table
    function renderFiles(files) {
        var tbody = $('#file-repository-body');
        tbody.empty();
        
        if (files.length === 0) {
            var colspan = '4';
            tbody.append(
                '<tr><td colspan="' + colspan + '" class="file-table-empty">' +
                '<i class="fas fa-file-alt"></i><br>' +
                'ไม่พบเอกสาร' +
                '</td></tr>'
            );
        } else {
            files.forEach(function(file, index) {
                var row = createFileRow(file, index + 1);
                tbody.append(row);
            });
        }
        
        hideSkeletonLoader();
    }
    
    // Create file row
    function createFileRow(file, number) {
        // Get file extension
        var extension = file.name.split('.').pop().toLowerCase();
        var iconClass = getFileIconClass(extension);
        
        var row = $('<tr>').append(
            $('<td>').addClass('column-number').text(number),
            $('<td>').append(
                $('<div>').addClass('file-icon').append(
                    $('<i>').addClass('fas ' + iconClass),
                    $('<span>').text(file.name)
                )
            ),
            $('<td>').text(file.date),
            $('<td>').addClass('text-center').append(
                $('<a>')
                    .attr('href', file.url)
                    .attr('download', '')
                    .addClass('download-btn')
                    .attr('title', 'ดาวน์โหลด')
                    .append($('<i>').addClass('fas fa-download'))
            )
        );
        
        return row;
    }
    
    // Get file icon class based on extension
    function getFileIconClass(extension) {
        var iconMap = {
            'pdf': 'fa-file-pdf',
            'doc': 'fa-file-word',
            'docx': 'fa-file-word',
            'xls': 'fa-file-excel',
            'xlsx': 'fa-file-excel',
            'ppt': 'fa-file-powerpoint',
            'pptx': 'fa-file-powerpoint',
            'txt': 'fa-file-alt',
            'zip': 'fa-file-archive',
            'rar': 'fa-file-archive',
            'jpg': 'fa-file-image',
            'jpeg': 'fa-file-image',
            'png': 'fa-file-image',
            'gif': 'fa-file-image'
        };
        
        return iconMap[extension] || 'fa-file';
    }
    
    // Show skeleton loader
    function showSkeletonLoader() {
        var tbody = $('#file-repository-body');
        if (tbody.children().length === 0) {
            tbody.html(
                '<tr class="skeleton-row">' +
                '<td><div class="skeleton-loader"></div></td>'.repeat(4) +
                '</tr>'.repeat(3)
            );
        }
    }
    
    // Hide skeleton loader
    function hideSkeletonLoader() {
        $('.skeleton-row').remove();
    }
    
    // Show loading overlay
    function showLoading() {
        if ($('.loading-overlay').length === 0) {
            $('<div class="loading-overlay"><div class="loading-spinner"></div></div>').appendTo('body');
        }
        $('.loading-overlay').addClass('show');
    }
    
    // Hide loading overlay
    function hideLoading() {
        $('.loading-overlay').removeClass('show');
    }
    
    // Show toast notification
    function showToast(message) {
        // ลบ toast เก่าถ้ามี
        $('.file-repository-toast').remove();
        
        var toast = $('<div>')
            .addClass('file-repository-toast')
            .text(message)
            .appendTo('body');
        
        setTimeout(function() {
            toast.addClass('show');
        }, 100);
        
        setTimeout(function() {
            toast.removeClass('show');
            setTimeout(function() {
                toast.remove();
            }, 300);
        }, 3000);
    }
});