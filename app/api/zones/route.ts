import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const zones = await prisma.zone.findMany({
            include: { placements: true }
        });
        return NextResponse.json(zones);
    } catch (error) {
        console.error('Check failed:', error);
        return NextResponse.json({ error: 'Failed to fetch zones' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { geoJson, type, name, notes } = body;

        // Basic validation
        if (!geoJson || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newZone = await prisma.zone.create({
            data: {
                geoJson: JSON.stringify(geoJson), // Ensure it's a string
                type,
                name: name || 'Unnamed Zone',
                notes
            }
        });

        return NextResponse.json(newZone);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create zone' }, { status: 500 });
    }
}
