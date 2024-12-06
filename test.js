const data = [
    { category: 'Income', amount: 5000 },
    { category: 'Rent', amount: 1500 },
    { category: 'Groceries', amount: 600 },
    { category: 'Utilities', amount: 200 },
    { category: 'Transportation', amount: 300 },
    { category: 'Other', amount: 400 },
  ];
  
  const netSavings = data[0].amount - data.slice(1).reduce((total, item) => total + item.amount, 0);
  
  const html = `
  <html>
    <head>
      <title>Monthly Financial Report</title>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>
    <body>
      <h1>Monthly Financial Report</h1>
      <canvas id="myChart" width="400" height="400"></canvas>
      <h2>Net Savings: $${netSavings.toFixed(2)}</h2>
      <script>
        const ctx = document.getElementById('myChart').getContext('2d');
        const myChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: data.map(item => item.category),
            datasets: [{
              label: 'Amount',
              data: data.map(item => item.amount),
              backgroundColor: '#8884d8'
            }]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      </script>
    </body>
  </html>
  `;
  
  console.log(html);