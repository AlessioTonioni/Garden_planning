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

export const calculateArea = (geoJson: any) => {
    if (!geoJson || geoJson.geometry.type !== 'Polygon') return 0;

    const coords = geoJson.geometry.coordinates[0];
    if (coords.length < 3) return 0;

    // Use a simpler planar approximation for small garden areas
    // Reference: https://en.wikipedia.org/wiki/Shoelace_formula

    // Estimate center latitude to calculate longitude scaling factor
    let sumLat = 0;
    coords.forEach((c: any) => sumLat += c[1]);
    const avgLat = sumLat / coords.length;

    const latScaling = 111320; // Meters per degree latitude
    const lngScaling = 111320 * Math.cos(avgLat * Math.PI / 180); // Meters per degree longitude

    let area = 0;
    for (let i = 0; i < coords.length - 1; i++) {
        const x1 = coords[i][0] * lngScaling;
        const y1 = coords[i][1] * latScaling;
        const x2 = coords[i + 1][0] * lngScaling;
        const y2 = coords[i + 1][1] * latScaling;

        area += (x1 * y2) - (x2 * y1);
    }

    return Math.abs(area / 2);
};
