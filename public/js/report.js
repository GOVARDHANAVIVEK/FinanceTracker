const logoutBtn = document.getElementById('logout-btn').addEventListener('click',(e)=>{
    e.preventDefault()
    handleLogout()
});
function checkTokenExpiry() {
    const token = localStorage.getItem('Access token');
    console.log("hereeeeee")
    console.log("token check"+token)
    if (token) {
        const payload = JSON.parse(atob(token.split('.')[1])); // Decode JWT payload
        const expiry = payload.exp * 1000; // Convert to milliseconds
        console.log("payload "+payload)
        if (Date.now() > expiry) {
            alert("Session expired. Please log in again.");
            handleLogout(); // Clear token and redirect to login
        }
    }else{
        console.log("bjd")
    }
    }
function handleLogout() {
localStorage.removeItem('Access token');

window.location.href = '/'; // Redirect to login page
}
checkTokenExpiry()

// get year and month to fetch the records





const generate = document.getElementById('generate')
// Selecting Buttons and Filter Elements

const monthlyBtn = document.getElementById("monthlyBtn");
const yearlyBtn = document.getElementById("yearlyBtn");
const quarterlyBtn = document.getElementById("quarterlyBtn");

const monthFilter = document.getElementById("month-filter");
const yearFilter = document.getElementById("year-filter");
const quarterFilter = document.getElementById("quarter-filter");
yearFilter.style.display="none"
const IEReport = document.getElementById("IEReport");
const IEReporttitle = document.getElementById("IEReporttitle");
const CWReporttitle = document.getElementById("CWReporttitle");

const CWReport = document.getElementById('CWReport')
let reportType = "";
const summaryDiv = document.getElementById('report-container');

const BreakdownReport = document.getElementById('BreakdownReport');
const BreakdownReporttitle = document.getElementById('BreakdownReporttitle')
const report3 = document.querySelector('.report3');
// Event Listeners for Buttons
monthlyBtn.addEventListener("click", () => {
   monthlyBtn.style.background = "#f12f2f"
   quarterlyBtn.style.background = ""
   yearlyBtn.style.background = ""
   generate.style.display="flex"
   reportType = "Monthly"
    showMonthlyLayout();
});

yearlyBtn.addEventListener("click", () => {
  yearlyBtn.style.background = "#f12f2f"
  monthlyBtn.style.background = ""
  quarterlyBtn.style.background = ""
  generate.style.display="flex"
  reportType = "Yearly"
    showYearlyLayout();
});

quarterlyBtn.addEventListener("click", () => {
  quarterlyBtn.style.background = "#f12f2f"
  yearlyBtn.style.background = ""
  monthlyBtn.style.background = ""
  generate.style.display="flex"
  reportType = "Quarterly"
    showQuarterlyLayout();
});

// Function to Show Monthly Layout
function showMonthlyLayout() {
    // Show relevant filters
    yearFilter.style.display = "block";
    monthFilter.style.display = "block";
    quarterFilter.style.display = "none";


}

// Function to Show Yearly Layout
function showYearlyLayout() {
    // Show relevant filters
    yearFilter.style.display = "block";
    monthFilter.style.display = "none";
    quarterFilter.style.display = "none";

  
}

// Function to Show Quarterly Layout
function showQuarterlyLayout() {
    // Show relevant filters
    yearFilter.style.display = "block";
    monthFilter.style.display = "none";
    quarterFilter.style.display = "block";


}

// Populate Year and Month Dropdowns
function populateYearDropdown() {
    const yearDropdown = document.getElementById("year");
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= 2000; i--) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = i;
        yearDropdown.appendChild(option);
    }
}



// Initialize Dropdowns
// populateYearDropdown();


