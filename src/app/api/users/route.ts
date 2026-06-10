import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();

        if (!body.email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const newUser = new User({
            name: body.name || null,
            email: body.email,
            user_id: body.user_id || undefined, // Mongoose handles default gracefully if undefined
        });

        const savedUser = await newUser.save();
        return NextResponse.json(savedUser, { status: 201 });
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ error: 'User email or User ID already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
