import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { placements } from '@/lib/db/schema';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { lat, lng, metadata } = body;

        const updateData: Partial<typeof placements.$inferInsert> = { updatedAt: new Date() };
        if (lat !== undefined)      updateData.lat = lat;
        if (lng !== undefined)      updateData.lng = lng;
        if (metadata !== undefined) updateData.metadata = JSON.stringify(metadata);

        const [placement] = await db.update(placements)
            .set(updateData)
            .where(eq(placements.id, id))
            .returning();

        return NextResponse.json(placement);
    } catch (error: any) {
        console.error('Update placement failed:', error);
        return NextResponse.json({
            error: 'Failed to update placement',
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await db.delete(placements).where(eq(placements.id, id));
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete placement' }, { status: 500 });
    }
}
