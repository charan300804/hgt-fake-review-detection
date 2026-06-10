import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Review from '@/lib/models/Review';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        await dbConnect();

        // Check if the product actually exists by its internal MongoDB _id or string ID
        const product = await Product.findOne({
            $or: [{ _id: params.id }, { product_id: params.id }]
        }).catch(() => null);

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Find all reviews tied to this MongoDB _id
        const reviews = await Review.find({ product_id: product._id })
            .populate('user_id', 'name email user_id')
            .sort({ createdAt: -1 });

        return NextResponse.json(reviews, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
