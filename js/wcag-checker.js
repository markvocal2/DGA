jQuery(document).ready(function($) {
    // --- Cache DOM Elements ---
    const $container = $('.wcag-checker-container');
    const $loading = $container.find('.wcag-loading');
    const $results = $container.find('.wcag-results');
    const $grade = $container.find('.wcag-grade');
    const $details = $container.find('.wcag-details');
    const $detailsToggle = $container.find('.wcag-details-toggle');
    const $modal = $('#wcag-modal');
    const $modalContent = $('#wcag-modal-content');
    const $modalClose = $('.wcag-modal-close');

    // --- Constants and Configuration ---
    const SEVERITY_TEXT = {
        'very-low': 'เข้มงวดน้อยมาก',
        'low': 'เข้มงวดน้อย',
        'medium': 'เข้มงวดปานกลาง',
        'high': 'เข้มงวดมาก'
    };
    const GRADE_IMAGES = {
        'A': 'https://www.4gbhost.com/images/icons/wcag2.1-A.png',
        'AA': 'https://www.4gbhost.com/images/icons/wcag2.1-AA.png',
        'AAA': 'https://www.4gbhost.com/images/icons/wcag2.1-AAA.png'
    };
    const CHECK_NAMES_THAI = {
        headings: 'โครงสร้างเนื้อหา',
        images: 'รูปภาพ',
        links: 'ลิงก์',
        contrast: 'ความคมชัด',
        forms: 'ฟอร์ม',
        aria: 'บทบาทและคุณสมบัติ ARIA',
        keyboard: 'การนำทางด้วยแป้นพิมพ์'
    };
    const IMPACT_THAI = {
        'critical': 'วิกฤติ',
        'serious': 'ร้ายแรง',
        'moderate': 'ปานกลาง',
        'minor': 'เล็กน้อย'
    };

    // ปรับปรุงการตรวจสอบ JavaScript: links
if (severity === 'high' && href && typeof href === 'string') {
    // ตรวจสอบอย่างปลอดภัยโดยใช้ toLowerCase และ indexOf แทน startsWith
    // และแยกการตรวจสอบสตริงออกมาเป็นตัวแปรก่อน เพื่อหลีกเลี่ยงการทำงานกับ input โดยตรง
    const hrefLower = href.toLowerCase();
    const hasJavascriptProtocol = hrefLower.indexOf('javascript:') === 0;
    
    if (hasJavascriptProtocol) {
        violations.push({
            message: 'ใช้ javascript: ใน href (ควรใช้ button แทนสำหรับการเรียกใช้ JavaScript)',
            element: this.outerHTML,
            impact: 'minor' // อาจจะ moderate เป็น minor
        });
    }
}

    // --- Helper Functions ---

    // ดึงชื่อหมวดหมู่การตรวจสอบเป็นภาษาไทย
    function getCheckNameThai(checkName) {
        return CHECK_NAMES_THAI[checkName] || checkName;
    }

    // ดึงระดับผลกระทบเป็นภาษาไทย
    function getImpactThai(impact) {
        return IMPACT_THAI[impact] || impact;
    }

    // ฟังก์ชั่นสำหรับดึงค่าความเข้มงวดที่บันทึกไว้
    function getSavedSeverity() {
        return localStorage.getItem('wcagCheckerSeverity') || 'low'; // ค่าเริ่มต้นคือ เข้มงวดน้อย
    }

    // ฟังก์ชั่นสำหรับกรอง violations ตามระดับความเข้มงวด
    function filterViolationsBySeverity(violations, severity) {
        // (Implementation from original code - kept for brevity)
        switch (severity) {
            case 'very-low':
                return violations.filter(v => v.impact === 'critical');
            case 'low':
                return violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
            case 'medium':
                 // Ensure v.message exists before calling includes
                return violations.filter(v => v.impact === 'critical' || v.impact === 'serious' ||
                    (v.impact === 'moderate' && v.message && v.message.includes('สำคัญ')));
            case 'high':
            default:
                 // Ensure v.message exists before calling includes
                return violations.filter(v => v.impact !== 'minor' || (v.message && v.message.includes('สำคัญ')));
        }
    }

    // --- Check Functions (Simplified stubs for context) ---
    // These functions perform the actual WCAG checks and return results
    // based on the current page content and severity level.
    // The implementation details are kept from the original code.
    function checkHeadings() { /* ... implementation ... */
        const violations = []; // Example: Populate based on checks
        const severity = getSavedSeverity();
        // ... logic to find violations ...
         return {
             passed: filterViolationsBySeverity(violations, severity).length === 0,
             violations: filterViolationsBySeverity(violations, severity),
             total: $('h1, h2, h3, h4, h5, h6').length || 1 // Example total
         };
    }
    function checkImages() { /* ... implementation ... */
         const violations = [];
         const severity = getSavedSeverity();
         return {
             passed: filterViolationsBySeverity(violations, severity).length === 0,
             violations: filterViolationsBySeverity(violations, severity),
             total: $('img').length || 1
         };
     }
    function checkLinks() { /* ... implementation ... */
         const violations = [];
         const severity = getSavedSeverity();
         return {
             passed: filterViolationsBySeverity(violations, severity).length === 0,
             violations: filterViolationsBySeverity(violations, severity),
             total: $('a').length || 1
         };
     }
    function checkContrast() { /* ... implementation ... */
         const violations = [];
         const severity = getSavedSeverity();
         return {
             passed: filterViolationsBySeverity(violations, severity).length === 0,
             violations: filterViolationsBySeverity(violations, severity),
             total: 1 // Contrast is often a single check or complex to count elements
         };
     }
    function checkForms() { /* ... implementation ... */
         const violations = [];
         const severity = getSavedSeverity();
         return {
             passed: filterViolationsBySeverity(violations, severity).length === 0,
             violations: filterViolationsBySeverity(violations, severity),
             total: $('input, select, textarea').not('[type="hidden"]').length || 1
         };
     }
    function checkARIA() { /* ... implementation ... */
         const violations = [];
         const severity = getSavedSeverity();
         return {
             passed: filterViolationsBySeverity(violations, severity).length === 0,
             violations: filterViolationsBySeverity(violations, severity),
             total: $('[role]').length || 1
         };
     }
    function checkKeyboardNavigation() { /* ... implementation ... */
         const violations = [];
         const severity = getSavedSeverity();
         return {
             passed: filterViolationsBySeverity(violations, severity).length === 0,
             violations: filterViolationsBySeverity(violations, severity),
             total: 1 // Often a general check
         };
     }

    // --- Score and Grade Calculation ---
    function calculateScore(results, severity) {
        let totalWeight = 0;
        let totalScore = 0;
        const weights = { headings: 10, images: 15, links: 15, contrast: 15, forms: 15, aria: 10, keyboard: 10 };

        Object.entries(results).forEach(([checkName, checkResult]) => {
            const weight = weights[checkName] || 10;
            totalWeight += weight;
            if (checkResult.total > 0) {
                const violationCount = checkResult.violations?.length || 0; // Ensure violations is an array
                const passedCount = checkResult.total - violationCount;
                let passPercentage = passedCount / checkResult.total;

                // Adjust scoring logic (simplified from original)
                if (violationCount / checkResult.total < 0.25) passPercentage = 1.0;
                else if (violationCount / checkResult.total < 0.5) passPercentage = 0.9;
                else if (violationCount / checkResult.total < 0.75) passPercentage = 0.7;

                totalScore += passPercentage * weight;
            }
        });
        // Avoid division by zero if totalWeight is 0
        return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
    }

    function determineGrade(score, severity) {
        // (Implementation from original code - kept for brevity)
        switch (severity) {
             case 'very-low':
                 if (score >= 75) return 'AAA'; if (score >= 65) return 'AA'; if (score >= 55) return 'A'; break;
             case 'low':
                 if (score >= 80) return 'AAA'; if (score >= 70) return 'AA'; if (score >= 60) return 'A'; break;
             case 'medium':
                 if (score >= 85) return 'AAA'; if (score >= 75) return 'AA'; if (score >= 65) return 'A'; break;
             case 'high': default:
                 if (score >= 90) return 'AAA'; if (score >= 80) return 'AA'; if (score >= 70) return 'A'; break;
         }
         return null; // Return null if no grade is met
    }

    // --- HTML Generation Helpers (Refactored for updateResults) ---

    /**
     * Generates HTML for the grade display section.
     * @param {string|null} grade - The calculated grade (A, AA, AAA) or null.
     * @param {number} score - The calculated score percentage.
     * @returns {string} HTML string for the grade section.
     */
    function generateGradeHtml(grade, score) {
        const scoreText = `คะแนน: ${Math.round(score)}%`;
        if (grade && GRADE_IMAGES[grade]) {
            return `
                <div class="wcag-grade-section">
                    <img src="${GRADE_IMAGES[grade]}" alt="WCAG 2.1 ${grade} Badge" class="wcag-grade-badge" style="width: 120px; height: auto;">
                    <div class="wcag-score">${scoreText}</div>
                </div>
            `;
        } else {
            return `
                <div class="wcag-grade-section">
                    <span class="wcag-grade-fail">ไม่ผ่านเกณฑ์</span>
                    <div class="wcag-score">${scoreText}</div>
                </div>
            `;
        }
    }

    /**
     * Generates HTML for the summary section (URL, standard, check summaries).
     * @param {object} results - The results object from all checks.
     * @param {string} currentUrl - The URL being checked.
     * @returns {string} HTML string for the summary section.
     */
    function generateSummaryHtml(results, currentUrl) {
        let summaryHtml = `
            <div class="wcag-url">URL: ${currentUrl}</div>
            <div class="wcag-summary">
                <h3>มาตรฐาน WCAG 2.1</h3>
        `;
        Object.entries(results).forEach(([checkName, result]) => {
             // Ensure result and result.total are valid numbers
             const total = Number(result?.total) || 0;
             const violationCount = result?.violations?.length || 0;
             const passedCount = total > 0 ? Math.max(0, total - violationCount) : 0;
             const percentage = total > 0 ? (passedCount / total * 100) : 0;

            summaryHtml += `
                <div class="wcag-check-summary ${percentage === 100 ? 'passed' : 'has-violations'}">
                    <div class="check-name">${getCheckNameThai(checkName)}</div>
                    <div class="check-stats">ผ่าน ${passedCount}/${total} (${Math.round(percentage)}%)</div>
                </div>
            `;
        });
        summaryHtml += '</div>';
        return summaryHtml;
    }

    /**
     * Groups violations by message and impact.
     * @param {Array} violations - Array of violation objects.
     * @returns {object} Object with grouped violations.
     */
    function groupViolations(violations) {
        if (!Array.isArray(violations)) return {}; // Return empty object if not an array
        return violations.reduce((acc, violation) => {
            // Ensure violation has necessary properties
            const message = violation?.message || 'Unknown Violation';
            const impact = violation?.impact || 'moderate';
            const element = violation?.element;
            const key = `${message}|${impact}`;

            if (!acc[key]) {
                acc[key] = { count: 0, message: message, impact: impact, elements: [] };
            }
            acc[key].count++;
            // Optionally store the first element or all elements
            if (element && acc[key].elements.length < 5) { // Limit stored elements for brevity
                 acc[key].elements.push(element);
            }
            return acc;
        }, {});
    }

    /**
     * Generates HTML for the detailed violations section.
     * @param {object} results - The results object from all checks.
     * @returns {{html: string, hasAnyViolations: boolean}} Object containing HTML and a flag.
     */
    function generateViolationsHtml(results) {
        let violationsHtml = '';
        let hasAnyViolations = false;

        Object.entries(results).forEach(([checkName, checkResult]) => {
            const violations = checkResult?.violations;
            if (Array.isArray(violations) && violations.length > 0) {
                if (!hasAnyViolations) {
                    violationsHtml += '<h3 class="wcag-section-title wcag-violations">ปัญหาที่พบ</h3>';
                    hasAnyViolations = true;
                }
                violationsHtml += `<div class="wcag-category-violations">`;
                violationsHtml += `<h4 class="wcag-category-title">${getCheckNameThai(checkName)}</h4><ul>`;

                const grouped = groupViolations(violations);
                Object.values(grouped).forEach(violation => {
                    // Display only the first example element for brevity in the main list
                    const firstElementExample = violation.elements.length > 0 ? `<div class="issue-details">${violation.elements[0]}</div>` : '';
                    violationsHtml += `
                        <li class="wcag-issue wcag-violation">
                            <div class="issue-header">
                                <span class="issue-impact ${violation.impact}">${getImpactThai(violation.impact)}</span>
                                <strong>${violation.message} (${violation.count})</strong>
                            </div>
                            ${firstElementExample}
                        </li>
                    `;
                });
                violationsHtml += '</ul></div>';
            }
        });
        return { html: violationsHtml, hasAnyViolations: hasAnyViolations };
    }

    /**
     * Generates HTML for the recommendations section based on found violations.
     * @param {object} results - The results object from all checks.
     * @param {boolean} hasAnyViolations - Flag indicating if any violations were found.
     * @returns {string} HTML string for the recommendations section.
     */
    function generateRecommendationsHtml(results, hasAnyViolations) {
        if (!hasAnyViolations) return ''; // No recommendations if no violations

        let recommendationsHtml = '<h3 class="wcag-section-title wcag-recommendations">คำแนะนำการแก้ไข</h3>';
        recommendationsHtml += '<ul class="wcag-recommendations-list">';
        const recommendationsAdded = new Set(); // Prevent duplicate generic recommendations

        // Add specific recommendations based on violation categories
        if (results?.headings?.violations?.length > 0 && !recommendationsAdded.has('headings')) {
            recommendationsHtml += `<li>ตรวจสอบและแก้ไขโครงสร้างหัวข้อเพื่อให้เรียงลำดับอย่างถูกต้อง (h1, h2, h3...)</li>`;
            recommendationsAdded.add('headings');
        }
        if (results?.images?.violations?.length > 0 && !recommendationsAdded.has('images')) {
            recommendationsHtml += `<li>เพิ่ม alt text ที่มีความหมายให้กับรูปภาพทุกรูป หรือทำเครื่องหมายเป็น decorative ถ้าไม่สำคัญ</li>`;
            recommendationsAdded.add('images');
        }
        if (results?.links?.violations?.length > 0 && !recommendationsAdded.has('links')) {
            recommendationsHtml += `<li>ตรวจสอบให้ลิงก์ทุกลิงก์มีข้อความที่สื่อความหมายชัดเจน หรือมีข้อความทางเลือกที่เหมาะสม</li>`;
            recommendationsAdded.add('links');
        }
        if (results?.contrast?.violations?.length > 0 && !recommendationsAdded.has('contrast')) {
            recommendationsHtml += `<li>ปรับปรุงความคมชัดระหว่างสีข้อความและพื้นหลังให้เป็นไปตามเกณฑ์ WCAG</li>`;
            recommendationsAdded.add('contrast');
        }
        if (results?.forms?.violations?.length > 0 && !recommendationsAdded.has('forms')) {
            recommendationsHtml += `<li>ตรวจสอบให้ฟอร์มทุกรายการมี label ที่เชื่อมโยงกันอย่างถูกต้อง</li>`;
            recommendationsAdded.add('forms');
        }
        if (results?.aria?.violations?.length > 0 && !recommendationsAdded.has('aria')) {
            recommendationsHtml += `<li>ตรวจสอบการใช้บทบาทและคุณสมบัติ ARIA ให้ถูกต้องตามมาตรฐาน</li>`;
            recommendationsAdded.add('aria');
        }
        if (results?.keyboard?.violations?.length > 0 && !recommendationsAdded.has('keyboard')) {
            recommendationsHtml += `<li>ตรวจสอบให้แน่ใจว่าสามารถเข้าถึงและใช้งานองค์ประกอบที่โต้ตอบได้ทั้งหมดด้วยแป้นพิมพ์</li>`;
            recommendationsAdded.add('keyboard');
        }

        if (recommendationsAdded.size === 0) {
             recommendationsHtml += `<li>ไม่พบปัญหาหลักตามเกณฑ์ที่ตั้งค่าไว้</li>`; // Message if somehow no recommendations were added despite violations flag
        }

        recommendationsHtml += '</ul>';
        return recommendationsHtml;
    }

    // --- Main Results Processing (Refactored) ---
    /**
     * Processes the check results, calculates score/grade, and updates the UI.
     * @param {object} checks - Object containing results from all check functions.
     * @param {string} severity - The current severity level.
     */
    function processResults(checks, severity) {
        const score = calculateScore(checks, severity);
        const grade = determineGrade(score, severity);
        const currentUrl = window.location.href;

        // Generate HTML parts using helper functions
        const gradeHtml = generateGradeHtml(grade, score);
        const summaryHtml = generateSummaryHtml(checks, currentUrl);
        const { html: violationsHtml, hasAnyViolations } = generateViolationsHtml(checks);
        const recommendationsHtml = generateRecommendationsHtml(checks, hasAnyViolations);

        // Update DOM
        $grade.html(gradeHtml);
        $details.html(summaryHtml + violationsHtml + recommendationsHtml); // Combine HTML parts

        // Update display
        $loading.hide();
        $results.show();
    }

    // --- Main Check Runner ---
    function runWCAGCheck() {
        $loading.show();
        $results.hide();

        const severity = getSavedSeverity();

        // Run all checks (using simplified stubs above for example)
        const checks = {
            headings: checkHeadings(),
            images: checkImages(),
            links: checkLinks(),
            contrast: checkContrast(),
            forms: checkForms(),
            aria: checkARIA(),
            keyboard: checkKeyboardNavigation()
        };

        // Process and display the results
        processResults(checks, severity);
    }

    // --- Severity Settings Modal ---
    function openSeveritySettings() {
        const currentSeverity = getSavedSeverity();
        // Build settings HTML dynamically
        let settingsHTML = `
            <div class="wcag-severity-settings">
                <h3 class="wcag-severity-title">ตั้งค่าความเข้มงวดในการตรวจสอบ</h3>
                <div class="wcag-severity-options">`;

        Object.entries(SEVERITY_TEXT).forEach(([value, label]) => {
            const descriptions = { // Descriptions for each level
                'very-low': 'ตรวจสอบเฉพาะปัญหาที่สำคัญและมีผลกระทบสูงเท่านั้น (Critical)',
                'low': 'ตรวจสอบปัญหาที่สำคัญและปัญหาที่มีผลกระทบปานกลาง (Critical, Serious)',
                'medium': 'ตรวจสอบปัญหาส่วนใหญ่ ยกเว้นปัญหาที่มีผลกระทบต่ำ (Critical, Serious, Moderate)',
                'high': 'ตรวจสอบปัญหาทั้งหมดรวมถึงการแนะนำสำหรับ WCAG AAA (All Impacts)'
            };
            const isChecked = currentSeverity === value;
            settingsHTML += `
                <div class="wcag-severity-option ${isChecked ? 'selected' : ''}" data-value="${value}">
                    <input type="radio" name="wcag-severity" id="wcag-severity-${value}" value="${value}" ${isChecked ? 'checked' : ''}>
                    <label for="wcag-severity-${value}">${label}</label>
                    <p>${descriptions[value] || ''}</p>
                </div>`;
        });

        settingsHTML += `
                </div>
                <div class="wcag-settings-buttons">
                    <button id="wcag-save-settings" class="wcag-save-button">บันทึกการตั้งค่า</button>
                    <button id="wcag-cancel-settings" class="wcag-cancel-button">ยกเลิก</button>
                </div>
            </div>`;

        // Display Modal and add HTML
        $modalContent.html(settingsHTML);
        $modal.fadeIn(300);

        // Add event listeners for buttons and options within the modal
        // Use .off().on() to prevent duplicate bindings if modal opens multiple times
        $modalContent.off('click.wcagSettings').on('click.wcagSettings', '#wcag-save-settings', saveSeveritySettings);
        $modalContent.on('click.wcagSettings', '#wcag-cancel-settings', () => $modal.fadeOut(300));
        $modalContent.on('click.wcagSettings', '.wcag-severity-option', function() {
            const $this = $(this);
            $('.wcag-severity-option').removeClass('selected');
            $this.addClass('selected');
            $this.find('input[type="radio"]').prop('checked', true);
        });
    }

    function saveSeveritySettings() {
        const selectedSeverity = $('input[name="wcag-severity"]:checked').val();
        if (selectedSeverity) {
            localStorage.setItem('wcagCheckerSeverity', selectedSeverity);
        }
        $modal.fadeOut(300);
        // Re-run check immediately if results were previously visible
        if ($results.is(':visible')) {
            runWCAGCheck();
        }
    }

    // --- Event Listeners ---
    $detailsToggle.on('click', function() {
        // Show full details in modal
        $modalContent.html($details.html()); // Copy current details content
        $modal.fadeIn(300);
    });

    $modalClose.on('click', function() {
        $modal.fadeOut(300);
    });

    $modal.on('click', function(e) {
        // Close if clicking on the modal background (this)
        if (e.target === this) {
            $modal.fadeOut(300);
        }
    });

    $(document).on('keydown', function(e) {
        // Close modal with Escape key
        if (e.key === 'Escape' && $modal.is(':visible')) {
            $modal.fadeOut(300);
        }
        // Detect Ctrl+Shift+C shortcut
        if (e.ctrlKey && e.shiftKey && (e.key === 'c' || e.key === 'C')) {
            e.preventDefault(); // Prevent browser default action
            openSeveritySettings();
        }
    });

    // --- Initial Check ---
    runWCAGCheck();
});
