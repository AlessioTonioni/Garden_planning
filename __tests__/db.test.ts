/**
 * Stage 1 smoke tests — verifies the Drizzle DB layer connects and
 * basic CRUD works against an in-memory SQLite database.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import * as schema from '../lib/db/schema';
import { zones, placements, seeds, seedlings } from '../lib/db/schema';

function createTestDb() {
    const sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');
    const db = drizzle(sqlite, { schema });

    // Create tables
    sqlite.exec(`
        CREATE TABLE IF NOT EXISTS "Zone" (
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
        CREATE TABLE IF NOT EXISTS "Placement" (
            id text PRIMARY KEY NOT NULL,
            createdAt integer NOT NULL,
            updatedAt integer NOT NULL,
            zoneId text NOT NULL REFERENCES "Zone"(id) ON DELETE CASCADE,
            type text NOT NULL,
            lat real NOT NULL,
            lng real NOT NULL,
            metadata text NOT NULL DEFAULT '{}'
        );
        CREATE TABLE IF NOT EXISTS "Seed" (
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
        CREATE TABLE IF NOT EXISTS "Seedling" (
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

describe('DB layer', () => {
    let db: ReturnType<typeof createTestDb>;

    beforeAll(() => {
        db = createTestDb();
    });

    it('inserts and reads a zone', async () => {
        const [zone] = await db.insert(zones).values({
            geoJson: '{"type":"Polygon"}',
            type: 'field',
            name: 'Test Field',
        }).returning();

        expect(zone.id).toBeTruthy();
        expect(zone.name).toBe('Test Field');
        expect(zone.createdAt).toBeInstanceOf(Date);
    });

    it('inserts a placement linked to a zone and cascades on delete', async () => {
        const [zone] = await db.insert(zones).values({
            geoJson: '{}',
            type: 'pot',
        }).returning();

        await db.insert(placements).values({
            zoneId: zone.id,
            type: 'plant',
            lat: 10.0,
            lng: 20.0,
        });

        const before = await db.select().from(placements).where(eq(placements.zoneId, zone.id));
        expect(before).toHaveLength(1);

        await db.delete(zones).where(eq(zones.id, zone.id));

        const after = await db.select().from(placements).where(eq(placements.zoneId, zone.id));
        expect(after).toHaveLength(0);
    });

    it('inserts and reads a seed with seedlings', async () => {
        const [seed] = await db.insert(seeds).values({
            species: 'Tomato',
            packetQuantity: 50,
            seedingStart: 3,
            seedingEnd: 5,
        }).returning();

        expect(seed.id).toBeTruthy();
        expect(seed.species).toBe('Tomato');
        expect(seed.packetQuantity).toBe(50);

        const [seedling] = await db.insert(seedlings).values({
            seedId: seed.id,
            quantity: 5,
            status: 'seeded',
        }).returning();

        expect(seedling.seedId).toBe(seed.id);
        expect(seedling.status).toBe('seeded');
    });

    it('cascades seedling deletion when seed is deleted', async () => {
        const [seed] = await db.insert(seeds).values({
            species: 'Basil',
            packetQuantity: 20,
        }).returning();

        await db.insert(seedlings).values({ seedId: seed.id, quantity: 3 });

        await db.delete(seeds).where(eq(seeds.id, seed.id));

        const remaining = await db.select().from(seedlings).where(eq(seedlings.seedId, seed.id));
        expect(remaining).toHaveLength(0);
    });
});