generate.style.display="none"
generate.addEventListener('click',(e)=>{
  console.log("reportType+"+reportType)
  if(reportType == "Monthly"){

    IEReporttitle.textContent = "Monthly Income & Expense Report";
    CWReporttitle.textContent = "Monthly Expense Breakdown by Category";
  }else if(reportType =="Yearly"){

    IEReporttitle.textContent = "Yearly Income & Expense Report";
    CWReporttitle.textContent = "Yearly Expense Breakdown by Category";
    BreakdownReporttitle.textContent = "Year - Month Breakdown Income & Expense Report"
  }else if(reportType =="Quarterly"){

    IEReporttitle.textContent = "Quarterly Income & Expense Report";
    CWReporttitle.textContent = "Quarterly Expense Breakdown by Category";
  }
  // e.preventDefault();
  
  getRecords(reportType)
  document.getElementById('report-container').style.display = 'flex';

  

})


async function getRecords(reportType){
  
  try {
    if(reportType == "Monthly"){
      report3.style.display="none"
      const YEAR = document.getElementById('year').value;
      const MONTH = document.getElementById('month').value;
      const token = localStorage.getItem('Access token');
      const response = await fetch('/dashboard/reports',{
        
        method:'POST',
        headers:{
          'authorization':  `Beare ${token}`,
          'Content-Type':'application/json'
        },
        body:JSON.stringify({YEAR,MONTH,reportType})
      });
      const data = await response.json();
      if(response.ok){
        
        console.log("data:-->"+JSON.stringify(data))
        if(data && data.categoryWiseReport.length>0){
          IEReport.innerHTML =''
          PrintIncomeExpenseReport(data?.expenseIncomeReport)
          
        }else{
          IEReport.innerHTML="No data found"
        }

        if(data.categoryWiseReport.length>0){
          CWReport.innerHTML=''
          PrintCategoryExpenseReport(data?.expenseIncomeReport,data?.categoryWiseReport)
        }else{
          CWReport.innerHTML = "No data found"
          
          updateSummary()

        }
        
      }else{
        console.log("error :"+data.message)
      }
    }else if (reportType =="Yearly"){
      report3.style.display=""
      const YEAR = document.getElementById('year').value;
      const token = localStorage.getItem('Access token');
      const response = await fetch('/dashboard/reports',{
        
        method:'POST',
        headers:{
          'authorization':  `Beare ${token}`,
          'Content-Type':'application/json'
        },
        body:JSON.stringify({YEAR,reportType})
      });
      const data = await response.json();
      if(response.ok){
        
        console.log("data:"+JSON.stringify(data))
        if(data && data.YearcategoryWiseReport.length>0){
          IEReport.innerHTML =''
          PrintYearlyIncomeExpenseReport(data?.YearexpenseIncomeReport)
          
        }else{
          IEReport.innerHTML="No data found"
        }

        if(data.YearcategoryWiseReport.length>0){
          CWReport.innerHTML=''
          PrintYearlyCategoryExpenseReport(data?.YearexpenseIncomeReport,data?.YearcategoryWiseReport)
        }else{
          CWReport.innerHTML = "No data found"
          
          updateSummary()

        }
        if(data.YearcategoryWiseReport.length>0){
          BreakdownReport.innerHTML=''
          PrintYearlyBreakdownIncomeExpenseReport(data?.Yearbreakdownreport)
        }else{
          BreakdownReport.innerHTML = "No data found"
          
          updateSummary()

        }
        
      }else{
        console.log("error :"+data.message)
      }
    }else if(reportType == "Quarterly"){
      report3.style.display="none"
      console.log("called- Quarterly")
      const YEAR = document.getElementById('year').value;
      const QUARTER = document.getElementById('quarter').value;
      const token = localStorage.getItem('Access token');
      const response = await fetch('/dashboard/reports',{
        
        method:'POST',
        headers:{
          'authorization':  `Beare ${token}`,
          'Content-Type':'application/json'
        },
        body:JSON.stringify({YEAR,QUARTER,reportType})
      });
      const data = await response.json();
      if(response.ok){
        
        console.log("data:"+JSON.stringify(data?.data))
        if(data && data.QuartercategoryWiseReport.length>0){
          IEReport.innerHTML =''
          PrintQuarterlyIncomeExpenseReport(data?.QuarterexpenseIncomeReport)
        }else{
          IEReport.innerHTML="No data found"
        }

        if(data && data.QuartercategoryWiseReport.length>0){
          CWReport.innerHTML=''
          PrintQuarterlyCategoryExpenseReport(data?.QuarterexpenseIncomeReport,data?.QuartercategoryWiseReport)
        }else{
          CWReport.innerHTML = "No data found"
          
          updateSummary()

        }

          
      }else{
        console.log("error :"+data.message)
      }
      
    }
  } catch (error) {
    console.log("Error :"+error)
    throw error
  }
  

}



