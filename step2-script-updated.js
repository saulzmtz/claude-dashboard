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
        this.initializeNavigation();
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

        // Casing type selection
        document.querySelectorAll('input[name="casingType"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.updateCasingPreview(e.target.value));
        });

        // Step 4: Currency
        document.getElementById('skipCurrencyBtn').addEventListener('click', () => this.skipStep(4));
        document.getElementById('applyCurrencyBtn').addEventListener('click', () => this.applyCurrencyFormatting());

        // Step 5: Null Values
        document.getElementById('skipNullBtn').addEventListener('click', () => this.skipStep(5));
        document.getElementById('applyNullBtn').addEventListener('click', () => this.applyNullHandling());

        // Null handling selection
        document.querySelectorAll('input[name="nullHandling"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.updateNullPreview(e.target.value));
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
                // Already on step 2
                break;
            case 3:
                if (this.cleanedData) {
                    // Store data and navigate to step 3
                    localStorage.setItem('cleanedData', JSON.stringify(this.cleanedData));
                    localStorage.setItem('columnTypes', JSON.stringify(this.columnTypes));
                    window.location.href = 'step3.html';
                } else {
                    alert('Please complete the data cleaning process first before proceeding to Step 3.');
                }
                break;
            case 4:
                if (this.cleanedData) {
                    // Store data and navigate to step 4
                    localStorage.setItem('cleanedData', JSON.stringify(this.cleanedData));
                    localStorage.setItem('columnTypes', JSON.stringify(this.columnTypes));
                    window.location.href = 'step4.html';
                } else {
                    alert('Please complete the data cleaning process first before proceeding to Step 4.');
                }
                break;
        }
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

            // Store cleaned data immediately (in case user skips all steps)
            localStorage.setItem('cleanedData', JSON.stringify(this.cleanedData));
            localStorage.setItem('columnTypes', JSON.stringify(this.columnTypes));

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

        document.getElementById('totalRows').textContent = totalRows.toLocaleString();
        document.getElementById('totalColumns').textContent = totalColumns;
    }

    startCleaningProcess() {
        this.showStep(1);
    }

    showStep(stepNumber) {
        // Hide all steps
        for (let i = 1; i <= this.totalSteps; i++) {
            const step = document.getElementById(`cleaningStep${i}`);
            if (step) {
                step.style.display = 'none';
                step.classList.remove('active');
            }
        }

        // Show current step
        const currentStepElement = document.getElementById(`cleaningStep${stepNumber}`);
        if (currentStepElement) {
            currentStepElement.style.display = 'block';
            currentStepElement.classList.add('active');
        }

        this.currentStep = stepNumber;
        this.updateProgress();
    }

    updateProgress() {
        const progressDots = document.querySelectorAll('.progress-dot');
        progressDots.forEach((dot, index) => {
            const stepNumber = index + 1;
            if (stepNumber < this.currentStep) {
                dot.classList.add('completed');
            } else if (stepNumber === this.currentStep) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('completed', 'active');
            }
        });
    }

    skipStep(stepNumber) {
        this.completedSteps.add(stepNumber);
        this.showSuccessMessage(`Step ${stepNumber} skipped`);
        
        if (stepNumber < this.totalSteps) {
            this.showStep(stepNumber + 1);
        } else {
            this.showCompletionSummary();
        }
    }

    applyDateFormats() {
        if (!this.cleanedData) return;

        let fixedCount = 0;
        const dateColumns = Object.keys(this.columnTypes).filter(col => this.columnTypes[col] === 'date');

        this.cleanedData.forEach(row => {
            dateColumns.forEach(col => {
                const value = row[col];
                if (value && value.trim()) {
                    const normalizedDate = this.normalizeDate(value);
                    if (normalizedDate !== value) {
                        row[col] = normalizedDate;
                        fixedCount++;
                    }
                }
            });
        });

        this.cleaningStats.dateFormatsFixed = fixedCount;
        this.completedSteps.add(1);
        this.showSuccessMessage(`Fixed ${fixedCount} date formats`);
        this.showStep(2);
    }

    normalizeDate(dateString) {
        // Try to parse the date and return in YYYY-MM-DD format
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }

    applyWhitespaceRemoval() {
        if (!this.cleanedData) return;

        let cleanedCount = 0;
        const textColumns = Object.keys(this.columnTypes).filter(col => this.columnTypes[col] === 'string');

        this.cleanedData.forEach(row => {
            textColumns.forEach(col => {
                const originalValue = row[col];
                if (originalValue && typeof originalValue === 'string') {
                    const cleanedValue = originalValue.trim();
                    if (cleanedValue !== originalValue) {
                        row[col] = cleanedValue;
                        cleanedCount++;
                    }
                }
            });
        });

        this.cleaningStats.whitespaceRemoved = cleanedCount;
        this.completedSteps.add(2);
        this.showSuccessMessage(`Cleaned ${cleanedCount} text fields`);
        this.showStep(3);
    }

    applyTextCasing() {
        if (!this.cleanedData) return;

        const casingType = document.querySelector('input[name="casingType"]:checked')?.value;
        if (!casingType) return;

        let changedCount = 0;
        const textColumns = Object.keys(this.columnTypes).filter(col => this.columnTypes[col] === 'string');

        this.cleanedData.forEach(row => {
            textColumns.forEach(col => {
                const originalValue = row[col];
                if (originalValue && typeof originalValue === 'string') {
                    let newValue;
                    switch (casingType) {
                        case 'proper':
                            newValue = this.toProperCase(originalValue);
                            break;
                        case 'upper':
                            newValue = originalValue.toUpperCase();
                            break;
                        case 'lower':
                            newValue = originalValue.toLowerCase();
                            break;
                        default:
                            newValue = originalValue;
                    }
                    
                    if (newValue !== originalValue) {
                        row[col] = newValue;
                        changedCount++;
                    }
                }
            });
        });

        this.cleaningStats.textCasingChanged = changedCount;
        this.completedSteps.add(3);
        this.showSuccessMessage(`Updated ${changedCount} text fields to ${casingType} case`);
        this.showStep(4);
    }

    toProperCase(str) {
        return str.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }

    updateCasingPreview(casingType) {
        const preview = document.getElementById('casingPreview');
        if (!preview) return;

        const sampleText = "john smith";
        let result;
        switch (casingType) {
            case 'proper':
                result = this.toProperCase(sampleText);
                break;
            case 'upper':
                result = sampleText.toUpperCase();
                break;
            case 'lower':
                result = sampleText.toLowerCase();
                break;
            default:
                result = sampleText;
        }

        preview.textContent = `"${sampleText}" → "${result}"`;
    }

    applyCurrencyFormatting() {
        if (!this.cleanedData) return;

        let formattedCount = 0;
        const amountColumns = Object.keys(this.columnTypes).filter(col => 
            this.columnTypes[col] === 'number' && 
            col.toLowerCase().includes('amount')
        );

        this.cleanedData.forEach(row => {
            amountColumns.forEach(col => {
                const value = row[col];
                if (value && !isNaN(parseFloat(value))) {
                    // Remove existing currency symbols and commas
                    const cleanValue = value.toString().replace(/[$,]/g, '');
                    const numValue = parseFloat(cleanValue);
                    
                    if (!isNaN(numValue)) {
                        row[col] = numValue;
                        formattedCount++;
                    }
                }
            });
        });

        this.cleaningStats.currencyFormatted = formattedCount;
        this.completedSteps.add(4);
        this.showSuccessMessage(`Formatted ${formattedCount} currency values`);
        this.showStep(5);
    }

    applyNullHandling() {
        if (!this.cleanedData) return;

        const nullHandling = document.querySelector('input[name="nullHandling"]:checked')?.value;
        if (!nullHandling) return;

        let handledCount = 0;
        const allColumns = Object.keys(this.cleanedData[0] || {});

        this.cleanedData.forEach(row => {
            allColumns.forEach(col => {
                const value = row[col];
                if (value === null || value === undefined || value === '') {
                    if (nullHandling === 'fill') {
                        row[col] = 'N/A';
                        handledCount++;
                    } else if (nullHandling === 'blank') {
                        row[col] = '';
                        handledCount++;
                    }
                }
            });
        });

        this.cleaningStats.nullValuesHandled = handledCount;
        this.completedSteps.add(5);
        this.showSuccessMessage(`Handled ${handledCount} null/blank values`);
        this.showCompletionSummary();
    }

    updateNullPreview(handling) {
        const preview = document.getElementById('nullPreview');
        if (!preview) return;

        let result;
        switch (handling) {
            case 'fill':
                result = 'Empty values will be filled with "N/A"';
                break;
            case 'blank':
                result = 'Empty values will remain blank';
                break;
            default:
                result = 'Select a handling option';
        }

        preview.textContent = result;
    }

    showCompletionSummary() {
        const summary = document.getElementById('completionSummary');
        if (summary) {
            summary.innerHTML = `
                <h3>Data Cleaning Complete!</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-number">${this.cleaningStats.dateFormatsFixed}</span>
                        <span class="stat-label">Date Formats Fixed</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${this.cleaningStats.whitespaceRemoved}</span>
                        <span class="stat-label">Whitespace Cleaned</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${this.cleaningStats.textCasingChanged}</span>
                        <span class="stat-label">Text Casing Updated</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${this.cleaningStats.currencyFormatted}</span>
                        <span class="stat-label">Currency Values Formatted</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${this.cleaningStats.nullValuesHandled}</span>
                        <span class="stat-label">Null Values Handled</span>
                    </div>
                </div>
            `;
            summary.style.display = 'block';
        }

        // Enable next step button
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            nextBtn.disabled = false;
        }
    }

    showSuccessMessage(message) {
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
        successDiv.textContent = message;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    showError(message) {
        alert(message);
    }

    goToPreviousStep() {
        // Go back to Step 1
        window.location.href = 'index.html';
    }

    goToNextStep() {
        if (this.currentStep === this.totalSteps && this.completedSteps.size === this.totalSteps) {
            // Store data and go to next step (Step 3)
            console.log('Storing data for Step 3:', {
                cleanedDataLength: this.cleanedData.length,
                columnTypesCount: Object.keys(this.columnTypes).length,
                cleaningStats: this.cleaningStats
            });

            localStorage.setItem('cleanedData', JSON.stringify(this.cleanedData));
            localStorage.setItem('columnTypes', JSON.stringify(this.columnTypes));
            localStorage.setItem('cleaningStats', JSON.stringify(this.cleaningStats));

            // Verify data was stored
            const storedData = localStorage.getItem('cleanedData');
            console.log('Data storage verification:', {
                stored: !!storedData,
                length: storedData ? JSON.parse(storedData).length : 0
            });

            // Navigate to Step 3: Visualization
            window.location.href = 'step3.html';
        }
    }
}

// Initialize the data cleaner when the page loads
document.addEventListener('DOMContentLoaded', function() {
    window.dataCleaner = new DataCleaner();
});
