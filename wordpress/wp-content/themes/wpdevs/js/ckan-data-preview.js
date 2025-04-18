/**
 * CKAN Data Preview JavaScript
 * ปรับปรุงเพื่อให้แสดงแถวแรกเป็นส่วนหัวตารางและจำกัดจำนวนแถวเป็น 30 แถว
 */
jQuery(document).ready(function($) {
    // Initialize
    var previewModal = $('#ckan-preview-modal');
    var previewModalBody = $('.ckan-preview-data');
    var previewLoading = $('.ckan-preview-loading');
    var maxRows = 30; // จำกัดจำนวนแถวเป็น 30 แถว
    
    // Preview button click
    $(document).on('click', '.ckan-preview-btn', function() {
        var encodedUrl = $(this).data('url');
        var fileUrl = atob(encodedUrl); // Decode base64
        var fileName = fileUrl.split('/').pop();
        
        // Show modal and title with filename
        previewModal.addClass('show');
        $('.ckan-preview-modal-title').text('ดูตัวอย่าง: ' + fileName);
        previewLoading.show();
        previewModalBody.empty();
        
        // Get file extension
        var fileExt = fileUrl.split('.').pop().toLowerCase();
        
        // Fetch and preview file contents
        fetchFilePreview(fileUrl, fileExt);
    });
    
    // Close modal
    $('.ckan-preview-modal-close').on('click', function() {
        previewModal.removeClass('show');
    });
    
    // Close modal when clicking outside
    $(window).on('click', function(e) {
        if ($(e.target).is(previewModal)) {
            previewModal.removeClass('show');
        }
    });
    
    // Function to fetch and preview file
    function fetchFilePreview(fileUrl, fileExt) {
        // Use AJAX to proxy the file request through WordPress
        $.ajax({
            url: ckan_rp_list_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_get_file_preview',
                nonce: ckan_rp_list_ajax.nonce,
                file_url: fileUrl
            },
            success: function(response) {
                previewLoading.hide();
                
                if (response.success) {
                    var fileContent = response.data.content;
                    var fileType = response.data.type;
                    var fileExtension = response.data.extension;
                    
                    // Handle different file types
                    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                        displayExcelPreview(fileContent);
                    } else if (fileExtension === 'csv' || isCSVLike(fileContent)) {
                        displayCSVPreview(fileContent);
                    } else if (fileExtension === 'json') {
                        displayJSONPreview(fileContent);
                    } else if (fileExtension === 'txt' || fileExtension === 'md' || fileExtension === 'html') {
                        displayTextPreview(fileContent);
                    } else {
                        previewModalBody.html('<div class="ckan-preview-error">ไม่สามารถแสดงตัวอย่างไฟล์ประเภทนี้ได้</div>');
                    }
                } else {
                    previewModalBody.html('<div class="ckan-preview-error">เกิดข้อผิดพลาด: ' + response.data + '</div>');
                }
            },
            error: function() {
                previewLoading.hide();
                previewModalBody.html('<div class="ckan-preview-error">ไม่สามารถโหลดไฟล์ได้</div>');
            }
        });
    }
    
    // Function to display Excel preview using SheetJS
    function displayExcelPreview(base64Content) {
        try {
            // เพิ่มการโหลด CSS สำหรับระบบกรอง
            if (!$('link[href*="ckan-data-preview-filter.css"]').length) {
                $('head').append('<link rel="stylesheet" href="' + get_stylesheet_directory_uri + '/css/ckan-data-preview-filter.css" type="text/css" />');
            }
            
            // Add table controls first
            var controlsHtml = generateTableControlsHtml();
            
            // Convert base64 to array buffer
            var binaryString = window.atob(base64Content);
            var bytes = new Uint8Array(binaryString.length);
            for (var i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            var arrayBuffer = bytes.buffer;
            
            // Read workbook using SheetJS
            var workbook = XLSX.read(arrayBuffer, {type: 'array'});
            
            // Get first sheet
            var firstSheetName = workbook.SheetNames[0];
            var worksheet = workbook.Sheets[firstSheetName];
            
            // แปลงข้อมูล worksheet เป็น array ข้อมูล
            var jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
            
            // สร้าง HTML table ด้วยตนเอง (แทนที่จะใช้ sheet_to_html)
            var htmlTable = '<table id="excel-preview-table" class="ckan-preview-table">';
            
            // สร้างส่วนหัวตารางจากแถวแรก
            if (jsonData.length > 0) {
                var headerRow = jsonData[0];
                htmlTable += '<thead><tr>';
                for (var i = 0; i < headerRow.length; i++) {
                    htmlTable += '<th>' + (headerRow[i] || '') + '</th>';
                }
                htmlTable += '</tr></thead>';
                
                // สร้าง tbody สำหรับข้อมูล (จำกัดแค่ 30 แถว)
                htmlTable += '<tbody>';
                var dataRows = Math.min(jsonData.length - 1, maxRows);
                for (var i = 1; i <= dataRows; i++) {
                    var row = jsonData[i] || [];
                    htmlTable += '<tr>';
                    for (var j = 0; j < headerRow.length; j++) {
                        htmlTable += '<td>' + (row[j] !== undefined ? row[j] : '') + '</td>';
                    }
                    htmlTable += '</tr>';
                }
                htmlTable += '</tbody>';
            }
            htmlTable += '</table>';
            
            // Create sheet selector if multiple sheets
            var sheetSelectorHtml = '';
            if (workbook.SheetNames.length > 1) {
                sheetSelectorHtml = '<div class="ckan-excel-sheet-selector"><label for="sheet-select">เลือกชีท: </label>';
                sheetSelectorHtml += '<select id="sheet-select">';
                
                workbook.SheetNames.forEach(function(sheetName, index) {
                    sheetSelectorHtml += '<option value="' + index + '"' + (index === 0 ? ' selected' : '') + '>' + sheetName + '</option>';
                });
                
                sheetSelectorHtml += '</select></div>';
            }
            
            // Add controls, sheet selector and table to modal
            previewModalBody.html(controlsHtml + sheetSelectorHtml + '<div class="ckan-preview-table-container">' + htmlTable + '</div>');
            
            // แจ้ง trigger สำหรับให้ระบบกรองทำงาน
            $(document).trigger('ckan_preview_loaded');
            
            // Handle sheet selection change
            $('#sheet-select').on('change', function() {
                var selectedSheetIndex = parseInt($(this).val());
                var selectedSheetName = workbook.SheetNames[selectedSheetIndex];
                var selectedWorksheet = workbook.Sheets[selectedSheetName];
                
                // แปลงข้อมูล worksheet ที่เลือกเป็น array ข้อมูล
                var jsonData = XLSX.utils.sheet_to_json(selectedWorksheet, {header: 1});
                
                // สร้าง HTML table ด้วยตนเอง
                var htmlTable = '<table id="excel-preview-table" class="ckan-preview-table">';
                
                // สร้างส่วนหัวตารางจากแถวแรก
                if (jsonData.length > 0) {
                    var headerRow = jsonData[0];
                    htmlTable += '<thead><tr>';
                    for (var i = 0; i < headerRow.length; i++) {
                        htmlTable += '<th>' + (headerRow[i] || '') + '</th>';
                    }
                    htmlTable += '</tr></thead>';
                    
                    // สร้าง tbody สำหรับข้อมูล (จำกัดแค่ 30 แถว)
                    htmlTable += '<tbody>';
                    var dataRows = Math.min(jsonData.length - 1, maxRows);
                    for (var i = 1; i <= dataRows; i++) {
                        var row = jsonData[i] || [];
                        htmlTable += '<tr>';
                        for (var j = 0; j < headerRow.length; j++) {
                            htmlTable += '<td>' + (row[j] !== undefined ? row[j] : '') + '</td>';
                        }
                        htmlTable += '</tr>';
                    }
                    htmlTable += '</tbody>';
                }
                htmlTable += '</table>';
                
                // Update table
                $('.ckan-preview-table-container').html(htmlTable);
                
                // แจ้ง trigger สำหรับให้ระบบกรองทำงาน
                $(document).trigger('ckan_preview_loaded');
            });
        } catch (e) {
            console.error('Excel parsing error:', e);
            previewModalBody.html('<div class="ckan-preview-error">เกิดข้อผิดพลาดในการอ่านไฟล์ Excel</div>');
        }
    }

    // Function to generate table controls HTML
    function generateTableControlsHtml() {
        var html = '<div class="ckan-preview-controls">';
        
        // Left side: Add Filter button and pagination
        html += '<div class="ckan-preview-controls-left">';
        html += '<button class="ckan-preview-filter-btn">Add Filter</button>';
        html += '<div class="ckan-preview-pagination">';
        html += '<span>30 records</span>';
        html += '<span>«</span>';
        html += '<input type="text" value="1">';
        html += '<span>–</span>';
        html += '<input type="text" value="1">';
        html += '<span>»</span>';
        html += '</div>';
        html += '</div>';
        
        // Right side: Search and Filters
        html += '<div class="ckan-preview-search">';
        html += '<span class="search-icon">🔍</span>';
        html += '<input type="text" placeholder="Search data ...">';
        html += '<button>Go »</button>';
        html += '<button class="filters-btn">Filters</button>';
        html += '</div>';
        
        html += '</div>';
        return html;
    }
    
    // Function to check if content is CSV-like
    function isCSVLike(content) {
        // Check for common CSV patterns: comma-separated values with consistent columns
        var lines = content.split('\n');
        if (lines.length < 2) return false;
        
        var firstLineFields = lines[0].split(',').length;
        var secondLineFields = lines[1].split(',').length;
        
        // If first two lines have the same number of fields, likely a CSV
        return firstLineFields > 1 && firstLineFields === secondLineFields;
    }
    
    // Function to display CSV preview
    function displayCSVPreview(content) {
        // เพิ่มการโหลด CSS สำหรับระบบกรอง
        if (!$('link[href*="ckan-data-preview-filter.css"]').length) {
            $('head').append('<link rel="stylesheet" href="' + get_stylesheet_directory_uri + '/css/ckan-data-preview-filter.css" type="text/css" />');
        }
        
        // Add table controls first (Filter, pagination, search)
        var controlsHtml = generateTableControlsHtml();
        
        // Process CSV content
        var lines = content.split('\n');
        var tableHtml = '<div class="ckan-preview-table-container"><table class="ckan-preview-table">';
        
        // Process header (assume first row is header)
        if (lines.length > 0) {
            var headerCells = lines[0].split(',');
            tableHtml += '<thead><tr>';
            for (var i = 0; i < headerCells.length; i++) {
                tableHtml += '<th>' + headerCells[i].trim() + '</th>';
            }
            tableHtml += '</tr></thead>';
            
            // Process data rows (จำกัดแค่ 30 แถว)
            tableHtml += '<tbody>';
            var dataRows = Math.min(lines.length - 1, maxRows);
            for (var j = 1; j <= dataRows; j++) {
                if (lines[j].trim() === '') continue; // Skip empty lines
                
                var rowCells = lines[j].split(',');
                tableHtml += '<tr>';
                for (var k = 0; k < headerCells.length; k++) {
                    tableHtml += '<td>' + (k < rowCells.length ? rowCells[k].trim() : '') + '</td>';
                }
                tableHtml += '</tr>';
            }
            tableHtml += '</tbody>';
        }
        tableHtml += '</table></div>';
        
        // Add controls and table to modal
        previewModalBody.html(controlsHtml + tableHtml);
        
        // แจ้ง trigger สำหรับให้ระบบกรองทำงาน
        $(document).trigger('ckan_preview_loaded');
    }
    
    // Function to display JSON preview
    function displayJSONPreview(content) {
        try {
            var jsonObj = JSON.parse(content);
            var formattedJson = JSON.stringify(jsonObj, null, 2);
            previewModalBody.html('<pre class="ckan-preview-json">' + formattedJson + '</pre>');
        } catch (e) {
            previewModalBody.html('<div class="ckan-preview-error">ไฟล์ JSON ไม่ถูกต้อง</div>');
        }
    }
    
    // Function to display text preview
    function displayTextPreview(content) {
        previewModalBody.html('<pre class="ckan-preview-text">' + content + '</pre>');
    }
});