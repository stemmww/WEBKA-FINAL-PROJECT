const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'Нет токена, доступ запрещен' });
    }

    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), 'secretkey'); // Укажи свой JWT_SECRET
        console.log("✅ JWT Token Verified: ", decoded);  // Log when JWT is successfully verified
        req.user = decoded;
        next();
    } catch (error) {
        console.log("❌ Invalid JWT Token");  // Log when JWT verification fails
        res.status(401).json({ message: 'Неверный токен' });
    }
};
