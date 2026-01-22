// arcgisMap.js - ArcGIS Map Integration

// Sample hospital coordinates (you'll need to expand this based on your dataset)
const hospitalCoordinates = {
    // Major US Cities (example coordinates)
    "Smith PLC": [-74.0060, 40.7128],           // New York
    "Johnson Inc": [-118.2437, 34.0522],        // Los Angeles
    "Williams-Davis": [-87.6298, 41.8781],      // Chicago
    "Davis, Michael and Sons": [-95.3698, 29.7604], // Houston
    "Brown Group": [-112.0740, 33.4484],        // Phoenix
    "Taylor LLC": [-75.1652, 39.9526],          // Philadelphia
    "Anderson-Smith": [-98.4936, 29.4241],      // San Antonio
    "Thomas-Moore": [-117.1611, 32.7157],       // San Diego
    "Jackson-Scott": [-96.7970, 32.7767],       // Dallas
    "White and Sons": [-121.8863, 37.3382],     // San Jose
    "Harris, Kelly and Sons": [-97.7431, 30.2672], // Austin
    "Martin-Garcia": [-86.1581, 39.7684],       // Indianapolis
    "Thompson-King": [-82.9988, 39.9612],       // Columbus
    "Garcia Ltd": [-80.1918, 25.7617],          // Miami
    "Martinez Inc": [-122.3321, 47.6062],       // Seattle
    "Robinson-Hernandez": [-104.9903, 39.7392], // Denver
    "Clark-Lopez": [-77.0369, 38.9072],         // Washington DC
    "Rodriguez and Sons": [-71.0589, 42.3601],  // Boston
    "Lewis and Sons": [-84.3880, 33.7490],      // Atlanta
    "Lee LLC": [-93.2650, 44.9778],             // Minneapolis
    "Walker PLC": [-122.4194, 37.7749],         // San Francisco
    "Hall-Allen": [-90.1994, 38.6270],          // St. Louis
    "Young, Deborah and Sons": [-81.6944, 41.4993], // Cleveland
    "Hernandez Inc": [-80.8431, 35.2271],       // Charlotte
    "King Ltd": [-111.8910, 40.7608]            // Salt Lake City
};

