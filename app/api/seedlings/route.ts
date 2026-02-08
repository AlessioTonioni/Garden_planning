import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const seedlings = await prisma.seedling.findMany({
            include: { seed: true },
            orderBy: { seededAt: 'desc' }
        });
        return NextResponse.json(seedlings);
    } catch (error) {
        console.error('Failed to fetch seedlings:', error);
        return NextResponse.json({ error: 'Failed to fetch seedlings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { seedId, quantity, seededAt, expectedSproutAt, location, status, notes } = body;

        if (!seedId) {
            return NextResponse.json({ error: 'Seed ID is required' }, { status: 400 });
        }

        const newSeedling = await prisma.seedling.create({
            data: {
                seedId,
                quantity: Number(quantity) || 1,
                seededAt: seededAt ? new Date(seededAt) : new Date(),
                expectedSproutAt: expectedSproutAt ? new Date(expectedSproutAt) : null,
                location,
                status: status || 'seeded',
                notes
            },
            include: { seed: true }
        });

        return NextResponse.json(newSeedling);
    } catch (error) {
        console.error('Failed to create seedling:', error);
        return NextResponse.json({ error: 'Failed to create seedling' }, { status: 500 });
    }
}
