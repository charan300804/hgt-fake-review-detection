import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Review from '@/lib/models/Review';
import User from '@/lib/models/User';
import Product from '@/lib/models/Product';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();

        const { user_id, product_id, review_text, rating } = body;

        if (!user_id || !product_id || !review_text || !rating) {
            return NextResponse.json({ error: 'user_id, product_id, review_text, and rating are required.' }, { status: 400 });
        }

        // MANDATORY RELATIONSHIP ENFORCEMENT
        // Validate that the User exists
        const existingUser = await User.findOne({ user_id });
        if (!existingUser) {
            return NextResponse.json({ error: 'Invalid user_id. User does not exist.' }, { status: 400 });
        }

        // Validate that the Product exists
        const existingProduct = await Product.findOne({ product_id });
        if (!existingProduct) {
            return NextResponse.json({ error: 'Invalid product_id. Product does not exist.' }, { status: 400 });
        }

        let prediction = 'Pending';
        let confidence_score = 0;
        let low_confidence = false;

        // Call the Python ML Service for the HGT Inference
        try {
            const mlPayload = {
                review_id: `temp_${Date.now()}`,
                user_id: existingUser.user_id,       // string ID from User document
                product_id: existingProduct.product_id, // string ID from Product document
                review_text,
                rating,
                timestamp: new Date().toISOString(),
                helpful_votes: 0,
                total_votes: 0
            };

            console.log("Sending to ML Service:", mlPayload);

            const mlResponse = await fetch(`${ML_SERVICE_URL}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mlPayload)
            });

            if (mlResponse.ok) {
                const mlData = await mlResponse.json();
                console.log("ML Service Response:", mlData);
                // "fake" or "genuine"
                prediction = mlData.prediction.toLowerCase() === 'genuine' ? 'Genuine' : 'Fake';
                // confidence floats
                confidence_score = mlData.confidence || mlData.fraud_probability || 0;
                low_confidence = mlData.low_confidence || false;
            } else {
                console.error("ML Service failed to classify:", await mlResponse.text());
            }
        } catch (apiError) {
            console.error("Could not reach ML Service:", apiError);
        }

        // Save the new Review with all graph relationship refs enforced
        const newReview = new Review({
            review_id: `review_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            user_id: existingUser.user_id,       // String ref: User -[wrote]-> Review
            product_id: existingProduct.product_id, // String ref: Review -[belongs_to]-> Product
            review_text,
            rating,
            predicted_label: prediction,
            confidence_score,
            low_confidence
        });

        const savedReview = await newReview.save();
        return NextResponse.json(savedReview, { status: 201 });

    } catch (error: any) {
        console.error('POST /api/reviews error:', error.message, error.code);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const limitStr = searchParams.get('limit');
        const limit = parseInt(limitStr || '20');
        const mode = searchParams.get('mode') || 'random';

        let reviews;

        if (mode === 'recent') {
            // Return most recent reviews
            reviews = await Review.find().sort({ createdAt: -1 }).limit(limit);
        } else {
            // Default: random sample — guarantees a natural mix of Fake/Genuine labels
            reviews = await Review.aggregate([
                { $sample: { size: limit } }
            ]);
        }

        return NextResponse.json(reviews, { status: 200 });
    } catch (error: any) {
        console.error('GET /api/reviews error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
