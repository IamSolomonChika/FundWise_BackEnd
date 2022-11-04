import express from 'express';
import { Account, Deposit, Withdrawal, CashFlow, RunningInvestment } from '../models/accountModel.js';
import { Admin, WithdrawalRequest, Payout } from '../models/adminModel.js';
import User from '../models/usersModel.js';
import UserKyc from '../models/userKycModel.js';
import { customAlphabet as generate } from 'nanoid';

import Flutterwave from 'flutterwave-node-v3';
import * as dotenv from 'dotenv';
dotenv.config();

import open from 'open';

const CHARACTER_SET =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const TRFREF_LENGTH = 6;

const trfRef = generate(CHARACTER_SET, TRFREF_LENGTH);

const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

// =====================================================================
// ??????????????? EVERYTHING ABOUT ADMIN ACCOUNT ??????????????????????
// =====================================================================
// Create admin account
const createAdmin = async (req, res) => {
    const { email, password, name, role } = req.body;
    try {
        const admin = await Admin.create({ email, password, name, role });
        res.status(201).json(admin);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
};


// Get all admin accounts
const getAdmins = async (req, res) => {
    try {
        const admins = await Admin.find();
        res.status(200).json(admins);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};


// =====================================================================
// ??????????????? EVERYTHING ABOUT DEPOSIT ????????????????????????????
// =====================================================================
// Get all deposits
const getDeposits = async (req, res) => {
    try {
        const deposits = await Deposit.find();
        res.status(200).json(deposits);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

// Get total deposits of all users
const getTotalDeposits = async (req, res) => {
    try {
        const deposits = await Deposit.find();
        const totalDeposits = deposits.reduce((acc, deposit) => acc + deposit.amount, 0);
        res.status(200).json({ totalDeposits });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Get user deposits by accountId from user collection
const getUserDeposits = async (req, res) => {
    const { accountId } = req.params;

    // map account id to user id
    const user = await User.findOne({ accountId });

    try {
        const deposits = await Deposit.find({ user: user._id });
        res.status(200).json(deposits);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Get user deposits by email from user collection
const getUserDepositsByEmail = async (req, res) => {
    const { email } = req.params;

    // map email to user id
    const user = await User.findOne({ email });

    try {
        const deposits = await Deposit.find({ user: user._id });
        res.status(200).json(deposits);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};


// =====================================================================
// ??????????????? EVERYTHING ABOUT WITHDRAWAL ?????????????????????????
// =====================================================================

// Get all withdrawals
const getWithdrawals = async (req, res) => {
    try {
        const withdrawals = await Withdrawal.find();
        res.status(200).json(withdrawals);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

// Get total withdrawals of all users
const getTotalWithdrawals = async (req, res) => {
    try {
        const withdrawals = await Withdrawal.find();
        const totalWithdrawals = withdrawals.reduce((acc, withdrawal) => acc + withdrawal.amount, 0);
        res.status(200).json({ totalWithdrawals });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Get user withdrawals by AccountId from user collection
const getUserWithdrawals = async (req, res) => {
    const { accountId } = req.params;

    // map account id to user id
    const user = await User.findOne({ accountId });

    try {
        const withdrawals = await Withdrawal.find({ user: user._id });
        res.status(200).json(withdrawals);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Get user withdrawals by Email from user collection
const getUserWithdrawalsByEmail = async (req, res) => {
    const { email } = req.params;

    // map email to user id
    const user = await User.findOne({ email });

    try {
        const withdrawals = await Withdrawal.find({ user: user._id });
        res.status(200).json(withdrawals);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};


// =====================================================================
// ??????????????? EVERYTHING ABOUT INVESTMENT ?????????????????????????
// =====================================================================

// Get total running investments of all users
const getTotalRunningInvestments = async (req, res) => {
    try {
        const investments = await RunningInvestment.find();
        const totalInvestments = investments.reduce((acc, investment) => acc + investment.amount, 0);
        res.status(200).json({ totalInvestments });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Get total running investments of all users by date range
const getTotalRunningInvestmentsByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        const investments = await RunningInvestment.find({ date: { $gte: startDate, $lte: endDate } });
        const totalInvestments = investments.reduce((acc, investment) => acc + investment.amount, 0);
        res.status(200).json({ totalInvestments });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};


// Get the balance of the difference between total deposits and total withdrawals of all users
const getBalance = async (req, res) => {
    try {
        const deposits = await Deposit.find();
        const withdrawals = await Withdrawal.find();
        const totalDeposits = deposits.reduce((acc, deposit) => acc + deposit.amount, 0);
        const totalWithdrawals = withdrawals.reduce((acc, withdrawal) => acc + withdrawal.amount, 0);
        const balance = totalDeposits - totalWithdrawals;
        res.status(200).json({ balance });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Get all withdrawal requests from users by status
const getWithdrawalRequestsByStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const withdrawalRequests = await WithdrawalRequest.find({ status });
        res.status(200).json({ withdrawalRequests });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Get all withdrawal requests from users by date range
const getWithdrawalRequestsByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        const withdrawalRequests = await WithdrawalRequest.find({ date: { $gte: startDate, $lte: endDate } });
        res.status(200).json({ withdrawalRequests });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};


// Get all withdrawal requests from users by user id
const getWithdrawalRequestsByUserId = async (req, res) => {
    try {
        const { userId } = req.body;
        const withdrawalRequests = await WithdrawalRequest.find({ userId });
        res.status(200).json({ withdrawalRequests });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// approve withdrawal request from user


// Get flutterwave account balance
const getFlutterwaveAccountBalance = async (req, res) => {
    try {
        const response = await flw.Account.getBalance();
        res.status(200).json({ response });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Transfer money from flutterwave account to user's bank account
const transferMoneyToUserBankAccount = async (req, res) => {
    try {
        const { amount, bankCode, accountNumber, narration } = req.body;
        const response = await flw.Transfers.initiate({
            account_bank: bankCode,
            account_number: accountNumber,
            amount,
            currency: "NGN",
            narration,
            reference: trfRef,
            callback_url: "https://webhook.site/5f5b2d2a-8f2c-4c5f-9c0e-5d5c5f5b2d2a",
            debit_currency: "NGN",
        });
        res.status(200).json({ response });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

// Get all users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json({ users });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Get all users by date range
const getAllUsersByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        const users = await User.find({ date: { $gte: startDate, $lte: endDate } });
        res.status(200).json({ users });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Get all users by active or inactive
const getAllUsersByActiveOrInactive = async (req, res) => {
    try {
        const { active } = req.body;
        const users = await User.find({ active });
        res.status(200).json({ users });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Get user by accountId
const getUserByAccountId = async (req, res) => {
    try {
        const { accountId } = req.body;
        const user = await User.findOne({ accountId });
        res.status(200).json({ user });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};



        