function initializeMap() {
    console.log('🗺️ Initializing ArcGIS map...');
    
    // Wait for ArcGIS to be fully loaded
    if (typeof require === 'undefined') {
        console.error('❌ ArcGIS loader not available yet, retrying...');
        setTimeout(initializeMap, 500);
        return;
    }
    
    // Aggregate hospital data
    const hospitalData = aggregateHospitalData(globalData);
    
    require([
        "esri/Map",
        "esri/views/MapView",
        "esri/Graphic",
        "esri/layers/GraphicsLayer"
    ], function(Map, MapView, Graphic, GraphicsLayer) {
        
        // Create map
        const map = new Map({
            basemap: "streets-navigation-vector"
        });
        
        // Create map view
        const view = new MapView({
            container: "mapDiv",
            map: map,
            center: [-98, 39.5], // Center of USA
            zoom: 4
        });
        
        // Create graphics layer for hospital markers
        const graphicsLayer = new GraphicsLayer();
        map.add(graphicsLayer);
        
        // Add hospital markers
        hospitalData.forEach(hospital => {
            const coords = hospitalCoordinates[hospital.name];
            
            if (coords) {
                // Determine marker color based on dominant test result
                let markerColor;
                switch (hospital.dominantResult) {
                    case 'Normal':
                        markerColor = [76, 175, 80]; // Green
                        break;
                    case 'Abnormal':
                        markerColor = [244, 67, 54]; // Red
                        break;
                    case 'Inconclusive':
                        markerColor = [255, 152, 0]; // Orange
                        break;
                    default:
                        markerColor = [102, 126, 234]; // Blue
                }
                
                // Create point geometry
                const point = {
                    type: "point",
                    longitude: coords[0],
                    latitude: coords[1]
                };
                
                // Create marker symbol - size based on patient count
                const markerSize = Math.min(40, Math.max(12, hospital.patientCount / 10));
                
                const markerSymbol = {
                    type: "simple-marker",
                    color: markerColor,
                    size: markerSize,
                    outline: {
                        color: [255, 255, 255],
                        width: 2
                    }
                };
                
                // Create popup template
                const popupTemplate = {
                    title: "🏥 {name}",
                    content: `
                        <div style="padding: 10px;">
                            <p><strong>📊 Statistics:</strong></p>
                            <ul style="margin: 5px 0; padding-left: 20px;">
                                <li><strong>Patients:</strong> {patientCount}</li>
                                <li><strong>Avg Billing:</strong> ${hospital.avgBilling.toFixed(2)}</li>
                                <li><strong>Avg Stay:</strong> {avgStay} days</li>
                            </ul>
                            <p style="margin-top: 10px;"><strong>🧪 Test Results:</strong></p>
                            <ul style="margin: 5px 0; padding-left: 20px;">
                                <li style="color: #4CAF50;"><strong>Normal:</strong> {normalCount}</li>
                                <li style="color: #F44336;"><strong>Abnormal:</strong> {abnormalCount}</li>
                                <li style="color: #FF9800;"><strong>Inconclusive:</strong> {inconclusiveCount}</li>
                            </ul>
                            <p style="margin-top: 10px; padding: 8px; background: #f0f0f0; border-radius: 4px; text-align: center;">
                                <strong>Dominant Result:</strong> 
                                <span style="color: ${markerColor[0] === 76 ? '#4CAF50' : markerColor[0] === 244 ? '#F44336' : '#FF9800'};">
                                    {dominantResult}
                                </span>
                            </p>
                        </div>
                    `
                };
                
                // Create graphic
                const graphic = new Graphic({
                    geometry: point,
                    symbol: markerSymbol,
                    attributes: {
                        name: hospital.name,
                        patientCount: hospital.patientCount,
                        avgBilling: hospital.avgBilling,
                        avgStay: hospital.avgStay.toFixed(1),
                        dominantResult: hospital.dominantResult,
                        normalCount: hospital.testResults.get('Normal') || 0,
                        abnormalCount: hospital.testResults.get('Abnormal') || 0,
                        inconclusiveCount: hospital.testResults.get('Inconclusive') || 0
                    },
                    popupTemplate: popupTemplate
                });
                
                graphicsLayer.add(graphic);
            } else {
                console.warn(`⚠️ No coordinates for hospital: ${hospital.name}`);
            }
        });
        
        // Click event to filter D3 charts by hospital
        view.on("click", function(event) {
            view.hitTest(event).then(function(response) {
                if (response.results.length > 0) {
                    const graphic = response.results[0].graphic;
                    if (graphic.attributes && graphic.attributes.name) {
                        const hospitalName = graphic.attributes.name;
                        console.log('🏥 Hospital clicked:', hospitalName);
                        
                        // Update filter
                        document.getElementById('hospitalFilter').value = hospitalName;
                        
                        // Apply filter
                        applyFilters();
                        
                        // Show popup
                        view.popup.open({
                            location: event.mapPoint,
                            features: [graphic]
                        });
                    }
                }
            });
        });
        
        console.log('✅ Map initialized with', hospitalData.length, 'hospitals');
    });
}

// Aggregate data by hospital
function aggregateHospitalData(data) {
    const hospitalMap = d3.rollup(data,
        v => ({
            patientCount: v.length,
            avgBilling: d3.mean(v, d => d['Billing Amount']),
            avgStay: d3.mean(v, d => d.LengthOfStay),
            testResults: d3.rollup(v, v2 => v2.length, d => d['Test Results']),
            dominantResult: getDominantTestResult(v)
        }),
        d => d.Hospital
    );
    
    // Convert to array
    const hospitalArray = [];
    hospitalMap.forEach((stats, name) => {
        hospitalArray.push({
            name: name,
            ...stats
        });
    });
    
    return hospitalArray;
}

// Get dominant test result for a hospital
function getDominantTestResult(patients) {
    const counts = d3.rollup(patients, v => v.length, d => d['Test Results']);
    
    let maxCount = 0;
    let dominant = 'Normal';
    
    counts.forEach((count, result) => {
        if (count > maxCount) {
            maxCount = count;
            dominant = result;
        }
    });
    
    return dominant;
}

// Function to update map when filters change (optional enhancement)
function updateMapMarkers(filteredData) {
    // This function can be called when filters change to update marker sizes/colors
    // For now, we'll keep the map static
    console.log('📍 Map markers could be updated based on filtered data');
}