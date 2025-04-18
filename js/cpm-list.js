// complaint-management/assets/js/cpm-list.js

jQuery(document).ready(function($) {
    // Check if required elements and variables exist
    const complaintListTable = $('#complaint-list-table');
    if (!complaintListTable.length) {
        console.error('Complaint list table not found');
        return;
    }

    // Verify AJAX variables are defined
    if (typeof complaintListAjax === 'undefined' || !complaintListAjax.ajaxurl || !complaintListAjax.nonce) {
        console.error('Required AJAX variables not found:', {
            ajaxDefined: typeof complaintListAjax !== 'undefined',
            hasUrl: complaintListAjax?.ajaxurl !== undefined,
            hasNonce: complaintListAjax?.nonce !== undefined
        });
        return;
    }

    let complaintTable;
    
    // Alert function
    function showAlert(type, message, duration = 5000) {
        const alertContainer = $('.alert-container');
        const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
        const alert = $(`
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);
        
        alertContainer.append(alert);
        
        setTimeout(() => {
            alert.alert('close');
        }, duration);
    }

    // Initialize DataTable with error handling
    function initializeDataTable() {
        try {
            complaintTable = complaintListTable.DataTable({
                processing: true,
                serverSide: false,
                order: [[1, 'desc']],
                language: {
                    url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/th.json'
                },
                columns: [
                    { data: 'ref' },
                    { data: 'date' },
                    { data: 'type' },
                    { data: 'department' },
                    { 
                        data: 'complainant',
                        render: function(data, type, row) {
                            return row.is_anonymous ? 'ไม่ประสงค์ออกนาม' : data;
                        }
                    },
                    { 
                        data: 'status',
                        render: function(data, type, row) {
                            const statusClasses = {
                                'pending': 'bg-warning',
                                'in-progress': 'bg-info',
                                'completed': 'bg-success',
                                'rejected': 'bg-danger',
                                'closed': 'bg-secondary'
                            };
                            return `<span class="badge ${statusClasses[data] || 'bg-secondary'}">${row.status_label || data}</span>`;
                        }
                    },
                    {
                        data: null,
                        orderable: false,
                        render: function(data, type, row) {
                            return `
                                <div class="btn-group">
                                    <button class="btn btn-sm btn-primary view-complaint" data-id="${row.id}">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            `;
                        }
                    }
                ]
            });
        } catch (error) {
            console.error('Error initializing DataTable:', error);
            showAlert('error', 'เกิดข้อผิดพลาดในการโหลดตาราง');
        }
    }

    // Load complaints data with error handling
    function loadComplaints() {
        const status = $('#status-filter').val();
        const type = $('#type-filter').val();

        $.ajax({
            url: complaintListAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'get_complaints_list',
                nonce: complaintListAjax.nonce,
                status: status,
                type: type
            },
            success: function(response) {
                if (response.success && response.data) {
                    updateStatusSummary(response.data.status_counts);
                    
                    if (complaintTable) {
                        complaintTable.clear();
                        complaintTable.rows.add(response.data.complaints);
                        complaintTable.draw();
                    } else {
                        initializeDataTable();
                    }
                } else {
                    showAlert('error', response.data?.message || complaintListAjax.messages.error);
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX Error:', status, error);
                showAlert('error', complaintListAjax.messages.error);
            }
        });
    }

    // Update status summary
    function updateStatusSummary(counts) {
        if (!counts) return;

        const statusCards = {
            pending: {
                label: 'รอดำเนินการ',
                icon: 'hourglass-start',
                class: 'bg-warning'
            },
            'in-progress': {
                label: 'กำลังดำเนินการ',
                icon: 'clock',
                class: 'bg-info'
            },
            completed: {
                label: 'เสร็จสิ้น',
                icon: 'check-circle',
                class: 'bg-success'
            },
            rejected: {
                label: 'ไม่รับพิจารณา',
                icon: 'times-circle',
                class: 'bg-danger'
            },
            closed: {
                label: 'ปิดเรื่อง',
                icon: 'archive',
                class: 'bg-secondary'
            }
        };

        const summaryContainer = $('#status-summary-cards');
        if (!summaryContainer.length) return;

        let cardsHtml = '';
        for (const [status, count] of Object.entries(counts)) {
            const card = statusCards[status];
            if (!card) continue;

            cardsHtml += `
                <div class="col">
                    <div class="card ${card.class} text-white h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="card-title mb-0">${card.label}</h6>
                                    <h2 class="mt-2 mb-0">${count}</h2>
                                </div>
                                <div class="card-icon">
                                    <i class="fas fa-${card.icon}"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        summaryContainer.html(cardsHtml);
    }

    // Event Handlers
    $('#apply-filters').on('click', function() {
        loadComplaints();
    });

    // View complaint details
    complaintListTable.on('click', '.view-complaint', function() {
        const complaintId = $(this).data('id');
        
        $.ajax({
            url: complaintListAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'get_complaint_details',
                nonce: complaintListAjax.nonce,
                id: complaintId
            },
            success: function(response) {
                if (response.success && response.data.complaint) {
                    showComplaintDetails(response.data.complaint);
                } else {
                    showAlert('error', response.data?.message || complaintListAjax.messages.error);
                }
            },
            error: function() {
                showAlert('error', complaintListAjax.messages.error);
            }
        });
    });

    // Show complaint details in modal
    function showComplaintDetails(complaint) {
        const modal = $('#complaint-modal');
        const detailsContainer = $('#complaint-details');
        
        if (!modal.length || !detailsContainer.length) {
            console.error('Modal elements not found');
            return;
        }

        let detailsHtml = `
            <div class="row g-3">
                <div class="col-md-6">
                    <p><strong>เลขที่:</strong> ${complaint.ref}</p>
                    <p><strong>วันที่:</strong> ${complaint.date}</p>
                    <p><strong>ประเภท:</strong> ${complaint.type}</p>
                    <p><strong>หน่วยงาน:</strong> ${complaint.department}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>สถานะ:</strong> ${complaint.status_label}</p>
                    ${!complaint.is_anonymous ? `
                        <p><strong>ชื่อผู้ร้องเรียน:</strong> ${complaint.complainant.name}</p>
                        <p><strong>ที่อยู่:</strong> ${complaint.complainant.address || '-'}</p>
                        <p><strong>เบอร์โทร:</strong> ${complaint.complainant.phone || '-'}</p>
                        <p><strong>อีเมล:</strong> ${complaint.complainant.email || '-'}</p>
                    ` : '<p><strong>ผู้ร้องเรียน:</strong> ไม่ประสงค์ออกนาม</p>'}
                </div>
                <div class="col-12">
                    <h6>รายละเอียด:</h6>
                    <div class="p-3 bg-light rounded">${complaint.details}</div>
                </div>
            </div>
        `;

        detailsContainer.html(detailsHtml);
        $('#complaint-status').val(complaint.status);
        
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    }

    // Update complaint status
    $('#update-status').on('click', function() {
        const complaintId = $('#complaint-modal').data('complaint-id');
        const newStatus = $('#complaint-status').val();
        
        $.ajax({
            url: complaintListAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'update_complaint_status',
                nonce: complaintListAjax.nonce,
                id: complaintId,
                status: newStatus
            },
            success: function(response) {
                if (response.success) {
                    showAlert('success', response.data.message);
                    $('#complaint-modal').modal('hide');
                    loadComplaints();
                } else {
                    showAlert('error', response.data?.message || complaintListAjax.messages.error);
                }
            },
            error: function() {
                showAlert('error', complaintListAjax.messages.error);
            }
        });
    });

    // Initial load
    loadComplaints();
});