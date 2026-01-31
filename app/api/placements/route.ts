import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { zoneId, type, lat, lng, metadata } = body;

        if (!zoneId || !type || lat === undefined || lng === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const placement = await prisma.placement.create({
            data: {
                zoneId,
                type,
                lat,
                lng,
                metadata: JSON.stringify(metadata || {})
            }
        });

        return NextResponse.json(placement);
    } catch (error) {
        console.error('Failed to create placement:', error);
        return NextResponse.json({ error: 'Failed to create placement' }, { status: 500 });
    }
}
