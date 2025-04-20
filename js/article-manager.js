jQuery(document).ready(function($) {
    // Track selected post types
    let selectedPostTypes = [];
    let hasSelectedNews = false;
    let currentUploadedImageId = 0;

    // --- Helper Functions ---

    /**
     * Gets the current date in YYYY-MM-DD format.
     * @returns {string} The formatted date string.
     */
    function getCurrentDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Shows a toast notification.
     * @param {string} message - The message to display.
     * @param {Array|Object|null} posts - Optional post data for links.
     */
    function showToast(message, posts = null) {
        // Remove existing toast
        $('.at-toast').remove();

        // Create post links if available
        let linksHTML = '';
        const postTypeLabels = {
            'article': 'บทความ',
            'mpeople': 'คู่มือประชาชน',
            'news': 'ข้อมูลทั่วไป',
            'pha': 'ประชาพิจารณ์และกิจกรรม'
        };

        if (Array.isArray(posts)) {
            linksHTML = posts.map(post =>
                `<a href="${post.url}" class="at-toast-link" target="_blank">
                    ดู${postTypeLabels[post.type] || 'รายการ'}
                 </a>`
            ).join('');
        } else if (posts && posts.post_url) {
            // Backward compatibility for single post URL
            linksHTML = `<a href="${posts.post_url}" class="at-toast-link" target="_blank">ดูบทความ</a>`;
        }

        // Create toast HTML
        const toastHTML = `
            <div class="at-toast">
                <div class="at-toast-message">${message}</div>
                <div class="at-toast-links">${linksHTML}</div>
            </div>
        `;

        $('body').append(toastHTML);

        // Auto remove toast after 5 seconds
        setTimeout(function() {
            $('.at-toast').fadeOut(300, function() { $(this).remove(); });
        }, 5000);
    }

    /**
     * Resets the entire article submission form to its initial state.
     */
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

    // --- Taxonomy Handling ---

    /**
     * Loads taxonomy terms based on selected post types via AJAX.
     */
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
            success: handleTaxonomyLoadSuccess,
            error: handleTaxonomyLoadError
        });
    }

    /**
     * Handles the successful response from loading taxonomies.
     * @param {Object} response - The AJAX response object.
     */
    function handleTaxonomyLoadSuccess(response) {
        if (response.success) {
            displayTaxonomyTerms(response.data);
            // ตรวจสอบ terms หลังจากโหลดและแสดงผล
            // Use setTimeout to allow the DOM to update before checking
            setTimeout(checkStandardTerms, 100); // Small delay
        } else {
            $('#taxonomy-terms-container').html('<div class="at-taxonomy-error">ไม่สามารถโหลดหมวดหมู่ได้ กรุณาลองใหม่อีกครั้ง</div>');
        }
    }

    /**
     * Handles errors during the taxonomy loading AJAX call.
     */
    function handleTaxonomyLoadError() {
        $('#taxonomy-terms-container').html('<div class="at-taxonomy-error">การเชื่อมต่อล้มเหลว กรุณาลองใหม่อีกครั้ง</div>');
    }

    /**
     * Displays the loaded taxonomy terms in the UI.
     * @param {Object} taxonomiesData - Data containing taxonomies grouped by post type.
     */
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

        // Build HTML for each taxonomy and its terms
        Object.keys(taxonomiesData).forEach(postType => {
            const taxonomies = taxonomiesData[postType];
            if (!taxonomies || taxonomies.length === 0) return;

            taxonomies.forEach(taxonomy => {
                const terms = taxonomy.terms;
                if (!terms || terms.length === 0) return;

                const taxonomyHeader = `<div class="at-taxonomy-header">
                    <span class="at-taxonomy-post-type">${postTypeLabels[postType] || postType}</span>
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

    /**
     * Checks selected taxonomy terms (specifically for 'news' post type)
     * and shows/hides related standard number input fields.
     */
    function checkStandardTerms() {
        // Start by hiding both fields
        $('#dga-standard-field, #dgth-standard-field').hide();

        if (!hasSelectedNews) return; // Only proceed if 'news' is selected

        // Check which standard terms are selected within the 'news' post type's taxonomies
        $('.at-taxonomy-group[data-post-type="news"] .at-term-checkbox:checked').each(function() {
            const termName = $(this).closest('.at-term-label').data('term-name');

            if (termName === 'มาตรฐานสำนักงานพัฒนารัฐบาลดิจิทัล (มสพร.)') {
                $('#dga-standard-field').slideDown(300);
            }

            if (termName === 'มาตรฐานรัฐบาลดิจิทัล (มรด.)') {
                $('#dgth-standard-field').slideDown(300);
            }
        });
    }


    // --- Featured Image Upload Handling ---

    /**
     * Shows an error message in the image preview area.
     * @param {string} message - The error message to display.
     */
    function showImageUploadError(message) {
        $('#image-preview').html(`
            <div class="preview-error">
                <p>${message}</p>
            </div>
        `);
        // Clear the file input
        $('#article_images').val('');
        currentUploadedImageId = 0; // Reset ID if upload failed
        $('#featured_image_id').val(0);
    }

    /**
     * Handles the progress event during image upload.
     * @param {ProgressEvent} e - The progress event object.
     */
    function handleImageUploadProgress(e) {
        if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            $('.upload-progress-bar').css('width', percent + '%');
            $('.upload-message').text(`กำลังอัพโหลด... ${percent}%`);
        }
    }

    /**
     * Handles the successful response from the image upload AJAX call.
     * @param {Object} response - The AJAX response object.
     */
    function handleImageUploadSuccess(response) {
        if (response.success) {
            // Save the ID of the uploaded image
            currentUploadedImageId = response.data.attachment_id;
            $('#featured_image_id').val(currentUploadedImageId);

            // Display the preview of the uploaded image
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
    }

    /**
     * Handles errors during the image upload AJAX call.
     */
    function handleImageUploadError() {
        showImageUploadError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    }

    /**
     * Uploads the selected featured image file via AJAX.
     * @param {File} file - The image file to upload.
     */
    function uploadFeaturedImage(file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showImageUploadError('กรุณาอัพโหลดไฟล์ภาพเท่านั้น (JPEG, PNG, GIF)');
            return;
        }

        // Show uploading status
        $('#image-preview').html(`
            <div class="upload-status">
                <div class="upload-progress">
                    <div class="upload-progress-bar"></div>
                </div>
                <div class="upload-message">กำลังอัพโหลดภาพ...</div>
            </div>
        `);

        // Create FormData
        const formData = new FormData();
        formData.append('action', 'at_upload_featured_image');
        formData.append('nonce', atAjax.nonce);
        formData.append('file', file);

        // Perform AJAX upload
        $.ajax({
            url: atAjax.ajaxurl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            xhr: function() {
                const xhr = $.ajaxSettings.xhr();
                if (xhr.upload) {
                    xhr.upload.addEventListener('progress', handleImageUploadProgress, false);
                }
                return xhr;
            },
            success: handleImageUploadSuccess,
            error: handleImageUploadError
        });
    }

    // --- Drag and Drop Image Upload ---

    /**
     * Prevents default browser behavior for drag/drop events.
     * @param {Event} e - The event object.
     */
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * Adds a highlight class to the drop area.
     */
    function highlightDropArea() {
        $('#image-upload-area').addClass('highlight');
    }

    /**
     * Removes the highlight class from the drop area.
     */
    function unhighlightDropArea() {
        $('#image-upload-area').removeClass('highlight');
    }

    /**
     * Handles the drop event, initiating the upload.
     * @param {DragEvent} e - The drop event object.
     */
    function handleDrop(e) {
        const dt = e.originalEvent.dataTransfer; // Use originalEvent for jQuery event
        const files = dt.files;

        if (files.length > 0) {
            // Upload the first dropped file immediately
            uploadFeaturedImage(files[0]);
        }
    }

    // --- Form Submission Handling ---

    /**
     * Handles the successful response from the form submission AJAX call.
     * @param {Object} response - The AJAX response object.
     */
    function handleFormSubmitSuccess(response) {
        if (response.success) {
            // Show success message with links to all created posts
            let message = response.data.message;
            showToast(message, response.data.posts);
            resetForm();
            $('#at-article-modal').removeClass('show');
        } else {
            showToast('เกิดข้อผิดพลาด: ' + (response.data || 'กรุณาลองใหม่อีกครั้ง'));
        }
    }

    /**
     * Handles errors during the form submission AJAX call.
     * @param {jqXHR} xhr - The jQuery XHR object.
     */
    function handleFormSubmitError(xhr) {
        let errorMsg = 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง';
        try {
            // Try to parse the response text for a more specific error
            const response = JSON.parse(xhr.responseText);
            if (response.data) {
                errorMsg = 'เกิดข้อผิดพลาด: ' + response.data;
            }
        } catch (e) {
            // Ignore parsing errors, use the default message
        }
        showToast(errorMsg);
    }

    /**
     * Re-enables the submit button after the AJAX call completes.
     */
    function handleFormSubmitComplete() {
        $('.at-submit-btn')
            .prop('disabled', false)
            .text('บันทึกข้อมูล');
    }


    // --- Initial Setup and Event Listeners ---

    // Force scroll to top when page loads
    $(window).scrollTop(0);

    // Prevent automatic scrolling on history navigation
    if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
    }

    // Modal Handling
    $('.at-add-article-btn').click(function(e) {
        e.preventDefault();
        $('#at-article-modal').addClass('show');
        $(window).scrollTop(0); // Force scroll to top when modal opens
        $('.at-post-type-error').hide(); // Reset error message
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

    // Post Type Selection Handling
    $('input[name="post_types[]"]').change(function() {
        selectedPostTypes = $('input[name="post_types[]"]:checked').map(function() {
            return $(this).val();
        }).get();

        hasSelectedNews = selectedPostTypes.includes('news');

        // Show/hide standard fields container based on 'news' selection
        if (hasSelectedNews) {
            $('#standards-fields-container').slideDown(300);
            // Check terms immediately in case 'news' was just selected
            // and relevant terms might already be checked (e.g., if user unchecks/rechecks news)
            checkStandardTerms();
        } else {
            $('#standards-fields-container').slideUp(300);
            // Reset standard fields if 'news' is deselected
            $('#dga_standard_number, #dgth_standard_number').val('');
            $('#dga-standard-field, #dgth-standard-field').hide();
        }

        // Load taxonomies or show placeholder/error
        if (selectedPostTypes.length > 0) {
            $('.at-post-type-error').hide();
            loadTaxonomyTerms();
        } else {
            $('.at-post-type-error').show().text('กรุณาเลือกอย่างน้อย 1 ประเภทเนื้อหา');
            $('#taxonomy-terms-container').html('<div class="at-taxonomy-placeholder">กรุณาเลือกประเภทเนื้อหาก่อน เพื่อแสดงหมวดหมู่ที่เกี่ยวข้อง</div>');
            // Hide standard fields container if no post types are selected
             $('#standards-fields-container').slideUp(300);
             $('#dga_standard_number, #dgth_standard_number').val('');
             $('#dga-standard-field, #dgth-standard-field').hide();
        }
    });

    // Taxonomy Term Selection Handling (Event Delegation)
    $(document).on('change', '.at-term-checkbox', function() {
        // Only run checkStandardTerms if 'news' is one of the selected post types
        if (hasSelectedNews) {
            checkStandardTerms();
        }
    });

    // Toggle Documents Section
    $('#toggle-documents').click(function() {
        const $btn = $(this);
        const $section = $('#documents-section');
        const currentState = $btn.data('state') || 'show'; // Default to 'show' if not set

        if (currentState === 'show') {
            $section.slideUp(300);
            $btn.data('state', 'hide').addClass('at-toggle-btn-active');
            // Clear all file inputs and make them not required when hiding
            $section.find('input[type="file"]').prop('required', false).val('');
            $section.find('input[type="text"]').val(''); // Clear names too if desired
            $section.find('input[type="date"]').val(getCurrentDate()); // Reset date
        } else {
            $section.slideDown(300);
            $btn.data('state', 'show').removeClass('at-toggle-btn-active');
            // Optionally make file inputs required again if needed when shown
            // $section.find('input[type="file"]').prop('required', true);
        }
    });

    // File Repeater Handling
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

    // Remove File Row (Event Delegation)
    $(document).on('click', '.remove-row', function() {
        $(this).closest('.file-repeater-row').fadeOut(300, function() {
            $(this).remove();
        });
    });

    // Featured Image Input Change
    $('#article_images').on('change', function(e) {
        if (this.files && this.files.length > 0) {
            uploadFeaturedImage(this.files[0]);
        }
    });

    // Setup Drag and Drop for Image Upload
    const dropArea = $('#image-upload-area'); // Use jQuery selector
    if (dropArea.length) { // Check if element exists
        // Prevent default behaviors
        dropArea.on('dragenter dragover dragleave drop', preventDefaults);
        // Highlight on drag over
        dropArea.on('dragenter dragover', highlightDropArea);
        // Unhighlight on drag leave or drop
        dropArea.on('dragleave drop', unhighlightDropArea);
        // Handle dropped files
        dropArea.on('drop', handleDrop);
    }

    // Remove Featured Image (Event Delegation)
    $(document).on('click', '.remove-image', function() {
        $('#image-preview').empty();
        $('#article_images').val(''); // Clear file input
        currentUploadedImageId = 0;
        $('#featured_image_id').val(0);
    });

    // Form Submission
    $('#at-article-form').submit(function(e) {
        e.preventDefault();

        // Re-validate post type selection on submit
        selectedPostTypes = $('input[name="post_types[]"]:checked').map(function() {
            return $(this).val();
        }).get();

        if (selectedPostTypes.length === 0) {
            $('.at-post-type-error')
                .text('กรุณาเลือกอย่างน้อย 1 ประเภทเนื้อหา')
                .show();
            // Scroll to the error message for better visibility
             $('html, body').animate({
                scrollTop: $(".at-post-type-error").offset().top - 100 // Adjust offset as needed
            }, 300);
            return; // Stop submission
        } else {
             $('.at-post-type-error').hide(); // Hide error if fixed
        }


        // Validate article title
        if (!$('#article_title').val().trim()) {
             // Use the showToast function for consistency, or a more prominent alert
            showToast('กรุณาระบุชื่อบทความ');
            // alert('กรุณาระบุชื่อบทความ'); // Alternative
            $('#article_title').focus();
             $('html, body').animate({
                scrollTop: $("#article_title").offset().top - 100 // Adjust offset as needed
            }, 300);
            return; // Stop submission
        }

        // Ensure featured_image_id is set correctly before creating FormData
        $('#featured_image_id').val(currentUploadedImageId); // Set value just in case

        const formData = new FormData(this);
        formData.append('action', 'submit_article');
        // Add nonce explicitly if not already part of the form
        if (!formData.has('nonce')) {
             formData.append('nonce', atAjax.nonce);
        }


        // Remove empty file uploads if documents section is hidden ('hide' state)
        if ($('#toggle-documents').data('state') === 'hide') {
            // Need to iterate and remove specifically named fields if using FormData directly
            // A simpler approach might be to disable the inputs when hidden,
            // as disabled inputs are not typically included in form submission.
            // However, FormData captures current values, so explicit removal is safer here.

            // Find indices of file inputs to remove corresponding name/date
             const fileInputs = $('#documents-section').find('input[type="file"]');
             const fileNames = formData.getAll('file_name[]');
             const fileDates = formData.getAll('file_date[]');
             const fileUploads = formData.getAll('file_upload[]'); // Get actual files

             // Create new arrays excluding entries where the file input was empty
             const newFileNames = [];
             const newFileDates = [];
             const newFileUploads = [];

             fileInputs.each(function(index) {
                 // Check if the corresponding file object has a name (meaning a file was selected)
                 if (fileUploads[index] && fileUploads[index].name) {
                     newFileNames.push(fileNames[index]);
                     newFileDates.push(fileDates[index]);
                     newFileUploads.push(fileUploads[index]);
                 }
             });

             // Delete old arrays and append new ones
             formData.delete('file_name[]');
             formData.delete('file_date[]');
             formData.delete('file_upload[]');

             newFileNames.forEach(name => formData.append('file_name[]', name));
             newFileDates.forEach(date => formData.append('file_date[]', date));
             newFileUploads.forEach(file => formData.append('file_upload[]', file));

        }


        // Disable submit button and show loading state
        $('.at-submit-btn')
            .prop('disabled', true)
            .html('<span class="spinner"></span> กำลังบันทึก...');

        // Perform AJAX submission
        $.ajax({
            url: atAjax.ajaxurl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: handleFormSubmitSuccess,
            error: handleFormSubmitError,
            complete: handleFormSubmitComplete
        });
    });

});
