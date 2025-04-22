/**
 * Complaint Statistics System
 * Version: 1.1.0
 * Refactored for improved reliability and reduced code duplication
 */

jQuery(document).ready(function($) {
    'use strict';

    /**
     * Utility functions for library availability checks and safe operations
     */
    const Utils = {
        /**
         * Safely check if a library is available
         * @param {string} libraryName Name of the library
         * @param {object} globalObject Global object to check (window by default)
         * @returns {boolean} True if library exists
         */
        isLibraryAvailable: function(libraryName, globalObject = window) {
            return typeof globalObject[libraryName] !== 'undefined' && globalObject[libraryName] !== null;
        },
        
        /**
         * Format date for input field (YYYY-MM-DD)
         * @param {Date} date Date object
         * @returns {string} Formatted date string
         */
        formatDateForInput: function(date) {
            if (!(date instanceof Date) || isNaN(date.getTime())) {
                console.error('Invalid date provided to formatDateForInput');
                return '';
            }
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },
        
        /**
         * Safely get a property from an object with a default value
         * @param {object} obj Object to get property from
         * @param {string} path Property path (e.g. 'a.b.c')
         * @param {*} defaultValue Default value if property doesn't exist
         * @returns {*} Property value or default value
         */
        safeGet: function(obj, path, defaultValue = undefined) {
            if (!obj || typeof obj !== 'object') return defaultValue;
            
            const keys = path.split('.');
            let result = obj;
            
            for (const key of keys) {
                if (result === undefined || result === null || !Object.prototype.hasOwnProperty.call(result, key)) {
                    return defaultValue;
                }
                result = result[key];
            }
            
            return result === undefined ? defaultValue : result;
        },
        
        /**
         * Safely execute a function with try/catch
         * @param {Function} fn Function to execute
         * @param {Array} args Arguments to pass to function
         * @param {*} defaultValue Default value to return if function throws
         * @returns {*} Function result or default value
         */
        safeExecute: function(fn, args = [], defaultValue = undefined) {
            if (typeof fn !== 'function') return defaultValue;
            
            try {
                return fn.apply(null, args);
            } catch (error) {
                console.error('Error executing function:', error);
                return defaultValue;
            }
        }
    };

    /**
     * Configuration
     */
    const CONFIG = {
        dateFormat: Utils.safeGet(complaintStatsData, 'date_format', 'DD/MM/YYYY'),
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
        statusLabels: Utils.safeGet(complaintStatsData, 'status_labels', {
            'pending': 'รอดำเนินการ',
            'in-progress': 'กำลังดำเนินการ',
            'completed': 'เสร็จสิ้น',
            'rejected': 'ไม่รับพิจารณา',
            'closed': 'ปิดเรื่อง'
        }),
        messages: Utils.safeGet(complaintStatsData, 'messages', {
            error: 'เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่อีกครั้ง',
            no_data: 'ไม่พบข้อมูลสำหรับช่วงเวลาที่เลือก',
            loading: 'กำลังโหลดข้อมูล...'
        }),
        ajaxUrl: Utils.safeGet(complaintStatsData, 'ajaxurl', ''),
        nonce: Utils.safeGet(complaintStatsData, 'nonce', '')
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
     * DOM Element Cache
     */
    const elements = {
        container: $('.complaint-stats-container'),
        filters: {
            periodFilter: $('#period-filter'),
            startDateInput: $('#date-start'),
            endDateInput: $('#date-end'),
            applyFiltersBtn: $('#apply-stats-filters'),
            trendStatusFilter: $('#trend-status-filter')
        },
        buttons: {
            exportExcelBtn: $('#export-excel-btn')
        },
        displays: {
            alert: $('#stats-alert'),
            totalComplaints: $('#total-complaints'),
            dailyAverage: $('#daily-average'),
            activeComplaints: $('#active-complaints'),
            statusStats: $('#status-stats')
        },
        charts: {
            complaintsByStatus: $('#complaints-by-status'),
            complaintsByType: $('#complaints-by-type'),
            complaintsByDepartment: $('#complaints-by-department'),
            complaintsTrend: $('#complaints-trend')
        }
    };

    /**
     * Alert Manager - Handles displaying alerts and notifications
     */
    const AlertManager = {
        /**
         * Show alert message
         * @param {string} message Alert message
         * @param {string} type Alert type (info, success, warning, danger)
         * @param {number} duration Duration in ms (0 for permanent)
         */
        show: function(message, type = 'info', duration = 5000) {
            if (!elements.displays.alert || !elements.displays.alert.length) {
                console.error('Alert element not found');
                return;
            }
            
            elements.displays.alert
                .removeClass('d-none alert-info alert-success alert-warning alert-danger')
                .addClass(`alert-${type}`)
                .html(message)
                .slideDown(CONFIG.defaultAnimationDuration);
            
            // Hide alert after duration (except for danger alerts)
            if (duration > 0 && type !== 'danger') {
                setTimeout(() => {
                    this.hide();
                }, duration);
            }
        },
        
        /**
         * Hide alert message
         */
        hide: function() {
            if (!elements.displays.alert || !elements.displays.alert.length) return;
            
            elements.displays.alert.slideUp(CONFIG.defaultAnimationDuration, function() {
                $(this).addClass('d-none');
            });
        }
    };

    /**
     * Loading State Manager
     */
    const LoadingManager = {
        /**
         * Show loading state
         */
        show: function() {
            if (elements.container && elements.container.length) {
                elements.container.addClass('stats-loading');
            }
            
            if (elements.filters.applyFiltersBtn && elements.filters.applyFiltersBtn.length) {
                elements.filters.applyFiltersBtn.prop('disabled', true);
            }
        },
        
        /**
         * Hide loading state
         */
        hide: function() {
            if (elements.container && elements.container.length) {
                elements.container.removeClass('stats-loading');
            }
            
            if (elements.filters.applyFiltersBtn && elements.filters.applyFiltersBtn.length) {
                elements.filters.applyFiltersBtn.prop('disabled', false);
            }
        }
    };

    /**
     * AJAX Service - Handles all AJAX requests
     */
    const AjaxService = {
        /**
         * Make AJAX request
         * @param {string} action WP action to call
         * @param {object} data Additional data to send
         * @param {Function} successCallback Success callback
         * @param {Function} errorCallback Error callback
         * @returns {jqXHR} jQuery XHR object
         */
        request: function(action, data = {}, successCallback = null, errorCallback = null) {
            if (!CONFIG.ajaxUrl) {
                console.error('AJAX URL is not defined');
                if (typeof errorCallback === 'function') {
                    errorCallback({ message: 'AJAX URL is not defined' });
                }
                return $.Deferred().reject().promise();
            }
            
            return $.ajax({
                url: CONFIG.ajaxUrl,
                type: 'POST',
                data: {
                    action: action,
                    nonce: CONFIG.nonce,
                    ...data
                },
                success: function(response) {
                    if (response && response.success && typeof successCallback === 'function') {
                        successCallback(response.data);
                    } else if (!response.success && typeof errorCallback === 'function') {
                        errorCallback(response.data || { message: CONFIG.messages.error });
                    }
                },
                error: function(xhr, status, error) {
                    console.error(`AJAX error: ${status} - ${error}`);
                    if (typeof errorCallback === 'function') {
                        errorCallback({ message: CONFIG.messages.error, originalError: error });
                    }
                }
            });
        },
        
        /**
         * Load statistics
         * @param {object} filters Filter parameters
         * @returns {Promise} jQuery Promise
         */
        loadStatistics: function(filters) {
            return this.request(
                'get_complaint_statistics',
                {
                    period: filters.period,
                    start_date: filters.startDate,
                    end_date: filters.endDate
                },
                function(data) {
                    state.statistics = data;
                    StatisticsUI.update();
                },
                function(error) {
                    AlertManager.show(
                        error.message || CONFIG.messages.error, 
                        'danger'
                    );
                }
            );
        },
        
        /**
         * Export data to Excel
         * @param {object} filters Filter parameters
         * @returns {Promise} jQuery Promise
         */
        exportToExcel: function(filters) {
            return this.request(
                'export_complaint_data',
                {
                    start_date: filters.startDate,
                    end_date: filters.endDate
                },
                function(data) {
                    ExcelService.generateFile(data);
                    AlertManager.show(
                        `ส่งออกข้อมูลเรียบร้อยแล้ว (${data.count} รายการ)`, 
                        'success'
                    );
                },
                function(error) {
                    AlertManager.show(
                        error.message || CONFIG.messages.error, 
                        'danger'
                    );
                }
            );
        }
    };

    /**
     * Chart Service - Handles chart creation and updates
     */
    const ChartService = {
        /**
         * Check if required chart libraries are available
         * @returns {boolean} True if all required libraries are available
         */
        checkDependencies: function() {
            if (!Utils.isLibraryAvailable('Highcharts')) {
                console.error('Highcharts library is not loaded');
                AlertManager.show('ไม่สามารถโหลดไลบรารี่กราฟ Highcharts ได้', 'warning');
                return false;
            }
            return true;
        },
        
        /**
         * Prepare pie chart data
         * @param {object} data Data object with key-value pairs
         * @param {boolean} useStatusColors Whether to use status colors
         * @returns {Array} Array of data objects for Highcharts
         */
        preparePieChartData: function(data, useStatusColors = false) {
            if (!data || typeof data !== 'object') {
                console.error('Invalid data provided to preparePieChartData');
                return [];
            }
            
            const chartData = [];
            
            Object.entries(data).forEach(([key, count], index) => {
                if (count > 0) {
                    chartData.push({
                        name: useStatusColors ? (CONFIG.statusLabels[key] || key) : key,
                        y: count,
                        color: useStatusColors 
                            ? CONFIG.statusColors[key] 
                            : CONFIG.chartColors[index % CONFIG.chartColors.length]
                    });
                }
            });
            
            return chartData;
        },
        
        /**
         * Create pie chart
         * @param {string} containerId Container element ID
         * @param {Array} data Chart data
         * @param {object} options Chart options
         */
        createPieChart: function(containerId, data, options = {}) {
            if (!this.checkDependencies()) return;
            
            if (!containerId || !$(`#${containerId}`).length) {
                console.error(`Container #${containerId} not found`);
                return;
            }
            
            if (!data || !Array.isArray(data) || data.length === 0) {
                console.warn(`No data provided for chart #${containerId}`);
                return;
            }
            
            const defaultOptions = {
                height: null,
                innerSize: null,
                title: '',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                },
                showInLegend: false
            };
            
            const chartOptions = {...defaultOptions, ...options};
            
            try {
                Highcharts.chart(containerId, {
                    chart: {
                        type: 'pie',
                        height: chartOptions.height
                    },
                    title: {
                        text: chartOptions.title
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
                            dataLabels: chartOptions.dataLabels,
                            showInLegend: chartOptions.showInLegend,
                            size: '100%',
                            innerSize: chartOptions.innerSize
                        }
                    },
                    credits: {
                        enabled: false
                    },
                    series: [{
                        name: 'จำนวน',
                        colorByPoint: true,
                        data: data
                    }]
                });
            } catch (error) {
                console.error(`Error creating pie chart for #${containerId}:`, error);
            }
        },
        
        /**
         * Create bar chart
         * @param {string} containerId Container element ID
         * @param {Array} categories X-axis categories
         * @param {Array} data Chart data values
         * @param {object} options Chart options
         */
        createBarChart: function(containerId, categories, data, options = {}) {
            if (!this.checkDependencies()) return;
            
            if (!containerId || !$(`#${containerId}`).length) {
                console.error(`Container #${containerId} not found`);
                return;
            }
            
            if (!categories || !Array.isArray(categories) || !data || !Array.isArray(data)) {
                console.warn(`Invalid data provided for chart #${containerId}`);
                return;
            }
            
            const defaultOptions = {
                title: '',
                yAxisTitle: 'จำนวน',
                tooltipSuffix: ' เรื่อง',
                useColors: true
            };
            
            const chartOptions = {...defaultOptions, ...options};
            
            try {
                Highcharts.chart(containerId, {
                    chart: {
                        type: 'bar'
                    },
                    title: {
                        text: chartOptions.title
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
                            text: chartOptions.yAxisTitle,
                            align: 'high'
                        },
                        labels: {
                            overflow: 'justify'
                        }
                    },
                    tooltip: {
                        valueSuffix: chartOptions.tooltipSuffix
                    },
                    plotOptions: {
                        bar: {
                            dataLabels: {
                                enabled: true
                            },
                            colorByPoint: chartOptions.useColors,
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
            } catch (error) {
                console.error(`Error creating bar chart for #${containerId}:`, error);
            }
        },
        
        /**
         * Create line chart
         * @param {string} containerId Container element ID
         * @param {Array} categories X-axis categories
         * @param {Array} series Chart series data
         * @param {object} options Chart options
         */
        createLineChart: function(containerId, categories, series, options = {}) {
            if (!this.checkDependencies()) return;
            
            if (!containerId || !$(`#${containerId}`).length) {
                console.error(`Container #${containerId} not found`);
                return;
            }
            
            if (!categories || !Array.isArray(categories) || !series || !Array.isArray(series)) {
                console.warn(`Invalid data provided for chart #${containerId}`);
                return;
            }
            
            const defaultOptions = {
                title: '',
                xAxisTitle: 'ช่วงเวลา',
                yAxisTitle: 'จำนวน',
                tooltipSuffix: ' เรื่อง'
            };
            
            const chartOptions = {...defaultOptions, ...options};
            
            try {
                Highcharts.chart(containerId, {
                    chart: {
                        type: 'line'
                    },
                    title: {
                        text: chartOptions.title
                    },
                    xAxis: {
                        categories: categories,
                        title: {
                            text: chartOptions.xAxisTitle
                        }
                    },
                    yAxis: {
                        title: {
                            text: chartOptions.yAxisTitle
                        },
                        min: 0
                    },
                    tooltip: {
                        shared: true,
                        crosshairs: true,
                        valueSuffix: chartOptions.tooltipSuffix
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
            } catch (error) {
                console.error(`Error creating line chart for #${containerId}:`, error);
            }
        },
        
        /**
         * Create status distribution chart
         * @param {object} statusData Status data
         */
        createStatusChart: function(statusData) {
            if (!statusData) return;
            
            const chartData = this.preparePieChartData(statusData, true);
            
            this.createPieChart('complaints-by-status', chartData, {
                height: 260,
                innerSize: '60%',
                dataLabels: {
                    distance: -30,
                    style: {
                        fontWeight: 'normal',
                        color: 'white',
                        textOutline: 'none'
                    }
                }
            });
        },
        
        /**
         * Create complaint type distribution chart
         * @param {object} typeData Type data
         */
        createTypeChart: function(typeData) {
            if (!typeData) return;
            
            const chartData = this.preparePieChartData(typeData);
            
            this.createPieChart('complaints-by-type', chartData);
        },
        
        /**
         * Create department distribution chart
         * @param {object} departmentData Department data
         */
        createDepartmentChart: function(departmentData) {
            if (!departmentData) return;
            
            const sortedData = Object.entries(departmentData)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);
            
            const categories = sortedData.map(item => item[0]);
            const data = sortedData.map(item => item[1]);
            
            this.createBarChart('complaints-by-department', categories, data, {
                yAxisTitle: 'จำนวนเรื่องร้องเรียน'
            });
        },
        
        /**
         * Create trend chart
         * @param {object} trendData Trend data
         */
        createTrendChart: function(trendData) {
            if (!trendData) return;
            
            try {
                const selectedStatus = elements.filters.trendStatusFilter.val();
                let series = [];
                
                if (selectedStatus === 'all') {
                    // Create series for each status
                    Object.entries(trendData).forEach(([status, data]) => {
                        if (data && Array.isArray(data) && data.length > 0) {
                            series.push({
                                name: CONFIG.statusLabels[status] || status,
                                data: data.map(item => item.count),
                                color: CONFIG.statusColors[status]
                            });
                        }
                    });
                } else {
                    // Create single series for selected status
                    if (trendData[selectedStatus] && Array.isArray(trendData[selectedStatus]) && trendData[selectedStatus].length > 0) {
                        series = [{
                            name: CONFIG.statusLabels[selectedStatus] || selectedStatus,
                            data: trendData[selectedStatus].map(item => item.count),
                            color: CONFIG.statusColors[selectedStatus]
                        }];
                    }
                }
                
                // Use categories from first status with data
                let categories = [];
                for (const status in trendData) {
                    if (trendData[status] && Array.isArray(trendData[status]) && trendData[status].length > 0) {
                        categories = trendData[status].map(item => item.period);
                        break;
                    }
                }
                
                this.createLineChart('complaints-trend', categories, series);
            } catch (error) {
                console.error('Error creating trend chart:', error);
            }
        }
    };

    /**
     * Excel Service - Handles Excel file generation
     */
    const ExcelService = {
        /**
         * Check if XLSX library is available
         * @returns {boolean} True if XLSX is available
         */
        checkDependency: function() {
            if (!Utils.isLibraryAvailable('XLSX')) {
                console.error('XLSX library is not loaded');
                AlertManager.show('ไม่สามารถโหลดไลบรารี่ XLSX สำหรับการส่งออกข้อมูลได้', 'warning');
                return false;
            }
            return true;
        },
        
        /**
         * Generate Excel file from data
         * @param {object} data Data from server
         */
        generateFile: function(data) {
            if (!this.checkDependency()) return;
            if (!data || !data.data || !Array.isArray(data.data) || !data.filename) {
                console.error('Invalid data provided for Excel export');
                AlertManager.show('ข้อมูลสำหรับการส่งออกไม่ถูกต้อง', 'danger');
                return;
            }
            
            try {
                // Create workbook
                const wb = XLSX.utils.book_new();
                
                // Create worksheet
                const ws = XLSX.utils.aoa_to_sheet(data.data);
                
                // Add worksheet to workbook
                XLSX.utils.book_append_sheet(wb, ws, 'เรื่องร้องเรียน');
                
                // Generate Excel file and download
                XLSX.writeFile(wb, data.filename);
            } catch (error) {
                console.error('Error generating Excel file:', error);
                AlertManager.show('เกิดข้อผิดพลาดในการสร้างไฟล์ Excel', 'danger');
            }
        }
    };

    /**
     * Statistics UI Manager - Updates the UI with statistics data
     */
    const StatisticsUI = {
        /**
         * Update all statistics UI elements
         */
        update: function() {
            const stats = state.statistics;
            
            if (!stats) {
                AlertManager.show(CONFIG.messages.no_data, 'warning');
                return;
            }
            
            // Update summary values
            this.updateSummary(stats);
            
            // Update status statistics
            this.updateStatusStats(stats.by_status);
            
            // Create charts
            this.createCharts(stats);
        },
        
        /**
         * Update summary statistics
         * @param {object} stats Statistics data
         */
        updateSummary: function(stats) {
            if (!stats) return;
            
            if (elements.displays.totalComplaints && elements.displays.totalComplaints.length) {
                elements.displays.totalComplaints.text(stats.total);
            }
            
            if (elements.displays.dailyAverage && elements.displays.dailyAverage.length) {
                elements.displays.dailyAverage.text(
                    typeof stats.daily_average === 'number' 
                        ? stats.daily_average.toFixed(2) 
                        : '0.00'
                );
            }
            
            if (elements.displays.activeComplaints && elements.displays.activeComplaints.length) {
                elements.displays.activeComplaints.text(stats.active_complaints);
            }
        },
        
        /**
         * Update status statistics display
         * @param {object} statusData Status data
         */
        updateStatusStats: function(statusData) {
            if (!statusData || !elements.displays.statusStats || !elements.displays.statusStats.length) {
                return;
            }
            
            let html = '<div class="status-grid">';
            
            Object.entries(statusData).forEach(([status, count]) => {
                const statusLabel = CONFIG.statusLabels[status] || status;
                const statusClass = status;
                const totalComplaints = state.statistics?.total || 0;
                const percentage = totalComplaints > 0 
                    ? ((count / totalComplaints) * 100).toFixed(1) 
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
            elements.displays.statusStats.html(html);
        },
        
        /**
         * Create all charts
         * @param {object} stats Statistics data
         */
        createCharts: function(stats) {
            if (!stats) return;
            
            ChartService.createStatusChart(stats.by_status);
            ChartService.createTypeChart(stats.by_type);
            ChartService.createDepartmentChart(stats.by_department);
            ChartService.createTrendChart(stats.trend);
        }
    };

    /**
     * Filter Manager - Handles filter operations
     */
    const FilterManager = {
        /**
         * Set default dates for filter
         */
        setDefaultDates: function() {
            try {
                const today = new Date();
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(today.getDate() - 30);
                
                if (elements.filters.startDateInput && elements.filters.startDateInput.length) {
                    if (!elements.filters.startDateInput.val()) {
                        const formattedDate = Utils.formatDateForInput(thirtyDaysAgo);
                        elements.filters.startDateInput.val(formattedDate);
                        state.filters.startDate = formattedDate;
                    } else {
                        state.filters.startDate = elements.filters.startDateInput.val();
                    }
                }
                
                if (elements.filters.endDateInput && elements.filters.endDateInput.length) {
                    if (!elements.filters.endDateInput.val()) {
                        const formattedDate = Utils.formatDateForInput(today);
                        elements.filters.endDateInput.val(formattedDate);
                        state.filters.endDate = formattedDate;
                    } else {
                        state.filters.endDate = elements.filters.endDateInput.val();
                    }
                }
            } catch (error) {
                console.error('Error setting default dates:', error);
            }
        },
        
        /**
         * Apply filters from UI to state
         */
        applyFilters: function() {
            if (elements.filters.periodFilter && elements.filters.periodFilter.length) {
                state.filters.period = elements.filters.periodFilter.val();
            }
            
            if (elements.filters.startDateInput && elements.filters.startDateInput.length) {
                state.filters.startDate = elements.filters.startDateInput.val();
            }
            
            if (elements.filters.endDateInput && elements.filters.endDateInput.length) {
                state.filters.endDate = elements.filters.endDateInput.val();
            }
        },
        
        /**
         * Validate filter values
         * @returns {boolean} True if filters are valid
         */
        validateFilters: function() {
            try {
                // Check if start and end dates are valid
                const startDate = new Date(state.filters.startDate);
                const endDate = new Date(state.filters.endDate);
                
                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    AlertManager.show('วันที่ไม่ถูกต้อง กรุณาตรวจสอบรูปแบบวันที่', 'warning');
                    return false;
                }
                
                // Check if start date is before end date
                if (startDate > endDate) {
                    AlertManager.show('วันที่เริ่มต้นต้องมาก่อนวันที่สิ้นสุด', 'warning');
                    return false;
                }
                
                // Check if date range is not too large (e.g., 2 years)
                const maxDays = 730; // 2 years
                const diffTime = Math.abs(endDate - startDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays > maxDays) {
                    AlertManager.show(`ช่วงเวลาที่เลือกมากเกินไป (${diffDays} วัน) กรุณาเลือกไม่เกิน ${maxDays} วัน`, 'warning');
                    return false;
                }
                
                return true;
            } catch (error) {
                console.error('Error validating filters:', error);
                return false;
            }
        }
    };

    /**
     * Event Handler - Sets up and manages all event listeners
     */
    const EventHandler = {
        /**
         * Set up all event listeners
         */
        setup: function() {
            this.setupFilterEvents();
            this.setupButtonEvents();
        },
        
        /**
         * Set up filter-related events
         */
        setupFilterEvents: function() {
            // Period filter change
            if (elements.filters.periodFilter && elements.filters.periodFilter.length) {
                elements.filters.periodFilter.on('change', function() {
                    state.filters.period = $(this).val();
                });
            }
            
            // Date input changes
            if (elements.filters.startDateInput && elements.filters.startDateInput.length) {
                elements.filters.startDateInput.on('change', function() {
                    state.filters.startDate = $(this).val();
                });
            }
            
            if (elements.filters.endDateInput && elements.filters.endDateInput.length) {
                elements.filters.endDateInput.on('change', function() {
                    state.filters.endDate = $(this).val();
                });
            }
            
            // Apply filters button
            if (elements.filters.applyFiltersBtn && elements.filters.applyFiltersBtn.length) {
                elements.filters.applyFiltersBtn.on('click', function() {
                    FilterManager.applyFilters();
                    
                    if (FilterManager.validateFilters()) {
                        LoadingManager.show();
                        AjaxService.loadStatistics(state.filters)
                            .always(function() {
                                LoadingManager.hide();
                            });
                    }
                });
            }
            
            // Trend status filter
            if (elements.filters.trendStatusFilter && elements.filters.trendStatusFilter.length) {
                elements.filters.trendStatusFilter.on('change', function() {
                    if (state.statistics && state.statistics.trend) {
                        ChartService.createTrendChart(state.statistics.trend);
                    }
                });
            }
        },
        
        /**
         * Set up button events
         */
        setupButtonEvents: function() {
            // Export Excel button
            if (elements.buttons.exportExcelBtn && elements.buttons.exportExcelBtn.length) {
                elements.buttons.exportExcelBtn.on('click', function() {
                    if (!FilterManager.validateFilters()) return;
                    
                    const $button = $(this);
                    LoadingManager.show();
                    $button.prop('disabled', true);
                    $button.html('<i class="fas fa-spinner fa-spin me-1"></i> กำลังส่งออก...');
                    
                    AjaxService.exportToExcel(state.filters)
                        .always(function() {
                            LoadingManager.hide();
                            $button.prop('disabled', false);
                            $button.html('<i class="fas fa-file-excel me-1"></i> ส่งออกข้อมูล Excel');
                        });
                });
            }
        }
    };

    /**
     * App - Main application logic
     */
    const App = {
        /**
         * Initialize the application
         */
        init: function() {
            // Validate required configuration
            if (!CONFIG.ajaxUrl) {
                AlertManager.show('ไม่พบการตั้งค่า AJAX ที่จำเป็น โปรดรีเฟรชหน้าเว็บ', 'danger');
                return;
            }
            
            // Set default dates for filter
            FilterManager.setDefaultDates();
            
            // Set up event listeners
            EventHandler.setup();
            
            // Load initial statistics
            LoadingManager.show();
            AjaxService.loadStatistics(state.filters)
                .always(function() {
                    LoadingManager.hide();
                });
        }
    };

    // Initialize the application
    App.init();
});
