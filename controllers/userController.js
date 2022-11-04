import Joi from 'joi';
import { config } from 'dotenv'
import { v4 as uuidv4 } from 'uuid';
import { customAlphabet as generate } from 'nanoid';
import bcrypt from 'bcrypt';
import { generateJwt } from '../configs/generateJwt.js';
import sendEmail from '../services/mailer.js';
import User from '../models/usersModel.js';

const CHARACTER_SET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const NUM_SET =
  "0123456789ABCDEF";

const REFERRAL_CODE_LENGTH = 6;
const ACCOUNT_ID_LENGTH = 8;

const accountId = generate(NUM_SET, ACCOUNT_ID_LENGTH);
const referralCode = generate(CHARACTER_SET, REFERRAL_CODE_LENGTH);

// Validate userSchema
const userSchema = Joi.object().keys({
  email: Joi.string().email({ minDomainSegments: 2 }),
  password: Joi.string().required().min(6),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
  referrer: Joi.string(),
});


const Signup = async (req, res) => {
  try {
    const result = userSchema.validate(req.body);
    if (result.error) {
      console.log(result.error.message);
      return res.json({
        error: true,
        status: 400,
        message: result.error.message,
      });
    }

    //Check if the email has been already registered.
    var user = await User.findOne({
      email: result.value.email,
    });

    if (user) {
      return res.json({
        error: true,
        message: "Email is already in use",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(result.value.password, salt);

    const id = uuidv4(); //Generate unique id for the user.
    result.value.userId = id;

    delete result.value.confirmPassword;
    result.value.password = hash;

    result.value.accountId = accountId();

    let code = Math.floor(100000 + Math.random() * 900000);

    let expiry = Date.now() + 60 * 1000 * 15; //15 mins in ms

    // const sendCode = await sendEmail(result.value.email, code);

    // if (sendCode.error) {
    //   return res.status(500).json({
    //     error: true,
    //     message: "Couldn't send verification email.",
    //   });
    // }
    result.value.emailToken = code;
    result.value.emailTokenExpires = new Date(expiry);

    //Check if referred and validate code.
    if (result.value.hasOwnProperty("referrer")) {
      let referrer = await User.findOne({
        referralCode: result.value.referrer,
      });
      if (!referrer) {
        return res.status(400).send({
          error: true,
          message: "Invalid referral code.",
        });
      }
    }
    result.value.referralCode = referralCode();
    const newUser = new User(result.value);
    await newUser.save();
    const token = generateJwt(newUser.userId);
    console.log("token", token);


    res.cookie("token", token, {httpOnly: true, secure: true, sameSite: "none", 
    maxAge: 1000 * 60 * 60 * 2});
    res.status(200).json({
      success: true,
      message: "Registration Success",
      accountId: newUser.accountId,
    });
  } catch (error) {
    console.error("signup-error", error);
    return res.status(500).json({
      error: true,
      message: "Cannot Register",
    });
  }
};



// Generate a new token and resend it to the user
const ResendToken = async (req, res) => {
  try {
    // Check if the email has been already registered.
    var user = await User.findOne({
      email: req.body.email,
    });

    if (!user) {
      return res.status(400).send({
        message: "Email not registered",
      });
    }

    let code = Math.floor(100000 + Math.random() * 900000);

    let expiry = Date.now() + 60 * 1000 * 15; //15 mins in ms

    // const sendCode = await sendEmail(result.value.email, code);

    // if (sendCode.error) {
    //   return res.status(500).json({
    //     error: true,
    //     message: "Couldn't send verification email.",
    //   });
    // }
    result.value.emailToken = code;
    result.value.emailTokenExpires = new Date(expiry);

    // update user token in database
    const updatedUser = await user.save();
    res.send(updatedUser);

    res.status(200).json({
      success: true,
      message: "Token resent",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the User.",
    });
  }
};

const Activate = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.json({
        error: true,
        status: 400,
        message: "Please make a valid request",
      });
    }
    const user = await User.findOne({
      email: email,
      emailToken: code,
      emailTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        error: true,
        message: "Invalid details",
      });
    } else {
      if (user.active)
        return res.send({
          error: true,
          message: "Account already activated",
          status: 400,
        });

      user.emailToken = "";
      user.emailTokenExpires = null;
      user.active = true;

      await user.save();

      return res.status(200).json({
        success: true,
        message: "Account activated.",
      });
    }
  } catch (error) {
    console.error("activation-error", error);
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: true,
        message: "Cannot authorize user.",
      });
    }

    //1. Find if any account with that email exists in DB
    const user = await User.findOne({ email: email });

    // NOT FOUND - Throw error
    if (!user) {
      return res.status(404).json({
        error: true,
        message: "Account not found",
      });
    }

    //2. Throw error if account is not activated
    if (!user.active) {
      return res.status(400).json({
        error: true,
        message: "You must verify your email to activate your account",
      });
    }

    //3. Verify the password is valid
    const isValid = await User.comparePasswords(password, user.password);

    if (!isValid) {
      return res.status(400).json({
        error: true,
        message: "Invalid credentials",
      });
    }

    //Generate Access token

    const { error, token } = await generateJwt(user.email, user.userId);
    if (error) {
      return res.status(500).json({
        error: true,
        message: "Couldn't create access token. Please try again later",
      });
    }
    user.accessToken = token;
    await user.save();

    //Success
    return res.send({
      success: true,
      message: "User logged in successfully",
      accessToken: token,
    });
  } catch (err) {
    console.error("Login error", err);
    return res.status(500).json({
      error: true,
      message: "Couldn't login. Please try again later.",
    });
  }
};

const ForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.send({
        status: 400,
        error: true,
        message: "Cannot be processed",
      });
    }
    const user = await User.findOne({
      email: email,
    });
    if (!user) {
      return res.send({
        success: true,
        message:
          "If that email address is in our database, we will send you an email to reset your password",
      });
    }

    let code = Math.floor(100000 + Math.random() * 900000);
    let response = await sendEmail(user.email, code);

    if (response.error) {
      return res.status(500).json({
        error: true,
        message: "Couldn't send mail. Please try again later.",
      });
    }

    let expiry = Date.now() + 60 * 1000 * 15;
    user.resetPasswordToken = code;
    user.resetPasswordExpires = expiry; // 15 minutes

    await user.save();

    return res.send({
      success: true,
      message:
        "If that email address is in our database, we will send you an email to reset your password",
    });
  } catch (error) {
    console.error("forgot-password-error", error);
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

const ResetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    if (!token || !newPassword || !confirmPassword) {
      return res.status(403).json({
        error: true,
        message:
          "Couldn't process request. Please provide all mandatory fields",
      });
    }
    const user = await User.findOne({
      resetPasswordToken: req.body.token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.send({
        error: true,
        message: "Password reset token is invalid or has expired.",
      });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: true,
        message: "Passwords didn't match",
      });
    }
    const hash = await User.hashPassword(req.body.newPassword);
    user.password = hash;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = "";

    await user.save();

    return res.send({
      success: true,
      message: "Password has been changed",
    });
  } catch (error) {
    console.error("reset-password-error", error);
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

// Update Password
const updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(403).json({
        error: true,
        message: "Please provide all mandatory fields",
      });
    }
    const user = await User.findOne({
      email: req.user.email,
    });
    if (!user) {
      return res.status(404).json({
        error: true,
        message: "User not found",
      });
    }
    const isValid = await User.comparePasswords(oldPassword, user.password);
    if (!isValid) {
      return res.status(400).json({
        error: true,
        message: "Invalid credentials",
      });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: true,
        message: "Passwords didn't match",
      });
    }
    const hash = await User.hashPassword(newPassword);
    user.password = hash;
    await user.save();

    return res.send({
      success: true,
      message: "Password has been changed",
    });
  } catch (error) {
    console.error("update-password-error", error);
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

const ReferredAccounts = async (req, res) => {
  try {
    const { id, referralCode } = req.decoded;

    const referredAccounts = await User.find(
      { referrer: referralCode },
      { email: 1, referralCode: 1, _id: 0 }
    );
    return res.send({
      success: true,
      accounts: referredAccounts,
      total: referredAccounts.length,
    });
  } catch (error) {
    console.error("fetch-referred-error.", error);
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

const Logout = async (req, res) => {
  try {
    const { id } = req.decoded;

    let user = await User.findOne({ userId: id });

    user.accessToken = "";

    await user.save();

    return res.send({ success: true, message: "User Logged out" });
  } catch (error) {
    console.error("user-logout-error", error);
    return res.stat(500).json({
      error: true,
      message: error.message,
    });
  }
};

export { Signup, Activate, Login, ForgotPassword, ResetPassword, ReferredAccounts, Logout, ResendToken }