import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
dotenv.config();

const options = {
  expiresIn: 2 * 60 * 60,
};

const generateJwt = function (id) {
  try {
    const payload = {id};
    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, options);
    return { error: false, token: token };
  } catch (error) {
    return { error: true };
  }
}

export { generateJwt };