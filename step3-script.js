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

    loadDataFromStep2() {
        try {
            const storedData = localStorage.getItem('cleanedData');
            const storedTypes = localStorage.getItem('columnTypes');
            
            if (!storedData) {
                this.showError('No cleaned data found from Step 2. Please go back and clean your data first.');
                return;
            }

            this.cleanedData = JSON.parse(storedData);
            this.columnTypes = JSON.parse(storedTypes || '{}');
            this.visualLibrary = JSON.parse(localStorage.getItem('visualLibrary') || '[]');
            
            this.updateDataSummary();
            this.populateFieldOptions();
            this.updateVisualLibrary();
            this.showStep(1);
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Error loading cleaned data from Step 2. Please try cleaning your data again.');
        }
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
            
            alert('Charts created successfully! This would proceed to Step 4: Dashboard Layout in the full application.');
            // window.location.href = 'step4.html';
        }
    }

    showError(message) {
        alert(message);
    }
}

// Initialize the chart generator when the page loads
document.addEventListener('DOMContentLoaded', function() {
    window.chartGenerator = new ChartGenerator();
});
