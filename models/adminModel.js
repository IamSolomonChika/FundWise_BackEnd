import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User  from "./usersModel.js";
import UserKyc from "./userKycModel.js";

const AdminSchema = new mongoose.Schema({
    email: {type: String, require: true, unique: true},
    password: {type: String, require: true},
    adminId: {type: String, require: true, unique: true},
    name: {type: String, require: true},
    role: {type: String, require: true},
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now}
});

AdminSchema.pre("save", async function (next) {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = bcrypt.hash(this.password, salt);
        this.password = hashedPassword;
        next();
    } catch (error) {
        next(error);
    }
});

AdminSchema.methods.isValidPassword = async function (newPassword) {
    try {
        return await bcrypt.compare(newPassword, this.password);
    } catch (error) {
        throw new Error(error);
    }
};

const Admin = mongoose.model("admin", AdminSchema);

// Withdrawal request schema
const WithdrawalRequestSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    amount: {type: Number, require: true},
    status: {type: String, default: 'pending'},
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now}
});

const WithdrawalRequest = mongoose.model("withdrawalRequest", WithdrawalRequestSchema);

// Payout schema
const PayoutSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    amount: {type: Number, require: true},
    date: {type: Date, default: Date.now},
    userKyc: {type: mongoose.Schema.Types.ObjectId, ref: "UserKyc"},
    status: {type: String, default: 'pending'},
});

const Payout = mongoose.model("payout", PayoutSchema);

export {Admin, WithdrawalRequest, Payout};