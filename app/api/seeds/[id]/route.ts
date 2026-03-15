import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { seeds } from '@/lib/db/schema';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const {
            species, packetQuantity, acquiredAt, expiryDate, notes,
            seedingStart, seedingEnd, harvestingStart, harvestingEnd
        } = body;

        const updateData: Partial<typeof seeds.$inferInsert> = { updatedAt: new Date() };
        if (species !== undefined)         updateData.species = species;
        if (packetQuantity !== undefined)  updateData.packetQuantity = Number(packetQuantity);
        if (acquiredAt)                    updateData.acquiredAt = new Date(acquiredAt);
        if (expiryDate !== undefined)      updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
        if (notes !== undefined)           updateData.notes = notes;
        if (seedingStart !== undefined)    updateData.seedingStart = seedingStart === null ? null : Number(seedingStart);
        if (seedingEnd !== undefined)      updateData.seedingEnd = seedingEnd === null ? null : Number(seedingEnd);
        if (harvestingStart !== undefined) updateData.harvestingStart = harvestingStart === null ? null : Number(harvestingStart);
        if (harvestingEnd !== undefined)   updateData.harvestingEnd = harvestingEnd === null ? null : Number(harvestingEnd);

        const [updated] = await db.update(seeds)
            .set(updateData)
            .where(eq(seeds.id, id))
            .returning();

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Failed to update seed:', error);
        return NextResponse.json({ error: 'Failed to update seed' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await db.delete(seeds).where(eq(seeds.id, id));
        // Cascade via FK removes all seedlings for this seed
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete seed:', error);
        return NextResponse.json({ error: 'Failed to delete seed' }, { status: 500 });
    }
}
