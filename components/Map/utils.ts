import { getZoneConfig } from '@/lib/constants';

export const getZoneStyle = (type: string) => {
    const config = getZoneConfig(type);
    return {
        color: config.style.color,
        icon: config.icon,
        style: config.style,
    };
};

export const calculateArea = (geoJson: any) => {
    if (!geoJson || geoJson.geometry.type !== 'Polygon') return 0;

    const coords = geoJson.geometry.coordinates[0];
    if (coords.length < 3) return 0;

    // Shoelace formula with planar approximation for small garden areas
    let sumLat = 0;
    coords.forEach((c: any) => sumLat += c[1]);
    const avgLat = sumLat / coords.length;

    const latScaling = 111320;
    const lngScaling = 111320 * Math.cos(avgLat * Math.PI / 180);

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
