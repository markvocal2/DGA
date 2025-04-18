/**
 * Complaint Statistics System
 * Version: 1.0.0
 */

jQuery(document).ready(function($) {
    'use strict';

    /**
     * Configuration
     */
    const CONFIG = {
        dateFormat: complaintStatsData?.date_format || 'DD/MM/YYYY',
        defaultAnimationDuration: 300,
        chartColors: [
            '#0d6efd', // น้ำเงิน (Primary)
            '#fd7e14', // ส้ม (Secondary)
            '#198754', // เขียว (Success)
            '#dc3545', // แดง (Danger)
            '#6c757d', // เทา (Secondary)
            '#6610f2', // ม่วง
            '#0dcaf0', // ฟ้า (Info)
            '#ffc107'  // เหลือง (Warning)
        ],
        statusColors: {
            'pending': '#ffc107',     // warning
            'in-progress': '#0dcaf0', // info
            'completed': '#198754',   // success
            'rejected': '#dc3545',    // danger
            'closed': '#6c757d'       // secondary
        },
        statusLabels: complaintStatsData?.status_labels || {
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
        statistics: null,
        isLoading: false,
        filters: {
            period: 'monthly',
            startDate: '',
            endDate: ''
        }
    };

    /**
     * DOM Elements
     */
    const elements = {
        container: $('.complaint-stats-container'),
        periodFilter: $('#period-filter'),
        startDateInput: $('#date-start'),
        endDateInput: $('#date-end'),
        applyFiltersBtn: $('#apply-stats-filters'),
        exportExcelBtn: $('#export-excel-btn'),
        trendStatusFilter: $('#trend-status-filter'),
        alert: $('#stats-alert'),
        totalComplaints: $('#total-complaints'),
        dailyAverage: $('#daily-average'),
        activeComplaints: $('#active-complaints'),
        statusStats: $('#status-stats'),
        complaintsByStatus: $('#complaints-by-status'),
        complaintsByType: $('#complaints-by-type'),
        complaintsByDepartment: $('#complaints-by-department'),
        complaintsTrend: $('#complaints-trend')
    };

    /**
     * Initialize the application
     */
    function init() {
        // ตรวจสอบว่ามีการตั้งค่า AJAX หรือไม่
        if (!complaintStatsData || !complaintStatsData.ajaxurl) {
            showAlert('ไม่พบการตั้งค่า AJAX ที่จำเป็น โปรดรีเฟรชหน้าเว็บ', 'danger');
            return;
        }

        // กำหนดค่าเริ่มต้นสำหรับตัวกรอง
        setDefaultDates();

        // ติดตั้งตัวจัดการเหตุการณ์
        setupEventListeners();

        // โหลดข้อมูลเริ่มต้น
        loadStatistics();
    }

    /**
     * Set default dates for filter
     */
    function setDefaultDates() {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        if (!elements.startDateInput.val()) {
            elements.startDateInput.val(formatDateForInput(thirtyDaysAgo));
            state.filters.startDate = formatDateForInput(thirtyDaysAgo);
        } else {
            state.filters.startDate = elements.startDateInput.val();
        }
        
        if (!elements.endDateInput.val()) {
            elements.endDateInput.val(formatDateForInput(today));
            state.filters.endDate = formatDateForInput(today);
        } else {
            state.filters.endDate = elements.endDateInput.val();
        }
    }

    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // ปุ่มใช้ตัวกรอง
        elements.applyFiltersBtn.on('click', function() {
            applyFilters();
            loadStatistics();
        });

        // ตัวกรอง period
        elements.periodFilter.on('change', function() {
            state.filters.period = $(this).val();
        });

        // ตัวกรอง date
        elements.startDateInput.on('change', function() {
            state.filters.startDate = $(this).val();
        });

        elements.endDateInput.on('change', function() {
            state.filters.endDate = $(this).val();
        });

        // ตัวกรอง trend status
        elements.trendStatusFilter.on('change', function() {
            if (state.statistics && state.statistics.trend) {
                createTrendChart(state.statistics.trend);
            }
        });

        // ปุ่มส่งออก Excel
        elements.exportExcelBtn.on('click', function() {
            exportToExcel();
        });
    }

    /**
     * Apply filters
     */
    function applyFilters() {
        state.filters.period = elements.periodFilter.val();
        state.filters.startDate = elements.startDateInput.val();
        state.filters.endDate = elements.endDateInput.val();
    }

    /**
     * Load statistics from the server
     */
    function loadStatistics() {
        state.isLoading = true;
        showLoading();

        $.ajax({
            url: complaintStatsData.ajaxurl,
            type: 'POST',
            data: {
                action: 'get_complaint_statistics',
                nonce: complaintStatsData.nonce,
                period: state.filters.period,
                start_date: state.filters.startDate,
                end_date: state.filters.endDate
            },
            success: function(response) {
                if (response.success) {
                    state.statistics = response.data;
                    updateStatisticsUI();
                } else {
                    showAlert(response.data?.message || complaintStatsData.messages.error, 'danger');
                }
            },
            error: function() {
                showAlert(complaintStatsData.messages.error, 'danger');
            },
            complete: function() {
                state.isLoading = false;
                hideLoading();
            }
        });
    }

    /**
     * Update statistics UI
     */
    function updateStatisticsUI() {
        const stats = state.statistics;
        
        if (!stats) {
            showAlert(complaintStatsData.messages.no_data, 'warning');
            return;
        }

        // อัพเดตค่าสรุป
        elements.totalComplaints.text(stats.total);
        elements.dailyAverage.text(stats.daily_average.toFixed(2));
        elements.activeComplaints.text(stats.active_complaints);
        
        // อัพเดตสถิติสถานะ
        updateStatusStats(stats.by_status);
        
        // สร้างกราฟ
        createStatusChart(stats.by_status);
        createTypeChart(stats.by_type);
        createDepartmentChart(stats.by_department);
        createTrendChart(stats.trend);
    }

    /**
     * Update status statistics
     */
    function updateStatusStats(statusData) {
        let html = '<div class="status-grid">';
        
        Object.entries(statusData).forEach(([status, count]) => {
            const statusLabel = CONFIG.statusLabels[status] || status;
            const statusClass = status;
            const percentage = state.statistics.total > 0 
                ? ((count / state.statistics.total) * 100).toFixed(1) 
                : '0.0';
            
            html += `
                <div class="status-item">
                    <div class="status-color status-${statusClass}"></div>
                    <div class="status-info">
                        <div class="status-label">${statusLabel}</div>
                        <div class="status-count">${count} <span class="text-secondary">(${percentage}%)</span></div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        elements.statusStats.html(html);
    }

    /**
     * Create status chart
     */
    function createStatusChart(statusData) {
        if (!Highcharts) {
            console.error('Highcharts is not loaded');
            return;
        }

        const chartData = [];
        
        Object.entries(statusData).forEach(([status, count]) => {
            if (count > 0) {
                chartData.push({
                    name: CONFIG.statusLabels[status] || status,
                    y: count,
                    color: CONFIG.statusColors[status]
                });
            }
        });

        Highcharts.chart('complaints-by-status', {
            chart: {
                type: 'pie',
                height: 260
            },
            title: {
                text: ''
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.y}</b> ({point.percentage:.1f}%)'
            },
            accessibility: {
                point: {
                    valueSuffix: '%'
                }
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                        distance: -30,
                        style: {
                            fontWeight: 'normal',
                            color: 'white',
                            textOutline: 'none'
                        }
                    },
                    showInLegend: false,
                    size: '100%'
                }
            },
            credits: {
                enabled: false
            },
            series: [{
                name: 'จำนวน',
                colorByPoint: true,
                innerSize: '60%',
                data: chartData
            }]
        });
    }

    /**
     * Create type chart
     */
    function createTypeChart(typeData) {
        if (!Highcharts) {
            console.error('Highcharts is not loaded');
            return;
        }

        const chartData = [];
        
        Object.entries(typeData).forEach(([type, count]) => {
            if (count > 0) {
                chartData.push({
                    name: type,
                    y: count
                });
            }
        });

        Highcharts.chart('complaints-by-type', {
            chart: {
                type: 'pie'
            },
            title: {
                text: ''
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.y}</b> ({point.percentage:.1f}%)'
            },
            accessibility: {
                point: {
                    valueSuffix: '%'
                }
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    colors: CONFIG.chartColors,
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                    }
                }
            },
            credits: {
                enabled: false
            },
            series: [{
                name: 'จำนวน',
                colorByPoint: true,
                data: chartData
            }]
        });
    }

    /**
     * Create department chart
     */
    function createDepartmentChart(departmentData) {
        if (!Highcharts) {
            console.error('Highcharts is not loaded');
            return;
        }

        const sortedData = Object.entries(departmentData)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        const categories = sortedData.map(item => item[0]);
        const data = sortedData.map(item => item[1]);

        Highcharts.chart('complaints-by-department', {
            chart: {
                type: 'bar'
            },
            title: {
                text: ''
            },
            xAxis: {
                categories: categories,
                title: {
                    text: null
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'จำนวนเรื่องร้องเรียน',
                    align: 'high'
                },
                labels: {
                    overflow: 'justify'
                }
            },
            tooltip: {
                valueSuffix: ' เรื่อง'
            },
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: true
                    },
                    colorByPoint: true,
                    colors: CONFIG.chartColors
                }
            },
            legend: {
                enabled: false
            },
            credits: {
                enabled: false
            },
            series: [{
                name: 'จำนวน',
                data: data
            }]
        });
    }

    /**
     * Create trend chart
     */
    function createTrendChart(trendData) {
        if (!Highcharts) {
            console.error('Highcharts is not loaded');
            return;
        }

        const selectedStatus = elements.trendStatusFilter.val();
        let series = [];
        
        if (selectedStatus === 'all') {
            // สร้าง series สำหรับแต่ละสถานะ
            Object.entries(trendData).forEach(([status, data]) => {
                if (data.length > 0) {
                    series.push({
                        name: CONFIG.statusLabels[status] || status,
                        data: data.map(item => item.count),
                        color: CONFIG.statusColors[status]
                    });
                }
            });
        } else {
            // สร้าง series เดียวสำหรับสถานะที่เลือก
            if (trendData[selectedStatus] && trendData[selectedStatus].length > 0) {
                series = [{
                    name: CONFIG.statusLabels[selectedStatus] || selectedStatus,
                    data: trendData[selectedStatus].map(item => item.count),
                    color: CONFIG.statusColors[selectedStatus]
                }];
            }
        }

        // ใช้ categories จากสถานะแรกที่มีข้อมูล
        let categories = [];
        for (const status in trendData) {
            if (trendData[status] && trendData[status].length > 0) {
                categories = trendData[status].map(item => item.period);
                break;
            }
        }

        Highcharts.chart('complaints-trend', {
            chart: {
                type: 'line'
            },
            title: {
                text: ''
            },
            xAxis: {
                categories: categories,
                title: {
                    text: 'ช่วงเวลา'
                }
            },
            yAxis: {
                title: {
                    text: 'จำนวนเรื่องร้องเรียน'
                },
                min: 0
            },
            tooltip: {
                shared: true,
                crosshairs: true,
                valueSuffix: ' เรื่อง'
            },
            plotOptions: {
                line: {
                    dataLabels: {
                        enabled: true
                    },
                    enableMouseTracking: true
                }
            },
            legend: {
                layout: 'horizontal',
                align: 'center',
                verticalAlign: 'bottom',
                borderWidth: 0
            },
            credits: {
                enabled: false
            },
            series: series
        });
    }

    /**
     * Export data to Excel
     */
    function exportToExcel() {
        showLoading();
        elements.exportExcelBtn.prop('disabled', true);
        elements.exportExcelBtn.html('<i class="fas fa-spinner fa-spin me-1"></i> กำลังส่งออก...');

        $.ajax({
            url: complaintStatsData.ajaxurl,
            type: 'POST',
            data: {
                action: 'export_complaint_data',
                nonce: complaintStatsData.nonce,
                start_date: state.filters.startDate,
                end_date: state.filters.endDate
            },
            success: function(response) {
                if (response.success) {
                    // สร้างไฟล์ Excel จากข้อมูล
                    generateExcelFile(response.data);
                    showAlert(`ส่งออกข้อมูลเรียบร้อยแล้ว (${response.data.count} รายการ)`, 'success');
                } else {
                    showAlert(response.data?.message || complaintStatsData.messages.error, 'danger');
                }
            },
            error: function() {
                showAlert(complaintStatsData.messages.error, 'danger');
            },
            complete: function() {
                hideLoading();
                elements.exportExcelBtn.prop('disabled', false);
                elements.exportExcelBtn.html('<i class="fas fa-file-excel me-1"></i> ส่งออกข้อมูล Excel');
            }
        });
    }

    /**
     * Generate Excel file from data
     */
    function generateExcelFile(data) {
        if (!XLSX) {
            console.error('XLSX library is not loaded');
            return;
        }

        try {
            // สร้าง workbook
            const wb = XLSX.utils.book_new();
            
            // สร้าง worksheet
            const ws = XLSX.utils.aoa_to_sheet(data.data);
            
            // เพิ่ม worksheet ใน workbook
            XLSX.utils.book_append_sheet(wb, ws, 'เรื่องร้องเรียน');
            
            // สร้างไฟล์ Excel และดาวน์โหลด
            XLSX.writeFile(wb, data.filename);
        } catch (error) {
            console.error('Error generating Excel file:', error);
            showAlert('เกิดข้อผิดพลาดในการสร้างไฟล์ Excel', 'danger');
        }
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
        elements.container.addClass('stats-loading');
        elements.applyFiltersBtn.prop('disabled', true);
    }

    /**
     * Hide loading state
     */
    function hideLoading() {
        elements.container.removeClass('stats-loading');
        elements.applyFiltersBtn.prop('disabled', false);
    }

    /**
     * Format date for input field (YYYY-MM-DD)
     */
    function formatDateForInput(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // เริ่มต้นแอปพลิเคชัน
    init();
});