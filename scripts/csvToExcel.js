const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Convert sample-products.csv to products.xlsx
const csvPath = path.join(__dirname, '../data/sample-products.csv');
const xlsxPath = path.join(__dirname, '../data/products.xlsx');

console.log('Converting CSV to Excel...');
console.log('Reading from:', csvPath);

// Read CSV file
const csvData = fs.readFileSync(csvPath, 'utf8');

// Parse CSV to worksheet
const worksheet = xlsx.utils.aoa_to_sheet(
  csvData.split('\n').map(row => row.split(',').map(cell => cell.trim()))
);

// Create workbook
const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, 'Products');

// Write Excel file
xlsx.writeFile(workbook, xlsxPath);

console.log('✓ Excel file created:', xlsxPath);
console.log('\nNext steps:');
console.log('1. Copy product images to: public/uploads/products/');
console.log('2. Run: node scripts/bulkImportProducts.js');
