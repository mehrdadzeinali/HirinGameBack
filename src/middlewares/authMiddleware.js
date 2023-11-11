const jwt = require('jsonwebtoken');

const isAuth = (req, res, next) => {
    const token = req.header('Authorization').replace('Bearer ', '');
  
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied.' });
    }
  
    if (isBlacklisted(token)) {
      return res.status(401).json({ message: 'Token has been logged out. Please log in again.' });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded.user;
      next();
    } catch (err) {
      res.status(401).json({ message: 'Token is not valid.' });
    }
  };

module.exports = isAuth;
