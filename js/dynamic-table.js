/**
 * Dynamic Table JavaScript - Improved Data Handling
 * File path: /js/dynamic-table.js
 */

jQuery(document).ready(function($) {
    const tableId = dynamic_table_params.table_id;
    const $tableContainer = $('#' + tableId + '-container');
    const $table = $('#' + tableId);
    const $statusMessage = $tableContainer.find('.dynamic-table-status');
    
    // Toggle raw data display for admin debugging
    $('#toggle-raw-data').on('click', function() {
        $('#raw-data').toggle();
    });
    
    // Add Column button
    $tableContainer.on('click', '.add-column-btn', function() {
        const $thead = $table.find('thead tr');
        const $tbody = $table.find('tbody tr');
        
        // Add new header
        $thead.append(`
            <th>
                <div class="column-content">
                    <input type="text" class="column-input" value="" placeholder="ชื่อคอลัมน์">
                    <span class="remove-column" data-index="${$thead.find('th').length}">×</span>
                </div>
            </th>
        `);
        
        // Add new cell to each row
        $tbody.each(function() {
            $(this).find('td.row-actions').before(`
                <td>
                    <div class="cell-content">
                        <input type="text" class="cell-input" value="" placeholder="เนื้อหา">
                        <input type="text" class="cell-link" value="" placeholder="URL ลิงก์ (ถ้ามี)">
                    </div>
                </td>
            `);
        });
        
        showMessage('เพิ่มคอลัมน์ใหม่แล้ว');
    });
    
    // Add Row button
    $tableContainer.on('click', '.add-row-btn', function() {
        const columnCount = $table.find('thead th').length;
        let cellsHtml = '';
        
        // Create cells based on column count
        for (let i = 0; i < columnCount; i++) {
            cellsHtml += `
                <td>
                    <div class="cell-content">
                        <input type="text" class="cell-input" value="" placeholder="เนื้อหา">
                        <input type="text" class="cell-link" value="" placeholder="URL ลิงก์ (ถ้ามี)">
                    </div>
                </td>
            `;
        }
        
        // Add new row
        $table.find('tbody').append(`
            <tr>
                ${cellsHtml}
                <td class="row-actions">
                    <span class="remove-row" data-index="${$table.find('tbody tr').length}">×</span>
                </td>
            </tr>
        `);
        
        showMessage('เพิ่มแถวใหม่แล้ว');
    });
    
    // Remove Column
    $tableContainer.on('click', '.remove-column', function() {
        const columnIndex = $(this).closest('th').index();
        
        // Prevent removing last column
        if ($table.find('thead th').length <= 1) {
            showMessage('ไม่สามารถลบคอลัมน์สุดท้ายได้', 'error');
            return;
        }
        
        // Remove column header
        $table.find('thead th').eq(columnIndex).remove();
        
        // Remove corresponding cell in each row
        $table.find('tbody tr').each(function() {
            $(this).find('td').eq(columnIndex).remove();
        });
        
        // Update column indexes
        updateColumnIndexes();
        
        showMessage('ลบคอลัมน์แล้ว');
    });
    
    // Remove Row
    $tableContainer.on('click', '.remove-row', function() {
        // Prevent removing last row
        if ($table.find('tbody tr').length <= 1) {
            showMessage('ไม่สามารถลบแถวสุดท้ายได้', 'error');
            return;
        }
        
        // Remove row
        $(this).closest('tr').remove();
        
        // Update row indexes
        updateRowIndexes();
        
        showMessage('ลบแถวแล้ว');
    });
    
    // Save Table button
    $tableContainer.on('click', '.save-table-btn', function() {
        const columns = [];
        const cells = [];
        const links = [];
        
        // Get column titles
        $table.find('thead th').each(function() {
            columns.push($(this).find('.column-input').val() || '');
        });
        
        // Get cell data and links
        $table.find('tbody tr').each(function(rowIndex) {
            cells[rowIndex] = [];
            links[rowIndex] = [];
            
            $(this).find('td:not(.row-actions)').each(function() {
                cells[rowIndex].push($(this).find('.cell-input').val() || '');
                links[rowIndex].push($(this).find('.cell-link').val() || '');
            });
        });
        
        // Log data being sent (for debugging)
        if ($('#raw-data').length) {
            console.log('Saving table data:', {
                columns: columns,
                cells: cells,
                links: links
            });
        }
        
        // Validate data
        if (columns.length === 0) {
            showMessage('ตารางต้องมีอย่างน้อย 1 คอลัมน์', 'error');
            return;
        }
        
        if (cells.length === 0) {
            showMessage('ตารางต้องมีอย่างน้อย 1 แถว', 'error');
            return;
        }
        
        // Send AJAX request
        $.ajax({
            url: dynamic_table_params.ajax_url,
            type: 'POST',
            data: {
                action: 'dynamic_table_save_data',
                nonce: dynamic_table_params.nonce,
                table_id: tableId,
                columns: columns,
                cells: cells,
                links: links
            },
            beforeSend: function() {
                showMessage('กำลังบันทึก...', 'info');
                $('.save-table-btn').prop('disabled', true);
            },
            success: function(response) {
                if (response.success) {
                    showMessage(response.data.message, 'success');
                    
                    // Update debug info if available
                    if ($('#raw-data').length) {
                        console.log('Save response:', response);
                        $('#raw-data').html(JSON.stringify(response.data, null, 2));
                    }
                } else {
                    showMessage(response.data.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
                    console.error('Save error:', response);
                }
            },
            error: function(xhr, status, error) {
                showMessage('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error, 'error');
                console.error('AJAX error:', status, error);
                if (xhr.responseText) {
                    console.error('Response:', xhr.responseText);
                }
            },
            complete: function() {
                $('.save-table-btn').prop('disabled', false);
            }
        });
    });
    
    // Helper functions
    function updateColumnIndexes() {
        $table.find('thead th').each(function(index) {
            $(this).find('.remove-column').attr('data-index', index);
        });
    }
    
    function updateRowIndexes() {
        $table.find('tbody tr').each(function(index) {
            $(this).find('.remove-row').attr('data-index', index);
        });
    }
    
    function showMessage(message, type = 'info') {
        $statusMessage.removeClass('info success error').addClass(type).text(message);
        
        // Auto hide success and info messages after 5 seconds
        if (type !== 'error') {
            setTimeout(function() {
                $statusMessage.text('');
            }, 5000);
        }
    }
});