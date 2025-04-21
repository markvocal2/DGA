/**
 * Changelog Form Functionality
 * Handles displaying changelog, adding copy buttons, toggling versions,
 * filtering, and submitting new entries via AJAX.
 * Refactored for clarity, efficiency, maintainability, and reduced nesting.
 * Version: 1.1.0
 */
jQuery(document).ready(function($) {
    // --- Cache DOM Elements ---
    const $changelogContainer = $('.changelog-container');
    const $changelogVersionsContainer = $('.changelog-versions'); // Container for all version blocks
    const $modalOverlay = $('.changelog-modal-overlay');
    const $changelogForm = $('#changelog-form');
    const $featuresContainer = $('.features-container');
    const $addFeatureBtn = $('#add-feature-btn');
    const $submitBtn = $changelogForm.find('.submit-btn'); // Cache submit button specifically
    const $versionInput = $('#version');
    const $dateInput = $('#date');
    const $expandAllBtn = $('.expand-all-btn');
    const $collapseAllBtn = $('.collapse-all-btn');
    const $updateChangelogBtn = $('.update-changelog-btn');
    const $closeModalBtns = $('.close-modal-btn, .cancel-btn');

    // --- Helper Functions (Level 2) ---

    /**
     * Get current post ID from various sources.
     * @returns {string|null} The post ID or null if not found.
     */
    function getCurrentPostId() {
        let postId = $changelogContainer.data('post-id');
        if (postId) return String(postId);

        const urlParams = new URLSearchParams(window.location.search);
        postId = urlParams.get('post');
        if (postId) return postId;

        const bodyClasses = document.body.className.split(' ');
        for (let i = 0; i < bodyClasses.length; i++) {
            if (bodyClasses[i].startsWith('postid-')) {
                return bodyClasses[i].substring(7);
            }
        }

        const canonicalLink = document.querySelector('link[rel="canonical"]');
        if (canonicalLink) {
            const href = canonicalLink.getAttribute('href');
            const match = href ? href.match(/\/(\d+)\/?$/) : null;
            if (match && match[1]) {
                return match[1];
            }
        }

        console.warn("Could not automatically determine post ID. Consider adding a data attribute or hidden field.");
        // Removed prompt for better UX in non-interactive scenarios
        // let manualPostId = prompt('ไม่สามารถระบุ ID ของโพสต์ได้โดยอัตโนมัติ กรุณาระบุ ID ของโพสต์:');
        // if (manualPostId && !isNaN(parseInt(manualPostId))) {
        //     return String(parseInt(manualPostId));
        // }

        console.error("Failed to get Post ID.");
        return null;
    }

    /**
     * Format date string (YYYY-MM-DD) to Thai locale string.
     * @param {string} dateString - The date string (YYYY-MM-DD).
     * @returns {string} Formatted date string.
     */
    function formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                console.warn(`Invalid date string provided to formatDate: ${dateString}`);
                return dateString;
            }
            const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Bangkok' };
            return new Intl.DateTimeFormat('th-TH', options).format(date);
        } catch (e) {
            console.warn("Error formatting date with Intl API. Using basic fallback.", e);
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
            const day = date.getDate();
            const month = months[date.getMonth()];
            const year = date.getFullYear() + 543;
            return `${day} ${month} ${year}`;
        }
    }

    /**
     * Escapes HTML special characters.
     * @param {string} str - The string to escape.
     * @returns {string} The escaped string.
     */
    function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        const inputStr = String(str);
        return inputStr
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Provides visual feedback on a button after an action (e.g., copy).
     * @param {jQuery} $button - The button element.
     * @param {boolean} success - Whether the action was successful.
     */
    function provideButtonFeedback($button, success) {
        if (!$button || !$button.length) return;
        const originalText = $button.data('original-text') || $button.text(); // Store original text if not already stored
        $button.data('original-text', originalText); // Store it
        const originalBg = $button.data('original-bg') || $button.css('background-color');
        $button.data('original-bg', originalBg);

        $button.prop('disabled', true); // Briefly disable during feedback

        if (success) {
            $button.text('Copied!');
            $button.css('background-color', '#10b981'); // Success green
        } else {
            $button.text('Failed!');
            $button.css('background-color', '#ef4444'); // Error red
        }

        setTimeout(() => {
            $button.text(originalText);
            $button.css('background-color', originalBg);
            $button.prop('disabled', false); // Re-enable
            // Clean up stored data
            $button.removeData('original-text');
            $button.removeData('original-bg');
        }, 2000);
    }

    /**
     * Legacy method to copy text using execCommand (fallback).
     * @param {string} text - The text to copy.
     * @param {jQuery} $button - The button element for feedback.
     */
    function execCopyToClipboard(text, $button) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);

        const selected = document.getSelection().rangeCount > 0 ? document.getSelection().getRangeAt(0) : false;
        let success = false;

        try {
            textarea.select();
            success = document.execCommand('copy');
            if (!success) console.error('Fallback execCommand failed.');
        } catch (err) {
            console.error('Fallback execCommand error: ', err);
            success = false;
        }

        document.body.removeChild(textarea);

        if (selected) {
            document.getSelection().removeAllRanges();
            document.getSelection().addRange(selected);
        }

        provideButtonFeedback($button, success); // Use the feedback helper
    }

    /**
     * Copy text to the user's clipboard using modern Clipboard API with fallback.
     * @param {string} text - The text to copy.
     * @param {jQuery} $button - The button element for feedback.
     */
    function copyToClipboard(text, $button) {
        if (!text) return;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => provideButtonFeedback($button, true)) // Level 3 (callback)
                .catch(err => { // Level 3 (callback)
                    console.error('Async Clipboard API failed: ', err);
                    execCopyToClipboard(text, $button); // Fallback
                });
        } else {
            console.warn('Clipboard API not available, using fallback execCommand.');
            execCopyToClipboard(text, $button);
        }
    }

    /**
     * Handles the click event for a copy button.
     * @param {Event} e - The click event object.
     */
    function handleCopyButtonClick(e) { // Level 3 (event handler)
        const $button = $(e.currentTarget);
        const $pre = $button.closest('pre');
        const $code = $pre.find('code');
        if ($code.length) {
            const codeToCopy = $code.text();
            copyToClipboard(codeToCopy, $button);
        }
    }

    /**
     * Adds "Copy" buttons to specified <pre> elements.
     * @param {jQuery} $preElements - jQuery object containing the <pre> elements.
     */
    function initializeCopyButtons($preElements) { // Level 2
        $preElements.each(function() { // Level 3 (callback)
            const $pre = $(this);
            if ($pre.find('.copy-code-button').length > 0) return; // Skip if button exists
            const $code = $pre.find('code');
            if (!$code.length) return; // Skip if no <code>

            const $button = $('<button class="copy-code-button" title="Copy code snippet">Copy</button>');
            $pre.css('position', 'relative');
            $button.css({
                'position': 'absolute', 'top': '5px', 'right': '5px',
                'padding': '3px 8px', 'fontSize': '0.8em', 'backgroundColor': '#1e3a8a',
                'color': 'white', 'border': 'none', 'borderRadius': '3px',
                'cursor': 'pointer', 'opacity': '0.8', 'transition': 'opacity 0.2s ease'
            });

            // Use named handler
            $button.on('click', handleCopyButtonClick); // Level 4 (attaching handler)

            // Keep hover effects simple
            $pre.on('mouseenter', () => $button.css('opacity', '1')); // Level 4
            $pre.on('mouseleave', () => $button.css('opacity', '0.8')); // Level 4

            $pre.append($button);
        });
    }

    /**
      * Toggles the display of a single version's content.
      * @param {Event} e - The click event object.
      */
    function handleVersionHeaderClick(e) { // Level 3 (event handler)
        const $header = $(e.currentTarget);
        const $content = $header.next('.version-content');
        $content.slideToggle(300);
        $header.toggleClass('version-header-collapsed');
        $header.css('border-left-color', $header.hasClass('version-header-collapsed') ? '#f97316' : '#1e40af');
    }

    /**
     * Sets up toggle functionality for version headers and content.
     */
    function initializeVersionToggles() { // Level 2
        $changelogVersionsContainer.find('.version-content').hide();
        $changelogVersionsContainer.find('.version-header').addClass('version-header-collapsed').css('border-left-color', '#f97316');

        const $firstVersion = $changelogVersionsContainer.find('.changelog-version:first');
        $firstVersion.find('.version-content').show();
        $firstVersion.find('.version-header').removeClass('version-header-collapsed').css('border-left-color', '#1e40af');

        // Event delegation using named handler
        $changelogVersionsContainer.on('click', '.version-header', handleVersionHeaderClick); // Level 3 (attaching handler)

        $expandAllBtn.on('click', function() { // Level 3 (callback)
            $changelogVersionsContainer.find('.version-content').slideDown(300);
            $changelogVersionsContainer.find('.version-header').removeClass('version-header-collapsed').css('border-left-color', '#1e40af');
        });

        $collapseAllBtn.on('click', function() { // Level 3 (callback)
            $changelogVersionsContainer.find('.version-content').slideUp(300);
            $changelogVersionsContainer.find('.version-header').addClass('version-header-collapsed').css('border-left-color', '#f97316');
        });
    }

    /**
     * Checks if a version entry matches the filter text.
     * @param {jQuery} $version - The jQuery object for the version div.
     * @param {string} filterText - The lowercase filter text.
     * @returns {boolean} True if it matches, false otherwise.
     */
    function versionMatchesFilter($version, filterText) { // Level 4 (helper for filter handler)
        const versionText = $version.find('.version-number').text().toLowerCase();
        if (versionText.includes(filterText)) {
            return true;
        }
        // Check feature titles
        const featureTitles = $version.find('.feature-title').map(function() { // Level 5 (map callback)
            return $(this).text().toLowerCase();
        }).get();
        return featureTitles.some(title => title.includes(filterText)); // Level 5 (some callback)
    }

    /**
     * Handles the input event for the filter field.
     * @param {Event} e - The input event object.
     */
    function handleFilterInput(e) { // Level 4 (event handler)
        const filterText = $(e.currentTarget).val().toLowerCase().trim();
        const $versions = $changelogVersionsContainer.find('.changelog-version');

        $versions.each(function() { // Level 5 (each callback)
            const $version = $(this);
            const isMatch = versionMatchesFilter($version, filterText); // Call helper

            if (isMatch) {
                $version.show();
                if (filterText.length > 0) { // Auto-expand matching when filtering
                    const $header = $version.find('.version-header');
                    $version.find('.version-content').slideDown(150);
                    $header.removeClass('version-header-collapsed').css('border-left-color', '#1e40af');
                }
            } else {
                $version.hide();
            }
        });
    }

    /**
     * Initializes the version filtering input if needed.
     */
    function initializeFiltering() { // Level 2
        const $versions = $changelogVersionsContainer.find('.changelog-version');
        if ($versions.length > 5) { // Level 3
            const $filterContainer = $('<div class="changelog-filter"></div>').css({
                'padding': '10px 30px', 'backgroundColor': '#f8fafc',
                'borderBottom': '1px solid #e5e7eb', 'marginBottom': '10px'
            });
            const $filterInput = $('<input type="text" placeholder="Filter by version or feature...">').css({
                'width': '100%', 'padding': '8px 12px', 'border': '1px solid #e2e8f0',
                'borderRadius': '4px', 'boxSizing': 'border-box'
            });

            $filterContainer.append($filterInput);
            $('.changelog-controls').after($filterContainer);

            // Use named handler
            $filterInput.on('input', handleFilterInput); // Level 4 (attaching handler)
        }
    }

     /**
     * Creates the HTML for a single feature.
     * @param {object} feature - Feature data {title, text, code_content, code_language}.
     * @returns {string} HTML string for the feature.
     */
    function createFeatureHTML(feature) { // Level 3 (helper for DOM update)
        if (!feature || !feature.title) return '';
        const title = escapeHTML(feature.title);
        const text = feature.text ? `<p>${escapeHTML(feature.text)}</p>` : '';
        const code = feature.code_content ?
            `<pre><code class="language-${escapeHTML(feature.code_language || 'markup')}">${escapeHTML(feature.code_content)}</code></pre>` : '';
        return `
            <div class="changelog-feature">
                <h3 class="feature-title">${title}</h3>
                <div class="feature-content">
                    ${text}
                    ${code}
                </div>
            </div>`;
    }

    /**
     * Manually updates the DOM to display the new changelog entry.
     * @param {string} version - The version number.
     * @param {string} date - The formatted date string.
     * @param {Array} features - Array of feature objects.
     */
    function updateChangelogDOM(version, date, features) { // Level 2
        if (!version || !date || !Array.isArray(features)) return;

        // Use helper to create feature HTML
        const featuresHTML = features.map(createFeatureHTML).join(''); // Level 3 (map callback uses helper)

        if (!featuresHTML) return;

        const versionHTML = `
            <div class="changelog-version" style="display: none;">
                <div class="version-header version-header-collapsed" style="border-left-color: #f97316;">
                    <span class="version-number">Version ${escapeHTML(version)}</span>
                    <span class="version-date">${escapeHTML(date)}</span>
                </div>
                <div class="version-content" style="display: none;">
                    ${featuresHTML}
                </div>
            </div>`;

        const $newVersion = $(versionHTML).prependTo($changelogVersionsContainer).slideDown(400);

        if (typeof Prism !== 'undefined') { // Level 3
            try { // Level 4
                Prism.highlightAllUnder($newVersion.find('.version-content')[0]);
            } catch(e) {
                console.error("Prism highlighting failed for new entry:", e);
            }
        }

        initializeCopyButtons($newVersion.find('pre')); // Level 3

        // Add toggle functionality using the named handler
        $newVersion.find('.version-header').on('click', handleVersionHeaderClick); // Level 3 (attaching handler)

        // Expand the newly added version
        const $newHeader = $newVersion.find('.version-header');
        $newHeader.next('.version-content').slideDown(0);
        $newHeader.removeClass('version-header-collapsed').css('border-left-color', '#1e40af');
    }

    /**
     * Shows a simple non-blocking notification.
     * Replace with a more robust library (like Toastr) if available.
     * @param {string} message - The message to display.
     * @param {'success'|'error'|'warning'} type - The type of notification.
     */
    function showNotification(message, type = 'info') { // Level 2
        // Basic implementation - consider a dedicated library
        const $notification = $('<div class="changelog-notification"></div>')
            .text(message)
            .css({
                'position': 'fixed', 'bottom': '20px', 'right': '20px',
                'padding': '15px 20px', 'borderRadius': '5px', 'color': 'white',
                'zIndex': '10000', 'opacity': '0', 'transition': 'opacity 0.3s ease',
                'boxShadow': '0 2px 10px rgba(0,0,0,0.2)'
            });

        let bgColor = '#3b82f6'; // Default info blue
        if (type === 'success') bgColor = '#10b981'; // Green
        if (type === 'error') bgColor = '#ef4444'; // Red
        if (type === 'warning') bgColor = '#f59e0b'; // Amber

        $notification.css('background-color', bgColor);
        $('body').append($notification);

        // Fade in
        setTimeout(() => $notification.css('opacity', '1'), 50); // Short delay for transition

        // Fade out and remove
        setTimeout(() => { // Level 3
            $notification.css('opacity', '0');
            setTimeout(() => $notification.remove(), 350); // Level 4
        }, 4000); // Display for 4 seconds
    }


    // --- Modal and Form Event Handlers (Level 2 Callbacks/Handlers) ---

    function handleOpenModalClick() { // Level 2 (event handler)
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        $dateInput.val(`${yyyy}-${mm}-${dd}`);

        $versionInput.val('');
        $featuresContainer.html('');
        $addFeatureBtn.trigger('click'); // Add one initial feature item
        $versionInput.focus();

        $modalOverlay.css('display', 'flex');
        $('body').addClass('modal-open');
    }

    function handleCloseModalClick() { // Level 2 (event handler)
        $modalOverlay.hide();
        $('body').removeClass('modal-open');
    }

    function handleOverlayClick(e) { // Level 2 (event handler)
        if (e.target === this) {
            handleCloseModalClick(); // Reuse close logic
        }
    }

    function handleAddFeatureClick() { // Level 2 (event handler)
        const featureTemplate = `
            <div class="feature-item" style="border: 1px solid #e5e7eb; border-radius: 4px; padding: 15px; margin-bottom: 15px; background-color: #fff;">
                <div class="form-group" style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">หัวข้อ Feature <span style="color:red;">*</span></label>
                    <input type="text" class="feature-title" name="feature_title[]" placeholder="เช่น ปรับปรุงหน้า Dashboard" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;" required>
                </div>
                <div class="form-group" style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px;">รายละเอียด</label>
                    <textarea class="feature-text" name="feature_text[]" rows="3" placeholder="อธิบายรายละเอียดการเปลี่ยนแปลง (ถ้ามี)" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;"></textarea>
                </div>
                <div class="form-group code-group" style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px;">ตัวอย่างโค้ด (ถ้ามี)</label>
                    <select class="code-language" name="code_language[]" style="margin-bottom: 5px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; max-width: 150px;">
                        <option value="javascript">JavaScript</option> <option value="php">PHP</option> <option value="html">HTML</option>
                        <option value="css">CSS</option> <option value="sql">SQL</option> <option value="bash">Bash/Shell</option>
                        <option value="python">Python</option> <option value="markup">Markup</option>
                    </select>
                    <textarea class="code-content" name="code_content[]" rows="5" placeholder="// เพิ่มโค้ดตัวอย่างที่นี่" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; box-sizing: border-box; margin-top: 5px;"></textarea>
                </div>
                <button type="button" class="remove-feature-btn" style="background-color: #f97316; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer; font-size: 0.9em;">ลบรายการนี้</button>
            </div>`;
        $featuresContainer.append(featureTemplate);
    }

    function handleRemoveFeatureClick(e) { // Level 2 (event handler)
        const $button = $(e.currentTarget);
        if ($featuresContainer.find('.feature-item').length > 1) {
            $button.closest('.feature-item').fadeOut(300, function() { $(this).remove(); }); // Level 3 (callback)
        } else {
            showNotification('ต้องมี Feature อย่างน้อย 1 รายการ', 'warning');
        }
    }

    // --- AJAX Handlers ---

    function handleAjaxSuccess(response, version, displayDate, features) { // Level 4 (AJAX callback)
        if (response.success) {
            showNotification('บันทึก Changelog เรียบร้อยแล้ว', 'success');
            $changelogForm[0].reset();
            $featuresContainer.html('');
            $addFeatureBtn.trigger('click');
            handleCloseModalClick(); // Close modal

            if (response.data?.reload) {
                location.reload();
            } else {
                updateChangelogDOM(version, displayDate, features); // Manual update
            }
        } else {
            showNotification('เกิดข้อผิดพลาด: ' + (response.data?.message || 'ไม่สามารถบันทึกข้อมูลได้'), 'error');
        }
    }

    function handleAjaxError(xhr, status, error) { // Level 4 (AJAX callback)
        console.error("AJAX Error:", status, error, xhr.responseText);
        showNotification('เกิดข้อผิดพลาดในการติดต่อกับเซิร์ฟเวอร์', 'error');
    }

    function handleAjaxComplete(originalBtnText) { // Level 4 (AJAX callback)
        $submitBtn.prop('disabled', false).text(originalBtnText);
    }

    /**
     * Gathers and validates feature data from the form.
     * @returns {Array|null} Array of feature objects or null if validation fails.
     */
    function getAndValidateFeatures() { // Level 3 (helper for submit)
        const features = [];
        let isValid = true;
        $featuresContainer.find('.feature-item').each(function() { // Level 4 (callback)
            const $item = $(this);
            const title = $item.find('.feature-title').val().trim();
            const text = $item.find('.feature-text').val().trim();
            const codeLanguage = $item.find('.code-language').val();
            const codeContent = $item.find('.code-content').val().trim();

            if (!title) {
                showNotification('กรุณาระบุหัวข้อสำหรับ Feature ทุกรายการ', 'error');
                $item.find('.feature-title').css('border-color', 'red').focus();
                isValid = false;
                return false; // Stop .each loop
            } else {
                 $item.find('.feature-title').css('border-color', '#ddd');
            }

            features.push({ title, text, code_language: codeLanguage, code_content: codeContent });
        });

        if (!isValid) return null;

        if (features.length === 0) {
            showNotification('กรุณาเพิ่ม Feature อย่างน้อย 1 รายการ', 'error');
            return null;
        }
        return features;
    }


    function handleChangelogFormSubmit(e) { // Level 2 (event handler)
        e.preventDefault();
        const originalBtnText = $submitBtn.text();
        $submitBtn.prop('disabled', true).html('<span class="spinner"></span> กำลังบันทึก...');

        const postId = getCurrentPostId();
        const version = $versionInput.val().trim();
        let date = $dateInput.val(); // YYYY-MM-DD

        // --- Validation ---
        if (!postId) {
            showNotification('ไม่พบ ID ของโพสต์', 'error');
            handleAjaxComplete(originalBtnText); // Reset button
            return;
        }
        if (!version) {
            showNotification('กรุณาระบุเวอร์ชัน', 'error');
            $versionInput.focus();
            handleAjaxComplete(originalBtnText); // Reset button
            return;
        }
        if (!date) { // Should have default, but double-check
             const today = new Date();
             date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
             console.warn("Date was empty, defaulting to today:", date);
        }

        const displayDate = formatDate(date);
        const features = getAndValidateFeatures(); // Use helper

        if (!features) { // Validation failed within helper
            handleAjaxComplete(originalBtnText); // Reset button
            return;
        }

        // --- AJAX Prep ---
        if (typeof changelogParams === 'undefined' || !changelogParams.ajaxUrl || !changelogParams.nonce) {
            showNotification('เกิดข้อผิดพลาด: ไม่พบข้อมูลการตั้งค่า (changelogParams)', 'error');
            console.error("changelogParams object with ajaxUrl and nonce is required.");
            handleAjaxComplete(originalBtnText); // Reset button
            return;
        }

        const formData = {
            action: 'save_changelog', nonce: changelogParams.nonce, post_id: postId,
            version: version, date: displayDate, features: features
        };

        // --- Perform AJAX Request ---
        $.ajax({ // Level 3
            url: changelogParams.ajaxUrl, type: 'POST', data: formData, dataType: 'json',
            success: function(response) { // Level 4 (callback)
                handleAjaxSuccess(response, version, displayDate, features);
            },
            error: handleAjaxError, // Level 4 (named handler)
            complete: function() { // Level 4 (callback)
                 handleAjaxComplete(originalBtnText);
            }
        });
    }


    // --- Initialization ---

    // Initialize Prism.js
    if (typeof Prism !== 'undefined') { // Level 2
        try { Prism.highlightAll(); } catch (e) { console.error("Prism.js failed:", e); } // Level 3
    } else { console.warn("Prism.js not found."); }

    // Add initial copy buttons
    initializeCopyButtons($changelogContainer.find('.changelog-feature pre')); // Level 2

    // Initialize version toggles
    initializeVersionToggles(); // Level 2

    // Initialize filtering
    initializeFiltering(); // Level 2

    // --- Attach Event Handlers ---
    $updateChangelogBtn.on('click', handleOpenModalClick); // Level 2
    $closeModalBtns.on('click', handleCloseModalClick); // Level 2
    $modalOverlay.on('click', handleOverlayClick); // Level 2
    $addFeatureBtn.on('click', handleAddFeatureClick); // Level 2
    $featuresContainer.on('click', '.remove-feature-btn', handleRemoveFeatureClick); // Level 2 (delegated)
    $changelogForm.on('submit', handleChangelogFormSubmit); // Level 2

}); // End jQuery(document).ready
