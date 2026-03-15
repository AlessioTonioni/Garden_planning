import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { zones, seeds } = body;

        if (!Array.isArray(zones)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            // Restore zones and placements
            await tx.zone.deleteMany({});
            for (const zone of zones) {
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

            // Restore seeds and seedlings
            if (Array.isArray(seeds)) {
                await tx.seed.deleteMany({});
                for (const seed of seeds) {
                    await tx.seed.create({
                        data: {
                            species: seed.species,
                            packetQuantity: seed.packetQuantity,
                            acquiredAt: new Date(seed.acquiredAt),
                            expiryDate: seed.expiryDate ? new Date(seed.expiryDate) : null,
                            notes: seed.notes,
                            seedingStart: seed.seedingStart,
                            seedingEnd: seed.seedingEnd,
                            harvestingStart: seed.harvestingStart,
                            harvestingEnd: seed.harvestingEnd,
                            seedlings: {
                                create: seed.seedlings?.map((sl: any) => ({
                                    quantity: sl.quantity,
                                    seededAt: new Date(sl.seededAt),
                                    expectedSproutAt: sl.expectedSproutAt ? new Date(sl.expectedSproutAt) : null,
                                    sproutedAt: sl.sproutedAt ? new Date(sl.sproutedAt) : null,
                                    transplantedAt: sl.transplantedAt ? new Date(sl.transplantedAt) : null,
                                    location: sl.location,
                                    status: sl.status,
                                    notes: sl.notes,
                                })) || []
                            }
                        }
                    });
                }
            }
        });

        return NextResponse.json({ success: true, zones: zones.length, seeds: seeds?.length ?? 0 });
    } catch (error) {
        console.error('Restore failed:', error);
        return NextResponse.json({ error: 'Failed to restore backup' }, { status: 500 });
    }
}
