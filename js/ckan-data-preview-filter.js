/**
 * CKAN Data Preview Filter JavaScript
 * เพิ่มความสามารถในการกรองข้อมูลและการค้นหาสำหรับตารางไฟล์ในตัวอย่าง
 * Version: 1.1.0 (Refactored rowMatchesFilters for complexity)
 */
jQuery(document).ready(($) => {
    // ตัวแปรสำหรับการจัดการข้อมูล
    const tableData = {
        allRows: [],          // เก็บข้อมูลทั้งหมด
        filteredRows: [],     // เก็บข้อมูลหลังกรอง
        columns: [],          // เก็บชื่อคอลัมน์
        currentPage: 1,       // หน้าปัจจุบัน
        rowsPerPage: 30,      // จำนวนแถวต่อหน้า
        totalRows: 0,         // จำนวนแถวทั้งหมด
        activeFilters: {}     // กรองที่ใช้งานอยู่
    };

    // ติดตั้ง event handlers หลังจากโหลด preview
    $(document).on('ckan_preview_loaded', () => {
        initializeDataTable();
        setupEventHandlers();
    });

    // ฟังก์ชั่นเริ่มต้นสำหรับจัดการข้อมูลตาราง
    const initializeDataTable = () => {
        extractTableData();
        tableData.filteredRows = tableData.allRows.slice();
        tableData.totalRows = tableData.filteredRows.length;
        updatePaginationInfo();
        renderCurrentPage();
    };

    // ดึงข้อมูลจากตารางที่แสดงอยู่
    const extractTableData = () => {
        const table = $('.ckan-preview-table, #excel-preview-table');
        tableData.allRows = [];
        tableData.columns = [];

        table.find('thead th').each(function() {
            tableData.columns.push($(this).text().trim());
        });

        table.find('tbody tr').each(function() {
            const rowData = [];
            $(this).find('td').each(function() {
                rowData.push($(this).text().trim());
            });
            tableData.allRows.push(rowData);
        });

        if (!table.data('originalTable')) {
            table.data('originalTable', table.find('tbody').html());
        }
    };

    // ตั้งค่า event handlers สำหรับปุ่มและการควบคุมต่างๆ
    const setupEventHandlers = () => {
        // ปุ่มค้นหา (Event delegation might be better if controls are added dynamically)
        $('.ckan-preview-search button:not(.filters-btn)').off('click').on('click', searchTable);
        $('.ckan-preview-search input').off('keypress').on('keypress', (e) => {
            if (e.which === 13) searchTable();
        });

        // ปุ่ม Add Filter / Filters
        $('.ckan-preview-filter-btn, .ckan-preview-search .filters-btn').off('click').on('click', showFilterDialog);

        // ปุ่มเปลี่ยนหน้า
        $('.ckan-preview-pagination span:contains("«")').off('click').on('click', () => navigateToPage('first'));
        $('.ckan-preview-pagination span:contains("»")').off('click').on('click', () => navigateToPage('last'));
        $('.ckan-preview-pagination input').off('change').on('change', function() {
            const inputPage = parseInt($(this).val());
            if (!isNaN(inputPage)) navigateToPage(inputPage);
        });
    };

    // แสดงหน้าต่างสำหรับตั้งค่ากรอง
    const showFilterDialog = () => {
        $('.ckan-filter-dialog').remove(); // Ensure only one dialog exists

        let dialogHtml = `
            <div class="ckan-filter-dialog">
                <div class="ckan-filter-dialog-content">
                    <span class="ckan-filter-dialog-close">&times;</span>
                    <h3>Add Filter</h3>
                    <div class="ckan-filter-options">`;

        tableData.columns.forEach((column, index) => {
            dialogHtml += `
                <div class="ckan-filter-option">
                    <div class="filter-column-name">${escapeHtml(column)}</div>
                    <select class="filter-operator" data-column="${index}">
                        <option value="contains">Contains</option>
                        <option value="equals">Equals</option>
                        <option value="starts">Starts with</option>
                        <option value="ends">Ends with</option>
                        <option value="greater">Greater than</option>
                        <option value="less">Less than</option>
                    </select>
                    <input type="text" class="filter-value" data-column="${index}" placeholder="Filter value">
                    <button class="apply-filter" data-column="${index}">Apply</button>
                </div>`;
        });

        dialogHtml += `
                    </div>
                    <div class="active-filters-container">
                        <h4>Active Filters</h4>
                        <div class="active-filters-list"></div>
                        <button class="clear-all-filters" ${Object.keys(tableData.activeFilters).length === 0 ? 'disabled' : ''}>Clear All Filters</button>
                    </div>
                </div>
            </div>`;

        // Use a container that's likely to exist, e.g., body or a specific wrapper
        $('body').append(dialogHtml); // Append to body to ensure it's top-level

        updateActiveFiltersList();
        setupFilterDialogHandlers();
    };

    // ตั้งค่า event handlers สำหรับหน้าต่างกรอง
    const setupFilterDialogHandlers = () => {
        // Use event delegation for dynamically added dialog elements
        $(document).off('click.filterDialog').on('click.filterDialog', '.ckan-filter-dialog-close', () => {
            $('.ckan-filter-dialog').remove();
            $(document).off('click.filterDialog'); // Clean up delegated event
        });

        // Close on outside click
        $(document).off('click.filterDialogOutside').on('click.filterDialogOutside', (e) => {
            if ($(e.target).is('.ckan-filter-dialog')) {
                $('.ckan-filter-dialog').remove();
                $(document).off('click.filterDialogOutside'); // Clean up delegated event
            }
        });

        // Apply Filter Button
        $('.ckan-filter-dialog').off('click.applyFilter').on('click.applyFilter', '.apply-filter', function() {
            const columnIndex = $(this).data('column');
            const operator = $(`.filter-operator[data-column="${columnIndex}"]`).val();
            const value = $(`.filter-value[data-column="${columnIndex}"]`).val().trim();

            if (value !== '') {
                tableData.activeFilters[columnIndex] = { operator, value };
                applyFilters(); // Apply filters immediately
                $('.ckan-filter-dialog').remove(); // Close dialog
                $(document).off('click.filterDialog'); // Clean up delegated events
                $(document).off('click.filterDialogOutside');
            }
        });

        // Clear All Filters Button
        $('.ckan-filter-dialog').off('click.clearFilters').on('click.clearFilters', '.clear-all-filters', () => {
            tableData.activeFilters = {};
            applyFilters(); // Apply (which means reset) filters
            $('.ckan-filter-dialog').remove(); // Close dialog
            $(document).off('click.filterDialog'); // Clean up delegated events
            $(document).off('click.filterDialogOutside');
        });
    };

    // อัพเดทรายการกรองที่ใช้งานอยู่ (ในหน้าต่างกรอง)
    const updateActiveFiltersList = () => {
        const filtersList = $('.active-filters-list');
        if (!filtersList.length) return; // Exit if dialog isn't open

        filtersList.empty();
        const hasFilters = Object.keys(tableData.activeFilters).length > 0;

        if (hasFilters) {
            $.each(tableData.activeFilters, (columnIndex, filter) => {
                const columnName = tableData.columns[columnIndex];
                const operatorText = getOperatorDisplayText(filter.operator);
                const filterHtml = `
                    <div class="active-filter">
                        <span class="filter-desc">${escapeHtml(columnName)} ${operatorText} "${escapeHtml(filter.value)}"</span>
                        <button class="remove-filter" data-column="${columnIndex}">×</button>
                    </div>`;
                filtersList.append(filterHtml);
            });
            // Attach remove handler specifically here after adding elements
            $('.remove-filter').off('click').on('click', handleRemoveFilterClick);
        } else {
            filtersList.html('<div class="no-filters">ไม่มีกรองที่ใช้งานอยู่</div>');
        }

        $('.clear-all-filters').prop('disabled', !hasFilters);
    };

    // Handler for removing a single filter from the list
    const handleRemoveFilterClick = function() {
        const columnIndex = $(this).data('column');
        delete tableData.activeFilters[columnIndex];
        applyFilters(); // Re-apply filters after removal
        updateActiveFiltersList(); // Update the list in the dialog
    };


    // ค้นหาข้อมูลในตาราง
    const searchTable = () => {
        const searchText = $('.ckan-preview-search input').val().trim().toLowerCase();
        applyFiltersAndSearch(searchText); // Consolidate filtering logic
    };

    // ใช้กรองกับข้อมูล
    const applyFilters = () => {
        applyFiltersAndSearch(''); // Apply filters with no search text
    };

    // Apply filters and optional search term
    const applyFiltersAndSearch = (searchText) => {
        const hasFilters = Object.keys(tableData.activeFilters).length > 0;
        const hasSearch = searchText !== '';

        if (!hasFilters && !hasSearch) {
            tableData.filteredRows = tableData.allRows.slice(); // No filters, no search
        } else {
            tableData.filteredRows = tableData.allRows.filter(rowData => {
                // Must match all active filters
                if (!rowMatchesFilters(rowData)) {
                    return false;
                }
                // If searching, must also match search text somewhere
                if (hasSearch) {
                    return rowData.some(cellData => cellData.toLowerCase().includes(searchText));
                }
                // If only filtering, reaching here means it matches
                return true;
            });
        }

        tableData.totalRows = tableData.filteredRows.length;
        tableData.currentPage = 1; // Reset to first page after filtering/searching
        updatePaginationInfo();
        renderCurrentPage();
    };


    // --- Refactored Filter Comparison Logic ---

    // Helper functions for specific comparisons
    const checkContains = (cell, filterVal) => cell.toLowerCase().includes(filterVal.toLowerCase());
    const checkEquals = (cell, filterVal) => cell.toLowerCase() === filterVal.toLowerCase();
    const checkStartsWith = (cell, filterVal) => cell.toLowerCase().startsWith(filterVal.toLowerCase());
    const checkEndsWith = (cell, filterVal) => cell.toLowerCase().endsWith(filterVal.toLowerCase());

    const checkGreaterThan = (cell, filterVal) => {
        const numCell = parseFloat(cell);
        const numFilter = parseFloat(filterVal);
        // Return false if either is not a number or if cell is not greater
        return !isNaN(numCell) && !isNaN(numFilter) && numCell > numFilter;
    };

    const checkLessThan = (cell, filterVal) => {
        const numCell = parseFloat(cell);
        const numFilter = parseFloat(filterVal);
        // Return false if either is not a number or if cell is not less
        return !isNaN(numCell) && !isNaN(numFilter) && numCell < numFilter;
    };

    // Map operators to their corresponding check functions
    const operatorCheckFunctions = {
        'contains': checkContains,
        'equals': checkEquals,
        'starts': checkStartsWith,
        'ends': checkEndsWith,
        'greater': checkGreaterThan,
        'less': checkLessThan
    };

    // ตรวจสอบว่าแถวตรงกับกรองทั้งหมดหรือไม่ (Refactored)
    const rowMatchesFilters = (rowData) => { // Complexity significantly reduced
        for (const columnIndex in tableData.activeFilters) { // +1 (loop)
            const filter = tableData.activeFilters[columnIndex];
            const cellValue = rowData[columnIndex] || ''; // Handle potential undefined cells
            const checkFunction = operatorCheckFunctions[filter.operator];

            // If a valid check function exists and it returns false, the row doesn't match
            if (checkFunction && !checkFunction(cellValue, filter.value)) { // +1 (if) +1 (logical not)
                return false; // +1 (early return)
            }
        }
        // If the loop completes without returning false, the row matches all filters
        return true;
    };
    // Estimated Complexity: 1 (function) + 1 (loop) + 1 (if) + 1 (logical not) + 1 (return) = 5

    // --- End Refactored Filter Comparison Logic ---


    // แปลงรหัสตัวดำเนินการเป็นข้อความที่แสดง
    const getOperatorDisplayText = (operator) => {
        const displayTexts = {
            'contains': 'contains',
            'equals': 'equals',
            'starts': 'starts with',
            'ends': 'ends with',
            'greater': 'is greater than',
            'less': 'is less than'
        };
        return displayTexts[operator] || operator; // Fallback to operator code
    };

    // นำไปยังหน้าที่ระบุ
    const navigateToPage = (page) => {
        const totalPages = Math.max(1, Math.ceil(tableData.totalRows / tableData.rowsPerPage));
        let targetPage = tableData.currentPage; // Default to current

        if (page === 'first') {
            targetPage = 1;
        } else if (page === 'last') {
            targetPage = totalPages;
        } else if (!isNaN(parseInt(page))) {
            targetPage = parseInt(page);
        }

        // Clamp page number within valid range
        tableData.currentPage = Math.max(1, Math.min(targetPage, totalPages));

        updatePaginationInfo();
        renderCurrentPage();
    };

    // อัพเดทข้อมูลการแบ่งหน้า
    const updatePaginationInfo = () => {
        const totalPages = Math.max(1, Math.ceil(tableData.totalRows / tableData.rowsPerPage));
        const $paginationControls = $('.ckan-preview-pagination'); // Cache selector

        // อัพเดทข้อความจำนวนแถว
        $paginationControls.find('span').first().text(`${tableData.totalRows} records`);

        // อัพเดทช่องป้อนหมายเลขหน้า
        $paginationControls.find('input').first().val(tableData.currentPage);
        $paginationControls.find('span').eq(1).text(` of ${totalPages} `); // Update total pages text

        // Enable/disable navigation buttons based on current page
        $paginationControls.find('span:contains("«")').prop('disabled', tableData.currentPage === 1);
        $paginationControls.find('span:contains("»")').prop('disabled', tableData.currentPage === totalPages);
    };

    // แสดงข้อมูลสำหรับหน้าปัจจุบัน
    const renderCurrentPage = () => {
        const table = $('.ckan-preview-table, #excel-preview-table');
        const tbody = table.find('tbody');
        tbody.empty(); // Clear previous rows

        const startIndex = (tableData.currentPage - 1) * tableData.rowsPerPage;
        const endIndex = Math.min(startIndex + tableData.rowsPerPage, tableData.totalRows);

        if (tableData.filteredRows.length === 0) {
            const colSpan = tableData.columns.length || 1;
            tbody.append(`<tr><td colspan="${colSpan}" class="no-data">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</td></tr>`);
            return;
        }

        // Build rows HTML string for better performance
        let rowsHtml = '';
        for (let i = startIndex; i < endIndex; i++) {
            const rowData = tableData.filteredRows[i];
            rowsHtml += '<tr>';
            // Use simple loop for potentially large number of columns
            for (let j = 0; j < rowData.length; j++) {
                // Escape cell data to prevent potential XSS if data is untrusted
                rowsHtml += `<td>${escapeHtml(rowData[j])}</td>`;
            }
            rowsHtml += '</tr>';
        }
        tbody.append(rowsHtml); // Append all rows at once
    };

    // Helper function to escape HTML (basic implementation)
    const escapeHtml = (unsafe) => {
        if (typeof unsafe !== 'string') {
            // Attempt to convert non-strings, return empty for null/undefined
            if (unsafe === null || unsafe === undefined) return '';
            try {
                unsafe = String(unsafe);
            } catch (e) {
                return ''; // Return empty if conversion fails
            }
        }
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
     };

});
