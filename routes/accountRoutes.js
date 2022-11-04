import express from 'express';
import { createRunningInvestment } from '../controllers/accountController.js';
const accountRoutes = express.Router();
// import { getTotalDeposits } from "../controllers/accountController"
// import cleanBody from '../middlewares/cleanbody.js';
// import Auth from '../configs/auth.js';

// create a running investment
accountRoutes.post("/createinvest", createRunningInvestment);


export default accountRoutes;