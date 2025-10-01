// Step 2: Data Cleaning Module
class DataCleaner {
    constructor() {
        this.originalData = null;
        this.cleanedData = null;
        this.currentStep = 1;
        this.totalSteps = 5;
        this.completedSteps = new Set();
        this.cleaningStats = {
            dateFormatsFixed: 0,
            whitespaceRemoved: 0,
            textCasingChanged: 0,
            currencyFormatted: 0,
            nullValuesHandled: 0
        };
        
        this.initializeEventListeners();
        this.loadDataFromStep1();
    }

    initializeEventListeners() {
        // Navigation
        document.getElementById('prevBtn').addEventListener('click', () => this.goToPreviousStep());
        document.getElementById('nextBtn').addEventListener('click', () => this.goToNextStep());

        // Step 1: Date Formats
        document.getElementById('skipDateBtn').addEventListener('click', () => this.skipStep(1));
        document.getElementById('applyDateBtn').addEventListener('click', () => this.applyDateFormats());

        // Step 2: Whitespace
        document.getElementById('skipWhitespaceBtn').addEventListener('click', () => this.skipStep(2));
        document.getElementById('applyWhitespaceBtn').addEventListener('click', () => this.applyWhitespaceRemoval());

        // Step 3: Text Casing
        document.getElementById('skipCasingBtn').addEventListener('click', () => this.skipStep(3));
        document.getElementById('applyCasingBtn').addEventListener('click', () => this.applyTextCasing());

        // Step 4: Currency
        document.getElementById('skipCurrencyBtn').addEventListener('click', () => this.skipStep(4));
        document.getElementById('applyCurrencyBtn').addEventListener('click', () => this.applyCurrencyFormatting());

        // Step 5: Null Values
        document.getElementById('skipNullBtn').addEventListener('click', () => this.skipStep(5));
        document.getElementById('applyNullBtn').addEventListener('click', () => this.applyNullValueHandling());
    }

    loadDataFromStep1() {
        try {
            const storedData = localStorage.getItem('dashboardData');
            const storedTypes = localStorage.getItem('columnTypes');
            
            if (!storedData) {
                this.showError('No data found from Step 1. Please go back and upload a CSV file first.');
                return;
            }

            this.originalData = JSON.parse(storedData);
            this.cleanedData = JSON.parse(storedData);
            this.columnTypes = JSON.parse(storedTypes || '{}');
            
            this.updateDataSummary();
            this.startCleaningProcess();
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Error loading data from Step 1. Please try uploading your CSV file again.');
        }
    }

    updateDataSummary() {
        if (!this.cleanedData || this.cleanedData.length === 0) return;

        const totalRows = this.cleanedData.length;
        const totalColumns = Object.keys(this.cleanedData[0]).length;
        const dataTypes = [...new Set(Object.values(this.columnTypes))].join(', ');

        document.getElementById('totalRows').textContent = totalRows.toLocaleString();
        document.getElementById('totalColumns').textContent = totalColumns;
        document.getElementById('dataTypes').textContent = dataTypes;
    }

    startCleaningProcess() {
        this.showStep(1);
        this.detectDateFormats();
    }

    showStep(stepNumber) {
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
        this.updateNavigation();
    }

    updateNavigation() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        prevBtn.disabled = this.currentStep === 1;
        
