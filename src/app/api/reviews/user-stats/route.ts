import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Review from '@/lib/models/Review';

/**
 * GET /api/reviews/user-stats?user_id=X
 * Returns fraud statistics for a given user_id:
 * - total reviews submitted
 * - how many are Fake vs Genuine
 */
export async function GET(req: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const user_id = searchParams.get('user_id')?.trim();

        if (!user_id) {
            return NextResponse.json({ error: 'user_id is required.' }, { status: 400 });
        }

        const allReviews = await Review.find({ user_id }).lean();

        const fakeReviews = allReviews.filter((r: any) => {
            const label = String(r.predicted_label || '').toLowerCase();
            return label === 'fake' || label === '1';
        });

        const genuineReviews = allReviews.filter((r: any) => {
            const label = String(r.predicted_label || '').toLowerCase();
            return label === 'genuine' || label === '0';
        });

        const pendingReviews = allReviews.filter((r: any) => {
            const label = String(r.predicted_label || '').toLowerCase();
            return !['fake', '1', 'genuine', '0'].includes(label);
        });

        return NextResponse.json({
            user_id,
            total_reviews: allReviews.length,
            fake_count: fakeReviews.length,
            genuine_count: genuineReviews.length,
            pending_count: pendingReviews.length,
            fraud_rate: allReviews.length > 0
                ? Math.round((fakeReviews.length / allReviews.length) * 100)
                : 0,
            recent_reviews: allReviews.slice(0, 5).map((r: any) => ({
                review_id: r.review_id,
                review_text: String(r.review_text || '').slice(0, 120),
                rating: r.rating,
                predicted_label: r.predicted_label,
                product_id: r.product_id,
            }))
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
