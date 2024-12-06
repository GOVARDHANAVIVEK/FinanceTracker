const express = require('express');
const path = require('path');
const session = require('express-session');
const dotenv = require('dotenv');
const verifyToken = require('./routes/Auth')
const AuthRouter = require('./routes/Auth')
const dashboardRoute = require('./routes/Dashboard')
const expressLayouts = require('express-ejs-layouts');
const nodemailer = require('nodemailer');
const {SendMail,User} = require('./models/model')
const crypto = require('crypto')
const bcrypt = require('bcrypt')
dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(session({
    secret: process.env.JWT_secret || 'yourSecretKey', // Make sure to replace with a strong key
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
}));
app.get('/verify-token', verifyToken, (req, res) => {
    res.status(200).json({ message: 'Token is valid' });
});
app.get('/', (req, res) => {
    res.render('auth', { title: 'Login & Signup', activeForm: 'signin' });
});

app.use("/auth", AuthRouter)

app.use("/dashboard", dashboardRoute)


// Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'Gmail', // or another service provider
    auth: {
        user: 'govardhanavivek32@gmail.com',
        pass: 'tesg mjnl mrvu pfqd'
    }
});


app.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
});
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    console.log(email)
    const user = await User.findOne({ Email:email });

    if (!user) {
        return res.send('No account with that email found.');
    }

    // Generate reset token
    const token = crypto.randomBytes(20).toString('hex');
    console.log(token)
    // Set token and expiration on user
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    console.log(user)
    await user.save();

    // Send email with reset link
    const resetUrl = `http://localhost:7000/reset-password/${token}`;
    const mailOptions = {
        to: user.Email,
        from: 'govardhanavivek32@gmail.com',
        subject: 'Password Reset',
        text: `Please click the following link to reset your password: ${resetUrl}`
    };

    transporter.sendMail(mailOptions, (err) => {
        if (err) return res.send({message:'Error sending email.'+err});
        res.send('A password reset link has been sent to your email.');
    });
});

app.get('/reset-password/:token', async (req, res) => {
    
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        return res.send('Password reset token is invalid or has expired.');
    }
    res.render('reset-password',{ token: req.params.token });
});

app.post('/reset-password/:token', async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        return res.send('Password reset token is invalid or has expired.');
    }

    // Validate passwords
    if (req.body.password !== req.body.confirmPassword) {
        return res.send('Passwords do not match.');
    }
    console.log(req.body.password,req.body.confirmPassword)
    // Hash new password and save
    user.Password = await bcrypt.hash(req.body.password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    console.log(user)
    await user.save();
    
   
    res.send(`
        <html>
            <body>
                <p>Your password has been changed successfully.Redirecting to HomePage</p>
                <script>
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 2000); // Redirects after 2 seconds
                </script>
            </body>
        </html>
    `);
    
    
    
});



// Listen on a port
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
