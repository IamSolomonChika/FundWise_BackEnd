import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const mModel = mongoose.model;
import {User} from './usersModel.js';
import UserKyc from './userKycModel.js';
import { WithdrawalRequest } from './adminModel.js';


//* Schema for all deposits done on the platform.
const depositSchema = new Schema({
    amount: { type: Number, min: '5000' },
    currency: { type: Schema.Types.ObjectId, ref: 'UserKyc' },
    date: { type: Date, default: Date.now },
    status:  String,
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
});

const Deposit = mModel ('deposit', depositSchema);


const investmentSchema = new Schema({
    amount: { type: Number, min: '5000' },
    // currency: { type: Schema.Types.ObjectId, ref: 'UserKyc' },
    date: { type: Date, default: Date.now },
    maturityDate: { type: Schema.Types.ObjectId, ref: 'RunningInvestments' },
    status: { type: String, default: 'pending' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
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
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
});

const RunningInvestment = mModel('runningInvestment', runningInvestmentSchema);


// Create profit status for user
const profitSchema = new Schema({
    profit: { type: Number },
    investment: { type: Schema.Types.ObjectId, ref: 'Invest' },
    date: { type: Date, default: Date.now },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
});

const Profit = mModel('profit', profitSchema);



//* Schema for all withdrawals done on the platform.
const withdrawalSchema = new Schema({
    amount: { type: Number, min: '1000' },
    // currency: { type: Schema.Types.ObjectId, ref: 'UserKyc' },
    date: { type: Date, default: Date.now },
    status: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    WithdrawalRequest: { type: Schema.Types.ObjectId, ref: 'WithdrawalRequests' },
});

const Withdrawal = mModel('withdrawal', withdrawalSchema);


//* Schema for users account details.
const accountSchema = new Schema({
    accountNumber: { type: String, require: true },
    bankName: { type: String, require: true },
    accountName: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
});

const Account = mModel('account', accountSchema);


//*Cash Flow for User and Admin Dashboard
const cashFlowSchema = new Schema({
    accountBal: { type: Number, default: 0 },
    usdtBal: { type: Number },
    refBal: { type: Number, default: 0 },
    deposits: [depositSchema],
    investments: [investmentSchema],
    profits: [profitSchema],
    withdrawals: [withdrawalSchema],
    account: [accountSchema],
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
});

const CashFlow = mModel('cashFlow', cashFlowSchema);

export { Deposit, Investment, RunningInvestment, Profit, Withdrawal, Account, CashFlow };

