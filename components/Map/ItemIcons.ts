import L from 'leaflet';
import { getItemEmoji } from '@/lib/constants';

const ICON_COLORS: Record<string, string> = {
    tree: 'bg-emerald-100 border-emerald-500',
    plant: 'bg-green-100 border-green-500',
    pot: 'bg-orange-100 border-orange-500',
    flower: 'bg-pink-100 border-pink-500',
    furniture: 'bg-slate-100 border-slate-500',
    water: 'bg-blue-100 border-blue-500',
};

export const getItemIcon = (type: string) => {
    const emoji = getItemEmoji(type);
    const color = ICON_COLORS[type] ?? 'bg-gray-100';

    return L.divIcon({
        html: `<div class="w-8 h-8 flex items-center justify-center text-xl rounded-full border-2 shadow-md ${color}">${emoji}</div>`,
        className: 'bg-transparent',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
};
