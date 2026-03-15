import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const globalForDb = global as unknown as { db: ReturnType<typeof drizzle> };

function createDb() {
    const url = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
    // Strip the "file:" prefix that Prisma uses — better-sqlite3 needs a plain path
    const dbPath = url.replace(/^file:/, '');

    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');
    sqlite.pragma('synchronous = NORMAL');
    sqlite.pragma('cache_size = -2000'); // 2MB page cache

    return drizzle(sqlite, { schema });
}

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== 'production') globalForDb.db = db;
