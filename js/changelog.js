/**
 * Changelog Form Functionality
 * Complete implementation with auto-save feature (Refactored to use let/const)
 */
jQuery(document).ready(function($) {
    // Initialize Prism.js for syntax highlighting
    if (typeof Prism !== 'undefined') {
        Prism.highlightAll();
    }

    // Add copy buttons to code blocks
    $('.changelog-feature pre').each(function() {
        const $this = $(this); // Use const as $this is not reassigned in this scope
        const $code = $this.find('code'); // Use const
        const $button = $('<button class="copy-code-button">Copy</button>'); // Use const

        $this.css('position', 'relative');
        $this.append($button);

        $button.on('click', function() {
            const code = $code.text(); // Use const
            copyToClipboard(code);

            // Visual feedback
            const originalText = $button.text(); // Use const
            $button.text('Copied!');
            $button.css('background-color', '#10b981'); // Success green

            setTimeout(function() {
                $button.text(originalText);
                $button.css('background-color', '#1e3a8a'); // Back to blue
            }, 2000);
        });
    });

    // Toggle version content
    $('.version-header').on('click', function() {
        const $content = $(this).next('.version-content'); // Use const
        $content.slideToggle(300);

        // Add visual indicator for toggle state
        $(this).toggleClass('version-header-collapsed');

        if ($(this).hasClass('version-header-collapsed')) {
            $(this).css('border-left-color', '#f97316'); // Orange when collapsed
        } else {
            $(this).css('border-left-color', '#1e40af'); // Blue when expanded
        }
    });

    // Expand/collapse all versions
    $('.expand-all-btn').on('click', function() {
        $('.version-content').slideDown(300);
        $('.version-header').removeClass('version-header-collapsed');
        $('.version-header').css('border-left-color', '#1e40af');
    });

    $('.collapse-all-btn').on('click', function() {
        $('.version-content').slideUp(300);
        $('.version-header').addClass('version-header-collapsed');
        $('.version-header').css('border-left-color', '#f97316');
    });

    // Version filtering (if there are many versions)
    if ($('.changelog-version').length > 5) {
        const $filterContainer = $('<div class="changelog-filter"></div>'); // Use const
        const $filterInput = $('<input type="text" placeholder="Filter by version or feature...">'); // Use const

        $filterContainer.css({
            'padding': '10px 30px',
            'background-color': '#f8fafc',
            'border-bottom': '1px solid #e5e7eb'
        });

        $filterInput.css({
            'width': '100%',
            'padding': '8px',
            'border': '1px solid #e2e8f0',
            'border-radius': '4px'
        });

        $filterContainer.append($filterInput);
        $('.changelog-controls').after($filterContainer);

        $filterInput.on('input', function() {
            const filterText = $(this).val().toLowerCase(); // Use const

            $('.changelog-version').each(function() {
                const versionText = $(this).find('.version-number').text().toLowerCase(); // Use const
                const featureTexts = []; // Use const, array contents can still be modified

                $(this).find('.feature-title').each(function() {
                    featureTexts.push($(this).text().toLowerCase());
                });

                let hasMatch = versionText.indexOf(filterText) > -1; // Use let as it might be reassigned

                // Check features too
                // Use let for loop counter as it's reassigned
                for (let i = 0; i < featureTexts.length; i++) {
                    if (featureTexts[i].indexOf(filterText) > -1) {
                        hasMatch = true;
                        break;
                    }
                }

                if (hasMatch) {
                    $(this).show();

                    // If filtering and match found, auto-expand
                    if (filterText.length > 0) {
                        $(this).find('.version-content').slideDown(300);
                        $(this).find('.version-header').removeClass('version-header-collapsed');
                        $(this).find('.version-header').css('border-left-color', '#1e40af');
                    }
                } else {
                    $(this).hide();
                }
            });
        });
    }

    // Show modal when update button is clicked
    $('.update-changelog-btn').on('click', function() {
        // Set today's date as default
        const todayDateObj = new Date(); // Use const for the Date object
        const dd = String(todayDateObj.getDate()).padStart(2, '0'); // Use const
        const mm = String(todayDateObj.getMonth() + 1).padStart(2, '0'); // Use const
        const yyyy = todayDateObj.getFullYear(); // Use const
        const todayStr = yyyy + '-' + mm + '-' + dd; // Use const for the formatted string
        $('#date').val(todayStr);

        $('.changelog-modal-overlay').css('display', 'flex');
    });

    // Close modal
    $('.close-modal-btn, .cancel-btn').on('click', function() {
        $('.changelog-modal-overlay').hide();
    });

    // Close modal when clicking outside
    $('.changelog-modal-overlay').on('click', function(e) {
        if (e.target === this) {
            $('.changelog-modal-overlay').hide();
        }
    });

    // Add new feature
    $('#add-feature-btn').on('click', function() {
        // Use const for the template string as it's not reassigned
        const featureTemplate = `
            <div class="feature-item" style="border: 1px solid #e5e7eb; border-radius: 4px; padding: 15px; margin-bottom: 15px;">
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">หัวข้อ</label>
                    <input type="text" class="feature-title" name="feature_title[]" placeholder="เช่น ปรับปรุงหน้า Dashboard" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" required>
                </div>

                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">รายละเอียด</label>
                    <textarea class="feature-text" name="feature_text[]" rows="3" placeholder="อธิบายรายละเอียดการเปลี่ยนแปลง" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
                </div>

                <div class="form-group code-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">ตัวอย่างโค้ด (ถ้ามี)</label>
                    <select class="code-language" name="code_language[]" style="margin-bottom: 5px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="javascript">JavaScript</option>
                        <option value="php">PHP</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="sql">SQL</option>
                    </select>
                    <textarea class="code-content" name="code_content[]" rows="5" placeholder="// เพิ่มโค้ดตัวอย่างที่นี่" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace;"></textarea>
                </div>

                <button type="button" class="remove-feature-btn" style="background-color: #f97316; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer;">ลบรายการนี้</button>
            </div>
        `;

        $('.features-container').append(featureTemplate);
    });

    // Remove feature
    $(document).on('click', '.remove-feature-btn', function() {
        // Don't remove if it's the only feature
        if ($('.feature-item').length > 1) {
            $(this).closest('.feature-item').remove();
        } else {
            // Consider replacing alert with a less intrusive notification if possible
            alert('ต้องมีคุณสมบัติอย่างน้อย 1 รายการ');
        }
    });

    // Handle form submission with AJAX
    $('#changelog-form').on('submit', function(e) {
        e.preventDefault();

        // Show loading indicator
        const $submitBtn = $('.submit-btn'); // Use const
        const originalBtnText = $submitBtn.text(); // Use const
        $submitBtn.prop('disabled', true).text('กำลังบันทึก...');

        // Get post ID from the container or helper function
        // Use let as postId might be reassigned by the helper function call
        let postId = $('.changelog-container').data('post-id');
        if (!postId) {
            postId = getCurrentPostId(); // Potentially reassigns postId
        }

        // Verify post ID
        if (!postId) {
            // Consider replacing alert
            alert('ไม่พบ ID ของโพสต์ กรุณาลองอัพเดตหน้าเว็บและลองอีกครั้ง');
            $submitBtn.prop('disabled', false).text(originalBtnText);
            return;
        }

        // Collect form data
        const version = $('#version').val(); // Use const
        let date = $('#date').val(); // Use let as it might be reassigned

        if (!version) {
            // Consider replacing alert
            alert('กรุณาระบุเวอร์ชัน');
            $submitBtn.prop('disabled', false).text(originalBtnText);
            return;
        }

        if (!date) {
            // Use current date if not specified
            const todayDateObj = new Date(); // Use const
            const dd = String(todayDateObj.getDate()).padStart(2, '0'); // Use const
            const mm = String(todayDateObj.getMonth() + 1).padStart(2, '0'); // Use const
            const yyyy = todayDateObj.getFullYear(); // Use const
            date = yyyy + '-' + mm + '-' + dd; // Reassign date
        }

        // Format date for display
        const displayDate = formatDate(date); // Use const

        // Collect features
        const features = []; // Use const, array contents can be modified

        $('.feature-item').each(function() {
            const $item = $(this); // Use const
            const title = $item.find('.feature-title').val(); // Use const
            const text = $item.find('.feature-text').val(); // Use const
            const codeLanguage = $item.find('.code-language').val(); // Use const
            const codeContent = $item.find('.code-content').val(); // Use const

            if (title) {
                features.push({
                    title: title,
                    text: text,
                    code_language: codeLanguage,
                    code_content: codeContent
                });
            }
        });

        if (features.length === 0) {
            // Consider replacing alert
            alert('กรุณาเพิ่มคุณสมบัติอย่างน้อย 1 รายการ');
            $submitBtn.prop('disabled', false).text(originalBtnText);
            return;
        }

        // Prepare data for AJAX
        // Use const as formData object itself is not reassigned
        const formData = {
            action: 'save_changelog',
            nonce: changelogParams.nonce, // Assuming changelogParams is globally available
            post_id: postId,
            version: version,
            date: displayDate, // Send formatted date
            features: features
        };

        // Send AJAX request
        $.ajax({
            url: changelogParams.ajaxUrl, // Assuming changelogParams is globally available
            type: 'POST',
            data: formData,
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    // Success message
                    // Consider replacing alert
                    alert('บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว');

                    // Reset form
                    $('#changelog-form')[0].reset();
                    $('.feature-item:not(:first)').remove();
                    $('.changelog-modal-overlay').hide();

                    // Reload page to show updates or update DOM manually
                    if (response.reload) {
                        location.reload();
                    } else {
                        // Manual DOM update if no reload
                        updateChangelogDOM(version, displayDate, features);
                    }
                } else {
                    // Error message
                    // Consider replacing alert
                    alert('เกิดข้อผิดพลาด: ' + (response.data || 'ไม่ทราบสาเหตุ'));
                }
            },
            error: function(xhr, status, error) {
                // Consider replacing alert
                alert('เกิดข้อผิดพลาดในการติดต่อกับเซิร์ฟเวอร์: ' + error);
            },
            complete: function() {
                // Reset button state
                $submitBtn.prop('disabled', false).text(originalBtnText);
            }
        });
    });

    // Initialize the UI (collapsed by default except first item)
    $('.version-content').hide();
    $('.version-header').addClass('version-header-collapsed');
    $('.version-header').css('border-left-color', '#f97316');

    // Show first version by default
    $('.changelog-version:first .version-content').show();
    $('.changelog-version:first .version-header').removeClass('version-header-collapsed');
    $('.changelog-version:first .version-header').css('border-left-color', '#1e40af');

    // --- Helper Functions ---

    /**
     * Get current post ID from various sources.
     * @returns {string|null} The post ID or null if not found.
     */
    function getCurrentPostId() {
        // Try to get from URL first
        const urlParams = new URLSearchParams(window.location.search); // Use const
        let postId = urlParams.get('post'); // Use let as it might be reassigned

        if (postId) {
            return postId;
        }

        // Try to get from the body class
        const bodyClasses = document.body.className.split(' '); // Use const
        // Use let for loop counter
        for (let i = 0; i < bodyClasses.length; i++) {
            if (bodyClasses[i].indexOf('postid-') === 0) {
                return bodyClasses[i].replace('postid-', '');
            }
        }

        // Try to get from canonical link
        const canonicalLink = document.querySelector('link[rel="canonical"]'); // Use const
        if (canonicalLink) {
            const href = canonicalLink.getAttribute('href'); // Use const
            const match = href.match(/\/(\d+)\/?$/); // Use const
            if (match && match[1]) {
                return match[1];
            }
        }

        // If all else fails, ask the user (Consider a better fallback)
        // Use let as it might be reassigned
        let manualPostId = prompt('ไม่สามารถระบุ ID ของโพสต์ได้โดยอัตโนมัติ กรุณาระบุ ID ของโพสต์:');
        if (manualPostId && !isNaN(parseInt(manualPostId))) {
            // Ensure it's parsed correctly if needed elsewhere, though returning string is fine here
            return String(parseInt(manualPostId));
        }

        return null; // Return null if no ID could be found
    }

    /**
     * Format date string to Thai locale string.
     * @param {string} dateString - The date string (YYYY-MM-DD).
     * @returns {string} Formatted date string.
     */
    function formatDate(dateString) {
        const date = new Date(dateString); // Use const
        // Use const for options object
        const options = { year: 'numeric', month: 'long', day: 'numeric' };

        try {
            // Use Thai locale for formatting
            return date.toLocaleDateString('th-TH', options);
        } catch (e) {
            // Fallback for browsers without th-TH locale support
            console.warn("Browser does not support 'th-TH' locale for Date.toLocaleDateString(). Using fallback.");
            // Use const for month names array
            const months = [
                'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
            ];

            const day = date.getDate(); // Use const
            const month = months[date.getMonth()]; // Use const
            const year = date.getFullYear(); // Use const

            return day + ' ' + month + ' ' + year;
        }
    }

    /**
     * Copy text to the user's clipboard.
     * Uses modern Clipboard API with fallback to execCommand.
     * @param {string} text - The text to copy.
     */
    function copyToClipboard(text) {
        // Try to use the modern navigator.clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .catch(function(err) {
                    console.error('Async: Could not copy text: ', err);
                    // Fallback to the old execCommand method if API fails
                    execCopyToClipboard(text);
                });
        } else {
            // Fallback for browsers without clipboard API support
            console.warn('Clipboard API not available, using fallback execCommand.');
            execCopyToClipboard(text);
        }
    }

    /**
     * Legacy method to copy text using execCommand.
     * @param {string} text - The text to copy.
     */
    function execCopyToClipboard(text) {
        const textarea = document.createElement('textarea'); // Use const
        textarea.value = text;
        textarea.setAttribute('readonly', ''); // Make it read-only to prevent unintended modifications
        // Position off-screen
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);

        // Preserve existing selection, if any
        const selected = document.getSelection().rangeCount > 0 ?
            document.getSelection().getRangeAt(0) : false; // Use const

        textarea.select(); // Select the text inside the textarea

        try {
            const successful = document.execCommand('copy'); // Use const
            if (!successful) {
                console.error('Fallback: Unable to copy text via execCommand.');
                // Consider showing a message to the user here
            }
        } catch (err) {
            console.error('Fallback: Error copying text via execCommand: ', err);
            // Consider showing a message to the user here
        }

        document.body.removeChild(textarea); // Clean up the temporary textarea

        // Restore the original selection if there was one
        if (selected) {
            document.getSelection().removeAllRanges(); // Clear the temporary selection
            document.getSelection().addRange(selected); // Restore the original selection
        }
    }

    /**
     * Manually updates the DOM to display the new changelog entry
     * when the page isn't reloaded after AJAX success.
     * @param {string} version - The version number.
     * @param {string} date - The formatted date string.
     * @param {Array} features - Array of feature objects.
     */
    function updateChangelogDOM(version, date, features) {
        // Check if there's already a version with the same date
        let sameDateFound = false; // Use let
        let $existingVersion = null; // Use let

        $('.changelog-version').each(function() {
            const versionDate = $(this).find('.version-date').text(); // Use const
            if (versionDate === date) {
                sameDateFound = true;
                $existingVersion = $(this);
                return false; // Break loop using jQuery's each convention
            }
        });

        if (sameDateFound && $existingVersion) {
            // Add features to existing version group
            const $versionContent = $existingVersion.find('.version-content'); // Use const

            features.forEach(function(feature) {
                // Use const for featureHTML template string
                const featureHTML = `
                    <div class="changelog-feature">
                        <h3 class="feature-title">${escapeHTML(feature.title)}</h3>
                        <div class="feature-content">
                            ${feature.text ? `<p>${escapeHTML(feature.text)}</p>` : ''}
                            ${feature.code_content ? `<pre><code class="language-${feature.code_language}">${escapeHTML(feature.code_content)}</code></pre>` : ''}
                        </div>
                    </div>
                `;
                $versionContent.append(featureHTML);
            });

            // Highlight new code blocks within the updated section
            if (typeof Prism !== 'undefined') {
                Prism.highlightAllUnder($versionContent[0]);
            }

            // Add copy buttons to *newly added* code blocks in this section
            $versionContent.find('pre:not(:has(.copy-code-button))').each(function() {
                const $pre = $(this); // Use const
                const $code = $pre.find('code'); // Use const
                const $button = $('<button class="copy-code-button">Copy</button>'); // Use const

                $pre.css('position', 'relative');
                $pre.append($button);

                $button.on('click', function() {
                    const code = $code.text(); // Use const
                    copyToClipboard(code);

                    // Visual feedback
                    const originalText = $button.text(); // Use const
                    $button.text('Copied!');
                    $button.css('background-color', '#10b981');

                    setTimeout(function() {
                        $button.text(originalText);
                        $button.css('background-color', '#1e3a8a');
                    }, 2000);
                });
            });
        } else {
            // Create new version entry HTML
            // Use const for versionHTML template string
            const versionHTML = `
                <div class="changelog-version">
                    <div class="version-header">
                        <span class="version-number">Version ${escapeHTML(version)}</span>
                        <span class="version-date">${escapeHTML(date)}</span>
                    </div>

                    <div class="version-content">
                        ${features.map(function(feature) {
                            // Use const for the inner template string
                            const featureHTML = `
                                <div class="changelog-feature">
                                    <h3 class="feature-title">${escapeHTML(feature.title)}</h3>
                                    <div class="feature-content">
                                        ${feature.text ? `<p>${escapeHTML(feature.text)}</p>` : ''}
                                        ${feature.code_content ? `<pre><code class="language-${feature.code_language}">${escapeHTML(feature.code_content)}</code></pre>` : ''}
                                    </div>
                                </div>
                            `;
                            return featureHTML;
                        }).join('')}
                    </div>
                </div>
            `;

            // Add the new version entry to the top of the list
            $('.changelog-versions').prepend(versionHTML);

            // Get a reference to the newly added version element
            const $newVersion = $('.changelog-version:first'); // Use const

            // Apply syntax highlighting to the new version block
            if (typeof Prism !== 'undefined') {
                Prism.highlightAllUnder($newVersion[0]);
            }

            // Add copy buttons to new code blocks within the new version
            $newVersion.find('pre:not(:has(.copy-code-button))').each(function() {
                const $pre = $(this); // Use const
                const $code = $pre.find('code'); // Use const
                const $button = $('<button class="copy-code-button">Copy</button>'); // Use const

                $pre.css('position', 'relative');
                $pre.append($button);

                $button.on('click', function() {
                    const code = $code.text(); // Use const
                    copyToClipboard(code);

                    // Visual feedback
                    const originalText = $button.text(); // Use const
                    $button.text('Copied!');
                    $button.css('background-color', '#10b981');

                    setTimeout(function() {
                        $button.text(originalText);
                        $button.css('background-color', '#1e3a8a');
                    }, 2000);
                });
            });

            // Add toggle functionality to the new version header
            $newVersion.find('.version-header').on('click', function() {
                const $content = $(this).next('.version-content'); // Use const
                $content.slideToggle(300);

                $(this).toggleClass('version-header-collapsed');

                if ($(this).hasClass('version-header-collapsed')) {
                    $(this).css('border-left-color', '#f97316');
                } else {
                    $(this).css('border-left-color', '#1e40af');
                }
            });

            // Make sure the new version is expanded by default
            $newVersion.find('.version-content').show();
            $newVersion.find('.version-header').removeClass('version-header-collapsed');
            $newVersion.find('.version-header').css('border-left-color', '#1e40af');
        }
    }

    /**
     * Escapes HTML special characters to prevent XSS attacks.
     * @param {string} str - The string to escape.
     * @returns {string} The escaped string.
     */
    function escapeHTML(str) {
        // Return empty string if input is null, undefined, or empty
        if (!str) return '';
        // Perform replacements
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;'); // Escape single quotes as well
    }

});
