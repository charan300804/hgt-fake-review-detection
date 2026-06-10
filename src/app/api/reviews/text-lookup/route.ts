import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Review from '@/lib/models/Review';

/**
 * GET /api/reviews/text-lookup?text=REVIEW_TEXT
 * Searches for a review matching the given text snippet.
 * Returns the user_id and product_id of the matched review.
 */
export async function GET(req: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const text = searchParams.get('text')?.trim();

        if (!text || text.length < 5) {
            return NextResponse.json({ error: 'Review text must be at least 5 characters.' }, { status: 400 });
        }

        // Use case-insensitive regex search for fuzzy text matching
        const regex = new RegExp(text.slice(0, 200).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

        const match = await Review.findOne({ review_text: { $regex: regex } }).lean() as any;

        if (!match) {
            return NextResponse.json({
                found: false,
                message: 'No review matching this text was found in the database.'
            }, { status: 200 });
        }

        return NextResponse.json({
            found: true,
            review_id: match.review_id,
            user_id: match.user_id,
            product_id: match.product_id,
            review_text: match.review_text,
            rating: match.rating,
            predicted_label: match.predicted_label,
            confidence_score: match.confidence_score,
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
