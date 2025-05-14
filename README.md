# PF-Calculator

A clean, responsive, and user-friendly Provident Fund (PF) Calculator Web App built with HTML, CSS, and Vanilla JavaScript.

## Features

### Standard Calculator
- Calculate PF maturity amount and monthly contributions based on user inputs
- Professional, minimalist UI with focus on usability and clarity
- Collect user salary, employee/employer contribution percentages, interest rate, and years of service
- Display year-wise growth with compound interest 
- Visualize growth using Chart.js

### NEW: Year-Wise Increment Module
- Apply annual increments to both employee and employer contributions
- Choose between percentage-based or fixed amount increments
- Visualize the growth effect of annual contribution increases
- View detailed year-by-year breakdown of salary and contribution growth
- Track year-over-year growth rates with additional chart visualization

### Previous-Year Slip Import & Next-Year Projection
- Import previous year's PF slip data via CSV upload or manual entry
- Automatically populate calculator with values derived from imported data
- Project future growth based on imported data and user-defined parameters
- Calculate next year's monthly contributions and estimated maturity amount
- Visualize growth from imported data through projected years

### UI/UX Features
- Responsive design for mobile and desktop
- Dark/light mode toggle
- Glassmorphism/Neumorphism design elements
- Tabbed interface for different calculator modes
- Semantic HTML structure for accessibility
- Interactive notifications system

## How to Use

### Standard Calculator
1. Enter your monthly basic salary + DA (Dearness Allowance) in rupees
2. Set your employee contribution percentage (standard is 12%)
3. Set employer contribution percentage (standard is 12%)
4. Enter the expected annual interest rate (current EPF rate: 8.15%)
5. Specify the number of years of service
6. (Optional) Enable annual increments and configure settings:
   - Choose percentage or fixed amount for employee and employer increments
   - Set increment values for each
7. Click "Calculate" to view results
8. View monthly contributions, total maturity amount, and year-wise breakdown
9. If increments are enabled, view the detailed increment table and growth rate chart

### Import & Projection
1. Switch to the "Import & Project" tab
2. Either:
   - Upload a CSV file with your previous year's PF slip data, OR
   - Enter the data manually (opening balance, contributions, interest earned)
3. Set the projection year and expected interest rate
4. Click "Generate Projection" to see results
5. View the year-by-year breakdown and graphical representation

#### CSV Format
The CSV file should contain the following information:
- Opening Balance
- Employee Contributions
- Employer Contributions
- Interest Earned
- Year information

## Technologies Used

- HTML5
- CSS3 (BEM naming convention)
- Vanilla JavaScript (modular structure)
- Chart.js for data visualization
- Google Fonts (Inter)

## Project Structure

- `index.html` - Main HTML structure with semantic markup
- `style.css` - BEM-styled CSS with responsive design and theme support
- `pf-calculator.js` - Core calculator functionality
- `pf-projection.js` - Import and projection functionality

## Deployment

The app is optimized for deployment on Netlify or GitHub Pages.

## License

This project is created for educational purposes.