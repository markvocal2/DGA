// article-manager.js
jQuery(document).ready(function($) {
    // Track selected post types
    let selectedPostTypes = [];
    let hasSelectedNews = false;
    let currentUploadedImageId = 0;
    
    // Force scroll to top when page loads
    $(window).scrollTop(0);
    
    // Prevent automatic scrolling
    window.history.scrollRestoration = 'manual';
    
    // Modal handling
    $('.at-add-article-btn').click(function(e) {
        e.preventDefault();
        $('#at-article-modal').addClass('show');
        // Force scroll to top when modal opens
        $(window).scrollTop(0);
        // Reset post type error message
        $('.at-post-type-error').hide();
    });

    $('.at-close').click(function() {
        $('#at-article-modal').removeClass('show');
        resetForm();
    });

    $(window).click(function(e) {
        if ($(e.target).is('#at-article-modal')) {
            $('#at-article-modal').removeClass('show');
            resetForm();
        }
    });

    // Post type selection handling
    $('input[name="post_types[]"]').change(function() {
        selectedPostTypes = $('input[name="post_types[]"]:checked').map(function() {
            return $(this).val();
        }).get();
        
        // ตรวจสอบว่ามีการเลือก post type "news" หรือไม่
        hasSelectedNews = selectedPostTypes.includes('news');
        
        // แสดงหรือซ่อน container สำหรับ fields มาตรฐาน
        if (hasSelectedNews) {
            $('#standards-fields-container').slideDown(300);
        } else {
            $('#standards-fields-container').slideUp(300);
            // รีเซ็ตค่าใน field เมื่อไม่ได้เลือก news
            $('#dga_standard_number, #dgth_standard_number').val('');
            $('#dga-standard-field, #dgth-standard-field').hide();
        }
        
        if (selectedPostTypes.length > 0) {
            $('.at-post-type-error').hide();
            loadTaxonomyTerms(); // เรียกฟังก์ชันโหลด taxonomies
        } else {
            $('.at-post-type-error').show().text('กรุณาเลือกอย่างน้อย 1 ประเภทเนื้อหา');
            $('#taxonomy-terms-container').html('<div class="at-taxonomy-placeholder">กรุณาเลือกประเภทเนื้อหาก่อน เพื่อแสดงหมวดหมู่ที่เกี่ยวข้อง</div>');
        }
    });
    
    // ฟังก์ชันตรวจสอบและแสดง field มาตรฐานตามประเภทที่เลือก
    function checkStandardTerms() {
        // เริ่มต้นซ่อนทั้งสองฟิลด์
        $('#dga-standard-field, #dgth-standard-field').hide();
        
        if (!hasSelectedNews) return;
        
        // ตรวจสอบว่ามีการเลือกประเภทมาตรฐานของ news หรือไม่
        $('.at-term-checkbox:checked').each(function() {
            const termName = $(this).next('.at-term-name').text().trim();
            
            // ตรวจสอบชื่อเทอมที่เลือก
            if (termName === 'มาตรฐานสำนักงานพัฒนารัฐบาลดิจิทัล (มสพร.)') {
                $('#dga-standard-field').slideDown(300);
            }
            
            if (termName === 'มาตรฐานรัฐบาลดิจิทัล (มรด.)') {
                $('#dgth-standard-field').slideDown(300);
            }
        });
    }
    
    // เพิ่ม event listener สำหรับการเลือก taxonomy terms
    $(document).on('change', '.at-term-checkbox', function() {
        checkStandardTerms();
    });
    
    // Toggle documents section
    $('#toggle-documents').click(function() {
        const $btn = $(this);
        const $section = $('#documents-section');
        const currentState = $btn.data('state');
        
        if (currentState === 'show') {
            $section.slideUp(300);
            $btn.data('state', 'hide').addClass('at-toggle-btn-active');
            // Clear all file inputs and make them not required
            $section.find('input').prop('required', false).val('');
        } else {
            $section.slideDown(300);
            $btn.data('state', 'show').removeClass('at-toggle-btn-active');
        }
    });

    // File repeater handling
    $('#add-file-row').click(function() {
        const newRow = `
            <div class="file-repeater-row">
                <input type="text" name="file_name[]" placeholder="ชื่อไฟล์">
                <input type="date" name="file_date[]" value="${getCurrentDate()}">
                <input type="file" name="file_upload[]" accept=".pdf,.doc,.docx">
                <button type="button" class="remove-row">ลบ</button>
            </div>
        `;
        $('#file-repeater-container').append(newRow);
    });

    // Remove file row
    $(document).on('click', '.remove-row', function() {
        $(this).closest('.file-repeater-row').fadeOut(300, function() {
            $(this).remove();
        });
    });

    // ============ ปรับปรุงส่วนการจัดการอัปโหลดภาพ ===============
    // รองรับทั้งการเลือกผ่าน file input และการลากและวาง

    // การจัดการกับการเลือกไฟล์จาก file input - อัพโหลดทันที
    $('#article_images').on('change', function(e) {
        if (this.files && this.files.length > 0) {
            uploadFeaturedImage(this.files[0]);
        }
    });
    
    // เพิ่มฟังก์ชันอัพโหลดภาพทันทีผ่าน AJAX
    function uploadFeaturedImage(file) {
        // ตรวจสอบว่าเป็นไฟล์ภาพหรือไม่
        if (!file.type.startsWith('image/')) {
            showImageUploadError('กรุณาอัพโหลดไฟล์ภาพเท่านั้น (JPEG, PNG, GIF)');
            return;
        }
        
        // แสดงสถานะกำลังอัพโหลด
        $('#image-preview').html(`
            <div class="upload-status">
                <div class="upload-progress">
                    <div class="upload-progress-bar"></div>
                </div>
                <div class="upload-message">กำลังอัพโหลดภาพ...</div>
            </div>
        `);
        
        // สร้าง FormData สำหรับส่งไฟล์
        const formData = new FormData();
        formData.append('action', 'at_upload_featured_image');
        formData.append('nonce', atAjax.nonce);
        formData.append('file', file);
        
        // ส่งคำขออัพโหลดผ่าน AJAX
        $.ajax({
            url: atAjax.ajaxurl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            xhr: function() {
                const xhr = $.ajaxSettings.xhr();
                if (xhr.upload) {
                    xhr.upload.addEventListener('progress', function(e) {
                        if (e.lengthComputable) {
                            const percent = Math.round((e.loaded / e.total) * 100);
                            $('.upload-progress-bar').css('width', percent + '%');
                            $('.upload-message').text(`กำลังอัพโหลด... ${percent}%`);
                        }
                    }, false);
                }
                return xhr;
            },
            success: function(response) {
                if (response.success) {
                    // บันทึก ID ของภาพที่อัพโหลดเสร็จแล้ว
                    currentUploadedImageId = response.data.attachment_id;
                    $('#featured_image_id').val(currentUploadedImageId);
                    
                    // แสดงตัวอย่างภาพที่อัพโหลดเสร็จแล้ว
                    $('#image-preview').html(`
                        <div class="preview-item">
                            <img src="${response.data.thumbnail}" alt="ตัวอย่างภาพหน้าปก">
                            <div class="preview-info">
                                <div class="preview-name">${response.data.filename}</div>
                                <div class="preview-size">${response.data.filesize}</div>
                            </div>
                            <button type="button" class="remove-image" title="ลบภาพ">×</button>
                        </div>
                    `);
                } else {
                    showImageUploadError(response.data.message || 'เกิดข้อผิดพลาดในการอัพโหลดภาพ');
                }
            },
            error: function() {
                showImageUploadError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
            }
        });
    }
    
    // ฟังก์ชันแสดงข้อความแจ้งเตือนกรณีอัพโหลดผิดพลาด
    function showImageUploadError(message) {
        $('#image-preview').html(`
            <div class="preview-error">
                <p>${message}</p>
            </div>
        `);
        // ล้างค่าใน file input
        $('#article_images').val('');
    }
    
    // เพิ่มฟังก์ชัน drag-and-drop สำหรับภาพ
    const dropArea = document.getElementById('image-upload-area');
    
    if (dropArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            dropArea.classList.add('highlight');
        }
        
        function unhighlight() {
            dropArea.classList.remove('highlight');
        }
        
        dropArea.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            let dt = e.dataTransfer;
            let files = dt.files;
            
            if (files.length > 0) {
                // อัพโหลดไฟล์แรกทันที
                uploadFeaturedImage(files[0]);
            }
        }
    }
    
    // จัดการการลบภาพ
    $(document).on('click', '.remove-image', function() {
        $('#image-preview').empty();
        $('#article_images').val('');
        currentUploadedImageId = 0;
        $('#featured_image_id').val(0);
    });
    
    // ============ จบส่วนการปรับปรุงการอัปโหลดภาพ ===============
    
    // ฟังก์ชันสำหรับโหลด taxonomy terms
    function loadTaxonomyTerms() {
        if (selectedPostTypes.length === 0) return;
        
        // แสดง loading indicator
        $('#taxonomy-terms-container').html('<div class="at-loading">กำลังโหลดหมวดหมู่...</div>');
        
        $.ajax({
            url: atAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'get_post_type_taxonomies',
                post_types: selectedPostTypes,
                nonce: atAjax.nonce
            },
            success: function(response) {
                if (response.success) {
                    displayTaxonomyTerms(response.data);
                    // ตรวจสอบ terms หลังจากโหลดและแสดงผล
                    setTimeout(checkStandardTerms, 300);
                } else {
                    $('#taxonomy-terms-container').html('<div class="at-taxonomy-error">ไม่สามารถโหลดหมวดหมู่ได้ กรุณาลองใหม่อีกครั้ง</div>');
                }
            },
            error: function() {
                $('#taxonomy-terms-container').html('<div class="at-taxonomy-error">การเชื่อมต่อล้มเหลว กรุณาลองใหม่อีกครั้ง</div>');
            }
        });
    }
    
    // ฟังก์ชันสำหรับแสดง taxonomy terms
    function displayTaxonomyTerms(taxonomiesData) {
        const $container = $('#taxonomy-terms-container');
        $container.empty();
        
        if (Object.keys(taxonomiesData).length === 0) {
            $container.html('<div class="at-taxonomy-empty">ไม่พบหมวดหมู่สำหรับประเภทเนื้อหาที่เลือก</div>');
            return;
        }
        
        // ชื่อประเภทเนื้อหาในภาษาไทย
        const postTypeLabels = {
            'article': 'บทความ',
            'mpeople': 'คู่มือประชาชน',
            'news': 'ข้อมูลทั่วไป/มาตรฐาน',
            'pha': 'ประชาพิจารณ์และกิจกรรม'
        };
        
        // สร้าง HTML สำหรับแต่ละประเภทเนื้อหา
        Object.keys(taxonomiesData).forEach(postType => {
            const taxonomies = taxonomiesData[postType];
            if (!taxonomies || taxonomies.length === 0) return;
            
            taxonomies.forEach(taxonomy => {
                const terms = taxonomy.terms;
                if (!terms || terms.length === 0) return;
                
                const taxonomyHeader = `<div class="at-taxonomy-header">
                    <span class="at-taxonomy-post-type">${postTypeLabels[postType]}</span>
                    <span class="at-taxonomy-label">${taxonomy.label}</span>
                </div>`;
                
                const termsList = `<div class="at-terms-list">
                    ${terms.map(term => `
                        <label class="at-term-label" data-term-name="${term.name}">
                            <input type="checkbox" name="tax_input[${taxonomy.name}][]" value="${parseInt(term.id)}" class="at-term-checkbox">
                            <span class="at-term-name">${term.name}</span>
                        </label>
                    `).join('')}
                </div>`;
                
                $container.append(`
                    <div class="at-taxonomy-group" data-post-type="${postType}" data-taxonomy="${taxonomy.name}">
                        ${taxonomyHeader}
                        ${termsList}
                    </div>
                `);
            });
        });
    }

    // Form submission - ปรับปรุงการส่งข้อมูลฟอร์มให้ส่ง featured_image_id
    $('#at-article-form').submit(function(e) {
        e.preventDefault();
        
        // Validate post type selection
        selectedPostTypes = $('input[name="post_types[]"]:checked').map(function() {
            return $(this).val();
        }).get();
        
        if (selectedPostTypes.length === 0) {
            $('.at-post-type-error')
                .text('กรุณาเลือกอย่างน้อย 1 ประเภทเนื้อหา')
                .show();
            return;
        }
        
        // ตรวจสอบว่ามีการใส่ชื่อบทความหรือไม่
        if (!$('#article_title').val().trim()) {
            alert('กรุณาระบุชื่อบทความ');
            $('#article_title').focus();
            return;
        }
        
        // กำหนดค่า featured_image_id จากการอัพโหลด
        if (currentUploadedImageId > 0) {
            $('#featured_image_id').val(currentUploadedImageId);
        }
        
        const formData = new FormData(this);
        formData.append('action', 'submit_article');
        
        // Remove empty file uploads if documents section is hidden
        if ($('#toggle-documents').data('state') === 'hide') {
            formData.delete('file_name[]');
            formData.delete('file_date[]');
            formData.delete('file_upload[]');
        }
        
        // Disable submit button and show loading state
        $('.at-submit-btn')
            .prop('disabled', true)
            .html('<span class="spinner"></span> กำลังบันทึก...');

        $.ajax({
            url: atAjax.ajaxurl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    // Show success message with links to all created posts
                    let message = response.data.message;
                    showToast(message, response.data.posts);
                    resetForm();
                    $('#at-article-modal').removeClass('show');
                } else {
                    showToast('เกิดข้อผิดพลาด: ' + (response.data || 'กรุณาลองใหม่อีกครั้ง'));
                }
            },
            error: function(xhr) {
                let errorMsg = 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง';
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.data) {
                        errorMsg = 'เกิดข้อผิดพลาด: ' + response.data;
                    }
                } catch (e) {}
                
                showToast(errorMsg);
            },
            complete: function() {
                $('.at-submit-btn')
                    .prop('disabled', false)
                    .text('บันทึกข้อมูล');
            }
        });
    });

    // Form reset function
    function resetForm() {
        $('#at-article-form')[0].reset();
        $('#image-preview').empty();
        $('.at-post-type-error').hide();
        
        // รีเซ็ต featured image
        currentUploadedImageId = 0;
        $('#featured_image_id').val(0);
        
        // รีเซ็ต taxonomy container
        $('#taxonomy-terms-container').html('<div class="at-taxonomy-placeholder">กรุณาเลือกประเภทเนื้อหาก่อน เพื่อแสดงหมวดหมู่ที่เกี่ยวข้อง</div>');
        
        // ซ่อน fields มาตรฐาน
        $('#standards-fields-container').hide();
        $('#dga-standard-field, #dgth-standard-field').hide();
        $('#dga_standard_number, #dgth_standard_number').val('');
        
        // Reset documents section
        $('#documents-section').show();
        $('#toggle-documents')
            .data('state', 'show')
            .removeClass('at-toggle-btn-active');
        
        // Reset file repeater
        $('#file-repeater-container').html(`
            <div class="file-repeater-row">
                <input type="text" name="file_name[]" placeholder="ชื่อไฟล์">
                <input type="date" name="file_date[]" value="${getCurrentDate()}">
                <input type="file" name="file_upload[]" accept=".pdf,.doc,.docx">
                <button type="button" class="remove-row">ลบ</button>
            </div>
        `);

        // Reset post type selections
        selectedPostTypes = [];
        hasSelectedNews = false;
        $('input[name="post_types[]"]').prop('checked', false);
        
        // Reset TinyMCE editor if available
        if (typeof tinyMCE !== 'undefined' && tinyMCE.get('article_content')) {
            tinyMCE.get('article_content').setContent('');
        }
    }

    // Toast notification with support for multiple post links
    function showToast(message, posts = null) {
        // Remove existing toast
        $('.at-toast').remove();
        
        // Create post links if available
        let linksHTML = '';
        if (Array.isArray(posts)) {
            const postTypeLabels = {
                'article': 'บทความ',
                'mpeople': 'คู่มือประชาชน',
                'news': 'ข้อมูลทั่วไป',
                'pha': 'ประชาพิจารณ์และกิจกรรม'
            };
            
            linksHTML = posts.map(post => 
                `<a href="${post.url}" class="at-toast-link" target="_blank">
                    ดู${postTypeLabels[post.type]}
                </a>`
            ).join('');
        } else if (posts && posts.post_url) {
            // Backward compatibility for single post URL
            linksHTML = `<a href="${posts.post_url}" class="at-toast-link" target="_blank">ดูบทความ</a>`;
        }
        
        // Create toast HTML
        let toastHTML = `
            <div class="at-toast">
                <div class="at-toast-message">${message}</div>
                <div class="at-toast-links">${linksHTML}</div>
            </div>
        `;
        
        $('body').append(toastHTML);
        
        // Auto remove toast after 5 seconds
        setTimeout(function() {
            $('.at-toast').fadeOut(300, function() {
                $(this).remove();
            });
        }, 5000);
    }

    // Helper function to get current date in YYYY-MM-DD format
    function getCurrentDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
});