// Step 3: Chart Generator Module
class ChartGenerator {
    constructor() {
        this.cleanedData = null;
        this.columnTypes = {};
        this.currentStep = 1;
        this.totalSteps = 4;
        this.visualLibrary = [];
        this.currentChart = {
            metric: null,
            grouping: null,
            chartType: null,
            title: '',
            config: {}
        };
        
        this.initializeEventListeners();
        this.initializeNavigation();
        this.loadDataFromStep2();
    }

    initializeEventListeners() {
        // Navigation
        document.getElementById('prevBtn').addEventListener('click', () => this.goToPreviousStep());
        document.getElementById('nextBtn').addEventListener('click', () => this.goToNextStep());

        // Step 1: Metric Selection
        document.getElementById('nextToStep2').addEventListener('click', () => this.goToStep(2));

        // Step 2: Grouping Selection
        document.getElementById('backToStep1').addEventListener('click', () => this.goToStep(1));
        document.getElementById('nextToStep3').addEventListener('click', () => this.goToStep(3));

        // Step 3: Chart Type Selection
        document.getElementById('backToStep2').addEventListener('click', () => this.goToStep(2));
        document.getElementById('nextToStep4').addEventListener('click', () => this.goToStep(4));

        // Step 4: Preview and Save
        document.getElementById('backToStep3').addEventListener('click', () => this.goToStep(3));
        document.getElementById('saveChart').addEventListener('click', () => this.saveChart());

        // Create Another Chart
        document.getElementById('createNewChart').addEventListener('click', () => this.createNewChart());

        // Metric type tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchMetricType(e.target.dataset.type));
        });

        // Field selection
        document.addEventListener('change', (e) => {
            if (e.target.type === 'radio' && e.target.name === 'metricField') {
                this.updateMetricSelection();
            } else if (e.target.type === 'radio' && e.target.name === 'groupingField') {
                this.updateGroupingSelection();
            } else if (e.target.type === 'radio' && e.target.name === 'calculated') {
                this.updateCalculatedSelection();
            }
        });

        // Chart type selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.chart-option')) {
                this.selectChartType(e.target.closest('.chart-option').dataset.type);
            }
        });

        // Chart title editing
        document.getElementById('chartTitle').addEventListener('input', (e) => {
            this.currentChart.title = e.target.value;
        });
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
                // Already on step 3
                break;
            case 4:
                if (this.visualLibrary.length > 0) {
                    // Store visual library and navigate to step 4
                    localStorage.setItem('visualLibrary', JSON.stringify(this.visualLibrary));
                    window.location.href = 'step4.html';
                } else {
                    alert('Please create at least one chart before proceeding to Step 4.');
                }
                break;
        }
    }

    loadDataFromStep2() {
        // Try to load data with retry mechanism
        this.attemptDataLoad(0);
    }

    attemptDataLoad(attempt) {
        const maxAttempts = 5;
        const delay = attempt * 200; // 0ms, 200ms, 400ms, 600ms, 800ms
        const self = this; // Store reference to this

        setTimeout(() => {
            try {
                // Debug: Check all localStorage keys
                console.log('All localStorage keys:', Object.keys(localStorage));
                console.log('localStorage contents:', {
                    dashboardData: localStorage.getItem('dashboardData') ? 'exists' : 'missing',
                    cleanedData: localStorage.getItem('cleanedData') ? 'exists' : 'missing',
                    columnTypes: localStorage.getItem('columnTypes') ? 'exists' : 'missing',
                    visualLibrary: localStorage.getItem('visualLibrary') ? 'exists' : 'missing'
                });
                
                const storedData = localStorage.getItem('cleanedData');
                const storedTypes = localStorage.getItem('columnTypes');
                
                console.log('Attempt', attempt + 1, 'to load data:', {
                    hasCleanedData: !!storedData,
                    hasColumnTypes: !!storedTypes,
                    cleanedDataLength: storedData ? JSON.parse(storedData).length : 0
                });
                
                if (!storedData) {
                    if (attempt < maxAttempts - 1) {
                        console.log('No data found, retrying...');
                        this.attemptDataLoad(attempt + 1);
                        return;
                    } else {
                        // Try fallback: load original data from Step 1
                        console.log('Trying fallback: loading original data from Step 1');
                        const fallbackData = localStorage.getItem('dashboardData');
                        const fallbackTypes = localStorage.getItem('columnTypes');
                        
                        if (fallbackData) {
                            console.log('Using fallback data from Step 1');
                            self.cleanedData = JSON.parse(fallbackData);
                            self.columnTypes = JSON.parse(fallbackTypes || '{}');
                            self.visualLibrary = JSON.parse(localStorage.getItem('visualLibrary') || '[]');
                            
                            // Store as cleaned data for consistency
                            localStorage.setItem('cleanedData', JSON.stringify(self.cleanedData));
                            localStorage.setItem('columnTypes', JSON.stringify(self.columnTypes));
                            
                            self.updateDataSummary();
                            self.populateFieldOptions();
                            self.updateVisualLibrary();
                            self.goToStep(1);
                            return;
                        } else {
                            self.showError('No cleaned data found from Step 2. Please go back and clean your data first.');
                            return;
                        }
                    }
                }

                self.cleanedData = JSON.parse(storedData);
                self.columnTypes = JSON.parse(storedTypes || '{}');
                self.visualLibrary = JSON.parse(localStorage.getItem('visualLibrary') || '[]');
                
                console.log('Data loaded successfully:', {
                    rows: self.cleanedData.length,
                    columns: Object.keys(self.cleanedData[0] || {}).length,
                    types: Object.keys(self.columnTypes).length
                });
                
                self.updateDataSummary();
                self.populateFieldOptions();
                self.updateVisualLibrary();
                self.goToStep(1);
                
            } catch (error) {
                console.error('Error loading data on attempt', attempt + 1, ':', error);
                if (attempt < maxAttempts - 1) {
                    self.attemptDataLoad(attempt + 1);
                } else {
                    self.showError('Error loading cleaned data from Step 2. Please try cleaning your data again.');
                }
            }
        }, delay);
    }

    updateDataSummary() {
        if (!this.cleanedData || this.cleanedData.length === 0) return;

        const totalRows = this.cleanedData.length;
        const totalColumns = Object.keys(this.cleanedData[0]).length;
        const chartsCreated = this.visualLibrary.length;

        document.getElementById('totalRows').textContent = totalRows.toLocaleString();
        document.getElementById('totalColumns').textContent = totalColumns;
        document.getElementById('chartsCreated').textContent = chartsCreated;
    }

    populateFieldOptions() {
        if (!this.cleanedData || this.cleanedData.length === 0) return;

        const columns = Object.keys(this.cleanedData[0]);
        const numericFields = columns.filter(col => this.columnTypes[col] === 'number');
        const categoricalFields = columns.filter(col => this.columnTypes[col] === 'string');

        // Populate numeric fields for metric selection
        this.populateFieldGrid('numericFields', numericFields, 'metricField');

        // Populate categorical fields for grouping
        this.populateFieldGrid('categoricalFields', categoricalFields, 'groupingField');

        // Populate calculated field options
        this.populateCalculatedFields(numericFields, categoricalFields);
    }

    populateFieldGrid(containerId, fields, name) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        fields.forEach(field => {
            const fieldOption = document.createElement('div');
            fieldOption.className = 'field-option';
            fieldOption.innerHTML = `
                <input type="radio" name="${name}" value="${field}" id="${name}_${field}">
                <label for="${name}_${field}" class="field-info">
                    <div class="field-name">${field}</div>
                    <div class="field-type">${this.columnTypes[field]}</div>
                </label>
            `;
            container.appendChild(fieldOption);
        });
    }

    populateCalculatedFields(numericFields, categoricalFields) {
        // Average field
        const averageField = document.getElementById('averageField');
        averageField.innerHTML = '<option value="">Select field...</option>';
        numericFields.forEach(field => {
            averageField.innerHTML += `<option value="${field}">${field}</option>`;
        });

        // Sum field
        const sumField = document.getElementById('sumField');
        sumField.innerHTML = '<option value="">Select field...</option>';
        numericFields.forEach(field => {
            sumField.innerHTML += `<option value="${field}">${field}</option>`;
        });

        // Text field
        const textField = document.getElementById('textField');
        textField.innerHTML = '<option value="">Select field...</option>';
        categoricalFields.forEach(field => {
            textField.innerHTML += `<option value="${field}">${field}</option>`;
        });
    }

    switchMetricType(type) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-type="${type}"]`).classList.add('active');

        // Update metric options
        document.querySelectorAll('.metric-option').forEach(option => option.classList.remove('active'));
        document.getElementById(`${type}Option`).classList.add('active');

        this.updateMetricSelection();
    }

    updateMetricSelection() {
        const selectedField = document.querySelector('input[name="metricField"]:checked');
        const selectedCalculated = document.querySelector('input[name="calculated"]:checked');
        
        if (selectedField) {
            this.currentChart.metric = {
                type: 'field',
                field: selectedField.value
            };
            document.getElementById('nextToStep2').disabled = false;
        } else if (selectedCalculated) {
            const calcType = selectedCalculated.value;
            const fieldSelect = document.getElementById(`${calcType}Field`);
            
            if (fieldSelect.value) {
                this.currentChart.metric = {
                    type: 'calculated',
                    calculation: calcType,
                    field: fieldSelect.value
                };
                document.getElementById('nextToStep2').disabled = false;
            } else {
                document.getElementById('nextToStep2').disabled = true;
            }
        } else {
            document.getElementById('nextToStep2').disabled = true;
        }
    }

    updateCalculatedSelection() {
        this.updateMetricSelection();
    }

    updateGroupingSelection() {
        const selectedGrouping = document.querySelector('input[name="groupingField"]:checked');
        
        if (selectedGrouping) {
            this.currentChart.grouping = {
                field: selectedGrouping.value,
                showOthers: document.getElementById('showOthers').checked,
                limitGroups: document.getElementById('limitGroups').checked,
                groupLimit: parseInt(document.getElementById('groupLimit').value) || 10
            };
            document.getElementById('nextToStep3').disabled = false;
        } else {
            document.getElementById('nextToStep3').disabled = true;
        }
    }

    selectChartType(type) {
        // Update visual selection
        document.querySelectorAll('.chart-option').forEach(option => option.classList.remove('selected'));
        document.querySelector(`[data-type="${type}"]`).classList.add('selected');

        this.currentChart.chartType = type;
        document.getElementById('nextToStep4').disabled = false;
    }

    goToStep(stepNumber) {
        // Hide all steps
        for (let i = 1; i <= this.totalSteps; i++) {
            const step = document.getElementById(`step${i}`);
            step.style.display = 'none';
            step.classList.remove('active');
        }

        // Show current step
        const currentStepElement = document.getElementById(`step${stepNumber}`);
        currentStepElement.style.display = 'block';
        currentStepElement.classList.add('active');

        this.currentStep = stepNumber;

        if (stepNumber === 4) {
            this.generateChartPreview();
        }

        this.updateNavigation();
    }

    generateChartPreview() {
        const previewContainer = document.getElementById('chartPreview');
        previewContainer.innerHTML = '<div class="preview-placeholder"><div class="loading-spinner"></div><p>Generating preview...</p></div>';

        // Set default title if empty
        if (!this.currentChart.title) {
            this.currentChart.title = this.generateDefaultTitle();
            document.getElementById('chartTitle').value = this.currentChart.title;
        }

        // Generate chart data
        const chartData = this.prepareChartData();
        
        setTimeout(() => {
            this.renderChart(chartData);
            this.updateChartSummary(chartData);
        }, 500);
    }

    generateDefaultTitle() {
        const { metric, grouping, chartType } = this.currentChart;
        let title = '';
        
        if (metric.type === 'field') {
            title = `${metric.field}`;
        } else if (metric.type === 'calculated') {
            title = `${metric.calculation} of ${metric.field}`;
        } else {
            title = 'Count of Records';
        }
        
        if (grouping) {
            title += ` by ${grouping.field}`;
        }
        
        return title;
    }

    prepareChartData() {
        const { metric, grouping } = this.currentChart;
        const data = this.cleanedData;
        
        // Group data
        const groups = {};
        data.forEach(row => {
            const groupKey = grouping ? row[grouping.field] || 'Unknown' : 'All';
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(row);
        });

        // Calculate metrics for each group
        const chartData = {
            labels: [],
            datasets: [{
                label: this.getMetricLabel(),
                data: [],
                backgroundColor: this.generateColors(Object.keys(groups).length)
            }]
        };

        Object.entries(groups).forEach(([group, rows]) => {
            chartData.labels.push(group);
            
            let value;
            if (metric.type === 'field') {
                value = this.calculateFieldMetric(rows, metric.field);
            } else if (metric.type === 'calculated') {
                value = this.calculateCalculatedMetric(rows, metric.calculation, metric.field);
            } else {
                value = rows.length;
            }
            
            chartData.datasets[0].data.push(value);
        });

        return chartData;
    }

    getMetricLabel() {
        const { metric } = this.currentChart;
        
        if (metric.type === 'field') {
            return metric.field;
        } else if (metric.type === 'calculated') {
            return `${metric.calculation} of ${metric.field}`;
        } else {
            return 'Count';
        }
    }

    calculateFieldMetric(rows, field) {
        const values = rows.map(row => parseFloat(row[field]) || 0);
        return values.reduce((sum, val) => sum + val, 0);
    }

    calculateCalculatedMetric(rows, calculation, field) {
        const values = rows.map(row => parseFloat(row[field]) || 0);
        
        switch (calculation) {
            case 'average':
                return values.reduce((sum, val) => sum + val, 0) / values.length;
            case 'sum':
                return values.reduce((sum, val) => sum + val, 0);
            case 'text':
                const textValues = rows.map(row => row[field] || '');
                return this.getMostCommonValue(textValues);
            default:
                return 0;
        }
    }

    getMostCommonValue(values) {
        const frequency = {};
        values.forEach(val => {
            frequency[val] = (frequency[val] || 0) + 1;
        });
        
        return Object.keys(frequency).reduce((a, b) => 
            frequency[a] > frequency[b] ? a : b
        );
    }

    generateColors(count) {
        const colors = [
            '#1aa7ee', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
            '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
        ];
        
        const result = [];
        for (let i = 0; i < count; i++) {
            result.push(colors[i % colors.length]);
        }
        return result;
    }

    renderChart(chartData) {
        const canvas = document.createElement('canvas');
        const previewContainer = document.getElementById('chartPreview');
        previewContainer.innerHTML = '';
        previewContainer.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const { chartType } = this.currentChart;

        const config = {
            type: this.getChartType(chartType),
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: chartType !== 'pie'
                    },
                    title: {
                        display: false
                    }
                }
            }
        };

        new Chart(ctx, config);
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

    updateChartSummary(chartData) {
        const summary = document.getElementById('chartSummary');
        const { metric, grouping, chartType } = this.currentChart;
        
        let summaryText = `This ${chartType} chart shows `;
        
        if (metric.type === 'field') {
            summaryText += `the ${metric.field} values`;
        } else if (metric.type === 'calculated') {
            summaryText += `the ${metric.calculation} of ${metric.field}`;
        } else {
            summaryText += 'the count of records';
        }
        
        if (grouping) {
            summaryText += ` grouped by ${grouping.field}`;
        }
        
        summaryText += `. The chart contains ${chartData.labels.length} groups.`;
        
        summary.innerHTML = `<h4>Chart Summary</h4><p>${summaryText}</p>`;
    }

    saveChart() {
        const chartData = this.prepareChartData();
        
        const chartConfig = {
            id: Date.now().toString(),
            title: this.currentChart.title,
            type: this.currentChart.chartType,
            metric: this.currentChart.metric,
            grouping: this.currentChart.grouping,
            data: chartData,
            createdAt: new Date().toISOString()
        };

        this.visualLibrary.push(chartConfig);
        localStorage.setItem('visualLibrary', JSON.stringify(this.visualLibrary));
        
        this.updateDataSummary();
        this.updateVisualLibrary();
        this.showSuccessMessage();
        this.showCreateAnother();
    }

    updateVisualLibrary() {
        const libraryGrid = document.getElementById('libraryGrid');
        const visualLibrary = document.getElementById('visualLibrary');
        
        if (this.visualLibrary.length === 0) {
            visualLibrary.style.display = 'none';
            return;
        }

        visualLibrary.style.display = 'block';
        libraryGrid.innerHTML = '';

        this.visualLibrary.forEach(chart => {
            const libraryItem = document.createElement('div');
            libraryItem.className = 'library-item';
            libraryItem.innerHTML = `
                <div class="library-item-header">
                    <h4 class="library-item-title">${chart.title}</h4>
                    <span class="library-item-type">${chart.type}</span>
                </div>
                <div class="library-item-preview">
                    <div class="loading-spinner"></div>
                </div>
                <div class="library-item-actions">
                    <button class="edit-btn" onclick="chartGenerator.editChart('${chart.id}')">Edit</button>
                    <button class="delete-btn" onclick="chartGenerator.deleteChart('${chart.id}')">Delete</button>
                </div>
            `;
            libraryGrid.appendChild(libraryItem);
        });
    }

    showSuccessMessage() {
        // Create temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        successDiv.textContent = 'Chart saved to library!';
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    showCreateAnother() {
        document.getElementById('createAnother').style.display = 'block';
        document.getElementById('nextBtn').disabled = false;
    }

    createNewChart() {
        // Reset current chart
        this.currentChart = {
            metric: null,
            grouping: null,
            chartType: null,
            title: '',
            config: {}
        };

        // Reset form
        document.querySelectorAll('input[type="radio"]').forEach(input => input.checked = false);
        document.querySelectorAll('input[type="checkbox"]').forEach(input => input.checked = false);
        document.getElementById('chartTitle').value = '';
        document.querySelectorAll('.chart-option').forEach(option => option.classList.remove('selected'));

        // Hide create another and library
        document.getElementById('createAnother').style.display = 'none';
        document.getElementById('visualLibrary').style.display = 'none';

        // Go back to step 1
        this.goToStep(1);
    }

    editChart(chartId) {
        const chart = this.visualLibrary.find(c => c.id === chartId);
        if (!chart) return;

        // Load chart configuration
        this.currentChart = {
            metric: chart.metric,
            grouping: chart.grouping,
            chartType: chart.type,
            title: chart.title,
            config: chart.config
        };

        // Update form with chart data
        this.populateFormWithChart(chart);

        // Go to step 4 to edit
        this.goToStep(4);
    }

    populateFormWithChart(chart) {
        // This would populate the form with the chart's configuration
        // For now, just go to preview step
        document.getElementById('chartTitle').value = chart.title;
    }

    deleteChart(chartId) {
        if (confirm('Are you sure you want to delete this chart?')) {
            this.visualLibrary = this.visualLibrary.filter(c => c.id !== chartId);
            localStorage.setItem('visualLibrary', JSON.stringify(this.visualLibrary));
            this.updateDataSummary();
            this.updateVisualLibrary();
        }
    }

    updateNavigation() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        prevBtn.disabled = this.currentStep === 1;
        
        if (this.currentStep === this.totalSteps && this.visualLibrary.length > 0) {
            nextBtn.disabled = false;
            nextBtn.textContent = 'Next Step';
        } else {
            nextBtn.disabled = this.currentStep < this.totalSteps || this.visualLibrary.length === 0;
        }
    }

    goToPreviousStep() {
        if (this.currentStep > 1) {
            this.goToStep(this.currentStep - 1);
        } else {
            // Go back to Step 2
            window.location.href = 'step2.html';
        }
    }

    goToNextStep() {
        if (this.currentStep === this.totalSteps && this.visualLibrary.length > 0) {
            // Store visual library for next step
            localStorage.setItem('visualLibrary', JSON.stringify(this.visualLibrary));
            
            // Navigate to Step 4: Dashboard Layout Editor
            window.location.href = 'step4.html';
        }
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
                <button onclick="window.location.href='step2.html'" style="
                    background: #1aa7ee;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                ">Go to Data Cleaning</button>
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

// Initialize the chart generator when the page loads
document.addEventListener('DOMContentLoaded', function() {
    window.chartGenerator = new ChartGenerator();
});
