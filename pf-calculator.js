/**
 * PF Calculator - A tool to calculate Provident Fund contributions and maturity amount
 * Author: GitHub Copilot
 * Date: May 12, 2025
 */

// DOM Elements
const pfForm = document.getElementById('pfForm');
const resultsContainer = document.getElementById('resultsContainer');
const resultsSummary = document.getElementById('resultsSummary');
const resultsTable = document.getElementById('resultsTable');
const themeToggle = document.getElementById('themeToggle');
const pfGrowthChart = document.getElementById('pfGrowthChart');

// Chart instance
let growthChart = null;

// Application State
const state = {
    isDarkMode: false,
    calculationResults: null
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme based on user preference
    initializeTheme();
    
    // Form submission handler
    pfForm.addEventListener('submit', handleFormSubmit);
    
    // Theme toggle handler
    themeToggle.addEventListener('click', toggleTheme);
});

/**
 * Initialize theme based on user's system preference
 */
function initializeTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-theme');
        state.isDarkMode = true;
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (e.matches) {
            document.body.classList.add('dark-theme');
            state.isDarkMode = true;
        } else {
            document.body.classList.remove('dark-theme');
            state.isDarkMode = false;
        }
        
        // Update chart if it exists
        if (state.calculationResults) {
            updateChart();
        }
    });
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    state.isDarkMode = document.body.classList.contains('dark-theme');
    
    // Update chart if it exists
    if (state.calculationResults) {
        updateChart();
    }
}

/**
 * Handle the form submission and calculate PF
 * @param {Event} e - Form submit event
 */
function handleFormSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const salary = parseFloat(document.getElementById('salary').value);
    const employeeContribution = parseFloat(document.getElementById('employeeContribution').value) / 100;
    const employerContribution = parseFloat(document.getElementById('employerContribution').value) / 100;
    const interestRate = parseFloat(document.getElementById('interestRate').value) / 100;
    const years = parseInt(document.getElementById('years').value);
    
    // Validate inputs
    if (!validateInputs(salary, employeeContribution, employerContribution, interestRate, years)) {
        return;
    }
    
    // Calculate PF growth
    const results = calculatePF(salary, employeeContribution, employerContribution, interestRate, years);
    
    // Store results in state
    state.calculationResults = results;
    
    // Display results
    displayResults(results);
    
    // Show results container
    resultsContainer.classList.add('active');
    
    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Validate user inputs
 * @param {number} salary - Monthly basic salary
 * @param {number} employeeContribution - Employee contribution rate
 * @param {number} employerContribution - Employer contribution rate
 * @param {number} interestRate - Annual interest rate
 * @param {number} years - Number of years
 * @returns {boolean} - Whether inputs are valid
 */
function validateInputs(salary, employeeContribution, employerContribution, interestRate, years) {
    // Check if all inputs are valid numbers
    if (isNaN(salary) || isNaN(employeeContribution) || isNaN(employerContribution) || 
        isNaN(interestRate) || isNaN(years)) {
        alert('Please enter valid numbers for all fields');
        return false;
    }
    
    // Check for negative values
    if (salary < 0 || employeeContribution < 0 || employerContribution < 0 || 
        interestRate < 0 || years <= 0) {
        alert('Please enter positive values');
        return false;
    }
    
    // Check if salary is too high (arbitrary limit to prevent overflow)
    if (salary > 10000000) {
        alert('Please enter a reasonable salary amount');
        return false;
    }
    
    // Check if contribution percentages are within range
    if (employeeContribution > 1 || employerContribution > 1) {
        alert('Contribution percentages should be between 0 and 100');
        return false;
    }
    
    // Check if interest rate is reasonable
    if (interestRate > 0.3) { // 30% interest rate is unreasonably high
        alert('Please enter a reasonable interest rate');
        return false;
    }
    
    // Check if years is within reasonable range
    if (years > 50) {
        alert('Please enter a reasonable number of years (up to 50)');
        return false;
    }
    
    return true;
}

/**
 * Calculate PF growth over the specified period
 * @param {number} salary - Monthly basic salary
 * @param {number} employeeContribution - Employee contribution rate
 * @param {number} employerContribution - Employer contribution rate
 * @param {number} interestRate - Annual interest rate
 * @param {number} years - Number of years
 * @returns {Object} - Calculation results
 */
function calculatePF(salary, employeeContribution, employerContribution, interestRate, years) {
    // Monthly contributions
    const monthlyEmployeeContribution = salary * employeeContribution;
    const monthlyEmployerContribution = salary * employerContribution;
    const monthlyTotalContribution = monthlyEmployeeContribution + monthlyEmployerContribution;
    
    // Initialize arrays to store yearly data
    const yearlyData = [];
    let totalEmployeeContribution = 0;
    let totalEmployerContribution = 0;
    let totalInterestEarned = 0;
    let balance = 0;
    
    // Calculate year by year growth
    for (let year = 1; year <= years; year++) {
        // Annual contributions
        const annualEmployeeContribution = monthlyEmployeeContribution * 12;
        const annualEmployerContribution = monthlyEmployerContribution * 12;
        
        // Update running totals
        totalEmployeeContribution += annualEmployeeContribution;
        totalEmployerContribution += annualEmployerContribution;
        
        // Calculate interest on previous balance + half of this year's contributions
        // This approximation assumes contributions are made throughout the year
        const interestBase = balance + (annualEmployeeContribution + annualEmployerContribution) / 2;
        const yearlyInterest = interestBase * interestRate;
        
        // Update totals
        totalInterestEarned += yearlyInterest;
        balance += annualEmployeeContribution + annualEmployerContribution + yearlyInterest;
        
        // Store yearly data
        yearlyData.push({
            year,
            employeeContribution: annualEmployeeContribution,
            employerContribution: annualEmployerContribution,
            interest: yearlyInterest,
            balance
        });
    }
    
    // Return calculation results
    return {
        monthlyEmployeeContribution,
        monthlyEmployerContribution,
        monthlyTotalContribution,
        totalEmployeeContribution,
        totalEmployerContribution,
        totalInterestEarned,
        maturityAmount: balance,
        yearlyData
    };
}