const width = 500;
const height = 300;
const margin = { top: 30, right: 20, bottom: 50, left: 60 };



function updateSummary(data) {
  // Select all elements with the specified classes
  const totalIncomes = document.querySelectorAll('.total-income');
  const totalExpenses = document.querySelectorAll('.total-expense');
  const netSavingsList = document.querySelectorAll('.net-savings');

  if (data && data.TotalIncome && data.TotalExpense && data.NetSavings) {
      // Iterate over each NodeList and update the content
      totalIncomes.forEach((income) => {
          income.textContent = `₹${data.TotalIncome}`;
      });
      totalExpenses.forEach((expense) => {
          expense.textContent = `₹${data.TotalExpense}`;
      });
      netSavingsList.forEach((savings) => {
          savings.textContent = `₹${data.NetSavings}`;
      });
  } else {
      // Set to 0 if data is missing
      totalIncomes.forEach((income) => {
          income.textContent = '₹0';
      });
      totalExpenses.forEach((expense) => {
          expense.textContent = '₹0';
      });
      netSavingsList.forEach((savings) => {
          savings.textContent = '₹0';
      });
  }
}




function PrintIncomeExpenseReport(InputData) {

  IEReport.style.display="inline"
  console.log("got data=:", InputData);

  if (!InputData || !InputData.TotalExpense || !InputData.TotalIncome || !InputData.NetSavings) {
    console.log("Invalid or missing InputData");
    return [];
  }

  // Format the data into an array of objects
  const data = [
    { label: "Total Expense", value: Number(InputData["TotalExpense"]) },
    { label: "Total Income", value: Number(InputData["TotalIncome"]) },
    { label: "Net Savings", value: Number(InputData["NetSavings"]) }
  ];
  console.log(data);

  
  const width = 500; // Full container width
  const height = width * 0.6;
  const  margin = { top: 20, right: 20, bottom: 40, left: 110 };

  // Clear any existing SVG content before creating new one
  d3.select(IEReport).select("svg").remove();

  const svg = d3.select(IEReport)
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const xScale = d3.scaleBand()
    .domain(data.map(d => d.label))
    .range([0, width - margin.left - margin.right])
    .padding(0.1);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .nice()
    .range([height - margin.top - margin.bottom, 0]);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Create bars
  g.selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => xScale(d.label) + (xScale.bandwidth() * 0.25)) // Adjust x position to center the narrower bars
    .attr("y", d => yScale(d.value))
    .attr("width", xScale.bandwidth() * 0.3) // Reduce the width to 50% of the bandwidth
    .attr("height", d => height - margin.bottom - yScale(d.value))
    .attr("fill", "#69b3a2");

  // Add value labels directly on the bars
  g.selectAll(".bar-text")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "bar-text")
    .attr("x", d => xScale(d.label) + xScale.bandwidth() / 2) // Center horizontally on the bar
    .attr("y", d => yScale(d.value) + 30) // Position just above the bar
    .attr("text-anchor", "middle")
    .attr("fill", "black")
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    // .text(d => d.value);

  // Add axes
  g.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale))
    .selectAll("text")
    .attr("class", "axis-label");

  g.append("g")
    .call(d3.axisLeft(yScale).ticks(10))
    .selectAll("text")
    .attr("class", "axis-label");


    
  
  
    // Update the summary
    updateSummary(InputData);
}

