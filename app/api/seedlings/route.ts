import { NextResponse } from 'next/server';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { seeds, seedlings } from '@/lib/db/schema';

export async function GET() {
    try {
        const allSeedlings = await db.select().from(seedlings).orderBy(desc(seedlings.seededAt));
        const allSeeds = await db.select().from(seeds);
        const result = allSeedlings.map(sl => ({
            ...sl,
            seed: allSeeds.find(s => s.id === sl.seedId) ?? null
        }));
        return NextResponse.json(result);
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

        const qty = Number(quantity) || 1;

        // Synchronous transaction: create seedling + decrement seed packet quantity
        const newSeedling = db.transaction((tx) => {
            const [seedling] = tx.insert(seedlings).values({
                seedId,
                quantity: qty,
                seededAt: seededAt ? new Date(seededAt) : new Date(),
                expectedSproutAt: expectedSproutAt ? new Date(expectedSproutAt) : null,
                location,
                status: status || 'seeded',
                notes,
            }).returning().all();

            tx.update(seeds)
                .set({
                    packetQuantity: sql`${seeds.packetQuantity} - ${qty}`,
                    updatedAt: new Date(),
                })
                .where(eq(seeds.id, seedId))
                .run();

            const [relatedSeed] = tx.select().from(seeds).where(eq(seeds.id, seedId)).all();
            return { ...seedling, seed: relatedSeed };
        });

        return NextResponse.json(newSeedling);
    } catch (error) {
        console.error('Failed to create seedling:', error);
        return NextResponse.json({ error: 'Failed to create seedling' }, { status: 500 });
    }
}