/**
 * Format currency values for display
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Display calculation results in the UI
 * @param {Object} results - Calculation results
 */
function displayResults(results) {
    // Display summary
    resultsSummary.innerHTML = `
        <div class="summary__item">
            <span class="summary__key">Monthly Employee Contribution:</span>
            <span class="summary__value">${formatCurrency(results.monthlyEmployeeContribution)}</span>
        </div>
        <div class="summary__item">
            <span class="summary__key">Monthly Employer Contribution:</span>
            <span class="summary__value">${formatCurrency(results.monthlyEmployerContribution)}</span>
        </div>
        <div class="summary__item">
            <span class="summary__key">Monthly Total Contribution:</span>
            <span class="summary__value">${formatCurrency(results.monthlyTotalContribution)}</span>
        </div>
        <div class="summary__item">
            <span class="summary__key">Total Employee Contribution:</span>
            <span class="summary__value">${formatCurrency(results.totalEmployeeContribution)}</span>
        </div>
        <div class="summary__item">
            <span class="summary__key">Total Employer Contribution:</span>
            <span class="summary__value">${formatCurrency(results.totalEmployerContribution)}</span>
        </div>
        <div class="summary__item">
            <span class="summary__key">Total Interest Earned:</span>
            <span class="summary__value">${formatCurrency(results.totalInterestEarned)}</span>
        </div>
        <div class="summary__item">
            <span class="summary__key">PF Maturity Amount:</span>
            <span class="summary__value summary__value--large">${formatCurrency(results.maturityAmount)}</span>
        </div>
    `;
    
    // Populate table
    const tableBody = resultsTable.querySelector('tbody');
    tableBody.innerHTML = '';
    
    results.yearlyData.forEach(data => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${data.year}</td>
            <td>${formatCurrency(data.employeeContribution)}</td>
            <td>${formatCurrency(data.employerContribution)}</td>
            <td>${formatCurrency(data.interest)}</td>
            <td>${formatCurrency(data.balance)}</td>
        `;
        tableBody.appendChild(row);
    });
    
    // Generate chart
    createChart(results);
}

/**
 * Create a chart showing PF growth over the years
 * @param {Object} results - Calculation results
 */
function createChart(results) {
    const ctx = pfGrowthChart.getContext('2d');
    const years = results.yearlyData.map(data => `Year ${data.year}`);
    const balances = results.yearlyData.map(data => data.balance);
    const employeeContributions = results.yearlyData.map((data, index) => 
        index === 0 ? data.employeeContribution : 
        results.yearlyData[index-1].employeeContribution + data.employeeContribution
    );
    const employerContributions = results.yearlyData.map((data, index) => 
        index === 0 ? data.employerContribution : 
        results.yearlyData[index-1].employerContribution + data.employerContribution
    );
    const interestEarned = results.yearlyData.map((data, index) => 
        index === 0 ? data.interest : 
        results.yearlyData[index-1].interest + data.interest
    );
    
    // Determine chart colors based on theme
    const chartColors = getChartColors();
    
    // Destroy existing chart if it exists
    if (growthChart) {
        growthChart.destroy();
    }
    
    // Create new chart
    growthChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [{
                label: 'Employee Contribution',
                data: employeeContributions,
                backgroundColor: chartColors.employeeContribution,
                stack: 'Stack 0',
            }, {
                label: 'Employer Contribution',
                data: employerContributions,
                backgroundColor: chartColors.employerContribution,
                stack: 'Stack 0',
            }, {
                label: 'Interest Earned',
                data: interestEarned,
                backgroundColor: chartColors.interest,
                stack: 'Stack 0',
            }, {
                type: 'line',
                label: 'Total Balance',
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
    if (state.isDarkMode) {
        return {
            employeeContribution: 'rgba(76, 201, 240, 0.7)',
            employerContribution: 'rgba(114, 9, 183, 0.7)',
            interest: 'rgba(247, 37, 133, 0.7)',
            balanceLine: '#4cc9f0'
        };
    } else {
        return {
            employeeContribution: 'rgba(67, 97, 238, 0.7)',
            employerContribution: 'rgba(72, 149, 239, 0.7)',
            interest: 'rgba(63, 55, 201, 0.7)',
            balanceLine: '#3f37c9'
        };
    }
}

/**
 * Update chart colors when theme changes
 */
function updateChart() {
    if (growthChart) {
        const chartColors = getChartColors();
        growthChart.data.datasets[0].backgroundColor = chartColors.employeeContribution;
        growthChart.data.datasets[1].backgroundColor = chartColors.employerContribution;
        growthChart.data.datasets[2].backgroundColor = chartColors.interest;
        growthChart.data.datasets[3].borderColor = chartColors.balanceLine;
        growthChart.data.datasets[3].pointBackgroundColor = chartColors.balanceLine;
        growthChart.update();
    }
}
