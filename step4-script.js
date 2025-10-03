// Step 4: Dashboard Layout Editor
class DashboardEditor {
    constructor() {
        this.visualLibrary = [];
        this.dashboardCharts = [];
        this.currentMode = 'design';
        this.selectedWidget = null;
        this.currentColumns = 1;
        this.currentSpacing = 16;
        this.currentTheme = 'light';
        this.currentNumberFormat = 'plain';
        this.currentFontSize = 14;
        this.filters = {
            dateRange: { start: null, end: null },
            regions: [],
            people: [],
            companies: [],
            numericRange: { min: null, max: null }
        };
        
        this.initializeEventListeners();
        this.loadDataFromStep3();
    }

    initializeEventListeners() {
        // Navigation
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        if (prevBtn) prevBtn.addEventListener('click', () => this.goToPreviousStep());
        if (nextBtn) nextBtn.addEventListener('click', () => this.goToNextStep());

        // Mode toggle
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchMode(e.target.dataset.mode));
        });

        // Layout tools
        document.querySelectorAll('.column-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setColumns(parseInt(e.target.dataset.columns)));
        });

        const spacingSlider = document.getElementById('spacingSlider');
        if (spacingSlider) {
            spacingSlider.addEventListener('input', (e) => {
                this.setSpacing(parseInt(e.target.value));
            });
        }

        // Design tools
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.setTheme(e.target.value);
            });
        }

        const numberFormat = document.getElementById('numberFormat');
        if (numberFormat) {
            numberFormat.addEventListener('change', (e) => {
                this.setNumberFormat(e.target.value);
            });
        }

        const fontSizeSlider = document.getElementById('fontSizeSlider');
        if (fontSizeSlider) {
            fontSizeSlider.addEventListener('input', (e) => {
                this.setFontSize(parseInt(e.target.value));
            });
        }

        // Canvas tools
        const addTextBtn = document.getElementById('addTextBtn');
        const clearCanvasBtn = document.getElementById('clearCanvasBtn');
        if (addTextBtn) addTextBtn.addEventListener('click', () => this.addTextWidget());
        if (clearCanvasBtn) clearCanvasBtn.addEventListener('click', () => this.clearCanvas());

        // Properties panel
        const closeProperties = document.getElementById('closeProperties');
        const applyProperties = document.getElementById('applyProperties');
        const deleteChart = document.getElementById('deleteChart');
        if (closeProperties) closeProperties.addEventListener('click', () => this.closePropertiesPanel());
        if (applyProperties) applyProperties.addEventListener('click', () => this.applyProperties());
        if (deleteChart) deleteChart.addEventListener('click', () => this.deleteSelectedWidget());

        // Filters
        const toggleFilters = document.getElementById('toggleFilters');
        if (toggleFilters) toggleFilters.addEventListener('click', () => this.toggleFilters());
        this.initializeFilterListeners();

        // Canvas interactions
        this.initializeCanvasListeners();
    }

    loadDataFromStep3() {
        try {
            // Try multiple sources for visual library
            let storedLibrary = localStorage.getItem('visualLibrary');
            let storedData = localStorage.getItem('cleanedData');
            let storedTypes = localStorage.getItem('columnTypes');
            
            // Fallback: check if visual library is stored under dashboardData
            if (!storedLibrary) {
                const dashboardData = localStorage.getItem('dashboardData');
                if (dashboardData) {
                    const parsed = JSON.parse(dashboardData);
                    if (parsed.visualLibrary) {
                        storedLibrary = JSON.stringify(parsed.visualLibrary);
                        console.log('Found visual library in dashboardData');
                    }
                }
            }
            
            // Check for Chart.js availability
            if (typeof Chart === 'undefined') {
                console.warn('Chart.js not loaded, charts will show as placeholders');
            }
            
            if (!storedLibrary) {
                this.showError('No visual library found from Step 3. Please go back and create charts first.');
                return;
            }

            if (!storedData) {
                this.showError('No cleaned data found. Please go back to Step 2 to clean your data first.');
                return;
            }

            this.visualLibrary = JSON.parse(storedLibrary);
            this.cleanedData = JSON.parse(storedData);
            this.columnTypes = JSON.parse(storedTypes || '{}');
            
            console.log('Loaded data:', {
                visualLibraryCount: this.visualLibrary.length,
                dataRows: this.cleanedData.length,
                columnTypes: Object.keys(this.columnTypes).length
            });
            
            this.populateChartLibrary();
            this.populateFilters();
            this.updateCanvasInfo();
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Error loading data from Step 3. Please try creating charts again.');
        }
    }

    populateChartLibrary() {
        const libraryContainer = document.getElementById('chartLibrary');
        
        if (!libraryContainer) {
            console.error('Chart library container not found');
            return;
        }
        
        if (this.visualLibrary.length === 0) {
            libraryContainer.innerHTML = `
                <div class="library-placeholder">
                    <p>No charts available. Go back to Step 3 to create charts.</p>
                    <button class="btn btn-outline" onclick="window.location.href='step3.html'">Create Charts</button>
                </div>
            `;
            return;
        }

        libraryContainer.innerHTML = '';
        
        this.visualLibrary.forEach(chart => {
            const libraryItem = document.createElement('div');
            libraryItem.className = 'library-item';
            libraryItem.draggable = true;
            libraryItem.dataset.chartId = chart.id;
            
            libraryItem.innerHTML = `
                <div class="library-item-header">
                    <h4 class="library-item-title">${chart.title || 'Untitled Chart'}</h4>
                    <span class="library-item-type">${chart.type || 'unknown'}</span>
                </div>
                <div class="library-item-preview">
                    ${(chart.type || 'CHART').toUpperCase()} Chart
                </div>
            `;
            
            libraryItem.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', chart.id);
                e.dataTransfer.effectAllowed = 'copy';
            });
            
            libraryContainer.appendChild(libraryItem);
        });
    }

    populateFilters() {
        if (!this.cleanedData || this.cleanedData.length === 0) return;

        // Get unique values for each filter type
        const regions = [...new Set(this.cleanedData.map(row => row.Region || row.region).filter(Boolean))];
        const people = [...new Set(this.cleanedData.map(row => row.Owner || row.owner || row.Person || row.person).filter(Boolean))];
        const companies = [...new Set(this.cleanedData.map(row => row.Company || row.company || row.Organization || row.organization).filter(Boolean))];

        // Populate region filters
        this.populateFilterCheckboxes('regionFilters', regions);
        
        // Populate people filters
        this.populateFilterCheckboxes('peopleFilters', people);
        
        // Populate company filters
        this.populateFilterCheckboxes('companyFilters', companies);

        // Populate numeric range filter
        this.populateNumericRangeFilter();
    }

    populateFilterCheckboxes(containerId, values) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        values.forEach(value => {
            const checkbox = document.createElement('div');
            checkbox.className = 'filter-checkbox';
            checkbox.innerHTML = `
                <input type="checkbox" id="${containerId}_${value}" value="${value}">
                <label for="${containerId}_${value}">${value}</label>
            `;
            container.appendChild(checkbox);
        });
    }

    populateNumericRangeFilter() {
        const numericFields = Object.keys(this.columnTypes).filter(field => this.columnTypes[field] === 'number');
        
        if (numericFields.length === 0) {
            document.getElementById('numericRangeFilter').innerHTML = '<p>No numeric fields found</p>';
            return;
        }

        const container = document.getElementById('numericRangeFilter');
        container.innerHTML = `
            <select id="numericFieldSelect" class="select-input">
                <option value="">Select field...</option>
                ${numericFields.map(field => `<option value="${field}">${field}</option>`).join('')}
            </select>
            <div class="range-inputs">
                <input type="number" id="numericMin" class="range-input" placeholder="Min">
                <input type="number" id="numericMax" class="range-input" placeholder="Max">
            </div>
        `;
    }

    initializeFilterListeners() {
        // Date range filters
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        
        if (startDate) {
            startDate.addEventListener('change', (e) => {
                this.filters.dateRange.start = e.target.value;
                this.applyFilters();
            });
        }

        if (endDate) {
            endDate.addEventListener('change', (e) => {
                this.filters.dateRange.end = e.target.value;
                this.applyFilters();
            });
        }

        // Checkbox filters
        ['regionFilters', 'peopleFilters', 'companyFilters'].forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.addEventListener('change', (e) => {
                    if (e.target.type === 'checkbox') {
                        this.updateCheckboxFilters(containerId);
                    }
                });
            }
        });

        // Numeric range filter
        document.addEventListener('change', (e) => {
            if (e.target.id === 'numericFieldSelect') {
                this.updateNumericRangeFilter();
            }
        });

        document.addEventListener('input', (e) => {
            if (e.target.id === 'numericMin' || e.target.id === 'numericMax') {
                this.updateNumericRangeFilter();
            }
        });
    }

    updateCheckboxFilters(containerId) {
        const container = document.getElementById(containerId);
        const checkedValues = Array.from(container.querySelectorAll('input:checked')).map(cb => cb.value);
        
        switch (containerId) {
            case 'regionFilters':
                this.filters.regions = checkedValues;
                break;
            case 'peopleFilters':
                this.filters.people = checkedValues;
                break;
            case 'companyFilters':
                this.filters.companies = checkedValues;
                break;
        }
        
        this.applyFilters();
    }

    updateNumericRangeFilter() {
        const field = document.getElementById('numericFieldSelect').value;
        const min = document.getElementById('numericMin').value;
        const max = document.getElementById('numericMax').value;
        
        if (field) {
            this.filters.numericRange = {
                field: field,
                min: min ? parseFloat(min) : null,
                max: max ? parseFloat(max) : null
            };
        } else {
            this.filters.numericRange = { min: null, max: null };
        }
        
        this.applyFilters();
    }

    applyFilters() {
        // This would filter the data and update all charts
        // For now, just log the filters
        console.log('Applying filters:', this.filters);
        
        // In a real implementation, you would:
        // 1. Filter the cleanedData based on current filters
        // 2. Update all chart widgets with filtered data
        // 3. Re-render charts with new data
    }

    initializeCanvasListeners() {
        const canvas = document.getElementById('canvasGrid');
        
        if (!canvas) {
            console.error('Canvas grid not found');
            return;
        }
        
        // Drag and drop
        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            canvas.classList.add('drag-over');
        });

        canvas.addEventListener('dragleave', (e) => {
            canvas.classList.remove('drag-over');
        });

        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            canvas.classList.remove('drag-over');
            
            const chartId = e.dataTransfer.getData('text/plain');
            if (chartId) {
                this.addChartToCanvas(chartId);
            }
        });

        // Widget selection
        canvas.addEventListener('click', (e) => {
            const widget = e.target.closest('.chart-widget, .text-widget');
            if (widget) {
                this.selectWidget(widget);
            } else {
                this.deselectWidget();
            }
        });
    }

    addChartToCanvas(chartId) {
        const chart = this.visualLibrary.find(c => c.id === chartId);
        if (!chart) return;

        const widget = this.createChartWidget(chart);
        document.getElementById('canvasGrid').appendChild(widget);
        
        this.dashboardCharts.push({
            id: Date.now().toString(),
            chartId: chartId,
            chart: chart,
            element: widget
        });

        this.updateCanvasInfo();
    }

    createChartWidget(chart) {
        const widget = document.createElement('div');
        widget.className = 'chart-widget';
        widget.dataset.chartId = chart.id;
        
        widget.innerHTML = `
            <div class="chart-widget-header">
                <h4 class="chart-widget-title">${chart.title}</h4>
                <div class="chart-widget-actions">
                    <button class="chart-widget-action edit" title="Edit Properties">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11 4H4C3.44772 4 3 4.44772 3 5V19C3 19.5523 3.44772 20 4 20H18C18.5523 20 19 19.5523 19 19V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <button class="chart-widget-action delete" title="Delete">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="chart-widget-content">
                <div class="chart-widget-chart" id="chart-${chart.id}">
                    <div class="loading">Loading chart...</div>
                </div>
            </div>
            <div class="chart-widget-resize"></div>
        `;

        // Add event listeners
        widget.querySelector('.edit').addEventListener('click', (e) => {
            e.stopPropagation();
            this.editWidget(widget);
        });

        widget.querySelector('.delete').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteWidget(widget);
        });

        // Render the chart
        this.renderChartInWidget(widget, chart);

        return widget;
    }

    renderChartInWidget(widget, chart) {
        const chartContainer = widget.querySelector('.chart-widget-chart');
        
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            chartContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #6b7280; text-align: center; padding: 1rem;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📊</div>
                    <div style="font-weight: 500; margin-bottom: 0.25rem;">${chart.title}</div>
                    <div style="font-size: 0.875rem;">${chart.type.toUpperCase()} Chart</div>
                    <div style="font-size: 0.75rem; margin-top: 0.5rem; opacity: 0.7;">Chart.js not loaded</div>
                </div>
            `;
            return;
        }

        const canvas = document.createElement('canvas');
        chartContainer.innerHTML = '';
        chartContainer.appendChild(canvas);

        try {
            const ctx = canvas.getContext('2d');
            
            // Apply current theme and formatting
            const config = this.getChartConfig(chart);
            
            new Chart(ctx, config);
        } catch (error) {
            console.error('Error rendering chart:', error);
            chartContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #ef4444; text-align: center; padding: 1rem;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚠️</div>
                    <div style="font-weight: 500; margin-bottom: 0.25rem;">Chart Error</div>
                    <div style="font-size: 0.875rem;">Failed to render chart</div>
                </div>
            `;
        }
    }

    getChartConfig(chart) {
        const baseConfig = {
            type: this.getChartType(chart.type),
            data: chart.data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: chart.type !== 'pie',
                        labels: {
                            color: this.currentTheme === 'dark' ? '#f9fafb' : '#374151',
                            font: {
                                size: this.currentFontSize
                            }
                        }
                    },
                    title: {
                        display: false
                    }
                }
            }
        };

        // Apply number formatting
        if (chart.type !== 'pie' && chart.type !== 'table') {
            baseConfig.options.scales = {
                y: {
                    ticks: {
                        callback: (value) => this.formatNumber(value),
                        color: this.currentTheme === 'dark' ? '#f9fafb' : '#374151',
                        font: {
                            size: this.currentFontSize
                        }
                    }
                },
                x: {
                    ticks: {
                        color: this.currentTheme === 'dark' ? '#f9fafb' : '#374151',
                        font: {
                            size: this.currentFontSize
                        }
                    }
                }
            };
        }

        return baseConfig;
    }

    getChartType(type) {
        switch (type) {
            case 'bar': return 'bar';
            case 'line': return 'line';
            case 'pie': return 'pie';
            case 'table': return 'table';
            case 'kpi': return 'kpi';
            default: return 'bar';
        }
    }

    formatNumber(value) {
        switch (this.currentNumberFormat) {
            case 'thousands':
                return (value / 1000).toFixed(1) + 'K';
            case 'millions':
                return (value / 1000000).toFixed(1) + 'M';
            case 'percentages':
                return value + '%';
            case 'currency':
                return '$' + value.toLocaleString();
            default:
                return value.toLocaleString();
        }
    }

    addTextWidget() {
        const widget = document.createElement('div');
        widget.className = 'text-widget';
        widget.dataset.widgetId = Date.now().toString();
        
        widget.innerHTML = `
            <textarea class="text-widget-content" placeholder="Enter text...">New Text Block</textarea>
        `;

        document.getElementById('canvasGrid').appendChild(widget);
        this.selectWidget(widget);
        
        // Focus the textarea
        const textarea = widget.querySelector('.text-widget-content');
        textarea.focus();
        textarea.select();
    }

    selectWidget(widget) {
        this.deselectWidget();
        widget.classList.add('selected');
        this.selectedWidget = widget;
    }

    deselectWidget() {
        document.querySelectorAll('.chart-widget, .text-widget').forEach(w => {
            w.classList.remove('selected');
        });
        this.selectedWidget = null;
        this.closePropertiesPanel();
    }

    editWidget(widget) {
        this.selectWidget(widget);
        this.openPropertiesPanel();
    }

    openPropertiesPanel() {
        const panel = document.getElementById('propertiesPanel');
        panel.style.display = 'block';
        panel.classList.add('open');
        
        if (this.selectedWidget) {
            this.populatePropertiesPanel();
        }
    }

    closePropertiesPanel() {
        const panel = document.getElementById('propertiesPanel');
        panel.classList.remove('open');
        setTimeout(() => {
            panel.style.display = 'none';
        }, 300);
    }

    populatePropertiesPanel() {
        if (!this.selectedWidget) return;

        const title = this.selectedWidget.querySelector('.chart-widget-title')?.textContent || '';
        document.getElementById('chartTitleInput').value = title;
    }

    applyProperties() {
        if (!this.selectedWidget) return;

        const title = document.getElementById('chartTitleInput').value;
        const backgroundColor = document.getElementById('backgroundColorInput').value;
        const borderColor = document.getElementById('borderColorInput').value;
        const padding = document.getElementById('paddingSlider').value;
        const fontSize = document.getElementById('chartFontSizeSlider').value;

        // Update widget appearance
        this.selectedWidget.style.backgroundColor = backgroundColor;
        this.selectedWidget.style.borderColor = borderColor;
        this.selectedWidget.style.padding = padding + 'px';
        this.selectedWidget.style.fontSize = fontSize + 'px';

        // Update title if it's a chart widget
        const titleElement = this.selectedWidget.querySelector('.chart-widget-title');
        if (titleElement) {
            titleElement.textContent = title;
        }

        this.closePropertiesPanel();
    }

    deleteSelectedWidget() {
        if (!this.selectedWidget) return;
        this.deleteWidget(this.selectedWidget);
    }

    deleteWidget(widget) {
        widget.remove();
        this.deselectWidget();
        this.updateCanvasInfo();
    }

    clearCanvas() {
        if (confirm('Are you sure you want to clear the canvas? This will remove all charts and text blocks.')) {
            document.getElementById('canvasGrid').innerHTML = '';
            this.dashboardCharts = [];
            this.updateCanvasInfo();
        }
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        // Update mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Update canvas based on mode
        const canvas = document.getElementById('dashboardCanvas');
        if (mode === 'preview') {
            canvas.classList.add('preview-mode');
            // Hide edit controls
            document.querySelectorAll('.chart-widget-actions, .chart-widget-resize').forEach(el => {
                el.style.display = 'none';
            });
        } else {
            canvas.classList.remove('preview-mode');
            // Show edit controls
            document.querySelectorAll('.chart-widget-actions, .chart-widget-resize').forEach(el => {
                el.style.display = '';
            });
        }
    }

    setColumns(columns) {
        this.currentColumns = columns;
        
        // Update column buttons
        document.querySelectorAll('.column-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.columns) === columns);
        });

        // Update grid
        const grid = document.getElementById('canvasGrid');
        grid.className = `canvas-grid columns-${columns}`;
    }

    setSpacing(spacing) {
        this.currentSpacing = spacing;
        
        // Update slider value display
        document.querySelector('#spacingSlider + .slider-value').textContent = spacing + 'px';
        
        // Update grid gap
        const grid = document.getElementById('canvasGrid');
        grid.style.gap = spacing + 'px';
    }

    setTheme(theme) {
        this.currentTheme = theme;
        
        const editor = document.querySelector('.dashboard-editor');
        editor.classList.toggle('dark-mode', theme === 'dark');
        
        // Re-render all charts with new theme
        this.rerenderAllCharts();
    }

    setNumberFormat(format) {
        this.currentNumberFormat = format;
        this.rerenderAllCharts();
    }

    setFontSize(size) {
        this.currentFontSize = size;
        
        // Update slider value display
        document.querySelector('#fontSizeSlider + .slider-value').textContent = size + 'px';
        
        // Update all widgets
        document.querySelectorAll('.chart-widget, .text-widget').forEach(widget => {
            widget.style.fontSize = size + 'px';
        });
        
        this.rerenderAllCharts();
    }

    rerenderAllCharts() {
        this.dashboardCharts.forEach(dashboardChart => {
            const widget = dashboardChart.element;
            const chart = dashboardChart.chart;
            this.renderChartInWidget(widget, chart);
        });
    }

    toggleFilters() {
        const panel = document.getElementById('filtersPanel');
        const button = document.getElementById('toggleFilters');
        
        if (panel.style.display === 'none') {
            panel.style.display = 'flex';
            button.textContent = 'Hide';
        } else {
            panel.style.display = 'none';
            button.textContent = 'Show';
        }
    }

    updateCanvasInfo() {
        const count = this.dashboardCharts.length;
        document.getElementById('canvasInfo').textContent = `${count} chart${count !== 1 ? 's' : ''} on canvas`;
    }

    goToPreviousStep() {
        window.location.href = 'step3.html';
    }

    goToNextStep() {
        // Store dashboard configuration
        const dashboardConfig = {
            charts: this.dashboardCharts.map(dc => ({
                id: dc.id,
                chartId: dc.chartId,
                position: this.getWidgetPosition(dc.element),
                properties: this.getWidgetProperties(dc.element)
            })),
            layout: {
                columns: this.currentColumns,
                spacing: this.currentSpacing,
                theme: this.currentTheme,
                numberFormat: this.currentNumberFormat,
                fontSize: this.currentFontSize
            },
            filters: this.filters
        };

        localStorage.setItem('dashboardConfig', JSON.stringify(dashboardConfig));
        
        alert('Dashboard layout saved! This would proceed to Export & Publish in the full application.');
        // window.location.href = 'step5.html';
    }

    getWidgetPosition(widget) {
        const rect = widget.getBoundingClientRect();
        const grid = document.getElementById('canvasGrid');
        const gridRect = grid.getBoundingClientRect();
        
        return {
            x: rect.left - gridRect.left,
            y: rect.top - gridRect.top,
            width: rect.width,
            height: rect.height
        };
    }

    getWidgetProperties(widget) {
        return {
            backgroundColor: widget.style.backgroundColor || '#ffffff',
            borderColor: widget.style.borderColor || '#e5e7eb',
            padding: widget.style.padding || '16px',
            fontSize: widget.style.fontSize || '14px'
        };
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #ef4444;
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            max-width: 400px;
            text-align: center;
        `;
        
        errorDiv.innerHTML = `
            <div style="color: #ef4444; font-size: 1.5rem; margin-bottom: 1rem;">⚠️</div>
            <h3 style="color: #1f2937; margin-bottom: 1rem;">Dashboard Loading Issue</h3>
            <p style="color: #6b7280; margin-bottom: 1.5rem;">${message}</p>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button onclick="window.location.href='step3.html'" style="
                    background: #1aa7ee;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                ">Go to Chart Generator</button>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: #f3f4f6;
                    color: #374151;
                    border: 1px solid #d1d5db;
                    padding: 0.75rem 1.5rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                ">Close</button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 10000);
    }
}

// Initialize the dashboard editor when the page loads
document.addEventListener('DOMContentLoaded', function() {
    new DashboardEditor();
});
