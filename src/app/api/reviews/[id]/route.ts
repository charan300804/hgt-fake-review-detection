import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Review from '@/lib/models/Review';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        await dbConnect();

        // Support retrieving by Mongo _id OR the string review_id
        const review = await Review.findOne({
            $or: [{ _id: params.id }, { review_id: params.id }]
        })
            .populate('user_id', 'name email user_id')
            .populate('product_id', 'product_name category product_id');

        if (!review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        return NextResponse.json(review, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
