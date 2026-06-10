import { createMocks } from 'node-mocks-http';
import { POST } from '../app/api/reviews/route';
import dbConnect from '../lib/dbConnect';
import Review from '../lib/models/Review';
import User from '../lib/models/User';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Load environment connection strings before testing Mongoose Graph enforce checks
dotenv.config({ path: '.env.local' });

// Ensure the tests run against an isolated clean mock or local DB structure
beforeAll(async () => {
    await dbConnect();
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Heterogeneous Graph Topology Enforcement (User -> Wrote -> Review -> BelongsTo -> Product)', () => {

    it('1. MUST REJECT: Review creation containing only Product ID (Missing User)', async () => {
        const { req } = createMocks({
            method: 'POST',
            body: {
                product_id: 'TEST_PROD_1',
                review_text: 'This is an orphaned review testing enforcement.',
                rating: 5
            },
        });

        // Simulating the Next.js API Request Structure
        const dynamicReq = new Request('http://localhost:3000/api/reviews', {
            method: 'POST',
            body: JSON.stringify(req._getJSONData())
        });

        const response = await POST(dynamicReq);
        const data = await response.json();

        // Expect exactly a 400 Bad Request
        expect(response.status).toBe(400);
        expect(data.error).toContain('user_id, product_id, review_text, and rating are required.');
    });

    it('2. MUST REJECT: Review creation containing only User ID (Missing Product)', async () => {
        const { req } = createMocks({
            method: 'POST',
            body: {
                user_id: 'TEST_USER_1',
                review_text: 'Review floating without a destination.',
                rating: 4
            },
        });

        const dynamicReq = new Request('http://localhost:3000/api/reviews', {
            method: 'POST',
            body: JSON.stringify(req._getJSONData())
        });

        const response = await POST(dynamicReq);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('user_id, product_id, review_text, and rating are required.');
    });

    it('3. MUST REJECT: Review creation with entirely fake/non-existent Parent nodes', async () => {
        const { req } = createMocks({
            method: 'POST',
            body: {
                user_id: 'GHOST_USER_9999',
                product_id: 'GHOST_PRODUCT_9999',
                review_text: 'These users and products dont exist in the DB.',
                rating: 1
            },
        });

        const dynamicReq = new Request('http://localhost:3000/api/reviews', {
            method: 'POST',
            body: JSON.stringify(req._getJSONData())
        });

        const response = await POST(dynamicReq);
        const data = await response.json();

        expect(response.status).toBe(400);
        // Ensure Database-Level validation catches the missing foreign keys securely
        expect(data.error).toContain('Invalid user_id. User does not exist.');
    });

    it('4. MUST ENFORCE SCHEMA: Mongoose Review block rejects creation without refs', async () => {
        const invalidReview = new Review({
            review_text: 'Direct Mongoose schema enforcement test',
            rating: 3,
        });

        let error;
        try {
            await invalidReview.validate();
        } catch (e: any) {
            error = e.errors;
        }

        // Ensuring that the schema throws validation errors on both nodes
        expect(error.user_id).toBeDefined();
        expect(error.product_id).toBeDefined();
        expect(error.user_id.kind).toBe('required');
        expect(error.product_id.kind).toBe('required');
    });
});