function PrintCategoryExpenseReport(InputData, data) {
  console.log("Category Wise Report");
  console.log("IE Data: " + JSON.stringify(InputData));
  console.log("Category Data: " + JSON.stringify(data));

  if (!data || data.length === 0) {
      console.log("No data available for the pie chart.");
      resetSummary()
      return[];
  }
  else{
  // Set up the dimensions for the pie chart
  const width = 500;
  const height = 300;
  const radius = Math.min(width, height) / 2;

  // Clear any existing SVG content before creating new one
  d3.select(CWReport).select("svg").remove();

  // Create the SVG container for the pie chart
  const svg = d3.select(CWReport)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

  // Set up the color scale
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // Define the pie layout
  const pie = d3.pie()
      .value(d => d.totalAmount);


  // Define the arc
  const arc = d3.arc()
      .outerRadius(radius - 10)
      .innerRadius(0);

  // Define the label arc
  const labelArc = d3.arc()
      .outerRadius(radius - 40)
      .innerRadius(radius - 40);

  // Create a group for each slice of the pie
  const slices = svg.selectAll("path")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "slice");

  // Append the path (the slice itself) for each category
  slices.append("path")
      .attr("d", arc)
      .attr("fill", d => color(d.data.category));

  // Create a tooltip element
  const tooltip = d3.select("#tooltip");

  // Add category and percentage labels inside the slices
  slices.append("text")
      .attr("transform", d => `translate(${labelArc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .text(d => `${d.data.percentage}%`);

  // Add hover event listeners for interactivity
  slices.on("mouseover", function (event, d) {
      // Display the tooltip and set its content
      tooltip.style("visibility", "visible")
          .text(`${d.data.category}: ₹${d.data.totalAmount} (${d.data.percentage}%)`);

      // Change the slice color on hover
      d3.select(this).select("path")
          .transition().duration(200)
          .attr("opacity", 0.7);
  })
  .on("mousemove", function (event) {
      // Move the tooltip with the mouse
      tooltip.style("top", (event.pageY + 10) + "px")
          .style("left", (event.pageX + 10) + "px");
  })
  .on("mouseout", function () {
      // Hide the tooltip and reset the slice color
      tooltip.style("visibility", "hidden");
      d3.select(this).select("path")
          .transition().duration(200)
          .attr("opacity", 1);
  });

  // Function to update the totals dynamically
  

  // Update the summary
  updateSummary(InputData);
  
}

}
function resetSummary(){
  document.querySelector('.total-income').innerHTML=0;
  document.querySelector('.total-expense').innerHTML=0;
  document.querySelector('.net-savings').innerHTML=0;
}

function PrintYearlyIncomeExpenseReport(InputData) {

  IEReport.style.display="inline"
  console.log("got data=:", InputData);

  if (!InputData || !InputData.TotalExpense || !InputData.TotalIncome || !InputData.NetSavings) {
    console.log("Invalid or missing InputData");
    return [];
  }

  // Format the data into an array of objects
  const data = [
    { label: "Total Expense", value: Number(InputData["TotalExpense"]) },
    { label: "Total Income", value: Number(InputData["TotalIncome"]) },
    { label: "Net Savings", value: Number(InputData["NetSavings"]) }
  ];
  console.log(data);

  const width = 500; // Full container width
  const height = width * 0.6;
  const  margin = { top: 20, right: 20, bottom: 40, left: 110 };

  // Clear any existing SVG content before creating new one
  d3.select(IEReport).select("svg").remove();

  const svg = d3.select(IEReport)
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const xScale = d3.scaleBand()
    .domain(data.map(d => d.label))
    .range([0, width - margin.left - margin.right])
    .padding(0.1);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .nice()
    .range([height - margin.top - margin.bottom, 0]);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Create bars
  g.selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => xScale(d.label) + (xScale.bandwidth() * 0.25)) // Adjust x position to center the narrower bars
    .attr("y", d => yScale(d.value))
    .attr("width", xScale.bandwidth() * 0.3) // Reduce the width to 50% of the bandwidth
    .attr("height", d => height - margin.bottom - yScale(d.value))
    .attr("fill", "#69b3a2");

  // Add value labels directly on the bars
  g.selectAll(".bar-text")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "bar-text")
    .attr("x", d => xScale(d.label) + xScale.bandwidth() / 2) // Center horizontally on the bar
    .attr("y", d => yScale(d.value) + 30) // Position just above the bar
    .attr("text-anchor", "middle")
    .attr("fill", "black")
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    // .text(d => d.value);

  // Add axes
  g.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale))
    .selectAll("text")
    .attr("class", "axis-label");

  g.append("g")
    .call(d3.axisLeft(yScale).ticks(10))
    .selectAll("text")
    .attr("class", "axis-label");
}


async function PrintYearlyCategoryExpenseReport(InputData,data){
    console.log("Category Wise Report");
    console.log("IE Data: " + JSON.stringify(InputData));
    console.log("Category Data: " + JSON.stringify(data));

    if (!data || data.length === 0) {
        console.log("No data available for the pie chart.");
        resetSummary()
        return[];
    }
    else{
    // Set up the dimensions for the pie chart
    const width = 500;
    const height = 300;
    const radius = Math.min(width, height) / 2;

    // Clear any existing SVG content before creating new one
    d3.select(CWReport).select("svg").remove();

    // Create the SVG container for the pie chart
    const svg = d3.select(CWReport)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Set up the color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Define the pie layout
    const pie = d3.pie()
        .value(d => d.totalAmount);


    // Define the arc
    const arc = d3.arc()
        .outerRadius(radius - 10)
        .innerRadius(0);

    // Define the label arc
    const labelArc = d3.arc()
        .outerRadius(radius - 40)
        .innerRadius(radius - 40);

    // Create a group for each slice of the pie
    const slices = svg.selectAll("path")
        .data(pie(data))
        .enter()
        .append("g")
        .attr("class", "slice");

    // Append the path (the slice itself) for each category
    slices.append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.category));

    // Create a tooltip element
    const tooltip = d3.select("#tooltip");

    // Add category and percentage labels inside the slices
    slices.append("text")
        .attr("transform", d => `translate(${labelArc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .text(d => `${d.data.percentage}%`);

    // Add hover event listeners for interactivity
    slices.on("mouseover", function (event, d) {
        // Display the tooltip and set its content
        tooltip.style("visibility", "visible")
            .text(`${d.data.category}: ₹${d.data.totalAmount} (${d.data.percentage}%)`);

        // Change the slice color on hover
        d3.select(this).select("path")
            .transition().duration(200)
            .attr("opacity", 0.7);
    })
    .on("mousemove", function (event) {
        // Move the tooltip with the mouse
        tooltip.style("top", (event.pageY + 10) + "px")
            .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", function () {
        // Hide the tooltip and reset the slice color
        tooltip.style("visibility", "hidden");
        d3.select(this).select("path")
            .transition().duration(200)
            .attr("opacity", 1);
    });

    // Function to update the totals dynamically
    

    // Update the summary
    updateSummary(InputData);
}
}

async function PrintQuarterlyIncomeExpenseReport(InputData) {
  IEReport.style.display="inline"
  console.log("got data=:", InputData);

  if (!InputData || !InputData.TotalExpense || !InputData.TotalIncome || !InputData.NetSavings) {
    console.log("Invalid or missing InputData");
    return [];
  }

  // Format the data into an array of objects
  const data = [
    { label: "Total Expense", value: Number(InputData["TotalExpense"]) },
    { label: "Total Income", value: Number(InputData["TotalIncome"]) },
    { label: "Net Savings", value: Number(InputData["NetSavings"]) }
  ];
  console.log(data);

  const width = 500; // Full container width
  const height = width * 0.6;
  const  margin = { top: 20, right: 20, bottom: 40, left: 110 };

  // Clear any existing SVG content before creating new one
  d3.select(IEReport).select("svg").remove();

  const svg = d3.select(IEReport)
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const xScale = d3.scaleBand()
    .domain(data.map(d => d.label))
    .range([0, width - margin.left - margin.right])
    .padding(0.1);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .nice()
    .range([height - margin.top - margin.bottom, 0]);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Create bars
  g.selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => xScale(d.label) + (xScale.bandwidth() * 0.25)) // Adjust x position to center the narrower bars
    .attr("y", d => yScale(d.value))
    .attr("width", xScale.bandwidth() * 0.3) // Reduce the width to 50% of the bandwidth
    .attr("height", d => height - margin.bottom - yScale(d.value))
    .attr("fill", "#69b3a2");

  // Add value labels directly on the bars
  g.selectAll(".bar-text")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "bar-text")
    .attr("x", d => xScale(d.label) + xScale.bandwidth() / 2) // Center horizontally on the bar
    .attr("y", d => yScale(d.value) + 30) // Position just above the bar
    .attr("text-anchor", "middle")
    .attr("fill", "black")
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    // .text(d => d.value);

  // Add axes
  g.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale))
    .selectAll("text")
    .attr("class", "axis-label");

  g.append("g")
    .call(d3.axisLeft(yScale).ticks(10))
    .selectAll("text")
    .attr("class", "axis-label");


    
  
  
    // Update the summary
    updateSummary(InputData);
}

