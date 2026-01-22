// d3Visualizations.js - All D3.js Charts

// Color scheme for test results
const testResultColors = {
    'Normal': '#4CAF50',      // Green
    'Abnormal': '#F44336',    // Red
    'Inconclusive': '#FF9800' // Orange
};

// ============================================
// CHART 1: Test Results Distribution (Pie Chart)
// ============================================
function createTestResultsChart(data) {
    // Clear previous chart
    d3.select('#testResultsChart').html('');
    
    // Count test results
    let counts = d3.rollup(data, v => v.length, d => d['Test Results']);
    let chartData = Array.from(counts, ([key, value]) => ({ label: key, value: value }));
    
    // Dimensions
    const width = 450;
    const height = 350;
    const radius = Math.min(width, height) / 2 - 40;
    
    // Create SVG
    const svg = d3.select('#testResultsChart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width/2}, ${height/2})`);
    
    // Create pie
    const pie = d3.pie().value(d => d.value);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);
    const arcHover = d3.arc().innerRadius(0).outerRadius(radius + 10);
    
    // Create tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0,0,0,0.8)')
        .style('color', 'white')
        .style('padding', '8px 12px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('opacity', 0);
    
    // Draw pie slices
    svg.selectAll('path')
        .data(pie(chartData))
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', d => testResultColors[d.data.label])
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('d', arcHover);
            
            let percentage = ((d.data.value / data.length) * 100).toFixed(1);
            tooltip.transition().duration(200).style('opacity', 1);
            tooltip.html(`<strong>${d.data.label}</strong><br/>Count: ${d.data.value}<br/>Percentage: ${percentage}%`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('d', arc);
            
            tooltip.transition().duration(200).style('opacity', 0);
        });
    
    // Add labels
    svg.selectAll('text')
        .data(pie(chartData))
        .enter()
        .append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .attr('fill', 'white')
        .text(d => d.data.label);
}

// ============================================
// CHART 2: Medical Conditions vs Test Results (Grouped Bar Chart)
// ============================================
function createConditionsChart(data) {
    d3.select('#conditionsChart').html('');
    
    // Group data
    let grouped = d3.rollup(data,
        v => v.length,
        d => d['Medical Condition'],
        d => d['Test Results']
    );
    
    // Prepare data for chart
    let chartData = [];
    grouped.forEach((testResults, condition) => {
        let obj = { condition: condition };
        testResults.forEach((count, result) => {
            obj[result] = count;
        });
        chartData.push(obj);
    });
    
    // Sort by total count
    chartData.sort((a, b) => {
        let totalA = (a.Normal || 0) + (a.Abnormal || 0) + (a.Inconclusive || 0);
        let totalB = (b.Normal || 0) + (b.Abnormal || 0) + (b.Inconclusive || 0);
        return totalB - totalA;
    });
    
    // Take top 10 conditions
    chartData = chartData.slice(0, 10);
    
    // Dimensions
    const margin = { top: 20, right: 120, bottom: 80, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;
    
    const svg = d3.select('#conditionsChart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Scales
    const x0 = d3.scaleBand()
        .domain(chartData.map(d => d.condition))
        .rangeRound([0, width])
        .paddingInner(0.1);
    
    const x1 = d3.scaleBand()
        .domain(['Normal', 'Abnormal', 'Inconclusive'])
        .rangeRound([0, x0.bandwidth()])
        .padding(0.05);
    
    const y = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => Math.max(d.Normal || 0, d.Abnormal || 0, d.Inconclusive || 0))])
        .nice()
        .range([height, 0]);
    
    // X axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x0))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .attr('font-size', '10px');
    
    // Y axis
    svg.append('g')
        .call(d3.axisLeft(y));
    
    // Tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0,0,0,0.8)')
        .style('color', 'white')
        .style('padding', '8px 12px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('opacity', 0);
    
    // Draw bars
    const conditions = svg.selectAll('.condition')
        .data(chartData)
        .enter()
        .append('g')
        .attr('transform', d => `translate(${x0(d.condition)},0)`);
    
    ['Normal', 'Abnormal', 'Inconclusive'].forEach(result => {
        conditions.append('rect')
            .attr('x', x1(result))
            .attr('y', d => y(d[result] || 0))
            .attr('width', x1.bandwidth())
            .attr('height', d => height - y(d[result] || 0))
            .attr('fill', testResultColors[result])
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this).attr('opacity', 0.7);
                tooltip.transition().duration(200).style('opacity', 1);
                tooltip.html(`<strong>${d.condition}</strong><br/>${result}: ${d[result] || 0}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this).attr('opacity', 1);
                tooltip.transition().duration(200).style('opacity', 0);
            });
    });
    
    // Legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width + 10}, 0)`);
    
    ['Normal', 'Abnormal', 'Inconclusive'].forEach((result, i) => {
        legend.append('rect')
            .attr('x', 0)
            .attr('y', i * 25)
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', testResultColors[result]);
        
        legend.append('text')
            .attr('x', 20)
            .attr('y', i * 25 + 12)
            .text(result)
            .attr('font-size', '12px');
    });
}

// ============================================
// CHART 3: Billing Amount Distribution (Histogram)
// ============================================
function createBillingChart(data) {
    d3.select('#billingChart').html('');
    
    const margin = { top: 20, right: 30, bottom: 50, left: 70 };
    const width = 500 - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;
    
    const svg = d3.select('#billingChart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Prepare data
    const billingData = data.map(d => d['Billing Amount']);
    
    // Create histogram
    const histogram = d3.histogram()
        .value(d => d)
        .domain([0, d3.max(billingData)])
        .thresholds(20);
    
    const bins = histogram(billingData);
    
    // Scales
    const x = d3.scaleLinear()
        .domain([0, d3.max(billingData)])
        .range([0, width]);
    
    const y = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .nice()
        .range([height, 0]);
    
    // X axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d => '$' + d.toLocaleString()))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end');
    
    // Y axis
    svg.append('g')
        .call(d3.axisLeft(y));
    
    // Tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0,0,0,0.8)')
        .style('color', 'white')
        .style('padding', '8px 12px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('opacity', 0);
    
    // Draw bars
    svg.selectAll('rect')
        .data(bins)
        .enter()
        .append('rect')
        .attr('x', d => x(d.x0) + 1)
        .attr('y', d => y(d.length))
        .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 2))
        .attr('height', d => height - y(d.length))
        .attr('fill', '#667eea')
        .attr('stroke', 'white')
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('fill', '#5568d3');
            tooltip.transition().duration(200).style('opacity', 1);
            tooltip.html(`<strong>Range:</strong> $${d.x0.toFixed(0)} - $${d.x1.toFixed(0)}<br/><strong>Count:</strong> ${d.length}`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this).attr('fill', '#667eea');
            tooltip.transition().duration(200).style('opacity', 0);
        });
    
    // Labels
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 45)
        .attr('text-anchor', 'middle')
        .text('Billing Amount ($)')
        .attr('font-size', '12px');
    
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -50)
        .attr('text-anchor', 'middle')
        .text('Number of Patients')
        .attr('font-size', '12px');
}

