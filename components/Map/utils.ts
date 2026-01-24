export const getZoneStyle = (type: string) => {
    switch (type) {
        case 'planting':
            return { color: '#00aa00', icon: '🌱', style: { color: '#22c55e', fillColor: '#86efac', fillOpacity: 0.6 } }; // Green
        case 'tree':
            return { color: '#006600', icon: '🌳', style: { color: '#10b981', fillColor: '#6ee7b7', fillOpacity: 0.6 } }; // Emerald
        case 'grass':
            return { color: '#88cc00', icon: '🌿', style: { color: '#84cc16', fillColor: '#bef264', fillOpacity: 0.4 } }; // Lime
        case 'pot':
            return { color: '#cc6600', icon: '🪴', style: { color: '#f97316', fillColor: '#fdba74', fillOpacity: 0.8 } }; // Orange
        case 'path':
            return { color: '#888888', icon: '👣', style: { color: '#78716c', fillColor: '#d6d3d1', fillOpacity: 0.7 } }; // Stone
        case 'building':
            return { color: '#444444', icon: '🏠', style: { color: '#475569', fillColor: '#94a3b8', fillOpacity: 0.8 } }; // Slate
        default:
            return { color: '#3388ff', icon: '❓', style: { color: '#3b82f6', fillColor: '#93c5fd', fillOpacity: 0.5 } }; // Blue
    }
};