        if (this.currentStep === this.totalSteps && this.completedSteps.size === this.totalSteps) {
            nextBtn.disabled = false;
            nextBtn.textContent = 'Next Step';
        } else {
            nextBtn.disabled = this.currentStep < this.totalSteps;
        }
    }

    // Step 1: Fix Date Formats
    detectDateFormats() {
        const dateColumns = this.findDateColumns();
        const results = document.getElementById('dateDetectionResults');
        
        if (dateColumns.length === 0) {
            results.innerHTML = '<div class="detection-item"><span class="detection-column">No date columns detected</span><span class="detection-status no-issues">No action needed</span></div>';
            this.skipStep(1);
            return;
        }

        let html = '<h4>Date Columns Detected</h4>';
        let hasIssues = false;

        dateColumns.forEach(column => {
            const issues = this.analyzeDateColumn(column);
            const statusClass = issues.length > 0 ? 'issues-found' : 'no-issues';
            const statusText = issues.length > 0 ? `${issues.length} issues found` : 'Format consistent';
            
            html += `
                <div class="detection-item">
                    <span class="detection-column">${column}</span>
                    <span class="detection-status ${statusClass}">${statusText}</span>
                </div>
            `;
            
            if (issues.length > 0) hasIssues = true;
        });

        results.innerHTML = html;

        if (hasIssues) {
            this.showDatePreview();
            document.getElementById('applyDateBtn').style.display = 'inline-flex';
        } else {
            this.skipStep(1);
        }
    }

    findDateColumns() {
        const columns = Object.keys(this.cleanedData[0]);
        return columns.filter(column => this.columnTypes[column] === 'date');
    }

    analyzeDateColumn(column) {
        const issues = [];
        const sampleValues = this.cleanedData.slice(0, 10).map(row => row[column]).filter(val => val);
        
        if (sampleValues.length === 0) return issues;

        const datePatterns = [
            /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
            /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
            /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
            /^\d{1,2}\/\d{1,2}\/\d{4}$/, // M/D/YYYY
        ];

        sampleValues.forEach(value => {
            const isConsistent = datePatterns.some(pattern => pattern.test(value));
            if (!isConsistent) {
                issues.push(value);
            }
        });

        return issues;
    }

    showDatePreview() {
        const dateColumns = this.findDateColumns();
        const preview = document.getElementById('datePreview');
        const table = document.getElementById('datePreviewTable');
        
        if (dateColumns.length === 0) return;

        const sampleData = this.cleanedData.slice(0, 5);
        const columns = Object.keys(this.cleanedData[0]);
        
        let html = '<table><thead><tr>';
        columns.forEach(col => {
            html += `<th>${col}</th>`;
        });
        html += '</tr></thead><tbody>';

        sampleData.forEach(row => {
            html += '<tr>';
            columns.forEach(col => {
                const originalValue = row[col];
                let displayValue = originalValue;
                
                if (dateColumns.includes(col)) {
                    const normalized = this.normalizeDate(originalValue);
                    if (normalized !== originalValue) {
                        displayValue = `<span class="original">${originalValue}</span> <span class="arrow">→</span> <span class="changed">${normalized}</span>`;
                    }
                }
                
                html += `<td>${displayValue}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
        table.innerHTML = html;
        preview.style.display = 'block';
    }

    normalizeDate(dateString) {
        if (!dateString) return dateString;
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            
            return date.toISOString().split('T')[0]; // YYYY-MM-DD format
        } catch (error) {
            return dateString;
        }
    }

    applyDateFormats() {
        const dateColumns = this.findDateColumns();
        let changesCount = 0;

        this.cleanedData.forEach(row => {
            dateColumns.forEach(column => {
                const originalValue = row[column];
                const normalizedValue = this.normalizeDate(originalValue);
                if (normalizedValue !== originalValue) {
                    row[column] = normalizedValue;
                    changesCount++;
                }
            });
        });

        this.cleaningStats.dateFormatsFixed = changesCount;
        this.completeStep(1);
    }

    // Step 2: Remove Whitespace
    detectWhitespace() {
        const textColumns = this.findTextColumns();
        const results = document.getElementById('whitespaceDetectionResults');
        
        if (textColumns.length === 0) {
            results.innerHTML = '<div class="detection-item"><span class="detection-column">No text columns found</span><span class="detection-status no-issues">No action needed</span></div>';
            this.skipStep(2);
            return;
        }

        let html = '<h4>Text Columns Analyzed</h4>';
        let hasIssues = false;

        textColumns.forEach(column => {
            const issues = this.analyzeWhitespaceColumn(column);
            const statusClass = issues.length > 0 ? 'issues-found' : 'no-issues';
            const statusText = issues.length > 0 ? `${issues.length} values with whitespace` : 'No whitespace issues';
            
            html += `
                <div class="detection-item">
                    <span class="detection-column">${column}</span>
                    <span class="detection-status ${statusClass}">${statusText}</span>
                </div>
            `;
            
            if (issues.length > 0) hasIssues = true;
        });

        results.innerHTML = html;

        if (hasIssues) {
            this.showWhitespacePreview();
            document.getElementById('applyWhitespaceBtn').style.display = 'inline-flex';
        } else {
            this.skipStep(2);
        }
    }

    findTextColumns() {
        const columns = Object.keys(this.cleanedData[0]);
        return columns.filter(column => this.columnTypes[column] === 'string');
    }

    analyzeWhitespaceColumn(column) {
        const issues = [];
        const sampleValues = this.cleanedData.slice(0, 20).map(row => row[column]).filter(val => val);
        
        sampleValues.forEach(value => {
            if (value !== value.trim()) {
                issues.push(value);
            }
        });

        return issues;
    }

    showWhitespacePreview() {
        const textColumns = this.findTextColumns();
        const preview = document.getElementById('whitespacePreview');
        const table = document.getElementById('whitespacePreviewTable');
        
        const sampleData = this.cleanedData.slice(0, 5);
        const columns = Object.keys(this.cleanedData[0]);
        
        let html = '<table><thead><tr>';
        columns.forEach(col => {
            html += `<th>${col}</th>`;
        });
        html += '</tr></thead><tbody>';

        sampleData.forEach(row => {
            html += '<tr>';
            columns.forEach(col => {
                const originalValue = row[col];
                let displayValue = originalValue;
                
                if (textColumns.includes(col) && originalValue !== originalValue.trim()) {
                    displayValue = `<span class="original">"${originalValue}"</span> <span class="arrow">→</span> <span class="changed">"${originalValue.trim()}"</span>`;
                }
                
                html += `<td>${displayValue}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
        table.innerHTML = html;
        preview.style.display = 'block';
    }

    applyWhitespaceRemoval() {
        const textColumns = this.findTextColumns();
        let changesCount = 0;

        this.cleanedData.forEach(row => {
            textColumns.forEach(column => {
                const originalValue = row[column];
                const trimmedValue = originalValue ? originalValue.trim() : originalValue;
                if (trimmedValue !== originalValue) {
                    row[column] = trimmedValue;
                    changesCount++;
                }
            });
        });

        this.cleaningStats.whitespaceRemoved = changesCount;
        this.completeStep(2);
    }

    // Step 3: Text Casing
    setupTextCasing() {
        const textColumns = this.findTextColumns();
        const checkboxes = document.getElementById('textColumnCheckboxes');
        
        if (textColumns.length === 0) {
            this.skipStep(3);
            return;
        }

        let html = '';
        textColumns.forEach(column => {
            html += `
                <label class="column-checkbox">
                    <input type="checkbox" value="${column}">
                    <span>${column}</span>
                </label>
            `;
        });

        checkboxes.innerHTML = html;

        // Add event listeners to checkboxes
        checkboxes.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                const checkbox = e.target.closest('.column-checkbox');
                if (e.target.checked) {
                    checkbox.classList.add('selected');
                } else {
                    checkbox.classList.remove('selected');
                }
                this.updateCasingOptions();
            }
        });

        // Add event listeners to casing buttons
        document.querySelectorAll('.casing-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.casing-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateCasingPreview();
            });
        });
    }

    updateCasingOptions() {
        const selectedColumns = Array.from(document.querySelectorAll('.column-checkbox input:checked')).map(cb => cb.value);
        const options = document.getElementById('casingOptions');
        
        if (selectedColumns.length > 0) {
            options.style.display = 'block';
        } else {
            options.style.display = 'none';
            document.getElementById('casingPreview').style.display = 'none';
            document.getElementById('applyCasingBtn').style.display = 'none';
        }
    }

    updateCasingPreview() {
        const selectedColumns = Array.from(document.querySelectorAll('.column-checkbox input:checked')).map(cb => cb.value);
        const selectedCasing = document.querySelector('.casing-btn.active')?.dataset.casing;
        
        if (selectedColumns.length === 0 || !selectedCasing) return;

        this.showCasingPreview(selectedColumns, selectedCasing);
        document.getElementById('applyCasingBtn').style.display = 'inline-flex';
    }

    showCasingPreview(columns, casing) {
        const preview = document.getElementById('casingPreview');
        const table = document.getElementById('casingPreviewTable');
        
        const sampleData = this.cleanedData.slice(0, 5);
        const allColumns = Object.keys(this.cleanedData[0]);
        
        let html = '<table><thead><tr>';
        allColumns.forEach(col => {
            html += `<th>${col}</th>`;
        });
        html += '</tr></thead><tbody>';

        sampleData.forEach(row => {
            html += '<tr>';
            allColumns.forEach(col => {
                const originalValue = row[col];
                let displayValue = originalValue;
                
                if (columns.includes(col)) {
                    const transformed = this.transformCasing(originalValue, casing);
                    if (transformed !== originalValue) {
                        displayValue = `<span class="original">${originalValue}</span> <span class="arrow">→</span> <span class="changed">${transformed}</span>`;
                    }
                }
                
                html += `<td>${displayValue}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
        table.innerHTML = html;
        preview.style.display = 'block';
    }

    transformCasing(text, casing) {
        if (!text) return text;
        
        switch (casing) {
            case 'proper':
                return text.replace(/\w\S*/g, (txt) => 
                    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
                );
            case 'upper':
                return text.toUpperCase();
            case 'lower':
                return text.toLowerCase();
            default:
                return text;
        }
    }

    applyTextCasing() {
        const selectedColumns = Array.from(document.querySelectorAll('.column-checkbox input:checked')).map(cb => cb.value);
        const selectedCasing = document.querySelector('.casing-btn.active')?.dataset.casing;
        
        if (selectedColumns.length === 0 || !selectedCasing) return;

        let changesCount = 0;

        this.cleanedData.forEach(row => {
            selectedColumns.forEach(column => {
                const originalValue = row[column];
                const transformedValue = this.transformCasing(originalValue, selectedCasing);
                if (transformedValue !== originalValue) {
                    row[column] = transformedValue;
                    changesCount++;
                }
            });
        });

        this.cleaningStats.textCasingChanged = changesCount;
        this.completeStep(3);
    }

    // Step 4: Currency Formatting
    detectCurrency() {
        const amountColumns = this.findAmountColumns();
        const results = document.getElementById('currencyDetectionResults');
        
        if (amountColumns.length === 0) {
            results.innerHTML = '<div class="detection-item"><span class="detection-column">No amount columns detected</span><span class="detection-status no-issues">No action needed</span></div>';
            this.skipStep(4);
            return;
        }

        let html = '<h4>Amount Columns Detected</h4>';
        let hasIssues = false;

        amountColumns.forEach(column => {
            const issues = this.analyzeCurrencyColumn(column);
            const statusClass = issues.length > 0 ? 'issues-found' : 'no-issues';
            const statusText = issues.length > 0 ? `${issues.length} values need formatting` : 'Already formatted';
            
            html += `
                <div class="detection-item">
                    <span class="detection-column">${column}</span>
                    <span class="detection-status ${statusClass}">${statusText}</span>
                </div>
            `;
            
            if (issues.length > 0) hasIssues = true;
        });

        results.innerHTML = html;

        if (hasIssues) {
            this.showCurrencyPreview();
            document.getElementById('applyCurrencyBtn').style.display = 'inline-flex';
        } else {
            this.skipStep(4);
        }
    }

    findAmountColumns() {
        const columns = Object.keys(this.cleanedData[0]);
        return columns.filter(column => {
            const name = column.toLowerCase();
            return name.includes('amount') || name.includes('price') || name.includes('cost') || 
                   name.includes('revenue') || name.includes('value') || name.includes('total');
        });
    }

    analyzeCurrencyColumn(column) {
        const issues = [];
        const sampleValues = this.cleanedData.slice(0, 20).map(row => row[column]).filter(val => val);
        
        sampleValues.forEach(value => {
            const str = String(value);
            if (str.includes('$') || str.includes(',') || isNaN(parseFloat(str.replace(/[$,]/g, '')))) {
                issues.push(value);
            }
        });

        return issues;
    }

    showCurrencyPreview() {
        const amountColumns = this.findAmountColumns();
        const preview = document.getElementById('currencyPreview');
        const table = document.getElementById('currencyPreviewTable');
        
        const sampleData = this.cleanedData.slice(0, 5);
        const columns = Object.keys(this.cleanedData[0]);
        
        let html = '<table><thead><tr>';
        columns.forEach(col => {
            html += `<th>${col}</th>`;
        });
        html += '</tr></thead><tbody>';

        sampleData.forEach(row => {
            html += '<tr>';
            columns.forEach(col => {
                const originalValue = row[col];
                let displayValue = originalValue;
                
                if (amountColumns.includes(col)) {
                    const formatted = this.formatCurrency(originalValue);
                    if (formatted !== originalValue) {
                        displayValue = `<span class="original">${originalValue}</span> <span class="arrow">→</span> <span class="changed">${formatted}</span>`;
                    }
                }
                
                html += `<td>${displayValue}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
        table.innerHTML = html;
        preview.style.display = 'block';
    }

    formatCurrency(value) {
        if (!value) return value;
        
        const numericValue = parseFloat(String(value).replace(/[$,]/g, ''));
        if (isNaN(numericValue)) return value;
        
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(numericValue);
    }

    applyCurrencyFormatting() {
        const amountColumns = this.findAmountColumns();
        let changesCount = 0;

        this.cleanedData.forEach(row => {
            amountColumns.forEach(column => {
                const originalValue = row[column];
                const formattedValue = this.formatCurrency(originalValue);
                if (formattedValue !== originalValue) {
                    row[column] = formattedValue;
                    changesCount++;
                }
            });
        });

        this.cleaningStats.currencyFormatted = changesCount;
        this.completeStep(4);
    }

    // Step 5: Handle Null Values
    detectNullValues() {
        const results = document.getElementById('nullDetectionResults');
        const nullColumns = this.findNullColumns();
        
        if (nullColumns.length === 0) {
            results.innerHTML = '<div class="detection-item"><span class="detection-column">No null or blank values found</span><span class="detection-status no-issues">No action needed</span></div>';
            this.skipStep(5);
            return;
        }

        let html = '<h4>Columns with Null/Blank Values</h4>';
        nullColumns.forEach(column => {
            const nullCount = this.countNullValues(column);
            html += `
                <div class="detection-item">
                    <span class="detection-column">${column}</span>
                    <span class="detection-status needs-attention">${nullCount} null/blank values</span>
                </div>
            `;
        });

        results.innerHTML = html;
        this.showNullOptions();
    }

    findNullColumns() {
        const columns = Object.keys(this.cleanedData[0]);
        return columns.filter(column => this.countNullValues(column) > 0);
    }

    countNullValues(column) {
        return this.cleanedData.filter(row => !row[column] || row[column].toString().trim() === '').length;
    }

    showNullOptions() {
        const options = document.getElementById('nullOptions');
        options.style.display = 'block';

        // Add event listeners to null handling buttons
        document.querySelectorAll('.null-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.null-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateNullPreview();
            });
        });
    }

    updateNullPreview() {
        const selectedAction = document.querySelector('.null-btn.active')?.dataset.action;
        
        if (!selectedAction) return;

        this.showNullPreview(selectedAction);
        document.getElementById('applyNullBtn').style.display = 'inline-flex';
    }

    showNullPreview(action) {
        const nullColumns = this.findNullColumns();
        const preview = document.getElementById('nullPreview');
        const table = document.getElementById('nullPreviewTable');
        
        const sampleData = this.cleanedData.slice(0, 5);
        const columns = Object.keys(this.cleanedData[0]);
        
        let html = '<table><thead><tr>';
        columns.forEach(col => {
            html += `<th>${col}</th>`;
        });
        html += '</tr></thead><tbody>';

        sampleData.forEach(row => {
            html += '<tr>';
            columns.forEach(col => {
                const originalValue = row[col];
                let displayValue = originalValue;
                
                if (nullColumns.includes(col) && (!originalValue || originalValue.toString().trim() === '')) {
                    const handledValue = action === 'fill' ? 'N/A' : '';
                    displayValue = `<span class="original">(blank)</span> <span class="arrow">→</span> <span class="changed">${handledValue}</span>`;
                }
                
                html += `<td>${displayValue}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
        table.innerHTML = html;
        preview.style.display = 'block';
    }

    applyNullValueHandling() {
        const selectedAction = document.querySelector('.null-btn.active')?.dataset.action;
        const nullColumns = this.findNullColumns();
        
        if (!selectedAction || nullColumns.length === 0) return;

        let changesCount = 0;

        this.cleanedData.forEach(row => {
            nullColumns.forEach(column => {
                if (!row[column] || row[column].toString().trim() === '') {
                    row[column] = selectedAction === 'fill' ? 'N/A' : '';
                    changesCount++;
                }
            });
        });

        this.cleaningStats.nullValuesHandled = changesCount;
        this.completeStep(5);
    }

    // Step Management
    skipStep(stepNumber) {
        this.completedSteps.add(stepNumber);
        this.markStepCompleted(stepNumber);
        this.proceedToNextStep();
    }

    completeStep(stepNumber) {
        this.completedSteps.add(stepNumber);
        this.markStepCompleted(stepNumber);
        this.proceedToNextStep();
    }

    markStepCompleted(stepNumber) {
        const stepElement = document.getElementById(`step${stepNumber}`);
        stepElement.classList.add('completed');
    }

    proceedToNextStep() {
        if (this.currentStep < this.totalSteps) {
            this.showStep(this.currentStep + 1);
            this.runCurrentStepDetection();
        } else {
            this.showCompletionSummary();
        }
    }

    runCurrentStepDetection() {
        switch (this.currentStep) {
            case 1:
                this.detectDateFormats();
                break;
            case 2:
                this.detectWhitespace();
                break;
            case 3:
                this.setupTextCasing();
                break;
            case 4:
                this.detectCurrency();
                break;
            case 5:
                this.detectNullValues();
                break;
        }
    }

    showCompletionSummary() {
        const summary = document.getElementById('completionSummary');
        const stats = document.getElementById('cleaningStats');
        
        let statsHtml = '';
        if (this.cleaningStats.dateFormatsFixed > 0) {
            statsHtml += `<div class="stat-item"><span class="stat-value">${this.cleaningStats.dateFormatsFixed}</span><span class="stat-label">Date formats fixed</span></div>`;
        }
        if (this.cleaningStats.whitespaceRemoved > 0) {
            statsHtml += `<div class="stat-item"><span class="stat-value">${this.cleaningStats.whitespaceRemoved}</span><span class="stat-label">Whitespace removed</span></div>`;
        }
        if (this.cleaningStats.textCasingChanged > 0) {
            statsHtml += `<div class="stat-item"><span class="stat-value">${this.cleaningStats.textCasingChanged}</span><span class="stat-label">Text casing changed</span></div>`;
        }
        if (this.cleaningStats.currencyFormatted > 0) {
            statsHtml += `<div class="stat-item"><span class="stat-value">${this.cleaningStats.currencyFormatted}</span><span class="stat-label">Currency formatted</span></div>`;
        }
        if (this.cleaningStats.nullValuesHandled > 0) {
            statsHtml += `<div class="stat-item"><span class="stat-value">${this.cleaningStats.nullValuesHandled}</span><span class="stat-label">Null values handled</span></div>`;
        }
        
        stats.innerHTML = statsHtml;
        summary.style.display = 'block';
        
        // Store cleaned data for next step
        localStorage.setItem('cleanedData', JSON.stringify(this.cleanedData));
        localStorage.setItem('cleaningStats', JSON.stringify(this.cleaningStats));
        
        // Enable next button
        document.getElementById('nextBtn').disabled = false;
    }

    goToPreviousStep() {
        if (this.currentStep > 1) {
            this.showStep(this.currentStep - 1);
        } else {
            // Go back to Step 1
            window.location.href = 'index.html';
        }
    }

    goToNextStep() {
        if (this.currentStep === this.totalSteps && this.completedSteps.size === this.totalSteps) {
            // Store data and go to next step (Step 3)
            alert('Data cleaning complete! This would proceed to Step 3: Visualization in the full application.');
            // window.location.href = 'step3.html';
        }
    }

    showError(message) {
        alert(message);
    }
}

// Initialize the data cleaner when the page loads
document.addEventListener('DOMContentLoaded', function() {
    new DataCleaner();
});
