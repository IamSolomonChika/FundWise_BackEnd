import express from 'express';
import { Deposit, Investment, RunningInvestment, Profit, Withdrawal, Account, CashFlow } from '../models/accountModel.js';
import User from '../models/usersModel.js';
import UserKyc from '../models/userKycModel.js';
import { WithdrawalRequest } from '../models/adminModel.js';
import got from 'got';
import * as dotenv from 'dotenv';
dotenv.config();
import { customAlphabet as generate } from "nanoid";
import Flutterwave from 'flutterwave-node-v3';
import open from 'open';

const CHARACTER_SET =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const TAXREF_LENGTH = 8;

const taxRef = generate(CHARACTER_SET, TAXREF_LENGTH);

const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

// =====================================================================
// ??????????????? EVERYTHING ABOUT DEPOSIT ????????????????????????????
// =====================================================================

// Make deposit by a user
const makeDeposit = async (req, res) => {
    try {
        const { depositAmount } = req.body;

        const amount = (+ depositAmount);

        if (!amount) {
            return res.status(400).json({
                error: true,
                message: "Please provide all required fields",
            });
        }
        const deposit = new Deposit({
            user: req._Id,
            amount,
        });

        await deposit.save();

        // Save deposit to CashFlows collection
        const cashFlow = await CashFlow.findOne({ user: req._Id });
        if (!cashFlow) {
            const newCashFlow = new CashFlow({
                user: req._Id,
                deposits: deposit._id,
                accountBal: amount,
            });
            await newCashFlow.save();
        } else {
            // save deposit to cashflow
            cashFlow.deposits = deposit._id;
            cashFlow.accountBal += amount;
            await cashFlow.save();

            return res.status(200).json({
                error: false,
                message: "Deposit created successfully",
            });
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: true,
            message: "An error occurred",
        });
    }
}

