import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
dotenv.config();

const Auth = (req, res, next) => {
  //Get token from header
  const token = req.header('x-auth-token');

  //verify if token does not exists
  if (!token) {
    return res.status(401).json({ msg: 'No Token, Authorization Denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    req.user = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Invalid Token' });
  }
};

export default Auth