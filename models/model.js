const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
    Username: { type: String, required: true },
    Email: { type: String, required: true, unique: true },
    Password: { type: String, required: true },
    resetPasswordToken: { type: String, required: false },
    resetPasswordExpires: { type: Date, required: false }
});



const currentDate = new Date();


const formatDate = (date) => {
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = currentDate.getFullYear();
    console.log(`${day}-${month}-${year}`)
    return String(`${day}-${month}-${year}`);
  };
// Expense Schema
const expenseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    amount: { type: Number, required: true },
    expenseType: { type: String, required: true },
    date: { type: String, default:function() {
        return formatDate(new Date()); // Default to current date in yyyy-mm-dd format
      } },
    description:{type: String},
    category: { type: String, required: true },
    year: { type: Number },
    month: { type: String },
  });
  
  // Pre-save hook to check and set year and month if not provided
  expenseSchema.pre('save', function (next) {
    const currentDate = new Date();
    
    // If year is not provided, set to current year
    if (!this.year) {
      this.year = currentDate.getFullYear();
    }
  
    // If month is not provided, set to current month
    if (!this.month) {
      this.month = currentDate.getMonth() + 1; // getMonth() returns 0-based index, so we add 1
    }

  
    next();
  });




const User = mongoose.model('User', userSchema);
const Expense = mongoose.model('Expense', expenseSchema);


module.exports = { User, Expense };
