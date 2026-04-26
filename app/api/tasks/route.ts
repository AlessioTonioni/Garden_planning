import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks, zones } from '@/lib/db/schema';

export async function GET() {
    try {
        const allTasks = await db.select().from(tasks);
        const allZones = await db.select({ id: zones.id, name: zones.name }).from(zones);
        const zoneMap = new Map(allZones.map(z => [z.id, z.name]));

        const result = allTasks
            .map(t => ({ ...t, zoneName: t.zoneId ? (zoneMap.get(t.zoneId) || null) : null }))
            .sort((a, b) => {
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            });

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description, dueDate, zoneId, placementId, placementLabel, recurrence } = body;

        if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

        const [newTask] = await db.insert(tasks).values({
            title,
            description: description || null,
            dueDate: dueDate ? new Date(dueDate) : null,
            zoneId: zoneId || null,
            placementId: placementId || null,
            placementLabel: placementLabel || null,
            recurrence: recurrence || null,
        }).returning();

        return NextResponse.json(newTask);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }
}
