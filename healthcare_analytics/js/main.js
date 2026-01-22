// main.js - Fixed version using D3.csv instead of PapaParse

// Global variables
let globalData = [];
let filteredData = [];

// Load data when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Page loaded, starting data load...');
    showLoading();
    loadData();
});

function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function loadData() {
    // Load CSV file using D3.js (no PapaParse needed!)
    // OPTION 1: If file is named differently, change the path below
    // OPTION 2: If file is in root folder, use: 'healthcare_data.csv'
    // OPTION 3: Current path assumes: data/healthcare_data.csv
    
    const csvPath = 'data/healthcare_data.csv'; // ← CHANGE THIS IF NEEDED
    
    console.log('📂 Attempting to load CSV from:', csvPath);
    
    d3.csv(csvPath)
        .then(function(data) {
            console.log('✅ Data loaded:', data.length, 'records');
            console.log('📋 Sample row:', data[0]);
            
            // Preprocess data
            globalData = preprocessData(data);
            filteredData = [...globalData];
            
            console.log('✅ Data preprocessed:', globalData.length, 'records');
            console.log('📊 Sample processed row:', globalData[0]);
            
            // Initialize everything
            initializeFilters();
            updateAllVisualizations();
            updateStatistics();
            
            // Initialize map after a short delay to ensure ArcGIS is loaded
            setTimeout(function() {
                initializeMap();
            }, 1000);
            
            hideLoading();
        })
        .catch(function(error) {
            console.error('❌ Error loading data:', error);
            hideLoading();
            
            // Show user-friendly error message
            alert('Failed to load data. Please check:\n' +
                  '1. File exists at: data/healthcare_data.csv\n' +
                  '2. You are running a local server (not opening HTML directly)\n' +
                  '3. Check browser console for details');
        });
}

function initializeFilters() {
    // Populate hospital filter
    let hospitals = [...new Set(globalData.map(d => d.Hospital))].sort();
    let hospitalSelect = document.getElementById('hospitalFilter');
    hospitals.forEach(hospital => {
        let option = document.createElement('option');
        option.value = hospital;
        option.textContent = hospital;
        hospitalSelect.appendChild(option);
    });
    
    console.log('🏥 Loaded', hospitals.length, 'hospitals');
    
    // Populate condition filter
    let conditions = [...new Set(globalData.map(d => d['Medical Condition']))].sort();
    let conditionSelect = document.getElementById('conditionFilter');
    conditions.forEach(condition => {
        let option = document.createElement('option');
        option.value = condition;
        option.textContent = condition;
        conditionSelect.appendChild(option);
    });
    
    console.log('🏥 Loaded', conditions.length, 'medical conditions');
    
    // Add event listeners
    document.getElementById('hospitalFilter').addEventListener('change', applyFilters);
    document.getElementById('conditionFilter').addEventListener('change', applyFilters);
    document.getElementById('testResultFilter').addEventListener('change', applyFilters);
    document.getElementById('resetBtn').addEventListener('click', resetFilters);
}

function applyFilters() {
    let hospitalFilter = document.getElementById('hospitalFilter').value;
    let conditionFilter = document.getElementById('conditionFilter').value;
    let testResultFilter = document.getElementById('testResultFilter').value;
    
    filteredData = globalData.filter(d => {
        let matchHospital = hospitalFilter === 'all' || d.Hospital === hospitalFilter;
        let matchCondition = conditionFilter === 'all' || d['Medical Condition'] === conditionFilter;
        let matchTestResult = testResultFilter === 'all' || d['Test Results'] === testResultFilter;
        
        return matchHospital && matchCondition && matchTestResult;
    });
    
    console.log('🔍 Filtered:', filteredData.length, 'records out of', globalData.length);
    
    updateAllVisualizations();
    updateStatistics();
}

function resetFilters() {
    document.getElementById('hospitalFilter').value = 'all';
    document.getElementById('conditionFilter').value = 'all';
    document.getElementById('testResultFilter').value = 'all';
    
    filteredData = [...globalData];
    console.log('🔄 Filters reset');
    
    updateAllVisualizations();
    updateStatistics();
}

function updateAllVisualizations() {
    console.log('📊 Updating all visualizations...');
    
    createTestResultsChart(filteredData);
    createConditionsChart(filteredData);
    createBillingChart(filteredData);
    createDemographicsChart(filteredData);
    
    console.log('✅ All visualizations updated');
}

function updateStatistics() {
    // Total patients
    document.getElementById('totalPatients').textContent = filteredData.length.toLocaleString();
    
    // Average billing
    let avgBilling = d3.mean(filteredData, d => d['Billing Amount']);
    document.getElementById('avgBilling').textContent = '$' + avgBilling.toFixed(2);
    
    // Average stay
    let avgStay = d3.mean(filteredData, d => d.LengthOfStay);
    document.getElementById('avgStay').textContent = avgStay.toFixed(1);
    
    // Total hospitals
    let hospitals = new Set(filteredData.map(d => d.Hospital));
    document.getElementById('totalHospitals').textContent = hospitals.size;
    
    console.log('📈 Statistics updated');
}