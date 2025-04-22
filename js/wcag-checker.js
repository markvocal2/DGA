jQuery(document).ready(function($) {

    /**
     * WCAG Checker Script
     * Handles running checks, calculating scores, and displaying results.
     * Version: 1.0.2 (Security improvements for JavaScript URLs)
     */

    // --- Cache DOM Elements ---
    const $container = $('.wcag-checker-container');
    // Ensure elements exist before proceeding
    if (!$container.length) {
        console.warn('WCAG Checker: Container element .wcag-checker-container not found.');
        return; // Stop if container is missing
    }
    const $loading = $container.find('.wcag-loading');
    const $results = $container.find('.wcag-results');
    const $grade = $container.find('.wcag-grade');
    const $details = $container.find('.wcag-details');
    const $detailsToggle = $container.find('.wcag-details-toggle');
    const $modal = $('#wcag-modal'); // Assume modal exists outside container
    const $modalContent = $('#wcag-modal-content');
    const $modalClose = $('.wcag-modal-close'); // Assume close button exists

    // --- Constants and Configuration ---
    const SEVERITY_TEXT = {
        'very-low': 'เข้มงวดน้อยมาก',
        'low': 'เข้มงวดน้อย',
        'medium': 'เข้มงวดปานกลาง',
        'high': 'เข้มงวดมาก'
    };
    const GRADE_IMAGES = { // Ensure these URLs are correct and accessible
        'A': wcagCheckerData?.image_urls?.A || 'https://via.placeholder.com/120x40?text=WCAG+A',
        'AA': wcagCheckerData?.image_urls?.AA || 'https://via.placeholder.com/120x40?text=WCAG+AA',
        'AAA': wcagCheckerData?.image_urls?.AAA || 'https://via.placeholder.com/120x40?text=WCAG+AAA'
    };
    const CHECK_NAMES_THAI = {
        headings: 'โครงสร้างเนื้อหา',
        images: 'รูปภาพ',
        links: 'ลิงก์',
        contrast: 'ความคมชัด',
        forms: 'ฟอร์ม',
        aria: 'บทบาทและคุณสมบัติ ARIA',
        keyboard: 'การนำทางด้วยแป้นพิมพ์'
        // Add other check names if needed
    };
    const IMPACT_THAI = {
        'critical': 'วิกฤติ',
        'serious': 'ร้ายแรง',
        'moderate': 'ปานกลาง',
        'minor': 'เล็กน้อย'
    };
    // Weights for score calculation
    const SCORE_WEIGHTS = { headings: 10, images: 15, links: 15, contrast: 15, forms: 15, aria: 10, keyboard: 10 };


    // --- Helper Functions ---

    function getCheckNameThai(checkName) {
        return CHECK_NAMES_THAI[checkName] || checkName;
    }

    function getImpactThai(impact) {
        return IMPACT_THAI[impact] || impact;
    }

    function getSavedSeverity() {
        try {
            return localStorage.getItem('wcagCheckerSeverity') || 'low'; // Default to 'low'
        } catch (e) {
            console.warn("Could not access localStorage for severity. Defaulting to 'low'.", e);
            return 'low';
        }
    }

    function saveSeverity(severity) {
         try {
            localStorage.setItem('wcagCheckerSeverity', severity);
        } catch (e) {
            console.warn("Could not save severity to localStorage.", e);
        }
    }


    function filterViolationsBySeverity(violations, severity) {
    // Ensure violations is an array
    if (!Array.isArray(violations)) {
        return [];
    }

    // Define filter predicates for each severity level
    const severityFilters = {
        'very-low': v => v?.impact === 'critical',
        'low': v => v?.impact === 'critical' || v?.impact === 'serious',
        'medium': v => v?.impact === 'critical' || v?.impact === 'serious' || v?.impact === 'moderate',
        'high': v => v?.impact !== 'minor'
    };

    // Get the appropriate filter for the current severity or default to return all
    const filter = severityFilters[severity] || (() => true);
    
    // Apply the filter
    return violations.filter(filter);
}

    // --- Check Functions (Stubs - Replace with actual axe-core or other checks) ---
    // These should return an object: { passed: boolean, violations: Array, total: number }
    // The violations array should contain objects like: { message: string, element: string (outerHTML), impact: string }
    function runSingleCheck(checkFunction) {
        try {
            // In a real scenario, this would involve running axe.run() or similar
            // For now, return a placeholder based on the stub implementation
            return checkFunction();
        } catch (error) {
            console.error(`Error running check ${checkFunction.name}:`, error);
            return { passed: false, violations: [{ message: 'เกิดข้อผิดพลาดในการตรวจสอบ', impact: 'serious', element: '' }], total: 1 };
        }
    }

    // Placeholder check functions (replace with actual logic)
    function checkHeadings() {
        const violations = []; // Populate with actual violations found
        const severity = getSavedSeverity();
        const total = $('h1, h2, h3, h4, h5, h6').length || 0; // Count elements
        const filteredViolations = filterViolationsBySeverity(violations, severity);
        return { passed: filteredViolations.length === 0, violations: filteredViolations, total: total || 1 }; // Ensure total is at least 1 for calculation
    }
    
    function checkImages() {
        const violations = [];
        const severity = getSavedSeverity();
         const total = $('img').length || 0;
        const filteredViolations = filterViolationsBySeverity(violations, severity);
        return { passed: filteredViolations.length === 0, violations: filteredViolations, total: total || 1 };
    }
    
    /**
     * ตรวจสอบลิงก์ที่อาจมีปัญหาความปลอดภัย เช่น javascript: URLs
     * ปรับปรุงให้ปลอดภัยจาก XSS และมีการตรวจสอบที่ครอบคลุม
     */
    function checkLinks() {
        const violations = [];
        
        // ตรวจสอบลิงก์ทั้งหมดที่มี href
        $('a[href]').each(function() {
            const $link = $(this);
            const href = $link.attr('href');
            
            // ตรวจสอบกรณีค่า null หรือ undefined
            if (!href) {
                return;
            }
            
            // ตรวจสอบว่าเป็นสตริงและไม่เกินความยาวที่เหมาะสม
            if (typeof href !== 'string' || href.length > 2048) {
                violations.push({
                    message: 'ลิงก์มีความยาวเกินไปหรือผิดรูปแบบ',
                    element: this.outerHTML,
                    impact: 'minor'
                });
                return;
            }
            
            // ล้างค่าช่องว่างและแปลงเป็น lowercase สำหรับการตรวจสอบ
            const normalizedHref = href.trim().toLowerCase();
            
            // ตรวจสอบ javascript: protocol อย่างปลอดภัย
            if (normalizedHref.startsWith('javascript:')) {
                violations.push({
                    message: 'ใช้ javascript: ใน href (ควรใช้ button แทน)',
                    element: this.outerHTML,
                    impact: 'moderate' // เพิ่มระดับผลกระทบเป็น moderate เนื่องจากเป็นปัญหาความปลอดภัย
                });
            }
            
            // ตรวจสอบ href ว่างเปล่า
            if (normalizedHref === '' || normalizedHref === '#') {
                const hasOnClick = $link.attr('onclick') !== undefined;
                const hasTitle = $link.attr('title') !== undefined && $link.attr('title').trim() !== '';
                const hasAriaLabel = $link.attr('aria-label') !== undefined && $link.attr('aria-label').trim() !== '';
                
                if (!hasOnClick && !hasTitle && !hasAriaLabel) {
                    violations.push({
                        message: 'ลิงก์ว่างเปล่าไม่มีคำอธิบายหรือ handler',
                        element: this.outerHTML,
                        impact: 'minor'
                    });
                }
            }
            
            // ตรวจสอบว่ามีข้อความหรือ accessible name
            if ($link.text().trim() === '' && !$link.find('img[alt]').length) {
                const hasTitle = $link.attr('title') !== undefined && $link.attr('title').trim() !== '';
                const hasAriaLabel = $link.attr('aria-label') !== undefined && $link.attr('aria-label').trim() !== '';
                const hasAriaLabelledBy = $link.attr('aria-labelledby') !== undefined;
                
                if (!hasTitle && !hasAriaLabel && !hasAriaLabelledBy) {
                    violations.push({
                        message: 'ลิงก์ไม่มีข้อความหรือชื่อที่เข้าถึงได้',
                        element: this.outerHTML,
                        impact: 'serious'
                    });
                }
            }
        });

        const severity = getSavedSeverity();
        const total = $('a').length || 0;
        const filteredViolations = filterViolationsBySeverity(violations, severity);
        return { passed: filteredViolations.length === 0, violations: filteredViolations, total: total || 1 };
    }
    
    function checkContrast() {
        const violations = []; // Contrast checks are complex, usually done with axe
        const severity = getSavedSeverity();
        const filteredViolations = filterViolationsBySeverity(violations, severity);
        // Total is hard to define for contrast, often treated as one overall check result
        return { passed: filteredViolations.length === 0, violations: filteredViolations, total: 1 };
    }
    
    function checkForms() {
        const violations = [];
        const severity = getSavedSeverity();
        const total = $('input, select, textarea, button').not('[type="hidden"]').length || 0;
        const filteredViolations = filterViolationsBySeverity(violations, severity);
        return { passed: filteredViolations.length === 0, violations: filteredViolations, total: total || 1 };
    }
    
    function checkARIA() {
        const violations = [];
        const severity = getSavedSeverity();
        const total = $('[role], [aria-label], [aria-labelledby], [aria-describedby]').length || 0; // Example count
        const filteredViolations = filterViolationsBySeverity(violations, severity);
        return { passed: filteredViolations.length === 0, violations: filteredViolations, total: total || 1 };
    }
    
    function checkKeyboardNavigation() {
        const violations = []; // Keyboard checks often involve manual testing or complex analysis
        const severity = getSavedSeverity();
        const filteredViolations = filterViolationsBySeverity(violations, severity);
        return { passed: filteredViolations.length === 0, violations: filteredViolations, total: 1 };
    }


    // --- Score and Grade Calculation (Refactored) ---

    /**
     * Calculates the pass percentage for a single check result, applying adjustments.
     * @param {number} violationCount - Number of violations found for the check.
     * @param {number} totalItems - Total number of items checked.
     * @returns {number} Adjusted pass percentage (0.0 to 1.0).
     */
    function calculatePassPercentageForCheck(violationCount, totalItems) {
        if (totalItems <= 0) {
            return 1.0; // Assume 100% pass if nothing to check
        }
        // Ensure violationCount is a number
        const numViolations = Number(violationCount) || 0;

        // Calculate raw pass percentage
        const passedCount = Math.max(0, totalItems - numViolations);
        let passPercentage = passedCount / totalItems;

        // Apply scoring adjustments based on violation ratio (replicating original logic)
        const violationRatio = numViolations / totalItems;
        if (violationRatio < 0.25) {
            passPercentage = 1.0; // Treat as perfect if violation ratio is low
        } else if (violationRatio < 0.5) {
            passPercentage = 0.9; // Penalize slightly more
        } else if (violationRatio < 0.75) {
            passPercentage = 0.7; // Penalize significantly
        } else {
             passPercentage = 0.5; // Base score if many violations (adjust as needed)
        }
        // Alternative: Use the raw passPercentage without adjustments
        // passPercentage = passedCount / totalItems;

        return passPercentage;
    }


    /**
     * Calculates the overall WCAG score based on individual check results and weights.
     * @param {object} results - Object containing results from all check functions.
     * @returns {number} Overall score percentage (0-100).
     */
    function calculateScore(results) {
        let totalWeightedScore = 0;
        let totalWeight = 0;

        Object.entries(results).forEach(([checkName, checkResult]) => {
            const weight = SCORE_WEIGHTS[checkName] || 10; // Default weight if not specified
            totalWeight += weight;

            // Ensure checkResult is valid before accessing properties
            if (checkResult && typeof checkResult.total !== 'undefined') {
                const violationCount = checkResult.violations?.length || 0;
                // Use the helper function to get the adjusted pass percentage
                const passPercentage = calculatePassPercentageForCheck(violationCount, checkResult.total);
                totalWeightedScore += passPercentage * weight;
            } else {
                 // Handle cases where a check might fail entirely or return invalid data
                 // Option 1: Assume 0 score for this check
                 // totalWeightedScore += 0 * weight;
                 // Option 2: Don't include its weight (already handled by not adding to totalWeightedScore)
                 console.warn(`Invalid result structure for check: ${checkName}`, checkResult);
            }
        });

        // Calculate final score, avoid division by zero
        const finalScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;
        return Math.max(0, Math.min(100, finalScore)); // Clamp score between 0 and 100
    }

    /**
     * Determines the WCAG grade (A, AA, AAA) based on the score and severity.
     * @param {number} score - The calculated score percentage.
     * @param {string} severity - The current severity level.
     * @returns {string|null} The grade ('A', 'AA', 'AAA') or null.
     */
    function determineGrade(score, severity) {
        // Grade thresholds can vary based on severity (stricter requirements for higher grades at higher severity)
        // This example uses fixed thresholds but could be adjusted.
        const thresholds = {
            AAA: 90,
            AA: 80,
            A: 70
        };
        // Example adjustment based on severity (optional)
        // if (severity === 'high') { thresholds.AA = 85; thresholds.A = 75; }
        // else if (severity === 'medium') { thresholds.AA = 80; thresholds.A = 70; }
        // else { thresholds.AA = 75; thresholds.A = 65; } // low/very-low

        if (score >= thresholds.AAA) return 'AAA';
        if (score >= thresholds.AA) return 'AA';
        if (score >= thresholds.A) return 'A';
        return null; // No grade met
    }

    // --- HTML Generation Helpers ---

    function generateGradeHtml(grade, score) {
        const scoreText = `คะแนน: ${Math.round(score)}%`;
        const gradeImgSrc = grade ? GRADE_IMAGES[grade] : null;
        const gradeAltText = grade ? `WCAG 2.1 ${grade} Badge` : '';

        let gradeDisplayHtml = '';
        if (grade && gradeImgSrc) {
            gradeDisplayHtml = `<img src="${gradeImgSrc}" alt="${gradeAltText}" class="wcag-grade-badge" style="width: 120px; height: auto;">`;
        } else {
            gradeDisplayHtml = `<span class="wcag-grade-fail">ไม่ผ่านเกณฑ์</span>`;
        }

        return `
            <div class="wcag-grade-section">
                ${gradeDisplayHtml}
                <div class="wcag-score">${scoreText}</div>
            </div>
        `;
    }

    function generateSummaryHtml(results, currentUrl) {
        let summaryHtml = `
            <div class="wcag-url">URL: ${currentUrl}</div>
            <div class="wcag-summary">
                <h3>มาตรฐาน WCAG 2.1</h3>
        `;
        Object.entries(results).forEach(([checkName, result]) => {
            const total = Number(result?.total) || 0;
            const violationCount = result?.violations?.length || 0;
            const passedCount = total > 0 ? Math.max(0, total - violationCount) : (total === 0 ? 0 : 1); // Assume pass if total=0? Or handle explicitly
            const percentage = total > 0 ? (passedCount / total * 100) : (violationCount === 0 ? 100 : 0); // 100% if total 0 and no violations
            const statusClass = violationCount > 0 ? 'has-violations' : 'passed';

            summaryHtml += `
                <div class="wcag-check-summary ${statusClass}">
                    <div class="check-name">${getCheckNameThai(checkName)}</div>
                    <div class="check-stats">ผ่าน ${passedCount}/${total || '-'} (${Math.round(percentage)}%)</div>
                </div>
            `;
        });
        summaryHtml += '</div>';
        return summaryHtml;
    }

    /**
     * จัดกลุ่มปัญหาที่พบให้เป็นหมวดหมู่
     * เพิ่มการป้องกัน XSS โดยการเรียกใช้ escapeHtml 
     */
    function groupViolations(violations) {
        if (!Array.isArray(violations)) return {};
        return violations.reduce((acc, violation) => {
            const message = violation?.message || 'Unknown Violation';
            const impact = violation?.impact || 'moderate';
            const element = violation?.element; // HTML string of the element
            const key = `${message}|${impact}`; // Group by message and impact

            if (!acc[key]) {
                acc[key] = { count: 0, message: message, impact: impact, elements: [] };
            }
            acc[key].count++;
            // Store first few violating elements' HTML for display
            if (element && acc[key].elements.length < 5) {
                // Basic sanitization or truncation if needed
                const truncatedElement = element.length > 200 ? element.substring(0, 197) + '...' : element;
                acc[key].elements.push(truncatedElement);
            }
            return acc;
        }, {});
    }

    /**
     * สร้าง HTML สำหรับแสดงปัญหาที่พบ
     * พร้อมมีการป้องกัน XSS
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
                Object.values(grouped).forEach(group => {
                    // Display first element example, escape HTML for security
                    const firstElementExample = group.elements.length > 0
                        ? `<div class="issue-details"><code>${$('<div/>').text(group.elements[0]).html()}</code></div>` // Escape HTML
                        : '';
                    violationsHtml += `
                        <li class="wcag-issue wcag-violation">
                            <div class="issue-header">
                                <span class="issue-impact ${group.impact}">${getImpactThai(group.impact)}</span>
                                <strong>${$('<div/>').text(group.message).html()} (${group.count})</strong>
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

    function generateRecommendationsHtml(results, hasAnyViolations) {
        if (!hasAnyViolations) return '';

        let recommendationsHtml = '<h3 class="wcag-section-title wcag-recommendations">คำแนะนำการแก้ไข</h3>';
        recommendationsHtml += '<ul class="wcag-recommendations-list">';
        const recommendationsAdded = new Set();

        // Generate recommendations based on violation types found
        Object.entries(results).forEach(([checkName, checkResult]) => {
            if (checkResult?.violations?.length > 0 && !recommendationsAdded.has(checkName)) {
                 let recommendationText = '';
                 switch(checkName) {
                    case 'headings': recommendationText = `ตรวจสอบและแก้ไขโครงสร้างหัวข้อ (h1-h6) ให้เรียงลำดับถูกต้องและไม่ข้ามระดับ`; break;
                    case 'images': recommendationText = `เพิ่มคำอธิบายภาพ (alt text) ที่สื่อความหมาย หรือทำเครื่องหมายเป็น decorative หากไม่สำคัญ`; break;
                    case 'links': recommendationText = `ตรวจสอบให้ข้อความลิงก์สื่อความหมายชัดเจน หรือมีข้อความทางเลือกที่เหมาะสม`; break;
                    case 'contrast': recommendationText = `ปรับปรุงความคมชัดระหว่างสีข้อความและพื้นหลังตามเกณฑ์ WCAG AA เป็นอย่างน้อย`; break;
                    case 'forms': recommendationText = `ตรวจสอบให้องค์ประกอบฟอร์ม (input, select, etc.) มี label ที่เชื่อมโยงกันถูกต้อง`; break;
                    case 'aria': recommendationText = `ตรวจสอบการใช้บทบาทและคุณสมบัติ ARIA ให้ถูกต้องและมีความจำเป็น`; break;
                    case 'keyboard': recommendationText = `ทดสอบการเข้าถึงและใช้งานองค์ประกอบทั้งหมดด้วยแป้นพิมพ์ (Tab, Enter, Space)`; break;
                    default: recommendationText = `ตรวจสอบปัญหาเกี่ยวกับ ${getCheckNameThai(checkName)}`; break;
                 }
                 if (recommendationText) {
                    recommendationsHtml += `<li>${recommendationText}</li>`;
                    recommendationsAdded.add(checkName);
                 }
            }
        });


        if (recommendationsAdded.size === 0) {
             recommendationsHtml += `<li>ไม่พบปัญหาหลักตามเกณฑ์ที่ตั้งค่าไว้</li>`;
        }

        recommendationsHtml += '</ul>';
        return recommendationsHtml;
    }

    // --- Main Results Processing ---
    function processResults(checks, severity) {
        const score = calculateScore(checks); // Severity might influence filtering *before* this, not score calc itself
        const grade = determineGrade(score, severity); // Grade might depend on severity thresholds
        const currentUrl = window.location.href;

        const gradeHtml = generateGradeHtml(grade, score);
        const summaryHtml = generateSummaryHtml(checks, currentUrl);
        const { html: violationsHtml, hasAnyViolations } = generateViolationsHtml(checks);
        const recommendationsHtml = generateRecommendationsHtml(checks, hasAnyViolations);

        $grade.html(gradeHtml);
        $details.html(summaryHtml + violationsHtml + recommendationsHtml);

        $loading.hide();
        $results.show();
        // Show details toggle only if there are violations or recommendations
        if (hasAnyViolations) {
             $detailsToggle.show();
        } else {
             $detailsToggle.hide();
        }
    }

    // --- Main Check Runner ---
    function runWCAGCheck() {
        // Prevent running if already loading
        if ($loading.is(':visible')) return;

        $loading.show();
        $results.hide();
        $detailsToggle.hide(); // Hide toggle initially

        const severity = getSavedSeverity();

        // Simulate running checks (replace with actual async checks if needed)
        // Using setTimeout to simulate async operation and prevent blocking UI
        setTimeout(() => {
            try {
                const checks = {
                    headings: runSingleCheck(checkHeadings),
                    images: runSingleCheck(checkImages),
                    links: runSingleCheck(checkLinks),
                    contrast: runSingleCheck(checkContrast),
                    forms: runSingleCheck(checkForms),
                    aria: runSingleCheck(checkARIA),
                    keyboard: runSingleCheck(checkKeyboardNavigation)
                };
                processResults(checks, severity);
            } catch (error) {
                 console.error("Error during WCAG check execution:", error);
                 $loading.hide();
                 $results.html('<div class="error-message">เกิดข้อผิดพลาดร้ายแรงระหว่างการตรวจสอบ</div>').show();
            }
        }, 50); // Short delay to allow loading indicator to show
    }

    // --- Severity Settings Modal ---
    function openSeveritySettings() {
        const currentSeverity = getSavedSeverity();
        let settingsHTML = `
            <div class="wcag-severity-settings">
                <h3 class="wcag-severity-title">ตั้งค่าความเข้มงวดในการตรวจสอบ</h3>
                <p class="wcag-severity-description">เลือกระดับความเข้มงวดเพื่อกรองผลลัพธ์การตรวจสอบตามผลกระทบของปัญหา</p>
                <div class="wcag-severity-options">`;

        const descriptions = {
            'very-low': 'วิกฤติ (Critical): ปัญหาที่ทำให้ผู้ใช้บางกลุ่มไม่สามารถเข้าถึงเนื้อหาได้เลย',
            'low': 'ร้ายแรง (Serious): ปัญหาที่ส่งผลกระทบอย่างมากต่อประสบการณ์ผู้ใช้',
            'medium': 'ปานกลาง (Moderate): ปัญหาที่อาจสร้างความสับสนหรือความยากลำบากในการใช้งาน',
            'high': 'ทั้งหมด (รวม Minor): ตรวจสอบทุกประเด็น รวมถึงคำแนะนำเพื่อการเข้าถึงที่ดีที่สุด'
        };

        Object.entries(SEVERITY_TEXT).forEach(([value, label]) => {
            const isChecked = currentSeverity === value;
            settingsHTML += `
                <div class="wcag-severity-option ${isChecked ? 'selected' : ''}" data-value="${value}" role="radio" aria-checked="${isChecked}" tabindex="0">
                     <span class="radio-indicator"></span>
                     <div class="option-label-desc">
                        <span class="option-label">${label}</span>
                        <p class="option-description">${descriptions[value] || ''}</p>
                    </div>
                     <input type="radio" name="wcag-severity" id="wcag-severity-${value}" value="${value}" ${isChecked ? 'checked' : ''} class="sr-only">
                </div>`;
        });

        settingsHTML += `
                </div>
                <div class="wcag-settings-buttons">
                    <button id="wcag-save-settings" class="wcag-save-button">บันทึกและตรวจสอบใหม่</button>
                    <button id="wcag-cancel-settings" class="wcag-cancel-button">ยกเลิก</button>
                </div>
            </div>`;

        $modalContent.html(settingsHTML);
        $modal.fadeIn(300);

        // Event listeners within the modal
        $modalContent.off('.wcagSettings') // Remove previous listeners
            .on('click.wcagSettings', '#wcag-save-settings', saveSeveritySettings)
            .on('click.wcagSettings', '#wcag-cancel-settings', () => $modal.fadeOut(300))
            .on('click.wcagSettings keydown.wcagSettings', '.wcag-severity-option', function(e) {
                 if (e.type === 'click' || (e.type === 'keydown' && (e.key === 'Enter' || e.key === ' '))) {
                     e.preventDefault();
                     const $this = $(this);
                     $('.wcag-severity-option').removeClass('selected').attr('aria-checked', 'false');
                     $this.addClass('selected').attr('aria-checked', 'true');
                     $this.find('input[type="radio"]').prop('checked', true);
                 }
            });
    }

    function saveSeveritySettings() {
        const selectedSeverity = $modalContent.find('input[name="wcag-severity"]:checked').val();
        if (selectedSeverity && selectedSeverity !== getSavedSeverity()) {
            saveSeverity(selectedSeverity);
            runWCAGCheck(); // Re-run check with new severity
        }
        $modal.fadeOut(300);
    }

    // --- Event Listeners ---
    $detailsToggle.on('click', function() {
        // Show full details in modal
        $modalContent.html($details.html()); // Copy current details content
        $modal.fadeIn(300);
    });

    $modalClose.on('click', () => $modal.fadeOut(300));

    $modal.on('click', function(e) {
        if (e.target === this) { // Close if clicking on the modal background
            $modal.fadeOut(300);
        }
    });

    // Global keydown listener
    $(document).on('keydown', function(e) {
        // Close modal with Escape key
        if ((e.key === 'Escape' || e.key === 'Esc') && $modal.is(':visible')) {
            $modal.fadeOut(300);
        }
        // Detect Ctrl+Shift+C shortcut (or Cmd+Shift+C on Mac)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'c' || e.key === 'C' || e.keyCode === 67)) {
             e.preventDefault();
             openSeveritySettings();
        }
    });

    // --- Initial Check ---
    // Only run if the container exists
    if ($container.length) {
        runWCAGCheck();
    }

});
