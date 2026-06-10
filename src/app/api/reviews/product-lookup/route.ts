import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Review from '@/lib/models/Review';

/**
 * GET /api/reviews/product-lookup?user_id=X&product_id=Y
 * Returns all reviews for the given user_id + product_id combination from MongoDB
 */
export async function GET(req: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const user_id = searchParams.get('user_id')?.trim();
        const product_id = searchParams.get('product_id')?.trim();

        if (!user_id || !product_id) {
            return NextResponse.json({ error: 'Both user_id and product_id are required.' }, { status: 400 });
        }

        const reviews = await Review.find({ user_id, product_id })
            .sort({ createdAt: -1 })
            .limit(10);

        return NextResponse.json({
            user_id,
            product_id,
            count: reviews.length,
            reviews: reviews.map(r => ({
                review_id: r.review_id,
                review_text: r.review_text,
                rating: r.rating,
                predicted_label: r.predicted_label,
                confidence_score: r.confidence_score,
                timestamp: r.timestamp,
            }))
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
