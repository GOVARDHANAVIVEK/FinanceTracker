const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    console.log("token:::::",token)
    if (!token || !token.startsWith('Bearer ')) {
        return res.status(403).send("Access denied, no token provided");
    }

    const actualToken = token.split(' ')[1];  // Extract the token
    try {
        const decoded = jwt.verify(actualToken, process.env.JWT_secret);  // Verify the token
        req.user = decoded; 
        req.user.userId = req.userId // Attach the decoded payload to the request
        console.log(req.user.Username)
        next();  // Proceed to the next middleware
    } catch (error) {
        res.status(401).send("Invalid token");
    }
};

module.exports = verifyToken