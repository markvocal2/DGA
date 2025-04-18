/**
 * W3C CSS Validator JavaScript
 * 
 * Handles the frontend functionality of the CSS validator including
 * collecting stylesheet information, sending to backend for validation,
 * and displaying results.
 */

jQuery(document).ready(function($) {
    // Cache DOM elements
    const $container = $('.w3c-test-container');
    const $toggle = $('.w3c-test-toggle');
    const $content = $('.w3c-test-content');
    const $loading = $('.w3c-test-loading');
    const $summary = $('.w3c-test-summary');
    const $details = $('.w3c-test-details');
    const $score = $('.w3c-test-score');
    const $modal = $('#w3c-test-modal');
    const $modalBody = $('#w3c-test-modal-body');
    const $modalClose = $('.w3c-test-modal-close');
    
    // Stylesheet information
    let stylesheetData = {
        count: 0,
        internal: 0,
        external: 0,
        inline: 0,
        size: 0,
        urls: []
    };
    
    // Initialize event listeners
    $toggle.on('click', function() {
        if ($content.is(':hidden')) {
            runCssValidation();
        } else {
            $content.slideUp(200);
            $toggle.text('ตรวจสอบ CSS');
        }
    });
    
    // Close modal
    $modalClose.on('click', function() {
        $modal.fadeOut(300);
    });
    
    // Close modal when clicking outside
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
    });
    
    // Main function to run CSS validation
    function runCssValidation() {
        $content.hide();
        $loading.show();
        $toggle.text('กำลังตรวจสอบ...');
        
        // Collect CSS information from the page
        collectCssInfo();
        
        // Send the data for validation via AJAX
        $.ajax({
            url: w3cTest.ajaxurl,
            type: 'POST',
            data: {
                action: 'w3c_css_validation',
                nonce: w3cTest.nonce,
                url: w3cTest.current_url,
                stylesheets: stylesheetData
            },
            success: function(response) {
                if (response.success) {
                    displayResults(response.data);
                } else {
                    showError('เกิดข้อผิดพลาดในการตรวจสอบ CSS');
                }
            },
            error: function() {
                showError('ไม่สามารถติดต่อกับเซิร์ฟเวอร์ได้');
            },
            complete: function() {
                $loading.hide();
                $content.slideDown(300);
                $toggle.text('ซ่อนผลการตรวจสอบ');
            }
        });
    }
    
    // Collect information about stylesheets on the page
    function collectCssInfo() {
        stylesheetData.urls = [];
        stylesheetData.external = 0;
        stylesheetData.internal = 0;
        stylesheetData.inline = 0;
        stylesheetData.size = 0;
        
        // External stylesheets
        $('link[rel="stylesheet"]').each(function() {
            stylesheetData.external++;
            stylesheetData.urls.push($(this).attr('href'));
        });
        
        // Internal stylesheets
        $('style').each(function() {
            stylesheetData.internal++;
            stylesheetData.size += $(this).text().length;
        });
        
        // Inline styles
        $('[style]').each(function() {
            stylesheetData.inline++;
        });
        
        stylesheetData.count = stylesheetData.external + stylesheetData.internal;
    }
    
    // Display validation results
    function displayResults(data) {
        // Update score display
        let scoreHtml = `<div class="w3c-grade grade-${data.grade.toLowerCase()}">${data.grade}</div>
                        <div class="w3c-score-value">${data.score}%</div>`;
        $score.html(scoreHtml);
        
        // Update summary
        let summaryHtml = `
            <div class="w3c-test-section">
                <div class="w3c-stylesheets-info">
                    <div class="w3c-info-item">
                        <span class="w3c-info-label">Stylesheets:</span>
                        <span class="w3c-info-value">${stylesheetData.count}</span>
                    </div>
                    <div class="w3c-info-item">
                        <span class="w3c-info-label">External:</span>
                        <span class="w3c-info-value">${stylesheetData.external}</span>
                    </div>
                    <div class="w3c-info-item">
                        <span class="w3c-info-label">Internal:</span>
                        <span class="w3c-info-value">${stylesheetData.internal}</span>
                    </div>
                    <div class="w3c-info-item">
                        <span class="w3c-info-label">Inline styles:</span>
                        <span class="w3c-info-value">${stylesheetData.inline}</span>
                    </div>
                </div>
            </div>
        `;
        $summary.html(summaryHtml);
        
        // Create the "View Details" button
        let detailsHtml = `
            <div class="w3c-test-categories">
                ${Object.entries(data.checks).map(([key, check]) => `
                    <div class="w3c-category ${check.issues.length > 0 ? 'has-issues' : 'no-issues'}">
                        <div class="w3c-category-header">
                            <span class="w3c-category-name">${check.name}</span>
                            <span class="w3c-category-score">${check.score}%</span>
                        </div>
                        ${check.issues.length > 0 ? 
                            `<div class="w3c-category-issues-count">${check.issues.length} ${check.issues.length === 1 ? 'issue' : 'issues'}</div>` : 
                            '<div class="w3c-category-issues-count no-issues">ไม่พบปัญหา</div>'
                        }
                    </div>
                `).join('')}
            </div>
            <button class="w3c-view-details-btn">ดูรายละเอียดทั้งหมด</button>
        `;
        $details.html(detailsHtml);
        
        // Prepare modal content
        let modalContent = `
            <div class="w3c-modal-url">URL: ${data.url}</div>
            <div class="w3c-modal-score-section">
                <div class="w3c-modal-grade grade-${data.grade.toLowerCase()}">${data.grade}</div>
                <div class="w3c-modal-score">${data.score}%</div>
            </div>
            <div class="w3c-modal-categories">
                ${Object.entries(data.checks).map(([key, check]) => `
                    <div class="w3c-modal-category">
                        <div class="w3c-modal-category-header">
                            <span class="w3c-modal-category-name">${check.name}</span>
                            <span class="w3c-modal-category-score">${check.score}%</span>
                        </div>
                        ${check.issues.length > 0 ? `
                            <div class="w3c-modal-issues">
                                ${check.issues.map(issue => `
                                    <div class="w3c-modal-issue ${issue.severity}">
                                        <div class="w3c-issue-header">
                                            <span class="w3c-issue-severity">${getSeverityText(issue.severity)}</span>
                                            <span class="w3c-issue-message">${issue.message}</span>
                                        </div>
                                        ${issue.recommendation ? `
                                            <div class="w3c-issue-recommendation">
                                                <span class="w3c-recommendation-label">แนะนำ:</span>
                                                <span class="w3c-recommendation-text">${issue.recommendation}</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<div class="w3c-no-issues">ไม่พบปัญหาในหมวดหมู่นี้</div>'}
                    </div>
                `).join('')}
            </div>
            <div class="w3c-modal-recommendations">
                <h4>คำแนะนำทั่วไป</h4>
                <ul>
                    ${getGeneralRecommendations(data).map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        `;
        $modalBody.html(modalContent);
        
        // Bind click event to "View Details" button
        $('.w3c-view-details-btn').on('click', function() {
            $modal.fadeIn(300);
        });
    }
    
    // Helper function to display error message
    function showError(message) {
        $summary.html(`<div class="w3c-error">${message}</div>`);
        $details.empty();
        $score.html('<div class="w3c-grade grade-error">Error</div>');
    }
    
    // Helper function to convert severity to Thai text
    function getSeverityText(severity) {
        const severityMap = {
            'error': 'ข้อผิดพลาด',
            'warning': 'คำเตือน',
            'info': 'ข้อแนะนำ'
        };
        return severityMap[severity] || severity;
    }
    
    // Generate general recommendations based on validation results
    function getGeneralRecommendations(data) {
        const recommendations = [];
        
        if (data.score < 95) {
            recommendations.push('พิจารณาแก้ไขปัญหาไวยากรณ์ CSS เนื่องจากมีผลโดยตรงต่อการแสดงผล');
        }
        
        if (stylesheetData.inline > 10) {
            recommendations.push('ลดการใช้ inline styles เพื่อให้เว็บไซต์บำรุงรักษาง่ายขึ้น');
        }
        
        if (stylesheetData.external > 5) {
            recommendations.push('รวม stylesheet ภายนอกเพื่อลดการร้องขอ HTTP และปรับปรุงประสิทธิภาพ');
        }
        
        // Always include these recommendations
        recommendations.push('ใช้เครื่องมือบีบอัด (minify) CSS เพื่อลดขนาดไฟล์');
        recommendations.push('พิจารณาใช้ CSS preprocessing tools เช่น SASS หรือ LESS เพื่อจัดระเบียบ CSS');
        
        return recommendations;
    }
});