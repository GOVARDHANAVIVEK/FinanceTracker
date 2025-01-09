const express = require('express')
const router = express.Router()
const path = require('path')
const { User, Expense } = require('../models/model')
const jwt = require('jsonwebtoken');
const currentDate = new Date();
const mongoose = require('mongoose');
const internal = require('stream');
const {transporter,notifyUser} = require('../middleware/nodemailer')
const cron = require('node-cron')

const { use } = require('bcrypt/promises');
const verifyToken = require('../routes/Auth')
const {getMonth,getEmail,formatDate,getYearlyBreakdownIncomeExpenseReport,getQuarterlyCategoryWiseReport,getYearlyCategoryWiseReport,getQuarterlyIncomeExpenseReport,getYearlyIncomeExpenseReport,getMonthlyCategoryWiseReport,getMonthlyIncomeExpenseReport}=require('../middleware/helperFunctions')
let userId = ""
const fromemail = `"Finance Tracker" ${process.env.sendermail}`
router.get('/',async (req, res) => {
    console.log("req---->"+JSON.stringify(req.session))
    
    let finalMonthlySummary = [];
    try {
        if (!req.session || !req.session.userInfo) {
            console.log("Session not found or user is not logged in.");
            // Redirect to login page if session is invalid
            return res.redirect('/');
        }
        userId = req.session.userInfo.userId // Assume verifyToken middleware sets req.userId
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
    
    // Redirect to the dashboard
    if(!req.session){
        req.session={}
    }
    req.session.userInfo = req.user
    console.log("req-body"+JSON.stringify(req.session.userInfo))
    res.redirect('/dashboard')

});



router.post('/add-expense', verifyToken, async (req, res) => {
    let totalIncome = 0
    let totalExpense = 0
    let balance = 0
    try {
        const { Year, Month, Amount, Category, ExpenseType, Description } = req.body
        // const userId = req.session.user.userId;
        console.log("email=="+req.session.userInfo.email)

        console.log(userId)
        // console.log(userId)
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        req.session.userInfo.email = user.Email;
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
            
            notifyUser.emit('transactionCreated', newExpense, user.Email);
            
            
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

});

notifyUser.on('transactionCreated',(expense,email)=>{
    console.log('New transaction created:', expense);
    console.log('User email:', email);
    const mailOptions = {
        to: email,
        from: fromemail,
        subject: 'New Transaction Added',
        text: `Dear user,\n\n

                You have added a new transaction today:\n\n
                Amount : ${expense.amount}\n
                Description : ${expense.description}\n
                Category : ${expense.category}\n
                Date : ${expense.date}\n
                Transaction Type : ${expense.expenseType}`
    };

    transporter.sendMail(mailOptions, (err) => {
        if (err) return res.send({message:'Error sending email.'+err});
        console.log('transaction sent to mail successfully')
    });
});



router.get('/add-expense',async (req, res) => {
    try {
        if (!req.session || !req.session.userInfo) {
            console.log("Session not found or user is not logged in.");
            // Redirect to login page if session is invalid
            return res.redirect('/');
        }
        // const userId = req.session.userInfo.userId;
        const today = formatDate(new Date());
        console.log("today:"+today)
        const todayTransactions = await Expense.find({
            userId: userId,
            date: today
        });
        console.log("this user transaction today  ", todayTransactions)
        todayTransactions.reverse();
        console.log(todayTransactions)
        // console.log(todayTransactions)
        res.render('addExpense', { activePage: 'add-expense', todayTransactions })
    } catch (error) {
        res.status(500).send({ message: error })
    }

})
router.get('/manage-expenses',async (req, res) => {
    try {
        if (!req.session || !req.session.userInfo) {
            console.log("Session not found or user is not logged in.");
            // Redirect to login page if session is invalid
            return res.redirect('/');
        }
        // console.log(req.session.user)
        // const userId = req.session.user.userId;
        // console.log(userId)
        
        const currentMonthNumber = String(currentDate.getMonth() + 1).padStart(2, '0');
        console.log("Current Month Number:", currentMonthNumber);

        const current_month = getMonth(currentMonthNumber);
        console.log("Current Month Name:", current_month, "User ID:", userId);

        const currentMonthTransactions = await Expense.find({
            userId: userId,
            month: current_month,
        });
        console.log("Current Month Transactions:", currentMonthTransactions);

        res.render('manageExpense', {
            activePage: 'manage-expenses',
            current_month,
            currentMonthTransactions,
        });
    } catch (error) {
        console.error("Error in manage-expenses route:", error);
        res.status(500).send("Server Error");
    }

    // const userId = req.session.user.userId;
    // const current_month = getMonth(String(currentDate.getMonth() + 1).padStart(2, '0'))
    // console.log("current month =="+current_month, userId)
    // const currentMonthTransactions = await Expense.find({
    //     userId: userId,
    //     month: current_month
    // });
    // console.log("this user current month transaction   ", currentMonthTransactions)
    // res.render('manageExpense', { activePage: 'manage-expenses', current_month, currentMonthTransactions })
});
router.put('/manage-expenses', verifyToken,async (req, res) => {
    try {
        const { updated_id, updatedCategory, updatedDescription, updatedAmount } = req.body;
        console.log("id modified" + updated_id)
        const transaction = await Expense.findById(updated_id);
        console.log("transaction found = " + transaction)
        const originalTransaction = JSON.stringify({ ...transaction.toObject() });
        // console.log("original transaction found = " + originalTransaction)
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        // Update the fields
        transaction.category = updatedCategory;
        transaction.description = updatedDescription;
        transaction.amount = updatedAmount;

        // Save the updated transaction
        await transaction.save();
        getEmail(userId).then(email => {
            console.log("originalTransaction+++++++"+originalTransaction)
            console.log("Transaction+++++++"+transaction)
            notifyUser.emit('TransactionUpdated',JSON.parse(originalTransaction),transaction,email)
        }).catch(err => {
            console.error("Error fetching email:", err);
        });
        
        res.status(200).json({ message: "Transaction updated successfully", transaction });
    } catch (error) {
        // Handle any errors
        res.status(500).json({ message: "Error updating transaction", error: error.message });
    }
});

notifyUser.on('TransactionUpdated',(originalTransaction,transaction,email)=>{
    console.log("transaction="+transaction)
    console.log("email="+email)
    console.log("original+"+originalTransaction)
    const mailOptions = {
        to: email,
        from: fromemail,
        subject: 'Transaction Updated',
        text: `
            Dear user,\n\n

                You have made a update in your transaction:\n\n

                Original Transaction:\n
                Amount: ${originalTransaction["amount"]}\n
                Description : ${originalTransaction["description"]}\n
                Category : ${originalTransaction["category"]}\n
                Date : ${originalTransaction["date"]}\n
                Transaction Type : ${originalTransaction["expenseType"]}\n\n

                Updated Transaction:\n
                Amount : ${transaction.amount}\n
                Description : ${transaction.description}\n
                Category : ${transaction.category}\n
                Date : ${transaction.date}\n
                Transaction Type : ${transaction.expenseType}\n\n
                
                
            Thank You.`

    };

    transporter.sendMail(mailOptions, (err) => {
        if (err) return res.send({message:'Error sending email.'+err});
        console.log('transaction sent to mail successfully')
    });
})

router.delete('/manage-expenses',verifyToken, async (req, res) => {
    console.log("helllo dear")
    try {
        const { id } = req.body;
        console.log("id--------------->" + id)
        const transaction = await Expense.findByIdAndDelete(id);

        if (!transaction) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        getEmail(userId).then(email => {
            notifyUser.emit('TransactionDeleted',transaction,email)
        }).catch(err => {
            console.error("Error fetching email:", err);
        });
        
        res.status(200).json({ message: "Transaction Deleted Successfully", transaction });
    } catch (error) {
        res.status(500).json({ message: "Error deleting transaction", error: error.message });
    }
});

notifyUser.on('TransactionDeleted',(transaction,email)=>{
    const mailOptions = {
        to: email,
        from: fromemail,
        subject: 'Transaction Removed',
        text: `
            Dear user,\n\n

                You have deleted a transaction:\n\n

                Amount : ${transaction.amount}\n
                Description : ${transaction.description}\n
                Category : ${transaction.category}\n
                Date : ${transaction.date}\n
                Transaction Type : ${transaction.expenseType}\n\n
                
                
            Thank You.`

    };

    transporter.sendMail(mailOptions, (err) => {
        if (err) return res.send({message:'Error sending email.'+err});
        console.log('transaction sent to mail successfully')
    });
})

router.get('/reports', async (req, res) => {
    if (!req.session || !req.session.userInfo) {
        console.log("Session not found or user is not logged in.");
        // Redirect to login page if session is invalid
        return res.redirect('/');
    }
    res.render('reports', { activePage: 'reports' })
});


router.post('/reports', verifyToken,async (req, res) => {

    const reportType = req.body.reportType;
    console.log(reportType)
    // const userId = req.session.user.userId;
    console.log("reports====="+userId)
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



cron.schedule('21 22 * * *', async () => {
    

    console.log("cron job started.....");
    // const userId = getUserId(req); // Replace with actual logic to get the userId
    // console.log("id++"+userId)
    
    // Generate and send the report
    try {
        const userIds = await User.find({}, { _id: 1 }).lean();
        const userIdList = userIds.map(user => user._id.toString()).filter(id => id);

        console.log('User IDs:', userIdList);
        for (const userId of userIdList) {
            console.log("Processing user ID:", userId);
            await generateAndSendReport(userId);
        }

        console.log("Cron job completed.");
    } catch (error) {
        console.error("Error during cron job execution:", error);
    }
    // console.log("getting userid",userid);
    
});

const generateAndSendReport = async (userId) => {
    console.log("Running monthly report cron job...");

    const year = new Date().getFullYear();
    const month = getMonth(new Date().getMonth() + 1); // 0 is January, 11 is December
    console.log("month====="+month)

    try {
        
       
        if(userId && typeof userId === 'string' && userId.length === 24){
            console.log("came here.......",userId)
        const monthlyIncomeExpenseReportData = await getMonthlyIncomeExpenseReport(year, month, userId);
        const monthlyCategoryWiseReportData = await getMonthlyCategoryWiseReport(year, month, userId);

        if (monthlyIncomeExpenseReportData && monthlyCategoryWiseReportData &&
            (monthlyIncomeExpenseReportData.TotalExpense > 0 || monthlyCategoryWiseReportData.length > 0)) {

            const reportData = {
                incomeExpenseReport: monthlyIncomeExpenseReportData,
                categoryWiseReport: monthlyCategoryWiseReportData
            };
            getEmail(userId).then(async(email)=>{
                console.log("starting sending email",email)
                await sendEmailReport(reportData, email);
                console.log("cron job ended....");
            }).catch((err)=>{
                console.log("error"+err);
            });
        }else {
            console.log("No transactions for this user, skipping email.");
        }
    }
        // Get the user's email and send the report
       
    
        
    } catch (error) {
        console.error("Error during cron job execution:", error);
    }
};

const sendEmailReport = async(report,email)=>{

    console.log("came here mail........")
    let categoryReport = '';
    
    // Loop through each category and create the report
    report.categoryWiseReport.forEach((category) => {
        categoryReport += `
            Category: ${category.category}
            Total Amount: ₹${category.totalAmount}
            Percentage: ${category.percentage}%
            ---------------------------
            `;
    });
    const mailOptions = {
        to: email,
        from: fromemail,
        subject: 'Monthly Report',
        text: `
            Dear User,

            Your monthly Income vs Expense Report:
            
                Total Expense: ₹${report.incomeExpenseReport.TotalExpense}
                Total Income: ₹${report.incomeExpenseReport.TotalIncome}
                Net Savings: ₹${report.incomeExpenseReport.NetSavings}
            
            Your monthly Category vs Expense Report:
                 ${categoryReport}
            Thank You!`
    };

    try {
        console.log("came here mail transporter........")
        await transporter.sendMail(mailOptions);
        console.log('Transaction sent to mail successfully');
    } catch (err) {
        console.error('Error sending email:', err);
    }
}


module.exports = router;


