const months_literals = {
    1: "Jan",
    2: "Feb",
    3: "Mar",
    4: "Apr",
    5: "May",
    6: "Jun",
    7: "Jul",
    8: "Aug",
    9: "Sep",
    10: "Oct",
    11: "Nov",
    12: "Dec"
}
const getMonth = (month) => {
    const monthNumber = parseInt(month, 10); // Convert to a number
    console.log("month=====" + months_literals[monthNumber]);
    return months_literals[monthNumber];
}
const { User ,Expense} = require('../models/model')

const getEmail =async(id)=>{
    console.log("getting id =" + id)
    const user = await User.findById(id)
    if(!user){
        return null
    }
    console.log(user.Email)
    return user.Email;
}

const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
};

async function getMonthlyIncomeExpenseReport(year, month, userId) {
    let TotalIncome = 0
    let TotalExpense = 0
    let NetSavings = 0;
    try {
        console.log(year, month)
        console.log("userid_________>"+userId)
        const transactions = await Expense.find({
            userId, // assuming `userId` is stored in each transaction document
            year,
            month: String(month)
        });
        if (!transactions || transactions.length === 0) {
            console.log("No transactions found.");
            return [];
        }
        console.log("User transactions for the selected period:", transactions);
        transactions.forEach(transaction => {
            console.log(transaction.expenseType)
            transaction.expenseType == "expense" ? (TotalExpense = TotalExpense + transaction.amount) : (TotalIncome = TotalIncome + transaction.amount);
            console.log(TotalExpense, TotalIncome)
        });
        NetSavings = TotalIncome - TotalExpense
        console.log("Expense = :" + TotalExpense, "Income= :" + TotalIncome, "NetSavings= :" + NetSavings)
        const results = {
            TotalExpense,
            TotalIncome,
            NetSavings
        }
        return results;
    } catch (error) {
        console.error("Error fetching transactions:", error);
        throw error; // propagate the error for proper error handling in the route
    }
}

async function getMonthlyCategoryWiseReport(year, month, userId) {
    try {
        console.log("Input:", year, month, userId);

        // Fetch all transactions for the given userId, year, and month
        const transactions = await Expense.find({
            userId: userId,
            year: String(year),     // Ensure year is a string
            month: month            // Ensure month is a string
        });

        // Check if transactions are found
        if (!transactions || transactions.length === 0) {
            console.log("No transactions found.");
            return [];
        }

        // Fetch total income for the user in the specified month and year
        const incomeTransactions = await Expense.find({
            userId: userId,
            year: String(year),
            month: month,
            expenseType: "income"  // Filtering income transactions
        });

        const totalIncome = incomeTransactions.reduce((acc, transaction) => acc + transaction.amount, 0);

        if (totalIncome === 0) {
            console.log("Total income is zero, cannot calculate percentages.");
            return [];
        }

        console.log("Total Income:", totalIncome);

        // Group expense transactions by category and sum the amounts
        const categoryWiseData = transactions.reduce((acc, transaction) => {
            const { category, amount, expenseType } = transaction;

            // Consider only expenses
            if (expenseType === "expense") {
                if (acc[category]) {
                    acc[category] += amount;
                } else {
                    acc[category] = amount;
                }
            }
            return acc;
        }, {});

        // Convert the result into an array of objects with category, totalAmount, and percentage
        const result = Object.keys(categoryWiseData).map((category) => {
            const totalAmount = categoryWiseData[category];
            const percentage = ((totalAmount / totalIncome) * 100).toFixed(2);  // Calculate percentage

            return {
                category: category,
                totalAmount: totalAmount,
                percentage: percentage
            };
        });

        console.log("Category-wise Aggregated Results with Percentage:", result);
        return result;
    } catch (error) {
        console.error("Error fetching transactions:", error);
        throw error; // propagate the error for proper error handling in the route
    }
}


async function getYearlyIncomeExpenseReport(year, userId) {
    let TotalIncome = 0
    let TotalExpense = 0
    let NetSavings = 0;
    try {
        console.log(year)
        const transactions = await Expense.find({
            userId, // assuming `userId` is stored in each transaction document
            year
        });

        console.log("User transactions for the selected period:", transactions);
        transactions.forEach(transaction => {
            console.log(transaction.expenseType)
            transaction.expenseType == "expense" ? (TotalExpense = TotalExpense + transaction.amount) : (TotalIncome = TotalIncome + transaction.amount);
            console.log(TotalExpense, TotalIncome)
        });
        NetSavings = TotalIncome - TotalExpense
        console.log("Expense = :" + TotalExpense, "Income= :" + TotalIncome, "NetSavings= :" + NetSavings)
        const results = {
            TotalExpense,
            TotalIncome,
            NetSavings
        }
        return results;
    } catch (error) {
        console.error("Error fetching transactions:", error);
        throw error; // propagate the error for proper error handling in the route
    }
}


