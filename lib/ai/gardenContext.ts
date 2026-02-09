import { prisma } from "@/lib/prisma";

export interface GardenContext {
    zones: any[];
    seedbed?: {
        seeds: any[];
        seedlings: any[];
    };
}

export async function getGardenContext(opts: { includeSeedbed: boolean, selectedZoneId?: string | null, selectedItemId?: string | null }): Promise<GardenContext> {
    // Fetch Planner Data
    const zones = await prisma.zone.findMany();
    const items = await prisma.placement.findMany();

    // Filter based on selections if provided
    let filteredZones = zones;
    let filteredItems = items;

    if (opts.selectedZoneId) {
        filteredZones = zones.filter((z: any) => z.id === opts.selectedZoneId);
        filteredItems = items.filter((i: any) => i.zoneId === opts.selectedZoneId);
    } else if (opts.selectedItemId) {
        filteredItems = items.filter((i: any) => i.id === opts.selectedItemId);
        const item = items.find((i: any) => i.id === opts.selectedItemId);
        if (item) {
            filteredZones = zones.filter((z: any) => z.id === item.zoneId);
        } else {
            filteredZones = [];
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
        const seeds = await prisma.seed.findMany();
        const seedlings = await prisma.seedling.findMany({
            include: { seed: true }
        });

        seedbedData = {
            seeds: seeds.map((s: any) => ({
                species: s.species,
                packetQuantity: s.packetQuantity,
                notes: s.notes
            })),
            seedlings: seedlings.map((s: any) => ({
                species: s.seed?.species || 'Unknown',
                status: s.status,
                seededAt: s.seededAt ? new Date(s.seededAt).toLocaleDateString() : undefined
            }))
        };
    }

    return {
        zones: simplifiedZones,
        seedbed: seedbedData
    };
}