// Get deposits by user
const getDeposits = async (req, res) => {
    try {
        const deposits = await Deposit.find({ user: req._Id });

        return res.status(200).json({
            error: false,
            message: "Deposits retrieved successfully",
            data: {
                deposits,
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: true,
            message: "An error occurred",
        });
    }
}

// Get total deposits of a user
const getTotalDeposits = async (req, res) => {
    try {
        const deposits = await Deposit.find({ user: req._Id });

        const totalDeposits = deposits.reduce((acc, deposit) => acc + deposit.amount, 0);
        return res.status(200).json({
            error: false,
            message: "Total deposits retrieved successfully",
            data: {
                totalDeposits,
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: true,
            message: "An error occurred",
        });
    }
    console.log('User request', req.user);
}


// =====================================================================
// ??????????????? EVERYTHING ABOUT WITHDRAWAL ?????????????????????????
// =====================================================================

// Make withdrawal request to admin for approval in WithdrawalRequests collection
const makeWithdrawalRequest = async (req, res) => {
    try {
        const { withdrawalAmount } = req.body;

        if (!withdrawalAmount) {
            return res.status(400).json({
                error: true,
                message: "Please provide all required fields",
            });
        }

        // Compare withdrawalAmount to accountBalance in CashFlows collection
        const cashFlow = await CashFlow.findOne({ user: req._Id });
        if (!cashFlow) {
            return res.status(400).json({
                error: true,
                message: "CashFlows not found",
            });
        }

        const amount = (+ withdrawalAmount);
        const accountBalance = cashFlow.accountBal;

        if (amount > accountBalance) {
            return res.status(400).json({
                error: true,
                message: "Insufficient funds",
            });
        }

        cashFlow.accountBal -= amount;

        await cashFlow.save();

        // Create new withdrawal data and set to pending
        const withdrawal = new Withdrawal({
            user: req._Id,
            amount,
            status: "pending",
        });

        await withdrawal.save();

        // Create a withdrawal request
        const withdrawalRequest = new WithdrawalRequest({
            user: req._Id,
            amount,
            status: "pending",
        });

        await withdrawalRequest.save();

        return res.status(200).json({
            error: false,
            message: "Withdrawal request created successfully",
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: true,
            message: "An error occurred",
        });
    }
}


// Get a user's withdrawals
const getWithdrawals = async (req, res) => {
    try {
        const withdrawals = await Withdrawal.find({ user: req._Id });

        return res.status(200).json({
            error: false,
            message: "Withdrawals retrieved successfully",
            data: {
                withdrawals,
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: true,
            message: "An error occurred",
        });
    }
}

// Get a user's total withdrawals
const getTotalWithdrawals = async (req, res) => {
    try {
        const withdrawals = await Withdrawal.find({ user: req._Id });

        let totalWithdrawals = withdrawals.reduce((acc, withdrawal) => acc + withdrawal.amount, 0);
        return res.status(200).json({
            error: false,
            message: "Total withdrawals retrieved successfully",
            data: {
                totalWithdrawals,
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: true,
            message: "An error occurred",
        });
    }
}

// =====================================================================
// ??????????????? EVERYTHING ABOUT INVESTMENT ?????????????????????????
// =====================================================================

// Create running investment
const createRunningInvestment = async (req, res) => {
    try {
        const { investmentAmount, timeDuration, investmentInterestRate } = req.body;

        if (!investmentAmount || !timeDuration || !investmentInterestRate) {
            return res.status(400).json({
                error: true,
                message: "Please provide all required fields",
            });
        }

        const amount = (+ investmentAmount);
        const duration = (+ timeDuration);
        const interestRate = (+ investmentInterestRate);

        const runningInvestment = new RunningInvestment({
            user: req._Id,
            amount,
            duration,
            interestRate,
            status: "running"
        });

        await runningInvestment.save();

        // Get the last added running investment maturityDate by id
        const lastAddedInvestment = await runningInvestment.findOne({ user: req._Id }).sort({ _id: -1 });

        // Remove running investment amount from CashFlows accountBalance
        const cashFlows = await CashFlow.findOne({ user: req._Id });
        if (!cashFlows) {
            return res.status(400).json({
                error: true,
                message: "CashFlows not found",
            });
        }

        cashFlows.accountBal -= amount;

        await cashFlows.save();

        // Add running investment amount to Investments collection 
        const maturityDate = new Date() + duration;
        console.log('Maturity date', maturityDate);
        const investment = new Investment({
            user: req._Id,
            amount,
            duration,
            interestRate,
            maturityDate,
        });

        // Get the last added investment by id

        await investment.save();
        await maturedInvestment(
            user: req._Id,
            lastAddedInvestment
            );

        return res.status(200).json({
            error: false,
            message: "Running investment created successfully",
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: true,
            message: "An error occurred",
        });
    }
}


// Get running investments
const getRunningInvestment = async (req, res) => {
    try {
        const runningInvestment = await RunningInvestment.find({ user: req._Id });

        return res.status(200).json({
            error: false,
            message: "Running investments retrieved successfully",
            data: {
                runningInvestment,
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: true,
            message: "An error occurred",
        });
    }
}

// Get total investment
const getTotalInvestment = async (req, res) => {
    try {
        const investment = await Investment.find({ user: req._Id });

        let totalInvestment = 0;

        investment.forEach((investment) => {
            totalInvestment += investment.amount;
        });

        return res.status(200).json({
            error: false,
            message: "Total investment retrieved successfully",
            data: {
                totalInvestment,
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: true,
            message: "An error occurred",
        });
    }
}

// =====================================================================
// ????????????????? OTHER LOGICS FOR CASHFLOW ?????????????????????????
// =====================================================================

// Check cashflow account balance
const checkAccountBalance = async (req, res) => {
    try {
        const cashFlows = await CashFlow.findOne({ user: req._Id });

        return cashFlows ? res.status(200).json({
            error: false,
            message: "Account balance retrieved successfully",
            data: {
                accountBalance: cashFlows.accountBal,
            },
        }) : res.status(400).json({
            error: true,
            message: "CashFlows not found",
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: true,
            message: "An error occurred",
        });
    }
}

// Calculate Account balance
const calculateAccountBalance = async (req, res) => {
    try {
        const account = await Accounts.findOne({ user: req._Id });
        if (!account) {
            return res.status(400).json({
                error: true,
                message: "Account not found",
            });
        }
        const deposits = await Deposit.find({ user: req._Id });
        const withdrawals = await Withdrawal.find({ user: req._Id });
        const runningInvestments = await RunningInvestment.find({ user: req._Id });
        const profits = await Profit.find({ user: req._Id });

        let totalDeposit = 0;
        let totalWithdrawal = 0;
        let totalRunningInvestment = 0;
        let totalProfit = 0;

        deposits.forEach((deposit) => {
            totalDeposit += deposit.amount;
        });

        withdrawals.forEach((withdrawal) => {
            totalWithdrawal += withdrawal.amount;
        });

        runningInvestments.forEach((investment) => {
            totalRunningInvestment += investment.amount;
        });

        profits.forEach((profit) => {
            totalProfit += profit.amount;
        });

        const accountBalance = totalDeposit - totalWithdrawal - totalRunningInvestment + totalProfit;

        // Update CashFlows accountBalance
        const cashFlow = await CashFlow.findOne({ user: req._Id });
        if (!cashFlow) {
            return res.status(400).json({
                error: true,
                message: "CashFlows not found",
            });
        }
        cashFlow.accountBal = accountBalance;

        await cashFlow.save();

        return res.status(200).json({
            error: false,
            message: "Account balance retrieved successfully",
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: true,
            message: "An error occurred",
        });
    }
};


// Fetch the lastAddedInvestment in createRunningInvestment function?
const maturedInvestment = async (user, lastAddedInvestment) => {
    // 





export { createRunningInvestment };


