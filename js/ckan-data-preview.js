/**
 * CKAN Data Preview JavaScript
 * ปรับปรุงเพื่อให้แสดงแถวแรกเป็นส่วนหัวตารางและจำกัดจำนวนแถวเป็น 30 แถว
 * Refactored to use let/const instead of var.
 */
jQuery(document).ready(function($) {
    // Initialize
    const previewModal = $('#ckan-preview-modal'); // ใช้ const เพราะค่าไม่เปลี่ยน
    const previewModalBody = $('.ckan-preview-data'); // ใช้ const เพราะค่าไม่เปลี่ยน
    const previewLoading = $('.ckan-preview-loading'); // ใช้ const เพราะค่าไม่เปลี่ยน
    const maxRows = 30; // จำกัดจำนวนแถวเป็น 30 แถว - ใช้ const เพราะค่าไม่เปลี่ยน

    // Preview button click
    $(document).on('click', '.ckan-preview-btn', function() {
        const encodedUrl = $(this).data('url'); // ใช้ const เพราะค่าไม่เปลี่ยนใน scope นี้
        const fileUrl = atob(encodedUrl); // Decode base64 - ใช้ const
        const fileName = fileUrl.split('/').pop(); // ใช้ const

        // Show modal and title with filename
        previewModal.addClass('show');
        $('.ckan-preview-modal-title').text('ดูตัวอย่าง: ' + fileName);
        previewLoading.show();
        previewModalBody.empty();

        // Get file extension
        const fileExt = fileUrl.split('.').pop().toLowerCase(); // ใช้ const

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
                    const fileContent = response.data.content; // ใช้ const
                    const fileType = response.data.type; // ใช้ const
                    const fileExtension = response.data.extension; // ใช้ const

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
                // Assuming get_stylesheet_directory_uri is globally available
                $('head').append('<link rel="stylesheet" href="' + get_stylesheet_directory_uri + '/css/ckan-data-preview-filter.css" type="text/css" />');
            }

            // Add table controls first
            const controlsHtml = generateTableControlsHtml(); // ใช้ const

            // Convert base64 to array buffer
            const binaryString = window.atob(base64Content); // ใช้ const
            const bytes = new Uint8Array(binaryString.length); // ใช้ const
            for (let i = 0; i < binaryString.length; i++) { // ใช้ let สำหรับ loop counter
                bytes[i] = binaryString.charCodeAt(i);
            }
            const arrayBuffer = bytes.buffer; // ใช้ const

            // Read workbook using SheetJS
            const workbook = XLSX.read(arrayBuffer, {type: 'array'}); // ใช้ const

            // Get first sheet
            const firstSheetName = workbook.SheetNames[0]; // ใช้ const
            let worksheet = workbook.Sheets[firstSheetName]; // ใช้ let เพราะอาจเปลี่ยน sheet

            // แปลงข้อมูล worksheet เป็น array ข้อมูล
            let jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1}); // ใช้ let เพราะอาจเปลี่ยน sheet

            // สร้าง HTML table ด้วยตนเอง (แทนที่จะใช้ sheet_to_html)
            let htmlTable = '<table id="excel-preview-table" class="ckan-preview-table">'; // ใช้ let เพราะมีการสร้างใหม่เมื่อเปลี่ยน sheet

            // สร้างส่วนหัวตารางจากแถวแรก
            if (jsonData.length > 0) {
                let headerRow = jsonData[0]; // ใช้ let เพราะอาจเปลี่ยน sheet
                htmlTable += '<thead><tr>';
                for (let i = 0; i < headerRow.length; i++) { // ใช้ let สำหรับ loop counter
                    htmlTable += '<th>' + (headerRow[i] || '') + '</th>';
                }
                htmlTable += '</tr></thead>';

                // สร้าง tbody สำหรับข้อมูล (จำกัดแค่ 30 แถว)
                htmlTable += '<tbody>';
                let dataRows = Math.min(jsonData.length - 1, maxRows); // ใช้ let เพราะอาจเปลี่ยน sheet
                for (let i = 1; i <= dataRows; i++) { // ใช้ let สำหรับ loop counter
                    const row = jsonData[i] || []; // ใช้ const สำหรับ row ภายใน loop
                    htmlTable += '<tr>';
                    for (let j = 0; j < headerRow.length; j++) { // ใช้ let สำหรับ loop counter
                        htmlTable += '<td>' + (row[j] !== undefined ? row[j] : '') + '</td>';
                    }
                    htmlTable += '</tr>';
                }
                htmlTable += '</tbody>';
            }
            htmlTable += '</table>';

            // Create sheet selector if multiple sheets
            let sheetSelectorHtml = ''; // ใช้ let เพราะมีการต่อ string
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
                const selectedSheetIndex = parseInt($(this).val()); // ใช้ const
                const selectedSheetName = workbook.SheetNames[selectedSheetIndex]; // ใช้ const
                const selectedWorksheet = workbook.Sheets[selectedSheetName]; // ใช้ const

                // แปลงข้อมูล worksheet ที่เลือกเป็น array ข้อมูล
                jsonData = XLSX.utils.sheet_to_json(selectedWorksheet, {header: 1}); // Reassign let variable

                // สร้าง HTML table ด้วยตนเอง
                htmlTable = '<table id="excel-preview-table" class="ckan-preview-table">'; // Reassign let variable

                // สร้างส่วนหัวตารางจากแถวแรก
                if (jsonData.length > 0) {
                    let headerRow = jsonData[0]; // Reassign let variable
                    htmlTable += '<thead><tr>';
                    for (let i = 0; i < headerRow.length; i++) { // ใช้ let สำหรับ loop counter
                        htmlTable += '<th>' + (headerRow[i] || '') + '</th>';
                    }
                    htmlTable += '</tr></thead>';

                    // สร้าง tbody สำหรับข้อมูล (จำกัดแค่ 30 แถว)
                    htmlTable += '<tbody>';
                    let dataRows = Math.min(jsonData.length - 1, maxRows); // Reassign let variable
                    for (let i = 1; i <= dataRows; i++) { // ใช้ let สำหรับ loop counter
                        const row = jsonData[i] || []; // ใช้ const สำหรับ row ภายใน loop
                        htmlTable += '<tr>';
                        for (let j = 0; j < headerRow.length; j++) { // ใช้ let สำหรับ loop counter
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
        let html = '<div class="ckan-preview-controls">'; // ใช้ let เพราะมีการต่อ string

        // Left side: Add Filter button and pagination
        html += '<div class="ckan-preview-controls-left">';
        html += '<button class="ckan-preview-filter-btn">Add Filter</button>';
        html += '<div class="ckan-preview-pagination">';
        html += '<span>30 records</span>'; // Note: This might need dynamic update later
        html += '<span>«</span>';
        html += '<input type="text" value="1">'; // Note: This might need dynamic update later
        html += '<span>–</span>';
        html += '<input type="text" value="1">'; // Note: This might need dynamic update later
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
        const lines = content.split('\n'); // ใช้ const
        if (lines.length < 2) return false;

        const firstLineFields = lines[0].split(',').length; // ใช้ const
        const secondLineFields = lines[1].split(',').length; // ใช้ const

        // If first two lines have the same number of fields, likely a CSV
        return firstLineFields > 1 && firstLineFields === secondLineFields;
    }

    // Function to display CSV preview
    function displayCSVPreview(content) {
        // เพิ่มการโหลด CSS สำหรับระบบกรอง
        if (!$('link[href*="ckan-data-preview-filter.css"]').length) {
             // Assuming get_stylesheet_directory_uri is globally available
            $('head').append('<link rel="stylesheet" href="' + get_stylesheet_directory_uri + '/css/ckan-data-preview-filter.css" type="text/css" />');
        }

        // Add table controls first (Filter, pagination, search)
        const controlsHtml = generateTableControlsHtml(); // ใช้ const

        // Process CSV content
        const lines = content.split('\n'); // ใช้ const
        let tableHtml = '<div class="ckan-preview-table-container"><table class="ckan-preview-table">'; // ใช้ let เพราะมีการต่อ string

        // Process header (assume first row is header)
        if (lines.length > 0) {
            const headerCells = lines[0].split(','); // ใช้ const
            tableHtml += '<thead><tr>';
            for (let i = 0; i < headerCells.length; i++) { // ใช้ let สำหรับ loop counter
                tableHtml += '<th>' + headerCells[i].trim() + '</th>';
            }
            tableHtml += '</tr></thead>';

            // Process data rows (จำกัดแค่ 30 แถว)
            tableHtml += '<tbody>';
            const dataRows = Math.min(lines.length - 1, maxRows); // ใช้ const
            for (let j = 1; j <= dataRows; j++) { // ใช้ let สำหรับ loop counter
                if (lines[j].trim() === '') continue; // Skip empty lines

                const rowCells = lines[j].split(','); // ใช้ const สำหรับ row ภายใน loop
                tableHtml += '<tr>';
                for (let k = 0; k < headerCells.length; k++) { // ใช้ let สำหรับ loop counter
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
            const jsonObj = JSON.parse(content); // ใช้ const
            const formattedJson = JSON.stringify(jsonObj, null, 2); // ใช้ const
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
