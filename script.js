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
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

function processFile(file) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('Please select a CSV file.');
        return;
    }
    
    // Show loading state
    uploadButton.innerHTML = '<div class="loading"></div> Processing...';
    uploadButton.disabled = true;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const csv = e.target.result;
            const data = parseCSV(csv);
            
            if (data.length === 0) {
                alert('The CSV file appears to be empty.');
                resetUploadState();
                return;
            }
            
            currentData = data;
            detectColumnTypes();
            displayDataPreview(file.name);
            showConfirmationSection();
            enableNextStep();
            
        } catch (error) {
            console.error('Error processing CSV:', error);
            alert('Error processing CSV file. Please check the file format.');
            resetUploadState();
        }
    };
    
    reader.readAsText(file);
}

function parseCSV(csv) {
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(value => value.trim().replace(/"/g, ''));
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });
            data.push(row);
        }
    }
    
    return data;
}

function detectColumnTypes() {
    if (!currentData || currentData.length === 0) return;
    
    const headers = Object.keys(currentData[0]);
    columnTypes = {};
    
    headers.forEach(header => {
        const values = currentData.slice(0, 10).map(row => row[header]).filter(val => val !== '');
        
        if (values.length === 0) {
            columnTypes[header] = 'string';
            return;
        }
        
        // Check for boolean
        const booleanValues = values.map(val => val.toLowerCase());
        if (booleanValues.every(val => ['true', 'false', 'yes', 'no', '1', '0', 'y', 'n'].includes(val))) {
            columnTypes[header] = 'boolean';
            return;
        }
        
        // Check for date
        const dateValues = values.filter(val => {
            const date = new Date(val);
            return !isNaN(date.getTime()) && val.match(/\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}/);
        });
        if (dateValues.length > values.length * 0.7) {
            columnTypes[header] = 'date';
            return;
        }
        
        // Check for number
        const numberValues = values.filter(val => !isNaN(parseFloat(val)) && isFinite(val));
        if (numberValues.length > values.length * 0.7) {
            columnTypes[header] = 'number';
            return;
        }
        
        // Default to string
        columnTypes[header] = 'string';
    });
}

function displayDataPreview(fileName) {
    const headers = Object.keys(currentData[0]);
    const previewData = currentData.slice(0, 10);
    
    // Update file info
    document.getElementById('fileName').textContent = fileName;
    document.getElementById('rowCount').textContent = `${currentData.length} rows`;
    
    // Create column list
    const columnList = document.getElementById('columnList');
    columnList.innerHTML = '';
    
    headers.forEach(header => {
        const columnItem = document.createElement('div');
        columnItem.className = 'column-item';
        columnItem.innerHTML = `
            <span class="column-name">${header}</span>
            <span class="column-type ${columnTypes[header]}">${columnTypes[header]}</span>
        `;
        columnList.appendChild(columnItem);
    });
    
    // Create table
    const tableHead = document.getElementById('tableHead');
    const tableBody = document.getElementById('tableBody');
    
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    
    // Create header row
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    tableHead.appendChild(headerRow);
    
    // Create data rows
    previewData.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header] || '';
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });
    
    // Show preview section
    previewSection.style.display = 'block';
    
    // Store original column names
    originalColumnNames = { ...headers.reduce((acc, header) => ({ ...acc, [header]: header }), {}) };
}

function showConfirmationSection() {
    confirmationSection.style.display = 'block';
}

function enableNextStep() {
    nextBtn.disabled = false;
    nextBtn.innerHTML = `
        Next Step
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
}

function resetUploadState() {
    uploadButton.innerHTML = 'Choose File';
    uploadButton.disabled = false;
    previewSection.style.display = 'none';
    confirmationSection.style.display = 'none';
    nextBtn.disabled = true;
    currentData = null;
    columnTypes = {};
    originalColumnNames = {};
}

function openColumnModal() {
    const columnEditList = document.getElementById('columnEditList');
    columnEditList.innerHTML = '';
    
    const headers = Object.keys(currentData[0]);
    headers.forEach(header => {
        const editItem = document.createElement('div');
        editItem.className = 'column-edit-item';
        editItem.innerHTML = `
            <input type="text" class="column-edit-name" value="${header}" data-original="${header}">
            <span class="column-edit-type ${columnTypes[header]}">${columnTypes[header]}</span>
        `;
        columnEditList.appendChild(editItem);
    });
    
    columnModal.style.display = 'flex';
}

function closeModal() {
    columnModal.style.display = 'none';
}

function saveColumnRenames() {
    const nameInputs = document.querySelectorAll('.column-edit-name');
    const newColumnNames = {};
    const renamedData = [];
    
    // Collect new column names
    nameInputs.forEach(input => {
        const originalName = input.dataset.original;
        const newName = input.value.trim();
        newColumnNames[originalName] = newName;
    });
    
    // Check for duplicate names
    const names = Object.values(newColumnNames);
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicates.length > 0) {
        alert('Column names must be unique. Please fix duplicates.');
        return;
    }
    
    // Rename columns in data
    currentData.forEach(row => {
        const newRow = {};
        Object.keys(row).forEach(oldName => {
            const newName = newColumnNames[oldName];
            newRow[newName] = row[oldName];
        });
        renamedData.push(newRow);
    });
    
    currentData = renamedData;
    
    // Update column types mapping
    const newColumnTypes = {};
    Object.keys(columnTypes).forEach(oldName => {
        const newName = newColumnNames[oldName];
        newColumnTypes[newName] = columnTypes[oldName];
    });
    columnTypes = newColumnTypes;
    
    // Update display
    displayDataPreview(document.getElementById('fileName').textContent);
    
    closeModal();
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
    // This is Step 1, so previous is disabled
    // In a real application, you might navigate back to a welcome screen
    console.log('Previous step clicked (disabled for Step 1)');
}

// Utility function to format data for display
function formatValue(value, type) {
    if (value === '' || value === null || value === undefined) return '';
    
    switch (type) {
        case 'number':
            return parseFloat(value).toLocaleString();
        case 'date':
            return new Date(value).toLocaleDateString();
        case 'boolean':
            return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes' ? 'Yes' : 'No';
        default:
            return value;
    }
}

// Export functions for potential use in other steps
window.dashboardApp = {
    getCurrentData: () => currentData,
    getColumnTypes: () => columnTypes,
    resetData: resetUploadState
};
