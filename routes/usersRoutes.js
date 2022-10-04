import express from 'express';
const usersRoutes = express.Router();

import cleanBody from '../middlewares/cleanbody.js';
import validateToken from '../middlewares/validateToken.js';

import { Signup, Activate, Login, ForgotPassword, ResetPassword, ReferredAccounts, Logout } from '../controllers/userController.js';

usersRoutes.post("/signup", cleanBody, Signup);

usersRoutes.patch("/activate", cleanBody, Activate);

usersRoutes.post("/login", cleanBody, Login);

usersRoutes.patch("/forgot", cleanBody, ForgotPassword);

usersRoutes.patch("/reset", cleanBody, ResetPassword);

usersRoutes.get("/referred", validateToken, ReferredAccounts);

usersRoutes.get("/logout", validateToken, Logout);

export default usersRoutes;