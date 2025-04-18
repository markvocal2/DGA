/**
 * DGA Endpoint Test JavaScript
 * Handles API endpoint testing and result display
 */
(function($) {
    $(document).ready(function() {
        // Elements
        const endpointInput = $('#dga-endpoint-url');
        const httpMethodSelect = $('#dga-http-method');
        const paramsContainer = $('.dga-params-container');
        const paramsTextarea = $('#dga-params');
        const headersTextarea = $('#dga-api-headers');
        const testButton = $('#dga-test-endpoint');
        const resultsContainer = $('.dga-endpoint-results');
        const loadingIndicator = $('#dga-loading');
        const statusValue = $('#dga-status-value');
        const timeValue = $('#dga-time-value');
        const responseJson = $('#dga-response-json');
        const responseHeaders = $('#dga-response-headers');
        const dataPreview = $('#dga-data-preview');
        const toggleViewButton = $('#dga-toggle-view');
        const copyResponseButton = $('#dga-copy-response');
        const requestDetails = $('#dga-request-details');
        const requestDetailsContainer = $('.dga-request-details');
        
        // Tab navigation
        const tabButtons = $('.dga-tab-btn');
        const tabPanes = $('.dga-tab-pane');
        
        // Variables for view state
        let isCompactView = false;
        let currentPreviewData = null;
        let currentResponse = null;
        
        // Initialize
        initialize();
        
        function initialize() {
            // HTTP method change handler (show/hide params area)
            httpMethodSelect.on('change', function() {
                if ($(this).val() === 'POST') {
                    paramsContainer.slideDown(300);
                } else {
                    paramsContainer.slideUp(300);
                }
            });
            
            // Set up example endpoint click handlers
            $('.dga-endpoint-example-item').on('click', function() {
                const endpoint = $(this).data('endpoint');
                endpointInput.val(endpoint);
                $(this).addClass('dga-endpoint-example-active').siblings().removeClass('dga-endpoint-example-active');
            });
            
            // Test button click handler
            testButton.on('click', function(e) {
                e.preventDefault();
                testEndpoint();
            });
            
            // Tab click handler
            tabButtons.on('click', function() {
                const tabId = $(this).data('tab');
                tabButtons.removeClass('active');
                tabPanes.removeClass('active');
                $(this).addClass('active');
                $(`#dga-tab-${tabId}`).addClass('active');
            });
            
            // Toggle view handler
            toggleViewButton.on('click', function() {
                isCompactView = !isCompactView;
                renderPreview(currentPreviewData);
                $(this).text(isCompactView ? 'แสดงแบบเต็ม' : 'เปลี่ยนรูปแบบการแสดงผล');
            });
            
            // Copy response handler
            copyResponseButton.on('click', function() {
                copyToClipboard(JSON.stringify(currentResponse, null, 2));
                showNotification('คัดลอกข้อมูล API Response ไปยังคลิปบอร์ดแล้ว', 'success');
            });
            
            // Handle Enter key on endpoint input
            endpointInput.on('keypress', function(e) {
                if (e.which === 13) {
                    e.preventDefault();
                    testEndpoint();
                }
            });
            
            // Troubleshooting toggle
            $('.dga-troubleshooting-toggle').on('click', function() {
                const content = $('.dga-troubleshooting-content');
                content.slideToggle(300);
                $(this).text(content.is(':visible') ? 'ซ่อนข้อมูลเพิ่มเติม' : 'แสดงข้อมูลเพิ่มเติม');
            });
            
            // Request details toggle
            $(document).on('click', '.dga-btn-toggle-request-details', function() {
                const content = $('.dga-request-info-content');
                content.slideToggle(300);
                $(this).text(content.is(':visible') ? 'ซ่อน' : 'แสดง');
            });
        }
        
        function testEndpoint() {
            const endpoint = endpointInput.val().trim();
            
            if (!endpoint) {
                showNotification('กรุณาระบุ URL Endpoint', 'error');
                return;
            }
            
            // Show loading state
            loadingIndicator.show();
            resultsContainer.show();
            resetResultsDisplay();
            testButton.prop('disabled', true).addClass('dga-btn-loading');
            
            // Get HTTP method and parameters
            const httpMethod = httpMethodSelect.val();
            const params = httpMethod === 'POST' ? paramsTextarea.val().trim() : '';
            const headers = headersTextarea.val().trim();
            
            // Send AJAX request to test the endpoint
            $.ajax({
                url: dgaEndpointTest.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'dga_test_api_endpoint',
                    nonce: dgaEndpointTest.nonce,
                    endpoint: endpoint,
                    method: httpMethod,
                    params: params,
                    headers: headers
                },
                success: function(response) {
                    if (response.success) {
                        displayResults(response.data);
                    } else {
                        showErrorResult(response.data);
                    }
                },
                error: function() {
                    showNotification('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ WordPress โปรดลองอีกครั้ง', 'error');
                    hideResults();
                },
                complete: function() {
                    loadingIndicator.hide();
                    testButton.prop('disabled', false).removeClass('dga-btn-loading');
                }
            });
        }
        
        function displayResults(data) {
            // Store current response for copy functionality
            currentResponse = data.response;
            
            // Display status and response time
            statusValue.text(data.statusCode + (data.statusCode >= 200 && data.statusCode < 300 ? ' (Success)' : ' (Error)'));
            statusValue.removeClass('dga-status-success dga-status-error')
                .addClass(data.statusCode >= 200 && data.statusCode < 300 ? 'dga-status-success' : 'dga-status-error');
            
            timeValue.text(data.responseTime);
            
            // Format and display JSON response
            const formattedJson = JSON.stringify(data.response, null, 2);
            responseJson.text(formattedJson);
            
            // Format and display headers
            const formattedHeaders = formatHeaders(data.headers);
            responseHeaders.text(formattedHeaders);
            
            // Show request details for debugging
            if (data.debug_info) {
                const formattedDebugInfo = JSON.stringify(data.debug_info, null, 2);
                requestDetails.text(formattedDebugInfo);
                requestDetailsContainer.show();
            }
            
            // Save and render preview data
            currentPreviewData = data.previewData;
            renderPreview(data.previewData);
            
            // Make sure response tab is active initially
            tabButtons.removeClass('active');
            tabPanes.removeClass('active');
            $('.dga-tab-btn[data-tab="response"]').addClass('active');
            $('#dga-tab-response').addClass('active');
            
            // Apply syntax highlighting if available
            if (typeof hljs !== 'undefined') {
                hljs.highlightAll();
            }
        }
        
        function showErrorResult(data) {
            // Show error notification
            let errorMessage = data.message || 'เกิดข้อผิดพลาดในการทดสอบ API';
            
            // Add advice if available
            if (data.advice) {
                errorMessage += '<br><br><strong>คำแนะนำ:</strong> ' + data.advice;
            }
            
            showNotification(errorMessage, 'error');
            
            // Display debug info if available
            if (data.debug_info) {
                const formattedDebugInfo = JSON.stringify(data.debug_info, null, 2);
                requestDetails.text(formattedDebugInfo);
                requestDetailsContainer.show();
                resultsContainer.show();
            } else {
                hideResults();
            }
        }
        
        function renderPreview(previewData) {
            if (!previewData) {
                dataPreview.html('<div class="dga-preview-message">ไม่มีข้อมูลสำหรับแสดงตัวอย่าง</div>');
                return;
            }
            
            if (previewData.type === 'error') {
                dataPreview.html(`<div class="dga-preview-message dga-preview-error">${previewData.error}</div>`);
                return;
            }
            
            // Show structure info if available (for debugging)
            let structureInfo = '';
            if (previewData.structure_info) {
                structureInfo = `
                    <div class="dga-structure-info">
                        <div class="dga-structure-header">
                            <span>โครงสร้างข้อมูล: <strong>${previewData.structure_info.type}</strong></span>
                            <button class="dga-toggle-structure-btn">แสดงรายละเอียด</button>
                        </div>
                        <div class="dga-structure-details" style="display:none;">
                            <pre>${JSON.stringify(previewData.structure_info, null, 2)}</pre>
                        </div>
                    </div>
                `;
            }
            
            // JSON type data
            if (previewData.type === 'json') {
                dataPreview.html(`
                    ${structureInfo}
                    <div class="dga-preview-message">ข้อมูลไม่อยู่ในรูปแบบตาราง แสดงข้อมูลดิบแทน</div>
                    <pre class="dga-preview-json">${JSON.stringify(previewData.data, null, 2)}</pre>
                `);
                
                // Add event listener for structure toggle
                dataPreview.find('.dga-toggle-structure-btn').on('click', function() {
                    const details = dataPreview.find('.dga-structure-details');
                    details.slideToggle(300);
                    $(this).text(details.is(':visible') ? 'ซ่อนรายละเอียด' : 'แสดงรายละเอียด');
                });
                
                return;
            }
            
            // Table preview for tabular data
            if (previewData.type === 'table' && Array.isArray(previewData.data) && previewData.data.length > 0) {
                const tableData = previewData.data;
                const maxItems = isCompactView ? 5 : 20; // Limit number of rows in preview
                const displayItems = tableData.slice(0, maxItems);
                
                // Get columns from the first item
                const firstItem = tableData[0];
                const columns = Object.keys(firstItem);
                const maxCols = isCompactView ? 5 : columns.length; // Limit columns in compact view
                
                // Build table HTML
                let tableHtml = `
                    ${structureInfo}
                    <div class="dga-preview-info">
                        แสดง ${displayItems.length} จาก ${previewData.total} รายการ
                        ${columns.length > maxCols ? ` (แสดง ${maxCols} จาก ${columns.length} คอลัมน์)` : ''}
                    </div>
                    <div class="dga-table-container">
                        <table class="dga-preview-table">
                            <thead>
                                <tr>
                `;
                
                // Add table headers
                columns.slice(0, maxCols).forEach(column => {
                    tableHtml += `<th>${escapeHtml(column)}</th>`;
                });
                
                if (columns.length > maxCols) {
                    tableHtml += `<th>...</th>`;
                }
                
                tableHtml += '</tr></thead><tbody>';
                
                // Add table rows
                displayItems.forEach(item => {
                    tableHtml += '<tr>';
                    columns.slice(0, maxCols).forEach(column => {
                        const cellValue = item[column];
                        tableHtml += `<td>${formatCellValue(cellValue)}</td>`;
                    });
                    
                    if (columns.length > maxCols) {
                        tableHtml += `<td>...</td>`;
                    }
                    
                    tableHtml += '</tr>';
                });
                
                // Add message if there are more items
                if (tableData.length > maxItems) {
                    tableHtml += `
                        <tr class="dga-more-rows">
                            <td colspan="${Math.min(columns.length, maxCols) + (columns.length > maxCols ? 1 : 0)}">
                                ...และอีก ${tableData.length - maxItems} รายการ
                            </td>
                        </tr>
                    `;
                }
                
                tableHtml += '</tbody></table></div>';
                
                dataPreview.html(tableHtml);
                
                // Add event listener for structure toggle
                dataPreview.find('.dga-toggle-structure-btn').on('click', function() {
                    const details = dataPreview.find('.dga-structure-details');
                    details.slideToggle(300);
                    $(this).text(details.is(':visible') ? 'ซ่อนรายละเอียด' : 'แสดงรายละเอียด');
                });
            } else {
                dataPreview.html(`
                    ${structureInfo}
                    <div class="dga-preview-message">ไม่พบข้อมูลสำหรับแสดงตัวอย่าง หรือข้อมูลมีรูปแบบที่ไม่สามารถแสดงเป็นตารางได้</div>
                    <div class="dga-preview-advice">
                        <p>ลองตรวจสอบข้อมูลในแท็บ "API Response" เพื่อดูโครงสร้างข้อมูลทั้งหมด</p>
                    </div>
                `);
            }
        }
        
        function formatCellValue(value) {
            if (value === null || value === undefined) {
                return '<span class="dga-null-value">null</span>';
            }
            
            if (typeof value === 'boolean') {
                return value ? 'true' : 'false';
            }
            
            if (typeof value === 'object') {
                return `<span class="dga-object-value" title="${escapeHtml(JSON.stringify(value))}">${isCompactView ? '{...}' : escapeHtml(JSON.stringify(value))}</span>`;
            }
            
            return escapeHtml(String(value));
        }
        
        function formatHeaders(headers) {
            if (typeof headers === 'object') {
                let formattedText = '';
                for (const key in headers) {
                    if (headers.hasOwnProperty(key)) {
                        formattedText += `${key}: ${headers[key]}\n`;
                    }
                }
                return formattedText;
            }
            return JSON.stringify(headers, null, 2);
        }
        
        function resetResultsDisplay() {
            statusValue.text('-').removeClass('dga-status-success dga-status-error');
            timeValue.text('-');
            responseJson.text('');
            responseHeaders.text('');
            dataPreview.html('');
            requestDetails.text('');
            requestDetailsContainer.hide();
        }
        
        function hideResults() {
            loadingIndicator.hide();
            resultsContainer.hide();
        }
        
        function showNotification(message, type) {
            // Check if notification container exists, if not create it
            let notificationContainer = $('.dga-notification-container');
            if (notificationContainer.length === 0) {
                notificationContainer = $('<div class="dga-notification-container"></div>');
                $('.dga-endpoint-test-container').prepend(notificationContainer);
            }
            
            // Create notification element
            const notification = $(`<div class="dga-notification dga-notification-${type}">${message}</div>`);
            notificationContainer.append(notification);
            
            // Show notification with animation
            setTimeout(() => {
                notification.addClass('dga-notification-show');
            }, 10);
            
            // Auto-hide notification after 5 seconds
            setTimeout(() => {
                notification.removeClass('dga-notification-show');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, 7000);
        }
        
        function copyToClipboard(text) {
            // Create a temporary textarea element
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            
            // Select the text
            textarea.select();
            
            // Copy the text
            try {
                document.execCommand('copy');
            } catch (err) {
                console.error('Failed to copy text: ', err);
            }
            
            // Remove the textarea
            document.body.removeChild(textarea);
        }
        
        function escapeHtml(text) {
            if (typeof text !== 'string') {
                return text;
            }
            
            return text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
    });
})(jQuery);