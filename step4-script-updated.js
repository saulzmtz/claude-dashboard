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
        this.initializeNavigation();
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

    initializeNavigation() {
        // Make Dataize title clickable to go home
        const appTitle = document.querySelector('.app-title');
        if (appTitle) {
            appTitle.style.cursor = 'pointer';
            appTitle.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }
        
        // Make step buttons clickable
        const stepButtons = document.querySelectorAll('.step[data-step]');
        stepButtons.forEach(step => {
            step.addEventListener('click', (e) => {
                const stepNumber = parseInt(step.dataset.step);
                this.navigateToStep(stepNumber);
            });
        });
    }

    navigateToStep(stepNumber) {
        switch(stepNumber) {
            case 1:
                window.location.href = 'index.html';
                break;
            case 2:
                window.location.href = 'step2.html';
                break;
            case 3:
                window.location.href = 'step3.html';
                break;
            case 4:
                // Already on step 4
                break;
        }
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
        const companies = [...new Set(this.cleanedData.map(row => row.Company || row.company).filter(Boolean))];

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
        if (!container) return;

        container.innerHTML = '';
        values.slice(0, 10).forEach(value => { // Limit to first 10 values
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
        const numericFields = Object.keys(this.columnTypes).filter(col => this.columnTypes[col] === 'number');
        const fieldSelect = document.getElementById('numericFieldSelect');
        
        if (fieldSelect) {
            fieldSelect.innerHTML = '<option value="">Select field...</option>';
            numericFields.forEach(field => {
                fieldSelect.innerHTML += `<option value="${field}">${field}</option>`;
            });
        }

        // Add range inputs
        const rangeContainer = document.getElementById('numericRangeContainer');
        if (rangeContainer) {
            rangeContainer.innerHTML = `
                <div class="range-inputs">
                    <input type="number" id="numericMin" class="range-input" placeholder="Min">
                    <input type="number" id="numericMax" class="range-input" placeholder="Max">
                </div>
            `;
        }
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
        const field = document.getElementById('numericFieldSelect')?.value;
        const min = document.getElementById('numericMin')?.value;
        const max = document.getElementById('numericMax')?.value;
        
        if (field) {
            this.filters.numericRange = {
                field: field,
                min: min ? parseFloat(min) : null,
                max: max ? parseFloat(max) : null
            };
        }
        
        this.applyFilters();
    }

    applyFilters() {
        // This would implement the actual filtering logic
        // For now, just log the current filters
        console.log('Applying filters:', this.filters);
        
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
        const canvas = document.getElementById('canvasGrid');
        canvas.appendChild(widget);
        
        this.dashboardCharts.push({
            id: chartId,
            widget: widget,
            chart: chart
        });
        
        this.updateCanvasInfo();
    }

    createChartWidget(chart) {
        const widget = document.createElement('div');
        widget.className = 'chart-widget';
        widget.dataset.chartId = chart.id;
        
        widget.innerHTML = `
            <div class="chart-widget-header">
                <h3 class="chart-widget-title">${chart.title}</h3>
                <div class="chart-widget-actions">
                    <button class="chart-widget-action edit" title="Edit">✏️</button>
                    <button class="chart-widget-action delete" title="Delete">🗑️</button>
                </div>
            </div>
            <div class="chart-widget-content">
                <div class="chart-widget-chart"></div>
            </div>
            <div class="chart-widget-resize"></div>
        `;
        
        // Add event listeners
        widget.querySelector('.chart-widget-action.edit').addEventListener('click', () => {
            this.openPropertiesPanel(widget);
        });
        
        widget.querySelector('.chart-widget-action.delete').addEventListener('click', () => {
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
                        display: chart.type !== 'pie'
                    },
                    title: {
                        display: false
                    }
                }
            }
        };

        // Apply theme
        if (this.currentTheme === 'dark') {
            baseConfig.options.plugins.legend.labels = {
                color: '#f9fafb'
            };
        }

        return baseConfig;
    }

    getChartType(type) {
        switch (type) {
            case 'bar':
                return 'bar';
            case 'line':
                return 'line';
            case 'pie':
                return 'pie';
            case 'table':
                return 'table';
            case 'kpi':
                return 'kpi';
            default:
                return 'bar';
        }
    }

    addTextWidget() {
        const widget = document.createElement('div');
        widget.className = 'text-widget';
        widget.innerHTML = `
            <textarea class="text-widget-content" placeholder="Enter text..."></textarea>
        `;
        
        const canvas = document.getElementById('canvasGrid');
        canvas.appendChild(widget);
        
        this.dashboardCharts.push({
            id: 'text_' + Date.now(),
            widget: widget,
            type: 'text'
        });
        
        this.updateCanvasInfo();
    }

    selectWidget(widget) {
        this.deselectWidget();
        this.selectedWidget = widget;
        widget.classList.add('selected');
        this.openPropertiesPanel(widget);
    }

    deselectWidget() {
        if (this.selectedWidget) {
            this.selectedWidget.classList.remove('selected');
            this.selectedWidget = null;
        }
        this.closePropertiesPanel();
    }

    deleteWidget(widget) {
        if (confirm('Are you sure you want to delete this widget?')) {
            widget.remove();
            this.dashboardCharts = this.dashboardCharts.filter(item => item.widget !== widget);
            this.updateCanvasInfo();
        }
    }

    openPropertiesPanel(widget) {
        const panel = document.getElementById('propertiesPanel');
        if (panel) {
            panel.classList.add('open');
        }
    }

    closePropertiesPanel() {
        const panel = document.getElementById('propertiesPanel');
        if (panel) {
            panel.classList.remove('open');
        }
    }

    applyProperties() {
        // Apply properties from the properties panel
        console.log('Applying properties...');
        this.closePropertiesPanel();
    }

    deleteSelectedWidget() {
        if (this.selectedWidget) {
            this.deleteWidget(this.selectedWidget);
        }
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        // Update mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
        
        // Update canvas based on mode
        const canvas = document.getElementById('canvasGrid');
        if (mode === 'preview') {
            canvas.classList.add('preview-mode');
        } else {
            canvas.classList.remove('preview-mode');
        }
    }

    setColumns(columns) {
        this.currentColumns = columns;
        
        // Update column buttons
        document.querySelectorAll('.column-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-columns="${columns}"]`).classList.add('active');
        
        // Update canvas grid
        const canvas = document.getElementById('canvasGrid');
        canvas.className = `canvas-grid columns-${columns}`;
    }

    setSpacing(spacing) {
        this.currentSpacing = spacing;
        const canvas = document.getElementById('canvasGrid');
        canvas.style.gap = `${spacing}px`;
    }

    setTheme(theme) {
        this.currentTheme = theme;
        const editor = document.querySelector('.dashboard-editor');
        
        if (theme === 'dark') {
            editor.classList.add('dark-mode');
        } else {
            editor.classList.remove('dark-mode');
        }
    }

    setNumberFormat(format) {
        this.currentNumberFormat = format;
        // Update number formatting in charts
        console.log('Number format changed to:', format);
    }

    setFontSize(size) {
        this.currentFontSize = size;
        document.documentElement.style.setProperty('--base-font-size', `${size}px`);
    }

    toggleFilters() {
        const filtersPanel = document.getElementById('filtersPanel');
        if (filtersPanel) {
            filtersPanel.style.display = filtersPanel.style.display === 'none' ? 'block' : 'none';
        }
    }

    clearCanvas() {
        if (confirm('Are you sure you want to clear all widgets from the canvas?')) {
            const canvas = document.getElementById('canvasGrid');
            canvas.innerHTML = '';
            this.dashboardCharts = [];
            this.updateCanvasInfo();
        }
    }

    updateCanvasInfo() {
        const info = document.getElementById('canvasInfo');
        if (info) {
            info.textContent = `${this.dashboardCharts.length} widgets on canvas`;
        }
    }

    goToPreviousStep() {
        // Go back to Step 3
        window.location.href = 'step3.html';
    }

    goToNextStep() {
        // This would be "Export & Publish" in the full application
        alert('Export & Publish functionality would be implemented here in the full application.');
    }

    showError(message) {
        // Create a more user-friendly error message
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
            <h3 style="color: #1f2937; margin-bottom: 1rem;">Data Loading Issue</h3>
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
                ">Go to Chart Creation</button>
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
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 10000);
    }
}

// Initialize the dashboard editor when the page loads
document.addEventListener('DOMContentLoaded', function() {
    window.dashboardEditor = new DashboardEditor();
});
