// ─── AI Model ────────────────────────────────────────────────────────────────
export const AI_MODEL = 'gemini-3-flash-preview';

// ─── Item Types (plants placed within zones) ─────────────────────────────────
export const ITEM_TYPES = ['plant', 'tree', 'pot', 'flower'] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const ITEM_EMOJI: Record<string, string> = {
    plant: '🌱',
    tree: '🌳',
    pot: '🪴',
    flower: '🌸',
    furniture: '🪑',
    water: '💧',
};

export function getItemEmoji(type: string): string {
    return ITEM_EMOJI[type] ?? '❓';
}

// ─── Zone Types (area categories) ────────────────────────────────────────────
export interface ZoneTypeConfig {
    id: string;
    label: string;
    icon: string;
    color: string;        // Tailwind button color classes (for ZoneTypeModal)
    style: {              // Leaflet / SVG fill style
        color: string;
        fillColor: string;
        fillOpacity: number;
    };
}

export const ZONE_TYPES: ZoneTypeConfig[] = [
    { id: 'planting', label: 'Planting Area', icon: '🌱', color: 'bg-green-100 hover:bg-green-200 border-green-300', style: { color: '#22c55e', fillColor: '#86efac', fillOpacity: 0.6 } },
    { id: 'tree', label: 'Tree', icon: '🌳', color: 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300', style: { color: '#10b981', fillColor: '#6ee7b7', fillOpacity: 0.6 } },
    { id: 'grass', label: 'Grass Field', icon: '🌿', color: 'bg-lime-100 hover:bg-lime-200 border-lime-300', style: { color: '#84cc16', fillColor: '#bef264', fillOpacity: 0.4 } },
    { id: 'pot', label: 'Pot', icon: '🪴', color: 'bg-orange-100 hover:bg-orange-200 border-orange-300', style: { color: '#f97316', fillColor: '#fdba74', fillOpacity: 0.8 } },
    { id: 'path', label: 'Walking Path', icon: '👣', color: 'bg-stone-100 hover:bg-stone-200 border-stone-300', style: { color: '#78716c', fillColor: '#d6d3d1', fillOpacity: 0.7 } },
    { id: 'building', label: 'Building', icon: '🏠', color: 'bg-slate-100 hover:bg-slate-200 border-slate-300', style: { color: '#475569', fillColor: '#94a3b8', fillOpacity: 0.8 } },
    { id: 'other', label: 'Other', icon: '❓', color: 'bg-gray-100 hover:bg-gray-200 border-gray-300', style: { color: '#3b82f6', fillColor: '#93c5fd', fillOpacity: 0.5 } },
];

export function getZoneConfig(type: string): ZoneTypeConfig {
    return ZONE_TYPES.find(z => z.id === type) ?? ZONE_TYPES[ZONE_TYPES.length - 1];
}

// ─── Month Names ─────────────────────────────────────────────────────────────
export const MONTH_NAMES = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;
