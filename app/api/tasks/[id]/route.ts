import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';

function advanceDueDate(current: Date | null, recurrence: string): Date {
    const base = current && new Date(current) > new Date() ? new Date(current) : new Date();
    switch (recurrence) {
        case 'daily':   base.setDate(base.getDate() + 1); break;
        case 'weekly':  base.setDate(base.getDate() + 7); break;
        case 'monthly': base.setMonth(base.getMonth() + 1); break;
        case 'yearly':  base.setFullYear(base.getFullYear() + 1); break;
    }
    return base;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();

        const [existing] = await db.select().from(tasks).where(eq(tasks.id, id));
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (body.action === 'complete') {
            const update = existing.recurrence
                ? {
                    lastCompletedAt: new Date(),
                    dueDate: advanceDueDate(existing.dueDate, existing.recurrence),
                    updatedAt: new Date(),
                }
                : {
                    status: 'done',
                    lastCompletedAt: new Date(),
                    updatedAt: new Date(),
                };
            const [updated] = await db.update(tasks).set(update).where(eq(tasks.id, id)).returning();
            return NextResponse.json(updated);
        }

        const updateData: Partial<typeof tasks.$inferInsert> = { updatedAt: new Date() };
        if (body.title !== undefined)          updateData.title = body.title;
        if (body.description !== undefined)    updateData.description = body.description;
        if (body.status !== undefined)         updateData.status = body.status;
        if (body.dueDate !== undefined)        updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
        if (body.zoneId !== undefined)         updateData.zoneId = body.zoneId;
        if (body.placementId !== undefined)    updateData.placementId = body.placementId;
        if (body.placementLabel !== undefined) updateData.placementLabel = body.placementLabel;
        if (body.recurrence !== undefined)     updateData.recurrence = body.recurrence;

        const [updated] = await db.update(tasks).set(updateData).where(eq(tasks.id, id)).returning();
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await db.delete(tasks).where(eq(tasks.id, id));
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }
}
