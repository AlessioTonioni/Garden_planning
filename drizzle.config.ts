import type { Config } from 'drizzle-kit';

const url = process.env.DATABASE_URL ?? 'file:./data/dev.db';
const dbPath = url.replace(/^file:/, '');

export default {
    schema: './lib/db/schema.ts',
    out: './drizzle',
    dialect: 'sqlite',
    dbCredentials: { url: dbPath },
} satisfies Config;
