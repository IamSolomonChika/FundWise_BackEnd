import mongoose from 'mongoose';
const Schema = mongoose.Schema;
import User from './usersModel.js';


const userKycSchema = new Schema({
    firstName: { type: String },
    lastName: { type: String },
    profilePicture: {type: String},
    phoneNumber: { type: String, unique: true },
    address: { type: String },
    city: { type: String },
    zip: { type: Number },
    state: { type: String },
    Country: { type: String },
    baseCurrency: { type: String },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
    timestamps: {
        createdAt: {type: Date, default: new Date()},
        updatedAt: {type: Date, default: new Date()}
    },
});

const UserKyc = mongoose.model('userKyc', userKycSchema);

export default UserKyc;
