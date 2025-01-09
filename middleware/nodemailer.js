const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: 'Gmail', // or another service provider
    auth: {
        user: process.env.sendermail,
        pass: process.env.passcode
    }
});

const EventEmitter = require('events')

// class FinanceEventEmitter extends EventEmitter {}
const notifyUser = new EventEmitter();


module.exports = {notifyUser,transporter};

