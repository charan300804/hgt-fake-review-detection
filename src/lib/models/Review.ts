import mongoose from 'mongoose';

/**
 * STRICT HETEROGENEOUS GRAPH SCHEMA ENFORCEMENT
 *
 * Mandatory graph topology: User → wrote → Review → belongs_to → Product
 *
 * A Review CANNOT exist without both user_id and product_id.
 */
const reviewSchema = new mongoose.Schema({
    review_id: {
        type: String,
        required: true,
        unique: true,
        default: () => new mongoose.Types.ObjectId().toString(),
    },
    // GRAPH EDGE: User -[wrote]-> Review
    user_id: {
        type: String,
        required: [true, 'user_id is required (User -> wrote -> Review).'],
        ref: 'User',
        index: true,
    },
    // GRAPH EDGE: Review -[belongs_to]-> Product
    product_id: {
        type: String,
        required: [true, 'product_id is required (Review -> belongs_to -> Product).'],
        ref: 'Product',
        index: true,
    },
    review_text: {
        type: String,
        required: [true, 'review_text is required.'],
    },
    rating: {
        type: Number,
        required: [true, 'rating is required.'],
        min: 1,
        max: 5,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    predicted_label: {
        type: String,
        enum: ['Fake', 'Genuine', 'Pending'],
        default: 'Pending',
    },
    confidence_score: {
        type: Number,
        default: 0.0,
    },
    low_confidence: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

// Clear cached model to pick up schema changes during hot-reload
if (mongoose.models.Review) delete (mongoose.models as any).Review;

export default mongoose.model('Review', reviewSchema);
