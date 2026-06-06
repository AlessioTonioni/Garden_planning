import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

const now = () => new Date();

export const zones = sqliteTable('Zone', {
    id:               text('id').primaryKey().$defaultFn(() => createId()),
    createdAt:        integer('createdAt', { mode: 'timestamp' }).$defaultFn(now).notNull(),
    updatedAt:        integer('updatedAt', { mode: 'timestamp' }).$defaultFn(now).notNull(),
    geoJson:          text('geoJson').notNull(),
    type:             text('type').notNull(),
    name:             text('name'),
    notes:            text('notes'),
    lastWateredAt:    integer('lastWateredAt', { mode: 'timestamp' }),
    lastFertilizedAt: integer('lastFertilizedAt', { mode: 'timestamp' }),
});

export const placements = sqliteTable('Placement', {
    id:        text('id').primaryKey().$defaultFn(() => createId()),
    createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(now).notNull(),
    updatedAt: integer('updatedAt', { mode: 'timestamp' }).$defaultFn(now).notNull(),
    zoneId:    text('zoneId').notNull().references(() => zones.id, { onDelete: 'cascade' }),
    type:      text('type').notNull(),
    lat:       real('lat').notNull(),
    lng:       real('lng').notNull(),
    metadata:  text('metadata').notNull().default('{}'),
});

export const seeds = sqliteTable('Seed', {
    id:              text('id').primaryKey().$defaultFn(() => createId()),
    createdAt:       integer('createdAt', { mode: 'timestamp' }).$defaultFn(now).notNull(),
    updatedAt:       integer('updatedAt', { mode: 'timestamp' }).$defaultFn(now).notNull(),
    species:         text('species').notNull(),
    packetQuantity:  integer('packetQuantity').notNull().default(0),
    acquiredAt:      integer('acquiredAt', { mode: 'timestamp' }).$defaultFn(now).notNull(),
    expiryDate:      integer('expiryDate', { mode: 'timestamp' }),
    notes:           text('notes'),
    seedingStart:    integer('seedingStart'),
    seedingEnd:      integer('seedingEnd'),
    harvestingStart: integer('harvestingStart'),
    harvestingEnd:   integer('harvestingEnd'),
});

export const tasks = sqliteTable('Task', {
    id:              text('id').primaryKey().$defaultFn(() => createId()),
    createdAt:       integer('createdAt', { mode: 'timestamp' }).$defaultFn(now).notNull(),
    updatedAt:       integer('updatedAt', { mode: 'timestamp' }).$defaultFn(now).notNull(),
    title:           text('title').notNull(),
    description:     text('description'),
    status:          text('status').notNull().default('open'),
    dueDate:         integer('dueDate', { mode: 'timestamp' }),
    zoneId:          text('zoneId').references(() => zones.id, { onDelete: 'set null' }),
    placementId:     text('placementId'),
    placementLabel:  text('placementLabel'),
    recurrence:      text('recurrence'),
    lastCompletedAt: integer('lastCompletedAt', { mode: 'timestamp' }),
});

export const chatConversations = sqliteTable('ChatConversation', {
    id:            text('id').primaryKey().$defaultFn(() => createId()),
    createdAt:     integer('createdAt', { mode: 'timestamp' }).$defaultFn(now).notNull(),
    updatedAt:     integer('updatedAt', { mode: 'timestamp' }).$defaultFn(now).notNull(),
    title:         text('title').notNull(),
    messages:      text('messages').notNull().default('[]'),
    contextFilter: text('contextFilter').notNull().default('all'),
});

export const seedlings = sqliteTable('Seedling', {
    id:               text('id').primaryKey().$defaultFn(() => createId()),
    createdAt:        integer('createdAt', { mode: 'timestamp' }).$defaultFn(now).notNull(),
    updatedAt:        integer('updatedAt', { mode: 'timestamp' }).$defaultFn(now).notNull(),
    seedId:           text('seedId').notNull().references(() => seeds.id, { onDelete: 'cascade' }),
    quantity:         integer('quantity').notNull().default(1),
    seededAt:         integer('seededAt', { mode: 'timestamp' }).$defaultFn(now).notNull(),
    expectedSproutAt: integer('expectedSproutAt', { mode: 'timestamp' }),
    sproutedAt:       integer('sproutedAt', { mode: 'timestamp' }),
    transplantedAt:   integer('transplantedAt', { mode: 'timestamp' }),
    location:             text('location'),
    status:               text('status').notNull().default('seeded'),
    sproutedQuantity:     integer('sproutedQuantity'),
    transplantedQuantity: integer('transplantedQuantity'),
    photoPath:            text('photoPath'),
    notes:                text('notes'),
});
