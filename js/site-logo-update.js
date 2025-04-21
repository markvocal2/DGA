// site-logo-update.js
jQuery(document).ready(($) => {
    'use strict';

    // Variables
    let mediaUploader;
    let activeTab = 'white'; // Default tab

    // --- Configuration Check ---
    if (typeof siteLogoUpdateData === 'undefined' || !siteLogoUpdateData.ajax_url || !siteLogoUpdateData.nonce) {
        console.error('siteLogoUpdateData object is missing or incomplete. Logo update functionality may not work.');
        // Optionally display an error message on the page
        $('#site-logo-update-message').addClass('error').text('เกิดข้อผิดพลาดในการโหลดการตั้งค่า').show();
        return; // Stop execution if config is missing
    }

    // --- Maps for Selectors and Data ---
    const backgroundIdMap = {
        'white': '#site-logo-image-white',
        'dark': '#site-logo-image-dark',
        'transparent': '#site-logo-image-transparent'
    };
    const placeholderIdMap = {
        'white': '#site-logo-placeholder-white',
        'dark': '#site-logo-placeholder-dark',
        'transparent': '#site-logo-placeholder-transparent'
    };
    const containerIdMap = {
        'white': '#site-logo-container-white',
        'dark': '#site-logo-container-dark',
        'transparent': '#site-logo-container-transparent'
    };
    const previewAreaIdMap = {
        'white': '#site-logo-preview-white',
        'dark': '#site-logo-preview-dark',
        'transparent': '#site-logo-preview-transparent'
    };
    const selectButtonIdMap = {
        'white': '#site-logo-select-white',
        'dark': '#site-logo-select-dark',
        'transparent': '#site-logo-select-transparent'
    };
    const saveButtonIdMap = {
        'white': '#site-logo-save-white',
        'dark': '#site-logo-save-dark',
        'transparent': '#site-logo-save-transparent'
    };
    const backgroundNameMap = {
        'white': 'ขาว',
        'dark': 'สีเข้ม',
        'transparent': 'โปร่งใส'
    };
    // Map for shortcode parameter (adjust if needed)
    const shortcodeModeMap = {
        'white': 'dark', // Example: white bg logo used on dark sections
        'dark': 'light', // Example: dark bg logo used on light sections
        'transparent': 'transparent'
    };

    // --- Helper Functions ---

    /**
     * Shows a status message that fades out automatically.
     * @param {string} message The message text.
     * @param {string} type 'success', 'error', or 'info'.
     */
    function showMessage(message, type) {
        const $messageArea = $('#site-logo-update-message');
        if (!$messageArea.length) return; // Exit if message area doesn't exist

        // Clear existing timers and classes, set new message and class
        clearTimeout($messageArea.data('fadeTimer'));
        $messageArea.removeClass('success error info')
            .addClass(type)
            .text(message)
            .fadeIn();

        // Auto hide after 5 seconds
        const timer = setTimeout(() => {
            $messageArea.fadeOut(() => {
                 $messageArea.removeClass(type).text(''); // Clear class and text after fade
            });
        }, 5000);
        $messageArea.data('fadeTimer', timer); // Store timer to clear if new message arrives
    }

    /**
     * Prevents default event behavior and stops propagation.
     * @param {Event} e The event object.
     */
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * Schedules the reset of a button's text and disabled state.
     * @param {jQuery} $button The button element.
     * @param {string} originalText The text to reset the button to.
     * @param {number} [delay=2000] Delay in milliseconds before resetting.
     */
    function scheduleButtonReset($button, originalText, delay = 2000) {
         clearTimeout($button.data('resetTimer')); // Clear existing timer
         const timer = setTimeout(() => {
             $button.text(originalText).prop('disabled', false);
         }, delay);
         $button.data('resetTimer', timer); // Store timer
    }

    // --- Media Uploader Functions ---

    /**
     * Opens the WordPress Media Uploader.
     * @param {string} bgType The background type ('white', 'dark', 'transparent').
     */
    function openMediaUploader(bgType) {
        // Ensure wp.media exists
        if (typeof wp === 'undefined' || typeof wp.media === 'undefined') {
            showMessage('Media Uploader ไม่พร้อมใช้งาน', 'error');
            console.error('wp.media is not defined.');
            return;
        }

        // Set active tab to match background type being edited
        $(`.site-logo-tab[data-tab="${bgType}"]`).trigger('click'); // Use trigger instead of direct click

        // Create or reconfigure media uploader instance
        const uploaderTitle = `เลือกโลโก้สำหรับพื้นหลัง${backgroundNameMap[bgType]}`;
        const uploaderButtonText = 'ใช้เป็นโลโก้';

        if (!mediaUploader) {
            mediaUploader = wp.media({
                title: uploaderTitle,
                button: { text: uploaderButtonText },
                multiple: false,
                library: { type: 'image' }
            });

            // Event handler for when an image is selected
            mediaUploader.on('select', () => {
                const attachment = mediaUploader.state().get('selection').first().toJSON();
                // Use the currently active tab's bgType when updating preview
                updateLogoPreview(activeTab, attachment);
            });

        } else {
            // Reconfigure existing uploader for the current context
            mediaUploader.state().set('library', wp.media.query({ type: 'image' })); // Reset library view
            mediaUploader.options.title = uploaderTitle;
            mediaUploader.options.button.text = uploaderButtonText;
        }

        // Open the uploader dialog
        mediaUploader.open();
    }

    /**
     * Updates the logo preview area after selecting/uploading an image.
     * @param {string} bgType The background type.
     * @param {object} attachment Attachment object from Media Uploader or AJAX response.
     */
    function updateLogoPreview(bgType, attachment) {
        if (!attachment || !attachment.url || !attachment.id) {
            console.error('Invalid attachment data for preview update:', attachment);
            return;
        }

        const $previewArea = $(previewAreaIdMap[bgType]);
        const $container = $(containerIdMap[bgType]);
        const $image = $(backgroundIdMap[bgType]);
        const $placeholder = $(placeholderIdMap[bgType]);
        const containerId = containerIdMap[bgType].substring(1); // Get ID without '#'
        const imageId = backgroundIdMap[bgType].substring(1); // Get ID without '#'

        // If image element exists, just update src
        if ($image.length) {
            $image.attr('src', attachment.url);
        } else {
            // Remove placeholder if it exists
            $placeholder.remove();

            // Create container and image elements if they don't exist
            let $currentContainer = $container;
            if (!$currentContainer.length) {
                 $currentContainer = $(`<div class="site-logo-image-container" id="${containerId}"></div>`).appendTo($previewArea);
            }
            // Add image (replace content if container existed but image didn't)
            $currentContainer.html(`<img src="${attachment.url}" alt="โลโก้พื้นหลัง${backgroundNameMap[bgType]}" id="${imageId}" />`);

            // Add overlay if it doesn't exist
            if (!$previewArea.find('.site-logo-overlay').length) {
                 $previewArea.append(`<div class="site-logo-overlay"><span>โลโก้สำหรับพื้นหลัง${backgroundNameMap[bgType]}</span></div>`);
            }
        }

        // Store the attachment ID on the container
        $(containerIdMap[bgType]).data('attachment-id', attachment.id);

        // Enable the corresponding save button
        $(saveButtonIdMap[bgType]).prop('disabled', false).text('บันทึกโลโก้'); // Reset text too
    }


    // --- AJAX Handlers ---

     /**
     * Handles the successful response after saving a logo.
     * @param {object} response The AJAX success response.
     * @param {jQuery} $saveButton The save button element.
     * @param {string} bgType The background type saved.
     */
    function handleSaveSuccess(response, $saveButton, bgType) {
        showMessage(`บันทึกโลโก้สำหรับพื้นหลัง${backgroundNameMap[bgType]}เรียบร้อยแล้ว`, 'success');

        // Create and display success banner with shortcode
        let successBannerHtml = '<div class="site-logo-success-banner">';
        successBannerHtml += '<span>ใช้งานด้วย</span>';
        // Ensure shortcode exists in response data
        const shortcode = response.data?.shortcode || `[site_logo mode="${shortcodeModeMap[bgType]}"]`; // Fallback shortcode
        successBannerHtml += `<code>${shortcode}</code>`;
        successBannerHtml += '</div>';

        const $existingBanner = $saveButton.next('.site-logo-success-banner');
        if ($existingBanner.length) {
            $existingBanner.replaceWith(successBannerHtml);
        } else {
            $saveButton.after(successBannerHtml);
        }

        // Update button text and schedule reset
        $saveButton.text('บันทึกเรียบร้อย!');
        scheduleButtonReset($saveButton, 'บันทึกโลโก้'); // Schedule reset back to original text
    }

    /**
     * Handles errors during the save logo AJAX call.
     * @param {object|string|null} responseData Response data or error string.
     * @param {jQuery} $saveButton The save button element.
     */
    function handleSaveError(responseData, $saveButton) {
        const message = (responseData && typeof responseData === 'string')
                      ? responseData
                      : (siteLogoUpdateData?.messages?.error || 'เกิดข้อผิดพลาด โปรดลองอีกครั้ง');
        showMessage(message, 'error');
        // Reset button immediately on error
        $saveButton.prop('disabled', false).text('บันทึกโลโก้');
    }


    // --- Core Functionality ---

    /**
     * Initializes tab switching behavior.
     */
    function initTabSwitching() {
        $('.site-logo-tab').on('click', function() {
            const $this = $(this);
            if ($this.hasClass('active')) return; // Do nothing if already active

            const tabId = $this.data('tab');
            activeTab = tabId; // Update global active tab state

            // Update tab appearance
            $('.site-logo-tab').removeClass('active');
            $this.addClass('active');

            // Update content visibility
            $('.site-logo-content').removeClass('active');
            $(`.site-logo-content[data-content="${tabId}"]`).addClass('active');
        });
    }

    /**
     * Initializes select buttons and preview area clicks.
     */
    function initSelectButtons() {
        Object.keys(selectButtonIdMap).forEach((bgType) => {
            // Select button click
            $(selectButtonIdMap[bgType]).on('click', (e) => {
                e.preventDefault();
                openMediaUploader(bgType);
            });

            // Preview area click (if not clicking on the image itself maybe?)
            // This makes the whole area clickable
             $(previewAreaIdMap[bgType]).on('click', (e) => {
                 // Prevent triggering if clicking the select button inside it
                 if (!$(e.target).is(selectButtonIdMap[bgType])) {
                    e.preventDefault();
                    openMediaUploader(bgType);
                 }
             });
        });
    }

    /**
     * Initializes save buttons.
     */
    function initSaveButtons() {
        Object.keys(saveButtonIdMap).forEach((bgType) => {
            $(saveButtonIdMap[bgType]).on('click', (e) => {
                e.preventDefault();
                saveLogoForBackground(bgType);
            });
        });
    }

    /**
     * Saves the selected logo for a specific background type via AJAX.
     * @param {string} bgType The background type.
     */
    function saveLogoForBackground(bgType) {
        const $container = $(containerIdMap[bgType]);
        const attachmentId = $container.data('attachment-id');
        const $saveButton = $(saveButtonIdMap[bgType]);

        if (!attachmentId) {
            showMessage(siteLogoUpdateData?.messages?.no_image || 'กรุณาเลือกรูปภาพก่อน', 'error');
            return;
        }

        // Show loading state
        $saveButton.prop('disabled', true).text(siteLogoUpdateData?.messages?.saving || 'กำลังบันทึก...');
        // Hide previous success banner if any
        $saveButton.next('.site-logo-success-banner').remove();

        // Send AJAX request
        $.ajax({
            url: siteLogoUpdateData.ajax_url,
            type: 'POST',
            dataType: 'json', // Expect JSON response
            data: {
                action: 'site_logo_update',
                attachment_id: attachmentId,
                nonce: siteLogoUpdateData.nonce,
                background_type: bgType
            },
            success: (response) => {
                 if (response && response.success) {
                     handleSaveSuccess(response, $saveButton, bgType);
                 } else {
                     // Pass potential error message from server
                     handleSaveError(response ? response.data : null, $saveButton);
                 }
            },
            error: (jqXHR, textStatus, errorThrown) => {
                 console.error("AJAX Error:", textStatus, errorThrown);
                 handleSaveError(`AJAX Error: ${errorThrown}`, $saveButton);
            }
            // No 'complete' needed as state is handled in success/error
        });
    }

    /**
     * Initializes drag and drop functionality for all preview areas.
     */
    function initDragAndDrop() {
        $('.site-logo-preview-area').each(function() {
            const $dropArea = $(this);
            // Determine bgType from data attribute or fallback to ID parsing
            const bgType = $dropArea.data('content') || $dropArea.attr('id')?.replace('site-logo-preview-', '');

            if (!bgType) {
                 console.warn('Could not determine background type for drop area:', $dropArea);
                 return; // Skip if bgType cannot be determined
            }

            // Prevent default behaviors and add highlight class
            $dropArea.on('dragenter dragover dragleave drop', preventDefaults);
            $dropArea.on('dragenter dragover', () => $dropArea.addClass('highlight'));
            $dropArea.on('dragleave drop', () => $dropArea.removeClass('highlight'));

            // Handle dropped files
            $dropArea.on('drop', (e) => {
                const dt = e.originalEvent?.dataTransfer; // Use optional chaining
                const files = dt?.files;
                if (files && files.length > 0) {
                    // Set the active tab before uploading via drop
                     $(`.site-logo-tab[data-tab="${bgType}"]`).trigger('click');
                    uploadFile(files[0], bgType); // Pass the determined bgType
                }
            });
        });
    }

    /**
     * Uploads a file using WordPress AJAX uploader.
     * @param {File} file The file object.
     * @param {string} bgType The background type to update after upload.
     */
    function uploadFile(file, bgType) {
        if (!file.type.match('image.*')) {
            showMessage(siteLogoUpdateData?.messages?.invalid_file || 'กรุณาอัพโหลดไฟล์รูปภาพเท่านั้น', 'error');
            return;
        }

        const formData = new FormData();
        // Use the standard 'upload-attachment' action if possible, requires nonce handling
        // Or use a custom action handler like in previous examples
        formData.append('action', 'upload-attachment'); // Standard WP action
        formData.append('_wpnonce', siteLogoUpdateData.upload_nonce || siteLogoUpdateData.nonce); // Use specific upload nonce if available
        formData.append('async-upload', file, file.name); // Provide filename

        const $dropArea = $(previewAreaIdMap[bgType]);
        $dropArea.addClass('loading'); // Show loading state on drop area
        showMessage(siteLogoUpdateData?.messages?.uploading || 'กำลังอัพโหลดรูปภาพ...', 'info');

        $.ajax({
            url: siteLogoUpdateData.ajax_url || ajaxurl || '/wp-admin/admin-ajax.php', // Ensure ajaxurl is defined
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'json', // Expect JSON response from 'upload-attachment'
            success: (response) => {
                if (response && response.success && response.data) {
                    // Check if response.data has needed properties
                    if (response.data.id && response.data.url) {
                        const attachment = {
                            id: response.data.id,
                            url: response.data.url
                            // Add other properties if needed: response.data.filename, etc.
                        };
                        updateLogoPreview(bgType, attachment);
                        showMessage(siteLogoUpdateData?.messages?.upload_success || 'อัพโหลดสำเร็จ', 'success');
                    } else {
                         console.error('Upload success response missing data.id or data.url:', response.data);
                         showMessage(siteLogoUpdateData?.messages?.upload_error || 'การอัพโหลดล้มเหลว (ข้อมูลไม่ครบถ้วน)', 'error');
                    }
                } else {
                    // Handle specific error message from response if available
                     const errorMsg = (response && response.data && response.data.message)
                                    ? response.data.message
                                    : (siteLogoUpdateData?.messages?.upload_error || 'การอัพโหลดล้มเหลว');
                    showMessage(errorMsg, 'error');
                }
                $dropArea.removeClass('loading');
            },
            error: (jqXHR, textStatus, errorThrown) => {
                console.error("Upload AJAX Error:", textStatus, errorThrown);
                showMessage(siteLogoUpdateData?.messages?.upload_error || 'เกิดข้อผิดพลาดระหว่างการอัพโหลด', 'error');
                $dropArea.removeClass('loading');
            }
        });
    }

    // --- Initial Setup ---

    initTabSwitching();
    initSelectButtons();
    initSaveButtons();
    initDragAndDrop();

    // Set existing logos on page load
    Object.keys(backgroundIdMap).forEach(bgType => {
        const logoUrl = siteLogoUpdateData[`${bgType}_logo_url`];
        const logoId = siteLogoUpdateData[`${bgType}_logo_id`];
        if (logoUrl && logoId) {
            updateLogoPreview(bgType, { id: logoId, url: logoUrl });
        }
    });

}); // End document ready
