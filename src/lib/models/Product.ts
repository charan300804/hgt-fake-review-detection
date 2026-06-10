import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    product_id: {
        type: String,
        required: true,
        unique: true,
        default: () => new mongoose.Types.ObjectId().toString(),
    },
    product_name: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: false,
    },
    created_at: {
        type: Date,
        default: Date.now,
    }
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', productSchema);
