/**
 * Complaint Management System
 * Version: 1.0.0
 */

jQuery(document).ready(function($) {
    'use strict';

    /**
     * Configuration
     */
    const CONFIG = {
        tableSelector: '#complaints-table',
        modalSelector: '#complaint-detail-modal',
        itemsPerPage: 10,
        dateFormat: complaintListData?.date_format || 'YYYY-MM-DD',
        timeFormat: complaintListData?.time_format || 'HH:mm',
        defaultAnimationDuration: 300,
        statusColors: complaintListData?.status_colors || {
            'pending': 'warning',
            'in-progress': 'info',
            'completed': 'success',
            'rejected': 'danger',
            'closed': 'secondary'
        },
        statusLabels: complaintListData?.status_labels || {
            'pending': 'รอดำเนินการ',
            'in-progress': 'กำลังดำเนินการ',
            'completed': 'เสร็จสิ้น',
            'rejected': 'ไม่รับพิจารณา',
            'closed': 'ปิดเรื่อง'
        }
    };

    /**
     * State Management
     */
    const state = {
        complaints: [],
        filters: {
            status: '',
            type: '',
            date: '',
            search: ''
        },
        pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0
        },
        statusCounts: {},
        selectedComplaint: null,
        isLoading: false,
        dataTable: null
    };

    /**
     * DOM Elements
     */
    const elements = {
        table: $(CONFIG.tableSelector),
        tableBody: $(`${CONFIG.tableSelector} tbody`),
        modal: $(CONFIG.modalSelector),
        modalTitle: $(`${CONFIG.modalSelector} .modal-title`),
        modalContent: $('#complaint-detail-content'),
        statusSelect: $('#update-status'),
        statusNote: $('#status-note'),
        updateBtn: $('#btn-update-status'),
        filterStatus: $('#filter-status'),
        filterType: $('#filter-type'),
        filterDate: $('#filter-date'),
        filterSearch: $('#filter-search'),
        applyFiltersBtn: $('#apply-filters'),
        refreshBtn: $('#refresh-complaints'),
        exportBtn: $('#export-complaints'),
        alert: $('#complaint-alert'),
        statusCounters: {
            pending: $('#status-pending'),
            'in-progress': $('#status-in-progress'),
            completed: $('#status-completed'),
            rejected: $('#status-rejected'),
            closed: $('#status-closed'),
            total: $('#status-total')
        },
        paginationInfo: $('.pagination-info'),
        complaintsCount: $('.complaints-count')
    };

    /**
     * Initialize the application
     */
    function init() {
        // ตรวจสอบว่ามีการตั้งค่า AJAX หรือไม่
        if (!complaintListData || !complaintListData.ajaxurl) {
            showAlert('ไม่พบการตั้งค่า AJAX ที่จำเป็น โปรดรีเฟรชหน้าเว็บ', 'danger');
            return;
        }

        // สร้าง DataTable
        initDataTable();

        // ติดตั้งตัวจัดการเหตุการณ์
        setupEventListeners();

        // โหลดข้อมูลเริ่มต้น
        loadComplaints();
    }

    /**
     * Initialize DataTable
     */
    function initDataTable() {
        // ทำลาย DataTable ที่มีอยู่เดิม (ถ้ามี)
        if (state.dataTable !== null) {
            state.dataTable.destroy();
            state.dataTable = null;
        }

        // สร้าง DataTable ใหม่
        state.dataTable = elements.table.DataTable({
            searching: false,
            ordering: true,
            info: false,
            paging: false,
            autoWidth: false,
            language: {
                emptyTable: 'ไม่พบเรื่องร้องเรียน',
                loadingRecords: 'กำลังโหลดข้อมูล...',
                zeroRecords: 'ไม่พบเรื่องร้องเรียนที่ตรงกับเงื่อนไข'
            },
            columns: [
                { data: 'ref' },               // เลขที่
                { data: 'date', width: '12%' }, // วันที่รับเรื่อง
                { data: 'type' },              // ประเภท
                { data: 'department' },        // หน่วยงาน
                { data: 'complainant' },       // ผู้ร้องเรียน
                { data: 'status', width: '10%' }, // สถานะ
                { data: 'due_date', width: '10%' }, // กำหนดตอบ
                { data: 'actions', width: '100px', orderable: false } // จัดการ
            ],
            columnDefs: [
                {
                    targets: 1,
                    render: function(data) {
                        return formatDate(data);
                    }
                },
                {
                    targets: 5,
                    render: function(data) {
                        const color = CONFIG.statusColors[data] || 'primary';
                        const label = CONFIG.statusLabels[data] || data;
                        return `<span class="badge bg-${color}">${label}</span>`;
                    }
                },
                {
                    targets: 6,
                    render: function(data, type, row) {
                        if (!data) return 'ไม่กำหนด';
                        
                        const dueDate = new Date(data);
                        const today = new Date();
                        const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                        
                        let dueDateHtml = formatDateShort(data);
                        
                        if (row.status === 'pending') {
                            if (diffDays < 0) {
                                dueDateHtml += ' <span class="badge bg-danger">เลยกำหนด</span>';
                            } else if (diffDays <= 7) {
                                dueDateHtml += ' <span class="badge bg-warning text-dark">ใกล้ถึงกำหนด</span>';
                            }
                        }
                        
                        return dueDateHtml;
                    }
                },
                {
                    targets: 7,
                    render: function(data, type, row) {
                        return `
                            <div class="d-flex">
                                <button class="btn btn-sm btn-primary view-complaint me-1" data-id="${row.id}" title="ดูรายละเอียด">
                                    <i class="fas fa-eye"></i>
                                </button>
                                ${complaintListData.current_user.can_delete ? `
                                <button class="btn btn-sm btn-danger delete-complaint" data-id="${row.id}" title="ลบ">
                                    <i class="fas fa-trash"></i>
                                </button>
                                ` : ''}
                            </div>
                        `;
                    }
                }
            ],
            order: [[1, 'desc']] // เรียงตามวันที่รับเรื่อง (ล่าสุดก่อน)
        });
    }

    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // ปุ่มดูรายละเอียด
        elements.tableBody.on('click', '.view-complaint', function() {
            const id = $(this).data('id');
            viewComplaintDetails(id);
        });

        // ปุ่มลบเรื่องร้องเรียน
        elements.tableBody.on('click', '.delete-complaint', function() {
            const id = $(this).data('id');
            const ref = $(this).closest('tr').find('td:first').text();
            deleteComplaint(id, ref);
        });

        // ปุ่มอัพเดตสถานะ
        elements.updateBtn.on('click', function() {
            updateComplaintStatus();
        });

        // ปุ่มใช้ตัวกรอง
        elements.applyFiltersBtn.on('click', function() {
            applyFilters();
        });

        // ปุ่มรีเฟรช
        elements.refreshBtn.on('click', function() {
            resetFilters();
            loadComplaints();
        });

        // ปุ่มส่งออกข้อมูล
        elements.exportBtn.on('click', function() {
            exportComplaints();
        });

        // การกดปุ่ม Enter ในช่องค้นหา
        elements.filterSearch.on('keypress', function(e) {
            if (e.which === 13) {
                applyFilters();
                e.preventDefault();
            }
        });

        // Modal events
        elements.modal.on('hidden.bs.modal', function() {
            elements.statusNote.val('');
            state.selectedComplaint = null;
        });
    }

    /**
     * Load complaints from the server
     */
    function loadComplaints() {
        state.isLoading = true;
        showLoading();

        $.ajax({
            url: complaintListData.ajaxurl,
            type: 'POST',
            data: {
                action: 'complaint_list_get_complaints',
                nonce: complaintListData.nonce,
                page: state.pagination.currentPage,
                per_page: CONFIG.itemsPerPage,
                status: state.filters.status,
                type: state.filters.type,
                date: state.filters.date,
                search: state.filters.search
            },
            success: function(response) {
                if (response.success) {
                    // อัพเดต state
                    state.complaints = response.data.complaints;
                    state.pagination.totalPages = response.data.pages;
                    state.pagination.totalItems = response.data.total;
                    state.statusCounts = response.data.status_counts;

                    // อัพเดต UI
                    updateTable();
                    updateStatusCounts();
                    updatePagination();
                } else {
                    showAlert(response.data.message || complaintListData.messages.error, 'danger');
                }
            },
            error: function() {
                showAlert(complaintListData.messages.error, 'danger');
            },
            complete: function() {
                state.isLoading = false;
                hideLoading();
            }
        });
    }

    /**
     * Update the complaints table
     */
    function updateTable() {
        // ล้างข้อมูลในตาราง
        state.dataTable.clear();

        // เพิ่มข้อมูลใหม่
        if (state.complaints.length > 0) {
            state.dataTable.rows.add(state.complaints);
        }

        // อัพเดตตาราง
        state.dataTable.draw();

        // อัพเดตสถานะการแสดงผล
        if (state.complaints.length === 0) {
            elements.complaintsCount.text('ไม่พบเรื่องร้องเรียน');
        } else {
            elements.complaintsCount.text(`แสดง ${state.complaints.length} รายการ จากทั้งหมด ${state.pagination.totalItems} รายการ`);
        }
    }

    /**
     * Update status counts in dashboard
     */
    function updateStatusCounts() {
        let total = 0;
        
        // อัพเดตจำนวนตามสถานะ
        Object.keys(state.statusCounts).forEach(status => {
            const count = state.statusCounts[status] || 0;
            elements.statusCounters[status].text(count);
            total += count;
        });
        
        // อัพเดตจำนวนทั้งหมด
        elements.statusCounters.total.text(total);
    }

    /**
     * Update pagination information
     */
    function updatePagination() {
        if (state.pagination.totalPages <= 1) {
            elements.paginationInfo.hide();
            return;
        }

        elements.paginationInfo.show();
        elements.paginationInfo.html(`
            <nav>
                <ul class="pagination justify-content-end mb-0">
                    <li class="page-item ${state.pagination.currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="${state.pagination.currentPage - 1}">
                            <i class="fas fa-chevron-left"></i>
                        </a>
                    </li>
                    ${generatePaginationLinks()}
                    <li class="page-item ${state.pagination.currentPage === state.pagination.totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="${state.pagination.currentPage + 1}">
                            <i class="fas fa-chevron-right"></i>
                        </a>
                    </li>
                </ul>
            </nav>
        `);

        // เพิ่ม event listener สำหรับการคลิกที่ปุ่มหน้า
        $('.pagination .page-link').on('click', function(e) {
            e.preventDefault();
            const page = parseInt($(this).data('page'));
            if (page > 0 && page <= state.pagination.totalPages) {
                state.pagination.currentPage = page;
                loadComplaints();
            }
        });
    }

    /**
     * Generate pagination links
     */
    function generatePaginationLinks() {
        const currentPage = state.pagination.currentPage;
        const totalPages = state.pagination.totalPages;
        let links = '';
        
        // กำหนดจำนวนหน้าที่จะแสดง
        const maxLinks = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxLinks / 2));
        let endPage = Math.min(totalPages, startPage + maxLinks - 1);
        
        // ปรับ startPage ถ้า endPage เกินขอบเขต
        if (endPage - startPage + 1 < maxLinks) {
            startPage = Math.max(1, endPage - maxLinks + 1);
        }
        
        // สร้างลิงก์สำหรับหน้าแรก (ถ้าจำเป็น)
        if (startPage > 1) {
            links += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="1">1</a>
                </li>
            `;
            
            if (startPage > 2) {
                links += `
                    <li class="page-item disabled">
                        <span class="page-link">...</span>
                    </li>
                `;
            }
        }
        
        // สร้างลิงก์สำหรับหน้าในช่วง
        for (let i = startPage; i <= endPage; i++) {
            links += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }
        
        // สร้างลิงก์สำหรับหน้าสุดท้าย (ถ้าจำเป็น)
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                links += `
                    <li class="page-item disabled">
                        <span class="page-link">...</span>
                    </li>
                `;
            }
            
            links += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>
                </li>
            `;
        }
        
        return links;
    }

    /**
     * View complaint details
     */
    function viewComplaintDetails(id) {
        showModalLoading();
        
        $.ajax({
            url: complaintListData.ajaxurl,
            type: 'POST',
            data: {
                action: 'complaint_list_get_details',
                nonce: complaintListData.nonce,
                id: id
            },
            success: function(response) {
                if (response.success) {
                    // อัพเดต state
                    state.selectedComplaint = response.data.complaint;
                    
                    // อัพเดต UI
                    elements.modalTitle.text(`รายละเอียดเรื่องร้องเรียน - เลขที่ ${state.selectedComplaint.ref}`);
                    elements.modalContent.html(response.data.html);
                    elements.statusSelect.val(state.selectedComplaint.status);
                    
                    // แสดง modal
                    const modal = new bootstrap.Modal(elements.modal[0]);
                    modal.show();
                } else {
                    showAlert(response.data.message || complaintListData.messages.error, 'danger');
                }
            },
            error: function() {
                showAlert(complaintListData.messages.error, 'danger');
            },
            complete: function() {
                hideModalLoading();
            }
        });
    }

    /**
     * Update complaint status
     */
    function updateComplaintStatus() {
        // ตรวจสอบว่ามีการเลือกเรื่องร้องเรียนหรือไม่
        if (!state.selectedComplaint) {
            return;
        }
        
        // ดึงค่าสถานะใหม่และบันทึกเพิ่มเติม
        const newStatus = elements.statusSelect.val();
        const note = elements.statusNote.val();
        
        // ตรวจสอบว่าสถานะมีการเปลี่ยนแปลงหรือไม่
        if (newStatus === state.selectedComplaint.status && !note) {
            showAlert('ไม่มีการเปลี่ยนแปลงข้อมูล', 'warning');
            return;
        }
        
        // แสดงการยืนยัน
        if (newStatus !== state.selectedComplaint.status) {
            if (!confirm(complaintListData.messages.confirm_status_change.replace('{status}', CONFIG.statusLabels[newStatus] || newStatus))) {
                return;
            }
        }
        
        // แสดงสถานะกำลังโหลด
        elements.updateBtn.prop('disabled', true);
        elements.updateBtn.html('<i class="fas fa-circle-notch fa-spin me-2"></i>กำลังบันทึก...');
        
        $.ajax({
            url: complaintListData.ajaxurl,
            type: 'POST',
            data: {
                action: 'complaint_list_update_status',
                nonce: complaintListData.nonce,
                id: state.selectedComplaint.id,
                status: newStatus,
                note: note
            },
            success: function(response) {
                if (response.success) {
                    // แสดงข้อความสำเร็จ
                    showAlert(response.data.message || complaintListData.messages.success, 'success');
                    
                    // อัพเดตข้อมูลในตาราง
                    const rowIndex = state.complaints.findIndex(c => c.id === state.selectedComplaint.id);
                    if (rowIndex !== -1) {
                        state.complaints[rowIndex].status = newStatus;
                        updateTable();
                    }
                    
                    // ปิด modal
                    const modal = bootstrap.Modal.getInstance(elements.modal[0]);
                    modal.hide();
                    
                    // โหลดข้อมูลใหม่
                    loadComplaints();
                } else {
                    showAlert(response.data.message || complaintListData.messages.error, 'danger');
                }
            },
            error: function() {
                showAlert(complaintListData.messages.error, 'danger');
            },
            complete: function() {
                elements.updateBtn.prop('disabled', false);
                elements.updateBtn.html('<i class="fas fa-save me-2"></i>บันทึกสถานะ');
            }
        });
    }

    /**
     * Delete complaint
     */
    function deleteComplaint(id, ref) {
        // ยืนยันการลบ
        if (!confirm(`คุณต้องการลบเรื่องร้องเรียนเลขที่ ${ref} ใช่หรือไม่?`)) {
            return;
        }
        
        $.ajax({
            url: complaintListData.ajaxurl,
            type: 'POST',
            data: {
                action: 'complaint_list_delete',
                nonce: complaintListData.nonce,
                id: id
            },
            success: function(response) {
                if (response.success) {
                    showAlert(response.data.message || 'ลบเรื่องร้องเรียนเรียบร้อยแล้ว', 'success');
                    loadComplaints();
                } else {
                    showAlert(response.data.message || complaintListData.messages.error, 'danger');
                }
            },
            error: function() {
                showAlert(complaintListData.messages.error, 'danger');
            }
        });
    }

    /**
     * Export complaints data
     */
    function exportComplaints() {
        // แสดงสถานะกำลังโหลด
        elements.exportBtn.prop('disabled', true);
        elements.exportBtn.html('<i class="fas fa-circle-notch fa-spin me-2"></i>กำลังส่งออก...');
        
        $.ajax({
            url: complaintListData.ajaxurl,
            type: 'POST',
            data: {
                action: 'complaint_list_export_data',
                nonce: complaintListData.nonce,
                status: state.filters.status,
                type: state.filters.type,
                date: state.filters.date
            },
            success: function(response) {
                if (response.success) {
                    // ดาวน์โหลดไฟล์ CSV
                    const blob = new Blob(["\ufeff", response.data.csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    
                    link.href = url;
                    link.setAttribute('download', response.data.filename);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    showAlert(`ส่งออกข้อมูลเรียบร้อยแล้ว (${response.data.count} รายการ)`, 'success');
                } else {
                    showAlert(response.data.message || complaintListData.messages.error, 'danger');
                }
            },
            error: function() {
                showAlert(complaintListData.messages.error, 'danger');
            },
            complete: function() {
                elements.exportBtn.prop('disabled', false);
                elements.exportBtn.html('<i class="fas fa-file-export me-2"></i>ส่งออกข้อมูล');
            }
        });
    }

    /**
     * Apply filters
     */
    function applyFilters() {
        // อัพเดตตัวกรอง
        state.filters.status = elements.filterStatus.val();
        state.filters.type = elements.filterType.val();
        state.filters.date = elements.filterDate.val();
        state.filters.search = elements.filterSearch.val();
        
        // รีเซ็ตหน้าปัจจุบัน
        state.pagination.currentPage = 1;
        
        // โหลดข้อมูลใหม่
        loadComplaints();
    }

    /**
     * Reset filters
     */
    function resetFilters() {
        // รีเซ็ตค่าในฟอร์ม
        elements.filterStatus.val('');
        elements.filterType.val('');
        elements.filterDate.val('');
        elements.filterSearch.val('');
        
        // รีเซ็ตตัวกรอง
        state.filters.status = '';
        state.filters.type = '';
        state.filters.date = '';
        state.filters.search = '';
        
        // รีเซ็ตหน้าปัจจุบัน
        state.pagination.currentPage = 1;
    }

    /**
     * Show alert message
     */
    function showAlert(message, type = 'info') {
        elements.alert.removeClass('d-none alert-info alert-success alert-warning alert-danger');
        elements.alert.addClass(`alert-${type}`);
        elements.alert.html(message);
        elements.alert.slideDown(CONFIG.defaultAnimationDuration);
        
        // ซ่อนข้อความแจ้งเตือนหลังจาก 5 วินาที (ยกเว้นเป็นข้อผิดพลาด)
        if (type !== 'danger') {
            setTimeout(function() {
                elements.alert.slideUp(CONFIG.defaultAnimationDuration, function() {
                    elements.alert.addClass('d-none');
                });
            }, 5000);
        }
    }

    /**
     * Show loading state
     */
    function showLoading() {
        // แสดงสถานะกำลังโหลดในตาราง
        elements.tableBody.html('<tr><td colspan="8" class="text-center py-4"><i class="fas fa-circle-notch fa-spin me-2"></i>กำลังโหลดข้อมูล...</td></tr>');
        
        // ปิดปุ่มต่างๆ
        elements.applyFiltersBtn.prop('disabled', true);
        elements.refreshBtn.prop('disabled', true);
        elements.exportBtn.prop('disabled', true);
    }

    /**
     * Hide loading state
     */
    function hideLoading() {
        // เปิดปุ่มต่างๆ
        elements.applyFiltersBtn.prop('disabled', false);
        elements.refreshBtn.prop('disabled', false);
        elements.exportBtn.prop('disabled', false);
    }

    /**
     * Show modal loading
     */
    function showModalLoading() {
        elements.modalContent.html('<div class="text-center py-5"><i class="fas fa-circle-notch fa-spin fa-2x mb-3"></i><p>กำลังโหลดข้อมูล...</p></div>');
    }

    /**
     * Hide modal loading
     */
    function hideModalLoading() {
        // ไม่ต้องทำอะไร เพราะเนื้อหาจะถูกแทนที่โดยข้อมูลจริง
    }

    /**
     * Format date
     */
    function formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Format date (short)
     */
    function formatDateShort(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // เริ่มต้นแอปพลิเคชัน
    init();
});