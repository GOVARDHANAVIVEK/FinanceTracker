const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: 'Gmail', // or another service provider
    auth: {
        user: 'govardhanavivek32@gmail.com',
        pass: 'tesg mjnl mrvu pfqd'
    }
});



module.exports = transporter;