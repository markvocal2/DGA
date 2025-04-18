/**
 * CKAN Usage Report System JavaScript
 * Handles the interactive functionality for the usage report system
 */

jQuery(document).ready(function($) {
    // Charts configuration and global options
    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif';
    Chart.defaults.font.size = 13;
    Chart.defaults.color = '#333333';
    
    // Store chart instances to update later
    let activityTrendChart = null;
    let actionTypesChart = null;
    let topUsersChart = null;
    
    // Current filter state
    const filters = {
        type: $('#ckan-report-type').val() || 'all',
        period: $('#ckan-report-period').val() || 'month',
        limit: parseInt(ckan_report.limit) || 10
    };
    
    // Initialize report data
    initializeReport();
    
    // Event handlers for filters
    $('#ckan-apply-filters').on('click', function() {
        filters.type = $('#ckan-report-type').val();
        filters.period = $('#ckan-report-period').val();
        
        // Update report with new filters
        updateReportData();
    });
    
    $('#ckan-refresh-report').on('click', function() {
        // Refresh all data with current filters
        updateReportData(true);
    });
    
    // Print report handler
    $('#ckan-print-report').on('click', function() {
        window.print();
    });
    
    // Export data handler
    $('#ckan-export-activities').on('click', function() {
        exportTableToCSV('ckan-recent-activities', 'ckan_activity_report.csv');
    });
    
    // Initialize the report dashboard
    function initializeReport() {
        // Show loader
        $('.ckan-report-loader').show();
        
        // Load dashboard summary data
        loadDashboardSummary();
        
        // Load activity trend chart
        loadActivityTrendChart();
        
        // Load action types chart
        loadActionTypesChart();
        
        // Load top users chart
        loadTopUsersChart();
        
        // Load recent activities table
        loadRecentActivities();
        
        // Hide main loader when all data is loaded
        // This is simplified, ideally we'd track all AJAX requests
        // and hide loader when all are complete
        setTimeout(function() {
            $('.ckan-report-loader').fadeOut();
        }, 1500);
    }
    
    // Update report with new filters
    function updateReportData(showLoader = false) {
        // Update timestamp
        $('#ckan-report-timestamp').text(formatCurrentDateTime());
        
        if (showLoader) {
            $('.ckan-report-loader').show();
        }
        
        // Reload all charts and data with new filters
        loadActivityTrendChart();
        loadActionTypesChart();
        loadTopUsersChart();
        loadRecentActivities();
        
        if (showLoader) {
            setTimeout(function() {
                $('.ckan-report-loader').fadeOut();
            }, 1000);
        }
    }
    
    // Load dashboard summary data
    function loadDashboardSummary() {
        $.ajax({
            url: ckan_report.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_get_dashboard_summary',
                nonce: ckan_report.nonce
            },
            success: function(response) {
                if (response.success) {
                    const data = response.data;
                    
                    // Update dashboard card values with animation
                    animateCounter('#total-terms-value', data.terms);
                    animateCounter('#total-users-value', data.users);
                    animateCounter('#total-datasets-value', data.datasets);
                    animateCounter('#total-actions-value', data.actions);
                }
            },
            error: function() {
                // Display error message
                $('#total-terms-value, #total-users-value, #total-datasets-value, #total-actions-value')
                    .html('<span class="ckan-data-error">ข้อผิดพลาด</span>');
            }
        });
    }
    
    // Load activity trend chart
    function loadActivityTrendChart() {
        const chartContainer = $('#ckan-activity-trend').parent();
        chartContainer.find('.ckan-chart-loader').show();
        chartContainer.find('.ckan-chart-no-data').hide();
        
        $.ajax({
            url: ckan_report.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_get_activity_trend',
                nonce: ckan_report.nonce,
                period: filters.period,
                type: filters.type
            },
            success: function(response) {
                if (response.success) {
                    const chartData = response.data;
                    
                    // Check if we have any data
                    const hasData = chartData.datasets.some(dataset => 
                        dataset.data.some(value => value > 0)
                    );
                    
                    if (hasData) {
                        renderActivityTrendChart(chartData);
                    } else {
                        // Show no data message
                        chartContainer.find('.ckan-chart-no-data').show();
                        
                        // Destroy existing chart if any
                        if (activityTrendChart) {
                            activityTrendChart.destroy();
                            activityTrendChart = null;
                        }
                    }
                } else {
                    chartContainer.find('.ckan-chart-no-data').show();
                }
                
                chartContainer.find('.ckan-chart-loader').hide();
            },
            error: function() {
                chartContainer.find('.ckan-chart-loader').hide();
                chartContainer.find('.ckan-chart-no-data')
                    .show()
                    .html('<p>' + ckan_report.error_text + '</p>');
            }
        });
    }
    
    // Render activity trend chart
    function renderActivityTrendChart(chartData) {
        const ctx = document.getElementById('ckan-activity-trend').getContext('2d');
        
        // Configure chart data
        const config = {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: chartData.datasets.map(dataset => ({
                    label: dataset.label,
                    data: dataset.data,
                    borderColor: dataset.borderColor,
                    backgroundColor: dataset.backgroundColor,
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    fill: true
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            boxWidth: 12,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        usePointStyle: true,
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        };
        
        // If chart exists, update it, otherwise create new one
        if (activityTrendChart) {
            activityTrendChart.data = config.data;
            activityTrendChart.update();
        } else {
            activityTrendChart = new Chart(ctx, config);
        }
        
        // Generate legend
        updateChartLegend('activity-trend-legend', chartData.datasets);
    }
    
    // Load action types chart
    function loadActionTypesChart() {
        const chartContainer = $('#ckan-action-types').parent();
        chartContainer.find('.ckan-chart-loader').show();
        chartContainer.find('.ckan-chart-no-data').hide();
        
        $.ajax({
            url: ckan_report.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_get_action_types',
                nonce: ckan_report.nonce,
                period: filters.period,
                type: filters.type
            },
            success: function(response) {
                if (response.success) {
                    const chartData = response.data;
                    
                    // Check if we have any data
                    const hasData = chartData.datasets[0].data.some(value => value > 0);
                    
                    if (hasData) {
                        renderActionTypesChart(chartData);
                    } else {
                        // Show no data message
                        chartContainer.find('.ckan-chart-no-data').show();
                        
                        // Destroy existing chart if any
                        if (actionTypesChart) {
                            actionTypesChart.destroy();
                            actionTypesChart = null;
                        }
                    }
                } else {
                    chartContainer.find('.ckan-chart-no-data').show();
                }
                
                chartContainer.find('.ckan-chart-loader').hide();
            },
            error: function() {
                chartContainer.find('.ckan-chart-loader').hide();
                chartContainer.find('.ckan-chart-no-data')
                    .show()
                    .html('<p>' + ckan_report.error_text + '</p>');
            }
        });
    }
    
    // Render action types chart
    function renderActionTypesChart(chartData) {
        const ctx = document.getElementById('ckan-action-types').getContext('2d');
        
        // Configure chart data
        const config = {
            type: 'doughnut',
            data: {
                labels: chartData.labels,
                datasets: chartData.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 12,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        usePointStyle: true,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        };
        
        // If chart exists, update it, otherwise create new one
        if (actionTypesChart) {
            actionTypesChart.data = config.data;
            actionTypesChart.update();
        } else {
            actionTypesChart = new Chart(ctx, config);
        }
    }
    
    // Load top users chart
    function loadTopUsersChart() {
        const chartContainer = $('#ckan-top-users').parent();
        chartContainer.find('.ckan-chart-loader').show();
        chartContainer.find('.ckan-chart-no-data').hide();
        
        $.ajax({
            url: ckan_report.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_get_top_users',
                nonce: ckan_report.nonce,
                period: filters.period,
                type: filters.type,
                limit: 5 // Top 5 users
            },
            success: function(response) {
                if (response.success) {
                    const chartData = response.data;
                    
                    // Check if we have any data
                    const hasData = chartData.datasets[0].data.length > 0;
                    
                    if (hasData) {
                        renderTopUsersChart(chartData);
                    } else {
                        // Show no data message
                        chartContainer.find('.ckan-chart-no-data').show();
                        
                        // Destroy existing chart if any
                        if (topUsersChart) {
                            topUsersChart.destroy();
                            topUsersChart = null;
                        }
                    }
                } else {
                    chartContainer.find('.ckan-chart-no-data').show();
                }
                
                chartContainer.find('.ckan-chart-loader').hide();
            },
            error: function() {
                chartContainer.find('.ckan-chart-loader').hide();
                chartContainer.find('.ckan-chart-no-data')
                    .show()
                    .html('<p>' + ckan_report.error_text + '</p>');
            }
        });
    }
    
    // Render top users chart
    function renderTopUsersChart(chartData) {
        const ctx = document.getElementById('ckan-top-users').getContext('2d');
        
        // Configure chart data
        const config = {
            type: 'bar',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'จำนวนการดำเนินการ',
                    data: chartData.datasets[0].data,
                    backgroundColor: chartData.datasets[0].backgroundColor,
                    borderColor: 'rgba(255, 255, 255, 0.7)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // Horizontal bar chart
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        usePointStyle: true,
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                return `จำนวน: ${context.parsed.x} ครั้ง`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        };
        
        // If chart exists, update it, otherwise create new one
        if (topUsersChart) {
            topUsersChart.data = config.data;
            topUsersChart.update();
        } else {
            topUsersChart = new Chart(ctx, config);
        }
    }
    
    // Load recent activities table
    function loadRecentActivities() {
        const tableBody = $('#ckan-recent-activities tbody');
        tableBody.html('<tr class="ckan-loading-row"><td colspan="4"><div class="ckan-loader-inline"></div><p>กำลังโหลดข้อมูล...</p></td></tr>');
        
        $.ajax({
            url: ckan_report.ajax_url,
            type: 'POST',
            data: {
                action: 'ckan_get_recent_activities',
                nonce: ckan_report.nonce,
                period: filters.period,
                type: filters.type,
                limit: filters.limit
            },
            success: function(response) {
                if (response.success) {
                    const activities = response.data.activities;
                    
                    if (activities.length > 0) {
                        let tableHtml = '';
                        
                        activities.forEach(function(activity) {
                            tableHtml += `
                                <tr>
                                    <td>${activity.time}</td>
                                    <td><span class="ckan-badge ckan-badge-${activity.action_class}">${activity.action}</span></td>
                                    <td>${activity.detail}</td>
                                    <td>${activity.user}</td>
                                </tr>
                            `;
                        });
                        
                        tableBody.html(tableHtml);
                    } else {
                        tableBody.html('<tr><td colspan="4" class="ckan-no-data">ไม่พบข้อมูลกิจกรรม</td></tr>');
                    }
                } else {
                    tableBody.html('<tr><td colspan="4" class="ckan-data-error">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>');
                }
            },
            error: function() {
                tableBody.html('<tr><td colspan="4" class="ckan-data-error">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>');
            }
        });
    }
    
    // Helper function to animate counter
    function animateCounter(selector, targetValue) {
        const $element = $(selector);
        const startValue = 0;
        const duration = 1000; // milliseconds
        const increment = targetValue / (duration / 16); // 16ms per frame (approx 60fps)
        let currentValue = startValue;
        
        // Clear any existing content
        $element.html(formatNumber(startValue));
        
        const counterInterval = setInterval(function() {
            currentValue += increment;
            
            if (currentValue >= targetValue) {
                clearInterval(counterInterval);
                currentValue = targetValue;
            }
            
            $element.html(formatNumber(Math.floor(currentValue)));
        }, 16);
    }
    
    // Helper function to format number with commas
    function formatNumber(num) {
        return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
    }
    
    // Helper function to generate current date time formatted string
    function formatCurrentDateTime() {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        // Thai Buddhist Era year (CE + 543)
        const thaiYear = now.getFullYear() + 543;
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        return `${day}/${month}/${thaiYear} ${hours}:${minutes}:${seconds}`;
    }
    
    // Update chart legend with custom style
    function updateChartLegend(elementId, datasets) {
        const legendContainer = document.getElementById(elementId);
        if (!legendContainer) return;
        
        let legendHtml = '<ul class="ckan-legend-list">';
        
        datasets.forEach(dataset => {
            legendHtml += `
                <li class="ckan-legend-item">
                    <span class="ckan-legend-marker" style="background-color: ${dataset.borderColor}"></span>
                    <span class="ckan-legend-label">${dataset.label}</span>
                </li>
            `;
        });
        
        legendHtml += '</ul>';
        legendContainer.innerHTML = legendHtml;
    }
    
    // Function to export table to CSV
    function exportTableToCSV(tableId, filename) {
        const table = document.getElementById(tableId);
        let csv = [];
        let rows = table.querySelectorAll('tr');
        
        for (let i = 0; i < rows.length; i++) {
            let row = [], cols = rows[i].querySelectorAll('td, th');
            
            for (let j = 0; j < cols.length; j++) {
                // Get the text content and replace any commas with spaces to avoid CSV format issues
                let text = cols[j].textContent.replace(/,/g, ' ');
                // Remove extra spaces and trim
                text = text.replace(/\s+/g, ' ').trim();
                // Wrap in quotes to handle any special characters
                row.push('"' + text + '"');
            }
            
            csv.push(row.join(','));
        }
        
        // Download CSV file
        downloadCSV(csv.join('\n'), filename);
    }
    
    // Function to download CSV
    function downloadCSV(csv, filename) {
        let csvFile;
        let downloadLink;
        
        // Add BOM for UTF-8 encoding
        const universalBOM = "\uFEFF";
        csvFile = new Blob([universalBOM + csv], {type: 'text/csv;charset=utf-8;'});
        
        // Create download link
        downloadLink = document.createElement('a');
        
        // File name
        downloadLink.download = filename;
        
        // Create a link to the file
        downloadLink.href = window.URL.createObjectURL(csvFile);
        
        // Hide download link
        downloadLink.style.display = 'none';
        
        // Add the link to DOM
        document.body.appendChild(downloadLink);
        
        // Click download link
        downloadLink.click();
        
        // Clean up and remove the link
        document.body.removeChild(downloadLink);
    }
});