// ============================================
// CHART 4: Patient Demographics (Age Pyramid)
// ============================================
function createDemographicsChart(data) {
    d3.select('#demographicsChart').html('');
    
    // Group by age group and gender
    const grouped = d3.rollup(data,
        v => v.length,
        d => d.AgeGroup,
        d => d.Gender
    );
    
    // Prepare data
    const ageGroups = ['0-18', '19-40', '41-65', '65+'];
    const chartData = ageGroups.map(ageGroup => {
        const genderData = grouped.get(ageGroup) || new Map();
        return {
            ageGroup: ageGroup,
            Male: -(genderData.get('Male') || 0),
            Female: genderData.get('Female') || 0
        };
    });
    
    const margin = { top: 20, right: 30, bottom: 50, left: 70 };
    const width = 500 - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;
    
    const svg = d3.select('#demographicsChart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Scales
    const x = d3.scaleLinear()
        .domain([d3.min(chartData, d => d.Male), d3.max(chartData, d => d.Female)])
        .range([0, width]);
    
    const y = d3.scaleBand()
        .domain(ageGroups)
        .range([0, height])
        .padding(0.2);
    
    // X axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d => Math.abs(d)));
    
    // Y axis
    svg.append('g')
        .attr('transform', `translate(${x(0)},0)`)
        .call(d3.axisLeft(y));
    
    // Tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0,0,0,0.8)')
        .style('color', 'white')
        .style('padding', '8px 12px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('opacity', 0);
    
    // Male bars (left side)
    svg.selectAll('.bar-male')
        .data(chartData)
        .enter()
        .append('rect')
        .attr('class', 'bar-male')
        .attr('x', d => x(d.Male))
        .attr('y', d => y(d.ageGroup))
        .attr('width', d => x(0) - x(d.Male))
        .attr('height', y.bandwidth())
        .attr('fill', '#4A90E2')
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.7);
            tooltip.transition().duration(200).style('opacity', 1);
            tooltip.html(`<strong>Age: ${d.ageGroup}</strong><br/>Male: ${Math.abs(d.Male)}`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 1);
            tooltip.transition().duration(200).style('opacity', 0);
        });
    
    // Female bars (right side)
    svg.selectAll('.bar-female')
        .data(chartData)
        .enter()
        .append('rect')
        .attr('class', 'bar-female')
        .attr('x', x(0))
        .attr('y', d => y(d.ageGroup))
        .attr('width', d => x(d.Female) - x(0))
        .attr('height', y.bandwidth())
        .attr('fill', '#E91E63')
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.7);
            tooltip.transition().duration(200).style('opacity', 1);
            tooltip.html(`<strong>Age: ${d.ageGroup}</strong><br/>Female: ${d.Female}`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 1);
            tooltip.transition().duration(200).style('opacity', 0);
        });
    
    // Labels
    svg.append('text')
        .attr('x', x(0) - 80)
        .attr('y', -5)
        .text('Male')
        .attr('font-weight', 'bold')
        .attr('fill', '#4A90E2');
    
    svg.append('text')
        .attr('x', x(0) + 10)
        .attr('y', -5)
        .text('Female')
        .attr('font-weight', 'bold')
        .attr('fill', '#E91E63');
}