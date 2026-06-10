import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true,
        unique: true,
        default: () => new mongoose.Types.ObjectId().toString(),
    },
    name: {
        type: String,
        required: false,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    account_creation_date: {
        type: Date,
        default: Date.now,
    }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', userSchema);
