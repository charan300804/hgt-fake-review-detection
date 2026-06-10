const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const prisma = new PrismaClient();

async function main() {
    const csvPath = path.join(__dirname, '../mini-services/ml-service/data/reviews.csv');

    if (!fs.existsSync(csvPath)) {
        console.log('reviews.csv not found at', csvPath);
        return;
    }

    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
    });

    console.log(`Loaded ${records.length} records. Seeding DB...`);

    // Using a map to create unique users and products
    const users = new Map();
    const products = new Map();

    for (const record of records) {
        if (!users.has(record.user_id)) {
            users.set(record.user_id, {
                email: `${record.user_id}@example.com`,
            });
        }

        if (!products.has(record.product_id)) {
            products.set(record.product_id, {
                category: record.category || 'Unknown',
            });
        }
    }

    // Insert Users
    console.log(`Inserting ${users.size} users...`);
    for (const [userId, data] of users.entries()) {
        await prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: {
                id: userId,
                email: data.email,
                name: `User ${userId}`,
            },
        });
    }

    // Insert Products
    console.log(`Inserting ${products.size} products...`);
    for (const [productId, data] of products.entries()) {
        await prisma.product.upsert({
            where: { id: productId },
            update: {},
            create: {
                id: productId,
                category: data.category,
            },
        });
    }

    // Insert Reviews - Batch them for speed
    console.log(`Inserting ${records.length} reviews...`);
    // Since reviewId is purely the ID from the dataset, we will map it nicely
    for (const record of records) {
        await prisma.review.upsert({
            where: { reviewId: record.review_id },
            update: {},
            create: {
                reviewId: record.review_id,
                reviewText: record.review_text || "",
                rating: parseInt(record.rating, 10) || 0,
                helpfulVotes: parseInt(record.helpful_votes, 10) || 0,
                totalVotes: parseInt(record.total_votes, 10) || 0,
                label: record.label || null,
                isFake: parseInt(record.is_fake, 10) || 0,
                verified: parseInt(record.verified_purchase, 10) || 0,
                userId: record.user_id,
                productId: record.product_id,
                createdAt: record.timestamp ? new Date(record.timestamp) : new Date(),
            }
        });
    }

    console.log('Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
