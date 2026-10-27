import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1]; //Bearer dhghjhdkjfg

    if (!token) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Internal server error',
    });
  }
};

export const authorizeUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (user.userType !== 'admin') {
      return res.status(403).json({
        message: 'Forbidden',
      });
    }

    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Internal server error',
    });
  }
};
