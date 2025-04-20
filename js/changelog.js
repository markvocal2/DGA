/**
 * Changelog Form Functionality
 * Handles displaying changelog, adding copy buttons, toggling versions,
 * filtering, and submitting new entries via AJAX.
 * Refactored for clarity, efficiency, and maintainability.
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

    // --- Initialization ---

    // Initialize Prism.js for syntax highlighting if available
    if (typeof Prism !== 'undefined') {
        try {
            Prism.highlightAll();
        } catch (e) {
            console.error("Prism.js highlighting failed:", e);
        }
    } else {
        console.warn("Prism.js not found. Syntax highlighting disabled.");
    }

    // Add copy buttons to existing code blocks on page load
    initializeCopyButtons($changelogContainer.find('.changelog-feature pre'));

    // Initialize version toggles and default state
    initializeVersionToggles();

    // Initialize filtering if needed
    initializeFiltering();

    // --- Helper Functions ---

    /**
     * Get current post ID from various sources (URL, body class, canonical).
     * Includes a prompt fallback which is generally discouraged.
     * @returns {string|null} The post ID or null if not found.
     */
    function getCurrentPostId() {
        // Try container data attribute first (added for potential flexibility)
        let postId = $changelogContainer.data('post-id');
        if (postId) return String(postId);

        // Try URL parameter 'post'
        const urlParams = new URLSearchParams(window.location.search);
        postId = urlParams.get('post');
        if (postId) return postId;

        // Try body class 'postid-X'
        const bodyClasses = document.body.className.split(' ');
        for (let i = 0; i < bodyClasses.length; i++) {
            if (bodyClasses[i].startsWith('postid-')) {
                return bodyClasses[i].substring(7); // 'postid-'.length
            }
        }

        // Try canonical link URL structure (e.g., /path/to/123/)
        const canonicalLink = document.querySelector('link[rel="canonical"]');
        if (canonicalLink) {
            const href = canonicalLink.getAttribute('href');
            const match = href ? href.match(/\/(\d+)\/?$/) : null;
            if (match && match[1]) {
                return match[1];
            }
        }

        // Fallback: Prompt the user (Consider replacing with a hidden field or better method)
        console.warn("Could not automatically determine post ID. Falling back to prompt.");
        // Use let as it might be reassigned
        let manualPostId = prompt('ไม่สามารถระบุ ID ของโพสต์ได้โดยอัตโนมัติ กรุณาระบุ ID ของโพสต์:');
        if (manualPostId && !isNaN(parseInt(manualPostId))) {
            return String(parseInt(manualPostId));
        }

        console.error("Failed to get Post ID.");
        return null; // Return null if no ID could be found
    }

    /**
     * Format date string (YYYY-MM-DD) to Thai locale string (e.g., "21 เมษายน 2568").
     * Includes a basic fallback if Intl API or 'th-TH' locale is not supported.
     * @param {string} dateString - The date string (YYYY-MM-DD).
     * @returns {string} Formatted date string.
     */
    function formatDate(dateString) {
        if (!dateString) return ''; // Handle empty input

        try {
            const date = new Date(dateString);
            // Check if date is valid
            if (isNaN(date.getTime())) {
                console.warn(`Invalid date string provided to formatDate: ${dateString}`);
                return dateString; // Return original string if invalid
            }
            // Use Intl API for robust localization
            const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Bangkok' }; // Specify timezone
            return new Intl.DateTimeFormat('th-TH', options).format(date);
        } catch (e) {
            console.warn("Error formatting date with Intl API (locale 'th-TH' might be unsupported). Using basic fallback.", e);
            // Basic fallback (less reliable for localization)
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
            const day = date.getDate();
            const month = months[date.getMonth()];
            const year = date.getFullYear() + 543; // Convert to Buddhist Era for fallback
            return `${day} ${month} ${year}`;
        }
    }

    /**
     * Escapes HTML special characters to prevent XSS attacks when inserting into DOM.
     * @param {string} str - The string to escape.
     * @returns {string} The escaped string.
     */
    function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        // Ensure input is a string
        const inputStr = String(str);
        return inputStr
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Copy text to the user's clipboard using modern Clipboard API with fallback.
     * @param {string} text - The text to copy.
     * @param {jQuery} $button - The jQuery object for the button clicked, for feedback.
     */
    function copyToClipboard(text, $button) {
        if (!text) return;

        function provideFeedback(success) {
            if (!$button || !$button.length) return; // Ensure button exists
            const originalText = $button.text();
            const originalBg = $button.css('background-color');
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
            }, 2000);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                provideFeedback(true);
            }).catch(err => {
                console.error('Async Clipboard API failed: ', err);
                // Attempt fallback only if Clipboard API itself failed
                execCopyToClipboard(text, $button);
            });
        } else {
            console.warn('Clipboard API not available, using fallback execCommand.');
            execCopyToClipboard(text, $button);
        }
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
        let success = false; // Flag to track success

        try {
            textarea.select();
            success = document.execCommand('copy');
            if (!success) {
                console.error('Fallback execCommand failed.');
            }
        } catch (err) {
            console.error('Fallback execCommand error: ', err);
            success = false;
        }

        document.body.removeChild(textarea);

        if (selected) {
            document.getSelection().removeAllRanges();
            document.getSelection().addRange(selected);
        }

        // Provide feedback based on the success flag
        function provideFeedback(success) {
             if (!$button || !$button.length) return; // Ensure button exists
             const originalText = $button.text();
             const originalBg = $button.css('background-color');
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
             }, 2000);
         }
         provideFeedback(success);
    }


    /**
     * Adds "Copy" buttons to specified <pre> elements.
     * @param {jQuery} $preElements - jQuery object containing the <pre> elements.
     */
    function initializeCopyButtons($preElements) {
        $preElements.each(function() {
            const $pre = $(this);
            // Ensure button isn't added multiple times
            if ($pre.find('.copy-code-button').length > 0) {
                return; // Skip if button already exists
            }
            const $code = $pre.find('code');
            if (!$code.length) return; // Skip if no <code> tag found

            const $button = $('<button class="copy-code-button" title="Copy code snippet">Copy</button>');

            // Style button and position container
            $pre.css('position', 'relative'); // Needed for absolute positioning of button
            $button.css({ // Basic styling, adjust in CSS file preferably
                'position': 'absolute',
                'top': '5px',
                'right': '5px',
                'padding': '3px 8px',
                'fontSize': '0.8em',
                'backgroundColor': '#1e3a8a', // Example blue
                'color': 'white',
                'border': 'none',
                'borderRadius': '3px',
                'cursor': 'pointer',
                'opacity': '0.8',
                'transition': 'opacity 0.2s ease'
            });
            $pre.on('mouseenter', function() { $button.css('opacity', '1'); });
            $pre.on('mouseleave', function() { $button.css('opacity', '0.8'); });


            $pre.append($button);

            $button.on('click', function() {
                const codeToCopy = $code.text();
                copyToClipboard(codeToCopy, $button); // Pass button for feedback
            });
        });
    }

    /**
     * Sets up toggle functionality for version headers and content.
     */
    function initializeVersionToggles() {
        // Hide content and set initial state
        $changelogVersionsContainer.find('.version-content').hide();
        $changelogVersionsContainer.find('.version-header').addClass('version-header-collapsed').css('border-left-color', '#f97316'); // Orange border when collapsed

        // Show the first version by default
        const $firstVersion = $changelogVersionsContainer.find('.changelog-version:first');
        $firstVersion.find('.version-content').show();
        $firstVersion.find('.version-header').removeClass('version-header-collapsed').css('border-left-color', '#1e40af'); // Blue border when expanded

        // Event delegation for toggling individual versions
        $changelogVersionsContainer.on('click', '.version-header', function() {
            const $header = $(this);
            const $content = $header.next('.version-content');
            $content.slideToggle(300);
            $header.toggleClass('version-header-collapsed');
            $header.css('border-left-color', $header.hasClass('version-header-collapsed') ? '#f97316' : '#1e40af');
        });

        // Expand/collapse all buttons
        $('.expand-all-btn').on('click', function() {
            $changelogVersionsContainer.find('.version-content').slideDown(300);
            $changelogVersionsContainer.find('.version-header').removeClass('version-header-collapsed').css('border-left-color', '#1e40af');
        });

        $('.collapse-all-btn').on('click', function() {
            $changelogVersionsContainer.find('.version-content').slideUp(300);
            $changelogVersionsContainer.find('.version-header').addClass('version-header-collapsed').css('border-left-color', '#f97316');
        });
    }

    /**
     * Initializes the version filtering input if there are enough versions.
     */
    function initializeFiltering() {
        const $versions = $changelogVersionsContainer.find('.changelog-version');
        if ($versions.length > 5) { // Only add filter if more than 5 versions
            const $filterContainer = $('<div class="changelog-filter"></div>').css({
                'padding': '10px 30px',
                'backgroundColor': '#f8fafc',
                'borderBottom': '1px solid #e5e7eb',
                'marginBottom': '10px' // Add some space below
            });
            const $filterInput = $('<input type="text" placeholder="Filter by version or feature...">').css({
                'width': '100%',
                'padding': '8px 12px',
                'border': '1px solid #e2e8f0',
                'borderRadius': '4px',
                'boxSizing': 'border-box' // Include padding and border in width
            });

            $filterContainer.append($filterInput);
            $('.changelog-controls').after($filterContainer); // Place filter after control buttons

            $filterInput.on('input', function() {
                const filterText = $(this).val().toLowerCase().trim();

                $versions.each(function() {
                    const $version = $(this);
                    const versionText = $version.find('.version-number').text().toLowerCase();
                    const featureTitles = $version.find('.feature-title').map(function() {
                        return $(this).text().toLowerCase();
                    }).get(); // Get as an array of strings

                    let isMatch = versionText.includes(filterText);
                    if (!isMatch) {
                        isMatch = featureTitles.some(title => title.includes(filterText));
                    }

                    if (isMatch) {
                        $version.show();
                        // Auto-expand matching versions when filtering actively
                        if (filterText.length > 0) {
                            const $header = $version.find('.version-header');
                            $version.find('.version-content').slideDown(150); // Faster slide for filtering
                            $header.removeClass('version-header-collapsed').css('border-left-color', '#1e40af');
                        }
                    } else {
                        $version.hide();
                    }
                });
            });
        }
    }

    /**
     * Manually updates the DOM to display the new changelog entry.
     * @param {string} version - The version number.
     * @param {string} date - The formatted date string.
     * @param {Array} features - Array of feature objects.
     */
    function updateChangelogDOM(version, date, features) {
        if (!version || !date || !Array.isArray(features)) return;

        // Create feature HTML strings
        const featuresHTML = features.map(feature => {
            if (!feature || !feature.title) return ''; // Skip invalid features
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
        }).join('');

        if (!featuresHTML) return; // Don't add if no valid features were processed

        // Create the new version entry HTML
        const versionHTML = `
            <div class="changelog-version" style="display: none;"> <div class="version-header version-header-collapsed" style="border-left-color: #f97316;">
                    <span class="version-number">Version ${escapeHTML(version)}</span>
                    <span class="version-date">${escapeHTML(date)}</span>
                </div>
                <div class="version-content" style="display: none;">
                    ${featuresHTML}
                </div>
            </div>`;

        // Prepend the new version and fade it in
        const $newVersion = $(versionHTML).prependTo($changelogVersionsContainer).slideDown(400);

        // Apply syntax highlighting to the new block
        if (typeof Prism !== 'undefined') {
            try {
                Prism.highlightAllUnder($newVersion.find('.version-content')[0]);
            } catch(e) {
                 console.error("Prism highlighting failed for new entry:", e);
            }
        }

        // Add copy buttons to the new code blocks
        initializeCopyButtons($newVersion.find('pre'));

        // Add toggle functionality to the new header
        $newVersion.find('.version-header').on('click', function() {
            const $header = $(this);
            const $content = $header.next('.version-content');
            $content.slideToggle(300);
            $header.toggleClass('version-header-collapsed');
            $header.css('border-left-color', $header.hasClass('version-header-collapsed') ? '#f97316' : '#1e40af');
        });

        // Expand the newly added version by default
        const $newHeader = $newVersion.find('.version-header');
        $newHeader.next('.version-content').slideDown(0); // Show immediately
        $newHeader.removeClass('version-header-collapsed').css('border-left-color', '#1e40af');

    }


    // --- Modal and Form Event Handlers ---

    // Show modal button
    $('.update-changelog-btn').on('click', function() {
        // Set today's date as default in YYYY-MM-DD format for the input type="date"
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        $dateInput.val(`${yyyy}-${mm}-${dd}`);

        // Reset form fields (except date) and features
        $versionInput.val('');
        $featuresContainer.html(''); // Clear previous features
        $addFeatureBtn.trigger('click'); // Add one initial feature item
        $versionInput.focus(); // Focus version field

        $modalOverlay.css('display', 'flex'); // Show modal using flex
        $('body').addClass('modal-open'); // Prevent body scroll
    });

    // Close modal buttons
    $('.close-modal-btn, .cancel-btn').on('click', function() {
        $modalOverlay.hide();
        $('body').removeClass('modal-open');
    });

    // Close modal on overlay click
    $modalOverlay.on('click', function(e) {
        if (e.target === this) { // Only close if the overlay itself is clicked
            $modalOverlay.hide();
            $('body').removeClass('modal-open');
        }
    });

    // Add new feature button within the modal form
    $addFeatureBtn.on('click', function() {
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
                        <option value="javascript">JavaScript</option>
                        <option value="php">PHP</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="sql">SQL</option>
                        <option value="bash">Bash/Shell</option>
                        <option value="python">Python</option>
                        <option value="markup">Markup</option> </select>
                    <textarea class="code-content" name="code_content[]" rows="5" placeholder="// เพิ่มโค้ดตัวอย่างที่นี่" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; box-sizing: border-box; margin-top: 5px;"></textarea>
                </div>
                <button type="button" class="remove-feature-btn" style="background-color: #f97316; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer; font-size: 0.9em;">ลบรายการนี้</button>
            </div>`;
        $featuresContainer.append(featureTemplate);
    });

    // Remove feature button (using event delegation)
    $featuresContainer.on('click', '.remove-feature-btn', function() {
        if ($featuresContainer.find('.feature-item').length > 1) {
            $(this).closest('.feature-item').fadeOut(300, function() { $(this).remove(); });
        } else {
            // Replace alert with a non-blocking notification
            // alert('ต้องมีคุณสมบัติอย่างน้อย 1 รายการ');
            showNotification('ต้องมี Feature อย่างน้อย 1 รายการ', 'warning'); // Example using showNotification
        }
    });

    // Handle Form Submission (AJAX)
    $changelogForm.on('submit', function(e) {
        e.preventDefault();

        const originalBtnText = $submitBtn.text();
        $submitBtn.prop('disabled', true).html('<span class="spinner"></span> กำลังบันทึก...'); // Use html for spinner

        // --- Form Data Collection and Validation ---
        const postId = getCurrentPostId(); // Get Post ID using helper
        const version = $versionInput.val().trim();
        let date = $dateInput.val(); // YYYY-MM-DD format

        if (!postId) {
            // Replace alert with a non-blocking notification
            // alert('ไม่พบ ID ของโพสต์ กรุณาลองอัพเดตหน้าเว็บและลองอีกครั้ง');
            showNotification('ไม่พบ ID ของโพสต์ กรุณาลองอัพเดตหน้าเว็บและลองอีกครั้ง', 'error');
            $submitBtn.prop('disabled', false).text(originalBtnText);
            return;
        }

        if (!version) {
            // Replace alert with a non-blocking notification
            // alert('กรุณาระบุเวอร์ชัน');
            showNotification('กรุณาระบุเวอร์ชัน', 'error');
            $versionInput.focus();
            $submitBtn.prop('disabled', false).text(originalBtnText);
            return;
        }

        if (!date) { // Should have default, but double-check
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            date = `${yyyy}-${mm}-${dd}`;
            console.warn("Date was empty, defaulting to today:", date);
        }

        const displayDate = formatDate(date); // Format date for display and saving

        const features = [];
        let hasEmptyTitle = false;
        $featuresContainer.find('.feature-item').each(function() {
            const $item = $(this);
            const title = $item.find('.feature-title').val().trim();
            const text = $item.find('.feature-text').val().trim();
            const codeLanguage = $item.find('.code-language').val();
            const codeContent = $item.find('.code-content').val().trim();

            if (!title) {
                hasEmptyTitle = true;
                $item.find('.feature-title').css('border-color', 'red').focus(); // Highlight empty required field
                return false; // Stop .each loop early
            } else {
                 $item.find('.feature-title').css('border-color', '#ddd'); // Reset border if valid
            }

            features.push({
                title: title,
                text: text,
                code_language: codeLanguage,
                code_content: codeContent
            });
        });

        if (hasEmptyTitle) {
             showNotification('กรุณาระบุหัวข้อสำหรับ Feature ทุกรายการ', 'error');
             $submitBtn.prop('disabled', false).text(originalBtnText);
             return;
        }

        if (features.length === 0) { // Should be prevented by remove logic, but check again
            // Replace alert with a non-blocking notification
            // alert('กรุณาเพิ่มคุณสมบัติอย่างน้อย 1 รายการ');
            showNotification('กรุณาเพิ่ม Feature อย่างน้อย 1 รายการ', 'error');
            $submitBtn.prop('disabled', false).text(originalBtnText);
            return;
        }

        // --- Prepare AJAX Data ---
        // Ensure changelogParams and its properties (ajaxUrl, nonce) are correctly localized/available
        if (typeof changelogParams === 'undefined' || !changelogParams.ajaxUrl || !changelogParams.nonce) {
             showNotification('เกิดข้อผิดพลาด: ไม่พบข้อมูลการตั้งค่าที่จำเป็น (changelogParams)', 'error');
             console.error("changelogParams object with ajaxUrl and nonce is required.");
             $submitBtn.prop('disabled', false).text(originalBtnText);
             return;
        }

        const formData = {
            action: 'save_changelog',
            nonce: changelogParams.nonce,
            post_id: postId,
            version: version,
            date: displayDate, // Send formatted date
            features: features
        };

        // --- Perform AJAX Request ---
        $.ajax({
            url: changelogParams.ajaxUrl,
            type: 'POST',
            data: formData, // jQuery handles serialization for objects
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    // Replace alert with a non-blocking notification
                    // alert('บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว');
                    showNotification('บันทึก Changelog เรียบร้อยแล้ว', 'success');

                    // Reset form and close modal
                    $changelogForm[0].reset();
                    $featuresContainer.html(''); // Clear features
                    $addFeatureBtn.trigger('click'); // Add back one empty feature item
                    $modalOverlay.hide();
                    $('body').removeClass('modal-open');

                    // Update DOM or reload page
                    if (response.data?.reload) { // Check response data for reload flag
                        location.reload();
                    } else {
                        // Manual DOM update if no reload needed
                        updateChangelogDOM(version, displayDate, features);
                    }
                } else {
                    // Replace alert with a non-blocking notification
                    // alert('เกิดข้อผิดพลาด: ' + (response.data?.message || 'ไม่ทราบสาเหตุ'));
                     showNotification('เกิดข้อผิดพลาด: ' + (response.data?.message || 'ไม่สามารถบันทึกข้อมูลได้'), 'error');
                }
            },
            error: function(xhr, status, error) {
                console.error("AJAX Error:", status, error, xhr.responseText);
                // Replace alert with a non-blocking notification
                // alert('เกิดข้อผิดพลาดในการติดต่อกับเซิร์ฟเวอร์: ' + error);
                showNotification('เกิดข้อผิดพลาดในการติดต่อกับเซิร์ฟเวอร์', 'error');
            },
            complete: function() {
                // Reset button state regardless of success/error
                $submitBtn.prop('disabled', false).text(originalBtnText);
            }
        });
    });

}); // End jQuery(document).ready
