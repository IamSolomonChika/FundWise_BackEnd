import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
const Schema = mongoose.Schema;
import UserKyc from './userKycModel.js';
import { CashFlow } from './accountModel.js'


const userSchema = new Schema(
    {
        email: { type: String, require: true, unique: true },
        accountId: { type: String, require: true, unique: true },
        active: { type: Boolean, default: false },
        password: { type: String, require: true },
        resetPasswordToken: { type: String, default: null },
        resetPasswordExpires: { type: Date, default: null },
        emailToken: { type: String, default: null },
        emailTokenExpires: { type: Date, default: null },
        accessToken: { type: String, default: null },
        referralCode: { type: String, unique: true },
        referrer: { type: String, default: null },
        userKyc: { type: Schema.Types.ObjectId, ref: 'UserKyc' },
        cashFlow: { type: Schema.Types.ObjectId, ref: 'CashFlow' }
    },
    {
        timestamps: {
            createdAt: "createdAt",
            updatedAt: "updatedAt",
        },
    }
);

const User = mongoose.model("user", userSchema);


export default User;