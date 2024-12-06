const express = require('express')
const router = express.Router()
const path = require('path')
const { User, Expense } = require('../models/model')
const jwt = require('jsonwebtoken');
const currentDate = new Date();
const mongoose = require('mongoose');
const internal = require('stream');
const { use } = require('bcrypt/promises');

const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Get token from Authorization header

    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_secret);
        console.log(decoded)
        req.userId = decoded.userId; // Assuming userId is part of the payload
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};
router.get('/', async (req, res) => {
    let finalMonthlySummary = [];
    try {
        const userId = req.session.user.userId // Assume verifyToken middleware sets req.userId
        console.log(userId)
        const user = await User.findById(userId);
        const username = user ? user.Username : "Guest";
        console.log(username)
        // Build the query object based on provided query parameters
        const query = { userId };
        const currentYear = new Date().getFullYear();
        // const username = req.session.user.Username;
        if (req.query.year) query.year = parseInt(req.query.year, 10);
        if (req.query.month) query.month = parseInt(req.query.month, 10);
        if (req.query.date) query.date = new Date(req.query.date);
        if (req.query.expenseType) query.expenseType = req.query.expenseType.toLowerCase();
        if (req.query.category) query.category = req.query.category.toLowerCase();
        if (req.query.description) query.description = req.query.description.toLowerCase();
        const transactions = await Expense.find(query);
        const groupedTransactions = transactions.reduce((result, transaction) => {
            const { year = currentYear, month } = transaction;
            if (!result[year]) result[year] = {};
            if (!result[year][month]) result[year][month] = [];
            result[year][month].push(transaction);
            return result;
        }, {});
        console.log("transaction", transactions)
        try {
            // Aggregating income and expenses month-wise
            let monthlySummary = await Expense.aggregate([
                {
                    $match: {
                        userId: new mongoose.Types.ObjectId(userId)  // Make sure to pass ObjectId correctly
                    }
                },
                {
                    $group: {
                        _id: {
                            year: "$year",
                            month: "$month",
                            expenseType: "$expenseType"
                        },
                        totalAmount: { $sum: "$amount" }  // Sum the amounts based on expenseType
                    }
                },
                {
                    $sort: {
                        "_id.year": 1,
                        "_id.month": 1,  // Sort by year and month
                    }
                }
            ]);

            // Separate aggregated data into income and expense
            let incomeByMonth = {};
            let expenseByMonth = {};

            monthlySummary.forEach(summary => {
                const { year, month, expenseType } = summary._id;
                const totalAmount = summary.totalAmount;

                // Store income data in incomeByMonth
                if (expenseType === 'income') {
                    if (!incomeByMonth[year]) incomeByMonth[year] = {};
                    incomeByMonth[year][month] = totalAmount;
                }
                // Store expense data in expenseByMonth
                else if (expenseType === 'expense') {
                    if (!expenseByMonth[year]) expenseByMonth[year] = {};
                    expenseByMonth[year][month] = totalAmount;
                }
            });

            // Combine the income and expense data into a final monthly summary


            Object.keys(incomeByMonth).forEach(year => {
                Object.keys(incomeByMonth[year]).forEach(month => {
                    const income = incomeByMonth[year][month] || 0;  // If no income, set to 0
                    const expense = expenseByMonth[year][month] || 0;  // If no expense, set to 0
                    const balance = income - expense;  // Calculate balance (expense will be negative)

                    // Add to final summary array
                    finalMonthlySummary.push({
                        _id: {
                            year: year,
                            month: month
                        },
                        income: income,
                        expense: expense,
                        balance: balance
                    });
                });
            });

            // Print the final monthly summary
            console.log("Final Monthly Summary:", finalMonthlySummary);

        } catch (error) {
            console.error("Error fetching income and expenses:", error);
        }
        // Find transactions based on the built query


        if (transactions.length == 0) {
            console.log("here")
            res.render('dashboard', { groupedTransactions, message: "No transactions found", username, activePage: 'dashboard', finalMonthlySummary });
        } else {

            res.render('dashboard', { groupedTransactions, username, activePage: 'dashboard', finalMonthlySummary });
        }

    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.render('auth')
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.post('/', verifyToken, (req, res) => {
    if (!req.session.user) {
        req.session.user = {}; // Initialize `req.session.user` if it doesn’t exist
    }
    req.session.user.userId = req.userId;

    // req.session.user.username = req.user.Username;
    // console.log(req)
    // Set the username from the `req.user` token data
    // req.session.user.username = req.user.Username;

    // Redirect to the dashboard
    res.redirect('/dashboard')

});

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
    console.log(months_literals[month])
    return months_literals[month]
}

router.post('/add-expense', verifyToken, async (req, res) => {
    let totalIncome = 0
    let totalExpense = 0
    let balance = 0
    try {
        const { Year, Month, Amount, Category, ExpenseType, Description } = req.body
        const userId = req.session.user.userId;
        console.log(req.session.user.userId)

        console.log(userId)
        // console.log(userId)
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const newExpense = new Expense({
            userId: userId,
            year: Year || currentDate.getFullYear(),
            month: Month || getMonth(currentDate.getMonth() + 1),
            expenseType: ExpenseType.toLowerCase(),
            amount: ExpenseType.toLowerCase() === "income" ? Math.abs(Amount) : Math.abs(Amount),
            category: Category.toLowerCase(),
            description: Description.toLowerCase() || ""
        });

        await newExpense.save();
        try {
            // Fetch all income transactions
            const incomes = await Expense.find({
                userId: userId,
                expenseType: "income"
            });

            // Fetch all expense transactions
            const expenses = await Expense.find({
                userId: userId,
                expenseType: "expense"
            });


            // If you want to calculate the total amounts:
            totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
            totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
            balance = totalIncome - totalExpense
            console.log("Total Income:", totalIncome);
            console.log("Total Expense:", totalExpense);
            console.log("balance:", balance);
        } catch (error) {
            console.error("Error fetching income and expenses:", error);
        }
        // res.redirect('/dashboard')
        res.status(201).json({ message: "Expense added successfully", expense: newExpense, totalIncome, totalExpense, balance });

    } catch (error) {
        console.error("Error adding expense:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }

})
const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
};

router.get('/add-expense', async (req, res) => {
    try {
        const userId = req.session.user.userId;
        const today = formatDate(new Date());
        console.log(today)
        const todayTransactions = await Expense.find({
            userId: userId,
            date: today
        });
        console.log("this user transaction today  ", todayTransactions)

        res.render('addExpense', { activePage: 'add-expense', todayTransactions })
    } catch (error) {
        res.status(500).send({ message: error })
    }

})
router.get('/manage-expenses', async (req, res) => {

    const userId = req.session.user.userId;
    const current_month = getMonth(String(currentDate.getMonth() + 1).padStart(2, '0'))
    console.log(current_month, userId)
    const currentMonthTransactions = await Expense.find({
        userId: userId,
        month: current_month
    });
    console.log("this user current month transaction   ", currentMonthTransactions)
    res.render('manageExpense', { activePage: 'manage-expense', current_month, currentMonthTransactions })
});
router.put('/manage-expenses', async (req, res) => {
    try {
        const { updated_id, updatedCategory, updatedDescription, updatedAmount } = req.body;
        console.log("id modified" + updated_id)
        const transaction = await Expense.findById(updated_id);
        console.log("transaction found = " + transaction)
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        // Update the fields
        transaction.category = updatedCategory;
        transaction.description = updatedDescription;
        transaction.amount = updatedAmount;

        // Save the updated transaction
        await transaction.save();
        res.status(200).json({ message: "Transaction updated successfully", transaction });
    } catch (error) {
        // Handle any errors
        res.status(500).json({ message: "Error updating transaction", error: error.message });
    }
});

router.delete('/manage-expenses', async (req, res) => {
    console.log("helllo dear")
    try {
        const { id } = req.body;
        console.log("id--------------->" + id)
        const transaction = await Expense.findByIdAndDelete(id);

        if (!transaction) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        res.status(200).json({ message: "Transaction Deleted Successfully", transaction });
    } catch (error) {
        res.status(500).json({ message: "Error deleting transaction", error: error.message });
    }
});
router.get('/reports', async (req, res) => {
    res.render('reports', { activePage: 'reports' })
});


router.post('/reports', async (req, res) => {

    const reportType = req.body.reportType;
    console.log(reportType)
    const userId = req.session.user.userId;
    console.log(userId)
    if (reportType == "Monthly") {
        try {
            const year = req.body.YEAR;
            const month = req.body.MONTH;
            const getMonthlyIncomeExpenseReportData = await getMonthlyIncomeExpenseReport(year, month, userId);
            console.log(getMonthlyIncomeExpenseReportData)
            const getMonthlyCategoryWiseReportData = await getMonthlyCategoryWiseReport(year, month, userId);
            console.log(getMonthlyCategoryWiseReportData)
            res.status(200).send({ expenseIncomeReport: getMonthlyIncomeExpenseReportData, categoryWiseReport: getMonthlyCategoryWiseReportData })
        } catch (error) {
            console.error("Error fetching report:", error);
            res.status(500).json({ success: false, message: "Failed to fetch report" });
        }
    }
    else if (reportType == "Yearly") {
        const year = req.body.YEAR;
        console.log(year)
        const getYearlyIncomeExpenseReportData = await getYearlyIncomeExpenseReport(year, userId);
        console.log(getYearlyIncomeExpenseReportData)
        const getYearlyCategoryWiseReportData = await getYearlyCategoryWiseReport(year, userId);
        console.log(getYearlyCategoryWiseReportData)
        const getYearlyBreakdownIncomeExpenseReportData = await getYearlyBreakdownIncomeExpenseReport(year, userId);
        console.log("breakdown:" + getYearlyBreakdownIncomeExpenseReportData)
        res.status(200).send({ YearexpenseIncomeReport: getYearlyIncomeExpenseReportData, YearcategoryWiseReport: getYearlyCategoryWiseReportData, Yearbreakdownreport: getYearlyBreakdownIncomeExpenseReportData })
    }
    else if (reportType == "Quarterly") {
        const year = req.body.YEAR;
        const quarter = req.body.QUARTER;
        console.log({ year, quarter, reportType })
        let quarters = {
            "Q1": ['Jan', 'Feb', 'Mar'],
            'Q2': ['Apr', 'May', 'Jun'],
            'Q3': ['Jul', 'Aug', 'Sep'],
            'Q4': ['Oct', 'Nov', 'Dec']
        };

        const getQuarterlyIncomeExpenseReportData = await getQuarterlyIncomeExpenseReport(year, quarters[quarter], userId);
        console.log(getQuarterlyIncomeExpenseReportData)
        const getQuarterlyCategoryWiseReportData = await getQuarterlyCategoryWiseReport(year, quarters[quarter], userId);
        console.log(getQuarterlyCategoryWiseReportData)
        res.status(200).send({ QuarterexpenseIncomeReport: getQuarterlyIncomeExpenseReportData, QuartercategoryWiseReport: getQuarterlyCategoryWiseReportData })

    }




});

async function getMonthlyIncomeExpenseReport(year, month, userId) {
    let TotalIncome = 0
    let TotalExpense = 0
    let NetSavings = 0;
    try {
        console.log(year, month)
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
module.exports = router;

