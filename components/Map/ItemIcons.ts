import L from 'leaflet';

export const getItemIcon = (type: string) => {
    let icon = '❓';
    let color = 'bg-gray-100';

    switch (type) {
        case 'tree': icon = '🌳'; color = 'bg-emerald-100 border-emerald-500'; break;
        case 'plant': icon = '🌱'; color = 'bg-green-100 border-green-500'; break;
        case 'pot': icon = '🪴'; color = 'bg-orange-100 border-orange-500'; break;
        case 'furniture': icon = '🪑'; color = 'bg-slate-100 border-slate-500'; break;
        case 'water': icon = '💧'; color = 'bg-blue-100 border-blue-500'; break;
    }

    return L.divIcon({
        html: `<div class="w-8 h-8 flex items-center justify-center text-xl rounded-full border-2 shadow-md ${color}">${icon}</div>`,
        className: 'bg-transparent',
        iconSize: [32, 32],
        iconAnchor: [16, 16] // Center
    });
};
