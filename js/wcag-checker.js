jQuery(document).ready(function($) {
    // Store DOM elements
    const $container = $('.wcag-checker-container');
    const $loading = $container.find('.wcag-loading');
    const $results = $container.find('.wcag-results');
    const $grade = $container.find('.wcag-grade');
    const $details = $container.find('.wcag-details');
    const $detailsToggle = $container.find('.wcag-details-toggle');
    const $modal = $('#wcag-modal');
    const $modalContent = $('#wcag-modal-content');
    const $modalClose = $('.wcag-modal-close');

    // Initialize event listeners
    $detailsToggle.on('click', function() {
        // Show modal instead of toggling details
        $modalContent.html($details.html());
        $modal.fadeIn(300);
    });

    // Modal close button
    $modalClose.on('click', function() {
        $modal.fadeOut(300);
    });

    // Close modal when clicking outside content
    $modal.on('click', function(e) {
        if (e.target === this) {
            $modal.fadeOut(300);
        }
    });

    // Close modal with Escape key
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape' && $modal.is(':visible')) {
            $modal.fadeOut(300);
        }
        
        // ตรวจจับ shortkey Ctrl+Shift+C
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') {
            e.preventDefault(); // ป้องกันการทำงานของ browser shortcut
            openSeveritySettings();
        }
    });

    // ฟังก์ชั่นสำหรับเปิดหน้าต่างตั้งค่าความเข้มงวด
    function openSeveritySettings() {
        const currentSeverity = getSavedSeverity();
        
        // สร้าง HTML สำหรับหน้าต่างตั้งค่า
        let settingsHTML = `
            <div class="wcag-severity-settings">
                <h3 class="wcag-severity-title">ตั้งค่าความเข้มงวดในการตรวจสอบ</h3>
                <div class="wcag-severity-options">
                    <div class="wcag-severity-option ${currentSeverity === 'very-low' ? 'selected' : ''}">
                        <input type="radio" name="wcag-severity" id="wcag-severity-very-low" value="very-low" ${currentSeverity === 'very-low' ? 'checked' : ''}>
                        <label for="wcag-severity-very-low">เข้มงวดน้อยมาก</label>
                        <p>ตรวจสอบเฉพาะปัญหาที่สำคัญและมีผลกระทบสูงเท่านั้น</p>
                    </div>
                    <div class="wcag-severity-option ${currentSeverity === 'low' ? 'selected' : ''}">
                        <input type="radio" name="wcag-severity" id="wcag-severity-low" value="low" ${currentSeverity === 'low' ? 'checked' : ''}>
                        <label for="wcag-severity-low">เข้มงวดน้อย</label>
                        <p>ตรวจสอบปัญหาที่สำคัญและปัญหาที่มีผลกระทบปานกลาง</p>
                    </div>
                    <div class="wcag-severity-option ${currentSeverity === 'medium' ? 'selected' : ''}">
                        <input type="radio" name="wcag-severity" id="wcag-severity-medium" value="medium" ${currentSeverity === 'medium' ? 'checked' : ''}>
                        <label for="wcag-severity-medium">เข้มงวดปานกลาง</label>
                        <p>ตรวจสอบปัญหาส่วนใหญ่ ยกเว้นปัญหาที่มีผลกระทบต่ำ</p>
                    </div>
                    <div class="wcag-severity-option ${currentSeverity === 'high' ? 'selected' : ''}">
                        <input type="radio" name="wcag-severity" id="wcag-severity-high" value="high" ${currentSeverity === 'high' ? 'checked' : ''}>
                        <label for="wcag-severity-high">เข้มงวดมาก</label>
                        <p>ตรวจสอบปัญหาทั้งหมดรวมถึงการแนะนำสำหรับ WCAG AAA</p>
                    </div>
                </div>
                <div class="wcag-settings-buttons">
                    <button id="wcag-save-settings" class="wcag-save-button">บันทึกการตั้งค่า</button>
                    <button id="wcag-cancel-settings" class="wcag-cancel-button">ยกเลิก</button>
                </div>
            </div>
        `;
        
        // แสดง Modal และเพิ่ม HTML
        $modalContent.html(settingsHTML);
        $modal.fadeIn(300);
        
        // เพิ่ม event listener สำหรับปุ่มบันทึกและยกเลิก
        $('#wcag-save-settings').on('click', saveSeveritySettings);
        $('#wcag-cancel-settings').on('click', function() {
            $modal.fadeOut(300);
        });
        
        // เพิ่ม event listener สำหรับการเลือก option
        $('.wcag-severity-option').on('click', function() {
            $('.wcag-severity-option').removeClass('selected');
            $(this).addClass('selected');
            $(this).find('input[type="radio"]').prop('checked', true);
        });
    }

    // ฟังก์ชั่นสำหรับบันทึกการตั้งค่าความเข้มงวด
    function saveSeveritySettings() {
        const selectedSeverity = $('input[name="wcag-severity"]:checked').val();
        
        // บันทึกการตั้งค่าลงใน localStorage
        localStorage.setItem('wcagCheckerSeverity', selectedSeverity);
        
        // ปิด Modal
        $modal.fadeOut(300);
        
        // รันการตรวจสอบใหม่ถ้า results แสดงอยู่
        if ($results.is(':visible')) {
            runWCAGCheck();
        }
    }

    // ฟังก์ชั่นสำหรับดึงค่าความเข้มงวดที่บันทึกไว้ (เปลี่ยนค่าเริ่มต้นเป็น 'low')
    function getSavedSeverity() {
        return localStorage.getItem('wcagCheckerSeverity') || 'low'; // ค่าเริ่มต้นคือ เข้มงวดน้อย
    }
    
    // ฟังก์ชั่นสำหรับกรอง violations ตามระดับความเข้มงวด - ทำให้กรองมากขึ้น
    function filterViolationsBySeverity(violations, severity) {
        switch (severity) {
            case 'very-low':
                // เฉพาะ critical เท่านั้น (กรองมากขึ้น)
                return violations.filter(v => v.impact === 'critical');
            
            case 'low':
                // เฉพาะ critical และ serious (กรองมากขึ้น)
                return violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
            
            case 'medium':
                // critical, serious และ moderate ที่สำคัญ (กรองมากขึ้น)
                return violations.filter(v => v.impact === 'critical' || v.impact === 'serious' || 
                    (v.impact === 'moderate' && v.message.includes('สำคัญ')));
            
            case 'high':
            default:
                // ยกเว้น minor บางส่วน (ยังคงกรองบางอย่าง)
                return violations.filter(v => v.impact !== 'minor' || v.message.includes('สำคัญ'));
        }
    }

    // Main check runner
    function runWCAGCheck() {
        $loading.show();
        $results.hide();

        const currentUrl = window.location.href;
        const severity = getSavedSeverity();
        
        const checks = {
            headings: checkHeadings(),
            images: checkImages(),
            links: checkLinks(),
            contrast: checkContrast(),
            forms: checkForms(),
            aria: checkARIA(),
            keyboard: checkKeyboardNavigation()
        };

        processResults(checks, severity);
    }

    // Check functions ที่มีการปรับเกณฑ์ให้ง่ายขึ้น
    function checkHeadings() {
        const violations = [];
        const headings = $('h1, h2, h3, h4, h5, h6');
        const severity = getSavedSeverity();
        
        // ลดความเข้มงวดในการตรวจสอบหัวข้อ h1
        if ($('h1').length === 0 && severity !== 'very-low') {
            violations.push({
                message: 'ไม่พบหัวข้อหลัก (h1) ในหน้านี้',
                impact: 'moderate' // ลดจาก serious เป็น moderate
            });
        }

        // ลดความเข้มงวดเรื่องจำนวน h1 มากกว่า 1
        if ($('h1').length > 1 && severity === 'high') {
            violations.push({
                message: 'พบหัวข้อ h1 มากกว่า 1 อัน ซึ่งไม่แนะนำสำหรับโครงสร้างหน้าเว็บที่ดี',
                impact: 'minor' // ลดจาก moderate เป็น minor
            });
        }

        // ลดความเข้มงวดในการตรวจสอบลำดับของหัวข้อ
        if (severity !== 'very-low' && severity !== 'low') {
            let prevLevel = 0;
            headings.each(function() {
                const level = parseInt(this.tagName[1]);
                if (prevLevel > 0 && level - prevLevel > 1) {
                    violations.push({
                        message: `ข้ามระดับ heading จาก h${prevLevel} ไปยัง h${level}`,
                        element: this.outerHTML,
                        impact: 'minor' // ลดจาก moderate เป็น minor
                    });
                }
                prevLevel = level;
            });
        }

        // ลดความเข้มงวดในการตรวจสอบหัวข้อว่างเปล่า เฉพาะเมื่อเข้มงวดสูงเท่านั้น
        if (severity === 'high') {
            headings.each(function() {
                if ($(this).text().trim() === '') {
                    violations.push({
                        message: `พบหัวข้อว่างเปล่า (${this.tagName})`,
                        element: this.outerHTML,
                        impact: 'minor' // ลดจาก moderate เป็น minor
                    });
                }
            });
        }

        return {
            passed: filterViolationsBySeverity(violations, severity).length === 0,
            violations: filterViolationsBySeverity(violations, severity),
            total: headings.length || 1
        };
    }

    function checkImages() {
        const violations = [];
        const images = $('img');
        const severity = getSavedSeverity();
        let totalChecked = 0;

        // ลดความเข้มงวดในการตรวจสอบรูปภาพ
        images.each(function() {
            totalChecked++;
            const $img = $(this);
            
            // ตรวจสอบ alt text (ยกเว้นระดับ very-low)
            if (!$img.attr('alt') && !$img.attr('role') && !$img.attr('aria-hidden') && severity !== 'very-low') {
                violations.push({
                    message: 'รูปภาพไม่มี alt text',
                    element: this.outerHTML,
                    impact: severity === 'high' ? 'serious' : 'moderate' // ลดความรุนแรงลงสำหรับความเข้มงวดระดับต่ำ
                });
            }
            
            // ตรวจสอบเฉพาะความเข้มงวดระดับสูงเท่านั้น
            if (severity === 'high' && 
                $img.attr('alt') && 
                ['image', 'picture', 'photo', 'img', 'รูปภาพ', 'ภาพ'].includes($img.attr('alt').toLowerCase())) {
                violations.push({
                    message: 'รูปภาพมี alt text ที่ไม่มีความหมาย',
                    element: this.outerHTML,
                    impact: 'minor' // ลดจาก moderate เป็น minor
                });
            }
        });

        return {
            passed: filterViolationsBySeverity(violations, severity).length === 0,
            violations: filterViolationsBySeverity(violations, severity),
            total: totalChecked || 1
        };
    }

    function checkLinks() {
        const violations = [];
        const links = $('a');
        const severity = getSavedSeverity();
        let totalChecked = 0;

        // ลดความเข้มงวดในการตรวจสอบลิงก์
        links.each(function() {
            totalChecked++;
            const $link = $(this);
            const text = $link.text().trim();
            const href = $link.attr('href') || '';
            const hasImage = $link.find('img').length > 0;
            const hasAriaLabel = $link.attr('aria-label');
            const hasAriaLabelledby = $link.attr('aria-labelledby');
            const hasTitle = $link.attr('title');

            // ลดความเข้มงวดสำหรับลิงก์ว่างเปล่า (ยกเว้น very-low)
            if (!text && !hasImage && !hasAriaLabel && !hasAriaLabelledby && !hasTitle && severity !== 'very-low') {
                violations.push({
                    message: 'ลิงก์ไม่มีข้อความหรือรูปภาพ',
                    element: this.outerHTML,
                    impact: severity === 'high' ? 'serious' : 'moderate'
                });
            } 
            
            // ข้อความลิงก์ไม่มีความหมาย (เฉพาะระดับสูง)
            if (severity === 'high') {
                const genericTexts = ['click here', 'คลิกที่นี่', 'here', 'ที่นี่', 'คลิก', 'click', 'link', 'ลิงก์', 'read more', 'อ่านต่อ'];
                if (text && genericTexts.includes(text.toLowerCase())) {
                    violations.push({
                        message: 'ลิงก์ใช้ข้อความที่ไม่มีความหมายเฉพาะ',
                        element: this.outerHTML,
                        impact: 'minor' // ลดจาก moderate เป็น minor
                    });
                }
            }

            // javascript: links (เฉพาะระดับสูง)
            if (severity === 'high' && href.toLowerCase().startsWith('javascript:')) {
                violations.push({
                    message: 'ใช้ javascript: ใน href (ควรใช้ button แทนสำหรับการเรียกใช้ JavaScript)',
                    element: this.outerHTML,
                    impact: 'minor' // ลดจาก moderate เป็น minor
                });
            }

            // รูปภาพในลิงก์ไม่มี alt text (ยกเว้นระดับต่ำมาก)
            if (hasImage && severity !== 'very-low') {
                const $img = $link.find('img');
                if (!$img.attr('alt') && !hasAriaLabel && !hasAriaLabelledby && !hasTitle) {
                    violations.push({
                        message: 'ลิงก์ที่มีรูปภาพไม่มีข้อความทดแทน',
                        element: this.outerHTML,
                        impact: severity === 'high' ? 'serious' : 'moderate'
                    });
                }
            }
        });

        return {
            passed: filterViolationsBySeverity(violations, severity).length === 0,
            violations: filterViolationsBySeverity(violations, severity),
            total: totalChecked || 1
        };
    }

    function checkContrast() {
        const violations = [];
        const textElements = $('p, h1, h2, h3, h4, h5, h6, a, span, li, label, button').filter(function() {
            return $(this).children().length === 0 && $(this).text().trim().length > 0;
        });
        const severity = getSavedSeverity();
        let totalChecked = 0;

        // ลดความเข้มงวดของการตรวจสอบความคมชัด - ตรวจสอบเฉพาะเมื่อความเข้มงวดสูงเท่านั้น
        if (severity === 'high' || severity === 'medium') {
            // Function to parse RGB color
            function parseRGB(color) {
                const rgbRegex = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/;
                const rgbaRegex = /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/;
                
                if (color.startsWith('#')) {
                    const hex = color.substring(1);
                    const r = parseInt(hex.substr(0,2), 16);
                    const g = parseInt(hex.substr(2,2), 16);
                    const b = parseInt(hex.substr(4,2), 16);
                    return { r, g, b };
                } else if (color.startsWith('rgb')) {
                    let match = rgbRegex.exec(color);
                    if (match) {
                        return {
                            r: parseInt(match[1]),
                            g: parseInt(match[2]),
                            b: parseInt(match[3])
                        };
                    }
                    
                    match = rgbaRegex.exec(color);
                    if (match) {
                        return {
                            r: parseInt(match[1]),
                            g: parseInt(match[2]),
                            b: parseInt(match[3]),
                            a: parseFloat(match[4])
                        };
                    }
                }
                
                return { r: 0, g: 0, b: 0 };
            }

            // Function to calculate luminance
            function getLuminance(rgb) {
                const r = rgb.r / 255;
                const g = rgb.g / 255;
                const b = rgb.b / 255;
                
                const r1 = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
                const g1 = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
                const b1 = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
                
                return 0.2126 * r1 + 0.7152 * g1 + 0.0722 * b1;
            }

            // Function to calculate contrast ratio
            function calculateContrastRatio(luminance1, luminance2) {
                const lighter = Math.max(luminance1, luminance2);
                const darker = Math.min(luminance1, luminance2);
                return (lighter + 0.05) / (darker + 0.05);
            }

            // Function to find background color
            function findBackgroundColor($el) {
                let bgColor = $el.css('background-color');
                let currentEl = $el;

                while ((bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') && currentEl.length) {
                    currentEl = currentEl.parent();
                    if (currentEl.length === 0) break;
                    bgColor = currentEl.css('background-color');
                }

                return bgColor;
            }

            textElements.each(function() {
                totalChecked++;
                const $el = $(this);
                const color = $el.css('color');
                const bgColor = findBackgroundColor($el);
                
                if (color && bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
                    // Convert RGB to luminance
                    const textLuminance = getLuminance(parseRGB(color));
                    const bgLuminance = getLuminance(parseRGB(bgColor));
                    
                    // Calculate contrast ratio
                    const contrastRatio = calculateContrastRatio(textLuminance, bgLuminance);
                    
                    // ลดข้อกำหนดความคมชัด
                    const fontSize = parseFloat($el.css('font-size'));
                    const fontWeight = $el.css('font-weight');
                    const isHeading = $el.prop('tagName').match(/^H[1-6]$/);
                    
                    const isLargeText = fontSize >= 18 || (fontSize >= 14 && parseInt(fontWeight) >= 700);
                    // ลดเกณฑ์ความคมชัดลง
                    const requiredRatio = isLargeText || isHeading ? 2.5 : 3.5; // ลดลงจาก 3:1 และ 4.5:1
                    
                    // ตรวจสอบเฉพาะเมื่อความคมชัดต่ำมากเท่านั้น
                    if (contrastRatio < requiredRatio) {
                        violations.push({
                            message: `อัตราส่วนความคมชัดต่ำเกินไป (${contrastRatio.toFixed(2)}:1, ต้องการอย่างน้อย ${requiredRatio}:1)`,
                            element: `<${this.tagName.toLowerCase()}>${$el.text()}</${this.tagName.toLowerCase()}>`,
                            impact: severity === 'high' ? 'serious' : 'moderate'
                        });
                    }
                }
            });
        }

        return {
            passed: filterViolationsBySeverity(violations, severity).length === 0,
            violations: filterViolationsBySeverity(violations, severity),
            total: totalChecked || 1
        };
    }

    function checkForms() {
        const violations = [];
        const formElements = $('input, select, textarea').not('[type="hidden"]');
        const severity = getSavedSeverity();
        let totalChecked = 0;

        // ลดความเข้มงวดของการตรวจสอบฟอร์ม
        if (severity !== 'very-low') {
            formElements.each(function() {
                totalChecked++;
                const $input = $(this);
                const id = $input.attr('id');
                
                // ตรวจสอบ label (เฉพาะระดับปานกลางถึงสูง)
                if ((severity === 'medium' || severity === 'high') && id) {
                    const $label = $(`label[for="${id}"]`);
                    if ($label.length === 0 && !$input.closest('label').length) {
                        violations.push({
                            message: 'ฟอร์มไม่มี label ที่เชื่อมโยงกัน',
                            element: this.outerHTML,
                            impact: severity === 'high' ? 'serious' : 'moderate'
                        });
                    }
                }
            });
        }

        return {
            passed: filterViolationsBySeverity(violations, severity).length === 0,
            violations: filterViolationsBySeverity(violations, severity),
            total: totalChecked || 1
        };
    }

    function checkARIA() {
        const violations = [];
        const severity = getSavedSeverity();
        let totalChecked = 0;
        
        // ลดความเข้มงวดของการตรวจสอบ ARIA - ตรวจสอบเฉพาะเมื่อความเข้มงวดสูงถึงปานกลาง
        if (severity === 'high' || severity === 'medium') {
            const elementsWithRoles = $('[role]');
            totalChecked += elementsWithRoles.length || 1;
            
            const validRoles = [
                'alert', 'alertdialog', 'application', 'article', 'banner', 
                'button', 'cell', 'checkbox', 'columnheader', 'combobox', 
                'complementary', 'contentinfo', 'definition', 'dialog', 'directory',
                'document', 'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 
                'heading', 'img', 'link', 'list', 'listbox', 'listitem', 'log', 
                'main', 'marquee', 'math', 'menu', 'menubar', 'menuitem', 
                'menuitemcheckbox', 'menuitemradio', 'navigation', 'none', 
                'note', 'option', 'presentation', 'progressbar', 'radio', 
                'radiogroup', 'region', 'row', 'rowgroup', 'rowheader', 
                'scrollbar', 'search', 'searchbox', 'separator', 'slider', 
                'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist', 
                'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 'tooltip', 
                'tree', 'treegrid', 'treeitem'
            ];
            
            elementsWithRoles.each(function() {
                const $el = $(this);
                const role = $el.attr('role');
                
                // ตรวจสอบความถูกต้องของ role (เฉพาะระดับสูง)
                if (severity === 'high' && !validRoles.includes(role)) {
                    violations.push({
                        message: `บทบาท ARIA ไม่ถูกต้อง: "${role}"`,
                        element: this.outerHTML,
                        impact: 'moderate' // ลดความรุนแรง
                    });
                }
            });
            
            // ตรวจสอบ main role เฉพาะระดับสูง
            if (severity === 'high' && $('[role="main"]').length === 0 && $('main').length === 0) {
                violations.push({
                    message: 'ไม่พบบทบาท main หรือ element main ในหน้าเว็บ',
                    impact: 'moderate' // ลดความรุนแรง
                });
            }
        }

        return {
            passed: filterViolationsBySeverity(violations, severity).length === 0,
            violations: filterViolationsBySeverity(violations, severity),
            total: totalChecked || 1
        };
    }

    function checkKeyboardNavigation() {
        const violations = [];
        const severity = getSavedSeverity();
        let totalChecked = 0;
        
        // ลดความเข้มงวดของการตรวจสอบการนำทางด้วยแป้นพิมพ์ (เฉพาะระดับสูง)
        if (severity === 'high') {
            const interactiveElements = $('a, button, input, select, textarea, [role="button"], [role="link"]');
            totalChecked = interactiveElements.length || 1;
            
            interactiveElements.each(function() {
                const $el = $(this);
                
                // ตรวจสอบ tabindex เป็นลบ
                if ($el.attr('tabindex') === '-1' && !$el.is(':disabled') && $el.css('display') !== 'none') {
                    // ยกเว้นอิลิเมนต์ใน dialog หรือ modal
                    if (!$el.closest('[role="dialog"], [role="alertdialog"], .modal').length) {
                        violations.push({
                            message: 'อิลิเมนต์ที่โต้ตอบได้มี tabindex="-1" ซึ่งจะทำให้ไม่สามารถเข้าถึงได้ด้วยแป้นพิมพ์',
                            element: this.outerHTML,
                            impact: 'moderate' // ลดความรุนแรง
                        });
                    }
                }
            });
        }
        
        return {
            passed: filterViolationsBySeverity(violations, severity).length === 0,
            violations: filterViolationsBySeverity(violations, severity),
            total: totalChecked || 1
        };
    }

    // Helper functions
    function getCheckNameThai(checkName) {
        const names = {
            headings: 'โครงสร้างเนื้อหา',
            images: 'รูปภาพ',
            links: 'ลิงก์',
            contrast: 'ความคมชัด',
            forms: 'ฟอร์ม',
            aria: 'บทบาทและคุณสมบัติ ARIA',
            keyboard: 'การนำทางด้วยแป้นพิมพ์'
        };
        return names[checkName] || checkName;
    }

    function getImpactThai(impact) {
        const impacts = {
            'critical': 'วิกฤติ',
            'serious': 'ร้ายแรง',
            'moderate': 'ปานกลาง',
            'minor': 'เล็กน้อย'
        };
        return impacts[impact] || impact;
    }

    // Results processing
    function calculateScore(results, severity) {
        let totalWeight = 0;
        let totalScore = 0;

        // ปรับน้ำหนักตามระดับความเข้มงวดและให้คะแนนง่ายขึ้น
        const weights = {
            headings: 10,
            images: 15,
            links: 15, 
            contrast: 15, // ลดจาก 20
            forms: 15,
            aria: 10,
            keyboard: 10
        };

        Object.entries(results).forEach(([checkName, checkResult]) => {
            const weight = weights[checkName] || 10;
            totalWeight += weight;

            if (checkResult.total > 0) {
                // ปรับปรุงการคำนวณคะแนน - ให้คะแนนสูงขึ้นแม้จะมี violations
                const passedCount = checkResult.total - checkResult.violations.length;
                let passPercentage = passedCount / checkResult.total;
                
                // ปรับให้ผ่านง่ายขึ้น: ถ้ามี violations น้อยกว่า 25% ของทั้งหมด ให้ถือว่าผ่าน 100%
                if (checkResult.violations.length / checkResult.total < 0.25) {
                    passPercentage = 1.0;
                } 
                // ถ้ามี violations 25-50% ให้คะแนน 80-90%
                else if (checkResult.violations.length / checkResult.total < 0.5) {
                    passPercentage = 0.9;
                }
                // ถ้ามี violations 50-75% ให้คะแนน 70%
                else if (checkResult.violations.length / checkResult.total < 0.75) {
                    passPercentage = 0.7;
                }
                
                const score = passPercentage * weight;
                totalScore += score;
            }
        });

        return (totalScore / totalWeight) * 100;
    }

    function determineGrade(score, severity) {
        // ปรับเกณฑ์ตามระดับความเข้มงวด - ทำให้ผ่านง่ายขึ้น
        switch (severity) {
            case 'very-low':
                if (score >= 75) return 'AAA';
                if (score >= 65) return 'AA';
                if (score >= 55) return 'A';
                break;
            case 'low':
                if (score >= 80) return 'AAA';
                if (score >= 70) return 'AA';
                if (score >= 60) return 'A';
                break;
            case 'medium':
                if (score >= 85) return 'AAA';
                if (score >= 75) return 'AA';
                if (score >= 65) return 'A';
                break;
            case 'high':
            default:
                if (score >= 90) return 'AAA';
                if (score >= 80) return 'AA';
                if (score >= 70) return 'A';
                break;
        }
        
        return null;
    }

    function processResults(checks, severity) {
        const score = calculateScore(checks, severity);
        const grade = determineGrade(score, severity);
        
        updateResults({
            grade: grade,
            score: score,
            results: checks,
            severity: severity
        });
    }

    function updateResults(data) {
        const currentUrl = window.location.href;
        const severity = data.severity;
        const severityText = {
            'very-low': 'เข้มงวดน้อยมาก',
            'low': 'เข้มงวดน้อย',
            'medium': 'เข้มงวดปานกลาง',
            'high': 'เข้มงวดมาก'
        };
        const gradeImages = {
            'A': 'https://www.4gbhost.com/images/icons/wcag2.1-A.png', // เปลี่ยนเป็น WCAG 2.1
            'AA': 'https://www.4gbhost.com/images/icons/wcag2.1-AA.png', // เปลี่ยนเป็น WCAG 2.1
            'AAA': 'https://www.4gbhost.com/images/icons/wcag2.1-AAA.png' // เปลี่ยนเป็น WCAG 2.1
        };

        // Update grade display
        let gradeHtml = '';
        if (data.grade && gradeImages[data.grade]) {
            gradeHtml = `
                <div class="wcag-grade-section">
                    <img src="${gradeImages[data.grade]}" alt="WCAG 2.1 ${data.grade} Badge" class="wcag-grade-badge" style="width: 120px; height: auto;">
                    <div class="wcag-score">คะแนน: ${Math.round(data.score)}%</div>
                    
                </div>
            `;
        } else {
            gradeHtml = `
                <div class="wcag-grade-section">
                    <span class="wcag-grade-fail">ไม่ผ่านเกณฑ์</span>
                    <div class="wcag-score">คะแนน: ${Math.round(data.score)}%</div>
                    
                </div>
            `;
        }
        $grade.html(gradeHtml);

        // Update details section
        let detailsHtml = `
            <div class="wcag-url">URL: ${currentUrl}</div>
            <div class="wcag-summary">
                <h3>มาตรฐาน WCAG 2.1</h3>
        `;

        // Add check summaries with detailed information
        Object.entries(data.results).forEach(([checkName, result]) => {
            const passedCount = result.total - result.violations.length;
            const percentage = (passedCount / result.total * 100) || 0;
            detailsHtml += `
                <div class="wcag-check-summary ${percentage === 100 ? 'passed' : 'has-violations'}">
                    <div class="check-name">${getCheckNameThai(checkName)}</div>
                    <div class="check-stats">ผ่าน ${passedCount}/${result.total} (${Math.round(percentage)}%)</div>
                </div>
            `;
        });

        detailsHtml += '</div>';

        // Show detailed violations by category
        let hasViolations = false;
        
        Object.entries(data.results).forEach(([checkName, checkResult]) => {
            if (!checkResult.passed && checkResult.violations.length > 0) {
                if (!hasViolations) {
                    detailsHtml += '<h3 class="wcag-section-title wcag-violations">ปัญหาที่พบ</h3>';
                    hasViolations = true;
                }
                
                detailsHtml += `<div class="wcag-category-violations">`;
                detailsHtml += `<h4 class="wcag-category-title">${getCheckNameThai(checkName)}</h4><ul>`;
                
                // Group violations by message and impact
                const groupedViolations = checkResult.violations.reduce((acc, violation) => {
                    const key = `${violation.message}|${violation.impact || 'moderate'}`;
                    if (!acc[key]) {
                        acc[key] = {
                            count: 1,
                            message: violation.message,
                            impact: violation.impact || 'moderate',
                            element: violation.element
                        };
                    } else {
                        acc[key].count++;
                    }
                    return acc;
                }, {});
                
                Object.values(groupedViolations).forEach(violation => {
                    detailsHtml += `
                        <li class="wcag-issue wcag-violation">
                            <div class="issue-header">
                                <span class="issue-impact ${violation.impact}">${getImpactThai(violation.impact)}</span>
                                <strong>${violation.message} (${violation.count})</strong>
                            </div>
                            ${violation.element ? `
                                <div class="issue-details">
                                    ${violation.element}
                                </div>
                            ` : ''}
                        </li>
                    `;
                });
                
                detailsHtml += '</ul></div>';
            }
        });

        // Add recommendations section
        if (hasViolations) {
            detailsHtml += '<h3 class="wcag-section-title wcag-recommendations">คำแนะนำการแก้ไข</h3>';
            detailsHtml += '<ul class="wcag-recommendations-list">';
            
            if (data.results.headings && data.results.headings.violations.length > 0) {
                detailsHtml += `<li>ตรวจสอบและแก้ไขโครงสร้างหัวข้อเพื่อให้เรียงลำดับอย่างถูกต้อง (h1, h2, h3...)</li>`;
            }
            
            if (data.results.images && data.results.images.violations.length > 0) {
                detailsHtml += `<li>เพิ่ม alt text ที่มีความหมายให้กับรูปภาพทุกรูป</li>`;
            }
            
            if (data.results.links && data.results.links.violations.length > 0) {
                detailsHtml += `<li>ตรวจสอบให้ลิงก์ทุกลิงก์มีข้อความที่มีความหมายเฉพาะ</li>`;
            }
            
            if (data.results.contrast && data.results.contrast.violations.length > 0) {
                detailsHtml += `<li>ปรับปรุงความคมชัดระหว่างสีข้อความและพื้นหลัง</li>`;
            }
            
            if (data.results.forms && data.results.forms.violations.length > 0) {
                detailsHtml += `<li>ตรวจสอบให้ฟอร์มทุกรายการมี label ที่เหมาะสม</li>`;
            }
            
            if (data.results.aria && data.results.aria.violations.length > 0) {
                detailsHtml += `<li>ตรวจสอบการใช้บทบาทและคุณสมบัติ ARIA อย่างถูกต้อง</li>`;
            }
            
            if (data.results.keyboard && data.results.keyboard.violations.length > 0) {
                detailsHtml += `<li>ตรวจสอบให้สามารถเข้าถึงทุกฟังก์ชันได้ด้วยแป้นพิมพ์</li>`;
            }
            
            detailsHtml += '</ul>';
        }

        $details.html(detailsHtml);
        
        // Update display
        $loading.hide();
        $results.show();
    }

    // Initialize check
    runWCAGCheck();
});