/**
 * PF Projection - Extension module for PF Calculator
 * Handles previous year slip import and next year projection
 * Author: GitHub Copilot
 * Date: May 12, 2025
 */

// DOM Elements
const importForm = document.getElementById('importForm');
const fileUpload = document.getElementById('fileUpload');
const manualImportForm = document.getElementById('manualImportForm');
const toggleManualEntryBtn = document.getElementById('toggleManualEntry');
const projectionResultsContainer = document.getElementById('projectionResultsContainer');
const projectionSummary = document.getElementById('projectionSummary');
const projectionTable = document.getElementById('projectionTable');
const projectionYearSelect = document.getElementById('projectionYear');
const projectionChart = document.getElementById('projectionGrowthChart');

// Chart instance for projection
let projectionGrowthChart = null;

// Application state for projection
const projectionState = {
    importedData: null,
    projectionResults: null,
    importMethod: 'file' // 'file' or 'manual'
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize import form events
    if (importForm) {
        importForm.addEventListener('submit', handleImportFormSubmit);
    }
    
    // Initialize manual import form events
    if (manualImportForm) {
        manualImportForm.addEventListener('submit', handleManualImportSubmit);
    }
    
    // Toggle between file upload and manual entry
    if (toggleManualEntryBtn) {
        toggleManualEntryBtn.addEventListener('click', toggleImportMethod);
    }
    
    // Handle file upload change event
    if (fileUpload) {
        fileUpload.addEventListener('change', handleFileSelect);
    }
    
    // Handle projection year change
    if (projectionYearSelect) {
        projectionYearSelect.addEventListener('change', updateProjection);
    }
});

/**
 * Toggle between file upload and manual entry methods
 */
function toggleImportMethod() {
    const fileImportContainer = document.getElementById('fileImportContainer');
    const manualImportContainer = document.getElementById('manualImportContainer');
    
    if (projectionState.importMethod === 'file') {
        // Switch to manual entry
        fileImportContainer.classList.add('hidden');
        manualImportContainer.classList.remove('hidden');
        toggleManualEntryBtn.textContent = 'Use File Upload Instead';
        projectionState.importMethod = 'manual';
    } else {
        // Switch to file upload
        fileImportContainer.classList.remove('hidden');
        manualImportContainer.classList.add('hidden');
        toggleManualEntryBtn.textContent = 'Enter Details Manually Instead';
        projectionState.importMethod = 'file';
    }
}

/**
 * Handle the import form submission
 * @param {Event} e - Form submit event
 */
function handleImportFormSubmit(e) {
    e.preventDefault();
    
    // File should already be parsed via handleFileSelect
    if (!projectionState.importedData) {
        showNotification('Please select a valid PF slip file first', 'error');
        return;
    }
    
    // Get projection parameters
    const projectionYear = parseInt(document.getElementById('projectionYear').value);
    const projectionInterestRate = parseFloat(document.getElementById('projectionInterestRate').value) / 100;
    
    // Validate inputs
    if (!validateProjectionInputs(projectionYear, projectionInterestRate)) {
        return;
    }
    
    // Generate projection
    generateProjection(projectionState.importedData, projectionYear, projectionInterestRate);
}

/**
 * Handle the manual import form submission
 * @param {Event} e - Form submit event
 */
function handleManualImportSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const openingBalance = parseFloat(document.getElementById('openingBalance').value);
    const employeeContributions = parseFloat(document.getElementById('employeeContributions').value);
    const employerContributions = parseFloat(document.getElementById('employerContributions').value);
    const interestEarned = parseFloat(document.getElementById('interestEarned').value);
    const slipYear = parseInt(document.getElementById('slipYear').value);
    
    // Validate inputs
    if (!validateManualInputs(openingBalance, employeeContributions, employerContributions, interestEarned, slipYear)) {
        return;
    }
    
    // Create imported data object
    const importedData = {
        year: slipYear,
        openingBalance: openingBalance,
        employeeContributions: employeeContributions,
        employerContributions: employerContributions,
        interestEarned: interestEarned,
        closingBalance: openingBalance + employeeContributions + employerContributions + interestEarned,
        monthlySalary: calculateMonthlySalary(employeeContributions),
        monthlyEmployeeContribution: employeeContributions / 12,
        monthlyEmployerContribution: employerContributions / 12
    };
    
    // Store imported data in state
    projectionState.importedData = importedData;
    
    // Populate main calculator with derived values
    populateMainCalculator(importedData);
    
    // Get projection parameters
    const projectionYear = parseInt(document.getElementById('projectionYear').value);
    const projectionInterestRate = parseFloat(document.getElementById('projectionInterestRate').value) / 100;
    
    // Generate projection
    generateProjection(importedData, projectionYear, projectionInterestRate);
    
    // Show success message
    showNotification('Previous year data imported successfully', 'success');
}

/**
 * Estimate monthly salary based on yearly employee contributions
 * Assumes standard 12% contribution rate
 * @param {number} yearlyContribution - Total yearly employee contribution
 * @returns {number} - Estimated monthly salary
 */
function calculateMonthlySalary(yearlyContribution) {
    // Assuming standard 12% contribution
    return (yearlyContribution / 0.12) / 12;
}

/**
 * Handle file selection for import
 * @param {Event} e - File input change event
 */
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) {
        return;
    }
    
    // Check if file is CSV
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        showNotification('Please upload a CSV file', 'error');
        return;
    }
    
    // Parse CSV file
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedData = parseCSV(event.target.result);
            if (importedData) {
                projectionState.importedData = importedData;
                populateMainCalculator(importedData);
                showNotification('File imported successfully', 'success');
                
                // Update file name display
                document.getElementById('selectedFileName').textContent = file.name;
            }
        } catch (error) {
            console.error('Error parsing CSV:', error);
            showNotification('Error parsing CSV file. Please check the file format.', 'error');
        }
    };
    reader.onerror = function() {
        showNotification('Error reading file', 'error');
    };
    reader.readAsText(file);
}

/**
 * Parse CSV data from PF slip
 * @param {string} csvData - Raw CSV data
 * @returns {Object} - Parsed PF data
 */
