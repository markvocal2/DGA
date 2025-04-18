/**
 * CKAN Data Preview Filter JavaScript
 * เพิ่มความสามารถในการกรองข้อมูลและการค้นหาสำหรับตารางไฟล์ในตัวอย่าง
 */
jQuery(document).ready(function($) {
    // ตัวแปรสำหรับการจัดการข้อมูล
    var tableData = {
        allRows: [],           // เก็บข้อมูลทั้งหมด
        filteredRows: [],      // เก็บข้อมูลหลังกรอง
        columns: [],           // เก็บชื่อคอลัมน์
        currentPage: 1,        // หน้าปัจจุบัน
        rowsPerPage: 30,       // จำนวนแถวต่อหน้า
        totalRows: 0,          // จำนวนแถวทั้งหมด
        activeFilters: {}      // กรองที่ใช้งานอยู่
    };
    
    // ติดตั้ง event handlers หลังจากโหลด preview
    $(document).on('ckan_preview_loaded', function() {
        initializeDataTable();
        setupEventHandlers();
    });
    
    // ฟังก์ชั่นเริ่มต้นสำหรับจัดการข้อมูลตาราง
    function initializeDataTable() {
        // รับข้อมูลจากตาราง
        extractTableData();
        
        // ตั้งค่าการแสดงผลเริ่มต้น
        tableData.filteredRows = tableData.allRows.slice();
        tableData.totalRows = tableData.filteredRows.length;
        updatePaginationInfo();
        
        // เริ่มต้นแสดงหน้าแรก
        renderCurrentPage();
    }
    
    // ดึงข้อมูลจากตารางที่แสดงอยู่
    function extractTableData() {
        var table = $('.ckan-preview-table, #excel-preview-table');
        tableData.allRows = [];
        tableData.columns = [];
        
        // ดึงข้อมูลหัวตาราง (columns)
        table.find('thead th').each(function() {
            tableData.columns.push($(this).text().trim());
        });
        
        // ดึงข้อมูลแถว (rows)
        table.find('tbody tr').each(function() {
            var rowData = [];
            $(this).find('td').each(function() {
                rowData.push($(this).text().trim());
            });
            tableData.allRows.push(rowData);
        });
        
        // สำรองข้อมูลตารางต้นฉบับ
        if (!table.data('originalTable')) {
            table.data('originalTable', table.find('tbody').html());
        }
    }
    
    // ตั้งค่า event handlers สำหรับปุ่มและการควบคุมต่างๆ
    function setupEventHandlers() {
        // ปุ่มค้นหา
        $('.ckan-preview-search button:not(.filters-btn)').on('click', function() {
            searchTable();
        });
        
        // ค้นหาเมื่อกด Enter
        $('.ckan-preview-search input').on('keypress', function(e) {
            if (e.which === 13) {
                searchTable();
            }
        });
        
        // ปุ่ม Add Filter
        $('.ckan-preview-filter-btn').on('click', function() {
            showFilterDialog();
        });
        
        // ปุ่ม Filters
        $('.ckan-preview-search .filters-btn').on('click', function() {
            showFilterDialog();
        });
        
        // ปุ่มเปลี่ยนหน้า
        $('.ckan-preview-pagination span:contains("«")').on('click', function() {
            navigateToPage('first');
        });
        
        $('.ckan-preview-pagination span:contains("»")').on('click', function() {
            navigateToPage('last');
        });
        
        // อัพเดทเมื่อใส่หมายเลขหน้าโดยตรง
        $('.ckan-preview-pagination input').on('change', function() {
            var inputPage = parseInt($(this).val());
            if (!isNaN(inputPage)) {
                navigateToPage(inputPage);
            }
        });
    }
    
    // แสดงหน้าต่างสำหรับตั้งค่ากรอง
    function showFilterDialog() {
        // ถ้ามีหน้าต่างอยู่แล้ว ให้ลบทิ้งก่อน
        $('.ckan-filter-dialog').remove();
        
        // สร้างหน้าต่างสำหรับกรอง
        var dialogHtml = '<div class="ckan-filter-dialog">';
        dialogHtml += '<div class="ckan-filter-dialog-content">';
        dialogHtml += '<span class="ckan-filter-dialog-close">&times;</span>';
        dialogHtml += '<h3>Add Filter</h3>';
        
        // สร้าง filter options สำหรับแต่ละคอลัมน์
        dialogHtml += '<div class="ckan-filter-options">';
        tableData.columns.forEach(function(column, index) {
            dialogHtml += '<div class="ckan-filter-option">';
            dialogHtml += '<div class="filter-column-name">' + column + '</div>';
            dialogHtml += '<select class="filter-operator" data-column="' + index + '">';
            dialogHtml += '<option value="contains">Contains</option>';
            dialogHtml += '<option value="equals">Equals</option>';
            dialogHtml += '<option value="starts">Starts with</option>';
            dialogHtml += '<option value="ends">Ends with</option>';
            dialogHtml += '<option value="greater">Greater than</option>';
            dialogHtml += '<option value="less">Less than</option>';
            dialogHtml += '</select>';
            dialogHtml += '<input type="text" class="filter-value" data-column="' + index + '" placeholder="Filter value">';
            dialogHtml += '<button class="apply-filter" data-column="' + index + '">Apply</button>';
            dialogHtml += '</div>';
        });
        dialogHtml += '</div>';
        
        // แสดงกรองที่ใช้งานอยู่
        dialogHtml += '<div class="active-filters-container">';
        dialogHtml += '<h4>Active Filters</h4>';
        dialogHtml += '<div class="active-filters-list"></div>';
        dialogHtml += '<button class="clear-all-filters" ' + (Object.keys(tableData.activeFilters).length === 0 ? 'disabled' : '') + '>Clear All Filters</button>';
        dialogHtml += '</div>';
        
        dialogHtml += '</div>'; // End filter dialog content
        dialogHtml += '</div>'; // End filter dialog
        
        // เพิ่มหน้าต่างไปยัง DOM
        $('.ckan-preview-modal-body').append(dialogHtml);
        
        // แสดงกรองที่ใช้งานอยู่
        updateActiveFiltersList();
        
        // ตั้งค่า event handlers สำหรับหน้าต่างกรอง
        setupFilterDialogHandlers();
    }
    
    // ตั้งค่า event handlers สำหรับหน้าต่างกรอง
    function setupFilterDialogHandlers() {
        // ปิดหน้าต่างกรอง
        $('.ckan-filter-dialog-close').on('click', function() {
            $('.ckan-filter-dialog').remove();
        });
        
        // คลิกนอกหน้าต่างกรองเพื่อปิด
        $(document).on('click', function(e) {
            if ($(e.target).is('.ckan-filter-dialog')) {
                $('.ckan-filter-dialog').remove();
            }
        });
        
        // ปุ่ม Apply filter
        $('.apply-filter').on('click', function() {
            var columnIndex = $(this).data('column');
            var operator = $('.filter-operator[data-column="' + columnIndex + '"]').val();
            var value = $('.filter-value[data-column="' + columnIndex + '"]').val().trim();
            
            if (value !== '') {
                // เพิ่มกรอง
                tableData.activeFilters[columnIndex] = {
                    operator: operator,
                    value: value
                };
                
                // ใช้กรองและแสดงผล
                applyFilters();
                updateActiveFiltersList();
                
                // ปิดหน้าต่างกรอง
                $('.ckan-filter-dialog').remove();
            }
        });
        
        // ปุ่ม Clear All Filters
        $('.clear-all-filters').on('click', function() {
            tableData.activeFilters = {};
            applyFilters();
            updateActiveFiltersList();
            
            // ปิดหน้าต่างกรอง
            $('.ckan-filter-dialog').remove();
        });
    }
    
    // อัพเดทรายการกรองที่ใช้งานอยู่
    function updateActiveFiltersList() {
        var filtersList = $('.active-filters-list');
        filtersList.empty();
        
        // แสดงรายการกรองที่ใช้งานอยู่
        $.each(tableData.activeFilters, function(columnIndex, filter) {
            var columnName = tableData.columns[columnIndex];
            var operatorText = getOperatorDisplayText(filter.operator);
            
            var filterHtml = '<div class="active-filter">';
            filterHtml += '<span class="filter-desc">' + columnName + ' ' + operatorText + ' "' + filter.value + '"</span>';
            filterHtml += '<button class="remove-filter" data-column="' + columnIndex + '">×</button>';
            filterHtml += '</div>';
            
            filtersList.append(filterHtml);
        });
        
        // ถ้าไม่มีกรองที่ใช้งานอยู่ ให้แสดงข้อความ
        if (Object.keys(tableData.activeFilters).length === 0) {
            filtersList.html('<div class="no-filters">ไม่มีกรองที่ใช้งานอยู่</div>');
            $('.clear-all-filters').prop('disabled', true);
        } else {
            $('.clear-all-filters').prop('disabled', false);
        }
        
        // ตั้งค่า event handler สำหรับปุ่มลบกรอง
        $('.remove-filter').on('click', function() {
            var columnIndex = $(this).data('column');
            delete tableData.activeFilters[columnIndex];
            applyFilters();
            updateActiveFiltersList();
        });
    }
    
    // ค้นหาข้อมูลในตาราง
    function searchTable() {
        var searchText = $('.ckan-preview-search input').val().trim().toLowerCase();
        
        if (searchText === '') {
            // ถ้าไม่มีข้อความค้นหา ใช้เฉพาะกรอง
            applyFilters();
        } else {
            // กรองข้อมูลด้วยข้อความค้นหาและกรองที่ใช้งานอยู่
            tableData.filteredRows = tableData.allRows.filter(function(rowData) {
                // ตรวจสอบว่าแถวนี้ตรงกับกรองหรือไม่
                if (!rowMatchesFilters(rowData)) {
                    return false;
                }
                
                // ตรวจสอบว่าแถวนี้มีข้อความที่ค้นหาหรือไม่
                for (var i = 0; i < rowData.length; i++) {
                    if (rowData[i].toLowerCase().includes(searchText)) {
                        return true;
                    }
                }
                return false;
            });
            
            tableData.totalRows = tableData.filteredRows.length;
            tableData.currentPage = 1;
            updatePaginationInfo();
            renderCurrentPage();
        }
    }
    
    // ใช้กรองกับข้อมูล
    function applyFilters() {
        if (Object.keys(tableData.activeFilters).length === 0) {
            // ถ้าไม่มีกรอง ใช้ข้อมูลทั้งหมด
            tableData.filteredRows = tableData.allRows.slice();
        } else {
            // กรองข้อมูล
            tableData.filteredRows = tableData.allRows.filter(rowMatchesFilters);
        }
        
        tableData.totalRows = tableData.filteredRows.length;
        tableData.currentPage = 1;
        updatePaginationInfo();
        renderCurrentPage();
    }
    
    // ตรวจสอบว่าแถวตรงกับกรองหรือไม่
    function rowMatchesFilters(rowData) {
        for (var columnIndex in tableData.activeFilters) {
            var filter = tableData.activeFilters[columnIndex];
            var cellValue = rowData[columnIndex] || '';
            var filterValue = filter.value;
            
            // ตรวจสอบตามประเภทของกรอง
            switch (filter.operator) {
                case 'contains':
                    if (!cellValue.toLowerCase().includes(filterValue.toLowerCase())) {
                        return false;
                    }
                    break;
                case 'equals':
                    if (cellValue.toLowerCase() !== filterValue.toLowerCase()) {
                        return false;
                    }
                    break;
                case 'starts':
                    if (!cellValue.toLowerCase().startsWith(filterValue.toLowerCase())) {
                        return false;
                    }
                    break;
                case 'ends':
                    if (!cellValue.toLowerCase().endsWith(filterValue.toLowerCase())) {
                        return false;
                    }
                    break;
                case 'greater':
                    var numCell = parseFloat(cellValue);
                    var numFilter = parseFloat(filterValue);
                    if (isNaN(numCell) || isNaN(numFilter) || numCell <= numFilter) {
                        return false;
                    }
                    break;
                case 'less':
                    var numCell = parseFloat(cellValue);
                    var numFilter = parseFloat(filterValue);
                    if (isNaN(numCell) || isNaN(numFilter) || numCell >= numFilter) {
                        return false;
                    }
                    break;
            }
        }
        return true;
    }
    
    // แปลงรหัสตัวดำเนินการเป็นข้อความที่แสดง
    function getOperatorDisplayText(operator) {
        switch (operator) {
            case 'contains': return 'contains';
            case 'equals': return 'equals';
            case 'starts': return 'starts with';
            case 'ends': return 'ends with';
            case 'greater': return 'is greater than';
            case 'less': return 'is less than';
            default: return operator;
        }
    }
    
    // นำไปยังหน้าที่ระบุ
    function navigateToPage(page) {
        var totalPages = Math.ceil(tableData.totalRows / tableData.rowsPerPage);
        
        if (page === 'first') {
            tableData.currentPage = 1;
        } else if (page === 'last') {
            tableData.currentPage = totalPages;
        } else {
            if (page < 1) page = 1;
            if (page > totalPages) page = totalPages;
            tableData.currentPage = page;
        }
        
        updatePaginationInfo();
        renderCurrentPage();
    }
    
    // อัพเดทข้อมูลการแบ่งหน้า
    function updatePaginationInfo() {
        var totalPages = Math.max(1, Math.ceil(tableData.totalRows / tableData.rowsPerPage));
        
        // อัพเดทข้อความจำนวนแถว
        $('.ckan-preview-pagination span').first().text(tableData.totalRows + ' records');
        
        // อัพเดทช่องป้อนหมายเลขหน้า
        $('.ckan-preview-pagination input').first().val(tableData.currentPage);
        $('.ckan-preview-pagination input').last().val(totalPages);
    }
    
    // แสดงข้อมูลสำหรับหน้าปัจจุบัน
    function renderCurrentPage() {
        var table = $('.ckan-preview-table, #excel-preview-table');
        var tbody = table.find('tbody');
        
        // คำนวณแถวที่จะแสดง
        var startIndex = (tableData.currentPage - 1) * tableData.rowsPerPage;
        var endIndex = Math.min(startIndex + tableData.rowsPerPage, tableData.totalRows);
        
        // ล้างตาราง
        tbody.empty();
        
        // ไม่มีข้อมูลให้แสดง
        if (tableData.filteredRows.length === 0) {
            var colSpan = tableData.columns.length || 1;
            tbody.append('<tr><td colspan="' + colSpan + '" class="no-data">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</td></tr>');
            return;
        }
        
        // เพิ่มแถวสำหรับหน้าปัจจุบัน
        for (var i = startIndex; i < endIndex; i++) {
            var rowData = tableData.filteredRows[i];
            var rowHtml = '<tr>';
            
            for (var j = 0; j < rowData.length; j++) {
                rowHtml += '<td>' + rowData[j] + '</td>';
            }
            
            rowHtml += '</tr>';
            tbody.append(rowHtml);
        }
    }
});