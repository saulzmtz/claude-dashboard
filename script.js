// Global state
let currentData = null;
let columnTypes = {};
let originalColumnNames = {};

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadButton = document.getElementById('uploadButton');
const previewSection = document.getElementById('previewSection');
const confirmationSection = document.getElementById('confirmationSection');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const columnModal = document.getElementById('columnModal');
const modalClose = document.getElementById('modalClose');
const cancelRename = document.getElementById('cancelRename');
const saveRename = document.getElementById('saveRename');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeNavigation();
});

function initializeEventListeners() {
    // Upload area events
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // File input event
    fileInput.addEventListener('change', handleFileSelect);
    
    // Upload button event
    uploadButton.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
    
    // Navigation events
    nextBtn.addEventListener('click', handleNextStep);
    prevBtn.addEventListener('click', handlePreviousStep);
    
    // Modal events
    modalClose.addEventListener('click', closeModal);
    cancelRename.addEventListener('click', closeModal);
    saveRename.addEventListener('click', saveColumnRenames);
    
    // Edit columns button
    document.getElementById('editColumnsBtn').addEventListener('click', openColumnModal);
    
    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target === columnModal) {
            closeModal();
        }
    });
}

function initializeNavigation() {
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
            navigateToStep(stepNumber);
        });
    });
}

function navigateToStep(stepNumber) {
    switch(stepNumber) {
        case 1:
            // Already on step 1
            break;
        case 2:
            if (currentData) {
                // Store data and navigate to step 2
                localStorage.setItem('dashboardData', JSON.stringify(currentData));
                localStorage.setItem('columnTypes', JSON.stringify(columnTypes));
                window.location.href = 'step2.html';
            } else {
                alert('Please upload a CSV file first before proceeding to Step 2.');
            }
            break;
        case 3:
            if (currentData) {
                // Store data and navigate to step 3
                localStorage.setItem('dashboardData', JSON.stringify(currentData));
                localStorage.setItem('columnTypes', JSON.stringify(columnTypes));
                window.location.href = 'step3.html';
            } else {
                alert('Please upload a CSV file first before proceeding to Step 3.');
            }
            break;
        case 4:
            if (currentData) {
                // Store data and navigate to step 4
                localStorage.setItem('dashboardData', JSON.stringify(currentData));
                localStorage.setItem('columnTypes', JSON.stringify(columnTypes));
                window.location.href = 'step4.html';
            } else {
                alert('Please upload a CSV file first before proceeding to Step 4.');
            }
            break;
    }
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('Please select a CSV file.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const csv = e.target.result;
            const lines = csv.split('\n').filter(line => line.trim());
            
            if (lines.length < 2) {
                alert('CSV file must have at least a header row and one data row.');
                return;
            }
            
            // Parse CSV
            const headers = parseCSVLine(lines[0]);
            const data = [];
            const previewData = [];
            
            // Load full dataset for processing
            for (let i = 1; i < lines.length; i++) {
                const values = parseCSVLine(lines[i]);
                if (values.length === headers.length) {
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = values[index];
                    });
                    data.push(row);
                    
                    // Also store first 10 rows for preview
                    if (previewData.length < 10) {
                        previewData.push(row);
                    }
                }
            }
            
            // Store original data
            currentData = data;
            originalColumnNames = headers.reduce((acc, header, index) => {
                acc[index] = header;
                return acc;
            }, {});
            
            // Detect column types
            columnTypes = detectColumnTypes(data, headers);
            
            // Show preview
            showPreview(previewData, headers);
            
        } catch (error) {
            console.error('Error parsing CSV:', error);
            alert('Error parsing CSV file. Please check the file format.');
        }
    };
    
    reader.readAsText(file);
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Handle escaped quotes
                current += '"';
                i += 2;
                continue;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
        i++;
    }
    
    // Add the last field
    result.push(current.trim());
    
    // Remove quotes from the beginning and end of each field if they exist
    return result.map(field => {
        if (field.startsWith('"') && field.endsWith('"')) {
            return field.slice(1, -1);
        }
        return field;
    });
}

function detectColumnTypes(data, headers) {
    const types = {};
    
    headers.forEach(header => {
        const values = data.map(row => row[header]).filter(val => val !== '');
        
        if (values.length === 0) {
            types[header] = 'string';
            return;
        }
        
        // Check if all values are numbers (including strings that can be parsed as numbers)
        const allNumbers = values.every(val => {
            // Remove common currency symbols, commas, and whitespace
            const cleaned = val.toString().replace(/[$,\s]/g, '');
            return !isNaN(parseFloat(cleaned)) && isFinite(parseFloat(cleaned)) && cleaned !== '';
        });
        
        // Also check if column name suggests it's numeric (Amount, Price, Cost, etc.)
        const numericKeywords = ['amount', 'price', 'cost', 'value', 'total', 'sum', 'count', 'quantity', 'number', 'num'];
        const isNumericColumn = numericKeywords.some(keyword => 
            header.toLowerCase().includes(keyword)
        );
        
        if (allNumbers || (isNumericColumn && values.some(val => {
            const cleaned = val.toString().replace(/[$,\s]/g, '');
            return !isNaN(parseFloat(cleaned)) && isFinite(parseFloat(cleaned)) && cleaned !== '';
        }))) {
            types[header] = 'number';
            return;
        }
        
        // Check if all values are dates
        const allDates = values.every(val => !isNaN(Date.parse(val)));
        if (allDates) {
            types[header] = 'date';
            return;
        }
        
        // Check if all values are booleans
        const allBooleans = values.every(val => 
            val.toLowerCase() === 'true' || 
            val.toLowerCase() === 'false' ||
            val.toLowerCase() === 'yes' ||
            val.toLowerCase() === 'no'
        );
        if (allBooleans) {
            types[header] = 'boolean';
            return;
        }
        
        // Default to string
        types[header] = 'string';
    });
    
    return types;
}

