// dataPreprocessing.js - Data Cleaning and Feature Engineering

function preprocessData(rawData) {
    console.log('🔄 Starting data preprocessing...');
    
    // Remove rows with missing critical values
    let cleanedData = rawData.filter(d => {
        return d['Test Results'] && 
               d.Age && 
               d.Hospital && 
               d['Medical Condition'] &&
               d['Date of Admission'] &&
               d['Discharge Date'];
    });
    
    console.log(`✅ Removed ${rawData.length - cleanedData.length} rows with missing values`);
    
    // Process each row
    cleanedData.forEach(d => {
        // Convert data types
        d.Age = parseInt(d.Age) || 0;
        d['Billing Amount'] = parseFloat(d['Billing Amount']) || 0;
        
        // Fill missing values with defaults
        d.Gender = d.Gender || 'Unknown';
        d['Blood Type'] = d['Blood Type'] || 'Unknown';
        d.Medication = d.Medication || 'None';
        
        // Calculate Length of Stay
        let admission = new Date(d['Date of Admission']);
        let discharge = new Date(d['Discharge Date']);
        d.LengthOfStay = Math.max(1, Math.ceil((discharge - admission) / (1000 * 60 * 60 * 24)));
        
        // Create Age Groups
        let age = d.Age;
        if (age <= 18) {
            d.AgeGroup = '0-18';
        } else if (age <= 40) {
            d.AgeGroup = '19-40';
        } else if (age <= 65) {
            d.AgeGroup = '41-65';
        } else {
            d.AgeGroup = '65+';
        }
        
        // Normalize Test Results (handle variations)
        d['Test Results'] = d['Test Results'].trim();
    });
    
    console.log('✅ Data preprocessing complete!');
    console.log('📊 Sample processed record:', cleanedData[0]);
    
    return cleanedData;
}

// Helper function to get unique values from a column
function getUniqueValues(data, column) {
    return [...new Set(data.map(d => d[column]))].filter(v => v).sort();
}

// Helper function to count occurrences
function countBy(data, column) {
    return d3.rollup(data, v => v.length, d => d[column]);
}

// Helper function to group by multiple columns
function groupBy(data, column1, column2) {
    return d3.rollup(data, 
        v => v.length, 
        d => d[column1], 
        d => d[column2]
    );
}

// Helper function to calculate statistics
function calculateStats(data, column) {
    let values = data.map(d => parseFloat(d[column])).filter(v => !isNaN(v));
    
    return {
        min: d3.min(values),
        max: d3.max(values),
        mean: d3.mean(values),
        median: d3.median(values),
        count: values.length
    };
}