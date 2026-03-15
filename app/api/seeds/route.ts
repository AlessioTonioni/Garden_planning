import { NextResponse } from 'next/server';
import { asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { seeds, seedlings } from '@/lib/db/schema';

export async function GET() {
    try {
        const allSeeds = await db.select().from(seeds).orderBy(asc(seeds.species));
        const allSeedlings = await db.select().from(seedlings);
        const result = allSeeds.map(s => ({
            ...s,
            seedlings: allSeedlings.filter(sl => sl.seedId === s.id)
        }));
        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to fetch seeds. Full error:', error);
        return NextResponse.json({ error: 'Failed to fetch seeds', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            species, packetQuantity, acquiredAt, expiryDate, notes,
            seedingStart, seedingEnd, harvestingStart, harvestingEnd
        } = body;

        if (!species) {
            return NextResponse.json({ error: 'Species is required' }, { status: 400 });
        }

        const [newSeed] = await db.insert(seeds).values({
            species,
            packetQuantity: Number(packetQuantity) || 0,
            acquiredAt: acquiredAt ? new Date(acquiredAt) : new Date(),
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            notes,
            seedingStart: seedingStart !== undefined ? Number(seedingStart) : null,
            seedingEnd: seedingEnd !== undefined ? Number(seedingEnd) : null,
            harvestingStart: harvestingStart !== undefined ? Number(harvestingStart) : null,
            harvestingEnd: harvestingEnd !== undefined ? Number(harvestingEnd) : null,
        }).returning();

        return NextResponse.json(newSeed);
    } catch (error) {
        console.error('Failed to create seed:', error);
        return NextResponse.json({ error: 'Failed to create seed' }, { status: 500 });
    }
}
