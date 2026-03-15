/**
 * Stage 2 tests — zones and placements API route logic against in-memory SQLite.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import * as schema from '../lib/db/schema';
import { zones, placements, seeds, seedlings } from '../lib/db/schema';

function createTestDb() {
    const sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');
    const db = drizzle(sqlite, { schema });
    sqlite.exec(`
        CREATE TABLE "Zone" (
            id text PRIMARY KEY NOT NULL,
            createdAt integer NOT NULL,
            updatedAt integer NOT NULL,
            geoJson text NOT NULL,
            type text NOT NULL,
            name text,
            notes text,
            lastWateredAt integer,
            lastFertilizedAt integer
        );
        CREATE TABLE "Placement" (
            id text PRIMARY KEY NOT NULL,
            createdAt integer NOT NULL,
            updatedAt integer NOT NULL,
            zoneId text NOT NULL REFERENCES "Zone"(id) ON DELETE CASCADE,
            type text NOT NULL,
            lat real NOT NULL,
            lng real NOT NULL,
            metadata text NOT NULL DEFAULT '{}'
        );
        CREATE TABLE "Seed" (
            id text PRIMARY KEY NOT NULL,
            createdAt integer NOT NULL,
            updatedAt integer NOT NULL,
            species text NOT NULL,
            packetQuantity integer NOT NULL DEFAULT 0,
            acquiredAt integer NOT NULL,
            expiryDate integer,
            notes text,
            seedingStart integer,
            seedingEnd integer,
            harvestingStart integer,
            harvestingEnd integer
        );
        CREATE TABLE "Seedling" (
            id text PRIMARY KEY NOT NULL,
            createdAt integer NOT NULL,
            updatedAt integer NOT NULL,
            seedId text NOT NULL REFERENCES "Seed"(id) ON DELETE CASCADE,
            quantity integer NOT NULL DEFAULT 1,
            seededAt integer NOT NULL,
            expectedSproutAt integer,
            sproutedAt integer,
            transplantedAt integer,
            location text,
            status text NOT NULL DEFAULT 'seeded',
            notes text
        );
    `);
    return db;
}

describe('Zones API logic', () => {
    let db: ReturnType<typeof createTestDb>;

    beforeEach(() => { db = createTestDb(); });

    it('GET returns zones with nested placements', async () => {
        const [zone] = await db.insert(zones).values({ geoJson: '{}', type: 'field', name: 'Field A' }).returning();
        await db.insert(placements).values({ zoneId: zone.id, type: 'plant', lat: 1, lng: 2 });

        const allZones = await db.select().from(zones);
        const allPlacements = await db.select().from(placements);
        const result = allZones.map(z => ({ ...z, placements: allPlacements.filter(p => p.zoneId === z.id) }));

        expect(result).toHaveLength(1);
        expect(result[0].placements).toHaveLength(1);
        expect(result[0].placements[0].type).toBe('plant');
    });

    it('POST creates a zone and returns it with an id', async () => {
        const [zone] = await db.insert(zones).values({
            geoJson: JSON.stringify({ type: 'Polygon' }),
            type: 'field',
            name: 'Test Zone',
        }).returning();

        expect(zone.id).toBeTruthy();
        expect(zone.name).toBe('Test Zone');
        expect(zone.createdAt).toBeInstanceOf(Date);
    });

    it('DELETE removes a zone and cascades to placements', async () => {
        const [zone] = await db.insert(zones).values({ geoJson: '{}', type: 'field' }).returning();
        await db.insert(placements).values({ zoneId: zone.id, type: 'plant', lat: 0, lng: 0 });

        await db.delete(zones).where(eq(zones.id, zone.id));

        const remaining = await db.select().from(placements).where(eq(placements.zoneId, zone.id));
        expect(remaining).toHaveLength(0);
    });

    it('PUT updates only provided fields, leaves others unchanged', async () => {
        const [zone] = await db.insert(zones).values({ geoJson: '{}', type: 'field', name: 'Old Name' }).returning();

        const [updated] = await db.update(zones)
            .set({ name: 'New Name', updatedAt: new Date() })
            .where(eq(zones.id, zone.id))
            .returning();

        expect(updated.name).toBe('New Name');
        expect(updated.type).toBe('field'); // unchanged
        expect(updated.updatedAt).toBeInstanceOf(Date);
    });

    it('PUT handles lastWateredAt date conversion', async () => {
        const [zone] = await db.insert(zones).values({ geoJson: '{}', type: 'field' }).returning();
        const waterDate = new Date('2026-03-01T12:00:00.000Z');

        const [updated] = await db.update(zones)
            .set({ lastWateredAt: waterDate, updatedAt: new Date() })
            .where(eq(zones.id, zone.id))
            .returning();

        expect(updated.lastWateredAt).toBeInstanceOf(Date);
        expect(updated.lastWateredAt!.toISOString()).toBe(waterDate.toISOString());
    });
});

describe('Placements API logic', () => {
    let db: ReturnType<typeof createTestDb>;
    let zoneId: string;

    beforeEach(async () => {
        db = createTestDb();
        const [zone] = await db.insert(zones).values({ geoJson: '{}', type: 'field' }).returning();
        zoneId = zone.id;
    });

    it('POST creates a placement', async () => {
        const [p] = await db.insert(placements).values({
            zoneId,
            type: 'plant',
            lat: 10.5,
            lng: 20.5,
            metadata: JSON.stringify({ species: 'Tomato' }),
        }).returning();

        expect(p.id).toBeTruthy();
        expect(p.lat).toBe(10.5);
        expect(p.metadata).toBe('{"species":"Tomato"}');
    });

    it('PUT updates lat/lng and metadata', async () => {
        const [p] = await db.insert(placements).values({ zoneId, type: 'plant', lat: 1, lng: 2 }).returning();

        const [updated] = await db.update(placements)
            .set({ lat: 99, lng: 88, metadata: JSON.stringify({ species: 'Basil' }), updatedAt: new Date() })
            .where(eq(placements.id, p.id))
            .returning();

        expect(updated.lat).toBe(99);
        expect(updated.metadata).toBe('{"species":"Basil"}');
    });

    it('DELETE removes a placement', async () => {
        const [p] = await db.insert(placements).values({ zoneId, type: 'tree', lat: 0, lng: 0 }).returning();
        await db.delete(placements).where(eq(placements.id, p.id));
        const remaining = await db.select().from(placements).where(eq(placements.id, p.id));
        expect(remaining).toHaveLength(0);
    });
});

describe('Restore logic', () => {
    let db: ReturnType<typeof createTestDb>;

    beforeEach(() => { db = createTestDb(); });

    it('restores zones with nested placements in a transaction', () => {
        const zonesData = [
            {
                geoJson: '{"type":"Polygon"}',
                type: 'field',
                name: 'Restored Field',
                notes: null,
                placements: [{ type: 'plant', lat: 5, lng: 6, metadata: '{}' }],
            },
        ];

        db.transaction((tx) => {
            tx.delete(zones).run();
            for (const zone of zonesData) {
                const [created] = tx.insert(zones).values({
                    geoJson: zone.geoJson, type: zone.type, name: zone.name, notes: zone.notes,
                }).returning().all();
                if (zone.placements?.length) {
                    tx.insert(placements).values(
                        zone.placements.map(p => ({ zoneId: created.id, ...p }))
                    ).run();
                }
            }
        });

        const allZones = db.select().from(zones).all();
        const allPlacements = db.select().from(placements).all();
        expect(allZones).toHaveLength(1);
        expect(allZones[0].name).toBe('Restored Field');
        expect(allPlacements).toHaveLength(1);
    });

    it('restores seeds with nested seedlings in a transaction', () => {
        const seedsData = [
            {
                species: 'Pepper',
                packetQuantity: 30,
                acquiredAt: new Date().toISOString(),
                expiryDate: null,
                notes: null,
                seedingStart: 2, seedingEnd: 4, harvestingStart: 7, harvestingEnd: 9,
                seedlings: [
                    { quantity: 10, seededAt: new Date().toISOString(), status: 'sprouted', location: 'Tray A', expectedSproutAt: null, sproutedAt: null, transplantedAt: null, notes: null },
                ],
            },
        ];

        db.transaction((tx) => {
            tx.delete(seeds).run();
            for (const seed of seedsData) {
                const [created] = tx.insert(seeds).values({
                    species: seed.species,
                    packetQuantity: seed.packetQuantity,
                    acquiredAt: new Date(seed.acquiredAt),
                    expiryDate: null,
                    notes: null,
                    seedingStart: seed.seedingStart,
                    seedingEnd: seed.seedingEnd,
                    harvestingStart: seed.harvestingStart,
                    harvestingEnd: seed.harvestingEnd,
                }).returning().all();
                if (seed.seedlings?.length) {
                    tx.insert(seedlings).values(
                        seed.seedlings.map(sl => ({
                            seedId: created.id,
                            quantity: sl.quantity,
                            seededAt: new Date(sl.seededAt),
                            status: sl.status,
                            location: sl.location,
                        }))
                    ).run();
                }
            }
        });

        const allSeeds = db.select().from(seeds).all();
        const allSeedlings = db.select().from(seedlings).all();
        expect(allSeeds).toHaveLength(1);
        expect(allSeeds[0].species).toBe('Pepper');
        expect(allSeedlings).toHaveLength(1);
        expect(allSeedlings[0].status).toBe('sprouted');
    });
});
