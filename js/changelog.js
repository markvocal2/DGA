/**
 * Changelog Form Functionality
 * Complete implementation with auto-save feature
 */
jQuery(document).ready(function($) {
    // Initialize Prism.js for syntax highlighting
    if (typeof Prism !== 'undefined') {
        Prism.highlightAll();
    }
    
    // Add copy buttons to code blocks
    $('.changelog-feature pre').each(function() {
        var $this = $(this);
        var $code = $this.find('code');
        var $button = $('<button class="copy-code-button">Copy</button>');
        
        $this.css('position', 'relative');
        $this.append($button);
        
        $button.on('click', function() {
            var code = $code.text();
            copyToClipboard(code);
            
            // Visual feedback
            var originalText = $button.text();
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
        var $content = $(this).next('.version-content');
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
        var $filterContainer = $('<div class="changelog-filter"></div>');
        var $filterInput = $('<input type="text" placeholder="Filter by version or feature...">');
        
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
            var filterText = $(this).val().toLowerCase();
            
            $('.changelog-version').each(function() {
                var versionText = $(this).find('.version-number').text().toLowerCase();
                var featureTexts = [];
                
                $(this).find('.feature-title').each(function() {
                    featureTexts.push($(this).text().toLowerCase());
                });
                
                var hasMatch = versionText.indexOf(filterText) > -1;
                
                // Check features too
                for (var i = 0; i < featureTexts.length; i++) {
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
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0');
        var yyyy = today.getFullYear();
        today = yyyy + '-' + mm + '-' + dd;
        $('#date').val(today);
        
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
        var featureTemplate = `
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
            alert('ต้องมีคุณสมบัติอย่างน้อย 1 รายการ');
        }
    });
    
    // Handle form submission with AJAX
    $('#changelog-form').on('submit', function(e) {
        e.preventDefault();
        
        // Show loading indicator
        var $submitBtn = $('.submit-btn');
        var originalBtnText = $submitBtn.text();
        $submitBtn.prop('disabled', true).text('กำลังบันทึก...');
        
        // Get post ID from the container
        var postId = $('.changelog-container').data('post-id');
        if (!postId) {
            postId = getCurrentPostId();
        }
        
        // Verify post ID
        if (!postId) {
            alert('ไม่พบ ID ของโพสต์ กรุณาลองอัพเดตหน้าเว็บและลองอีกครั้ง');
            $submitBtn.prop('disabled', false).text(originalBtnText);
            return;
        }
        
        // Collect form data
        var version = $('#version').val();
        var date = $('#date').val();
        
        if (!version) {
            alert('กรุณาระบุเวอร์ชัน');
            $submitBtn.prop('disabled', false).text(originalBtnText);
            return;
        }
        
        if (!date) {
            // Use current date if not specified
            var today = new Date();
            var dd = String(today.getDate()).padStart(2, '0');
            var mm = String(today.getMonth() + 1).padStart(2, '0');
            var yyyy = today.getFullYear();
            date = yyyy + '-' + mm + '-' + dd;
        }
        
        // Format date for display
        var displayDate = formatDate(date);
        
        // Collect features
        var features = [];
        
        $('.feature-item').each(function() {
            var $item = $(this);
            var title = $item.find('.feature-title').val();
            var text = $item.find('.feature-text').val();
            var codeLanguage = $item.find('.code-language').val();
            var codeContent = $item.find('.code-content').val();
            
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
            alert('กรุณาเพิ่มคุณสมบัติอย่างน้อย 1 รายการ');
            $submitBtn.prop('disabled', false).text(originalBtnText);
            return;
        }
        
        // Prepare data for AJAX
        var formData = {
            action: 'save_changelog',
            nonce: changelogParams.nonce,
            post_id: postId,
            version: version,
            date: displayDate,
            features: features
        };
        
        // Send AJAX request
        $.ajax({
            url: changelogParams.ajaxUrl,
            type: 'POST',
            data: formData,
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    // Success message
                    alert('บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว');
                    
                    // Reset form
                    $('#changelog-form')[0].reset();
                    $('.feature-item:not(:first)').remove();
                    $('.changelog-modal-overlay').hide();
                    
                    // Reload page to show updates
                    if (response.reload) {
                        location.reload();
                    } else {
                        // Manual DOM update if no reload
                        updateChangelogDOM(version, displayDate, features);
                    }
                } else {
                    // Error message
                    alert('เกิดข้อผิดพลาด: ' + (response.data || 'ไม่ทราบสาเหตุ'));
                }
            },
            error: function(xhr, status, error) {
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
    
    // Helper Functions
    
    // Get current post ID from various sources
    function getCurrentPostId() {
        // Try to get from URL first
        var urlParams = new URLSearchParams(window.location.search);
        var postId = urlParams.get('post');
        
        if (postId) {
            return postId;
        }
        
        // Try to get from the body class
        var bodyClasses = document.body.className.split(' ');
        for (var i = 0; i < bodyClasses.length; i++) {
            if (bodyClasses[i].indexOf('postid-') === 0) {
                return bodyClasses[i].replace('postid-', '');
            }
        }
        
        // Try to get from canonical link
        var canonicalLink = document.querySelector('link[rel="canonical"]');
        if (canonicalLink) {
            var href = canonicalLink.getAttribute('href');
            var match = href.match(/\/(\d+)\/?$/);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        // If all else fails, ask the user
        var manualPostId = prompt('ไม่สามารถระบุ ID ของโพสต์ได้โดยอัตโนมัติ กรุณาระบุ ID ของโพสต์:');
        if (manualPostId && !isNaN(parseInt(manualPostId))) {
            return parseInt(manualPostId);
        }
        
        return null;
    }
    
    // Format date for display
    function formatDate(dateString) {
        var date = new Date(dateString);
        var options = { year: 'numeric', month: 'long', day: 'numeric' };
        
        try {
            return date.toLocaleDateString('th-TH', options);
        } catch (e) {
            // Fallback for browsers without th-TH locale
            var months = [
                'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
            ];
            
            var day = date.getDate();
            var month = months[date.getMonth()];
            var year = date.getFullYear();
            
            return day + ' ' + month + ' ' + year;
        }
    }
    
    // Copy text to clipboard
    function copyToClipboard(text) {
        // Try to use the modern navigator.clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .catch(function() {
                    // Fallback to the old execCommand method
                    execCopyToClipboard(text);
                });
        } else {
            // Fallback for browsers without clipboard API
            execCopyToClipboard(text);
        }
    }
    
    // Legacy method to copy text
    function execCopyToClipboard(text) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        
        var selected = document.getSelection().rangeCount > 0 ?
            document.getSelection().getRangeAt(0) : false;
            
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (selected) {
            document.getSelection().removeAllRanges();
            document.getSelection().addRange(selected);
        }
    }
    
    // Manual DOM update for changelog (if needed)
    function updateChangelogDOM(version, date, features) {
        // Check if there's already a version with the same date
        var sameDateFound = false;
        var $existingVersion = null;
        
        $('.changelog-version').each(function() {
            var versionDate = $(this).find('.version-date').text();
            if (versionDate === date) {
                sameDateFound = true;
                $existingVersion = $(this);
                return false; // Break loop
            }
        });
        
        if (sameDateFound && $existingVersion) {
            // Add features to existing version group
            var $versionContent = $existingVersion.find('.version-content');
            
            features.forEach(function(feature) {
                var featureHTML = `
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
            
            // Highlight new code blocks
            if (typeof Prism !== 'undefined') {
                Prism.highlightAllUnder($versionContent[0]);
            }
            
            // Add copy buttons to new code blocks
            $versionContent.find('pre:not(:has(.copy-code-button))').each(function() {
                var $pre = $(this);
                var $code = $pre.find('code');
                var $button = $('<button class="copy-code-button">Copy</button>');
                
                $pre.css('position', 'relative');
                $pre.append($button);
                
                $button.on('click', function() {
                    var code = $code.text();
                    copyToClipboard(code);
                    
                    // Visual feedback
                    var originalText = $button.text();
                    $button.text('Copied!');
                    $button.css('background-color', '#10b981');
                    
                    setTimeout(function() {
                        $button.text(originalText);
                        $button.css('background-color', '#1e3a8a');
                    }, 2000);
                });
            });
        } else {
            // Create new version entry
            var versionHTML = `
                <div class="changelog-version">
                    <div class="version-header">
                        <span class="version-number">Version ${escapeHTML(version)}</span>
                        <span class="version-date">${escapeHTML(date)}</span>
                    </div>
                    
                    <div class="version-content">
                        ${features.map(function(feature) {
                            return `
                                <div class="changelog-feature">
                                    <h3 class="feature-title">${escapeHTML(feature.title)}</h3>
                                    <div class="feature-content">
                                        ${feature.text ? `<p>${escapeHTML(feature.text)}</p>` : ''}
                                        ${feature.code_content ? `<pre><code class="language-${feature.code_language}">${escapeHTML(feature.code_content)}</code></pre>` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
            
            // Add to the top of the list
            $('.changelog-versions').prepend(versionHTML);
            
            // Apply syntax highlighting
            if (typeof Prism !== 'undefined') {
                Prism.highlightAllUnder($('.changelog-version:first')[0]);
            }
            
            // Add copy buttons to new code blocks
            $('.changelog-version:first pre:not(:has(.copy-code-button))').each(function() {
                var $pre = $(this);
                var $code = $pre.find('code');
                var $button = $('<button class="copy-code-button">Copy</button>');
                
                $pre.css('position', 'relative');
                $pre.append($button);
                
                $button.on('click', function() {
                    var code = $code.text();
                    copyToClipboard(code);
                    
                    // Visual feedback
                    var originalText = $button.text();
                    $button.text('Copied!');
                    $button.css('background-color', '#10b981');
                    
                    setTimeout(function() {
                        $button.text(originalText);
                        $button.css('background-color', '#1e3a8a');
                    }, 2000);
                });
            });
            
            // Add toggle functionality to new version header
            $('.changelog-version:first .version-header').on('click', function() {
                var $content = $(this).next('.version-content');
                $content.slideToggle(300);
                
                $(this).toggleClass('version-header-collapsed');
                
                if ($(this).hasClass('version-header-collapsed')) {
                    $(this).css('border-left-color', '#f97316');
                } else {
                    $(this).css('border-left-color', '#1e40af');
                }
            });
            
            // Make sure the new version is expanded
            $('.changelog-version:first .version-content').show();
            $('.changelog-version:first .version-header').removeClass('version-header-collapsed');
            $('.changelog-version:first .version-header').css('border-left-color', '#1e40af');
        }
    }
    
    // Escape HTML to prevent XSS
    function escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});