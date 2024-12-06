const express = require('express')
const mongoose = require('mongoose')
const { User } = require('../models/model')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const router = express.Router()
const path = require('path')
const { body, validationResult } = require('express-validator');
require('dotenv').config()

mongoose.connect(process.env.Mongo_Uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log('MongoDB connected successfully');
    })
    .catch((error) => {
        console.error('MongoDB connection failed:', error.message);
    });


router.post('/signup', async (req, res) => {
    console.log("signup...........");
    const { username, password, email } = req.body;

    try {
        const user = new User({
            Username: username,
            Password: password,
            Email: email
        })
        console.log("user", user)
        const existinguser = await User.findOne({ Username: username });
        if (existinguser) {
            res.status(400).send("Username exists");
        } else {
            if (username.length < 3 || username.length > 25) {
                return res.status(400).send("Username must be between 3 and 15 characters long");
            }
            if (!/^[a-zA-Z0-9_ ]+$/.test(username)) {
                return res.status(400).send("Username can only contain letters, numbers, and underscores");
            }
            if (password.length < 8) {
                return res.status(400).send("Password must be at least 8 characters long");
            }
            if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password)) {
                return res.status(400).send("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character");
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            user.Password = hashedPassword;
            console.log("user", user)
            await user.save()
            const accesstoken = jwt.sign({ Username: user.Username, Password: user.Password, Email: user.Email, userId: user._id },
                JWT_secret = process.env.JWT_secret,
                { expiresIn: '30m' }
            );
            const refreshToken = jwt.sign(
                { Username: user.Username, Email: user.Email, userId: user._id },
                process.env.JWT_secret,
                { expiresIn: '1d' }
            );

            // Set refreshToken as an HTTP-only cookie
            res.cookie('refreshToken', refreshToken,
                //      {
                //     httpOnly: true,
                //     secure: true,         // Use in production over HTTPS
                //     sameSite: 'Strict',
                //     maxAge: 24 * 60 * 60 * 1000 // 24 hours
                //   }
            );
            return res.status(201).send({ message: "User registered successfully", accesstoken });
        }
    } catch (error) {
        return res.status(500).send("Error registering user: " + error.message);
    }
});


router.post('/signin', [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    const { username, password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const existinguser = await User.findOne({ Username: username });
        // const userId = req.user.userId;
        // console.log(userId)
        console.log(existinguser)
        if (!existinguser) {
            body('username').equals(existinguser.Username).withMessage('Incorrect Username')
            return res.status(400).send("Username does not exists.Please signup to continue.")
        } else {

            const match = await bcrypt.compare(password, existinguser.Password)
            if (!match) {
                return res.status(400).send("Incorrect password.")
            } else {
                const accesstoken = jwt.sign({
                    Username: username, Password: existinguser.Password, userId: existinguser.
                        _id
                },
                    JWT_secret = process.env.JWT_secret,
                    { expiresIn: '30m' }
                );
                const refreshtoken = jwt.sign({ Username: username, Password: existinguser.Password },
                    JWT_secret = process.env.JWT_secret,
                    { expiresIn: '1d' }
                );
                res.cookie('refreshToken', refreshtoken,
                    // {
                    //     httpOnly: true,       // Makes the cookie inaccessible to JavaScript in the client to prevent XSS attacks
                    //     secure: true,         // Ensures the cookie is sent over HTTPS only (useful in production)
                    //     sameSite: 'Strict',   // Helps prevent CSRF attacks
                    //     path: '/refresh',     // The path where the cookie is available, e.g., only on /refresh
                    //     maxAge: 24 * 60 * 60 * 1000 // Sets expiration (24 hours in this example)
                    // }
                );
                return res.status(201).send({ message: "Login successfully", accesstoken });
            }
        }
    } catch (error) {
        res.status(401).send({ message: "error" + error })
    }
})

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    console.log("token:::::", token)
    if (!token || !token.startsWith('Bearer ')) {
        return res.status(403).send("Access denied, no token provided");
    }

    const actualToken = token.split(' ')[1];  // Extract the token
    try {
        const decoded = jwt.verify(actualToken, process.env.JWT_secret);  // Verify the token
        req.user = decoded;  // Attach the decoded payload to the request
        console.log(req.user.Username)
        next();  // Proceed to the next middleware
    } catch (error) {
        res.status(401).send("Invalid token");
    }
};


module.exports = [router, verifyToken];