import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const seeds = await prisma.seed.findMany({
            include: { seedlings: true },
            orderBy: { species: 'asc' }
        });
        return NextResponse.json(seeds);
    } catch (error) {
        console.error('Failed to fetch seeds. Full error:', error);
        return NextResponse.json({ error: 'Failed to fetch seeds', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { species, packetQuantity, acquiredAt, expiryDate, notes } = body;

        if (!species) {
            return NextResponse.json({ error: 'Species is required' }, { status: 400 });
        }

        const newSeed = await prisma.seed.create({
            data: {
                species,
                packetQuantity: Number(packetQuantity) || 0,
                acquiredAt: acquiredAt ? new Date(acquiredAt) : new Date(),
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                notes
            }
        });

        return NextResponse.json(newSeed);
    } catch (error) {
        console.error('Failed to create seed:', error);
        return NextResponse.json({ error: 'Failed to create seed' }, { status: 500 });
    }
}
