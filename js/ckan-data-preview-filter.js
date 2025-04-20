/**
 * CKAN Data Preview Filter JavaScript
 * เพิ่มความสามารถในการกรองข้อมูลและการค้นหาสำหรับตารางไฟล์ในตัวอย่าง
 */
jQuery(document).ready(($) => {
    // ตัวแปรสำหรับการจัดการข้อมูล
    const tableData = {
        allRows: [],           // เก็บข้อมูลทั้งหมด
        filteredRows: [],      // เก็บข้อมูลหลังกรอง
        columns: [],           // เก็บชื่อคอลัมน์
        currentPage: 1,        // หน้าปัจจุบัน
        rowsPerPage: 30,       // จำนวนแถวต่อหน้า
        totalRows: 0,          // จำนวนแถวทั้งหมด
        activeFilters: {}      // กรองที่ใช้งานอยู่
    };
    
    // ติดตั้ง event handlers หลังจากโหลด preview
    $(document).on('ckan_preview_loaded', () => {
        initializeDataTable();
        setupEventHandlers();
    });
    
    // ฟังก์ชั่นเริ่มต้นสำหรับจัดการข้อมูลตาราง
    const initializeDataTable = () => {
        // รับข้อมูลจากตาราง
        extractTableData();
        
        // ตั้งค่าการแสดงผลเริ่มต้น
        tableData.filteredRows = tableData.allRows.slice();
        tableData.totalRows = tableData.filteredRows.length;
        updatePaginationInfo();
        
        // เริ่มต้นแสดงหน้าแรก
        renderCurrentPage();
    };
    
    // ดึงข้อมูลจากตารางที่แสดงอยู่
    const extractTableData = () => {
        const table = $('.ckan-preview-table, #excel-preview-table');
        tableData.allRows = [];
        tableData.columns = [];
        
        // ดึงข้อมูลหัวตาราง (columns)
        table.find('thead th').each(function() {
            tableData.columns.push($(this).text().trim());
        });
        
        // ดึงข้อมูลแถว (rows)
        table.find('tbody tr').each(function() {
            const rowData = [];
            $(this).find('td').each(function() {
                rowData.push($(this).text().trim());
            });
            tableData.allRows.push(rowData);
        });
        
        // สำรองข้อมูลตารางต้นฉบับ
        if (!table.data('originalTable')) {
            table.data('originalTable', table.find('tbody').html());
        }
    };
    
    // ตั้งค่า event handlers สำหรับปุ่มและการควบคุมต่างๆ
    const setupEventHandlers = () => {
        // ปุ่มค้นหา
        $('.ckan-preview-search button:not(.filters-btn)').on('click', () => {
            searchTable();
        });
        
        // ค้นหาเมื่อกด Enter
        $('.ckan-preview-search input').on('keypress', (e) => {
            if (e.which === 13) {
                searchTable();
            }
        });
        
        // ปุ่ม Add Filter
        $('.ckan-preview-filter-btn').on('click', () => {
            showFilterDialog();
        });
        
        // ปุ่ม Filters
        $('.ckan-preview-search .filters-btn').on('click', () => {
            showFilterDialog();
        });
        
        // ปุ่มเปลี่ยนหน้า
        $('.ckan-preview-pagination span:contains("«")').on('click', () => {
            navigateToPage('first');
        });
        
        $('.ckan-preview-pagination span:contains("»")').on('click', () => {
            navigateToPage('last');
        });
        
        // อัพเดทเมื่อใส่หมายเลขหน้าโดยตรง
        $('.ckan-preview-pagination input').on('change', function() {
            const inputPage = parseInt($(this).val());
            if (!isNaN(inputPage)) {
                navigateToPage(inputPage);
            }
        });
    };
    
    // แสดงหน้าต่างสำหรับตั้งค่ากรอง
    const showFilterDialog = () => {
        // ถ้ามีหน้าต่างอยู่แล้ว ให้ลบทิ้งก่อน
        $('.ckan-filter-dialog').remove();
        
        // สร้างหน้าต่างสำหรับกรอง
        let dialogHtml = '<div class="ckan-filter-dialog">';
        dialogHtml += '<div class="ckan-filter-dialog-content">';
        dialogHtml += '<span class="ckan-filter-dialog-close">&times;</span>';
        dialogHtml += '<h3>Add Filter</h3>';
        
        // สร้าง filter options สำหรับแต่ละคอลัมน์
        dialogHtml += '<div class="ckan-filter-options">';
        tableData.columns.forEach((column, index) => {
            dialogHtml += `<div class="ckan-filter-option">
                <div class="filter-column-name">${column}</div>
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
        dialogHtml += '</div>';
        
        // แสดงกรองที่ใช้งานอยู่
        dialogHtml += '<div class="active-filters-container">';
        dialogHtml += '<h4>Active Filters</h4>';
        dialogHtml += '<div class="active-filters-list"></div>';
        dialogHtml += `<button class="clear-all-filters" ${Object.keys(tableData.activeFilters).length === 0 ? 'disabled' : ''}>Clear All Filters</button>`;
        dialogHtml += '</div>';
        
        dialogHtml += '</div>'; // End filter dialog content
        dialogHtml += '</div>'; // End filter dialog
        
        // เพิ่มหน้าต่างไปยัง DOM
        $('.ckan-preview-modal-body').append(dialogHtml);
        
        // แสดงกรองที่ใช้งานอยู่
        updateActiveFiltersList();
        
        // ตั้งค่า event handlers สำหรับหน้าต่างกรอง
        setupFilterDialogHandlers();
    };
    
    // ตั้งค่า event handlers สำหรับหน้าต่างกรอง
    const setupFilterDialogHandlers = () => {
        // ปิดหน้าต่างกรอง
        $('.ckan-filter-dialog-close').on('click', () => {
            $('.ckan-filter-dialog').remove();
        });
        
        // คลิกนอกหน้าต่างกรองเพื่อปิด
        $(document).on('click', (e) => {
            if ($(e.target).is('.ckan-filter-dialog')) {
                $('.ckan-filter-dialog').remove();
            }
        });
        
        // ปุ่ม Apply filter
        $('.apply-filter').on('click', function() {
            const columnIndex = $(this).data('column');
            const operator = $(`.filter-operator[data-column="${columnIndex}"]`).val();
            const value = $(`.filter-value[data-column="${columnIndex}"]`).val().trim();
            
            if (value !== '') {
                // เพิ่มกรอง
                tableData.activeFilters[columnIndex] = {
                    operator,
                    value
                };
                
                // ใช้กรองและแสดงผล
                applyFilters();
                updateActiveFiltersList();
                
                // ปิดหน้าต่างกรอง
                $('.ckan-filter-dialog').remove();
            }
        });
        
        // ปุ่ม Clear All Filters
        $('.clear-all-filters').on('click', () => {
            tableData.activeFilters = {};
            applyFilters();
            updateActiveFiltersList();
            
            // ปิดหน้าต่างกรอง
            $('.ckan-filter-dialog').remove();
        });
    };
    
    // อัพเดทรายการกรองที่ใช้งานอยู่
    const updateActiveFiltersList = () => {
        const filtersList = $('.active-filters-list');
        filtersList.empty();
        
        // แสดงรายการกรองที่ใช้งานอยู่
        $.each(tableData.activeFilters, (columnIndex, filter) => {
            const columnName = tableData.columns[columnIndex];
            const operatorText = getOperatorDisplayText(filter.operator);
            
            const filterHtml = `<div class="active-filter">
                <span class="filter-desc">${columnName} ${operatorText} "${filter.value}"</span>
                <button class="remove-filter" data-column="${columnIndex}">×</button>
            </div>`;
            
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
            const columnIndex = $(this).data('column');
            delete tableData.activeFilters[columnIndex];
            applyFilters();
            updateActiveFiltersList();
        });
    };
    
    // ค้นหาข้อมูลในตาราง
    const searchTable = () => {
        const searchText = $('.ckan-preview-search input').val().trim().toLowerCase();
        
        if (searchText === '') {
            // ถ้าไม่มีข้อความค้นหา ใช้เฉพาะกรอง
            applyFilters();
        } else {
            // กรองข้อมูลด้วยข้อความค้นหาและกรองที่ใช้งานอยู่
            tableData.filteredRows = tableData.allRows.filter((rowData) => {
                // ตรวจสอบว่าแถวนี้ตรงกับกรองหรือไม่
                if (!rowMatchesFilters(rowData)) {
                    return false;
                }
                
                // ตรวจสอบว่าแถวนี้มีข้อความที่ค้นหาหรือไม่
                for (let i = 0; i < rowData.length; i++) {
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
    };
    
    // ใช้กรองกับข้อมูล
    const applyFilters = () => {
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
    };
    
    // ตรวจสอบว่าแถวตรงกับกรองหรือไม่
    const rowMatchesFilters = (rowData) => {
        for (const columnIndex in tableData.activeFilters) {
            const filter = tableData.activeFilters[columnIndex];
            const cellValue = rowData[columnIndex] || '';
            const filterValue = filter.value;
            
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
                    const numCellGreater = parseFloat(cellValue);
                    const numFilterGreater = parseFloat(filterValue);
                    if (isNaN(numCellGreater) || isNaN(numFilterGreater) || numCellGreater <= numFilterGreater) {
                        return false;
                    }
                    break;
                case 'less':
                    const numCellLess = parseFloat(cellValue);
                    const numFilterLess = parseFloat(filterValue);
                    if (isNaN(numCellLess) || isNaN(numFilterLess) || numCellLess >= numFilterLess) {
                        return false;
                    }
                    break;
            }
        }
        return true;
    };
    
    // แปลงรหัสตัวดำเนินการเป็นข้อความที่แสดง
    const getOperatorDisplayText = (operator) => {
        switch (operator) {
            case 'contains': return 'contains';
            case 'equals': return 'equals';
            case 'starts': return 'starts with';
            case 'ends': return 'ends with';
            case 'greater': return 'is greater than';
            case 'less': return 'is less than';
            default: return operator;
        }
    };
    
    // นำไปยังหน้าที่ระบุ
    const navigateToPage = (page) => {
        const totalPages = Math.ceil(tableData.totalRows / tableData.rowsPerPage);
        
        if (page === 'first') {
            tableData.currentPage = 1;
        } else if (page === 'last') {
            tableData.currentPage = totalPages;
        } else {
            let currentPage = page;
            if (currentPage < 1) currentPage = 1;
            if (currentPage > totalPages) currentPage = totalPages;
            tableData.currentPage = currentPage;
        }
        
        updatePaginationInfo();
        renderCurrentPage();
    };
    
    // อัพเดทข้อมูลการแบ่งหน้า
    const updatePaginationInfo = () => {
        const totalPages = Math.max(1, Math.ceil(tableData.totalRows / tableData.rowsPerPage));
        
        // อัพเดทข้อความจำนวนแถว
        $('.ckan-preview-pagination span').first().text(`${tableData.totalRows} records`);
        
        // อัพเดทช่องป้อนหมายเลขหน้า
        $('.ckan-preview-pagination input').first().val(tableData.currentPage);
        $('.ckan-preview-pagination input').last().val(totalPages);
    };
    
    // แสดงข้อมูลสำหรับหน้าปัจจุบัน
    const renderCurrentPage = () => {
        const table = $('.ckan-preview-table, #excel-preview-table');
        const tbody = table.find('tbody');
        
        // คำนวณแถวที่จะแสดง
        const startIndex = (tableData.currentPage - 1) * tableData.rowsPerPage;
        const endIndex = Math.min(startIndex + tableData.rowsPerPage, tableData.totalRows);
        
        // ล้างตาราง
        tbody.empty();
        
        // ไม่มีข้อมูลให้แสดง
        if (tableData.filteredRows.length === 0) {
            const colSpan = tableData.columns.length || 1;
            tbody.append(`<tr><td colspan="${colSpan}" class="no-data">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</td></tr>`);
            return;
        }
        
        // เพิ่มแถวสำหรับหน้าปัจจุบัน
        for (let i = startIndex; i < endIndex; i++) {
            const rowData = tableData.filteredRows[i];
            let rowHtml = '<tr>';
            
            for (let j = 0; j < rowData.length; j++) {
                rowHtml += `<td>${rowData[j]}</td>`;
            }
            
            rowHtml += '</tr>';
            tbody.append(rowHtml);
        }
    };
});
