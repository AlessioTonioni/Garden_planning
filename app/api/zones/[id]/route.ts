import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { zones } from '@/lib/db/schema';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }

        await db.delete(zones).where(eq(zones.id, id));
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete zone' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }

        const updateData: Partial<typeof zones.$inferInsert> = { updatedAt: new Date() };
        if (body.name !== undefined)             updateData.name = body.name;
        if (body.type !== undefined)             updateData.type = body.type;
        if (body.notes !== undefined)            updateData.notes = body.notes;
        if (body.geoJson !== undefined)          updateData.geoJson = body.geoJson;
        if (body.lastWateredAt !== undefined)    updateData.lastWateredAt = body.lastWateredAt ? new Date(body.lastWateredAt) : null;
        if (body.lastFertilizedAt !== undefined) updateData.lastFertilizedAt = body.lastFertilizedAt ? new Date(body.lastFertilizedAt) : null;

        const [updatedZone] = await db.update(zones)
            .set(updateData)
            .where(eq(zones.id, id))
            .returning();

        return NextResponse.json(updatedZone);
    } catch (error: any) {
        console.error('Update zone failed:', error);
        return NextResponse.json({
            error: 'Failed to update zone',
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