function showPreview(data, headers) {
    // Create preview table
    const previewTable = document.createElement('table');
    previewTable.className = 'preview-table';
    
    // Header row
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        th.className = 'column-header';
        th.innerHTML = `
            <div class="header-content">
                <span class="header-name">${header}</span>
                <span class="header-type">${columnTypes[header]}</span>
            </div>
        `;
        headerRow.appendChild(th);
    });
    previewTable.appendChild(headerRow);
    
    // Data rows
    data.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header] || '';
            td.className = `data-cell ${columnTypes[header]}`;
            tr.appendChild(td);
        });
        previewTable.appendChild(tr);
    });
    
    // Update preview section
    const previewContainer = document.getElementById('previewContainer');
    previewContainer.innerHTML = '';
    previewContainer.appendChild(previewTable);
    
    // Show preview and confirmation sections
    previewSection.style.display = 'block';
    confirmationSection.style.display = 'block';
    
    // Update data summary
    updateDataSummary(data.length, headers.length);
    
    // Enable Next Step button
    nextBtn.disabled = false;
}

function updateDataSummary(rowCount, columnCount) {
    document.getElementById('rowCount').textContent = rowCount.toLocaleString();
    document.getElementById('columnCount').textContent = columnCount;
}

function handleNextStep() {
    if (!currentData) return;

    // Store data in localStorage for next step
    localStorage.setItem('dashboardData', JSON.stringify(currentData));
    localStorage.setItem('columnTypes', JSON.stringify(columnTypes));

    // Navigate to Step 2: Data Cleaning
    window.location.href = 'step2.html';
}

function handlePreviousStep() {
    // Step 1 is the first step, so this is disabled
    console.log('Already at Step 1');
}

function openColumnModal() {
    columnModal.style.display = 'flex';
    populateColumnModal();
}

function closeModal() {
    columnModal.style.display = 'none';
}

function populateColumnModal() {
    const container = document.getElementById('columnList');
    container.innerHTML = '';
    
    Object.keys(originalColumnNames).forEach(index => {
        const header = originalColumnNames[index];
        const div = document.createElement('div');
        div.className = 'column-item';
        div.innerHTML = `
            <label for="col_${index}">${header}</label>
            <input type="text" id="col_${index}" value="${header}" class="column-input">
        `;
        container.appendChild(div);
    });
}

function saveColumnRenames() {
    const inputs = document.querySelectorAll('.column-input');
    const newHeaders = [];
    const oldHeaders = [];
    
    // Get the original headers in order
    Object.keys(originalColumnNames).forEach(index => {
        oldHeaders.push(originalColumnNames[index]);
    });
    
    // Get the new headers from inputs
    inputs.forEach(input => {
        newHeaders.push(input.value.trim() || input.id.replace('col_', ''));
    });
    
    // Update column names in data
    const newData = currentData.map(row => {
        const newRow = {};
        oldHeaders.forEach((oldHeader, index) => {
            newRow[newHeaders[index]] = row[oldHeader];
        });
        return newRow;
    });
    
    // Update column types
    const newColumnTypes = {};
    oldHeaders.forEach((oldHeader, index) => {
        newColumnTypes[newHeaders[index]] = columnTypes[oldHeader];
    });
    
    // Update global state
    currentData = newData;
    columnTypes = newColumnTypes;
    
    // Refresh preview
    showPreview(currentData, newHeaders);
    
    closeModal();
}

// Add some basic styling for the preview table
const style = document.createElement('style');
style.textContent = `
    .preview-table {
        width: 100%;
        border-collapse: collapse;
        margin: 1rem 0;
        font-size: 0.875rem;
    }
    
    .preview-table th,
    .preview-table td {
        border: 1px solid #e5e7eb;
        padding: 0.5rem;
        text-align: left;
    }
    
    .preview-table th {
        background: #f8fafc;
        font-weight: 600;
        color: #374151;
    }
    
    .header-content {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .header-name {
        font-weight: 600;
    }
    
    .header-type {
        font-size: 0.75rem;
        color: #6b7280;
        background: #e0e7ff;
        padding: 0.125rem 0.375rem;
        border-radius: 4px;
        width: fit-content;
    }
    
    .data-cell.number {
        text-align: right;
        font-family: 'Courier New', monospace;
    }
    
    .data-cell.date {
        color: #059669;
    }
    
    .data-cell.boolean {
        color: #dc2626;
        font-weight: 500;
    }
    
    .column-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
        border-bottom: 1px solid #f3f4f6;
    }
    
    .column-item:last-child {
        border-bottom: none;
    }
    
    .column-item label {
        font-weight: 500;
        color: #374151;
        min-width: 100px;
    }
    
    .column-input {
        flex: 1;
        padding: 0.375rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 0.875rem;
    }
    
    .column-input:focus {
        outline: none;
        border-color: #1aa7ee;
        box-shadow: 0 0 0 3px rgba(26, 167, 238, 0.1);
    }
`;
document.head.appendChild(style);