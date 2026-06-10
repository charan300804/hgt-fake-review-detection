import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Product from '@/lib/models/Product';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.product_name) {
            return NextResponse.json({ error: 'product_name is required' }, { status: 400 });
        }

        const newProduct = new Product({
            product_name: body.product_name,
            category: body.category || 'Uncategorized',
            product_id: body.product_id || undefined,
        });

        const savedProduct = await newProduct.save();
        return NextResponse.json(savedProduct, { status: 201 });
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ error: 'Product ID already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
