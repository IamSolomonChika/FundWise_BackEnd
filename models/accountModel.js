import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const mModel = mongoose.model;
import User from './usersModel.js';
import UserKyc from './userKycModel.js';
import { WithdrawalRequest } from './adminModel.js';


//* Schema for all deposits done on the platform.
const depositSchema = new Schema({
    amount: { type: Number, min: '5000' },
    currency: { type: Schema.Types.ObjectId, ref: 'UserKyc' },
    date: { type: Date, default: Date.now },
    status: { type: String, default: 'pending' },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
});

const Deposit = mModel ('deposit', depositSchema);


const investmentSchema = new Schema({
    amount: { type: Number, min: '5000' },
    // currency: { type: Schema.Types.ObjectId, ref: 'UserKyc' },
    date: { type: Date, default: Date.now },
    maturityDate: { type: Schema.Types.ObjectId, ref: 'RunningInvestment' },
    status: { type: String, default: 'pending' },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
});

const Investment = mModel('investment', investmentSchema);

// Create running investment schema
const runningInvestmentSchema = new Schema({
    amount: { type: Number, min: '5000' },
    // currency: { type: Schema.Types.ObjectId, ref: 'UserKyc' },
    date: { type: Date, default: Date.now },
    duration: { type: Number, min: '30' },
    maturityDate: {type: Date},
    status: { type: String, default: 'running' },
    interestRate: { type: Number, min: '0.1' },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
});

const RunningInvestment = mModel('runningInvestment', runningInvestmentSchema);


// Create profit status for user
const profitSchema = new Schema({
    profit: { type: Number },
    investment: { type: Schema.Types.ObjectId, ref: 'Investment' },
    info: { type: String },
    date: { type: Date, default: Date.now },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
});

const Profit = mModel('profit', profitSchema);



//* Schema for all withdrawals done on the platform.
const withdrawalSchema = new Schema({
    amount: { type: Number, min: '1000' },
    // currency: { type: Schema.Types.ObjectId, ref: 'UserKyc' },
    date: { type: Date, default: Date.now },
    status: { type: String, default: 'pending' },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    WithdrawalRequest: { type: Schema.Types.ObjectId, ref: 'WithdrawalRequest' },
});

const Withdrawal = mModel('withdrawal', withdrawalSchema);


//* Schema for users account details.
const accountSchema = new Schema({
    accountNumber: { type: String, require: true },
    bankName: { type: String, require: true },
    accountName: { type: String },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
});

const Account = mModel('account', accountSchema);


//*Cash Flow for User and Admin Dashboard
const cashFlowSchema = new Schema({
    accountBal: { type: Number, default: 0 },
    usdBal: { type: Number, default: 0 },
    refBal: { type: Number, default: 0 },
    deposits: { type: Schema.Types.ObjectId, ref: 'Deposit' },
    investments: { type: Schema.Types.ObjectId, ref: 'Investment' },
    profits: { type: Schema.Types.ObjectId, ref: 'Profit' },
    withdrawals: { type: Schema.Types.ObjectId, ref: 'Withdrawal' },
    account: { type: Schema.Types.ObjectId, ref: 'Account' },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
});

const CashFlow = mModel('cashFlow', cashFlowSchema);

export { Deposit, Investment, RunningInvestment, Profit, Withdrawal, Account, CashFlow };

