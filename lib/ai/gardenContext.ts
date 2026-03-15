import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { zones, placements, seeds, seedlings } from "@/lib/db/schema";

export interface GardenContext {
    zones: any[];
    seedbed?: {
        seeds: any[];
        seedlings: any[];
    };
}

export async function getGardenContext(opts: {
    includePlanner: boolean,
    includeSeedbed: boolean,
    selectedZoneIds?: string[],
    selectedItemIds?: string[],
    selectedSeedIds?: string[]
}): Promise<GardenContext & { selectedSeeds?: any[] }> {
    // Fetch Planner Data
    let filteredZones: any[] = [];
    let filteredItems: any[] = [];

    if (opts.includePlanner || (opts.selectedZoneIds?.length ?? 0) > 0 || (opts.selectedItemIds?.length ?? 0) > 0) {
        const allZones = await db.select().from(zones);
        const items = await db.select().from(placements);

        filteredZones = allZones;
        filteredItems = items;

        if (opts.selectedZoneIds && opts.selectedZoneIds.length > 0) {
            filteredZones = allZones.filter((z: any) => opts.selectedZoneIds!.includes(z.id));
            filteredItems = items.filter((i: any) => opts.selectedZoneIds!.includes(i.zoneId));
        } else if (opts.selectedItemIds && opts.selectedItemIds.length > 0) {
            filteredItems = items.filter((i: any) => opts.selectedItemIds!.includes(i.id));
            const selectedParentZoneIds = Array.from(new Set(
                filteredItems.map((i: any) => i.zoneId).filter(Boolean)
            ));
            filteredZones = allZones.filter((z: any) => selectedParentZoneIds.includes(z.id));
        }
    }

    // Build a human-readable context (minimal data for the AI, no IDs/coords)
    const simplifiedZones = filteredZones.map((z: any) => {
        const zoneItems = filteredItems.filter((i: any) => i.zoneId === z.id);
        const plantList = zoneItems.map((i: any) => {
            const meta = typeof i.metadata === 'string' ? JSON.parse(i.metadata) : (i.metadata || {});
            const parts: string[] = [];
            if (meta.species) parts.push(meta.species);
            if (meta.variety) parts.push(`(${meta.variety})`);
            if (meta.quantity && meta.quantity > 1) parts.push(`x${meta.quantity}`);
            if (meta.datePlanted) parts.push(`planted ${meta.datePlanted}`);
            if (meta.notes) parts.push(`- ${meta.notes}`);
            return parts.length > 0 ? parts.join(' ') : i.type;
        });

        return {
            name: z.name || 'Unnamed Zone',
            area: z.area ? `${z.area.toFixed(1)} m²` : undefined,
            lastWatered: z.lastWateredAt ? new Date(z.lastWateredAt).toLocaleDateString() : undefined,
            lastFertilized: z.lastFertilizedAt ? new Date(z.lastFertilizedAt).toLocaleDateString() : undefined,
            plants: plantList.length > 0 ? plantList : ['(empty)']
        };
    });

    let seedbedData = undefined;

    if (opts.includeSeedbed) {
        const allSeeds = await db.select().from(seeds);
        const allSeedlings = await db.select().from(seedlings);
        const seedsById = new Map(allSeeds.map(s => [s.id, s]));

        seedbedData = {
            seeds: allSeeds.map((s: any) => ({
                species: s.species,
                packetQuantity: s.packetQuantity,
                notes: s.notes
            })),
            seedlings: allSeedlings.map((sl: any) => ({
                species: seedsById.get(sl.seedId)?.species || 'Unknown',
                status: sl.status,
                seededAt: sl.seededAt ? new Date(sl.seededAt).toLocaleDateString() : undefined
            }))
        };
    }

    let selectedSeedsData = undefined;
    if (opts.selectedSeedIds && opts.selectedSeedIds.length > 0) {
        const selectedSeeds = await db.select().from(seeds)
            .where(inArray(seeds.id, opts.selectedSeedIds));
        selectedSeedsData = selectedSeeds.map((s: any) => ({
            species: s.species,
            packetQuantity: s.packetQuantity,
            notes: s.notes,
            seedingPeriod: (s.seedingStart && s.seedingEnd) ? `${s.seedingStart} to ${s.seedingEnd}` : 'Not set',
            harvestingPeriod: (s.harvestingStart && s.harvestingEnd) ? `${s.harvestingStart} to ${s.harvestingEnd}` : 'Not set'
        }));
    }

    return {
        zones: simplifiedZones,
        seedbed: seedbedData,
        selectedSeeds: selectedSeedsData
    };
}