async function getYearlyCategoryWiseReport(year, userId) {
    try {
        console.log("Input:", year, userId);

        // Fetch all transactions for the given userId, year, and month
        const transactions = await Expense.find({
            userId: userId,
            year: String(year)     // Ensure year is a string       // Ensure month is a string
        });

        // Check if transactions are found
        if (!transactions || transactions.length === 0) {
            console.log("No transactions found.");
            return [];
        }

        // Fetch total income for the user in the specified month and year
        const incomeTransactions = await Expense.find({
            userId: userId,
            year: String(year),
            expenseType: "income"  // Filtering income transactions
        });

        const totalIncome = incomeTransactions.reduce((acc, transaction) => acc + transaction.amount, 0);

        if (totalIncome === 0) {
            console.log("Total income is zero, cannot calculate percentages.");
            return [];
        }

        console.log("Total Income:", totalIncome);

        // Group expense transactions by category and sum the amounts
        const categoryWiseData = transactions.reduce((acc, transaction) => {
            const { category, amount, expenseType } = transaction;

            // Consider only expenses
            if (expenseType === "expense") {
                if (acc[category]) {
                    acc[category] += amount;
                } else {
                    acc[category] = amount;
                }
            }
            return acc;
        }, {});

        // Convert the result into an array of objects with category, totalAmount, and percentage
        const result = Object.keys(categoryWiseData).map((category) => {
            const totalAmount = categoryWiseData[category];
            const percentage = ((totalAmount / totalIncome) * 100).toFixed(2);  // Calculate percentage

            return {
                category: category,
                totalAmount: totalAmount,
                percentage: percentage
            };
        });

        console.log("Category-wise Aggregated Results with Percentage:", result);
        return result;
    } catch (error) {
        console.error("Error fetching transactions:", error);
        throw error; // propagate the error for proper error handling in the route
    }
}

async function getQuarterlyIncomeExpenseReport(year, quarter, userId) {
    let TotalIncome = 0
    let TotalExpense = 0
    let NetSavings = 0;
    try {
        const transactions = await Expense.find({
            userId: userId,
            year: year,
            month: { $in: quarter },
        });

        console.log(transactions)

        if (!transactions || transactions.length === 0) {
            console.log("No transactions found.");
            return [];
        }

        transactions.forEach(transaction => {
            console.log(transaction.expenseType)
            transaction.expenseType == "expense" ? (TotalExpense = TotalExpense + transaction.amount) : (TotalIncome = TotalIncome + transaction.amount);
            console.log(TotalExpense, TotalIncome)
        });
        NetSavings = TotalIncome - TotalExpense
        console.log("Expense = :" + TotalExpense, "Income= :" + TotalIncome, "NetSavings= :" + NetSavings)
        const results = {
            TotalExpense,
            TotalIncome,
            NetSavings
        }
        return results;
    } catch (error) {
        console.error("Error fetching transactions:", error);
        throw error; // propagate the error for proper error handling in the route
    }
}

async function getQuarterlyCategoryWiseReport(year, quarter, userId) {
    try {
        console.log("Input:", year, userId);

        // Fetch all transactions for the given userId, year, and month
        const transactions = await Expense.find({
            userId: userId,
            year: String(year),
            month: { $in: quarter },    // Ensure year is a string       // Ensure month is a string
        });

        // Check if transactions are found
        if (!transactions || transactions.length === 0) {
            console.log("No transactions found.");
            return [];
        }

        // Fetch total income for the user in the specified month and year
        const incomeTransactions = await Expense.find({
            userId: userId,
            year: String(year),
            month: { $in: quarter },
            expenseType: "income"  // Filtering income transactions
        });

        const totalIncome = incomeTransactions.reduce((acc, transaction) => acc + transaction.amount, 0);

        if (totalIncome === 0) {
            console.log("Total income is zero, cannot calculate percentages.");
            return [];
        }

        console.log("Total Income:", totalIncome);

        // Group expense transactions by category and sum the amounts
        const categoryWiseData = transactions.reduce((acc, transaction) => {
            const { category, amount, expenseType } = transaction;

            // Consider only expenses
            if (expenseType === "expense") {
                if (acc[category]) {
                    acc[category] += amount;
                } else {
                    acc[category] = amount;
                }
            }
            return acc;
        }, {});

        // Convert the result into an array of objects with category, totalAmount, and percentage
        const result = Object.keys(categoryWiseData).map((category) => {
            const totalAmount = categoryWiseData[category];
            const percentage = ((totalAmount / totalIncome) * 100).toFixed(2);  // Calculate percentage

            return {
                category: category,
                totalAmount: totalAmount,
                percentage: percentage
            };
        });

        console.log("Category-wise Aggregated Results with Percentage:", result);
        return result;
    } catch (error) {
        console.error("Error fetching transactions:", error);
        throw error; // propagate the error for proper error handling in the route
    }
}


async function getYearlyBreakdownIncomeExpenseReport(year, userId) {
    try {
        console.log({ year, userId })
        const transactions = await Expense.find({
            userId,
            year
        });

        console.log(transactions)
        const monthlyData = {};
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        months.forEach(month => {
            monthlyData[month] = { income: 0, expense: 0, netSavings: 0 };
        })
        console.log(monthlyData)
        transactions.forEach(transaction => {
            const { month, expenseType, amount } = transaction;
            if (month.includes(month)) {
                if (expenseType == "income") {
                    monthlyData[month].income += amount;
                } else if (expenseType === "expense") {
                    monthlyData[month].expense += amount;
                }
                monthlyData[month].netSavings = monthlyData[month].income - monthlyData[month].expense;
            }
        })
        const result = months.map(month => ({
            month,
            income: monthlyData[month].income,
            expense: monthlyData[month].expense,
            netSavings: monthlyData[month].netSavings
        }));

        return result;
    } catch (error) {
        console.log(error)
    }
}

module.exports = {getMonth,getEmail,formatDate,getMonthlyIncomeExpenseReport,getMonthlyCategoryWiseReport,getYearlyIncomeExpenseReport,getYearlyCategoryWiseReport,getQuarterlyIncomeExpenseReport,getQuarterlyCategoryWiseReport,getYearlyBreakdownIncomeExpenseReport}