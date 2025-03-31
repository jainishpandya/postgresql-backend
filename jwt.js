const jwt = require('jsonwebtoken');

const jwtAuthMiddleware = ( req, res, next ) => {

    const authorization = req.headers.authorization
    if (!authorization) {
        return res.status(401).json({ error: 'Token Not found'})
    }
    const token = req.headers.headers.authorization.split(' ')[1];
    if(!token) return res.status(401).json({error: 'Unauthorized'});

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded
        next();

    } catch (error) {
        console.error("JWT Error", err);
        res.status(401).json({error: "Invalid token"});
    }
}

// Fucntion to generate JWT token 
const generateToken = (userData) => {
    return jwt.sign(userData, process.env.JWT_SECRET, {expiresIn: 30})
}

module.exports = { jwtAuthMiddleware, generateToken}