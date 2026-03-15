import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { zones, placements } from '@/lib/db/schema';

export async function GET() {
    try {
        const allZones = await db.select().from(zones);
        const allPlacements = await db.select().from(placements);
        const result = allZones.map(z => ({
            ...z,
            placements: allPlacements.filter(p => p.zoneId === z.id)
        }));
        return NextResponse.json(result);
    } catch (error) {
        console.error('Check failed:', error);
        return NextResponse.json({ error: 'Failed to fetch zones' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { geoJson, type, name, notes } = body;

        if (!geoJson || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const [newZone] = await db.insert(zones).values({
            geoJson: JSON.stringify(geoJson),
            type,
            name: name || 'Unnamed Zone',
            notes
        }).returning();

        return NextResponse.json(newZone);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create zone' }, { status: 500 });
    }
}