async function PrintQuarterlyCategoryExpenseReport(InputData,data) {
  console.log("Category Wise Report");
    console.log("IE Data: " + JSON.stringify(InputData));
    console.log("Category Data: " + JSON.stringify(data));

    if (!data || data.length === 0) {
        console.log("No data available for the pie chart.");
        resetSummary()
        return[];
    }
    else{
    // Set up the dimensions for the pie chart
    const width = 500;
    const height = 300;
    const radius = Math.min(width, height) / 2;

    // Clear any existing SVG content before creating new one
    d3.select(CWReport).select("svg").remove();

    // Create the SVG container for the pie chart
    const svg = d3.select(CWReport)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Set up the color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Define the pie layout
    const pie = d3.pie()
        .value(d => d.totalAmount);


    // Define the arc
    const arc = d3.arc()
        .outerRadius(radius - 10)
        .innerRadius(0);

    // Define the label arc
    const labelArc = d3.arc()
        .outerRadius(radius - 40)
        .innerRadius(radius - 40);

    // Create a group for each slice of the pie
    const slices = svg.selectAll("path")
        .data(pie(data))
        .enter()
        .append("g")
        .attr("class", "slice");

    // Append the path (the slice itself) for each category
    slices.append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.category));

    // Create a tooltip element
    const tooltip = d3.select("#tooltip");

    // Add category and percentage labels inside the slices
    slices.append("text")
        .attr("transform", d => `translate(${labelArc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .text(d => `${d.data.percentage}%`);

    // Add hover event listeners for interactivity
    slices.on("mouseover", function (event, d) {
        // Display the tooltip and set its content
        tooltip.style("visibility", "visible")
            .text(`${d.data.category}: ₹${d.data.totalAmount} (${d.data.percentage}%)`);

        // Change the slice color on hover
        d3.select(this).select("path")
            .transition().duration(200)
            .attr("opacity", 0.7);
    })
    .on("mousemove", function (event) {
        // Move the tooltip with the mouse
        tooltip.style("top", (event.pageY + 10) + "px")
            .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", function () {
        // Hide the tooltip and reset the slice color
        tooltip.style("visibility", "hidden");
        d3.select(this).select("path")
            .transition().duration(200)
            .attr("opacity", 1);
    });

    // Function to update the totals dynamically
    

    // Update the summary
    updateSummary(InputData);
}
}

async function PrintYearlyBreakdownIncomeExpenseReport(InputData) {
  BreakdownReport.style.display = "inline";
console.log("Received Data:", InputData);

if (!InputData) {
  console.log("Invalid or missing InputData");
  return [];
}

// Prepare the data for D3.js
const months = Object.keys(InputData);
const chartData = months.map(month => ({
  month,
  income: InputData[month].income,
  expense: InputData[month].expense,
  netSavings: InputData[month].netSavings,
}));

// SVG dimensions
const width = 400, height = 400;
const margin = { top: 20, right: 30, bottom: 50, left: 110 };

// Clear any existing SVG content
d3.select(BreakdownReport).select("svg").remove();

const svg = d3.select(BreakdownReport)
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// Define scales
const x0 = d3.scaleBand()
  .domain(months)
  .range([margin.left, width - margin.right])
  .padding(0.2);

const x1 = d3.scaleBand()
  .domain(["income", "expense", "netSavings"])
  .range([0, x0.bandwidth()])
  .padding(0.05);

const y = d3.scaleLinear()
  .domain([0, d3.max(chartData, d => Math.max(d.income, d.expense, d.netSavings))])
  .nice()
  .range([height - margin.bottom, margin.top]);

// Define color scale
const color = d3.scaleOrdinal()
  .domain(["income", "expense", "netSavings"])
  .range(["#69b3a2", "#ff6b6b", "#4c78a8"]);

// Create groups for the bars
const tooltip = d3.select(IEReport)
  .append("div")
  .style("position", "absolute")
  .style("background", "#f9f9f9")
  .style("border", "1px solid #ccc")
  .style("padding", "8px")
  .style("border-radius", "4px")
  .style("box-shadow", "0px 0px 10px rgba(0, 0, 0, 0.2)")
  .style("pointer-events", "none")
  .style("opacity", 0);

// Create groups for the bars
const g = svg.append("g");
const monthsLiterals = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
g.selectAll("g")
  .data(chartData)
  .enter()
  .append("g")
  .attr("transform", d => `translate(${x0(d.month)}, 0)`)
  .selectAll("rect")
  .data(d => ["income", "expense", "netSavings"].map(key => ({ key, value: d[key], month: d.month })))
  .enter()
  .append("rect")
  .attr("x", d => x1(d.key))
  .attr("y", d => y(d.value))
  .attr("width", x1.bandwidth())
  .attr("height", d => height - margin.bottom - y(d.value))
  .attr("fill", d => color(d.key))
  .on("mouseover", (event, d) => {
    tooltip.transition().duration(200).style("opacity", 1);
    tooltip.html(
      `<strong>${monthsLiterals[d.month]} - ${d.key}</strong><br>Amount: ₹${d.value}`
    )
      .style("left", `${event.pageX + 10}px`)
      .style("top", `${event.pageY - 28}px`);
  })
  .on("mousemove", (event) => {
    tooltip
      .style("left", `${event.pageX + 10}px`)
      .style("top", `${event.pageY - 28}px`);
  })
  .on("mouseout", () => {
    tooltip.transition().duration(200).style("opacity", 0);
  });

// Add X-axis
svg.append("g")
  .attr("transform", `translate(0, ${height - margin.bottom})`)
  .call(d3.axisBottom(x0).tickSize(0))
  .selectAll("text")
  .attr("transform", "rotate(-45)")
  .attr("dx", "-0.5em")
  .attr("dy", "0.5em")
  .style("text-anchor", "end");

// Add Y-axis
svg.append("g")
  .attr("transform", `translate(${margin.left}, 0)`)
  .call(d3.axisLeft(y));

// Add Legend
const legend = svg.append("g")
  .attr("transform", `translate(${width - margin.right - 120}, ${margin.top})`);

["income", "expense", "netSavings"].forEach((key, i) => {
  legend.append("rect")
    .attr("x", 0)
    .attr("y", i * 20)
    .attr("width", 12)
    .attr("height", 12)
    .attr("fill", color(key));

  legend.append("text")
    .attr("x", 20)
    .attr("y", i * 20 + 10)
    .attr("text-anchor", "start")
    .attr("alignment-baseline", "middle")
    .attr("font-size", "12px")
    .text(key);
});

}