export interface Seed {
    id: string;
    species: string;
    packetQuantity: number;
    acquiredAt: string;
    expiryDate: string | null;
    notes: string | null;
    seedingStart: number | null;
    seedingEnd: number | null;
    harvestingStart: number | null;
    harvestingEnd: number | null;
    seedlings: Seedling[];
}

export type SeedlingStatus = 'seeded' | 'sprouted' | 'transplanted' | 'failed';

export interface Seedling {
    id: string;
    seedId: string;
    quantity: number;
    seededAt: string;
    expectedSproutAt: string | null;
    sproutedAt: string | null;
    transplantedAt: string | null;
    location: string | null;
    status: SeedlingStatus;
    sproutedQuantity: number | null;
    transplantedQuantity: number | null;
    notes: string | null;
    seed?: Seed;
}

export interface Zone {
    id: string;
    name: string;
    type: string;
    geoJson: any;
    notes: string | null;
    placements: Placement[];
}

export interface Placement {
    id: string;
    zoneId: string;
    type: string;
    lat: number;
    lng: number;
    metadata: any;
    zone?: Zone;
}
