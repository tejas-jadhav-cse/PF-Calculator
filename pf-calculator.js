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
const incrementTable = document.getElementById('incrementTable');
const incrementDetailsContainer = document.getElementById('incrementDetailsContainer');
const themeToggle = document.getElementById('themeToggle');
const pfGrowthChart = document.getElementById('pfGrowthChart');
const standardTab = document.getElementById('standardTab');
const importTab = document.getElementById('importTab');
const standardCalculator = document.getElementById('standardCalculator');
const importCalculator = document.getElementById('importCalculator');
const enableIncrementsCheckbox = document.getElementById('enableIncrements');
const toggleIncrementsButton = document.getElementById('toggleIncrements');
const incrementsContainer = document.getElementById('incrementsContainer');

// Chart instance
let growthChart = null;

// Application State
const state = {
    isDarkMode: false,
    calculationResults: null,
    activeTab: 'standard', // 'standard' or 'import'
    incrementsEnabled: false
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme based on user preference
    initializeTheme();
    
    // Form submission handler
    if (pfForm) {
        pfForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Theme toggle handler
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Tab switching handlers
    if (standardTab && importTab) {
        standardTab.addEventListener('click', () => switchTab('standard'));
        importTab.addEventListener('click', () => switchTab('import'));
    }
    
    // Increment toggle handlers
    if (enableIncrementsCheckbox) {
        enableIncrementsCheckbox.addEventListener('change', toggleIncrementEnable);
    }
    
    if (toggleIncrementsButton) {
        toggleIncrementsButton.addEventListener('click', toggleIncrementDetails);
    }
    
    // Initialize increment details container (hide by default)
    if (incrementDetailsContainer) {
        incrementDetailsContainer.classList.add('hidden');
    }
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
    
    // Get increment settings if enabled
    let incrementSettings = null;
    if (state.incrementsEnabled) {
        // Get employee increment settings
        const employeeIncrementType = document.querySelector('input[name="employeeIncrementType"]:checked').value;
        const employeeIncrementValue = parseFloat(document.getElementById('employeeIncrementValue').value);
        
        // Get employer increment settings
        const employerIncrementType = document.querySelector('input[name="employerIncrementType"]:checked').value;
        const employerIncrementValue = parseFloat(document.getElementById('employerIncrementValue').value);
        
        // Create increment settings object
        incrementSettings = {
            enabled: true,
            employee: {
                type: employeeIncrementType,
                value: employeeIncrementValue
            },
            employer: {
                type: employerIncrementType,
                value: employerIncrementValue
            }
        };
    }
    
    // Calculate PF growth with increment settings
    const results = calculatePF(salary, employeeContribution, employerContribution, interestRate, years, incrementSettings);
    
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
 * Calculate PF growth over the specified period with optional increments
 * @param {number} salary - Monthly basic salary
 * @param {number} employeeContribution - Employee contribution rate
 * @param {number} employerContribution - Employer contribution rate
 * @param {number} interestRate - Annual interest rate
 * @param {number} years - Number of years
 * @param {Object} incrementSettings - Optional increment settings
 * @returns {Object} - Calculation results
 */
function calculatePF(salary, employeeContribution, employerContribution, interestRate, years, incrementSettings = null) {
    // Initial monthly contributions
    let currentMonthlySalary = salary;
    let monthlyEmployeeContribution = currentMonthlySalary * employeeContribution;
    let monthlyEmployerContribution = currentMonthlySalary * employerContribution;
    
    // Initialize arrays to store yearly data
    const yearlyData = [];
    const incrementData = [];
    let totalEmployeeContribution = 0;
    let totalEmployerContribution = 0;
    let totalInterestEarned = 0;
    let balance = 0;
    
    // Calculate year by year growth
    for (let year = 1; year <= years; year++) {
        // Store increment data for this year
        incrementData.push({
            year,
            monthlySalary: currentMonthlySalary,
            monthlyEmployeeContribution,
            monthlyEmployerContribution,
            incrementApplied: year > 1 ? 'Yes' : 'No'
        });
        
        // Track year's contributions
        let yearEmployeeContribution = 0;
        let yearEmployerContribution = 0;
        let yearInterestEarned = 0;
        
        // Calculate month-by-month for more accuracy
        for (let month = 0; month < 12; month++) {
            // Add monthly contributions to annual totals
            yearEmployeeContribution += monthlyEmployeeContribution;
            yearEmployerContribution += monthlyEmployerContribution;
            
            // Add to balance
            balance += monthlyEmployeeContribution + monthlyEmployerContribution;
            
            // Calculate monthly interest (annual rate / 12)
            const monthlyInterest = balance * (interestRate / 12);
            yearInterestEarned += monthlyInterest;
            
            // Add interest to balance
            balance += monthlyInterest;
        }
        
        // Update running totals
        totalEmployeeContribution += yearEmployeeContribution;
        totalEmployerContribution += yearEmployerContribution;
        totalInterestEarned += yearInterestEarned;
        
        // Store yearly data
        yearlyData.push({
            year,
            employeeContribution: yearEmployeeContribution,
            employerContribution: yearEmployerContribution,
            interest: yearInterestEarned,
            balance: Math.round(balance * 100) / 100
        });
        
        // Apply increments for the next year if needed
        if (incrementSettings && incrementSettings.enabled && year < years) {
            // Apply employee increment
            if (incrementSettings.employee.type === 'percentage') {
                // Percentage increase to monthly contribution
                if (incrementSettings.employee.value > 0) {
                    const employeeIncrementFactor = 1 + (incrementSettings.employee.value / 100);
                    monthlyEmployeeContribution *= employeeIncrementFactor;
                    
                    // If contribution is percentage-based, we need to recalculate the effective salary
                    if (employeeContribution > 0) {
                        currentMonthlySalary = monthlyEmployeeContribution / employeeContribution;
                    }
                }
            } else {
                // Fixed amount increase
                monthlyEmployeeContribution += incrementSettings.employee.value;
                
                // If contribution is percentage-based, we need to recalculate the effective salary
                if (employeeContribution > 0) {
                    currentMonthlySalary = monthlyEmployeeContribution / employeeContribution;
                }
            }
            
            // Apply employer increment
            if (incrementSettings.employer.type === 'percentage') {
                // Percentage increase
                if (incrementSettings.employer.value > 0) {
                    const employerIncrementFactor = 1 + (incrementSettings.employer.value / 100);
                    monthlyEmployerContribution *= employerIncrementFactor;
                }
            } else {
                // Fixed amount increase
                monthlyEmployerContribution += incrementSettings.employer.value;
            }
        }
    }
    
    // Round final values for precision
    monthlyEmployeeContribution = Math.round(monthlyEmployeeContribution * 100) / 100;
    monthlyEmployerContribution = Math.round(monthlyEmployerContribution * 100) / 100;
    
    // Return calculation results
    return {
        initialMonthlySalary: salary,
        finalMonthlySalary: currentMonthlySalary,
        initialMonthlyEmployeeContribution: salary * employeeContribution,
        initialMonthlyEmployerContribution: salary * employerContribution,
        finalMonthlyEmployeeContribution: monthlyEmployeeContribution,
        finalMonthlyEmployerContribution: monthlyEmployerContribution,
        totalEmployeeContribution,
        totalEmployerContribution,
        totalInterestEarned,
        maturityAmount: balance,
        yearlyData,
        incrementData,
        incrementsApplied: incrementSettings && incrementSettings.enabled
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
    // Display summary with initial and final values if increments were applied
    if (results.incrementsApplied) {
        resultsSummary.innerHTML = `
            <div class="summary__item">
                <span class="summary__key">Initial Monthly Salary:</span>
                <span class="summary__value">${formatCurrency(results.initialMonthlySalary)}</span>
            </div>
            <div class="summary__item">
                <span class="summary__key">Final Monthly Salary:</span>
                <span class="summary__value">${formatCurrency(results.finalMonthlySalary)}</span>
            </div>
            <div class="summary__item">
                <span class="summary__key">Initial Monthly Employee Contribution:</span>
                <span class="summary__value">${formatCurrency(results.initialMonthlyEmployeeContribution)}</span>
            </div>
            <div class="summary__item">
                <span class="summary__key">Final Monthly Employee Contribution:</span>
                <span class="summary__value">${formatCurrency(results.finalMonthlyEmployeeContribution)}</span>
            </div>
            <div class="summary__item">
                <span class="summary__key">Initial Monthly Employer Contribution:</span>
                <span class="summary__value">${formatCurrency(results.initialMonthlyEmployerContribution)}</span>
            </div>
            <div class="summary__item">
                <span class="summary__key">Final Monthly Employer Contribution:</span>
                <span class="summary__value">${formatCurrency(results.finalMonthlyEmployerContribution)}</span>
            </div>
            <div class="summary__divider"></div>
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
    } else {
        // Standard display without increments
        const monthlyTotalContribution = results.initialMonthlyEmployeeContribution + results.initialMonthlyEmployerContribution;
        resultsSummary.innerHTML = `
            <div class="summary__item">
                <span class="summary__key">Monthly Employee Contribution:</span>
                <span class="summary__value">${formatCurrency(results.initialMonthlyEmployeeContribution)}</span>
            </div>
            <div class="summary__item">
                <span class="summary__key">Monthly Employer Contribution:</span>
                <span class="summary__value">${formatCurrency(results.initialMonthlyEmployerContribution)}</span>
            </div>
            <div class="summary__item">
                <span class="summary__key">Monthly Total Contribution:</span>
                <span class="summary__value">${formatCurrency(monthlyTotalContribution)}</span>
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
    }
    
    // Populate main results table
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
    
    // Show/hide increment details table
    if (results.incrementsApplied && incrementDetailsContainer && incrementTable) {
        incrementDetailsContainer.classList.remove('hidden');
        
        // Populate increment details table
        const incrementTableBody = incrementTable.querySelector('tbody');
        incrementTableBody.innerHTML = '';
        
        results.incrementData.forEach(data => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${data.year}</td>
                <td>${formatCurrency(data.monthlySalary)}</td>
                <td>${formatCurrency(data.monthlyEmployeeContribution)}</td>
                <td>${formatCurrency(data.monthlyEmployerContribution)}</td>
                <td>${data.incrementApplied}</td>
            `;
            incrementTableBody.appendChild(row);
        });
    } else if (incrementDetailsContainer) {
        incrementDetailsContainer.classList.add('hidden');
    }
    
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
    
    // Calculate cumulative values year-by-year
    let cumulativeEmployeeContribution = 0;
    let cumulativeEmployerContribution = 0;
    let cumulativeInterest = 0;
    
    const employeeContributions = [];
    const employerContributions = [];
    const interestEarned = [];
    
    // Calculate yearly contributions and interest with proper accumulation
    results.yearlyData.forEach(data => {
        cumulativeEmployeeContribution += data.employeeContribution;
        cumulativeEmployerContribution += data.employerContribution;
        cumulativeInterest += data.interest;
        
        employeeContributions.push(cumulativeEmployeeContribution);
        employerContributions.push(cumulativeEmployerContribution);
        interestEarned.push(cumulativeInterest);
    });
    
    // For showing year-on-year growth rates if increments are applied
    const yearlyGrowthRates = [];
    if (results.incrementsApplied) {
        // Calculate growth rates between years
        for (let i = 1; i < results.yearlyData.length; i++) {
            const previousYear = results.yearlyData[i-1];
            const currentYear = results.yearlyData[i];
            const growthRate = ((currentYear.balance / previousYear.balance) - 1) * 100;
            yearlyGrowthRates.push(growthRate.toFixed(2));
        }
        yearlyGrowthRates.unshift(0); // No growth rate for first year
    }
    
    // Determine chart colors based on theme
    const chartColors = getChartColors();
    
    // Destroy existing chart if it exists
    if (growthChart) {
        growthChart.destroy();
    }
    
    // Prepare datasets array
    const datasets = [
        {
            label: 'Employee Contribution',
            data: employeeContributions,
            backgroundColor: chartColors.employeeContribution,
            stack: 'Stack 0',
        }, 
        {
            label: 'Employer Contribution',
            data: employerContributions,
            backgroundColor: chartColors.employerContribution,
            stack: 'Stack 0',
        }, 
        {
            label: 'Interest Earned',
            data: interestEarned,
            backgroundColor: chartColors.interest,
            stack: 'Stack 0',
        }, 
        {
            type: 'line',
            label: 'Total Balance',
            data: balances,
            borderColor: chartColors.balanceLine,
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointBackgroundColor: chartColors.balanceLine,
            tension: 0.1
        }
    ];
    
    // Add growth rate dataset if increments are applied
    if (results.incrementsApplied) {
        datasets.push({
            type: 'line',
            label: 'YoY Growth Rate (%)',
            data: yearlyGrowthRates,
            borderColor: chartColors.growthLine,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            pointBackgroundColor: chartColors.growthLine,
            tension: 0.1,
            yAxisID: 'y1'
        });
    }
    
    // Configure chart options
    const chartOptions = {
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
                },
                title: {
                    display: true,
                    text: 'Amount (₹)'
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
                            if (label.includes('Growth Rate')) {
                                label += context.parsed.y + '%';
                            } else {
                                label += formatCurrency(context.parsed.y);
                            }
                        }
                        return label;
                    }
                }
            },
            title: {
                display: true,
                text: results.incrementsApplied ? 
                    'PF Growth Over Time (with Annual Increments)' : 
                    'PF Growth Over Time',
                font: {
                    size: 16
                }
            },
            legend: {
                position: 'bottom'
            }
        }
    };
    
    // Add secondary y-axis if showing growth rates
    if (results.incrementsApplied) {
        chartOptions.scales.y1 = {
            position: 'right',
            beginAtZero: true,
            grid: {
                drawOnChartArea: false
            },
            ticks: {
                callback: function(value) {
                    return value + '%';
                }
            },
            title: {
                display: true,
                text: 'Growth Rate (%)'
            }
        };
    }
    
    // Create new chart
    growthChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: datasets
        },
        options: chartOptions
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
            balanceLine: '#4cc9f0',
            growthLine: '#f72585'
        };
    } else {
        return {
            employeeContribution: 'rgba(67, 97, 238, 0.7)',
            employerContribution: 'rgba(72, 149, 239, 0.7)',
            interest: 'rgba(63, 55, 201, 0.7)',
            balanceLine: '#3f37c9',
            growthLine: '#f3722c'
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

/**
 * Switch between calculator tabs (standard and import)
 * @param {string} tab - Tab to switch to ('standard' or 'import')
 */
function switchTab(tab) {
    // Update state
    state.activeTab = tab;
    
    // Update tab styling
    if (standardTab && importTab) {
        if (tab === 'standard') {
            standardTab.classList.add('tabs__tab--active');
            importTab.classList.remove('tabs__tab--active');
            
            standardCalculator.classList.remove('hidden');
            importCalculator.classList.add('hidden');
        } else {
            importTab.classList.add('tabs__tab--active');
            standardTab.classList.remove('tabs__tab--active');
            
            importCalculator.classList.remove('hidden');
            standardCalculator.classList.add('hidden');
        }
    }
}

/**
 * Toggle increment enable/disable state
 */
function toggleIncrementEnable() {
    state.incrementsEnabled = enableIncrementsCheckbox.checked;
    
    if (state.incrementsEnabled) {
        toggleIncrementsButton.setAttribute('aria-expanded', 'true');
        incrementsContainer.classList.remove('hidden');
    } else {
        toggleIncrementsButton.setAttribute('aria-expanded', 'false');
        incrementsContainer.classList.add('hidden');
    }
}

/**
 * Toggle display of increment details form
 */
function toggleIncrementDetails() {
    const expanded = toggleIncrementsButton.getAttribute('aria-expanded') === 'true';
    toggleIncrementsButton.setAttribute('aria-expanded', !expanded);
    
    if (!expanded) {
        incrementsContainer.classList.remove('hidden');
        enableIncrementsCheckbox.checked = true;
        state.incrementsEnabled = true;
    } else {
        incrementsContainer.classList.add('hidden');
    }
}
