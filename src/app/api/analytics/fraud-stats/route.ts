import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Review from '@/lib/models/Review';
import User from '@/lib/models/User';
import Product from '@/lib/models/Product';

export async function GET() {
    try {
        await dbConnect();

        // Core counts using flexible label matching
        const totalReviews = await Review.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();

        // Fake reviews: label can be 'Fake' or '1' (CSV style)
        const fakeCount = await Review.countDocuments({ predicted_label: { $in: ['Fake', '1', 'fake', 'CG'] } });
        const genuineCount = await Review.countDocuments({ predicted_label: { $in: ['Genuine', '0', 'genuine', 'OR'] } });
        const pendingCount = totalReviews - fakeCount - genuineCount;

        // Rating distribution aggregation (1–5 stars)
        const ratingAgg = await Review.aggregate([
            { $group: { _id: '$rating', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        const ratingDistribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        const ratingByLabel: { genuine: Record<string, number>; fake: Record<string, number> } = {
            genuine: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
            fake: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
        };
        ratingAgg.forEach((r: any) => {
            const key = String(r._id);
            if (ratingDistribution[key] !== undefined) ratingDistribution[key] = r.count;
        });

        // Rating split by Fake vs Genuine
        const ratingByLabelAgg = await Review.aggregate([
            {
                $addFields: {
                    normalized_label: {
                        $switch: {
                            branches: [
                                { case: { $in: ['$predicted_label', ['Fake', '1', 'fake', 'CG']] }, then: 'fake' },
                                { case: { $in: ['$predicted_label', ['Genuine', '0', 'genuine', 'OR']] }, then: 'genuine' }
                            ],
                            default: 'pending'
                        }
                    }
                }
            },
            {
                $group: {
                    _id: { rating: '$rating', label: '$normalized_label' },
                    count: { $sum: 1 }
                }
            }
        ]);
        ratingByLabelAgg.forEach((r: any) => {
            const key = String(r._id.rating);
            if (r._id.label === 'genuine' && ratingByLabel.genuine[key] !== undefined)
                ratingByLabel.genuine[key] = r.count;
            if (r._id.label === 'fake' && ratingByLabel.fake[key] !== undefined)
                ratingByLabel.fake[key] = r.count;
        });

        // Average review text length
        const avgLengthAgg = await Review.aggregate([
            { $project: { length: { $strLenCP: { $ifNull: ['$review_text', ''] } } } },
            { $group: { _id: null, avg: { $avg: '$length' } } }
        ]);
        const avgReviewLength = Math.round(avgLengthAgg[0]?.avg || 0);

        // Category fraud stats (top 6)
        const categoryStats = await Review.aggregate([
            {
                $lookup: {
                    from: 'products',
                    localField: 'product_id',
                    foreignField: 'product_id',
                    as: 'product'
                }
            },
            { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    category: { $ifNull: ['$product.category', 'Uncategorized'] },
                    is_fake: { $in: ['$predicted_label', ['Fake', '1', 'fake', 'CG']] }
                }
            },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: 1 },
                    fake: { $sum: { $cond: ['$is_fake', 1, 0] } }
                }
            },
            {
                $project: {
                    category: '$_id',
                    total: 1,
                    fake: 1,
                    fraud_rate: { $round: [{ $multiply: [{ $divide: ['$fake', '$total'] }, 100] }, 1] },
                    _id: 0
                }
            },
            { $sort: { total: -1 } },
            { $limit: 6 }
        ]);

        return NextResponse.json({
            totalReviews,
            fakeReviews: fakeCount,
            genuineReviews: genuineCount,
            pendingReviews: pendingCount,
            fraudPercentage: totalReviews > 0 ? +((fakeCount / totalReviews) * 100).toFixed(1) : 0,
            genuinePercentage: totalReviews > 0 ? +((genuineCount / totalReviews) * 100).toFixed(1) : 0,
            totalUsers,
            totalProducts,
            ratingDistribution,
            ratingByLabel,
            avgReviewLength,
            categoryStats
        }, { status: 200 });

    } catch (error: any) {
        console.error('fraud-stats error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
