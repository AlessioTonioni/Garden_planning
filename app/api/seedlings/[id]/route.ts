import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { seeds, seedlings } from '@/lib/db/schema';

const parseDate = (val: any): Date | undefined => {
    if (!val) return undefined;
    const date = new Date(val);
    return isNaN(date.getTime()) ? undefined : date;
};

const parseNullableDate = (val: any): Date | null | undefined => {
    if (val === null) return null;
    if (!val) return undefined;
    const date = new Date(val);
    return isNaN(date.getTime()) ? undefined : date;
};

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { quantity, seededAt, expectedSproutAt, sproutedAt, transplantedAt, location, status, notes } = body;

        const updated = db.transaction((tx) => {
            const [oldSeedling] = tx.select({
                quantity: seedlings.quantity,
                seedId: seedlings.seedId,
            }).from(seedlings).where(eq(seedlings.id, id)).all();

            if (!oldSeedling) throw new Error('Seedling not found');

            const updateData: Partial<typeof seedlings.$inferInsert> = { updatedAt: new Date() };
            if (quantity !== undefined)                     updateData.quantity = Number(quantity);
            if (parseDate(seededAt) !== undefined)          updateData.seededAt = parseDate(seededAt);
            const expSprout = parseNullableDate(expectedSproutAt);
            if (expSprout !== undefined)                    updateData.expectedSproutAt = expSprout;
            const sprouted = parseNullableDate(sproutedAt);
            if (sprouted !== undefined)                     updateData.sproutedAt = sprouted;
            const transplanted = parseNullableDate(transplantedAt);
            if (transplanted !== undefined)                 updateData.transplantedAt = transplanted;
            if (location !== undefined)                     updateData.location = location;
            if (status !== undefined)                       updateData.status = status;
            if (notes !== undefined)                        updateData.notes = notes;

            const [seedling] = tx.update(seedlings)
                .set(updateData)
                .where(eq(seedlings.id, id))
                .returning().all();

            // Adjust seed packet quantity if quantity changed
            if (quantity !== undefined && Number(quantity) !== oldSeedling.quantity) {
                const diff = Number(quantity) - oldSeedling.quantity;
                tx.update(seeds)
                    .set({
                        packetQuantity: sql`${seeds.packetQuantity} - ${diff}`,
                        updatedAt: new Date(),
                    })
                    .where(eq(seeds.id, oldSeedling.seedId))
                    .run();
            }

            const [relatedSeed] = tx.select().from(seeds).where(eq(seeds.id, seedling.seedId)).all();
            return { ...seedling, seed: relatedSeed };
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Failed to update seedling. Detailed error:', error);
        return NextResponse.json({
            error: 'Failed to update seedling',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        db.transaction((tx) => {
            const [seedling] = tx.select({
                quantity: seedlings.quantity,
                seedId: seedlings.seedId,
            }).from(seedlings).where(eq(seedlings.id, id)).all();

            if (seedling) {
                // Return seeds to packet before deleting
                tx.update(seeds)
                    .set({
                        packetQuantity: sql`${seeds.packetQuantity} + ${seedling.quantity}`,
                        updatedAt: new Date(),
                    })
                    .where(eq(seeds.id, seedling.seedId))
                    .run();

                tx.delete(seedlings).where(eq(seedlings.id, id)).run();
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete seedling:', error);
        return NextResponse.json({ error: 'Failed to delete seedling' }, { status: 500 });
    }
}
