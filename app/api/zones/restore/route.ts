import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { zones } = body;

        if (!Array.isArray(zones)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        // Transaction: Delete all existing, then create new
        // Note: In SQLite, Prisma transactions are sequential.
        await prisma.$transaction(async (tx) => {
            await tx.zone.deleteMany({});

            for (const zone of zones) {
                // Remove ID to let DB generate new ones, or keep if we want strict restore?
                // Usually simpler to generate new IDs to avoid conflicts if we mix logic, 
                // but for a full restore we might want to keep IDs if they are referenced elsewhere.
                // For now, let's keep it simple: Create new entries matching the data.
                await tx.zone.create({
                    data: {
                        geoJson: zone.geoJson,
                        type: zone.type,
                        name: zone.name,
                        notes: zone.notes,
                        placements: {
                            create: zone.placements?.map((p: any) => ({
                                type: p.type,
                                lat: p.lat,
                                lng: p.lng,
                                metadata: p.metadata
                            })) || []
                        }
                    }
                });
            }
        });

        return NextResponse.json({ success: true, count: zones.length });
    } catch (error) {
        console.error('Restore failed:', error);
        return NextResponse.json({ error: 'Failed to restore backup' }, { status: 500 });
    }
}