function parseCSV(csvData) {
    // Split into lines
    const lines = csvData.trim().split('\n');
    
    // Check minimum required lines
    if (lines.length < 2) {
        showNotification('Invalid CSV format', 'error');
        return null;
    }
    
    // Initialize data object
    const data = {};
    
    try {
        // Try to detect format and extract data
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines
            if (!line) continue;
            
            // Split by comma and remove quotes
            const parts = line.split(',').map(part => part.replace(/"/g, '').trim());
            
            // Look for key data points
            if (parts.length >= 2) {
                // Look for year info
                if (parts[0].toLowerCase().includes('year') || parts[0].toLowerCase().includes('fy')) {
                    // Extract year - look for patterns like "2024-25", "FY 2024" etc
                    const yearMatch = parts[1].match(/\d{4}/);
                    if (yearMatch) {
                        data.year = parseInt(yearMatch[0]);
                    }
                }
                
                // Opening balance
                if (parts[0].toLowerCase().includes('opening balance')) {
                    data.openingBalance = parseFloat(parts[1].replace(/[^\d.-]/g, ''));
                }
                
                // Employee contributions
                if (parts[0].toLowerCase().includes('employee contribution')) {
                    data.employeeContributions = parseFloat(parts[1].replace(/[^\d.-]/g, ''));
                }
                
                // Employer contributions
                if (parts[0].toLowerCase().includes('employer contribution')) {
                    data.employerContributions = parseFloat(parts[1].replace(/[^\d.-]/g, ''));
                }
                
                // Interest
                if (parts[0].toLowerCase().includes('interest')) {
                    data.interestEarned = parseFloat(parts[1].replace(/[^\d.-]/g, ''));
                }
                
                // Closing balance
                if (parts[0].toLowerCase().includes('closing balance')) {
                    data.closingBalance = parseFloat(parts[1].replace(/[^\d.-]/g, ''));
                }
            }
        }
        
        // Validate extracted data
        if (!data.year || isNaN(data.openingBalance) || isNaN(data.employeeContributions) || 
            isNaN(data.employerContributions) || isNaN(data.interestEarned)) {
            throw new Error('Missing required data in CSV');
        }
        
        // Calculate monthly salary and contributions if not present
        if (!data.monthlySalary) {
            data.monthlySalary = calculateMonthlySalary(data.employeeContributions);
        }
        
        if (!data.monthlyEmployeeContribution) {
            data.monthlyEmployeeContribution = data.employeeContributions / 12;
        }
        
        if (!data.monthlyEmployerContribution) {
            data.monthlyEmployerContribution = data.employerContributions / 12;
        }
        
        // Verify closing balance or calculate if missing
        if (!data.closingBalance) {
            data.closingBalance = data.openingBalance + data.employeeContributions + 
                                 data.employerContributions + data.interestEarned;
        }
        
        return data;
    } catch (error) {
        console.error('Error extracting data from CSV:', error);
        showNotification('Could not extract all required data from CSV', 'error');
        return null;
    }
}

/**
 * Populate main calculator form with values from imported data
 * @param {Object} importedData - Imported PF data
 */
function populateMainCalculator(importedData) {
    // Get main calculator form elements
    const salaryInput = document.getElementById('salary');
    const employeeContributionInput = document.getElementById('employeeContribution');
    const employerContributionInput = document.getElementById('employerContribution');
    
    if (!salaryInput || !employeeContributionInput || !employerContributionInput) {
        console.error('Main calculator form elements not found');
        return;
    }
    
    // Set values based on imported data
    salaryInput.value = Math.round(importedData.monthlySalary);
    
    // Calculate contribution percentages
    const employeeContributionPct = (importedData.monthlyEmployeeContribution / importedData.monthlySalary) * 100;
    const employerContributionPct = (importedData.monthlyEmployerContribution / importedData.monthlySalary) * 100;
    
    employeeContributionInput.value = employeeContributionPct.toFixed(2);
    employerContributionInput.value = employerContributionPct.toFixed(2);
}

/**
 * Validate projection inputs
 * @param {number} projectionYear - Year to project to
 * @param {number} projectionInterestRate - Annual interest rate for projection
 * @returns {boolean} - Whether inputs are valid
 */
function validateProjectionInputs(projectionYear, projectionInterestRate) {
    // Check if all inputs are valid numbers
    if (isNaN(projectionYear) || isNaN(projectionInterestRate)) {
        showNotification('Please enter valid numbers for projection parameters', 'error');
        return false;
    }
    
    // Check for reasonable projection year
    const currentYear = new Date().getFullYear();
    if (projectionYear < currentYear || projectionYear > currentYear + 50) {
        showNotification('Please enter a reasonable projection year', 'error');
        return false;
    }
    
    // Check if interest rate is reasonable
    if (projectionInterestRate < 0 || projectionInterestRate > 0.3) {
        showNotification('Please enter a reasonable interest rate (0-30%)', 'error');
        return false;
    }
    
    return true;
}

/**
 * Validate manual import inputs
 * @param {number} openingBalance - Opening balance
 * @param {number} employeeContributions - Employee contributions
 * @param {number} employerContributions - Employer contributions
 * @param {number} interestEarned - Interest earned
 * @param {number} slipYear - Year of the slip
 * @returns {boolean} - Whether inputs are valid
 */
function validateManualInputs(openingBalance, employeeContributions, employerContributions, interestEarned, slipYear) {
    // Check if all inputs are valid numbers
    if (isNaN(openingBalance) || isNaN(employeeContributions) || 
        isNaN(employerContributions) || isNaN(interestEarned) || isNaN(slipYear)) {
        showNotification('Please enter valid numbers for all fields', 'error');
        return false;
    }
    
    // Check for negative values
    if (openingBalance < 0 || employeeContributions < 0 || 
        employerContributions < 0 || interestEarned < 0) {
        showNotification('Please enter non-negative values', 'error');
        return false;
    }
    
    // Check for reasonable year
    const currentYear = new Date().getFullYear();
    if (slipYear < 1990 || slipYear > currentYear) {
        showNotification('Please enter a valid year', 'error');
        return false;
    }
    
    return true;
}

/**
 * Generate projection for next year based on imported data
 * @param {Object} importedData - Imported PF data
 * @param {number} projectionYear - Year to project to
 * @param {number} projectionInterestRate - Annual interest rate for projection
 */
function generateProjection(importedData, projectionYear, projectionInterestRate) {
    // Calculate years difference
    const yearsDifference = projectionYear - importedData.year;
    
    if (yearsDifference <= 0) {
        showNotification('Projection year must be after the imported slip year', 'error');
        return;
    }
    
    // Initialize projection data
    const projectionData = {
        importedYear: {
            year: importedData.year,
            openingBalance: importedData.openingBalance,
            employeeContributions: importedData.employeeContributions,
            employerContributions: importedData.employerContributions,
            interestEarned: importedData.interestEarned,
            closingBalance: importedData.closingBalance
        },
        projectionYears: []
    };
    
    // Get monthly values for projections
    const monthlySalary = importedData.monthlySalary;
    const monthlyEmployeeContribution = importedData.monthlyEmployeeContribution;
    const monthlyEmployerContribution = importedData.monthlyEmployerContribution;
    
    // Current balance starts from imported closing balance
    let currentBalance = importedData.closingBalance;
    
    // Project for each year between imported and projection year
    for (let year = importedData.year + 1; year <= projectionYear; year++) {
        let yearlyEmployeeContribution = 0;
        let yearlyEmployerContribution = 0;
        let yearlyInterest = 0;
        let yearOpeningBalance = currentBalance;
        
        // Project monthly for more accurate compounding
        for (let month = 0; month < 12; month++) {
            // Monthly contributions
            yearlyEmployeeContribution += monthlyEmployeeContribution;
            yearlyEmployerContribution += monthlyEmployerContribution;
            
            // Add monthly contributions to balance
            currentBalance += monthlyEmployeeContribution + monthlyEmployerContribution;
            
            // Calculate monthly interest (annual rate / 12)
            const monthlyInterest = currentBalance * (projectionInterestRate / 12);
            yearlyInterest += monthlyInterest;
            
            // Add interest to balance
            currentBalance += monthlyInterest;
        }
        
        // Round values to 2 decimal places
        yearlyEmployeeContribution = Math.round(yearlyEmployeeContribution * 100) / 100;
        yearlyEmployerContribution = Math.round(yearlyEmployerContribution * 100) / 100;
        yearlyInterest = Math.round(yearlyInterest * 100) / 100;
        currentBalance = Math.round(currentBalance * 100) / 100;
        
        // Add year data to projection
        projectionData.projectionYears.push({
            year,
            openingBalance: yearOpeningBalance,
            employeeContributions: yearlyEmployeeContribution,
            employerContributions: yearlyEmployerContribution,
            interestEarned: yearlyInterest,
            closingBalance: currentBalance
        });
    }
    
    // Store projection results in state
    projectionState.projectionResults = projectionData;
    
    // Display projection results
    displayProjectionResults(projectionData);
    
    // Show results container
    projectionResultsContainer.classList.add('active');
    
    // Scroll to results
    projectionResultsContainer.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Display projection results in the UI
 * @param {Object} projectionData - Projection data
 */
function displayProjectionResults(projectionData) {
    // Display summary
    projectionSummary.innerHTML = `
        <div class="summary__item">
            <span class="summary__key">Imported Year (${projectionData.importedYear.year}):</span>
            <span class="summary__value">${formatCurrency(projectionData.importedYear.closingBalance)}</span>
        </div>
        <div class="summary__item">
            <span class="summary__key">Opening Balance (${projectionData.importedYear.year}):</span>
            <span class="summary__value">${formatCurrency(projectionData.importedYear.openingBalance)}</span>
        </div>
        <div class="summary__item">
            <span class="summary__key">Contributions in ${projectionData.importedYear.year}:</span>
            <span class="summary__value">${formatCurrency(projectionData.importedYear.employeeContributions + projectionData.importedYear.employerContributions)}</span>
        </div>
        <div class="summary__item">
            <span class="summary__key">Interest in ${projectionData.importedYear.year}:</span>
            <span class="summary__value">${formatCurrency(projectionData.importedYear.interestEarned)}</span>
        </div>
    `;
    
    // Add projected year summary
    const latestYear = projectionData.projectionYears[projectionData.projectionYears.length - 1];
    projectionSummary.innerHTML += `
        <div class="summary__divider"></div>
        <div class="summary__item">
            <span class="summary__key">Projected Balance (${latestYear.year}):</span>
            <span class="summary__value summary__value--large">${formatCurrency(latestYear.closingBalance)}</span>
        </div>
        <div class="summary__item">
            <span class="summary__key">Projected Contributions in ${latestYear.year}:</span>
            <span class="summary__value">${formatCurrency(latestYear.employeeContributions + latestYear.employerContributions)}</span>
        </div>
        <div class="summary__item">
            <span class="summary__key">Projected Interest in ${latestYear.year}:</span>
            <span class="summary__value">${formatCurrency(latestYear.interestEarned)}</span>
        </div>
        <div class="summary__item">
            <span class="summary__key">Total Growth:</span>
            <span class="summary__value">${formatCurrency(latestYear.closingBalance - projectionData.importedYear.closingBalance)}</span>
        </div>
    `;
    
    // Populate table
    const tableBody = projectionTable.querySelector('tbody');
    tableBody.innerHTML = '';
    
    // Add imported year row
    const importedRow = document.createElement('tr');
    importedRow.innerHTML = `
        <td>${projectionData.importedYear.year} (Imported)</td>
        <td>${formatCurrency(projectionData.importedYear.openingBalance)}</td>
        <td>${formatCurrency(projectionData.importedYear.employeeContributions)}</td>
        <td>${formatCurrency(projectionData.importedYear.employerContributions)}</td>
        <td>${formatCurrency(projectionData.importedYear.interestEarned)}</td>
        <td>${formatCurrency(projectionData.importedYear.closingBalance)}</td>
    `;
    importedRow.classList.add('imported-year-row');
    tableBody.appendChild(importedRow);
    
    // Add projection rows
    projectionData.projectionYears.forEach(yearData => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${yearData.year} ${yearData.year === latestYear.year ? '(Projected)' : ''}</td>
            <td>${formatCurrency(yearData.openingBalance)}</td>
            <td>${formatCurrency(yearData.employeeContributions)}</td>
            <td>${formatCurrency(yearData.employerContributions)}</td>
            <td>${formatCurrency(yearData.interestEarned)}</td>
            <td>${formatCurrency(yearData.closingBalance)}</td>
        `;
        if (yearData.year === latestYear.year) {
            row.classList.add('projected-year-row');
        }
        tableBody.appendChild(row);
    });
    
    // Generate chart
    createProjectionChart(projectionData);
}

/**
 * Create a chart showing projection data
 * @param {Object} projectionData - Projection data
 */
function createProjectionChart(projectionData) {
    const ctx = projectionChart.getContext('2d');
    
    // Prepare data for chart
    const years = [
        projectionData.importedYear.year.toString(),
        ...projectionData.projectionYears.map(data => data.year.toString())
    ];
    
    const balances = [
        projectionData.importedYear.closingBalance,
        ...projectionData.projectionYears.map(data => data.closingBalance)
    ];
    
    const contributions = [
        projectionData.importedYear.employeeContributions + projectionData.importedYear.employerContributions,
        ...projectionData.projectionYears.map(data => data.employeeContributions + data.employerContributions)
    ];
    
    const interest = [
        projectionData.importedYear.interestEarned,
        ...projectionData.projectionYears.map(data => data.interestEarned)
    ];
    
    // Calculate cumulative values
    const cumulativeContributions = [];
    const cumulativeInterest = [];
    let runningContributions = 0;
    let runningInterest = 0;
    
    // Start with imported year opening balance
    let previousBalance = projectionData.importedYear.openingBalance;
    
    // Add imported year contributions and interest
    runningContributions += projectionData.importedYear.employeeContributions + 
                          projectionData.importedYear.employerContributions;
    runningInterest += projectionData.importedYear.interestEarned;
    
    cumulativeContributions.push(runningContributions);
    cumulativeInterest.push(runningInterest);
    
    // Add projected years
    for (const yearData of projectionData.projectionYears) {
        runningContributions += yearData.employeeContributions + yearData.employerContributions;
        runningInterest += yearData.interestEarned;
        
        cumulativeContributions.push(runningContributions);
        cumulativeInterest.push(runningInterest);
    }
    
    // Determine chart colors based on theme
    const chartColors = getChartColors();
    
    // Destroy existing chart if it exists
    if (projectionGrowthChart) {
        projectionGrowthChart.destroy();
    }
    
    // Create new chart
    projectionGrowthChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [{
                label: 'Opening Balance',
                data: [projectionData.importedYear.openingBalance, ...projectionData.projectionYears.map(data => data.openingBalance)],
                backgroundColor: chartColors.openingBalance,
                stack: 'Stack 0',
            }, {
                label: 'Contributions',
                data: contributions,
                backgroundColor: chartColors.contributions,
                stack: 'Stack 0',
            }, {
                label: 'Interest',
                data: interest,
                backgroundColor: chartColors.interest,
                stack: 'Stack 0',
            }, {
                type: 'line',
                label: 'Closing Balance',
                data: balances,
                borderColor: chartColors.balanceLine,
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointBackgroundColor: chartColors.balanceLine,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Get chart colors based on current theme
 * @returns {Object} - Chart colors
 */
function getChartColors() {
    const isDarkMode = document.body.classList.contains('dark-theme');
    
    if (isDarkMode) {
        return {
            openingBalance: 'rgba(114, 9, 183, 0.7)',
            contributions: 'rgba(76, 201, 240, 0.7)',
            interest: 'rgba(247, 37, 133, 0.7)',
            balanceLine: '#4cc9f0'
        };
    } else {
        return {
            openingBalance: 'rgba(63, 55, 201, 0.7)',
            contributions: 'rgba(67, 97, 238, 0.7)',
            interest: 'rgba(72, 149, 239, 0.7)',
            balanceLine: '#3f37c9'
        };
    }
}

/**
 * Update projection when chart settings change
 */
function updateProjection() {
    if (!projectionState.importedData) {
        showNotification('Please import data first', 'error');
        return;
    }
    
    // Get projection parameters
    const projectionYear = parseInt(document.getElementById('projectionYear').value);
    const projectionInterestRate = parseFloat(document.getElementById('projectionInterestRate').value) / 100;
    
    // Validate inputs
    if (!validateProjectionInputs(projectionYear, projectionInterestRate)) {
        return;
    }
    
    // Generate projection
    generateProjection(projectionState.importedData, projectionYear, projectionInterestRate);
}

/**
 * Show notification message
 * @param {string} message - Message to display
 * @param {string} type - Notification type ('success', 'error', 'info')
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.innerHTML = `
        <div class="notification__content">
            ${message}
        </div>
        <button class="notification__close" aria-label="Close notification">×</button>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('notification--show');
    }, 10);
    
    // Add close handler
    const closeBtn = notification.querySelector('.notification__close');
    closeBtn.addEventListener('click', () => {
        notification.classList.remove('notification--show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        notification.classList.remove('notification--show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Format currency (reused from main calculator)
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}
