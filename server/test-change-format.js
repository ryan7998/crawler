const ChangeDetectionService = require('./src/services/changeDetectionService');

// Mock data for testing the new change format
const mockChanges = {
    newUrls: [
        {
            url: 'https://example.com/new',
            currentData: { title: 'New Page', price: '$100' },
            currentStatus: 'success',
            currentDate: new Date('2024-01-02')
        }
    ],
    removedUrls: [
        {
            url: 'https://example.com/removed',
            previousData: { title: 'Old Page', price: '$50' },
            previousStatus: 'success',
            previousDate: new Date('2024-01-01')
        }
    ],
    changedUrls: [
        {
            url: 'https://example.com/changed',
            currentData: { title: 'Updated Page', price: '$150' },
            previousData: { title: 'Old Title', price: '$100' },
            currentStatus: 'success',
            previousStatus: 'success',
            currentDate: new Date('2024-01-02'),
            previousDate: new Date('2024-01-01'),
            fieldChanges: [
                {
                    field: 'title',
                    currentValue: 'Updated Page',
                    previousValue: 'Old Title',
                    changeType: 'changed'
                },
                {
                    field: 'price',
                    currentValue: '$150',
                    previousValue: '$100',
                    changeType: 'changed'
                }
            ]
        }
    ],
    unchangedUrls: [
        {
            url: 'https://example.com/unchanged',
            data: { title: 'Same Page', price: '$75' },
            status: 'success',
            date: new Date('2024-01-02')
        }
    ]
};

function testChangeFormat() {
    console.log('🔍 Testing New Change Format (Removed/New Rows)...\n');

    const changeDetectionService = new ChangeDetectionService();
    
    // Test the prepareForGoogleSheets method
    const sheetData = changeDetectionService.prepareForGoogleSheets(mockChanges);
    
    console.log('📊 Generated Sheet Data:');
    console.log('Headers:', sheetData[0]);
    console.log('');
    
    // Count different types of rows
    let newRows = 0;
    let removedRows = 0;
    let unchangedRows = 0;
    
    sheetData.slice(1).forEach((row, index) => {
        const [url, field, currentValue, previousValue, changeStatus, changeType, lastUpdated, previousDate] = row;
        
        console.log(`Row ${index + 1}:`);
        console.log(`  URL: ${url}`);
        console.log(`  Field: ${field}`);
        console.log(`  Current: "${currentValue}"`);
        console.log(`  Previous: "${previousValue}"`);
        console.log(`  Status: ${changeStatus} (${changeType})`);
        console.log(`  Dates: ${lastUpdated} / ${previousDate}`);
        console.log('');
        
        if (changeStatus === 'New') newRows++;
        else if (changeStatus === 'Removed') removedRows++;
        else if (changeStatus === 'Unchanged') unchangedRows++;
    });
    
    console.log('📈 Row Counts:');
    console.log(`  New rows: ${newRows}`);
    console.log(`  Removed rows: ${removedRows}`);
    console.log(`  Unchanged rows: ${unchangedRows}`);
    console.log(`  Total data rows: ${sheetData.length - 1}`);
    
    // Verify the expected behavior
    console.log('\n✅ Verification:');
    
    // Check that changes are split into two rows
    const changedUrlRows = sheetData.slice(1).filter(row => row[0] === 'https://example.com/changed');
    console.log(`  Changed URL has ${changedUrlRows.length} rows (expected: 4 - 2 fields × 2 rows each)`);
    
    // Check that each change field has both removed and new rows
    const titleRows = changedUrlRows.filter(row => row[1] === 'title');
    const priceRows = changedUrlRows.filter(row => row[1] === 'price');
    
    console.log(`  Title field has ${titleRows.length} rows (expected: 2)`);
    console.log(`  Price field has ${priceRows.length} rows (expected: 2)`);
    
    // Verify removed rows have empty current values
    const removedRowsData = sheetData.slice(1).filter(row => row[4] === 'Removed');
    const removedWithEmptyCurrent = removedRowsData.filter(row => row[2] === '');
    console.log(`  Removed rows with empty current values: ${removedWithEmptyCurrent.length}/${removedRowsData.length}`);
    
    // Verify new rows have empty previous values
    const newRowsData = sheetData.slice(1).filter(row => row[4] === 'New');
    const newWithEmptyPrevious = newRowsData.filter(row => row[3] === '');
    console.log(`  New rows with empty previous values: ${newWithEmptyPrevious.length}/${newRowsData.length}`);
    
    console.log('\n🎉 Change format test completed!');
}

// Run the test
if (require.main === module) {
    testChangeFormat();
}

module.exports = { testChangeFormat }; 