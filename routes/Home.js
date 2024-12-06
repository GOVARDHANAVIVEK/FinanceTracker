const express = require('express')
const verifyToken = require('../routes/Auth')
const router = express.Router()
const path = require('path')

router.post('/',verifyToken, (req, res) => {
    return res.status(200).json({ message: "success" });
});

module.exports = router