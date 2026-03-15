import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { zones, placements, seeds, seedlings } from '@/lib/db/schema';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { zones: zonesData, seeds: seedsData } = body;

        if (!Array.isArray(zonesData)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        // better-sqlite3 transactions are synchronous — no async/await inside
        db.transaction((tx) => {
            // Restore zones and placements
            tx.delete(zones).run();
            for (const zone of zonesData) {
                const [createdZone] = tx.insert(zones).values({
                    geoJson: zone.geoJson,
                    type: zone.type,
                    name: zone.name,
                    notes: zone.notes,
                }).returning().all();

                if (zone.placements?.length) {
                    tx.insert(placements).values(
                        zone.placements.map((p: any) => ({
                            zoneId: createdZone.id,
                            type: p.type,
                            lat: p.lat,
                            lng: p.lng,
                            metadata: p.metadata ?? '{}',
                        }))
                    ).run();
                }
            }

            // Restore seeds and seedlings
            if (Array.isArray(seedsData)) {
                tx.delete(seeds).run();
                for (const seed of seedsData) {
                    const [createdSeed] = tx.insert(seeds).values({
                        species: seed.species,
                        packetQuantity: seed.packetQuantity,
                        acquiredAt: new Date(seed.acquiredAt),
                        expiryDate: seed.expiryDate ? new Date(seed.expiryDate) : null,
                        notes: seed.notes,
                        seedingStart: seed.seedingStart,
                        seedingEnd: seed.seedingEnd,
                        harvestingStart: seed.harvestingStart,
                        harvestingEnd: seed.harvestingEnd,
                    }).returning().all();

                    if (seed.seedlings?.length) {
                        tx.insert(seedlings).values(
                            seed.seedlings.map((sl: any) => ({
                                seedId: createdSeed.id,
                                quantity: sl.quantity,
                                seededAt: new Date(sl.seededAt),
                                expectedSproutAt: sl.expectedSproutAt ? new Date(sl.expectedSproutAt) : null,
                                sproutedAt: sl.sproutedAt ? new Date(sl.sproutedAt) : null,
                                transplantedAt: sl.transplantedAt ? new Date(sl.transplantedAt) : null,
                                location: sl.location,
                                status: sl.status,
                                notes: sl.notes,
                            }))
                        ).run();
                    }
                }
            }
        });

        return NextResponse.json({ success: true, zones: zonesData.length, seeds: seedsData?.length ?? 0 });
    } catch (error) {
        console.error('Restore failed:', error);
        return NextResponse.json({ error: 'Failed to restore backup' }, { status: 500 });
    }
}
