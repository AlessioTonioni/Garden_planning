/**
 * Stage 3 tests — seeds and seedlings API route logic against in-memory SQLite.
 * Focuses on transaction correctness and packetQuantity accounting.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq, sql } from 'drizzle-orm';
import * as schema from '../lib/db/schema';
import { seeds, seedlings } from '../lib/db/schema';

function createTestDb() {
    const sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');
    const db = drizzle(sqlite, { schema });
    sqlite.exec(`
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

describe('Seeds API logic', () => {
    let db: ReturnType<typeof createTestDb>;

    beforeEach(() => { db = createTestDb(); });

    it('GET returns seeds with nested seedlings', async () => {
        const [seed] = await db.insert(seeds).values({ species: 'Tomato', packetQuantity: 50 }).returning();
        await db.insert(seedlings).values({ seedId: seed.id, quantity: 5 });

        const allSeeds = await db.select().from(seeds);
        const allSeedlings = await db.select().from(seedlings);
        const result = allSeeds.map(s => ({ ...s, seedlings: allSeedlings.filter(sl => sl.seedId === s.id) }));

        expect(result[0].seedlings).toHaveLength(1);
        expect(result[0].seedlings[0].quantity).toBe(5);
    });

    it('POST creates a seed with phenological data', async () => {
        const [seed] = await db.insert(seeds).values({
            species: 'Basil',
            packetQuantity: 100,
            seedingStart: 3,
            seedingEnd: 5,
            harvestingStart: 6,
            harvestingEnd: 9,
        }).returning();

        expect(seed.species).toBe('Basil');
        expect(seed.seedingStart).toBe(3);
        expect(seed.harvestingEnd).toBe(9);
    });

    it('PATCH updates only provided fields', async () => {
        const [seed] = await db.insert(seeds).values({ species: 'Old Name', packetQuantity: 10 }).returning();

        const updateData: Partial<typeof seeds.$inferInsert> = { updatedAt: new Date(), species: 'New Name' };
        const [updated] = await db.update(seeds).set(updateData).where(eq(seeds.id, seed.id)).returning();

        expect(updated.species).toBe('New Name');
        expect(updated.packetQuantity).toBe(10); // unchanged
    });

    it('PATCH can nullify expiryDate', async () => {
        const [seed] = await db.insert(seeds).values({
            species: 'Pepper',
            packetQuantity: 20,
            expiryDate: new Date('2027-01-01'),
        }).returning();

        const [updated] = await db.update(seeds)
            .set({ expiryDate: null, updatedAt: new Date() })
            .where(eq(seeds.id, seed.id))
            .returning();

        expect(updated.expiryDate).toBeNull();
    });

    it('DELETE removes seed and cascades to seedlings', async () => {
        const [seed] = await db.insert(seeds).values({ species: 'Lettuce', packetQuantity: 30 }).returning();
        await db.insert(seedlings).values({ seedId: seed.id, quantity: 3 });

        await db.delete(seeds).where(eq(seeds.id, seed.id));

        const remaining = await db.select().from(seedlings).where(eq(seedlings.seedId, seed.id));
        expect(remaining).toHaveLength(0);
    });
});

describe('Seedlings API logic — transaction correctness', () => {
    let db: ReturnType<typeof createTestDb>;
    let seedId: string;
    const INITIAL_QTY = 50;

    beforeEach(async () => {
        db = createTestDb();
        const [seed] = await db.insert(seeds).values({ species: 'Tomato', packetQuantity: INITIAL_QTY }).returning();
        seedId = seed.id;
    });

    it('POST creates seedling and decrements packetQuantity atomically', () => {
        const qty = 5;
        const newSeedling = db.transaction((tx) => {
            const [seedling] = tx.insert(seedlings).values({
                seedId, quantity: qty, status: 'seeded',
            }).returning().all();
            tx.update(seeds)
                .set({ packetQuantity: sql`${seeds.packetQuantity} - ${qty}`, updatedAt: new Date() })
                .where(eq(seeds.id, seedId)).run();
            const [s] = tx.select().from(seeds).where(eq(seeds.id, seedId)).all();
            return { ...seedling, seed: s };
        });

        expect(newSeedling.quantity).toBe(qty);
        expect(newSeedling.seed.packetQuantity).toBe(INITIAL_QTY - qty);
    });

    it('DELETE restores packetQuantity atomically', async () => {
        const [seedling] = await db.insert(seedlings).values({ seedId, quantity: 8 }).returning();
        // Simulate decrement that happened on creation
        await db.update(seeds).set({ packetQuantity: INITIAL_QTY - 8, updatedAt: new Date() }).where(eq(seeds.id, seedId));

        db.transaction((tx) => {
            const [sl] = tx.select({ quantity: seedlings.quantity, seedId: seedlings.seedId })
                .from(seedlings).where(eq(seedlings.id, seedling.id)).all();
            if (sl) {
                tx.update(seeds)
                    .set({ packetQuantity: sql`${seeds.packetQuantity} + ${sl.quantity}`, updatedAt: new Date() })
                    .where(eq(seeds.id, sl.seedId)).run();
                tx.delete(seedlings).where(eq(seedlings.id, seedling.id)).run();
            }
        });

        const [seed] = await db.select().from(seeds).where(eq(seeds.id, seedId));
        expect(seed.packetQuantity).toBe(INITIAL_QTY); // restored
        const remaining = await db.select().from(seedlings).where(eq(seedlings.id, seedling.id));
        expect(remaining).toHaveLength(0);
    });

    it('PATCH adjusts packetQuantity when quantity changes', async () => {
        const [seedling] = await db.insert(seedlings).values({ seedId, quantity: 5 }).returning();
        await db.update(seeds).set({ packetQuantity: INITIAL_QTY - 5, updatedAt: new Date() }).where(eq(seeds.id, seedId));

        // Change quantity from 5 → 10 (diff = +5, should decrement 5 more from packet)
        db.transaction((tx) => {
            const [old] = tx.select({ quantity: seedlings.quantity, seedId: seedlings.seedId })
                .from(seedlings).where(eq(seedlings.id, seedling.id)).all();
            const newQty = 10;
            const diff = newQty - old.quantity; // 5
            tx.update(seedlings).set({ quantity: newQty, updatedAt: new Date() })
                .where(eq(seedlings.id, seedling.id)).run();
            tx.update(seeds)
                .set({ packetQuantity: sql`${seeds.packetQuantity} - ${diff}`, updatedAt: new Date() })
                .where(eq(seeds.id, old.seedId)).run();
        });

        const [seed] = await db.select().from(seeds).where(eq(seeds.id, seedId));
        expect(seed.packetQuantity).toBe(INITIAL_QTY - 10); // 40
    });

    it('PATCH does not adjust packetQuantity when quantity unchanged', async () => {
        const [seedling] = await db.insert(seedlings).values({ seedId, quantity: 5 }).returning();
        await db.update(seeds).set({ packetQuantity: INITIAL_QTY - 5, updatedAt: new Date() }).where(eq(seeds.id, seedId));

        // Only update status, not quantity
        await db.update(seedlings).set({ status: 'sprouted', updatedAt: new Date() }).where(eq(seedlings.id, seedling.id));

        const [seed] = await db.select().from(seeds).where(eq(seeds.id, seedId));
        expect(seed.packetQuantity).toBe(INITIAL_QTY - 5); // unchanged
    });
});
