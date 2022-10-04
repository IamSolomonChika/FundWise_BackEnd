import express from 'express';
import { Deposit, Investment, RunningInvestment, Profit, Withdrawal, Account, CashFlow } from '../models/accountModel.js';
import {User} from '../models/usersModel.js';
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

// Calculate Account balance
const totalAccountBalance = async (req, res) => {
    try {
        const account = await Accounts.findOne({ userId: req.user._id });
        if (!account) {
            return res.status(400).json({
                error: true,
                message: "Account not found",
            });
        }
        const deposits = await Deposit.find({ userId: req.user._id });
        const withdrawals = await Withdrawal.find({ userId: req.user._id });
        const runningInvestments = await RunningInvestment.find({ userId: req.user._id });
        const profits = await Profit.find({ userId: req.user._id });

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
        const cashFlow = await CashFlow.findOne({ userId: req.user._id });
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
            data: {
                accountBalance,
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: true,
            message: "An error occurred",
        });
    }
};

// Create running investment
const createRunningInvestment = async (req, res) => {
    try {
        const { amount, duration, interestRate } = req.body;

        if (!amount || !duration || !interestRate) {
            return res.status(400).json({
                error: true,
                message: "Please provide all required fields",
            });
        }

        const runningInvestment = new RunningInvestment({
            userId: req.user._id,
            amount,
            duration,
            interestRate,
        });

        await runningInvestment.save();

        

        // Remove running investment amount from CashFlows accountBalance
        const cashFlows = await CashFlow.findOne({ userId: req.user._id });
        if (!cashFlows) {
            return res.status(400).json({
                error: true,
                message: "CashFlows not found",
            });
        }

        cashFlows.accountBal -= amount;

        await cashFlows.save();

        // Add running investment amount to Investments collection 
        const maturityDate = new Date() + (duration * 24 * 60 * 60 * 1000);
        const investment = new Investment({
            userId: req.user._id,
            amount,
            duration,
            interestRate,
            maturityDate,
        });

        await investment.save();


        return res.status(200).json({
            error: false,
            message: "Running investment created successfully",
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

// Check running investment maturity date
const checkRunningInvestmentMaturityDate = async (req, res) => {
    try {
        const runningInvestment = await RunningInvestment.find({ userId: req.user._id });
        if (!runningInvestment) {
            return res.status(400).json({
                error: true,
                message: "Running investments not found",
            });
        }

        runningInvestment.forEach(async (investment) => {
            const maturityDate = new Date(investment.maturityDate);
            const currentDate = new Date();

            if (maturityDate <= currentDate) {
                // Update investment status to matured
                RunningInvestment.status = "completed";

                await RunningInvestment.save();

                // Find matching investment with runningInvestment
                const investment = await Investment.findOne({ userId: req.user._id, amount: investment.amount, maturityDate: investment.maturityDate });
                if (!investment) {
                    return res.status(400).json({
                        error: true,
                        message: "Investment not found",
                    });
                }

                // Update investment status to matured
                investment.status = "Matured";

                // Add 10% profit to Profits collection
                const profit = new Profit({
                    userId: req.user._id,
                    amount: investment.amount * 0.1,
                });

                await profit.save();

                // Update CashFlows accountBalance by adding 10% profit and running investment amount
                const cashFlows = await CashFlow.findOne({ userId: req.user._id });
                if (!cashFlows) {
                    return res.status(400).json({
                        error: true,
                        message: "CashFlows not found",
                    });
                }

                cashFlows.accountBal += investment.amount * 0.1 + investment.amount;

                await cashFlows.save();

                return res.status(200).json({
                    error: false,
                    message: "Investment matured successfully",
                    data: {
                        investment,
                    },
                });
            }
        });

        return res.status(200).json({
            error: false,
            message: "Investment maturity date checked successfully",
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
        const runningInvestment = await RunningInvestment.find({ userId: req.user._id });

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
        const investment = await Investment.find({ userId: req.user._id });

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

// Make deposit
const makeDeposit = async (req, res) => {
    try {
        const { depositAmount } = req.body;

        if (!depositAmount) {
            return res.status(400).json({
                error: true,
                message: "Please provide all required fields",
            });
        }

        const deposit = new Deposit({
            userId: req.user._id,
            depositAmount,
        });

        await deposit.save();

        return res.status(200).json({
            error: false,
            message: "Deposit created successfully",
            data: {
                deposit,
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

//  Map through deposits and return each deposit from oldest to newest
const getDeposits = async (req, res) => {
    try {
        const deposits = await Deposit.find({ userId: req.user._id });

        const sortedDeposits = deposits.sort((a, b) => {
            return new Date(a.createdAt) - new Date(b.createdAt);
        });

        return res.status(200).json({
            error: false,
            message: "Deposits retrieved successfully",
            data: {
                deposits: sortedDeposits,
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

//  Map through deposits and return each deposit from newest to oldest
const getDepositsNewestToOldest = async (req, res) => {
    try {
        const deposits = await Deposit.find({ userId: req.user._id });

        const sortedDeposits = deposits.sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        return res.status(200).json({
            error: false,
            message: "Deposits retrieved successfully",
            data: {
                deposits: sortedDeposits,
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
        const deposits = await Deposit.find({ userId: req.user._id });

        let totalDeposits = 0;

        deposits.forEach((deposit) => {
            totalDeposits += deposit.depositAmount;
        });

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
}


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
        const cashFlows = await CashFlow.findOne({ userId: req.user._id });
        if (!cashFlows) {
            return res.status(400).json({
                error: true,
                message: "CashFlows not found",
            });
        }

        if (withdrawalAmount > cashFlows.accountBal) {
            return res.status(400).json({
                error: true,
                message: "Insufficient funds",
            });
        }

        // Create new withdrawal data and set to pending
        const withdrawal = new Withdrawal({
            userId: req.user._id,
            withdrawalAmount,
            status: "pending",
        });

        await withdrawal.save();

        // Create a withdrawal request
        const withdrawalRequest = new WithdrawalRequest({
            userId: req.user._id,
            withdrawalAmount,
        });

        await withdrawalRequest.save();

        return res.status(200).json({
            error: false,
            message: "Withdrawal request created successfully",
            data: {
                withdrawalRequest,
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