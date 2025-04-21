/**
 * CKAN Data Preview JavaScript
 * ปรับปรุงเพื่อให้แสดงแถวแรกเป็นส่วนหัวตารางและจำกัดจำนวนแถวเป็น 30 แถว
 * Refactored to use let/const and reduce cognitive complexity.
 */
jQuery(document).ready(function($) {
    // Initialize
    const previewModal = $('#ckan-preview-modal');
    const previewModalBody = $('.ckan-preview-data');
    const previewLoading = $('.ckan-preview-loading');
    const maxRows = 30; // จำกัดจำนวนแถวเป็น 30 แถว

    // --- Helper Functions ---

    /**
     * Generates HTML for table controls (Filter, Pagination, Search).
     * @returns {string} HTML string for controls.
     */
    function generateTableControlsHtml() {
        let html = '<div class="ckan-preview-controls">';
        // Left side: Add Filter button and pagination
        html += '<div class="ckan-preview-controls-left">';
        html += '<button class="ckan-preview-filter-btn">Add Filter</button>';
        html += '<div class="ckan-preview-pagination">';
        html += `<span>${maxRows} records</span>`; // Display max rows
        html += '<span>«</span>';
        html += '<input type="text" value="1">'; // Placeholder, needs functionality
        html += '<span>–</span>';
        html += '<input type="text" value="1">'; // Placeholder, needs functionality
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

    /**
     * Checks if text content resembles CSV format.
     * @param {string} content The text content.
     * @returns {boolean} True if likely CSV, false otherwise.
     */
    function isCSVLike(content) {
        const lines = content.split('\n');
        if (lines.length < 2) return false;
        const firstLineFields = lines[0].split(',').length;
        // Handle potential trailing newline causing an empty last line
        const secondLine = lines[1].trim();
        if (!secondLine) return firstLineFields > 1; // If only header and empty lines, consider it CSV-like if header has columns
        const secondLineFields = secondLine.split(',').length;
        return firstLineFields > 1 && firstLineFields === secondLineFields;
    }

    /**
     * Generates an HTML table string from Excel sheet data (jsonData).
     * @param {Array<Array<any>>} jsonData Data parsed from SheetJS (array of arrays).
     * @param {number} maxRowsToShow Maximum number of data rows to include.
     * @returns {string} HTML table string.
     */
    function generateExcelHtmlTable(jsonData, maxRowsToShow) {
        let htmlTable = '<table id="excel-preview-table" class="ckan-preview-table">';
        if (jsonData && jsonData.length > 0) {
            const headerRow = jsonData[0];
            // Generate Header (thead)
            htmlTable += '<thead><tr>';
            for (let i = 0; i < headerRow.length; i++) {
                htmlTable += '<th>' + (headerRow[i] || '') + '</th>';
            }
            htmlTable += '</tr></thead>';

            // Generate Body (tbody)
            htmlTable += '<tbody>';
            const dataRowCount = Math.min(jsonData.length - 1, maxRowsToShow);
            for (let i = 1; i <= dataRowCount; i++) {
                const row = jsonData[i] || [];
                htmlTable += '<tr>';
                for (let j = 0; j < headerRow.length; j++) { // Iterate based on header length
                    htmlTable += '<td>' + (row[j] !== undefined && row[j] !== null ? row[j] : '') + '</td>';
                }
                htmlTable += '</tr>';
            }
            htmlTable += '</tbody>';
        } else {
             htmlTable += '<tbody><tr><td>No data found in this sheet.</td></tr></tbody>';
        }
        htmlTable += '</table>';
        return htmlTable;
    }

     /**
     * Loads necessary CSS if not already present.
     * @param {string} cssUrl URL of the CSS file.
     * @param {string} checkSelector A selector to check if the CSS is already loaded (e.g., part of the href).
     */
    function loadCssIfNeeded(cssUrl, checkSelector) {
        if (cssUrl && checkSelector && !$(checkSelector).length) {
            $('head').append(`<link rel="stylesheet" href="${cssUrl}" type="text/css" />`);
        }
    }

    // --- Display Functions ---

    /**
     * Displays Excel file preview.
     * @param {string} base64Content Base64 encoded Excel file content.
     */
    function displayExcelPreview(base64Content) {
        try {
            // Assuming get_stylesheet_directory_uri is globally available from WordPress localization
            const filterCssUrl = (typeof get_stylesheet_directory_uri !== 'undefined')
                               ? get_stylesheet_directory_uri + '/css/ckan-data-preview-filter.css'
                               : null; // Provide a fallback or handle error if var is missing
            loadCssIfNeeded(filterCssUrl, 'link[href*="ckan-data-preview-filter.css"]');

            const controlsHtml = generateTableControlsHtml();

            // Convert base64 to array buffer
            const binaryString = window.atob(base64Content);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const arrayBuffer = bytes.buffer;

            // Read workbook using SheetJS
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
                 previewModalBody.html('<div class="ckan-preview-error">ไม่สามารถอ่านข้อมูลจากไฟล์ Excel ได้ หรือไฟล์ไม่มีชีท</div>');
                 return;
            }

            // Initial sheet display
            const firstSheetName = workbook.SheetNames[0];
            const firstWorksheet = workbook.Sheets[firstSheetName];
            let currentJsonData = XLSX.utils.sheet_to_json(firstWorksheet, { header: 1, defval: "" }); // Use defval for empty cells
            let tableHtml = generateExcelHtmlTable(currentJsonData, maxRows);

            // Create sheet selector if multiple sheets
            let sheetSelectorHtml = '';
            if (workbook.SheetNames.length > 1) {
                sheetSelectorHtml = '<div class="ckan-excel-sheet-selector"><label for="sheet-select">เลือกชีท: </label>';
                sheetSelectorHtml += '<select id="sheet-select">';
                workbook.SheetNames.forEach((sheetName, index) => {
                    sheetSelectorHtml += `<option value="${index}"${index === 0 ? ' selected' : ''}>${sheetName}</option>`;
                });
                sheetSelectorHtml += '</select></div>';
            }

            // Add controls, sheet selector and table to modal
            previewModalBody.html(controlsHtml + sheetSelectorHtml + '<div class="ckan-preview-table-container">' + tableHtml + '</div>');

            // Trigger event for filter system
            $(document).trigger('ckan_preview_loaded');

            // Handle sheet selection change (only if selector exists)
            if (workbook.SheetNames.length > 1) {
                $('#sheet-select').on('change', function() {
                    const selectedSheetIndex = parseInt($(this).val());
                    const selectedSheetName = workbook.SheetNames[selectedSheetIndex];
                    const selectedWorksheet = workbook.Sheets[selectedSheetName];

                    currentJsonData = XLSX.utils.sheet_to_json(selectedWorksheet, { header: 1, defval: "" }); // Update data
                    tableHtml = generateExcelHtmlTable(currentJsonData, maxRows); // Regenerate table

                    // Update table container only
                    $('.ckan-preview-table-container').html(tableHtml);

                    // Trigger event for filter system again
                    $(document).trigger('ckan_preview_loaded');
                });
            }

        } catch (e) {
            console.error('Excel parsing/display error:', e);
            previewModalBody.html('<div class="ckan-preview-error">เกิดข้อผิดพลาดในการอ่านหรือแสดงตัวอย่างไฟล์ Excel</div>');
        }
    }

    /**
     * Displays CSV file preview.
     * @param {string} content CSV file content.
     */
    function displayCSVPreview(content) {
        // Assuming get_stylesheet_directory_uri is globally available
        const filterCssUrl = (typeof get_stylesheet_directory_uri !== 'undefined')
                           ? get_stylesheet_directory_uri + '/css/ckan-data-preview-filter.css'
                           : null;
        loadCssIfNeeded(filterCssUrl, 'link[href*="ckan-data-preview-filter.css"]');

        const controlsHtml = generateTableControlsHtml();
        const lines = content.split('\n');
        let tableHtml = '<div class="ckan-preview-table-container"><table class="ckan-preview-table">';

        if (lines.length > 0) {
            // Basic CSV parsing (split by comma, trim whitespace)
            // Note: This is a simple parser and might fail on complex CSVs (e.g., with quoted commas)
            const headerCells = lines[0].split(',').map(cell => cell.trim());
            tableHtml += '<thead><tr>';
            headerCells.forEach(cell => { tableHtml += `<th>${cell}</th>`; });
            tableHtml += '</tr></thead>';

            tableHtml += '<tbody>';
            const dataRowCount = Math.min(lines.length - 1, maxRows);
            for (let j = 1; j <= dataRowCount; j++) {
                const line = lines[j].trim();
                if (line === '') continue; // Skip empty lines

                const rowCells = line.split(',').map(cell => cell.trim());
                tableHtml += '<tr>';
                // Ensure we don't create more cells than headers
                for (let k = 0; k < headerCells.length; k++) {
                    tableHtml += `<td>${k < rowCells.length ? rowCells[k] : ''}</td>`;
                }
                tableHtml += '</tr>';
            }
            tableHtml += '</tbody>';
        } else {
             tableHtml += '<tbody><tr><td>No data found in CSV file.</td></tr></tbody>';
        }
        tableHtml += '</table></div>';

        previewModalBody.html(controlsHtml + tableHtml);
        $(document).trigger('ckan_preview_loaded');
    }

    /**
     * Displays JSON file preview.
     * @param {string} content JSON file content.
     */
    function displayJSONPreview(content) {
        try {
            const jsonObj = JSON.parse(content);
            // Using <pre> and JSON.stringify for basic formatting
            const formattedJson = JSON.stringify(jsonObj, null, 2); // Indent with 2 spaces
            previewModalBody.html('<pre class="ckan-preview-json"><code>' + formattedJson + '</code></pre>');
        } catch (e) {
            console.error('JSON parsing error:', e);
            previewModalBody.html('<div class="ckan-preview-error">ไฟล์ JSON ไม่ถูกต้อง หรือไม่สามารถแสดงตัวอย่างได้</div>');
        }
    }

    /**
     * Displays plain text file preview.
     * @param {string} content Text file content.
     */
    function displayTextPreview(content) {
        // Escape HTML to prevent rendering as HTML
        const escapedContent = $('<textarea/>').text(content).html();
        previewModalBody.html('<pre class="ckan-preview-text">' + escapedContent + '</pre>');
    }

    // --- AJAX Call ---

    /**
     * Fetches file content via WordPress AJAX proxy and calls the appropriate display function.
     * @param {string} fileUrl The URL of the file to preview.
     * @param {string} fileExt The file extension.
     */
    function fetchFilePreview(fileUrl, fileExt) {
        // Check if required AJAX data is available
        if (typeof ckan_rp_list_ajax === 'undefined' || !ckan_rp_list_ajax.ajax_url || !ckan_rp_list_ajax.nonce) {
             previewLoading.hide();
             previewModalBody.html('<div class="ckan-preview-error">ข้อมูล AJAX ไม่พร้อมใช้งาน (ckan_rp_list_ajax)</div>');
             console.error('ckan_rp_list_ajax object is missing or incomplete.');
             return;
        }

        $.ajax({
            url: ckan_rp_list_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_get_file_preview',
                nonce: ckan_rp_list_ajax.nonce,
                file_url: fileUrl
            },
            beforeSend: function() {
                previewLoading.show(); // Show loading indicator before request
                previewModalBody.empty(); // Clear previous content
            },
            success: function(response) {
                previewLoading.hide();
                if (response.success && response.data) {
                    const fileContent = response.data.content;
                    const fileExtension = response.data.extension || fileExt; // Prefer extension from server if available

                    // Handle different file types
                    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                        displayExcelPreview(fileContent);
                    } else if (fileExtension === 'csv' || (fileExtension !== 'json' && isCSVLike(fileContent))) { // Check CSV-like only if not explicitly JSON
                        displayCSVPreview(fileContent);
                    } else if (fileExtension === 'json') {
                        displayJSONPreview(fileContent);
                    } else if (['txt', 'md', 'html', 'xml', 'log'].includes(fileExtension)) { // Expand text types
                        displayTextPreview(fileContent);
                    } else {
                        previewModalBody.html('<div class="ckan-preview-error">ไม่สามารถแสดงตัวอย่างไฟล์ประเภทนี้ได้ (' + fileExtension + ')</div>');
                    }
                } else {
                    const errorMessage = response.data || 'Unknown error fetching file preview.';
                    previewModalBody.html('<div class="ckan-preview-error">เกิดข้อผิดพลาด: ' + errorMessage + '</div>');
                    console.error('Error fetching file preview:', errorMessage);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                previewLoading.hide();
                previewModalBody.html('<div class="ckan-preview-error">ไม่สามารถโหลดไฟล์ได้ (AJAX Error)</div>');
                console.error('AJAX error fetching file preview:', textStatus, errorThrown);
            }
        });
    }

    // --- Event Handlers ---

    // Preview button click
    $(document).on('click', '.ckan-preview-btn', function() {
        const encodedUrl = $(this).data('url');
        if (!encodedUrl) {
            console.error('Preview button clicked but no data-url found.');
            return;
        }
        try {
            const fileUrl = atob(encodedUrl); // Decode base64
            const fileName = fileUrl.split('/').pop();
            const fileExt = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : ''; // Handle files without extension

            // Show modal and set title
            previewModal.addClass('show');
            $('.ckan-preview-modal-title').text('ดูตัวอย่าง: ' + fileName);

            // Fetch and preview file contents
            fetchFilePreview(fileUrl, fileExt);
        } catch (e) {
             console.error('Error decoding URL or processing file info:', e);
             previewModal.addClass('show');
             $('.ckan-preview-modal-title').text('ดูตัวอย่าง: ข้อผิดพลาด');
             previewModalBody.html('<div class="ckan-preview-error">URL ของไฟล์ไม่ถูกต้อง</div>');
        }
    });

    // Close modal button
    $('.ckan-preview-modal-close').on('click', function() {
        previewModal.removeClass('show');
        previewModalBody.empty(); // Clear content when closing
        $('.ckan-preview-modal-title').text('ดูตัวอย่าง'); // Reset title
    });

    // Close modal when clicking outside content area
    $(previewModal).on('click', function(e) { // Attach to modal itself
        if ($(e.target).is(previewModal)) { // Check if the click is directly on the modal background
            previewModal.removeClass('show');
            previewModalBody.empty(); // Clear content when closing
            $('.ckan-preview-modal-title').text('ดูตัวอย่าง'); // Reset title
        }
    });

});
